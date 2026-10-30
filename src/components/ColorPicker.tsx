"use client";

import { useEffect, useRef, useState } from "react";
import {
  type ColorFill,
  type GradientStop,
  type ImageFill,
  type LinearGradient,
  defaultImageFill,
  defaultLinearGradient,
  isHexColor,
  isImageFill,
  isLinearGradient,
  linearGradientCss,
  newStopId,
  solidFallback,
  toHex6,
} from "@/lib/color";

type SolidColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  allowGradient?: false;
  "aria-label"?: string;
};

type GradientColorPickerProps = {
  value: ColorFill;
  onChange: (value: ColorFill) => void;
  compact?: false;
  allowGradient: true;
  "aria-label"?: string;
};

type ColorPickerProps = SolidColorPickerProps | GradientColorPickerProps;

/** Native color swatch + hex field, optionally with linear-gradient stops. */
export function ColorPicker(props: ColorPickerProps) {
  const ariaLabel = props["aria-label"] ?? "Color";

  if (!props.allowGradient || props.compact) {
    const solid = props as SolidColorPickerProps;
    return (
      <SolidRow
        hex={toHex6(solid.value)}
        onChange={solid.onChange}
        compact={Boolean(solid.compact)}
        ariaLabel={ariaLabel}
      />
    );
  }

  const { value, onChange } = props;
  const gradient = isLinearGradient(value) ? value : null;
  const image = isImageFill(value) ? value : null;
  const hex = solidFallback(value);
  const mode = image ? "image" : gradient ? "linear" : "solid";

  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-[var(--radius-sm)] bg-[var(--fill)] p-1">
        <ModeButton
          active={mode === "solid"}
          onClick={() => onChange(hex)}
          label="Solid"
        />
        <ModeButton
          active={mode === "linear"}
          onClick={() =>
            onChange(gradient ?? defaultLinearGradient(hex))
          }
          label="Linear"
        />
        <ModeButton
          active={mode === "image"}
          onClick={() => onChange(image ?? defaultImageFill(hex))}
          label="Image"
        />
      </div>

      {mode === "linear" && gradient ? (
        <GradientEditor
          value={gradient}
          onChange={onChange}
          ariaLabel={ariaLabel}
        />
      ) : mode === "image" && image ? (
        <ImageEditor value={image} onChange={onChange} ariaLabel={ariaLabel} />
      ) : (
        <SolidRow
          hex={hex}
          onChange={(h) => onChange(h)}
          ariaLabel={ariaLabel}
        />
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors ${
        active
          ? "bg-white text-[var(--foreground)] shadow-sm"
          : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </button>
  );
}

function SolidRow({
  hex,
  onChange,
  compact = false,
  ariaLabel,
}: {
  hex: string;
  onChange: (hex: string) => void;
  compact?: boolean;
  ariaLabel: string;
}) {
  const safe = toHex6(hex);
  const [text, setText] = useState(safe);

  useEffect(() => {
    setText(safe);
  }, [safe]);

  function commitText(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      setText(safe);
      return;
    }
    const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    if (!isHexColor(withHash)) {
      setText(safe);
      return;
    }
    const next = toHex6(withHash);
    setText(next);
    if (next !== safe) onChange(next);
  }

  const swatch = (
    <span
      className={
        compact
          ? "relative flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-white/70"
          : "relative size-7 shrink-0 overflow-hidden rounded-md"
      }
      title={ariaLabel}
    >
      {compact ? (
        <span
          aria-hidden
          className="pointer-events-none block size-4 rounded-full border border-black/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]"
          style={{ backgroundColor: safe }}
        />
      ) : null}
      <input
        type="color"
        value={safe}
        aria-label={ariaLabel}
        onChange={(e) => {
          const next = toHex6(e.target.value);
          setText(next);
          onChange(next);
        }}
        className={
          compact
            ? "absolute inset-0 cursor-pointer opacity-0"
            : "size-full cursor-pointer"
        }
      />
    </span>
  );

  const hexField = (
    <input
      value={text}
      spellCheck={false}
      aria-label={`${ariaLabel} hex`}
      placeholder="#000000"
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const t = raw.trim();
        const candidate = t.startsWith("#") ? t : t ? `#${t}` : "";
        if (/^#[0-9a-fA-F]{6}$/.test(candidate)) {
          onChange(candidate.toLowerCase());
        }
      }}
      onBlur={() => commitText(text)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={
        compact
          ? "ml-0.5 w-[4.75rem] rounded-md bg-transparent px-1 py-0.5 font-mono text-[11px] tabular-nums text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)] hover:bg-white/70 focus:bg-white focus:text-[var(--foreground)]"
          : "w-full min-w-0 bg-transparent px-1 font-mono text-[12px] outline-none"
      }
    />
  );

  if (compact) {
    return (
      <span className="ml-auto flex items-center gap-0.5">
        {swatch}
        {hexField}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--fill)] p-1.5 focus-within:bg-white focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
      {swatch}
      {hexField}
    </div>
  );
}

