"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  BodyBlock,
  BlockSpacing,
  FrameBorder,
  NewsletterColors,
  NewsletterDraft,
  NewsletterTypography,
  Section,
  SectionFont,
  SpacingTokens,
} from "@/lib/types";
import {
  defaultFrameBorder,
  defaultSpacing,
  DEFAULT_FRAMED_BORDER,
  DEFAULT_FRAMED_BOX_HEIGHT,
  DEFAULT_FRAMED_BOX_WIDTH,
  EMAIL_MOBILE_BREAKPOINT,
  EMAIL_MOBILE_WIDTH,
  resolveFrameBorder,
  resolveImageFullBleed,
  resolveMobileSpacing,
  resolveMobileTypography,
  resolveSpacing,
} from "@/lib/types";
import { buildNewsletterHtml } from "@/lib/email-template";
import {
  clearDraft,
  downloadDraftJson,
  loadDraft,
  parseDraftJson,
  saveDraft,
} from "@/lib/draft-storage";
import { sampleDraft } from "@/lib/sample-draft";
import { ParagraphEditor } from "@/components/ParagraphEditor";

type PreviewMode = "desktop" | "mobile";

/** Wait after last edit before writing localStorage — avoids thrashing while typing. */
const AUTOSAVE_MS = 700;

function newId(): string {
  return crypto.randomUUID();
}

function resolveAssetBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (typeof window === "undefined") return configured;
  const detected =
    configured ||
    (window.location.pathname.startsWith("/goe-nieuws-newsletter")
      ? "/goe-nieuws-newsletter"
      : "");
  return `${window.location.origin}${detected}`;
}

