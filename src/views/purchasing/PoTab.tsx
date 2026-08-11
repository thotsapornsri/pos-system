import { usePos } from '../../store/PosContext';
import { usePrinting } from '../../hooks/usePrinting';
import { Icon } from '../../components/ui/Icon';
import { DocRow, DocSection, ReadOnlyField, StatusBadge } from './DocParts';
import type { PurchaseOrder } from '../../types';

const COLS = '1.4fr 1fr 1.6fr 1fr 1fr auto';
const ITEM_COLS = '40px 1.1fr 1.4fr 0.8fr 0.8fr 1fr auto';
const SCHEDULE_COLS = '1.2fr 1fr 1fr 1fr auto';

function PoDetail({ po }: { po: PurchaseOrder }) {
  const pos = usePos();
  const { t } = pos;
  const isDraft = po.status === 'draft';
  const vendor = pos.vendors.find((v) => v.code === po.vendorCode);
  const grandTotal = po.items.reduce((sum, it) => sum + it.qty * it.price, 0);

  return (
    <div className="doc-panel">
      <DocSection title={t.poHeader} open={pos.poHeaderOpen} onToggle={() => pos.set((s) => ({ poHeaderOpen: !s.poHeaderOpen }))}>
        <div className="doc-fields" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          <label>
            <span className="field-label field-label--xs" style={{ display: 'block' }}>
              {t.poTypeLabel}
            </span>
            <select
              className="input input--sm"
              value={po.poType}
              disabled={!isDraft}
              onChange={(e) => pos.updatePo(po.id, { poType: e.target.value as PurchaseOrder['poType'] })}
            >
              <option value="noPr">{t.poTypeNoPr}</option>
              <option value="fromPr">{t.poTypeFromPr}</option>
            </select>
          </label>

          <label>
            <span className="field-label field-label--xs" style={{ display: 'block' }}>
              {t.createDate}
            </span>
            <input
              className="input input--sm"
              type="date"
              value={po.date}
              disabled={!isDraft}
              onChange={(e) => pos.updatePo(po.id, { date: e.target.value })}
            />
          </label>

          {po.poType === 'fromPr' ? (
            <label>
              <span className="field-label field-label--xs" style={{ display: 'block' }}>
                {t.refPrNo}
              </span>
              <input
                className="input input--sm"
                value={po.refPrNo}
                disabled={!isDraft}
                onChange={(e) => pos.updatePo(po.id, { refPrNo: e.target.value })}
              />
            </label>
          ) : (
            <div />
          )}

          <ReadOnlyField label={t.poNo} value={po.no || '—'} strong />

          <label>
            <span className="field-label field-label--xs" style={{ display: 'block' }}>
              {t.vendorCode}
            </span>
            <input
              className="input input--sm"
              value={po.vendorCode}
              disabled={!isDraft}
              onChange={(e) => pos.updatePo(po.id, { vendorCode: e.target.value })}
            />
          </label>

          <ReadOnlyField label={t.vendorName} value={vendor?.name ?? '—'} />
        </div>
      </DocSection>

      <DocSection title={t.poItems} open={pos.poItemsOpen} onToggle={() => pos.set((s) => ({ poItemsOpen: !s.poItemsOpen }))}>
        <div className="line-head" style={{ gridTemplateColumns: ITEM_COLS }}>
          <div>{t.seqNo}</div>
          <div>{t.materialCode}</div>
          <div>{t.material}</div>
          <div className="num">{t.qty}</div>
          <div className="num">{t.unitCost}</div>
          <div className="num">{t.lineTotal}</div>
          <div />
        </div>

        <div className="line-rows">
          {po.items.map((it, idx) => {
            const mat = pos.materials.find((m) => m.code === it.materialCode);
            return (
              <div key={idx} className="line-row" style={{ gridTemplateColumns: ITEM_COLS }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>{idx + 1}</div>
                {isDraft ? (
                  <input
                    className="input input--xs"
                    value={it.materialCode}
                    aria-label={t.materialCode}
                    onChange={(e) => pos.updatePoItem(po.id, idx, { materialCode: e.target.value })}
                  />
                ) : (
                  <div className="readonly-cell">{it.materialCode}</div>
                )}
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {mat?.name ?? '—'} <span style={{ color: '#c0c0cc' }}>({mat?.unit ?? ''})</span>
                </div>
                {isDraft ? (
                  <input
                    className="input input--xs input--right"
                    type="number"
                    value={it.qty}
                    aria-label={t.qty}
                    onChange={(e) => pos.updatePoItem(po.id, idx, { qty: Number(e.target.value) })}
                  />
                ) : (
                  <div className="readonly-cell num">{it.qty}</div>
                )}
                {isDraft ? (
                  <input
                    className="input input--xs input--right"
                    type="number"
                    step="0.0001"
                    value={it.price}
                    aria-label={t.unitCost}
                    onChange={(e) => pos.updatePoItem(po.id, idx, { price: Number(e.target.value) })}
                  />
                ) : (
                  <div className="num" style={{ fontSize: 12.5 }}>
                    {pos.fmt(it.price)}
                  </div>
                )}
                <div className="num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                  {pos.fmt(it.qty * it.price)}
                </div>
                {isDraft ? (
                  <button
                    type="button"
                    className="icon-btn icon-btn--plain"
                    aria-label={`${t.actionsCol} ${it.materialCode}`}
                    onClick={() => pos.removePoItem(po.id, idx)}
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
          <button type="button" className="link-action" onClick={() => pos.addPoItem(po.id)}>
            + {t.insertItem}
          </button>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, fontSize: 13, fontWeight: 800 }}>
          {t.docTotal}: {pos.fmt(grandTotal)}
        </div>
      </DocSection>

      <DocSection title={t.poSchedule} open={pos.poScheduleOpen} onToggle={() => pos.set((s) => ({ poScheduleOpen: !s.poScheduleOpen }))}>
        <div className="line-head" style={{ gridTemplateColumns: SCHEDULE_COLS }}>
          <div>{t.materialCode}</div>
          <div>{t.startDeliveryDate}</div>
          <div>{t.deliveryDate}</div>
          <div className="num">{t.scheduleQty}</div>
          <div />
        </div>

        <div className="line-rows">
          {po.schedule.map((sc, idx) => (
            <div key={idx} className="line-row" style={{ gridTemplateColumns: SCHEDULE_COLS }}>
              {isDraft ? (
                <input
                  className="input input--xs"
                  value={sc.materialCode}
                  aria-label={t.materialCode}
                  onChange={(e) => pos.updatePoScheduleItem(po.id, idx, { materialCode: e.target.value })}
                />
              ) : (
                <div className="readonly-cell">{sc.materialCode}</div>
              )}
              {isDraft ? (
                <input
                  className="input input--xs"
                  type="date"
                  value={sc.startDate}
                  aria-label={t.startDeliveryDate}
                  onChange={(e) => pos.updatePoScheduleItem(po.id, idx, { startDate: e.target.value })}
                />
              ) : (
                <div style={{ fontSize: 12.5 }}>{sc.startDate}</div>
              )}
              {isDraft ? (
                <input
                  className="input input--xs"
                  type="date"
                  value={sc.deliveryDate}
                  aria-label={t.deliveryDate}
                  onChange={(e) => pos.updatePoScheduleItem(po.id, idx, { deliveryDate: e.target.value })}
                />
              ) : (
                <div style={{ fontSize: 12.5 }}>{sc.deliveryDate}</div>
              )}
              {isDraft ? (
                <input
                  className="input input--xs input--right"
                  type="number"
                  value={sc.scheduleQty}
                  aria-label={t.scheduleQty}
                  onChange={(e) => pos.updatePoScheduleItem(po.id, idx, { scheduleQty: Number(e.target.value) })}
                />
              ) : (
                <div className="readonly-cell num">{sc.scheduleQty}</div>
              )}
              {isDraft ? (
                <button
                  type="button"
                  className="icon-btn icon-btn--plain"
                  aria-label={`${t.actionsCol} ${sc.materialCode}`}
                  onClick={() => pos.removePoSchedule(po.id, idx)}
                >
                  <Icon name="trash" size={14} />
                </button>
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>

        {isDraft && (
          <button type="button" className="link-action" onClick={() => pos.addPoSchedule(po.id)}>
            + {t.insertItem}
          </button>
        )}
      </DocSection>

      {isDraft && (
        <div className="doc-actions">
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => pos.requestConfirm(t.confirmSaveMsg, () => pos.savePo(po.id))}
          >
            {t.savePo}
          </button>
        </div>
      )}
    </div>
  );
}

export function PoTab() {
  const pos = usePos();
  const { t } = pos;
  const { previewInWindow } = usePrinting();

  return (
    <>
      <button type="button" className="btn btn--primary" style={{ marginBottom: 16, fontSize: 13 }} onClick={pos.addPo}>
        + {t.addPo}
      </button>

      <div className="card table-list">
        <div className="grid-head" style={{ gridTemplateColumns: COLS }}>
          <div>{t.docNo}</div>
          <div>{t.date}</div>
          <div>{t.supplier}</div>
          <div className="num">{t.docTotal}</div>
          <div>{t.usersTable.status}</div>
          <div />
        </div>

        {pos.purchaseOrders.map((po) => {
          const expanded = pos.expandedPoId === po.id;
          const vendor = pos.vendors.find((v) => v.code === po.vendorCode);
          const total = po.items.reduce((sum, it) => sum + it.qty * it.price, 0);
          return (
            <div key={po.id}>
              <DocRow
                columns={COLS}
                expanded={expanded}
                onToggle={() => pos.set((s) => ({ expandedPoId: s.expandedPoId === po.id ? null : po.id }))}
                onPrint={() => previewInWindow({ type: 'po', doc: po })}
                printLabel={`${t.printDoc} ${po.no || t.po}`}
                expandLabel={`${t.clickToView}: ${po.no || t.po}`}
                cells={[
                  <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{po.no || '—'}</span>,
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{po.date}</span>,
                  <span style={{ color: 'var(--text-muted)' }}>{vendor?.name ?? '—'}</span>,
                  <span className="num" style={{ fontWeight: 700, display: 'block' }}>
                    {pos.fmt(total)}
                  </span>,
                  <StatusBadge status={po.status} t={t} />,
                ]}
              />
              {expanded && <PoDetail po={po} />}
            </div>
          );
        })}
      </div>
    </>
  );
}
