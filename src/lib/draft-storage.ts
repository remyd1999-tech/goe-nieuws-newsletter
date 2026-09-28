import type { BodyBlock, NewsletterDraft, Section } from "@/lib/types";
import { defaultSpacing } from "@/lib/types";

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

/** Turn legacy `dividerAfter` flags into real divider blocks; ensure dividerSrc. */
function migrateDraft(draft: NewsletterDraft): NewsletterDraft {
  const dividerGap = draft.spacing?.divider ?? defaultSpacing.divider;
  let next: NewsletterDraft = draft.dividerSrc
    ? draft
    : { ...draft, dividerSrc: "/assets/divider-dots.png" };

  const sections: Section[] = next.sections.map((section) => {
    if (!section.dividerAfter) {
      if (section.dividerAfter === false) {
        const { dividerAfter: _, ...rest } = section;
        return rest;
      }
      return section;
    }
    const { dividerAfter: _, ...rest } = section;
    const alreadyHasDivider = section.blocks.some((b) => b.type === "divider");
    if (alreadyHasDivider) return rest;
    const divider: BodyBlock = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `div-${section.id}`,
      type: "divider",
      spacing: { top: dividerGap, bottom: dividerGap },
    };
    return { ...rest, blocks: [...section.blocks, divider] };
  });

  const sectionsChanged = sections.some((s, i) => s !== next.sections[i]);
  if (sectionsChanged || next !== draft) {
    return { ...next, sections };
  }
  return next;
}