function GradientEditor({
  value,
  onChange,
  ariaLabel,
}: {
  value: LinearGradient;
  onChange: (value: LinearGradient) => void;
  ariaLabel: string;
}) {
  const preview = linearGradientCss(value);
  const sorted = [...value.stops].sort((a, b) => a.position - b.position);

  function patchStop(id: string, patch: Partial<GradientStop>) {
    onChange({
      ...value,
      stops: value.stops.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function removeStop(id: string) {
    if (value.stops.length <= 2) return;
    onChange({
      ...value,
      stops: value.stops.filter((s) => s.id !== id),
    });
  }

  function addStop() {
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2] ?? sorted[0];
    const position = Math.min(
      100,
      Math.round(((prev?.position ?? 0) + (last?.position ?? 100)) / 2) || 50,
    );
    onChange({
      ...value,
      stops: [
        ...value.stops,
        {
          id: newStopId(),
          position,
          color: last?.color ?? "#000000",
          opacity: 100,
        },
      ],
    });
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--fill)] px-2 py-1.5">
          <span className="shrink-0 text-[11px] font-medium text-[var(--text-secondary)]">
            Angle
          </span>
          <input
            type="number"
            value={value.angle}
            onChange={(e) =>
              onChange({
                ...value,
                angle: Number(e.target.value) || 0,
              })
            }
            className="w-full min-w-0 bg-transparent font-mono text-[12px] tabular-nums outline-none"
          />
          <span className="shrink-0 text-[11px] text-[var(--text-tertiary)]">
            deg
          </span>
        </label>
      </div>

      <div
        className="h-8 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--separator)]"
        style={{ backgroundImage: preview || undefined, backgroundColor: solidFallback(value) }}
        title={`${ariaLabel} preview`}
      />

      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[var(--text-secondary)]">
          Stops
        </span>
        <button
          type="button"
          title="Add stop"
          onClick={addStop}
          className="flex size-7 items-center justify-center rounded-md text-[16px] leading-none text-[var(--text-secondary)] transition-colors hover:bg-[var(--fill)] hover:text-[var(--foreground)]"
        >
          +
        </button>
      </div>

      <div className="space-y-1.5">
        {sorted.map((stop) => (
          <StopRow
            key={stop.id}
            stop={stop}
            canRemove={value.stops.length > 2}
            onChange={(patch) => patchStop(stop.id, patch)}
            onRemove={() => removeStop(stop.id)}
          />
        ))}
      </div>
    </div>
  );
}

