/** Padding in px (email-safe). */
export type BlockSpacing = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** Desktop + optional mobile-only padding overrides. */
export type SpacedBlock = {
  spacing?: Partial<BlockSpacing>;
  /** Applied under EMAIL_MOBILE_BREAKPOINT; inherits desktop when omitted. */
  mobileSpacing?: Partial<BlockSpacing>;
};

export type TextAlign = "left" | "center";
export type SectionFont = "sans" | "serif";

export type ImageBlock = SpacedBlock & {
  id: string;
  type: "image";
  src: string;
  alt: string;
  /** Display width in px (Figma). Defaults to content width. */
  width?: number;
  /** Mobile-only width; inherits `width` when omitted. */
  mobileWidth?: number;
  /**
   * Edge-to-edge: zero side padding + vertical gaps, image spans email width.
   */
  fullBleed?: boolean;
  /** Mobile-only full bleed; inherits `fullBleed` when omitted. */
  mobileFullBleed?: boolean;
};

export type TextBlock = SpacedBlock & {
  id: string;
  type: "text";
  html: string;
  align?: TextAlign;
  /**
   * Override section font for this block only.
   * E.g. Helvetica title inside a Georgia section.
   */
  font?: SectionFont;
  /** px size override (Figma). */
  fontSize?: number;
  /** unitless or px line-height override. */
  lineHeight?: number;
};

/** SEIZOEN … | NIEUWSBRIEF … row */
export type MetaBlock = SpacedBlock & {
  id: string;
  type: "meta";
  left: string;
  right: string;
};

/**
 * Boxed title like “Anatomie van aanraking”.
 * Fixed pixel box (does not fluid-scale with the viewport).
 */
export type FramedTitleBlock = SpacedBlock & {
  id: string;
  type: "framedTitle";
  html: string;
  /** Border thickness in px. Defaults to 2. */
  borderWidth?: number;
  /**
   * @deprecated Migrated to `borderWidth`.
   */
  width?: number;
  /** Fixed box width in px. Defaults to 402. */
  boxWidth?: number;
  /** Fixed box height in px. Defaults to 52. */
  boxHeight?: number;
  /**
   * @deprecated Migrated to `boxHeight`.
   */
  height?: number;
  mobileBoxWidth?: number;
  mobileBoxHeight?: number;
  mobileBorderWidth?: number;
};

/** Dotted separator (Figma Line 49 PNG). */
export type DividerBlock = SpacedBlock & {
  id: string;
  type: "divider";
};

/** Centered tagline above the closing logo / footer bar. */
export type TaglineBlock = SpacedBlock & {
  id: string;
  type: "tagline";
  text: string;
};

/** Dark (or light) closing bar with note + links. */
export type FooterBarBlock = SpacedBlock & {
  id: string;
  type: "footerBar";
  note: string;
  links: { label: string; href: string }[];
  /** Full-bleed black bar */
  dark?: boolean;
};

export type BodyBlock =
  | ImageBlock
  | TextBlock
  | MetaBlock
  | FramedTitleBlock
  | DividerBlock
  | TaglineBlock
  | FooterBarBlock;

export type Section = {
  id: string;
  /** Georgia stack vs Helvetica Neue stack */
  font: SectionFont;
  blocks: BodyBlock[];
  /**
   * @deprecated Prefer a `divider` block. Migrated on load when true.
   */
  dividerAfter?: boolean;
};

export type NewsletterColors = {
  backgroundCard: string;
  /**
   * Desktop gutter left/right of the email frame (Gmail web, etc.).
   * Invisible on mobile when the email is full-bleed.
   */
  sideColor: string;
  body: string;
  meta: string;
  framedBorder: string;
  divider: string;
  footerBg: string;
  footerText: string;
};

/** Outline around the email shell (same color + width; sides optional). */
export type FrameBorder = {
  color: string;
  /** Thickness in px (shared by all enabled sides). */
  width: number;
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};

