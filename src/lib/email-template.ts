import type {
  BodyBlock,
  DividerBlock,
  FooterBarBlock,
  FrameBorder,
  NewsletterDraft,
  Section,
  SectionFont,
  SpacingTokens,
  TaglineBlock,
} from "./types";
import {
  EMAIL_MOBILE_BREAKPOINT,
  EMAIL_MOBILE_WIDTH,
  resolveFrameBorder,
  resolveFramedTitle,
  resolveImageFullBleed,
  resolveMobileSpacing,
  resolveMobileTypography,
  resolveSpacing,
} from "./types";
import { sanitizeRichHtml } from "./rich-text";

/** Helvetica Neue → web-safe stack (Figma) */
const FONT_SANS =
  "'Helvetica Neue', Helvetica, Arial, 'Segoe UI', sans-serif";
/** Georgia (Figma body) */
const FONT_SERIF = "Georgia, 'Times New Roman', Times, serif";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Per-side border CSS from shared color + width. */
function frameBorderCss(border: FrameBorder, important = false): string {
  const w = Math.max(0, Math.round(border.width));
  const c = escapeHtml(border.color);
  const bang = important ? " !important" : "";
  const side = (on: boolean) =>
    on && w > 0 ? `${w}px solid ${c}${bang}` : `none${bang}`;
  return [
    `border-top:${side(border.top)}`,
    `border-right:${side(border.right)}`,
    `border-bottom:${side(border.bottom)}`,
    `border-left:${side(border.left)}`,
  ].join(";");
}

function fontStack(font: SectionFont): string {
  return font === "serif" ? FONT_SERIF : FONT_SANS;
}

function lhCss(leading: number): string {
  return leading > 4 ? `${leading}px` : String(leading);
}

function cls(...parts: Array<string | false | null | undefined>): string {
  const v = parts.filter(Boolean).join(" ");
  return v ? ` class="${v}"` : "";
}

function usesTextGapDefault(
  block: BodyBlock,
  tokens: SpacingTokens,
): boolean {
  const s = resolveSpacing(block, tokens, "desktop");
  return s.top === 0 && s.bottom === tokens.text;
}

function usesImageGapDefault(
  block: BodyBlock,
  tokens: SpacingTokens,
): boolean {
  const s = resolveSpacing(block, tokens, "desktop");
  return s.top === tokens.image && s.bottom === tokens.image;
}

function usesPadXDefault(block: BodyBlock, tokens: SpacingTokens): boolean {
  const s = resolveSpacing(block, tokens, "desktop");
  return s.left === tokens.padX && s.right === tokens.padX;
}

function usesDividerGapDefault(
  block: BodyBlock,
  tokens: SpacingTokens,
): boolean {
  const s = resolveSpacing(block, tokens, "desktop");
  return s.top === tokens.divider && s.bottom === tokens.divider;
}

function cssSafeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

function blockPadClass(blockId: string): string {
  return `gn-pad-${cssSafeId(blockId)}`;
}

/** Per-block mobile padding (+ framed / image size) overrides. */
function mobileBlockRules(draft: NewsletterDraft): string {
  const tokens = resolveMobileSpacing(draft);
  const rules: string[] = [];
  for (const section of draft.sections) {
    for (const block of section.blocks) {
      const safe = cssSafeId(block.id);
      if (block.type === "image") {
        const mobileBleed = resolveImageFullBleed(block, "mobile");
        if (mobileBleed) {
          const s = resolveSpacing(block, tokens, "mobile");
          rules.push(
            `.gn-pad-${safe}{padding:${s.top}px 0 ${s.bottom}px 0 !important;}`,
            `.gn-img-${safe}{max-width:100% !important;width:100% !important;height:auto !important;}`,
          );
          continue;
        }
        const s = resolveSpacing(block, tokens, "mobile");
        rules.push(
          `.gn-pad-${safe}{padding:${s.top}px ${s.right}px ${s.bottom}px ${s.left}px !important;}`,
        );
        const w = block.mobileWidth ?? block.width ?? tokens.imageWidth;
        rules.push(
          `.gn-img-${safe}{max-width:${w}px !important;width:100% !important;height:auto !important;}`,
        );
        continue;
      }
      const s = resolveSpacing(block, tokens, "mobile");
      rules.push(
        `.gn-pad-${safe}{padding:${s.top}px ${s.right}px ${s.bottom}px ${s.left}px !important;}`,
      );
      if (block.type === "framedTitle") {
        const f = resolveFramedTitle(block, "mobile");
        rules.push(
          `.gn-framed-box-${safe}{width:100% !important;max-width:100% !important;height:auto !important;min-height:${f.boxHeight}px !important;}`,
          `.gn-framed-box-${safe} td{width:100% !important;max-width:100% !important;height:auto !important;min-height:${f.boxHeight}px !important;border-width:${f.borderWidth}px !important;}`,
        );
      }
    }
  }
  return rules.join("\n      ");
}

