import type { ReactNode } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Badge } from '../../components/ui/primitives';
import { statusLabel, statusStyle } from '../../lib/status';
import type { DocStatus } from '../../types';
import type { Translation } from '../../i18n/translations';

export function StatusBadge({ status, t }: { status: DocStatus; t: Translation }) {
  const { bg, color } = statusStyle(status);
  return (
    <Badge bg={bg} color={color}>
      {statusLabel(status, t)}
    </Badge>
  );
}

/** The collapsible "Header" / "Items" / "Schedule" panels inside an expanded document. */
export function DocSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="doc-section">
      <button type="button" className="doc-section__head" onClick={onToggle} aria-expanded={open}>
        <span>{title}</span>
        <Icon
          name="chevronDown"
          size={13}
          strokeWidth={2}
          className="chevron"
          style={{ color: 'var(--text-dim)', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
      </button>
      {open && <div className="doc-section__body">{children}</div>}
    </div>
  );
}

/** Clickable summary row that expands a document. */
export function DocRow({
  columns,
  cells,
  expanded,
  onToggle,
  onPrint,
  printLabel,
  expandLabel,
}: {
  columns: string;
  cells: ReactNode[];
  expanded: boolean;
  onToggle: () => void;
  onPrint: () => void;
  printLabel: string;
  expandLabel: string;
}) {
  return (
    <div
      className="grid-row grid-row--hover"
      style={{ gridTemplateColumns: columns, padding: '13px 20px', cursor: 'pointer' }}
      onClick={onToggle}
    >
      {cells.map((cell, i) => (
        <div key={i} style={{ minWidth: 0 }}>
          {cell}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          className="icon-btn icon-btn--lg"
          aria-label={printLabel}
          onClick={(e) => {
            e.stopPropagation();
            onPrint();
          }}
        >
          <Icon name="print" size={13} />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--plain"
          aria-label={expandLabel}
          aria-expanded={expanded}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <Icon
            name="chevronRight"
            size={13}
            strokeWidth={2}
            className="chevron"
            style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
          />
        </button>
      </div>
    </div>
  );
}

export function ReadOnlyField({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div className="field-label field-label--xs">{label}</div>
      <div className={`static-value${strong ? ' static-value--strong' : ''}`}>{value}</div>
    </div>
  );
}
