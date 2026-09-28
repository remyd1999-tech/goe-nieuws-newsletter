import type {
  BodyBlock,
  DividerBlock,
  NewsletterDraft,
  Section,
  SectionFont,
  SpacingTokens,
} from "./types";
import {
  EMAIL_MOBILE_BREAKPOINT,
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
  const s = resolveSpacing(block, tokens);
  return s.top === 0 && s.bottom === tokens.text;
}

function usesImageGapDefault(
  block: BodyBlock,
  tokens: SpacingTokens,
): boolean {
  const s = resolveSpacing(block, tokens);
  return s.top === tokens.image && s.bottom === tokens.image;
}

/** Mobile overrides — classes + !important so they beat inline desktop styles. */
function mobileStyleBlock(draft: NewsletterDraft): string {
  const t = resolveMobileTypography(draft);
  const s = resolveMobileSpacing(draft);
  const bp = EMAIL_MOBILE_BREAKPOINT;
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
      /* Inset images only — never apply imageWidth to full-bleed. */
      .gn-img { max-width:${s.imageWidth}px !important; width:100% !important; height:auto !important; }
      .gn-img-bleed { padding:0 !important; }
      .gn-img-full { max-width:100% !important; width:100% !important; height:auto !important; }
    }
  </style>`;
}

function usesDividerGapDefault(
  block: BodyBlock,
  tokens: SpacingTokens,
): boolean {
  const s = resolveSpacing(block, tokens);
  return s.top === tokens.divider && s.bottom === tokens.divider;
}

/** Figma Line 49 — dashed round-cap dots as PNG */
function dividerBlockHtml(
  block: DividerBlock,
  draft: NewsletterDraft,
  abs: (src: string) => string,
  interactive?: boolean,
): string {
  const sp = draft.spacing;
  const s = resolveSpacing(block, sp);
  const padX = 19; // Figma line x=18, width=420 → side ≈19
  const src = abs(draft.dividerSrc || "/assets/divider-dots.png");
  const gapClass = usesDividerGapDefault(block, sp) ? "gn-gap-divider" : null;
  const marker = blockMarker(block.id, interactive);
  return `
    <tr${marker}>
      <td align="center"${cls("gn-px", gapClass)} style="padding:${s.top}px ${padX}px ${s.bottom}px ${padX}px;font-size:0;line-height:0;">
        <img src="${escapeHtml(src)}" alt="" width="420" height="3" style="display:block;margin:0 auto;width:100%;max-width:420px;height:auto;border:0;outline:none;" />
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
  const padX = sp.padX;
  const marker = blockMarker(block.id, interactive);

  if (block.type === "divider") {
    return dividerBlockHtml(block, draft, abs, interactive);
  }

  if (block.type === "image") {
    if (block.fullBleed) {
      const w = sp.emailWidth;
      // True edge-to-edge: zero padding, ignore Pad X / Image width / per-image width.
      return `
    <tr${marker}>
      <td align="center" class="gn-img-bleed" style="padding:0;font-size:0;line-height:0;">
        <img class="gn-img-full" src="${escapeHtml(abs(block.src))}" alt="${escapeHtml(block.alt)}" width="${w}" style="display:block;margin:0;width:100%;max-width:${w}px;height:auto;border:0;outline:none;text-decoration:none;" />
      </td>
    </tr>`;
    }
    const w = block.width ?? sp.imageWidth;
    const side = Math.max(0, Math.round((sp.emailWidth - w) / 2));
    const gapClass = usesImageGapDefault(block, sp) ? "gn-gap-image" : null;
    return `
    <tr${marker}>
      <td align="center"${cls("gn-img-cell", gapClass)} style="padding:${s.top}px ${side}px ${s.bottom}px ${side}px;">
        <img class="gn-img" src="${escapeHtml(abs(block.src))}" alt="${escapeHtml(block.alt)}" width="${w}" style="display:block;margin:0 auto;width:100%;max-width:${w}px;height:auto;border:0;outline:none;text-decoration:none;" />
      </td>
    </tr>`;
  }

  if (block.type === "meta") {
    // Figma: left x=19, right ends near 440; pad ≈19
    const gapClass = usesTextGapDefault(block, sp) ? "gn-gap-text" : null;
    return `
    <tr${marker}>
      <td${cls("gn-px", gapClass)} style="padding:${s.top}px 19px ${s.bottom}px 19px;">
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
    // Figma: Helvetica Neue 28/29, border 2px solid black, full content width
    const safe = sanitizeRichHtml(block.html);
    const gapClass = usesTextGapDefault(block, sp) ? "gn-gap-text" : null;
    const borderW = block.width ?? 2;
    const boxH = block.height;
    const heightAttr = boxH != null ? ` height="${boxH}"` : "";
    const heightStyle = boxH != null ? `height:${boxH}px;` : "";
    const padY = boxH != null ? 0 : 10;
    return `
    <tr${marker}>
      <td align="center"${cls("gn-px", gapClass)} style="padding:${s.top}px ${padX}px ${s.bottom}px ${padX}px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;max-width:402px;margin:0 auto;">
          <tr>
            <td align="center" valign="middle" class="gn-framed"${heightAttr} style="border:${borderW}px solid ${escapeHtml(c.framedBorder)};${heightStyle}padding:${padY}px 16px;font-family:${FONT_SANS};font-size:${t.framedSize}px;line-height:${t.framedLineHeight};font-weight:400;color:${escapeHtml(c.body)};">
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
  return `
    <tr${marker}>
      <td align="${align}"${cls("gn-px", typeClass, gapClass)} style="padding:${s.top}px ${padX}px ${s.bottom}px ${padX}px;font-family:${stack};font-size:${size}px;line-height:${lh};font-weight:400;color:${escapeHtml(c.body)};text-align:${align};">
        ${safe}
      </td>
    </tr>`;
}