/** Mobile overrides — classes + !important so they beat inline desktop styles. */
function mobileStyleBlock(draft: NewsletterDraft): string {
  const t = resolveMobileTypography(draft);
  const s = resolveMobileSpacing(draft);
  const frame = resolveFrameBorder(draft, "mobile");
  const bp = EMAIL_MOBILE_BREAKPOINT;
  const perBlock = mobileBlockRules(draft);
  const mobDot = Math.max(1, Math.round(s.dotSize ?? 3));
  return `
  <style type="text/css">
    @media only screen and (max-width:${bp}px) {
      .gn-sans { font-size:${t.sansSize}px !important; line-height:${lhCss(t.sansLineHeight)} !important; }
      .gn-serif { font-size:${t.serifSize}px !important; line-height:${lhCss(t.serifLineHeight)} !important; }
      .gn-meta { font-size:${t.metaSize}px !important; line-height:${lhCss(t.metaLineHeight)} !important; }
      .gn-framed { font-size:${t.framedSize}px !important; line-height:${lhCss(t.framedLineHeight)} !important; }
      .gn-footer { font-size:${t.footerSize}px !important; line-height:${lhCss(t.footerLineHeight)} !important; }
      .gn-tagline { font-size:${t.taglineSize}px !important; line-height:${lhCss(t.taglineLineHeight)} !important; }
      .gn-px { padding-left:${s.padX}px !important; padding-right:${s.padX}px !important; }
      .gn-gap-text { padding-top:0 !important; padding-bottom:${s.text}px !important; }
      .gn-gap-image { padding-top:${s.image}px !important; padding-bottom:${s.image}px !important; }
      .gn-gap-divider { padding-top:${s.divider}px !important; padding-bottom:${s.divider}px !important; }
      .gn-img-cell { padding-left:${s.padX}px !important; padding-right:${s.padX}px !important; }
      .gn-dot {
        width:${mobDot}px !important;
        height:${mobDot}px !important;
        min-width:${mobDot}px !important;
        min-height:${mobDot}px !important;
      }
      .gn-dot-cell {
        width:${mobDot}px !important;
      }
      .gn-dot-d-only { display:none !important; }
      .gn-dot-m-only { display:table-cell !important; }
      ${perBlock}
      /* Fluid canvas — must win over fixed desktop px widths. */
      .gn-shell {
        width: 100% !important;
        max-width: 100% !important;
        ${frameBorderCss(frame, true)}
      }
      .gn-shell td {
        word-break: break-word !important;
        overflow-wrap: anywhere !important;
      }
      .gn-shell img,
      .gn-img,
      .gn-img-full {
        max-width: 100% !important;
        width: 100% !important;
        height: auto !important;
      }
      .gn-framed-box,
      .gn-framed-box td {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
      }
    }
  </style>`;
}

function dotCount(contentWidth: number, size: number, gap: number): number {
  const safeSize = Math.max(1, Math.round(size));
  const pitch = safeSize + Math.max(0, Math.round(gap));
  return Math.max(2, Math.floor((contentWidth - safeSize) / pitch) + 1);
}

/**
 * Dots flush to content edges (Left/Right padding on the cell); gaps only between dots.
 * Extra desktop/mobile dots (+ their adjacent spacers) toggle via CSS classes.
 */
