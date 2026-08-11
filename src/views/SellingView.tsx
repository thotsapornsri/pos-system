import { usePos } from '../store/PosContext';
import { usePrinting } from '../hooks/usePrinting';
import { Icon } from '../components/ui/Icon';
import { DocRow, StatusBadge } from './purchasing/DocParts';
import type { SalesOrder } from '../types';

const COLS = '1.4fr 1fr 1.6fr 1fr 1fr auto';

function SoDetail({ so }: { so: SalesOrder }) {
  const pos = usePos();
  const { t } = pos;
  const isDraft = so.status === 'draft';

  return (
    <div className="doc-panel">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {so.items.map((it, idx) => {
          const product = pos.products.find((p) => p.id === it.productId);
          const lineTotal = product ? product.price * it.qty : 0;

          if (!isDraft) {
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 9,
                  fontSize: 12.5,
                }}
              >
                <span>
                  {product?.name ?? '—'} × {it.qty}
                </span>
                <span style={{ fontWeight: 700 }}>{pos.fmt(lineTotal)}</span>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="line-row"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}
            >
              <select
                className="input input--xs"
                value={it.productId}
                aria-label={t.product}
                onChange={(e) => pos.updateSoItem(so.id, idx, { productId: Number(e.target.value) })}
              >
                {pos.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                className="input input--xs input--right"
                type="number"
                value={it.qty}
                aria-label={t.qty}
                onChange={(e) => pos.updateSoItem(so.id, idx, { qty: Number(e.target.value) })}
              />
              <div className="num" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {product ? pos.fmt(product.price) : '-'}
              </div>
              <div className="num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                {pos.fmt(lineTotal)}
              </div>
              <button
                type="button"
                className="icon-btn icon-btn--plain"
                aria-label={`${t.actionsCol} ${product?.name ?? ''}`}
                onClick={() => pos.removeSoItem(so.id, idx)}
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isDraft ? (
          <button type="button" className="link-action" onClick={() => pos.addSoItem(so.id)}>
            + {t.addItem}
          </button>
        ) : (
          <div />
        )}
        {isDraft && (
          <button
            type="button"
            className="btn btn--primary btn--sm"
            style={{ padding: '8px 14px' }}
            onClick={() => pos.requestConfirm(t.confirmSaveMsg, () => pos.submitSo(so.id))}
          >
            {t.submitDoc}
          </button>
        )}
      </div>
    </div>
  );
}

export function SellingView() {
  const pos = usePos();
  const { t } = pos;
  const { openPreviewModal } = usePrinting();

  return (
    <>
      <button type="button" className="btn btn--primary" style={{ marginBottom: 16, fontSize: 13 }} onClick={pos.addSo}>
        + {t.addSo}
      </button>

      <div className="card table-list">
        <div className="grid-head" style={{ gridTemplateColumns: COLS }}>
          <div>{t.docNo}</div>
          <div>{t.date}</div>
          <div>{t.customer}</div>
          <div className="num">{t.docTotal}</div>
          <div>{t.usersTable.status}</div>
          <div />
        </div>

        {pos.salesOrders.map((so) => {
          const expanded = pos.expandedSoId === so.id;
          const total = so.items.reduce((sum, it) => {
            const p = pos.products.find((x) => x.id === it.productId);
            return sum + (p ? p.price * it.qty : 0);
          }, 0);

          return (
            <div key={so.id}>
              <DocRow
                columns={COLS}
                expanded={expanded}
                onToggle={() => pos.set((s) => ({ expandedSoId: s.expandedSoId === so.id ? null : so.id }))}
                onPrint={() => openPreviewModal({ type: 'so', doc: so })}
                printLabel={`${t.printDoc} ${so.no}`}
                expandLabel={`${t.clickToView}: ${so.no}`}
                cells={[
                  <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{so.no}</span>,
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{so.date}</span>,
                  <span style={{ color: 'var(--text-muted)' }}>{so.customer}</span>,
                  <span className="num" style={{ fontWeight: 700, display: 'block' }}>
                    {pos.fmt(total)}
                  </span>,
                  <StatusBadge status={so.status} t={t} />,
                ]}
              />
              {expanded && <SoDetail so={so} />}
            </div>
          );
        })}
      </div>
    </>
  );
}
