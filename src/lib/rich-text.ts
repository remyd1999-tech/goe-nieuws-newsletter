const ALLOWED_TAGS = new Set(["p", "br", "em", "i", "strong", "b", "u"]);

/**
 * Keep only email-safe inline formatting tags from the rich-text editor.
 */
export function sanitizeRichHtml(input: string): string {
  if (!input) return "";

  // TipTap wraps content in <p>; normalize empty paragraphs
  let html = input
    .replaceAll("<p></p>", "<br />")
    .replaceAll("<p><br></p>", "<br />")
    .replaceAll("<p><br/></p>", "<br />");

  // Strip disallowed tags but keep their text
  html = html.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (match, tag: string) => {
    const name = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (match.startsWith("</")) return `</${name}>`;
    if (name === "br") return "<br />";
    // Drop attributes
    return `<${name}>`;
  });

  // Convert block paragraphs to line breaks between them for email flow
  html = html
    .replace(/<\/p>\s*<p>/gi, "<br /><br />")
    .replace(/^<p>/i, "")
    .replace(/<\/p>$/i, "")
    .replace(/<\/?p>/gi, "<br />");

  return html.trim();
}

export function plainTextToHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"))
    .join("<br />");
}

/** Strip tags for <title> / plain-text contexts */
export function htmlToPlainText(input: string): string {
  return sanitizeRichHtml(input)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