export type SpacingTokens = {
  /** Default gap under text blocks (= one Georgia empty line ≈ 23px) */
  text: number;
  /** Default top/bottom around images */
  image: number;
  /** Top/bottom around dotted section dividers (Figma ≈ 20–21px) */
  divider: number;
  /** Diameter of divider dots (Figma Line 49 ≈ 3px) */
  dotSize: number;
  /** Empty space between divider dots (Figma pitch 20 − size 3 ≈ 17px) */
  dotSpacing: number;
  /** Horizontal content padding (Figma text x=28) */
  padX: number;
  /** Email canvas width (Figma frame) */
  emailWidth: number;
  /** Default image max width */
  imageWidth: number;
};

export type NewsletterTypography = {
  sansSize: number;
  sansLineHeight: number;
  serifSize: number;
  serifLineHeight: number;
  metaSize: number;
  metaLineHeight: number;
  framedSize: number;
  framedLineHeight: number;
  footerSize: number;
  footerLineHeight: number;
  taglineSize: number;
  taglineLineHeight: number;
};

/**
 * @deprecated Prefer tagline / image / footerBar blocks.
 * Kept for migration of older drafts.
 */
export type NewsletterFooter = {
  note: string;
  links: { label: string; href: string }[];
  tagline?: string;
  logoSrc?: string;
  /** Full-bleed black bar (design footer) */
  dark: boolean;
};

export type NewsletterDraft = {
  subject: string;
  sections: Section[];
  /**
   * Legacy footer blob — migrated into blocks on load.
   * New drafts keep an empty stub.
   */
  footer: NewsletterFooter;
  colors: NewsletterColors;
  spacing: SpacingTokens;
  typography: NewsletterTypography;
  /** Desktop outline around the email frame. */
  frameBorder: FrameBorder;
  /**
   * Optional mobile overrides (merged over desktop).
   * Empty / omitted keys inherit desktop — only diverge when edited.
   */
  mobileSpacing?: Partial<SpacingTokens>;
  mobileTypography?: Partial<NewsletterTypography>;
  /**
   * Mobile frame border. When omitted, mobile has no outline (full-bleed).
   * Set explicitly to enable / diverge from desktop.
   */
  mobileFrameBorder?: Partial<FrameBorder>;
  /**
   * @deprecated Dividers are rendered as HTML dots (`colors.divider`).
   * Kept so older drafts still load.
   */
  dividerSrc: string;
};

/** CSS px breakpoint for email mobile overrides / preview. */
export const EMAIL_MOBILE_BREAKPOINT = 480;
/** Reference content canvas for mobile preview / dot counts (matches builder iframe). */
export const EMAIL_MOBILE_WIDTH = 390;

/** Default framed title box (Figma content width). */
export const DEFAULT_FRAMED_BOX_WIDTH = 402;
export const DEFAULT_FRAMED_BOX_HEIGHT = 52;
export const DEFAULT_FRAMED_BORDER = 2;

export function resolveMobileSpacing(draft: NewsletterDraft): SpacingTokens {
  return { ...draft.spacing, ...draft.mobileSpacing };
}

export function resolveMobileTypography(
  draft: NewsletterDraft,
): NewsletterTypography {
  return { ...draft.typography, ...draft.mobileTypography };
}

export const defaultFrameBorder: FrameBorder = {
  color: "#000000",
  width: 2,
  top: false,
  right: false,
  bottom: false,
  left: false,
};

export function resolveFrameBorder(
  draft: NewsletterDraft,
  mode: "desktop" | "mobile" = "desktop",
): FrameBorder {
  const desktop = { ...defaultFrameBorder, ...draft.frameBorder };
  if (mode === "desktop") return desktop;
  // No mobile config → full-bleed (no outline), keep color/width for when sides are enabled.
  if (!draft.mobileFrameBorder) {
    return {
      ...desktop,
      top: false,
      right: false,
      bottom: false,
      left: false,
    };
  }
  return { ...desktop, ...draft.mobileFrameBorder };
}

export type BrevoSendPayload = {
  subject: string;
  htmlContent: string;
  to?: { email: string; name?: string }[];
  listIds?: number[];
};

