export type BodyBlock =
  | { id: string; type: "paragraph"; html: string }
  | { id: string; type: "image"; src: string; alt: string };

export type NewsletterColors = {
  /** Background 1 — card / content area (often white) */
  backgroundCard: string;
  /** Background 2 — full outer background behind the card */
  backgroundOuter: string;
  logo: string;
  tagline: string;
  label: string;
  title: string;
  body: string;
  footer: string;
  footerRule: string;
};

export type TextStyle = {
  fontSize: number;
  lineHeight: number;
};

export type NewsletterTypography = {
  label: TextStyle;
  title: TextStyle;
  body: TextStyle;
  footer: TextStyle;
};

export type NewsletterDraft = {
  logoSrc: string;
  taglineSrc: string;
  coverSrc: string;
  coverAlt: string;
  label: string;
  title: string;
  blocks: BodyBlock[];
  socials: { label: string; href: string }[];
  footerNote: string;
  colors: NewsletterColors;
  typography: NewsletterTypography;
};

export type BrevoSendPayload = {
  subject: string;
  htmlContent: string;
  to?: { email: string; name?: string }[];
  listIds?: number[];
};

export const defaultColors: NewsletterColors = {
  backgroundCard: "#ffffff",
  backgroundOuter: "#f3f3f3",
  logo: "#000000",
  tagline: "#000000",
  label: "#000000",
  title: "#000000",
  body: "#000000",
  footer: "#333333",
  footerRule: "#000000",
};

export const defaultTypography: NewsletterTypography = {
  label: { fontSize: 20, lineHeight: 1.35 },
  title: { fontSize: 43, lineHeight: 1 },
  body: { fontSize: 25, lineHeight: 1.35 },
  footer: { fontSize: 15, lineHeight: 1.45 },
};
