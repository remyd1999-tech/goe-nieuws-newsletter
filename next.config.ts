import type { NextConfig } from "next";

const repoName = "goe-nieuws-newsletter";
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  // Static export only for GitHub Pages (no API routes there).
  // Local / Vercel keep Node so /api/send (Brevo) works.
  ...(isGithubPages ? { output: "export" as const } : {}),
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