/** Values measured from Figma frame 123:404 (458×8479). */
export const defaultSpacing: SpacingTokens = {
  text: 23,
  image: 20,
  divider: 20,
  dotSize: 3,
  dotSpacing: 17,
  padX: 28,
  emailWidth: 458,
  imageWidth: 402,
};

export const defaultColors: NewsletterColors = {
  backgroundCard: "#ffffff",
  sideColor: "#f5f5f7",
  body: "#000000",
  meta: "#000000",
  framedBorder: "#000000",
  divider: "#000000",
  footerBg: "#000000",
  footerText: "#ffffff",
};

export const defaultTypography: NewsletterTypography = {
  // Intro: Helvetica Neue 18 / 23
  sansSize: 18,
  sansLineHeight: 23 / 18,
  // Body essays: Georgia 17 / 23
  serifSize: 17,
  serifLineHeight: 23 / 17,
  // Meta: Helvetica Neue 10
  metaSize: 10,
  metaLineHeight: 1.2,
  // Framed title: Helvetica Neue 28 / 29
  framedSize: 28,
  framedLineHeight: 29 / 28,
  // Footer: Georgia ~12 / 1.5
  footerSize: 12,
  footerLineHeight: 1.5,
  // Tagline: Helvetica Neue ~12.6 / 1.2
  taglineSize: 13,
  taglineLineHeight: 1.2,
};

export const emptyFooter: NewsletterFooter = {
  note: "",
  links: [],
  dark: true,
};

export function resolveSpacing(
  block: BodyBlock,
  tokens: SpacingTokens,
  mode: "desktop" | "mobile" = "desktop",
): BlockSpacing {
  const pad = tokens.padX;
  let defaults: BlockSpacing;
  if (block.type === "image") {
    const w =
      mode === "mobile"
        ? (block.mobileWidth ?? block.width ?? tokens.imageWidth)
        : (block.width ?? tokens.imageWidth);
    const side = Math.max(0, Math.round((tokens.emailWidth - w) / 2));
    defaults = {
      top: tokens.image,
      bottom: tokens.image,
      left: side,
      right: side,
    };
  } else if (block.type === "divider") {
    defaults = {
      top: tokens.divider,
      bottom: tokens.divider,
      left: pad,
      right: pad,
    };
  } else if (block.type === "footerBar") {
    defaults = { top: 28, bottom: 28, left: pad, right: pad };
  } else if (block.type === "tagline") {
    defaults = { top: 24, bottom: 8, left: pad, right: pad };
  } else if (block.type === "meta") {
    defaults = { top: 0, bottom: tokens.text, left: pad, right: pad };
  } else {
    defaults = { top: 0, bottom: tokens.text, left: pad, right: pad };
  }

  const patch =
    mode === "mobile"
      ? { ...block.spacing, ...block.mobileSpacing }
      : block.spacing;

  return {
    top: patch?.top ?? defaults.top,
    bottom: patch?.bottom ?? defaults.bottom,
    left: patch?.left ?? defaults.left,
    right: patch?.right ?? defaults.right,
  };
}

export function resolveFramedTitle(
  block: FramedTitleBlock,
  mode: "desktop" | "mobile" = "desktop",
): {
  borderWidth: number;
  boxWidth: number;
  boxHeight: number;
} {
  const desktop = {
    borderWidth: block.borderWidth ?? block.width ?? DEFAULT_FRAMED_BORDER,
    boxWidth: block.boxWidth ?? DEFAULT_FRAMED_BOX_WIDTH,
    boxHeight:
      block.boxHeight ?? block.height ?? DEFAULT_FRAMED_BOX_HEIGHT,
  };
  if (mode === "desktop") return desktop;
  return {
    borderWidth: block.mobileBorderWidth ?? desktop.borderWidth,
    boxWidth: block.mobileBoxWidth ?? desktop.boxWidth,
    boxHeight: block.mobileBoxHeight ?? desktop.boxHeight,
  };
}

export function resolveImageFullBleed(
  block: ImageBlock,
  mode: "desktop" | "mobile" = "desktop",
): boolean {
  if (mode === "mobile") {
    return block.mobileFullBleed ?? Boolean(block.fullBleed);
  }
  return Boolean(block.fullBleed);
}
