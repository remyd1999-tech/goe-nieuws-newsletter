"use client";

import { useEffect, useState } from "react";
import type {
  BodyBlock,
  NewsletterColors,
  NewsletterDraft,
  NewsletterTypography,
  TextStyle,
} from "@/lib/types";
import { buildNewsletterHtml } from "@/lib/email-template";
import { sampleDraft } from "@/lib/sample-draft";
import { ParagraphEditor } from "@/components/ParagraphEditor";

function newId(): string {
  return crypto.randomUUID();
}

function resolveAssetBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (typeof window === "undefined") {
    return configured;
  }
  // Fallback if env wasn't baked in: detect project Pages path
  const detected =
    configured ||
    (window.location.pathname.startsWith("/goe-nieuws-newsletter")
      ? "/goe-nieuws-newsletter"
      : "");
  return `${window.location.origin}${detected}`;
}

export function NewsletterBuilder() {
  const [draft, setDraft] = useState<NewsletterDraft>(sampleDraft);
  const [copied, setCopied] = useState(false);
  const [html, setHtml] = useState(() => buildNewsletterHtml(sampleDraft));

  useEffect(() => {
    setHtml(
      buildNewsletterHtml(draft, { absoluteBaseUrl: resolveAssetBaseUrl() }),
    );
  }, [draft]);

  function updateField<K extends keyof NewsletterDraft>(
    key: K,
    value: NewsletterDraft[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updateColor<K extends keyof NewsletterColors>(
    key: K,
    value: NewsletterColors[K],
  ) {
    setDraft((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  }

  function updateTypography(
    key: keyof NewsletterTypography,
    patch: Partial<TextStyle>,
  ) {
    setDraft((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: { ...prev.typography[key], ...patch },
      },
    }));
  }

  function updateBlock(id: string, patch: Partial<BodyBlock>) {
    setDraft((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === id ? ({ ...block, ...patch } as BodyBlock) : block,
      ),
    }));
  }

  function addParagraph() {
    setDraft((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        { id: newId(), type: "paragraph", html: "<p></p>" },
      ],
    }));
  }

  function addImage() {
    setDraft((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        {
          id: newId(),
          type: "image",
          src: "/assets/image-1.jpg",
          alt: "Illustration",
        },
      ],
    }));
  }

  function removeBlock(id: string) {
    setDraft((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
  }

  function moveBlock(id: string, direction: -1 | 1) {
    setDraft((prev) => {
      const index = prev.blocks.findIndex((b) => b.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.blocks.length) return prev;
      const blocks = [...prev.blocks];
      const [item] = blocks.splice(index, 1);
      blocks.splice(target, 0, item);
      return { ...prev, blocks };
    });
  }

  async function copyHtml() {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="min-h-screen bg-[#ececec] text-black">
      <header className="border-b border-black/15 bg-white">
        <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-end justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/60">
              Goe Nieuws
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              Newsletter builder
            </h1>
            <p className="mt-1 max-w-xl text-sm text-black/70">
              Edit this month’s issue · live preview · email-ready HTML. Brevo
              comes next.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDraft(sampleDraft)}
              className="border border-black bg-white px-3 py-2 text-sm hover:bg-black hover:text-white"
            >
              Reset sample
            </button>
            <button
              type="button"
              onClick={copyHtml}
              className="border border-black bg-black px-3 py-2 text-sm text-white hover:bg-white hover:text-black"
            >
              {copied ? "HTML copied" : "Copy HTML"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1800px] gap-6 overflow-x-auto px-5 py-6 lg:grid-cols-[360px_minmax(680px,1fr)]">
        <section className="space-y-5 self-start border border-black/15 bg-white p-5">
          <Field
            label="Label"
            value={draft.label}
            onChange={(v) => updateField("label", v)}
          />
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-black/55">
              Title
            </span>
            <ParagraphEditor
              value={draft.title}
              onChange={(html) => updateField("title", html)}
              placeholder="Write the title… select words to format"
              compact
            />
          </label>
          <Field
            label="Cover image URL"
            value={draft.coverSrc}
            onChange={(v) => updateField("coverSrc", v)}
          />
          <Field
            label="Logo URL"
            value={draft.logoSrc}
            onChange={(v) => updateField("logoSrc", v)}
          />
          <Field
            label="Tagline image URL"
            value={draft.taglineSrc}
            onChange={(v) => updateField("taglineSrc", v)}
          />

          <div className="border-t border-black/10 pt-4">
            <h2 className="mb-3 text-lg font-bold">Colors</h2>
            <div className="grid grid-cols-2 gap-3">
              <ColorField
                label="Background 1 (card)"
                value={draft.colors.backgroundCard}
                onChange={(v) => updateColor("backgroundCard", v)}
              />
              <ColorField
                label="Background 2 (outer)"
                value={draft.colors.backgroundOuter}
                onChange={(v) => updateColor("backgroundOuter", v)}
              />
              <ColorField
                label="Logo"
                value={draft.colors.logo}
                onChange={(v) => updateColor("logo", v)}
              />
              <ColorField
                label="Tagline"
                value={draft.colors.tagline}
                onChange={(v) => updateColor("tagline", v)}
              />
              <ColorField
                label="Label"
                value={draft.colors.label}
                onChange={(v) => updateColor("label", v)}
              />
              <ColorField
                label="Title"
                value={draft.colors.title}
                onChange={(v) => updateColor("title", v)}
              />
              <ColorField
                label="Body"
                value={draft.colors.body}
                onChange={(v) => updateColor("body", v)}
              />
              <ColorField
                label="Footer / links"
                value={draft.colors.footer}
                onChange={(v) => updateColor("footer", v)}
              />
              <ColorField
                label="Footer rule"
                value={draft.colors.footerRule}
                onChange={(v) => updateColor("footerRule", v)}
              />
            </div>
            <p className="mt-2 text-xs text-black/55">
              Logo / tagline tint uses CSS mask in preview. Some email clients
              may need a pre-colored asset when sending.
            </p>
          </div>

          <div className="border-t border-black/10 pt-4">
            <h2 className="mb-3 text-lg font-bold">Type size & leading</h2>
            <div className="space-y-3">
              <TypeStyleField
                label="Label"
                value={draft.typography.label}
                onChange={(patch) => updateTypography("label", patch)}
              />
              <TypeStyleField
                label="Title"
                value={draft.typography.title}
                onChange={(patch) => updateTypography("title", patch)}
              />
              <TypeStyleField
                label="Body"
                value={draft.typography.body}
                onChange={(patch) => updateTypography("body", patch)}
              />
              <TypeStyleField
                label="Footer"
                value={draft.typography.footer}
                onChange={(patch) => updateTypography("footer", patch)}
              />
            </div>
          </div>

          <div className="border-t border-black/10 pt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Body</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addParagraph}
                  className="border border-black px-2 py-1 text-xs hover:bg-black hover:text-white"
                >
                  + Paragraph
                </button>
                <button
                  type="button"
                  onClick={addImage}
                  className="border border-black px-2 py-1 text-xs hover:bg-black hover:text-white"
                >
                  + Image
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {draft.blocks.map((block, index) => (
                <div
                  key={block.id}
                  className="border border-black/15 bg-[#fafafa] p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wide text-black/55">
                      {block.type} · {index + 1}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(block.id, -1)}
                        className="border border-black/30 px-1.5 py-0.5 text-xs"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(block.id, 1)}
                        className="border border-black/30 px-1.5 py-0.5 text-xs"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="border border-black/30 px-1.5 py-0.5 text-xs"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {block.type === "paragraph" ? (
                    <ParagraphEditor
                      value={block.html}
                      onChange={(html) => updateBlock(block.id, { html })}
                    />
                  ) : (
                    <div className="space-y-2">
                      <Field
                        label="Image URL"
                        value={block.src}
                        onChange={(v) => updateBlock(block.id, { src: v })}
                      />
                      <Field
                        label="Alt text"
                        value={block.alt}
                        onChange={(v) => updateBlock(block.id, { alt: v })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-black/10 pt-4">
            <h2 className="mb-2 text-lg font-bold">Footer</h2>
            <Field
              label="Footer note"
              value={draft.footerNote}
              onChange={(v) => updateField("footerNote", v)}
            />
            <p className="mt-2 text-xs text-black/55">
              Select a word → Bold / Italic / Underline. Unsubscribe uses{" "}
              <code className="bg-black/5 px-1">{"{{ unsubscribe }}"}</code>.
            </p>
          </div>
        </section>

        <section className="min-h-[80vh] min-w-[680px] overflow-auto border border-black/15 bg-[#d8d8d8]">
          <div className="border-b border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.14em] text-black/60">
            Email preview · real size (600px)
          </div>
          <iframe
            title="Newsletter preview"
            srcDoc={html}
            className="h-[calc(100%-2rem)] min-h-[80vh] w-full min-w-[680px] bg-[#f3f3f3]"
          />
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-black/55">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-black/20 bg-white px-2 py-2 font-serif text-sm outline-none focus:border-black"
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-black/55">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={normalizeHex(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer border border-black/20 bg-white p-0.5"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-black/20 bg-white px-2 py-1.5 font-mono text-xs outline-none focus:border-black"
        />
      </div>
    </label>
  );
}

function TypeStyleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TextStyle;
  onChange: (patch: Partial<TextStyle>) => void;
}) {
  return (
    <div className="border border-black/15 bg-[#fafafa] p-3">
      <p className="mb-2 text-xs uppercase tracking-[0.12em] text-black/55">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] text-black/50">
            Size (px)
          </span>
          <input
            type="number"
            min={10}
            max={72}
            step={1}
            value={value.fontSize}
            onChange={(e) =>
              onChange({ fontSize: Number(e.target.value) || value.fontSize })
            }
            className="w-full border border-black/20 bg-white px-2 py-1.5 font-mono text-sm outline-none focus:border-black"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] text-black/50">
            Leading
          </span>
          <input
            type="number"
            min={0.8}
            max={2.5}
            step={0.05}
            value={value.lineHeight}
            onChange={(e) =>
              onChange({
                lineHeight: Number(e.target.value) || value.lineHeight,
              })
            }
            className="w-full border border-black/20 bg-white px-2 py-1.5 font-mono text-sm outline-none focus:border-black"
          />
        </label>
      </div>
    </div>
  );
}

function normalizeHex(value: string): string {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return "#000000";
}
