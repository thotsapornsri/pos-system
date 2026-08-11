import { usePrinting } from '../../hooks/usePrinting';
import { usePos } from '../../store/PosContext';

export function PrintPreviewModal() {
  const pos = usePos();
  const { t } = pos;
  const { toPrintData } = usePrinting();

  if (!pos.printDoc) return null;
  const pd = toPrintData(pos.printDoc);

  return (
    <div className="overlay overlay--dark" style={{ zIndex: 80 }} role="dialog" aria-modal="true" aria-labelledby="print-title">
      <div className="modal modal--print">
        <div className="printdoc">
          <div className="printdoc__head">
            <div>
              <div className="display" style={{ fontSize: 20 }}>
                {pos.storeSettings.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{pos.storeSettings.businessType}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div id="print-title" className="display" style={{ fontSize: 16 }}>
                {pd.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pd.no}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{pd.date}</div>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{pd.party}</div>

          <table>
            <thead>
              <tr>
                {pd.cols.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pd.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {pd.showTotal && (
            <div className="printdoc__total">
              {t.docTotal}: {pd.totalLabel}
            </div>
          )}
        </div>

        <div className="modal__actions" style={{ padding: '0 36px 30px' }}>
          <button type="button" className="btn btn--neutral" onClick={() => pos.set({ printDoc: null })}>
            {t.close}
          </button>
          <button type="button" className="btn btn--primary" onClick={() => window.print()}>
            {t.printDoc}
          </button>
        </div>
      </div>
    </div>
  );
}
