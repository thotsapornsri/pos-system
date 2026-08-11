import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A user-fillable image placeholder — the real-app equivalent of the design's
 * `<image-slot>` custom element. Click or drop an image file onto it; the
 * picture is stored per-slot in localStorage so it survives a reload.
 */

const STORAGE_KEY = 'pos.imageSlots';

type SlotMap = Record<string, string>;

function readSlots(): SlotMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SlotMap) : {};
  } catch {
    return {};
  }
}

function writeSlot(id: string, dataUrl: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSlots(), [id]: dataUrl }));
  } catch {
    /* quota exceeded — the slot still shows for this session */
  }
}

/** Notifies every mounted slot with the same id when one of them is filled. */
const listeners = new Set<(id: string, dataUrl: string) => void>();

interface ImageSlotProps {
  id: string;
  placeholder?: string;
  shape?: 'rect' | 'rounded' | 'circle';
  radius?: number;
  fontSize?: number;
  /** `light` for slots sitting on a coloured parent, `dark` on white surfaces. */
  tone?: 'light' | 'dark';
  /** Set false when the slot is rendered inside another button. */
  interactive?: boolean;
}

export function ImageSlot({
  id,
  placeholder = '',
  shape = 'rounded',
  radius = 12,
  fontSize,
  tone = 'dark',
  interactive = true,
}: ImageSlotProps) {
  const [src, setSrc] = useState<string | null>(() => readSlots()[id] ?? null);
  const [dropping, setDropping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onFill = (slotId: string, dataUrl: string) => {
      if (slotId === id) setSrc(dataUrl);
    };
    listeners.add(onFill);
    return () => {
      listeners.delete(onFill);
    };
  }, [id]);

  const accept = useCallback(
    (file: File | undefined) => {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        writeSlot(id, dataUrl);
        listeners.forEach((fn) => fn(id, dataUrl));
      };
      reader.readAsDataURL(file);
    },
    [id],
  );

  const borderRadius = shape === 'circle' ? '50%' : shape === 'rect' ? 0 : radius;
  const className = `imageslot imageslot--${tone}${src ? '' : ' imageslot--empty'}${dropping ? ' imageslot--dropping' : ''}`;
  const style = { borderRadius, fontSize: fontSize ?? undefined };
  const content = src ? <img src={src} alt={placeholder} /> : <span>{placeholder}</span>;

  // Nested inside another control (a card that is itself a button), so it must
  // render as a plain element — a button inside a button is invalid HTML.
  if (!interactive) {
    return (
      <span className={className} style={{ ...style, cursor: 'inherit' }} title={placeholder}>
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      title={placeholder}
      aria-label={placeholder || 'Image'}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDropping(true);
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDropping(false);
        accept(e.dataTransfer.files[0]);
      }}
    >
      {content}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => accept(e.target.files?.[0])}
      />
    </button>
  );
}