function dividerDotsHtml(
  color: string,
  desktop: { contentWidth: number; size: number; gap: number },
  mobile: { contentWidth: number; size: number; gap: number },
): string {
  const deskSize = Math.max(1, Math.round(desktop.size));
  const deskCount = dotCount(desktop.contentWidth, desktop.size, desktop.gap);
  const mobCount = dotCount(mobile.contentWidth, mobile.size, mobile.gap);
  const count = Math.max(deskCount, mobCount);
  const safeColor = escapeHtml(color);
  const cells: string[] = [];

  for (let i = 0; i < count; i++) {
    const dotMode =
      i >= mobCount && i < deskCount
        ? "gn-dot-d-only"
        : i >= deskCount && i < mobCount
          ? "gn-dot-m-only"
          : "";
    // Cell width = dot size, so align is moot; first/last sit on the table edges
    // because spacers (not half-cells) absorb the free space between dots.
    cells.push(
      `<td align="${i === 0 ? "left" : i === count - 1 ? "right" : "center"}" valign="middle" width="${deskSize}"` +
        ` class="gn-dot-cell${dotMode ? ` ${dotMode}` : ""}"` +
        ` style="width:${deskSize}px;padding:0;margin:0;font-size:0;line-height:0;${i >= deskCount ? "display:none;" : ""}">` +
        `<span class="gn-dot" style="display:inline-block;width:${deskSize}px;height:${deskSize}px;min-width:${deskSize}px;min-height:${deskSize}px;background-color:${safeColor};border-radius:50%;"></span>` +
        `</td>`,
    );

    if (i < count - 1) {
      // Spacer between dots i and i+1 — only when both sides can show on that mode.
      const gapMode =
        i >= mobCount - 1 && i < deskCount - 1
          ? "gn-dot-d-only"
          : i >= deskCount - 1 && i < mobCount - 1
            ? "gn-dot-m-only"
            : "";
      cells.push(
        `<td${gapMode ? ` class="${gapMode}"` : ""}` +
          ` style="padding:0;margin:0;font-size:0;line-height:0;${i >= deskCount - 1 ? "display:none;" : ""}">&nbsp;</td>`,
      );
    }
  }

  return (
    `<table role="presentation" class="gn-dots" width="100%" cellspacing="0" cellpadding="0" border="0" ` +
    `style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;mso-table-lspace:0pt;mso-table-rspace:0pt;">` +
    `<tr>${cells.join("")}</tr></table>`
  );
}

function dividerBlockHtml(
  block: DividerBlock,
  draft: NewsletterDraft,
  interactive?: boolean,
): string {
  const sp = draft.spacing;
  const mob = resolveMobileSpacing(draft);
  const s = resolveSpacing(block, sp);
  const sMob = resolveSpacing(block, mob, "mobile");
  const gapClass = usesDividerGapDefault(block, sp) ? "gn-gap-divider" : null;
  const padClass = usesPadXDefault(block, sp) ? "gn-px" : null;
  const marker = blockMarker(block.id, interactive);
  // Fill the padded cell — Left/Right control inset like text (0 = full bleed).
  const contentW = Math.max(1, sp.emailWidth - s.left - s.right);
  const mobileContentW = Math.max(
    1,
    EMAIL_MOBILE_WIDTH - sMob.left - sMob.right,
  );
  const color = draft.colors.divider || "#000000";
  return `
    <tr${marker}>
      <td align="center"${cls(blockPadClass(block.id), padClass, gapClass)} style="padding:${s.top}px ${s.right}px ${s.bottom}px ${s.left}px;font-size:0;line-height:0;">
        ${dividerDotsHtml(
          color,
          {
            contentWidth: contentW,
            size: sp.dotSize ?? 3,
            gap: sp.dotSpacing ?? 17,
          },
          {
            contentWidth: mobileContentW,
            size: mob.dotSize ?? 3,
            gap: mob.dotSpacing ?? 17,
          },
        )}
      </td>
    </tr>`;
}

