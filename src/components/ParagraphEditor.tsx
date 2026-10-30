"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import { toHex6 } from "@/lib/color";

type ParagraphEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  compact?: boolean;
  /** Text color for this editor; shown as a swatch + hex top-right of the toolbar. */
  color?: string;
  onColorChange?: (color: string) => void;
};

export function ParagraphEditor({
  value,
  onChange,
  placeholder = "Write the paragraph…",
  compact = false,
  color,
  onColorChange,
}: ParagraphEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        listItem: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "<p></p>",
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    editorProps: {
      attributes: {
        class: compact
          ? "min-h-[56px] px-3 py-2.5 text-[13px] leading-relaxed outline-none"
          : "min-h-[104px] px-3 py-2.5 text-[13px] leading-relaxed outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const textColor = toHex6(color ?? "#000000");

  return (
    <div className="overflow-hidden rounded-[var(--radius-sm)] bg-[var(--fill)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
      <div className="flex items-center gap-0.5 border-b border-[var(--separator)] px-1.5 py-1">
        <ToolbarButton
          label="B"
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="font-semibold"
        />
        <ToolbarButton
          label="I"
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="italic"
        />
        <ToolbarButton
          label="U"
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="underline"
        />
        {onColorChange ? (
          <ColorPicker
            compact
            value={textColor}
            onChange={onColorChange}
            aria-label="Text color"
          />
        ) : null}
      </div>
      <div style={{ color: textColor }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  title,
  active,
  onClick,
  className = "",
}: {
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex size-7 items-center justify-center rounded-md text-[12px] transition-colors ${className} ${
        active
          ? "bg-[var(--foreground)] text-white"
          : "text-[var(--text-secondary)] hover:bg-white/70 hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </button>
  );
}
