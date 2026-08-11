import { usePos } from '../../store/PosContext';
import { usePrinting } from '../../hooks/usePrinting';
import { Icon } from '../../components/ui/Icon';

export function GrTab() {
  const pos = usePos();
  const { t } = pos;
  const { previewInWindow } = usePrinting();

  const openPos = pos.purchaseOrders.filter((p) => p.status === 'ordered');
  const draft = pos.grSelectedPo;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
      <div className="card card--pad">
        <h3 className="card-title" style={{ margin: 0, marginBottom: 12 }}>
          {t.selectPo}
        </h3>

        {openPos.length > 0 ? (
          <>
            <select
              className="input"
              style={{ marginBottom: 16 }}
              aria-label={t.selectPo}
              value={draft?.poId ?? ''}
              onChange={(e) => pos.selectGrPo(e.target.value)}
            >
              <option value="">—</option>
              {openPos.map((p) => {
                const vendor = pos.vendors.find((v) => v.code === p.vendorCode);
                return (
                  <option key={p.id} value={p.id}>
                    {p.no} — {vendor?.name ?? p.vendorCode}
                  </option>
                );
              })}
            </select>

            {draft && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label>
                    <span className="field-label" style={{ display: 'block' }}>
                      {t.scanBarcode}
                    </span>
                    <input
                      className="input"
                      style={{ border: '1.5px solid var(--accent)', background: 'var(--bg-surface)' }}
                      placeholder="RM-001"
                      value={pos.grScanCode}
                      onChange={(e) => pos.set({ grScanCode: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && pos.grScanCode.trim()) {
                          e.preventDefault();
                          pos.scanReceive(pos.grScanCode);
                        }
                      }}
                    />
                  </label>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>{t.scanHint}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {draft.lines.map((l) => {
                    const mat = pos.materials.find((m) => m.code === l.materialCode);
                    const full = l.received >= l.ordered;
                    return (
                      <div
                        key={l.materialCode}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '9px 12px',
                          background: 'var(--bg-muted)',
                          borderRadius: 9,
                        }}
                      >
                        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{mat?.name ?? l.materialCode}</span>
                        <span style={{ fontSize: 12, fontWeight: full ? 700 : 400, color: full ? 'var(--success)' : 'var(--text-muted)' }}>
                          {l.received} / {l.ordered} {mat?.unit ?? ''}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  style={{ padding: 13, borderRadius: 10, fontSize: 13 }}
                  onClick={() => pos.requestConfirm(t.confirmSaveMsg, pos.completeGoodsReceipt)}
                >
                  {t.completeGr}
                </button>
              </>
            )}
          </>
        ) : (
          <p className="empty" style={{ padding: '30px 10px' }}>
            {t.noOpenPo}
          </p>
        )}
      </div>

      <div className="card card--pad">
        <h3 className="card-title" style={{ margin: 0, marginBottom: 12 }}>
          {t.gr}
        </h3>
        {pos.goodsReceipts.map((gr) => (
          <div
            key={gr.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px solid var(--border-hair)',
            }}
          >
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{gr.no}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {gr.date} · {gr.lines.length} {t.items}
              </div>
            </div>
            <button
              type="button"
              className="icon-btn icon-btn--lg"
              aria-label={`${t.printDoc} ${gr.no}`}
              onClick={() => previewInWindow({ type: 'gr', doc: gr })}
            >
              <Icon name="print" size={13} />
            </button>
          </div>
        ))}
        {pos.goodsReceipts.length === 0 && <p className="empty">{t.noCompletedDocs}</p>}
      </div>
    </div>
  );
}
