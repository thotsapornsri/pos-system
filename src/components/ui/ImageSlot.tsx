import { useCallback, useRef, useState } from 'react';
import { usePos } from '../../store/PosContext';
import { useImagesQuery, useUploadImageMutation } from '../../store/queries/useImages';

/**
 * A user-fillable image placeholder — the real-app equivalent of the design's
 * `<image-slot>` custom element. Click or drop an image file onto it; the
 * picture uploads to the store's Supabase Storage bucket, so it shows up on
 * every device, not just the one that uploaded it.
 */

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
  const { storeId } = usePos();
  const imagesQuery = useImagesQuery(storeId);
  const uploadMutation = useUploadImageMutation(storeId);
  const [dropping, setDropping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const entry = imagesQuery.data?.[id];
  const src = entry ? `${entry.url}?t=${encodeURIComponent(entry.updatedAt)}` : null;

  const accept = useCallback(
    (file: File | undefined) => {
      if (!file || !file.type.startsWith('image/') || !storeId) return;
      uploadMutation.mutate({ id, file });
    },
    [id, storeId, uploadMutation],
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
