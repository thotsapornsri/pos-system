import { BEST_SELLERS, PERIOD_DATA, WORST_SELLERS, type PeriodKey } from '../data/seed';
import { usePos } from '../store/PosContext';
import { Icon } from '../components/ui/Icon';

const PERIODS: PeriodKey[] = ['day', 'month', 'year'];

export function DashboardView() {
  const pos = usePos();
  const { t } = pos;
  const pd = PERIOD_DATA[pos.dashboardPeriod];
  const maxBar = Math.max(...pd.bars, 1);
  const isOwner = pos.currentUser?.role === 'Owner';

  const denom = pd.cogs + pd.opex + pd.net || 1;
  const cogsDeg = (pd.cogs / denom) * 360;
  const opexDeg = (pd.opex / denom) * 360;
  const donut = `conic-gradient(#d0453a 0deg ${cogsDeg}deg, #f59e0b ${cogsDeg}deg ${cogsDeg + opexDeg}deg, var(--accent) ${cogsDeg + opexDeg}deg 360deg)`;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map((key) => (
            <button
              key={key}
              type="button"
              className={`pill${pos.dashboardPeriod === key ? ' pill--active' : ''}`}
              onClick={() => pos.set({ dashboardPeriod: key })}
            >
              {t.periods[key]}
            </button>
          ))}
        </div>
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
      </div>

      <div className="kpis">
        {pd.kpis.map(([key, value, delta]) => (
          <div key={key} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 8 }}>
              {t.kpi[key]}
            </div>
            <div className="display" style={{ fontSize: 20, marginBottom: 6 }}>
              {typeof value === 'number' ? pos.fmt(value) : value}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {delta >= 0 ? '+' : ''}
              {delta}% {t.vsPrior}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card card--pad">
          <h3 className="card-title" style={{ margin: 0, marginBottom: 16 }}>
            {t.revenueTrend}
          </h3>
          <div className="chart">
            {pd.bars.map((v, i) => (
              <div key={i} className="chart__col">
                <div className="chart__bar" style={{ height: `${(v / maxBar) * 100}%`, opacity: 0.55 + (v / maxBar) * 0.45 }} />
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>{pd.barLabels[i]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card--pad">
          <h3 className="card-title" style={{ margin: 0, marginBottom: 16 }}>
            {t.costVsProfit}
          </h3>
          <div className="donut" style={{ background: donut }} role="img" aria-label={t.costVsProfit} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>{t.cogs}</span>
              <span style={{ fontWeight: 700 }}>{pos.fmt(pd.cogs)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>{t.opex}</span>
              <span style={{ fontWeight: 700 }}>{pos.fmt(pd.opex)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px dashed var(--border-strong)', paddingTop: 8 }}>
              <span style={{ fontWeight: 700 }}>{t.netProfit}</span>
              <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{pos.fmt(pd.net)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card card--pad">
          <h3 className="card-title" style={{ margin: 0, marginBottom: 14 }}>
            {t.bestSellers}
          </h3>
          {BEST_SELLERS.map(([name, qty], i) => (
            <div key={name} className="rank-row">
              <span style={{ color: 'var(--text-muted)' }}>
                {i + 1}. {name}
              </span>
              <span style={{ fontWeight: 700 }}>
                {qty} {t.sold}
              </span>
            </div>
          ))}
          {BEST_SELLERS.length === 0 && <p className="empty">{t.noSalesYet}</p>}
        </div>
        <div className="card card--pad">
          <h3 className="card-title" style={{ margin: 0, marginBottom: 14 }}>
            {t.needsAttention}
          </h3>
          {WORST_SELLERS.map(([name, qty]) => (
            <div key={name} className="rank-row">
              <span style={{ color: 'var(--text-muted)' }}>{name}</span>
              <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                {qty} {t.sold}
              </span>
            </div>
          ))}
          {WORST_SELLERS.length === 0 && <p className="empty">{t.noSalesYet}</p>}
        </div>
      </div>
    </>
  );
}
