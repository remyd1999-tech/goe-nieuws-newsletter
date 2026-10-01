import type {
  BodyBlock,
  FramedTitleBlock,
  NewsletterDraft,
  Section,
} from "@/lib/types";
import {
  DEFAULT_FRAMED_BORDER,
  DEFAULT_FRAMED_BOX_HEIGHT,
  DEFAULT_FRAMED_BOX_WIDTH,
  defaultFrameBorder,
  defaultSpacing,
  emptyFooter,
} from "@/lib/types";

/** Bump when NewsletterDraft shape changes incompatibly. */
const STORAGE_KEY = "goe-nieuws:draft:v1";

export function loadDraft(): NewsletterDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseDraftJson(raw);
  } catch {
    return null;
  }
}

export function saveDraft(
  draft: NewsletterDraft,
): { ok: true } | { ok: false; error: string } {
  if (typeof window === "undefined") {
    return { ok: false, error: "Storage unavailable." };
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not save — storage may be full (large images?).",
    };
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function parseDraftJson(raw: string): NewsletterDraft | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidDraft(parsed)) return null;
    return migrateDraft(parsed);
  } catch {
    return null;
  }
}

export function draftToJson(draft: NewsletterDraft): string {
  return JSON.stringify(draft, null, 2);
}

export function downloadDraftJson(draft: NewsletterDraft): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([draftToJson(draft)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = draftFilename(draft);
  anchor.click();
  URL.revokeObjectURL(url);
}

function draftFilename(draft: NewsletterDraft): string {
  const slug =
    draft.subject
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "draft";
  return `goe-nieuws-${slug}.json`;
}

function isValidDraft(value: unknown): value is NewsletterDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;
  return typeof draft.subject === "string" && Array.isArray(draft.sections);
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}`;
}

function migrateFramedTitle(block: FramedTitleBlock): FramedTitleBlock {
  const borderWidth =
    block.borderWidth ?? block.width ?? DEFAULT_FRAMED_BORDER;
  const boxWidth = block.boxWidth ?? DEFAULT_FRAMED_BOX_WIDTH;
  const boxHeight =
    block.boxHeight ?? block.height ?? DEFAULT_FRAMED_BOX_HEIGHT;
  const { width: _w, height: _h, ...rest } = block;
  return {
    ...rest,
    borderWidth,
    boxWidth,
    boxHeight,
  };
}

/** Turn legacy dividerAfter / footer blob / framed width into current shape. */
function migrateDraft(draft: NewsletterDraft): NewsletterDraft {
  const dividerGap = draft.spacing?.divider ?? defaultSpacing.divider;
  let next: NewsletterDraft = {
    ...draft,
    dividerSrc: draft.dividerSrc || "/assets/divider-dots.png",
    spacing: { ...defaultSpacing, ...draft.spacing },
    frameBorder: { ...defaultFrameBorder, ...draft.frameBorder },
  };

  const sections: Section[] = next.sections.map((section) => {
    let blocks = section.blocks.map((block) => {
      if (block.type === "framedTitle") return migrateFramedTitle(block);
      if (block.type === "footerBar") {
        const drop = new Set(["facebook", "website"]);
        let links = block.links.filter(
          (l) => !drop.has(l.label.trim().toLowerCase()),
        );
        links = links.map((l) =>
          l.label.trim().toLowerCase() === "instagram" && !l.href.trim()
            ? {
                ...l,
                href: "https://www.instagram.com/goe.nieuws/",
              }
            : l,
        );
        const hasUnsub = links.some(
          (l) => l.label.trim().toLowerCase() === "unsubscribe",
        );
        if (!hasUnsub) {
          links = [...links, { label: "Unsubscribe", href: "" }];
        }
        return { ...block, links };
      }
      // Old Figma insets → inherit global padX like text
      if (
        block.type === "divider" &&
        block.spacing?.left === 19 &&
        block.spacing?.right === 19
      ) {
        const { left: _l, right: _r, ...rest } = block.spacing;
        return { ...block, spacing: rest };
      }
      if (
        block.type === "tagline" &&
        block.spacing?.left === 9 &&
        block.spacing?.right === 9
      ) {
        const { left: _l, right: _r, ...rest } = block.spacing;
        return { ...block, spacing: rest };
      }
      return block;
    });

    if (section.dividerAfter) {
      const alreadyHasDivider = blocks.some((b) => b.type === "divider");
      if (!alreadyHasDivider) {
        const divider: BodyBlock = {
          id: newId(`div-${section.id}`),
          type: "divider",
          spacing: { top: dividerGap, bottom: dividerGap },
        };
        blocks = [...blocks, divider];
      }
    }

    if (section.dividerAfter === true || section.dividerAfter === false) {
      const { dividerAfter: _, ...rest } = section;
      return { ...rest, blocks };
    }
    return { ...section, blocks };
  });

  next = { ...next, sections };

  const hasFooterBlocks = next.sections.some((s) =>
    s.blocks.some((b) => b.type === "tagline" || b.type === "footerBar"),
  );
  const legacy = next.footer;
  const needsFooterMigrate =
    !hasFooterBlocks &&
    Boolean(
      legacy?.tagline ||
        legacy?.logoSrc ||
        legacy?.note ||
        (legacy?.links && legacy.links.length),
    );

  if (needsFooterMigrate && legacy) {
    const footerBlocks: BodyBlock[] = [];
    if (legacy.tagline) {
      footerBlocks.push({
        id: newId("tagline"),
        type: "tagline",
        text: legacy.tagline,
        spacing: { top: 24, bottom: 8 },
      });
    }
    if (legacy.logoSrc) {
      footerBlocks.push({
        id: newId("footer-logo"),
        type: "image",
        src: legacy.logoSrc,
        alt: "Goe Nieuws",
        width: 423,
        spacing: { top: 0, bottom: 16, left: 17, right: 17 },
      });
    }
    footerBlocks.push({
      id: newId("footer-bar"),
      type: "footerBar",
      note: legacy.note || "",
      links: legacy.links ?? [],
      dark: legacy.dark !== false,
      spacing: { top: 28, bottom: 28 },
    });
    next = {
      ...next,
      sections: [
        ...next.sections,
        { id: newId("sec-footer"), font: "sans", blocks: footerBlocks },
      ],
      footer: emptyFooter,
    };
  } else if (!next.footer) {
    next = { ...next, footer: emptyFooter };
  }

  return next;
}
