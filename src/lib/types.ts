/** Vertical padding in px (email-safe). */
export type BlockSpacing = {
  top: number;
  bottom: number;
};

export type TextAlign = "left" | "center";
export type SectionFont = "sans" | "serif";

export type ImageBlock = {
  id: string;
  type: "image";
  src: string;
  alt: string;
  /** Display width in px (Figma). Defaults to content width. */
  width?: number;
  /**
   * Edge-to-edge: zero side padding + vertical gaps, image spans email width.
   */
  fullBleed?: boolean;
  /** Override default image gaps; omit to use global tokens. */
  spacing?: Partial<BlockSpacing>;
};

export type TextBlock = {
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
  spacing?: Partial<BlockSpacing>;
};

/** SEIZOEN … | NIEUWSBRIEF … row */
export type MetaBlock = {
  id: string;
  type: "meta";
  left: string;
  right: string;
  spacing?: Partial<BlockSpacing>;
};

/** Boxed title like “Anatomie van aanraking” — Helvetica 28 / border 2px in Figma */
export type FramedTitleBlock = {
  id: string;
  type: "framedTitle";
  html: string;
  /** Border thickness in px. Defaults to 2. */
  width?: number;
  /** Box height in px. Omit to size from content + padding. */
  height?: number;
  spacing?: Partial<BlockSpacing>;
};

/** Dotted separator (Figma Line 49 PNG). */
export type DividerBlock = {
  id: string;
  type: "divider";
  spacing?: Partial<BlockSpacing>;
};

export type BodyBlock =
  | ImageBlock
  | TextBlock
  | MetaBlock
  | FramedTitleBlock
  | DividerBlock;

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

export type SpacingTokens = {
  /** Default gap under text blocks (= one Georgia empty line ≈ 23px) */
  text: number;
  /** Default top/bottom around images */
  image: number;
  /** Top/bottom around dotted section dividers (Figma ≈ 20–21px) */
  divider: number;
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
  footer: NewsletterFooter;
  colors: NewsletterColors;
  spacing: SpacingTokens;
  typography: NewsletterTypography;
  /**
   * Optional mobile overrides (merged over desktop).
   * Empty / omitted keys inherit desktop — only diverge when edited.
   */
  mobileSpacing?: Partial<SpacingTokens>;
  mobileTypography?: Partial<NewsletterTypography>;
  /** Path to Figma dotted divider PNG */
  dividerSrc: string;
};

/** CSS px breakpoint for email mobile overrides / preview. */
export const EMAIL_MOBILE_BREAKPOINT = 480;

export function resolveMobileSpacing(draft: NewsletterDraft): SpacingTokens {
  return { ...draft.spacing, ...draft.mobileSpacing };
}

export function resolveMobileTypography(
  draft: NewsletterDraft,
): NewsletterTypography {
  return { ...draft.typography, ...draft.mobileTypography };
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

export function resolveSpacing(
  block: BodyBlock,
  tokens: SpacingTokens,
): BlockSpacing {
  const defaults: BlockSpacing =
    block.type === "image"
      ? { top: tokens.image, bottom: tokens.image }
      : block.type === "divider"
        ? { top: tokens.divider, bottom: tokens.divider }
        : { top: 0, bottom: tokens.text };

  return {
    top: block.spacing?.top ?? defaults.top,
    bottom: block.spacing?.bottom ?? defaults.bottom,
  };
}