function StopRow({
  stop,
  canRemove,
  onChange,
  onRemove,
}: {
  stop: GradientStop;
  canRemove: boolean;
  onChange: (patch: Partial<GradientStop>) => void;
  onRemove: () => void;
}) {
  const hex = toHex6(stop.color);
  const [hexText, setHexText] = useState(hex.replace("#", "").toUpperCase());
  const [posText, setPosText] = useState(String(Math.round(stop.position)));
  const [opText, setOpText] = useState(String(Math.round(stop.opacity ?? 100)));

  useEffect(() => {
    setHexText(hex.replace("#", "").toUpperCase());
  }, [hex]);

  useEffect(() => {
    setPosText(String(Math.round(stop.position)));
  }, [stop.position]);

  useEffect(() => {
    setOpText(String(Math.round(stop.opacity ?? 100)));
  }, [stop.opacity]);

  return (
    <div className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--fill)] p-1.5">
      <div className="flex w-[3.25rem] shrink-0 items-center gap-0.5 rounded-md bg-white/70 px-1.5 py-1">
        <input
          value={posText}
          inputMode="numeric"
          aria-label="Stop position"
          onChange={(e) => setPosText(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={() => {
            const n = Math.max(0, Math.min(100, Number(posText) || 0));
            setPosText(String(n));
            onChange({ position: n });
          }}
          className="w-full bg-transparent text-center font-mono text-[11px] tabular-nums outline-none"
        />
        <span className="text-[10px] text-[var(--text-tertiary)]">%</span>
      </div>

      <span className="relative size-7 shrink-0 overflow-hidden rounded-md">
        <input
          type="color"
          value={hex}
          aria-label="Stop color"
          onChange={(e) => onChange({ color: toHex6(e.target.value) })}
          className="size-full cursor-pointer"
        />
      </span>

      <input
        value={hexText}
        spellCheck={false}
        aria-label="Stop hex"
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
          setHexText(raw.toUpperCase());
          if (raw.length === 6) onChange({ color: toHex6(`#${raw}`) });
        }}
        onBlur={() => {
          if (rawHexOk(hexText)) {
            onChange({ color: toHex6(`#${hexText}`) });
          } else {
            setHexText(hex.replace("#", "").toUpperCase());
          }
        }}
        className="min-w-0 flex-1 rounded-md bg-white/70 px-1.5 py-1 font-mono text-[11px] uppercase outline-none"
      />

      <div className="flex w-[3.5rem] shrink-0 items-center gap-0.5 rounded-md bg-white/70 px-1.5 py-1">
        <input
          value={opText}
          inputMode="numeric"
          aria-label="Stop opacity"
          onChange={(e) => setOpText(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={() => {
            const n = Math.max(0, Math.min(100, Number(opText) || 0));
            setOpText(String(n));
            onChange({ opacity: n });
          }}
          className="w-full bg-transparent text-center font-mono text-[11px] tabular-nums outline-none"
        />
        <span className="text-[10px] text-[var(--text-tertiary)]">%</span>
      </div>

      <button
        type="button"
        title="Remove stop"
        disabled={!canRemove}
        onClick={onRemove}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-[14px] text-[var(--text-secondary)] transition-colors hover:bg-white disabled:opacity-30"
      >
        −
      </button>
    </div>
  );
}

function rawHexOk(v: string): boolean {
  return /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(v);
}

function ImageEditor({
  value,
  onChange,
  ariaLabel,
}: {
  value: ImageFill;
  onChange: (value: ImageFill) => void;
  ariaLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function readFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange({ ...value, src: reader.result });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2.5">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
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
        className={`cursor-pointer overflow-hidden rounded-[var(--radius-sm)] border border-dashed text-center transition-colors ${
          dragging
            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-[var(--separator-strong)] bg-[var(--fill)] hover:bg-[var(--fill-hover)]"
        }`}
        title={ariaLabel}
      >
        {value.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.src}
            alt=""
            className="mx-auto max-h-24 w-full object-cover"
          />
        ) : (
          <p className="px-3 py-6 text-[12px] font-medium text-[var(--text-secondary)]">
            Drop image or click to upload
          </p>
        )}
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

      {value.src ? (
        <button
          type="button"
          onClick={() => onChange({ ...value, src: "" })}
          className="text-[12px] font-medium text-[var(--accent)] transition-opacity hover:opacity-70"
        >
          Remove image
        </button>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
            Size
          </span>
          <select
            value={value.size ?? "cover"}
            onChange={(e) =>
              onChange({
                ...value,
                size: e.target.value as ImageFill["size"],
              })
            }
            className="w-full rounded-[var(--radius-sm)] bg-[var(--fill)] px-2 py-2 text-[12px] outline-none"
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="auto">Auto</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
            Repeat
          </span>
          <select
            value={value.repeat ?? "no-repeat"}
            onChange={(e) =>
              onChange({
                ...value,
                repeat: e.target.value as ImageFill["repeat"],
              })
            }
            className="w-full rounded-[var(--radius-sm)] bg-[var(--fill)] px-2 py-2 text-[12px] outline-none"
          >
            <option value="no-repeat">No repeat</option>
            <option value="repeat">Repeat</option>
            <option value="repeat-x">Repeat X</option>
            <option value="repeat-y">Repeat Y</option>
          </select>
        </label>
      </div>

      <div>
        <span className="mb-1.5 block text-[11px] font-medium text-[var(--text-secondary)]">
          Fallback color
        </span>
        <SolidRow
          hex={value.fallback || "#ffffff"}
          onChange={(h) => onChange({ ...value, fallback: h })}
          ariaLabel={`${ariaLabel} fallback`}
        />
        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
          Shown when the image can’t load (Outlook, images blocked)
        </p>
      </div>
    </div>
  );
}