function taglineBlockHtml(
  block: TaglineBlock,
  draft: NewsletterDraft,
  interactive?: boolean,
): string {
  const c = draft.colors;
  const t = draft.typography;
  const sp = draft.spacing;
  const s = resolveSpacing(block, sp);
  const padClass = usesPadXDefault(block, sp) ? "gn-px" : null;
  const marker = blockMarker(block.id, interactive);
  return `
    <tr${marker}>
      <td align="center"${cls("gn-tagline", blockPadClass(block.id), padClass)} style="padding:${s.top}px ${s.right}px ${s.bottom}px ${s.left}px;font-family:${FONT_SANS};font-size:${t.taglineSize}px;line-height:${t.taglineLineHeight};color:${escapeHtml(c.body)};text-align:center;">
        ${escapeHtml(block.text)}
      </td>
    </tr>`;
}

function footerBarBlockHtml(
  block: FooterBarBlock,
  draft: NewsletterDraft,
  interactive?: boolean,
): string {
  const c = draft.colors;
  const t = draft.typography;
  const sp = draft.spacing;
  const s = resolveSpacing(block, sp);
  const dark = block.dark !== false;
  const bg = dark ? c.footerBg : c.backgroundCard;
  const fg = dark ? c.footerText : c.body;
  const marker = blockMarker(block.id, interactive);

  const sep = ` <span class="gn-footer" style="color:${escapeHtml(fg)};font-family:${FONT_SERIF};font-size:${t.footerSize}px;"> / </span> `;
  const links = block.links
    .filter((l) => l.label.trim())
    .map((l) => {
      const label = escapeHtml(l.label);
      const style = `color:${escapeHtml(fg)};text-decoration:underline;font-family:${FONT_SERIF};font-size:${t.footerSize}px;line-height:${t.footerLineHeight};`;
      if (!l.href.trim()) {
        return `<span class="gn-footer" style="${style}">${label}</span>`;
      }
      return `<a href="${escapeHtml(l.href)}" class="gn-footer" style="${style}">${label}</a>`;
    })
    .join(sep);

  return `
    <tr${marker}>
      <td align="center"${cls(blockPadClass(block.id))} bgcolor="${escapeHtml(bg)}" style="padding:${s.top}px ${s.right}px ${s.bottom}px ${s.left}px;background-color:${escapeHtml(bg)};text-align:center;">
        <p class="gn-footer" style="margin:0 0 8px 0;font-family:${FONT_SERIF};font-size:${t.footerSize}px;line-height:${t.footerLineHeight};color:${escapeHtml(fg)};text-align:center;">
          ${escapeHtml(block.note)}
        </p>
        ${
          links
            ? `<p class="gn-footer" style="margin:0;font-family:${FONT_SERIF};font-size:${t.footerSize}px;line-height:${t.footerLineHeight};color:${escapeHtml(fg)};text-align:center;">
          ${links}
        </p>`
            : ""
        }
      </td>
    </tr>`;
}

function blockMarker(blockId: string, interactive?: boolean): string {
  return interactive ? ` data-gn-block="${escapeHtml(blockId)}"` : "";
}

