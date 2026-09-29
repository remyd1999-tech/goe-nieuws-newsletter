import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import type { NewsletterDraft } from "@/lib/types";

export const runtime = "nodejs";

const DATA_URL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

type Body = {
  draft?: NewsletterDraft;
};

function extFromMime(mime: string): string {
  return MIME_EXT[mime.toLowerCase()] || "bin";
}

function materializeDataUrl(
  src: string,
  cache: Map<string, string>,
  written: string[],
): string | null {
  if (!src.startsWith("data:")) return null;
  const cached = cache.get(src);
  if (cached) return cached;

  const match = DATA_URL_RE.exec(src);
  if (!match) return null;

  const mime = match[1];
  const b64 = match[2].replace(/\s/g, "");
  let buffer: Buffer;
  try {
    buffer = Buffer.from(b64, "base64");
  } catch {
    return null;
  }
  if (!buffer.length) return null;

  const hash = createHash("sha1").update(buffer).digest("hex").slice(0, 10);
  const rel = `/assets/upload-${hash}.${extFromMime(mime)}`;
  cache.set(src, rel);
  written.push(rel);
  return rel;
}

async function flushWrites(
  cache: Map<string, string>,
  assetsDir: string,
): Promise<void> {
  // Invert: path -> first data url that maps to it (we stored buffer via re-parse)
  const byPath = new Map<string, string>();
  for (const [dataUrl, rel] of cache) {
    if (!byPath.has(rel)) byPath.set(rel, dataUrl);
  }

  await mkdir(assetsDir, { recursive: true });

  await Promise.all(
    [...byPath.entries()].map(async ([rel, dataUrl]) => {
      const match = DATA_URL_RE.exec(dataUrl);
      if (!match) return;
      const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
      const filePath = path.join(assetsDir, path.basename(rel));
      await writeFile(filePath, buffer);
    }),
  );
}

function rewriteDraft(
  draft: NewsletterDraft,
  cache: Map<string, string>,
  written: string[],
): NewsletterDraft {
  const replace = (src: string | undefined): string | undefined => {
    if (!src) return src;
    const next = materializeDataUrl(src, cache, written);
    return next ?? src;
  };

  return {
    ...draft,
    dividerSrc: replace(draft.dividerSrc) ?? draft.dividerSrc,
    sections: draft.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block) => {
        if (block.type === "image") {
          return { ...block, src: replace(block.src) ?? block.src };
        }
        return block;
      }),
    })),
  };
}

/**
 * Dev-only: write data-URL images from the browser draft into public/assets/
 * so they can be committed and served from GitHub Pages.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, message: "Only available in local development." },
      { status: 403 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!body.draft?.sections) {
    return NextResponse.json(
      { ok: false, message: "draft is required." },
      { status: 400 },
    );
  }

  const cache = new Map<string, string>();
  const written: string[] = [];
  const nextDraft = rewriteDraft(body.draft, cache, written);

  if (!cache.size) {
    return NextResponse.json({
      ok: true,
      message: "No data-URL images found in draft.",
      files: [],
      draft: nextDraft,
    });
  }

  const assetsDir = path.join(process.cwd(), "public", "assets");
  try {
    await flushWrites(cache, assetsDir);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Write failed";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }

  const uniqueFiles = [...new Set(written)];
  return NextResponse.json({
    ok: true,
    message: `Wrote ${uniqueFiles.length} image(s) to public/assets/.`,
    files: uniqueFiles,
    draft: nextDraft,
  });
}
