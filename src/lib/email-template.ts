import type { NewsletterDraft } from "./types";
import { htmlToPlainText, sanitizeRichHtml } from "./rich-text";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function paragraphHtml(
  html: string,
  color: string,
  fontSize: number,
  lineHeight: number,
): string {
  const safe = sanitizeRichHtml(html);
  return `
    <tr>
      <td style="padding:0 0 26px 0;font-family:Times New Roman, Times, Georgia, serif;font-size:${fontSize}px;line-height:${lineHeight};color:${escapeHtml(color)};">
        ${safe}
      </td>
    </tr>`;
}

function imageHtml(src: string, alt: string): string {
  return `
    <tr>
      <td style="padding:10px 0 30px 0;text-align:center;">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="520" style="display:block;margin:0 auto;width:100%;max-width:520px;height:auto;border:0;" />
      </td>
    </tr>`;
}

/**
 * Recolor a black-on-transparent PNG via CSS mask (works in preview + modern clients).
 */
function maskedAssetHtml(opts: {
  src: string;
  alt: string;
  color: string;
  aspectRatio: string;
}): string {
  const src = escapeHtml(opts.src);
  const color = escapeHtml(opts.color);
  const isDefaultBlack = color.toLowerCase() === "#000" || color.toLowerCase() === "#000000";

  if (isDefaultBlack) {
    return `<img src="${src}" alt="${escapeHtml(opts.alt)}" width="520" style="display:block;margin:0 auto;width:100%;max-width:520px;height:auto;border:0;" />`;
  }

  return `<div role="img" aria-label="${escapeHtml(opts.alt)}" style="display:block;margin:0 auto;width:100%;max-width:520px;aspect-ratio:${opts.aspectRatio};background-color:${color};-webkit-mask-image:url('${src}');mask-image:url('${src}');-webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;"></div>`;
}

/**
 * Table-based HTML email. Times New Roman primary, Georgia/serif fallbacks.
 */
export function buildNewsletterHtml(
  draft: NewsletterDraft,
  options?: { absoluteBaseUrl?: string },
): string {
  const abs = (src: string) => {
    if (!options?.absoluteBaseUrl) return src;
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
      return src;
    }
    return `${options.absoluteBaseUrl.replace(/\/$/, "")}${src.startsWith("/") ? "" : "/"}${src}`;
  };

  const c = draft.colors;
  const t = draft.typography;

  const bodyBlocks = draft.blocks
    .map((block) => {
      if (block.type === "paragraph") {
        return paragraphHtml(block.html, c.body, t.body.fontSize, t.body.lineHeight);
      }
      return imageHtml(abs(block.src), block.alt);
    })
    .join("");

  const socialLinks = draft.socials
    .map(
      (s) =>
        `<a href="${escapeHtml(s.href)}" style="color:${escapeHtml(c.footer)};text-decoration:underline;font-family:Times New Roman, Times, Georgia, serif;font-size:${t.footer.fontSize}px;line-height:${t.footer.lineHeight};">${escapeHtml(s.label)}</a>`,
    )
    .join(` <span style="color:${escapeHtml(c.footer)};">·</span> `);

  const logoHtml = maskedAssetHtml({
    src: abs(draft.logoSrc),
    alt: "Goe Nieuws",
    color: c.logo,
    aspectRatio: "1024 / 309",
  });

  const taglineHtml = maskedAssetHtml({
    src: abs(draft.taglineSrc),
    alt: "gemeenschap voor reflectie en actie / community for reflection and action",
    color: c.tagline,
    aspectRatio: "1024 / 168",
  });

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(htmlToPlainText(draft.title))}</title>
</head>
<body style="margin:0;padding:0;background:${escapeHtml(c.backgroundOuter)};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${escapeHtml(c.backgroundOuter)};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:${escapeHtml(c.backgroundCard)};">
          <tr>
            <td align="center" style="padding:28px 40px 24px 40px;">
              ${logoHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 16px 40px;">
              ${taglineHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 40px 8px 40px;">
              <img src="${escapeHtml(abs(draft.coverSrc))}" alt="${escapeHtml(draft.coverAlt)}" width="520" style="display:block;margin:0 auto;width:100%;max-width:520px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 10px 40px;font-family:Times New Roman, Times, Georgia, serif;font-size:${t.label.fontSize}px;line-height:${t.label.lineHeight};letter-spacing:0.04em;text-transform:uppercase;color:${escapeHtml(c.label)};">
              ${escapeHtml(draft.label)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px 40px;font-family:Times New Roman, Times, Georgia, serif;font-size:${t.title.fontSize}px;line-height:${t.title.lineHeight};font-weight:400;color:${escapeHtml(c.title)};">
              ${sanitizeRichHtml(draft.title)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${bodyBlocks}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 40px 8px 40px;border-top:1px solid ${escapeHtml(c.footerRule)};text-align:center;">
              <p style="margin:16px 0 8px 0;font-family:Times New Roman, Times, Georgia, serif;font-size:${t.footer.fontSize}px;line-height:${t.footer.lineHeight};color:${escapeHtml(c.footer)};text-align:center;">
                ${socialLinks}
              </p>
              <p style="margin:0 0 8px 0;font-family:Times New Roman, Times, Georgia, serif;font-size:${t.footer.fontSize}px;line-height:${t.footer.lineHeight};color:${escapeHtml(c.footer)};text-align:center;">
                ${escapeHtml(draft.footerNote)}
              </p>
              <p style="margin:0 0 28px 0;font-family:Times New Roman, Times, Georgia, serif;font-size:${t.footer.fontSize}px;line-height:${t.footer.lineHeight};color:${escapeHtml(c.footer)};text-align:center;">
                <a href="{{ unsubscribe }}" style="color:${escapeHtml(c.footer)};text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