function blockHtml(
  block: BodyBlock,
  section: Section,
  draft: NewsletterDraft,
  abs: (src: string) => string,
  interactive?: boolean,
): string {
  const c = draft.colors;
  const t = draft.typography;
  const sp = draft.spacing;
  const s = resolveSpacing(block, sp);
  const marker = blockMarker(block.id, interactive);

  if (block.type === "divider") {
    return dividerBlockHtml(block, draft, interactive);
  }

  if (block.type === "tagline") {
    return taglineBlockHtml(block, draft, interactive);
  }

  if (block.type === "footerBar") {
    return footerBarBlockHtml(block, draft, interactive);
  }

  if (block.type === "image") {
    const safe = cssSafeId(block.id);
    const padCls = blockPadClass(block.id);
    const desktopBleed = resolveImageFullBleed(block, "desktop");
    if (desktopBleed) {
      const w = sp.emailWidth;
      // Full bleed: horizontal flush, Top/Bottom still apply.
      return `
    <tr${marker}>
      <td align="center"${cls(padCls, "gn-img-bleed")} style="padding:${s.top}px 0 ${s.bottom}px 0;font-size:0;line-height:0;">
        <img class="gn-img-full gn-img-${safe}" src="${escapeHtml(abs(block.src))}" alt="${escapeHtml(block.alt)}" width="${w}" style="display:block;margin:0;width:100%;max-width:${w}px;height:auto;border:0;outline:none;text-decoration:none;" />
      </td>
    </tr>`;
    }
    const w = block.width ?? sp.imageWidth;
    const gapClass = usesImageGapDefault(block, sp) ? "gn-gap-image" : null;
    const padClass = usesPadXDefault(block, sp) ? "gn-img-cell" : null;
    const imgClass = `gn-img gn-img-${safe}`;
    return `
    <tr${marker}>
      <td align="center"${cls(padCls, padClass, gapClass)} style="padding:${s.top}px ${s.right}px ${s.bottom}px ${s.left}px;">
        <img class="${imgClass}" src="${escapeHtml(abs(block.src))}" alt="${escapeHtml(block.alt)}" width="${w}" style="display:block;margin:0 auto;width:100%;max-width:${w}px;height:auto;border:0;outline:none;text-decoration:none;" />
      </td>
    </tr>`;
  }

  if (block.type === "meta") {
    const gapClass = usesTextGapDefault(block, sp) ? "gn-gap-text" : null;
    return `
    <tr${marker}>
      <td${cls(blockPadClass(block.id), gapClass)} style="padding:${s.top}px ${s.right}px ${s.bottom}px ${s.left}px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td align="left" valign="middle" class="gn-meta" style="font-family:${FONT_SANS};font-size:${t.metaSize}px;line-height:${t.metaLineHeight};font-weight:400;text-transform:uppercase;color:${escapeHtml(c.meta)};">
              ${escapeHtml(block.left)}
            </td>
            <td align="right" valign="middle" class="gn-meta" style="font-family:${FONT_SANS};font-size:${t.metaSize}px;line-height:${t.metaLineHeight};font-weight:400;text-transform:uppercase;color:${escapeHtml(c.meta)};">
              ${escapeHtml(block.right)}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }

  if (block.type === "framedTitle") {
    const safe = sanitizeRichHtml(block.html);
    const gapClass = usesTextGapDefault(block, sp) ? "gn-gap-text" : null;
    const { borderWidth, boxWidth, boxHeight } = resolveFramedTitle(block);
    const framedBoxClass = `gn-framed-box gn-framed-box-${cssSafeId(block.id)}`;
    return `
    <tr${marker}>
      <td align="center"${cls(blockPadClass(block.id), gapClass)} style="padding:${s.top}px ${s.right}px ${s.bottom}px ${s.left}px;">
        <table role="presentation" class="${framedBoxClass}" width="${boxWidth}" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;width:${boxWidth}px;max-width:${boxWidth}px;height:${boxHeight}px;margin:0 auto;">
          <tr>
            <td align="center" valign="middle" class="gn-framed" width="${boxWidth}" height="${boxHeight}" style="border:${borderWidth}px solid ${escapeHtml(c.framedBorder)};width:${boxWidth}px;height:${boxHeight}px;max-width:${boxWidth}px;padding:0 16px;font-family:${FONT_SANS};font-size:${t.framedSize}px;line-height:${t.framedLineHeight};font-weight:400;color:${escapeHtml(c.body)};">
              ${safe}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }

  // text
  const align = block.align ?? "left";
  const font = block.font ?? section.font;
  const stack = fontStack(font);
  const size =
    block.fontSize ??
    (font === "serif" ? t.serifSize : t.sansSize);
  const leading =
    block.lineHeight ??
    (font === "serif" ? t.serifLineHeight : t.sansLineHeight);
  const lh = lhCss(leading);
  const safe = sanitizeRichHtml(block.html);
  const typeClass =
    block.fontSize == null
      ? font === "serif"
        ? "gn-serif"
        : "gn-sans"
      : null;
  const gapClass = usesTextGapDefault(block, sp) ? "gn-gap-text" : null;
  const padClass = usesPadXDefault(block, sp) ? "gn-px" : null;
  return `
    <tr${marker}>
      <td align="${align}"${cls(blockPadClass(block.id), padClass, typeClass, gapClass)} style="padding:${s.top}px ${s.right}px ${s.bottom}px ${s.left}px;font-family:${stack};font-size:${size}px;line-height:${lh};font-weight:400;color:${escapeHtml(c.body)};text-align:${align};">
        ${safe}
      </td>
    </tr>`;
}

