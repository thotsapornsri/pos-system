import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle${on ? ' toggle--on' : ''}`}
      onClick={onToggle}
    >
      <span className="toggle__knob" />
    </button>
  );
}

export function Badge({ bg, color, children }: { bg: string; color: string; children: ReactNode }) {
  return (
    <span className="badge" style={{ background: bg, color }}>
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  background,
  size = 30,
}: {
  initials: string;
  background: string;
  size?: number;
}) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, background, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export function EditDeleteActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" className="icon-btn" onClick={onEdit} aria-label={editLabel}>
        <Icon name="edit" size={14} />
      </button>
      <button type="button" className="icon-btn icon-btn--danger" onClick={onDelete} aria-label={deleteLabel}>
        <Icon name="trash" size={14} />
      </button>
    </div>
  );
}
