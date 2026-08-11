import { usePos } from '../../store/PosContext';
import { usePrinting } from '../../hooks/usePrinting';
import { Icon } from '../../components/ui/Icon';
import { DocRow, DocSection, ReadOnlyField, StatusBadge } from './DocParts';
import type { PurchaseRequest } from '../../types';

const COLS = '1.4fr 1fr 1.6fr 1fr 1fr auto';
const ITEM_COLS = '40px 1.2fr 1.6fr 1fr 0.8fr auto';

function PrDetail({ pr }: { pr: PurchaseRequest }) {
  const pos = usePos();
  const { t } = pos;
  const isDraft = pr.status === 'draft';

  return (
    <div className="doc-panel">
      <DocSection title={t.prHeader} open={pos.prHeaderOpen} onToggle={() => pos.set((s) => ({ prHeaderOpen: !s.prHeaderOpen }))}>
        <div className="doc-fields" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <label>
            <span className="field-label field-label--xs" style={{ display: 'block' }}>
              {t.createDate}
            </span>
            <input
              className="input input--sm"
              type="date"
              value={pr.date}
              disabled={!isDraft}
              onChange={(e) => pos.updatePr(pr.id, { date: e.target.value })}
            />
          </label>
          <ReadOnlyField label={t.requester} value={pr.requester} />
          <ReadOnlyField label={t.prNo} value={pr.no || '—'} strong />
        </div>
      </DocSection>

      <DocSection title={t.prItems} open={pos.prItemsOpen} onToggle={() => pos.set((s) => ({ prItemsOpen: !s.prItemsOpen }))}>
        <div className="line-head" style={{ gridTemplateColumns: ITEM_COLS }}>
          <div>{t.seqNo}</div>
          <div>{t.materialCode}</div>
          <div>{t.material}</div>
          <div className="num">{t.qty}</div>
          <div className="num">{t.unitCol}</div>
          <div />
        </div>

        <div className="line-rows">
          {pr.items.map((it, idx) => {
            const mat = pos.materials.find((m) => m.code === it.materialCode);
            return (
              <div key={idx} className="line-row" style={{ gridTemplateColumns: ITEM_COLS }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>{idx + 1}</div>
                {isDraft ? (
                  <input
                    className="input input--xs"
                    value={it.materialCode}
                    aria-label={t.materialCode}
                    onChange={(e) => pos.updatePrItem(pr.id, idx, { materialCode: e.target.value })}
                  />
                ) : (
                  <div className="readonly-cell">{it.materialCode}</div>
                )}
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{mat?.name ?? '—'}</div>
                {isDraft ? (
                  <input
                    className="input input--xs input--right"
                    type="number"
                    value={it.qty}
                    aria-label={t.qty}
                    onChange={(e) => pos.updatePrItem(pr.id, idx, { qty: Number(e.target.value) })}
                  />
                ) : (
                  <div className="readonly-cell num">{it.qty}</div>
                )}
                <div className="num" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {mat?.unit ?? ''}
                </div>
                {isDraft ? (
                  <button
                    type="button"
                    className="icon-btn icon-btn--plain"
                    aria-label={`${t.actionsCol} ${it.materialCode}`}
                    onClick={() => pos.removePrItem(pr.id, idx)}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            );
          })}
        </div>

        {isDraft && (
          <button type="button" className="link-action" onClick={() => pos.addPrItem(pr.id)}>
            + {t.insertItem}
          </button>
        )}
      </DocSection>

      <div className="doc-actions">
        {isDraft && (
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => pos.requestConfirm(t.confirmSaveMsg, () => pos.savePr(pr.id))}
          >
            {t.savePr}
          </button>
        )}
        {pr.status === 'pending' && pos.hasPerm('prApprove') && (
          <>
            <button
              type="button"
              className="btn btn--sm"
              style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}
              onClick={() => pos.requestConfirm(t.confirmRejectMsg, () => pos.rejectPr(pr.id))}
            >
              {t.reject}
            </button>
            <button
              type="button"
              className="btn btn--sm"
              style={{ color: '#fff', background: 'var(--success)' }}
              onClick={() => pos.requestConfirm(t.confirmApproveMsg, () => pos.approvePr(pr.id))}
            >
              {t.approve}
            </button>
          </>
        )}
        {pr.status === 'approved' && (
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => pos.requestConfirm(t.confirmSaveMsg, () => pos.convertPrToPo(pr))}
          >
            {t.convertToPo}
          </button>
        )}
      </div>
    </div>
  );
}

export function PrTab() {
  const pos = usePos();
  const { t } = pos;
  const { previewInWindow } = usePrinting();

  return (
    <>
      <button type="button" className="btn btn--primary" style={{ marginBottom: 16, fontSize: 13 }} onClick={pos.addPr}>
        + {t.addPr}
      </button>

      <div className="card table-list">
        <div className="grid-head" style={{ gridTemplateColumns: COLS }}>
          <div>{t.docNo}</div>
          <div>{t.date}</div>
          <div>{t.requester}</div>
          <div className="num">{t.itemCount}</div>
          <div>{t.usersTable.status}</div>
          <div />
        </div>

        {pos.purchaseRequests.map((pr) => {
          const expanded = pos.expandedPrId === pr.id;
          return (
            <div key={pr.id}>
              <DocRow
                columns={COLS}
                expanded={expanded}
                onToggle={() => pos.set((s) => ({ expandedPrId: s.expandedPrId === pr.id ? null : pr.id }))}
                onPrint={() => previewInWindow({ type: 'pr', doc: pr })}
                printLabel={`${t.printDoc} ${pr.no || t.pr}`}
                expandLabel={`${t.clickToView}: ${pr.no || t.pr}`}
                cells={[
                  <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{pr.no || '—'}</span>,
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{pr.date}</span>,
                  <span style={{ color: 'var(--text-muted)' }}>{pr.requester}</span>,
                  <span className="num" style={{ color: 'var(--text-muted)', display: 'block' }}>
                    {pr.items.length}
                  </span>,
                  <StatusBadge status={pr.status} t={t} />,
                ]}
              />
              {expanded && <PrDetail pr={pr} />}
            </div>
          );
        })}
      </div>
    </>
  );
}