export function NewsletterBuilder() {
  const [draft, setDraft] = useState<NewsletterDraft>(sampleDraft);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [statusOk, setStatusOk] = useState<string | null>(null);
  const [html, setHtml] = useState(() => buildNewsletterHtml(sampleDraft));
  const [sendEmails, setSendEmails] = useState("");
  const [sendListId, setSendListId] = useState("");
  const [brevoStatus, setBrevoStatus] = useState<string | null>(null);
  const [brevoConfigured, setBrevoConfigured] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [materializing, setMaterializing] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [previewHtml, setPreviewHtml] = useState(() =>
    buildNewsletterHtml(sampleDraft, { interactive: true }),
  );
  const [selectedEditorId, setSelectedEditorId] = useState<string | null>(
    null,
  );
  const draftRef = useRef(draft);
  const importInputRef = useRef<HTMLInputElement>(null);
  const selectClearTimerRef = useRef<number | null>(null);
  draftRef.current = draft;

  useEffect(() => {
    const savedDraft = loadDraft();
    if (savedDraft) setDraft(savedDraft);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const timer = window.setTimeout(() => {
      const result = saveDraft(draft);
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      setSaveError(null);
    }, AUTOSAVE_MS);

    return () => window.clearTimeout(timer);
  }, [draft, ready]);

  useEffect(() => {
    function flush() {
      if (!ready) return;
      saveDraft(draftRef.current);
    }
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [ready]);

  useEffect(() => {
    // Copy / Brevo HTML may use the public Pages URL so emails resolve images.
    // Preview must use the current origin so freshly materialized /assets/*
    // files load from local `public/` before they are deployed.
    const exportBase =
      process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "") ||
      resolveAssetBaseUrl();
    const previewBase = resolveAssetBaseUrl();
    setHtml(buildNewsletterHtml(draft, { absoluteBaseUrl: exportBase }));
    setPreviewHtml(
      buildNewsletterHtml(draft, {
        absoluteBaseUrl: previewBase,
        interactive: true,
      }),
    );
  }, [draft]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.source !== "gn-preview" || data.type !== "select") {
        return;
      }
      const editorId =
        typeof data.blockId === "string"
          ? `editor-block-${data.blockId}`
          : null;
      if (!editorId) return;
      setSelectedEditorId(editorId);
      if (selectClearTimerRef.current != null) {
        window.clearTimeout(selectClearTimerRef.current);
      }
      // Hold highlight ~500ms, then CSS transition fades the outline out.
      selectClearTimerRef.current = window.setTimeout(() => {
        setSelectedEditorId(null);
        selectClearTimerRef.current = null;
      }, 500);
      requestAnimationFrame(() => {
        const el = document.getElementById(editorId);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      if (selectClearTimerRef.current != null) {
        window.clearTimeout(selectClearTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    fetch(`${base}/api/send`)
      .then((r) => r.json())
      .then((d: { configured?: boolean; defaultListId?: number | null }) => {
        setBrevoConfigured(Boolean(d.configured));
        if (d.defaultListId) setSendListId(String(d.defaultListId));
      })
      .catch(() => setBrevoConfigured(false));
  }, []);

  function updateSection(id: string, patch: Partial<Section>) {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    }));
  }

  function updateBlock(
    sectionId: string,
    blockId: string,
    patch: Partial<BodyBlock>,
  ) {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          blocks: s.blocks.map((b) =>
            b.id === blockId ? ({ ...b, ...patch } as BodyBlock) : b,
          ),
        };
      }),
    }));
  }

  /** Read effective block padding for the current preview mode. */
  function blockPad(block: BodyBlock): BlockSpacing {
    const tokens =
      previewMode === "mobile"
        ? resolveMobileSpacing(draft)
        : draft.spacing;
    return resolveSpacing(
      block,
      tokens,
      previewMode === "mobile" ? "mobile" : "desktop",
    );
  }

  function setBlockPad(
    sectionId: string,
    blockId: string,
    spacing: BlockSpacing,
  ) {
    if (previewMode === "mobile") {
      updateBlock(sectionId, blockId, { mobileSpacing: spacing });
    } else {
      updateBlock(sectionId, blockId, { spacing });
    }
  }

  function addSection() {
    setDraft((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: newId(),
          font: "sans",
          blocks: [
            {
              id: newId(),
              type: "text",
              html: "<p></p>",
              align: "left",
            },
          ],
        },
      ],
    }));
  }

  function removeSection(id: string) {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
    }));
  }

  function moveSection(id: string, direction: -1 | 1) {
    setDraft((prev) => {
      const index = prev.sections.findIndex((s) => s.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.sections.length) return prev;
      const sections = [...prev.sections];
      const [item] = sections.splice(index, 1);
      sections.splice(target, 0, item);
      return { ...prev, sections };
    });
  }

  function addBlock(sectionId: string, type: BodyBlock["type"]) {
    const pad = draft.spacing.padX;
    const block: BodyBlock =
      type === "image"
        ? {
            id: newId(),
            type: "image",
            src: "",
            alt: "",
            spacing: {
              top: draft.spacing.image,
              bottom: draft.spacing.image,
            },
          }
        : type === "meta"
          ? {
              id: newId(),
              type: "meta",
              left: "SEIZOEN 01 — AANRAKING",
              right: "NIEUWSBRIEF 01",
            }
          : type === "framedTitle"
            ? {
                id: newId(),
                type: "framedTitle",
                html: "<p>Title</p>",
                borderWidth: DEFAULT_FRAMED_BORDER,
                boxWidth: DEFAULT_FRAMED_BOX_WIDTH,
                boxHeight: DEFAULT_FRAMED_BOX_HEIGHT,
              }
            : type === "divider"
              ? {
                  id: newId(),
                  type: "divider",
                  spacing: {
                    top: draft.spacing.divider,
                    bottom: draft.spacing.divider,
                    left: pad,
                    right: pad,
                  },
                }
              : type === "tagline"
                ? {
                    id: newId(),
                    type: "tagline",
                    text: "gemeenschap voor reflectie en actie",
                    spacing: {
                      top: 24,
                      bottom: 8,
                      left: pad,
                      right: pad,
                    },
                  }
                : type === "footerBar"
                  ? {
                      id: newId(),
                      type: "footerBar",
                      note: "Je ontvangt deze mail omdat je deel uitmaakt van de Goe Nieuws community.",
                      links: [
                        {
                          label: "Instagram",
                          href: "https://www.instagram.com/goe.nieuws/",
                        },
                        { label: "Unsubscribe", href: "" },
                      ],
                      dark: true,
                      spacing: {
                        top: 28,
                        bottom: 28,
                        left: pad,
                        right: pad,
                      },
                    }
                  : {
                      id: newId(),
                      type: "text",
                      html: "<p></p>",
                      align: "left",
                    };

    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, blocks: [...s.blocks, block] } : s,
      ),
    }));
  }

  function removeBlock(sectionId: string, blockId: string) {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) }
          : s,
      ),
    }));
  }

  function moveBlock(sectionId: string, blockId: string, direction: -1 | 1) {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const index = s.blocks.findIndex((b) => b.id === blockId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= s.blocks.length) return s;
        const blocks = [...s.blocks];
        const [item] = blocks.splice(index, 1);
        blocks.splice(target, 0, item);
        return { ...s, blocks };
      }),
    }));
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

  function updateSpacing(patch: Partial<SpacingTokens>) {
    setDraft((prev) => {
      if (previewMode === "mobile") {
        return {
          ...prev,
          mobileSpacing: { ...prev.mobileSpacing, ...patch },
        };
      }
      return {
        ...prev,
        spacing: { ...prev.spacing, ...patch },
      };
    });
  }

  function updateTypography(patch: Partial<NewsletterTypography>) {
    setDraft((prev) => {
      if (previewMode === "mobile") {
        return {
          ...prev,
          mobileTypography: { ...prev.mobileTypography, ...patch },
        };
      }
      return {
        ...prev,
        typography: { ...prev.typography, ...patch },
      };
    });
  }

  function updateFrameBorder(patch: Partial<FrameBorder>) {
    setDraft((prev) => {
      if (previewMode === "mobile") {
        return {
          ...prev,
          mobileFrameBorder: { ...prev.mobileFrameBorder, ...patch },
        };
      }
      return {
        ...prev,
        frameBorder: {
          ...defaultFrameBorder,
          ...prev.frameBorder,
          ...patch,
        },
      };
    });
  }

  function resetFrameBorder() {
    if (previewMode === "mobile") {
      setDraft((prev) => ({
        ...prev,
        mobileFrameBorder: undefined,
      }));
      return;
    }
    setDraft((prev) => ({
      ...prev,
      frameBorder: defaultFrameBorder,
    }));
  }

  function resetSpacing() {
    if (previewMode === "mobile") {
      setDraft((prev) => ({
        ...prev,
        mobileSpacing: undefined,
        sections: prev.sections.map((section) => ({
          ...section,
          blocks: section.blocks.map((block) => {
            const next = { ...block } as BodyBlock;
            let changed = false;
            if (next.mobileSpacing) {
              delete next.mobileSpacing;
              changed = true;
            }
            if (next.type === "image" && next.mobileWidth != null) {
              delete next.mobileWidth;
              changed = true;
            }
            if (next.type === "image" && next.mobileFullBleed != null) {
              delete next.mobileFullBleed;
              changed = true;
            }
            if (next.type === "framedTitle") {
              if (next.mobileBoxWidth != null) {
                delete next.mobileBoxWidth;
                changed = true;
              }
              if (next.mobileBoxHeight != null) {
                delete next.mobileBoxHeight;
                changed = true;
              }
              if (next.mobileBorderWidth != null) {
                delete next.mobileBorderWidth;
                changed = true;
              }
            }
            return changed ? next : block;
          }),
        })),
      }));
      return;
    }
    updateSpacing(defaultSpacing);
  }

  function resetTypography() {
    if (previewMode === "mobile") {
      setDraft((prev) => ({
        ...prev,
        mobileTypography: undefined,
      }));
    }
  }

  async function copyHtml() {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function persistDraft(next: NewsletterDraft, flash = false) {
    const result = saveDraft(next);
    if (!result.ok) {
      setSaveError(result.error);
      setSaved(false);
      window.setTimeout(() => setSaveError(null), 4000);
      return false;
    }
    setSaveError(null);
    if (flash) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    }
    return true;
  }

  function handleSave() {
    persistDraft(draft, true);
  }

  function handleExport() {
    downloadDraftJson(draft);
  }

  function countDataUrlImages(d: NewsletterDraft): number {
    let n = 0;
    if (d.dividerSrc?.startsWith("data:")) n += 1;
    for (const section of d.sections) {
      for (const block of section.blocks) {
        if (block.type === "image" && block.src.startsWith("data:")) n += 1;
      }
    }
    return n;
  }

  async function handleMaterializeImages() {
    setMaterializing(true);
    setSaveError(null);
    try {
      const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
      const res = await fetch(`${base}/api/materialize-images`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draft }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        files?: string[];
        draft?: NewsletterDraft;
      };
      if (!res.ok || !data.ok || !data.draft) {
        setSaveError(data.message || "Could not save images to disk.");
        window.setTimeout(() => setSaveError(null), 5000);
        return;
      }
      setDraft(data.draft);
      persistDraft(data.draft, true);
      const msg = data.files?.length
        ? `Saved ${data.files.length} image(s) to public/assets/`
        : data.message || "No data-URL images found.";
      setStatusOk(msg);
      setBrevoStatus(msg);
      window.setTimeout(() => {
        setStatusOk(null);
        setBrevoStatus(null);
      }, 6000);
    } catch {
      setSaveError("Could not reach /api/materialize-images.");
      window.setTimeout(() => setSaveError(null), 5000);
    } finally {
      setMaterializing(false);
    }
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    try {
      const raw = await file.text();
      const imported = parseDraftJson(raw);
      if (!imported) {
        setSaveError("Invalid draft JSON.");
        window.setTimeout(() => setSaveError(null), 4000);
        return;
      }
      setDraft(imported);
      persistDraft(imported, true);
    } catch {
      setSaveError("Could not read that file.");
      window.setTimeout(() => setSaveError(null), 4000);
    }
  }

  function handleReset() {
    clearDraft();
    setDraft(sampleDraft);
    setSaved(false);
    setSaveError(null);
  }

  async function sendBrevo(mode: "test" | "list") {
    setSending(true);
    setBrevoStatus(null);
    try {
      const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
      const payload: Record<string, unknown> = {
        subject: draft.subject,
        htmlContent: html,
      };
      if (mode === "test") {
        payload.emails = sendEmails;
      } else {
        const id = Number(sendListId);
        if (!Number.isFinite(id)) {
          setBrevoStatus("Invalid list id.");
          return;
        }
        payload.listIds = [id];
      }
      const res = await fetch(`${base}/api/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      setBrevoStatus(data.message || (data.ok ? "Sent." : "Send failed."));
    } catch {
      setBrevoStatus(
        "Send failed — API unavailable (GitHub Pages is static). Use local or Vercel.",
      );
    } finally {
      setSending(false);
    }
  }

  const displaySpacing =
    previewMode === "mobile" ? resolveMobileSpacing(draft) : draft.spacing;
  const displayTypography =
    previewMode === "mobile"
      ? resolveMobileTypography(draft)
      : draft.typography;
  const displayFrameBorder = resolveFrameBorder(
    draft,
    previewMode === "mobile" ? "mobile" : "desktop",
  );

  // Desktop iframe must be wider than the email @media breakpoint so mobile
  // CSS does not apply; mobile iframe is phone-width so it does.
  const previewWidth =
    previewMode === "mobile"
      ? EMAIL_MOBILE_WIDTH
      : Math.max(
          draft.spacing.emailWidth + 64,
          EMAIL_MOBILE_BREAKPOINT + 40,
        );

  function syncPreviewHeight(frame: HTMLIFrameElement | null) {
    if (!frame) return;
    const doc = frame.contentDocument;
    if (!doc?.body) return;
    const height = Math.max(
      doc.body.scrollHeight,
      doc.documentElement.scrollHeight,
    );
    frame.style.height = `${height}px`;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <header className="shrink-0 border-b border-[var(--separator)] bg-white/72 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-6 px-6 py-3.5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-[0.02em] text-[var(--text-tertiary)]">
              Goe Nieuws
            </p>
            <h1 className="truncate text-[17px] font-semibold tracking-[-0.02em]">
              Newsletter
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {saveError ? (
              <p className="max-w-[220px] truncate text-[12px] text-red-600">
                {saveError}
              </p>
            ) : statusOk ? (
              <p className="max-w-[280px] truncate text-[12px] text-emerald-700">
                {statusOk}
              </p>
            ) : null}
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                void handleImportFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={handleReset}
              className="rounded-[var(--radius-sm)] bg-[var(--fill)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--fill-hover)] active:bg-[var(--fill-active)]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleImportClick}
              className="rounded-[var(--radius-sm)] bg-[var(--fill)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--fill-hover)] active:bg-[var(--fill-active)]"
            >
              Import
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-[var(--radius-sm)] bg-[var(--fill)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--fill-hover)] active:bg-[var(--fill-active)]"
            >
              Export
            </button>
            {countDataUrlImages(draft) > 0 ? (
              <button
                type="button"
                disabled={materializing}
                onClick={() => void handleMaterializeImages()}
                className="rounded-[var(--radius-sm)] bg-[var(--fill)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--fill-hover)] active:bg-[var(--fill-active)] disabled:opacity-50"
              >
                {materializing
                  ? "Saving images…"
                  : `Save ${countDataUrlImages(draft)} image(s) to disk`}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              className="rounded-[var(--radius-sm)] bg-[var(--fill)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--fill-hover)] active:bg-[var(--fill-active)]"
            >
              {saved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={copyHtml}
              className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)] active:scale-[0.98]"
            >
              {copied ? "Copied" : "Copy HTML"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-0 w-full max-w-[1680px] flex-1 gap-5 px-5 py-5 lg:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="apple-scroll min-h-0 space-y-3 overflow-y-auto pr-1">
          <div className="rounded-[var(--radius)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
            <Field
              label="Subject"
              value={draft.subject}
              onChange={(v) => setDraft((p) => ({ ...p, subject: v }))}
            />
          </div>

          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <h2 className="text-[15px] font-semibold tracking-[-0.02em]">
              Sections
            </h2>
            <button
              type="button"
              onClick={addSection}
              className="rounded-md px-2 py-1 text-[12px] font-medium text-[var(--accent)] transition-opacity hover:opacity-70"
            >
              Add
            </button>
          </div>

          <div className="space-y-3">
              {draft.sections.map((section, sIndex) => (
                <div
                  key={section.id}
                  className="overflow-hidden rounded-[var(--radius)] bg-[#e8e8ed] shadow-[var(--shadow-sm)]"
                >
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <span className="text-[12px] font-semibold tracking-[-0.01em] text-[var(--text-secondary)]">
                      Section {sIndex + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <FontToggle
                        value={section.font}
                        onChange={(font) =>
                          updateSection(section.id, { font })
                        }
                      />
                      <IconButton
                        onClick={() => moveSection(section.id, -1)}
                        title="Move up"
                      >
                        ↑
                      </IconButton>
                      <IconButton
                        onClick={() => moveSection(section.id, 1)}
                        title="Move down"
                      >
                        ↓
                      </IconButton>
                      <IconButton
                        onClick={() => removeSection(section.id)}
                        title="Remove"
                        danger
                      >
                        ×
                      </IconButton>
                    </div>
                  </div>

                  <div className="space-y-2 px-2.5 pb-2.5">
                    {section.blocks.map((block, bIndex) => (
                      <div
                        key={block.id}
                        id={`editor-block-${block.id}`}
                        className={`rounded-[10px] bg-white p-3 shadow-[var(--shadow-sm)] outline outline-2 outline-offset-[-1px] transition-[outline-color] duration-300 ${
                          selectedEditorId === `editor-block-${block.id}`
                            ? "outline-[var(--accent)]"
                            : "outline-transparent"
                        }`}
                      >
                        <div className="mb-2.5 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium capitalize text-[var(--text-tertiary)]">
                            {block.type === "divider"
                              ? "Dots"
                              : block.type === "framedTitle"
                                ? "Framed"
                                : block.type === "footerBar"
                                  ? "Footer bar"
                                  : block.type}
                            <span className="text-[var(--separator-strong)]">
                              {" "}
                              · {bIndex + 1}
                            </span>
                          </span>
                          <div className="flex gap-0.5">
                            <IconButton
                              onClick={() =>
                                moveBlock(section.id, block.id, -1)
                              }
                              title="Move up"
                            >
                              ↑
                            </IconButton>
                            <IconButton
                              onClick={() =>
                                moveBlock(section.id, block.id, 1)
                              }
                              title="Move down"
                            >
                              ↓
                            </IconButton>
                            <IconButton
                              onClick={() =>
                                removeBlock(section.id, block.id)
                              }
                              title="Remove"
                              danger
                            >
                              ×
                            </IconButton>
                          </div>
                        </div>

                        {block.type === "text" && (
                          <div className="space-y-2.5">
                            <AlignToggle
                              value={block.align ?? "left"}
                              onChange={(align) =>
                                updateBlock(section.id, block.id, { align })
                              }
                            />
                            <ParagraphEditor
                              value={block.html}
                              onChange={(htmlValue) =>
                                updateBlock(section.id, block.id, {
                                  html: htmlValue,
                                })
                              }
                            />
                            <SpacingFields
                              {...blockPad(block)}
                              onChange={(spacing) =>
                                setBlockPad(section.id, block.id, spacing)
                              }
                            />
                          </div>
                        )}

                        {block.type === "image" && (
                          <div className="space-y-2.5">
                            <ImageDropzone
                              src={block.src}
                              onChange={(src) =>
                                updateBlock(section.id, block.id, { src })
                              }
                            />
                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--fill)] px-3 py-2.5">
                              <span className="min-w-0">
                                <span className="block text-[13px] font-medium">
                                  Full bleed
                                  {previewMode === "mobile" ? " · Mobile" : ""}
                                </span>
                                <span className="block text-[11px] text-[var(--text-tertiary)]">
                                  Edge-to-edge — ignores width and side padding
                                </span>
                              </span>
                              <span className="relative inline-flex h-[22px] w-[38px] shrink-0 items-center">
                                <input
                                  type="checkbox"
                                  checked={resolveImageFullBleed(
                                    block,
                                    previewMode === "mobile"
                                      ? "mobile"
                                      : "desktop",
                                  )}
                                  onChange={(e) => {
                                    const on = e.target.checked;
                                    if (previewMode === "mobile") {
                                      updateBlock(section.id, block.id, {
                                        mobileFullBleed: on,
                                      });
                                    } else {
                                      updateBlock(section.id, block.id, {
                                        fullBleed: on,
                                      });
                                    }
                                  }}
                                  className="peer sr-only"
                                />
                                <span className="absolute inset-0 rounded-full bg-[#e9e9eb] transition-colors peer-checked:bg-[var(--accent)]" />
                                <span className="absolute left-[2px] size-[18px] rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-[16px]" />
                              </span>
                            </label>
                            <Field
                              label="Alt text"
                              value={block.alt}
                              onChange={(v) =>
                                updateBlock(section.id, block.id, { alt: v })
                              }
                            />
                            <Field
                              label="Image URL"
                              value={block.src}
                              onChange={(v) =>
                                updateBlock(section.id, block.id, { src: v })
                              }
                            />
                            {!resolveImageFullBleed(
                              block,
                              previewMode === "mobile" ? "mobile" : "desktop",
                            ) ? (
                              <>
                                <NumberField
                                  label="Width"
                                  value={
                                    previewMode === "mobile"
                                      ? (block.mobileWidth ??
                                        block.width ??
                                        displaySpacing.imageWidth)
                                      : (block.width ??
                                        draft.spacing.imageWidth)
                                  }
                                  onChange={(v) =>
                                    updateBlock(
                                      section.id,
                                      block.id,
                                      previewMode === "mobile"
                                        ? { mobileWidth: v }
                                        : { width: v },
                                    )
                                  }
                                />
                                <p className="text-[11px] text-[var(--text-tertiary)]">
                                  Use Left / Right for horizontal inset
                                </p>
                                <SpacingFields
                                  {...blockPad(block)}
                                  onChange={(spacing) =>
                                    setBlockPad(section.id, block.id, spacing)
                                  }
                                />
                              </>
                            ) : (
                              <>
                                <p className="text-[11px] text-[var(--text-tertiary)]">
                                  Edge-to-edge horizontally — Top / Bottom still
                                  apply
                                </p>
                                <SpacingFields
                                  {...blockPad(block)}
                                  verticalOnly
                                  onChange={(spacing) =>
                                    setBlockPad(section.id, block.id, {
                                      ...spacing,
                                      left: 0,
                                      right: 0,
                                    })
                                  }
                                />
                              </>
                            )}
                          </div>
                        )}

                        {block.type === "meta" && (
                          <div className="space-y-2.5">
                            <Field
                              label="Left"
                              value={block.left}
                              onChange={(v) =>
                                updateBlock(section.id, block.id, { left: v })
                              }
                            />
                            <Field
                              label="Right"
                              value={block.right}
                              onChange={(v) =>
                                updateBlock(section.id, block.id, {
                                  right: v,
                                })
                              }
                            />
                            <SpacingFields
                              {...blockPad(block)}
                              onChange={(spacing) =>
                                setBlockPad(section.id, block.id, spacing)
                              }
                            />
                          </div>
                        )}

                        {block.type === "framedTitle" && (
                          <div className="space-y-2.5">
                            <ParagraphEditor
                              value={block.html}
                              onChange={(htmlValue) =>
                                updateBlock(section.id, block.id, {
                                  html: htmlValue,
                                })
                              }
                              compact
                              placeholder="Framed title…"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <NumberField
                                label="Box W"
                                value={
                                  previewMode === "mobile"
                                    ? (block.mobileBoxWidth ??
                                      block.boxWidth ??
                                      DEFAULT_FRAMED_BOX_WIDTH)
                                    : (block.boxWidth ??
                                      DEFAULT_FRAMED_BOX_WIDTH)
                                }
                                onChange={(v) =>
                                  updateBlock(
                                    section.id,
                                    block.id,
                                    previewMode === "mobile"
                                      ? { mobileBoxWidth: v }
                                      : { boxWidth: v },
                                  )
                                }
                              />
                              <NumberField
                                label="Box H"
                                value={
                                  previewMode === "mobile"
                                    ? (block.mobileBoxHeight ??
                                      block.boxHeight ??
                                      DEFAULT_FRAMED_BOX_HEIGHT)
                                    : (block.boxHeight ??
                                      DEFAULT_FRAMED_BOX_HEIGHT)
                                }
                                onChange={(v) =>
                                  updateBlock(
                                    section.id,
                                    block.id,
                                    previewMode === "mobile"
                                      ? { mobileBoxHeight: v }
                                      : { boxHeight: v },
                                  )
                                }
                              />
                              <NumberField
                                label="Border"
                                value={
                                  previewMode === "mobile"
                                    ? (block.mobileBorderWidth ??
                                      block.borderWidth ??
                                      block.width ??
                                      DEFAULT_FRAMED_BORDER)
                                    : (block.borderWidth ??
                                      block.width ??
                                      DEFAULT_FRAMED_BORDER)
                                }
                                onChange={(v) =>
                                  updateBlock(
                                    section.id,
                                    block.id,
                                    previewMode === "mobile"
                                      ? { mobileBorderWidth: v }
                                      : { borderWidth: v },
                                  )
                                }
                              />
                            </div>
                            <p className="text-[11px] text-[var(--text-tertiary)]">
                              Fixed px size — does not scale with the viewport
                            </p>
                            <SpacingFields
                              {...blockPad(block)}
                              onChange={(spacing) =>
                                setBlockPad(section.id, block.id, spacing)
                              }
                            />
                          </div>
                        )}

                        {block.type === "divider" && (
                          <div className="space-y-2.5">
                            <SpacingFields
                              {...blockPad(block)}
                              onChange={(spacing) =>
                                setBlockPad(section.id, block.id, spacing)
                              }
                            />
                          </div>
                        )}

                        {block.type === "tagline" && (
                          <div className="space-y-2.5">
                            <Field
                              label="Tagline"
                              value={block.text}
                              onChange={(v) =>
                                updateBlock(section.id, block.id, {
                                  text: v,
                                })
                              }
                            />
                            <SpacingFields
                              {...blockPad(block)}
                              onChange={(spacing) =>
                                setBlockPad(section.id, block.id, spacing)
                              }
                            />
                          </div>
                        )}

                        {block.type === "footerBar" && (
                          <div className="space-y-2.5">
                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--fill)] px-3 py-2.5">
                              <span className="text-[13px] font-medium">
                                Dark bar
                              </span>
                              <span className="relative inline-flex h-[22px] w-[38px] shrink-0 items-center">
                                <input
                                  type="checkbox"
                                  checked={block.dark !== false}
                                  onChange={(e) =>
                                    updateBlock(section.id, block.id, {
                                      dark: e.target.checked,
                                    })
                                  }
                                  className="peer sr-only"
                                />
                                <span className="absolute inset-0 rounded-full bg-[#e9e9eb] transition-colors peer-checked:bg-[var(--accent)]" />
                                <span className="absolute left-[2px] size-[18px] rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-[16px]" />
                              </span>
                            </label>
                            <Field
                              label="Note"
                              value={block.note}
                              onChange={(v) =>
                                updateBlock(section.id, block.id, {
                                  note: v,
                                })
                              }
                            />
                            {block.links.map((link, i) => (
                              <div key={i} className="space-y-2.5">
                                <Field
                                  label={`Link ${i + 1} · label`}
                                  value={link.label}
                                  onChange={(v) => {
                                    const links = block.links.map((l, j) =>
                                      j === i ? { ...l, label: v } : l,
                                    );
                                    updateBlock(section.id, block.id, {
                                      links,
                                    });
                                  }}
                                />
                                <Field
                                  label={`Link ${i + 1} · URL`}
                                  value={link.href}
                                  placeholder="https://…"
                                  onChange={(v) => {
                                    const links = block.links.map((l, j) =>
                                      j === i ? { ...l, href: v } : l,
                                    );
                                    updateBlock(section.id, block.id, {
                                      links,
                                    });
                                  }}
                                />
                              </div>
                            ))}
                            <SpacingFields
                              {...blockPad(block)}
                              onChange={(spacing) =>
                                setBlockPad(section.id, block.id, spacing)
                              }
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1 px-3 pb-3">
                    {(
                      [
                        ["text", "Text"],
                        ["image", "Image"],
                        ["meta", "Meta"],
                        ["framedTitle", "Framed"],
                        ["divider", "Dots"],
                        ["tagline", "Tagline"],
                        ["footerBar", "Footer"],
                      ] as const
                    ).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addBlock(section.id, type)}
                        className="rounded-md bg-white/80 px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] shadow-[var(--shadow-sm)] transition-colors hover:text-[var(--foreground)]"
                      >
                        + {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <Panel
            title={previewMode === "mobile" ? "Spacing · Mobile" : "Spacing"}
          >
            {previewMode === "mobile" ? (
              <p className="mb-3 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                Applied under {EMAIL_MOBILE_BREAKPOINT}px via CSS media queries.
                Starts identical to desktop until you change a value.
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2.5">
              <NumberField
                label="Text gap"
                value={displaySpacing.text}
                onChange={(v) => updateSpacing({ text: v })}
              />
              <NumberField
                label="Image gap"
                value={displaySpacing.image}
                onChange={(v) => updateSpacing({ image: v })}
              />
              <NumberField
                label="Divider gap"
                value={displaySpacing.divider}
                onChange={(v) => updateSpacing({ divider: v })}
              />
              <NumberField
                label="Dot size"
                value={displaySpacing.dotSize}
                onChange={(v) => updateSpacing({ dotSize: v })}
              />
              <NumberField
                label="Dot spacing"
                value={displaySpacing.dotSpacing}
                onChange={(v) => updateSpacing({ dotSpacing: v })}
              />
              <NumberField
                label="Pad X"
                value={displaySpacing.padX}
                onChange={(v) => updateSpacing({ padX: v })}
              />
              {previewMode === "desktop" ? (
                <NumberField
                  label="Email width"
                  value={displaySpacing.emailWidth}
                  onChange={(v) => updateSpacing({ emailWidth: v })}
                />
              ) : null}
              <NumberField
                label="Image width"
                value={displaySpacing.imageWidth}
                onChange={(v) => updateSpacing({ imageWidth: v })}
              />
            </div>
            <button
              type="button"
              className="mt-3 text-[12px] font-medium text-[var(--accent)] transition-opacity hover:opacity-70"
              onClick={resetSpacing}
            >
              {previewMode === "mobile"
                ? "Match desktop"
                : "Reset defaults"}
            </button>
          </Panel>

          <Panel
            title={
              previewMode === "mobile" ? "Typography · Mobile" : "Typography"
            }
          >
            <div className="grid grid-cols-2 gap-2.5">
              <NumberField
                label="Sans"
                value={displayTypography.sansSize}
                onChange={(v) => updateTypography({ sansSize: v })}
              />
              <NumberField
                label="Serif"
                value={displayTypography.serifSize}
                onChange={(v) => updateTypography({ serifSize: v })}
              />
              <NumberField
                label="Framed"
                value={displayTypography.framedSize}
                onChange={(v) => updateTypography({ framedSize: v })}
              />
              <NumberField
                label="Meta"
                value={displayTypography.metaSize}
                onChange={(v) => updateTypography({ metaSize: v })}
              />
              <NumberField
                label="Tagline"
                value={displayTypography.taglineSize}
                onChange={(v) => updateTypography({ taglineSize: v })}
              />
              <NumberField
                label="Credits"
                value={displayTypography.footerSize}
                onChange={(v) => updateTypography({ footerSize: v })}
              />
            </div>
            {previewMode === "mobile" ? (
              <button
                type="button"
                className="mt-3 text-[12px] font-medium text-[var(--accent)] transition-opacity hover:opacity-70"
                onClick={resetTypography}
              >
                Match desktop
              </button>
            ) : null}
          </Panel>

          <Panel title="Colors">
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  ["sideColor", "Side"],
                  ["backgroundCard", "Card"],
                  ["body", "Body"],
                  ["divider", "Dots"],
                  ["footerBg", "Footer bg"],
                  ["footerText", "Footer text"],
                ] as const
              ).map(([key, label]) => (
                <ColorField
                  key={key}
                  label={label}
                  value={draft.colors[key]}
                  onChange={(v) => updateColor(key, v)}
                />
              ))}
            </div>
          </Panel>

          <Panel
            title={
              previewMode === "mobile" ? "Frame border · Mobile" : "Frame border"
            }
          >
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <ColorField
                  label="Color"
                  value={displayFrameBorder.color}
                  onChange={(v) => updateFrameBorder({ color: v })}
                />
                <NumberField
                  label="Width"
                  value={displayFrameBorder.width}
                  onChange={(v) => updateFrameBorder({ width: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["top", "Top"],
                    ["right", "Right"],
                    ["bottom", "Bottom"],
                    ["left", "Left"],
                  ] as const
                ).map(([side, label]) => (
                  <label
                    key={side}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--fill)] px-3 py-2.5"
                  >
                    <span className="text-[13px] font-medium">{label}</span>
                    <span className="relative inline-flex h-[22px] w-[38px] shrink-0 items-center">
                      <input
                        type="checkbox"
                        checked={displayFrameBorder[side]}
                        onChange={(e) =>
                          updateFrameBorder({ [side]: e.target.checked })
                        }
                        className="peer sr-only"
                      />
                      <span className="absolute inset-0 rounded-full bg-[#e9e9eb] transition-colors peer-checked:bg-[var(--accent)]" />
                      <span className="absolute left-[2px] size-[18px] rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-[16px]" />
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {previewMode === "mobile" ? (
              <button
                type="button"
                className="mt-3 text-[12px] font-medium text-[var(--accent)] transition-opacity hover:opacity-70"
                onClick={resetFrameBorder}
              >
                Clear mobile (no border)
              </button>
            ) : null}
          </Panel>

          <Panel title="Brevo">
            <p className="mb-3 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              {brevoConfigured === null
                ? "Checking connection…"
                : brevoConfigured
                  ? "API connected on this server."
                  : "Not configured. Set BREVO_API_KEY + BREVO_SENDER_EMAIL on a Node host."}
            </p>
            <Field
              label="Test emails"
              value={sendEmails}
              onChange={setSendEmails}
              placeholder="you@example.com"
            />
            <button
              type="button"
              disabled={sending || !sendEmails.trim()}
              onClick={() => sendBrevo("test")}
              className="mt-2.5 w-full rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-35"
            >
              {sending ? "Sending…" : "Send test"}
            </button>
            <div className="mt-3">
              <Field
                label="List id"
                value={sendListId}
                onChange={setSendListId}
              />
            </div>
            <button
              type="button"
              disabled={sending || !sendListId.trim()}
              onClick={() => sendBrevo("list")}
              className="mt-2.5 w-full rounded-[var(--radius-sm)] bg-[var(--fill)] px-3 py-2 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--fill-hover)] disabled:opacity-35"
            >
              {sending ? "Sending…" : "Send to list"}
            </button>
            {brevoStatus && (
              <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {brevoStatus}
              </p>
            )}
          </Panel>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--separator)] bg-white/60 px-5 py-2.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <SegmentedControl
                options={[
                  { value: "desktop", label: "Desktop" },
                  { value: "mobile", label: "Mobile" },
                ]}
                value={previewMode}
                onChange={setPreviewMode}
              />
              <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                Preview
              </span>
            </div>
            <span className="rounded-md bg-[var(--fill)] px-2 py-0.5 font-mono text-[11px] tabular-nums text-[var(--text-tertiary)]">
              {previewWidth}px
            </span>
          </div>
          <div
            className="apple-scroll min-h-0 flex-1 overflow-auto"
            style={{ background: draft.colors.sideColor }}
          >
            <div
              className={`mx-auto py-8 transition-[width] duration-200 ${
                previewMode === "mobile" ? "rounded-[28px]" : ""
              }`}
              style={{ width: previewWidth }}
            >
              <iframe
                key={previewMode}
                title="Newsletter preview"
                srcDoc={previewHtml}
                width={previewWidth}
                onLoad={(e) => syncPreviewHeight(e.currentTarget)}
                ref={(frame) => {
                  if (frame) syncPreviewHeight(frame);
                }}
                className={`block border-0 ${
                  previewMode === "mobile"
                    ? "overflow-hidden rounded-[24px] shadow-[var(--shadow)]"
                    : ""
                }`}
                style={{
                  width: previewWidth,
                  height: 800,
                  background: draft.colors.backgroundCard,
                }}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Panel({
  title,
  children,
  actionLabel,
  onAction,
}: {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="rounded-[var(--radius)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="rounded-md px-2 py-1 text-[12px] font-medium text-[var(--accent)] transition-opacity hover:opacity-70"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function IconButton({
  children,
  onClick,
  title,
  active,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex size-6 items-center justify-center rounded-md text-[11px] font-medium transition-colors ${
        active
          ? "bg-[var(--foreground)] text-white"
          : danger
            ? "text-[var(--text-tertiary)] hover:bg-[rgba(255,59,48,0.1)] hover:text-[var(--danger)]"
            : "text-[var(--text-tertiary)] hover:bg-white/80 hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

function FontToggle({
  value,
  onChange,
}: {
  value: SectionFont;
  onChange: (v: SectionFont) => void;
}) {
  return (
    <SegmentedControl
      options={[
        { value: "sans", label: "Sans" },
        { value: "serif", label: "Serif" },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

function AlignToggle({
  value,
  onChange,
}: {
  value: "left" | "center";
  onChange: (v: "left" | "center") => void;
}) {
  return (
    <SegmentedControl
      options={[
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-[rgba(0,0,0,0.06)] p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
            value === opt.value
              ? "bg-white text-[var(--foreground)] shadow-[var(--shadow-sm)]"
              : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SpacingFields({
  top,
  bottom,
  left,
  right,
  onChange,
  verticalOnly = false,
}: {
  top: number;
  bottom: number;
  left: number;
  right: number;
  onChange: (spacing: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }) => void;
  /** Full-bleed images — only top/bottom are editable. */
  verticalOnly?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumberField
        label="Top"
        value={top}
        onChange={(v) => onChange({ top: v, bottom, left, right })}
      />
      <NumberField
        label="Bottom"
        value={bottom}
        onChange={(v) => onChange({ top, bottom: v, left, right })}
      />
      {!verticalOnly ? (
        <>
          <NumberField
            label="Left"
            value={left}
            onChange={(v) => onChange({ top, bottom, left: v, right })}
          />
          <NumberField
            label="Right"
            value={right}
            onChange={(v) => onChange({ top, bottom, left, right: v })}
          />
        </>
      ) : null}
    </div>
  );
}

function ImageDropzone({
  src,
  onChange,
}: {
  src: string;
  onChange: (src: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function readFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) readFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-[var(--radius-sm)] border border-dashed p-4 text-center transition-colors ${
        dragging
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--separator-strong)] bg-[var(--fill)] hover:bg-[var(--fill-hover)]"
      }`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="mx-auto mb-2 max-h-28 w-auto rounded-md object-contain"
        />
      ) : null}
      <p className="text-[12px] font-medium text-[var(--text-secondary)]">
        Drop image or click to upload
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) readFile(file);
        }}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[var(--radius-sm)] border border-transparent bg-[var(--fill)] px-3 py-2 text-[13px] outline-none transition-shadow placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:bg-white focus:shadow-[0_0_0_3px_var(--accent-soft)]"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-[var(--radius-sm)] border border-transparent bg-[var(--fill)] px-3 py-2 font-mono text-[13px] tabular-nums outline-none transition-shadow focus:border-[var(--accent)] focus:bg-white focus:shadow-[0_0_0_3px_var(--accent-soft)]"
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
      <span className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--fill)] p-1.5 focus-within:bg-white focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
        <input
          type="color"
          value={normalizeHex(value)}
          onChange={(e) => onChange(e.target.value)}
          className="size-7 shrink-0 overflow-hidden rounded-md"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-1 font-mono text-[12px] outline-none"
        />
      </div>
    </label>
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