function footerHtml(
  draft: NewsletterDraft,
  abs: (src: string) => string,
  interactive?: boolean,
): string {
  const c = draft.colors;
  const t = draft.typography;
  const sp = draft.spacing;
  const dark = draft.footer.dark;
  const bg = dark ? c.footerBg : c.backgroundCard;
  const fg = dark ? c.footerText : c.body;
  const marker = interactive ? ` data-gn-target="footer"` : "";

  const links = draft.footer.links
    .map(
      (l) =>
        `<a href="${escapeHtml(l.href)}" class="gn-footer" style="color:${escapeHtml(fg)};text-decoration:underline;font-family:${FONT_SERIF};font-size:${t.footerSize}px;line-height:${t.footerLineHeight};">${escapeHtml(l.label)}</a>`,
    )
    .join(
      ` <span class="gn-footer" style="color:${escapeHtml(fg)};font-family:${FONT_SERIF};font-size:${t.footerSize}px;"> / </span> `,
    );

  const unsub = `<a href="{{ unsubscribe }}" class="gn-footer" style="color:${escapeHtml(fg)};text-decoration:underline;font-family:${FONT_SERIF};font-size:${t.footerSize}px;line-height:${t.footerLineHeight};">Unsubscribe</a>`;

  const tagline = draft.footer.tagline
    ? `
    <tr${marker}>
      <td align="center" class="gn-tagline gn-px" style="padding:24px 9px 8px 9px;font-family:${FONT_SANS};font-size:${t.taglineSize}px;line-height:${t.taglineLineHeight};color:${escapeHtml(c.body)};text-align:center;">
        ${escapeHtml(draft.footer.tagline)}
      </td>
    </tr>`
    : "";

  const footerLogo = draft.footer.logoSrc
    ? `
    <tr${marker}>
      <td align="center" class="gn-px" style="padding:0 17px 16px 17px;">
        <img class="gn-img" src="${escapeHtml(abs(draft.footer.logoSrc))}" alt="Goe Nieuws" width="423" style="display:block;margin:0 auto;width:100%;max-width:423px;height:auto;border:0;" />
      </td>
    </tr>`
    : "";

  return `
    ${tagline}
    ${footerLogo}
    <tr${marker}>
      <td align="center" class="gn-px" bgcolor="${escapeHtml(bg)}" style="padding:28px ${sp.padX}px;background-color:${escapeHtml(bg)};text-align:center;">
        <p class="gn-footer" style="margin:0 0 8px 0;font-family:${FONT_SERIF};font-size:${t.footerSize}px;line-height:${t.footerLineHeight};color:${escapeHtml(fg)};text-align:center;">
          ${escapeHtml(draft.footer.note)}
        </p>
        <p class="gn-footer" style="margin:0;font-family:${FONT_SERIF};font-size:${t.footerSize}px;line-height:${t.footerLineHeight};color:${escapeHtml(fg)};text-align:center;">
          ${links}${links ? ` <span class="gn-footer" style="color:${escapeHtml(fg)};"> / </span> ` : ""}${unsub}
        </p>
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
        // Retrigger animation even when re-clicking the same block.
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
  ${mobileStyleBlock(draft)}
  ${interactive ? interactiveChrome() : ""}
</head>
<body style="margin:0;padding:0;background:${escapeHtml(c.sideColor)};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(draft.subject)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${escapeHtml(c.sideColor)};border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
    <tr>
      <td align="center" style="padding:0;">
        <!--[if mso]>
        <table role="presentation" width="${w}" cellspacing="0" cellpadding="0" border="0"><tr><td>
        <![endif]-->
        <table role="presentation" width="${w}" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:${w}px;background:${escapeHtml(c.backgroundCard)};border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
          ${body}
          ${footerHtml(draft, abs, interactive)}
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
