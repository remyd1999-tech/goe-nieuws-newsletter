/** Normalize a color string to #RRGGBB. Invalid values become #000000. */
export function toHex6(value: string): string {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase();
  }
  return "#000000";
}

/** True when the string is a 3- or 6-digit hex color (with #). */
export function isHexColor(value: string): boolean {
  const v = value.trim();
  return /^#[0-9a-fA-F]{3}$/.test(v) || /^#[0-9a-fA-F]{6}$/.test(v);
}

export type GradientStop = {
  id: string;
  /** 0–100 */
  position: number;
  /** #RRGGBB */
  color: string;
  /** 0–100 */
  opacity: number;
};

export type LinearGradient = {
  type: "linear";
  /** Degrees — 180 = top → bottom */
  angle: number;
  stops: GradientStop[];
};

/** Uploaded / linked image used as a background fill. */
export type ImageFill = {
  type: "image";
  src: string;
  /** Solid color shown when the image is blocked (Outlook, etc.). */
  fallback: string;
  size?: "cover" | "contain" | "auto";
  repeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
};

/** Solid hex, linear gradient, or background image (for page/footer fills). */
export type ColorFill = string | LinearGradient | ImageFill;

export function isLinearGradient(value: unknown): value is LinearGradient {
  if (!value || typeof value !== "object") return false;
  const g = value as LinearGradient;
  return g.type === "linear" && Array.isArray(g.stops);
}

export function isImageFill(value: unknown): value is ImageFill {
  if (!value || typeof value !== "object") return false;
  const img = value as ImageFill;
  return img.type === "image" && typeof img.src === "string";
}

export function newStopId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `stop-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultLinearGradient(fromHex = "#000000"): LinearGradient {
  const a = toHex6(fromHex);
  const b = a === "#ffffff" ? "#000000" : "#ffffff";
  return {
    type: "linear",
    angle: 180,
    stops: [
      { id: newStopId(), position: 0, color: a, opacity: 100 },
      { id: newStopId(), position: 100, color: b, opacity: 100 },
    ],
  };
}

export function defaultImageFill(
  fromHex = "#ffffff",
  src = "",
): ImageFill {
  return {
    type: "image",
    src,
    fallback: toHex6(fromHex),
    size: "cover",
    repeat: "no-repeat",
  };
}

/** Solid fallback for bgcolor / clients without image/gradient support. */
export function solidFallback(fill: ColorFill | undefined | null): string {
  if (!fill) return "#000000";
  if (typeof fill === "string") return toHex6(fill);
  if (isImageFill(fill)) return toHex6(fill.fallback || "#000000");
  if (isLinearGradient(fill) && fill.stops.length > 0) {
    const sorted = [...fill.stops].sort((x, y) => x.position - y.position);
    return toHex6(sorted[0].color);
  }
  return "#000000";
}

function hexToRgba(hex: string, opacityPct: number): string {
  const h = toHex6(hex);
  const r = Number.parseInt(h.slice(1, 3), 16);
  const g = Number.parseInt(h.slice(3, 5), 16);
  const b = Number.parseInt(h.slice(5, 7), 16);
  const a = Math.max(0, Math.min(100, opacityPct)) / 100;
  if (a >= 1) return h;
  return `rgba(${r},${g},${b},${Number(a.toFixed(3))})`;
}

function stopToCss(stop: GradientStop): string {
  const color = hexToRgba(stop.color, stop.opacity ?? 100);
  const pos = `${Math.round(Math.max(0, Math.min(100, stop.position)))}%`;
  return `${color} ${pos}`;
}

/** `linear-gradient(...)` CSS function, or empty string if not a gradient. */
export function linearGradientCss(fill: ColorFill): string {
  if (!isLinearGradient(fill) || fill.stops.length === 0) return "";
  const angle = Number.isFinite(fill.angle) ? fill.angle : 180;
  const stops = [...fill.stops]
    .sort((a, b) => a.position - b.position)
    .map(stopToCss)
    .join(", ");
  return `linear-gradient(${angle}deg, ${stops})`;
}

function cssUrl(src: string): string {
  const safe = src.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `url("${safe}")`;
}

export type ResolveFillUrl = (src: string) => string;

function mapFillUrls(
  fill: ColorFill,
  resolveUrl?: ResolveFillUrl,
): ColorFill {
  if (!resolveUrl || !isImageFill(fill) || !fill.src) return fill;
  return { ...fill, src: resolveUrl(fill.src) };
}

/**
 * Inline CSS for a background that may be solid, linear, or image.
 * Always sets background-color as fallback.
 */
export function cssBackgroundStyle(
  fill: ColorFill,
  resolveUrl?: ResolveFillUrl,
): string {
  const resolved = mapFillUrls(fill, resolveUrl);
  const solid = solidFallback(resolved);

  if (isImageFill(resolved) && resolved.src) {
    const size = resolved.size ?? "cover";
    const repeat = resolved.repeat ?? "no-repeat";
    const sizeCss =
      size === "auto" ? "auto" : size === "contain" ? "contain" : "cover";
    return (
      `background-color:${solid};` +
      `background-image:${cssUrl(resolved.src)};` +
      `background-repeat:${repeat};` +
      `background-size:${sizeCss};` +
      `background-position:center;`
    );
  }

  const gradient = linearGradientCss(resolved);
  if (!gradient) return `background-color:${solid};`;
  return `background-color:${solid};background-image:${gradient};`;
}

/** HTML `background="…"` attribute value when fill is an image, else "". */
export function backgroundImageAttr(
  fill: ColorFill,
  resolveUrl?: ResolveFillUrl,
): string {
  const resolved = mapFillUrls(fill, resolveUrl);
  if (!isImageFill(resolved) || !resolved.src) return "";
  return resolved.src;
}

/** React/CSSOM-friendly background style object. */
export function cssBackgroundObject(fill: ColorFill): {
  backgroundColor: string;
  backgroundImage?: string;
  backgroundRepeat?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
} {
  const solid = solidFallback(fill);

  if (isImageFill(fill) && fill.src) {
    const size = fill.size ?? "cover";
    return {
      backgroundColor: solid,
      backgroundImage: cssUrl(fill.src),
      backgroundRepeat: fill.repeat ?? "no-repeat",
      backgroundSize: size === "auto" ? "auto" : size,
      backgroundPosition: "center",
    };
  }

  const gradient = linearGradientCss(fill);
  if (!gradient) return { backgroundColor: solid };
  return { backgroundColor: solid, backgroundImage: gradient };
}

/** Walk a fill and return its image src if any (for materialize / counting). */
export function fillImageSrc(fill: ColorFill | undefined | null): string | null {
  if (isImageFill(fill) && fill.src) return fill.src;
  return null;
}

/** Replace image src inside a fill (materialize data URLs → /assets/…). */
export function mapFillImageSrc(
  fill: ColorFill,
  replace: (src: string) => string,
): ColorFill {
  if (!isImageFill(fill) || !fill.src) return fill;
  return { ...fill, src: replace(fill.src) };
}