function interactiveChrome(): string {
  return `
  <style type="text/css">
    [data-gn-block], [data-gn-target] { cursor: pointer; }
    [data-gn-block]:hover > td, [data-gn-target]:hover > td {
      outline: 2px solid rgba(0, 122, 255, 0.45);
      outline-offset: -2px;
    }
    [data-gn-block].gn-selected > td, [data-gn-target].gn-selected > td {
      outline: 2px solid #007aff;
      outline-offset: -2px;
      animation: gn-select-fade 0.8s ease-out forwards;
    }
    @keyframes gn-select-fade {
      0%, 62.5% { outline-color: #007aff; }
      100% { outline-color: transparent; }
    }
  </style>
  <script>
    (function () {
      var selected = null;
      var clearTimer = null;
      document.addEventListener("click", function (e) {
        var el = e.target && e.target.closest
          ? e.target.closest("[data-gn-block],[data-gn-target]")
          : null;
        if (!el) return;
        e.preventDefault();
        e.stopPropagation();
        if (clearTimer) {
          clearTimeout(clearTimer);
          clearTimer = null;
        }
        if (selected) selected.classList.remove("gn-selected");
        void el.offsetWidth;
        selected = el;
        el.classList.add("gn-selected");
        clearTimer = setTimeout(function () {
          if (selected) selected.classList.remove("gn-selected");
          selected = null;
          clearTimer = null;
        }, 800);
        parent.postMessage({
          source: "gn-preview",
          type: "select",
          blockId: el.getAttribute("data-gn-block"),
          target: el.getAttribute("data-gn-target")
        }, "*");
      }, true);
    })();
  </script>`;
}

/**
 * Table-based HTML email matching Figma frame 458px.
 * Desktop values inline · mobile overrides via @media + classes.
 * Pass `interactive: true` for the builder preview (click → select block).
 */
export function buildNewsletterHtml(
  draft: NewsletterDraft,
  options?: { absoluteBaseUrl?: string; interactive?: boolean },
): string {
  const interactive = Boolean(options?.interactive);
  const abs = (src: string) => {
    if (!options?.absoluteBaseUrl) return src;
    if (
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("data:")
    ) {
      return src;
    }
    return `${options.absoluteBaseUrl.replace(/\/$/, "")}${src.startsWith("/") ? "" : "/"}${src}`;
  };

  const c = draft.colors;
  const w = draft.spacing.emailWidth;
  const frame = resolveFrameBorder(draft, "desktop");
  const frameCss = frameBorderCss(frame);
  const titlePlain = draft.subject || "Goe Nieuws";

  const body = draft.sections
    .map((section) =>
      section.blocks
        .map((block) =>
          blockHtml(block, section, draft, abs, interactive),
        )
        .join(""),
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(titlePlain)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light only; supported-color-schemes: light only; }
  </style>
  ${mobileStyleBlock(draft)}
  ${interactive ? interactiveChrome() : ""}
</head>
<body style="margin:0;padding:0;background:${escapeHtml(c.sideColor)};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;color-scheme:light only;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(draft.subject)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${escapeHtml(c.sideColor)};border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
    <tr>
      <td align="center" style="padding:0;">
        <!--[if mso]>
        <table role="presentation" width="${w}" cellspacing="0" cellpadding="0" border="0"><tr><td>
        <![endif]-->
        <table role="presentation" class="gn-shell" width="${w}" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:${w}px;background:${escapeHtml(c.backgroundCard)};border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;${frameCss}">
          ${body}
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
