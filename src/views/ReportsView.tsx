import { DAILY_SALES, MONTHLY_SALES, YEARLY_SALES } from '../data/seed';
import { exportCSV, exportPDF } from '../lib/export';
import { usePos } from '../store/PosContext';
import { Icon } from '../components/ui/Icon';

function ReportTable({
  title,
  cols,
  gridTemplate,
  rows,
  align,
}: {
  title: string;
  cols: string[];
  gridTemplate: string;
  rows: (string | number)[][];
  align: ('left' | 'right')[];
}) {
  return (
    <div className="card card--pad">
      <h3 className="card-title" style={{ margin: 0, marginBottom: 12 }}>
        {title}
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridTemplate,
          gap: 16,
          padding: '8px 0',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        {cols.map((c, i) => (
          <div key={c} style={{ textAlign: align[i] }}>
            {c}
          </div>
        ))}
      </div>
      {rows.map((r, ri) => (
        <div
          key={ri}
          style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            gap: 16,
            padding: '9px 0',
            fontSize: 13,
            borderBottom: '1px solid var(--border-hair)',
          }}
        >
          {r.map((cell, ci) => (
            <div
              key={ci}
              style={{
                textAlign: align[ci],
                fontWeight: ci === 0 || ci === r.length - 1 ? 700 : 400,
                color: ci === 0 || ci === r.length - 1 ? 'var(--text)' : 'var(--text-muted)',
              }}
            >
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ReportsView() {
  const pos = usePos();
  const { t } = pos;
  const isOwner = pos.currentUser?.role === 'Owner';
  const showFull = pos.currentUser?.role !== 'Cashier';
  const tab = (pos.reportTab === 'monthly' || pos.reportTab === 'yearly') && !showFull ? 'daily' : pos.reportTab;

  const dailyRows = DAILY_SALES.map(([d, rev, ord]) => [d, ord, pos.fmt(rev)]);
  const monthlyRows = MONTHLY_SALES.map(([m, rev]) => [m, pos.fmt(rev)]);
  const yearlyRows = YEARLY_SALES.map(([y, rev]) => [y, pos.fmt(rev)]);
  const stockRows = pos.products.map((p) => [p.name, `${p.stock} ${p.unit}`, pos.fmt(p.price * p.stock)]);
  const movementRows = pos.movements.slice(0, 20);

  const exportCurrent = () => {
    const map = {
      daily: [t.dailySales, [t.colDate, t.colOrders, t.colRevenue], dailyRows],
      monthly: [t.monthlySales, [t.colMonth, t.colRevenue], monthlyRows],
      yearly: [t.yearlySales, [t.colYear, t.colRevenue], yearlyRows],
      stock: [t.stockReport, [t.colItem, t.colQty, t.colValue], stockRows],
      movement: [
        t.movementReport,
        [t.colTime, t.colItem, t.colType, t.colQty],
        movementRows.map((m) => [m.ts, m.item, m.qty >= 0 ? t.moveIn : t.moveOut, `${m.qty >= 0 ? '+' : ''}${m.qty} ${m.unit}`]),
      ],
    } as const;
    const [name, headers, rows] = map[tab];
    exportCSV(`${name.replace(/\s+/g, '_')}.csv`, [...headers], rows as (string | number)[][]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 14 }}>
        {isOwner && (
          <button
            type="button"
            className="btn btn--danger-outline"
            onClick={() => pos.requestConfirm(t.confirmResetMsg, pos.resetData)}
          >
            <Icon name="reset" size={14} />
            {t.resetData}
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={exportPDF}>
          <Icon name="doc" size={14} />
          PDF
        </button>
        <button type="button" className="btn btn--ghost" onClick={exportCurrent}>
          <Icon name="sheet" size={14} />
          Excel
        </button>
      </div>

      {tab === 'daily' && (
        <ReportTable title={t.dailySales} cols={[t.colDate, t.colOrders, t.colRevenue]} gridTemplate="1fr 1fr 1fr" rows={dailyRows} align={['left', 'right', 'right']} />
      )}
      {tab === 'monthly' && (
        <ReportTable title={t.monthlySales} cols={[t.colMonth, t.colRevenue]} gridTemplate="1fr 1fr" rows={monthlyRows} align={['left', 'right']} />
      )}
      {tab === 'yearly' && (
        <ReportTable title={t.yearlySales} cols={[t.colYear, t.colRevenue]} gridTemplate="1fr 1fr" rows={yearlyRows} align={['left', 'right']} />
      )}
      {tab === 'stock' && (
        <ReportTable title={t.stockReport} cols={[t.colItem, t.colQty, t.colValue]} gridTemplate="2fr 1fr 1fr" rows={stockRows} align={['left', 'right', 'right']} />
      )}
      {tab === 'movement' && (
        <div className="card card--pad">
          <h3 className="card-title" style={{ margin: 0, marginBottom: 12 }}>
            {t.movementReport}
          </h3>
          {movementRows.map((m, i) => {
            const color = m.qty >= 0 ? 'var(--success)' : 'var(--danger)';
            return (
              <div key={i} className="rank-row">
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{m.item}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
                    {m.ts} · <span style={{ color }}>{m.qty >= 0 ? t.moveIn : t.moveOut}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color, textAlign: 'right' }}>
                  {m.qty >= 0 ? '+' : ''}
                  {m.qty} {m.unit}
                </div>
              </div>
            );
          })}
          {movementRows.length === 0 && <p className="empty">{t.noCompletedDocs}</p>}
        </div>
      )}
    </div>
  );
}
