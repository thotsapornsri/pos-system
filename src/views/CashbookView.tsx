import { useState } from 'react';
import { usePos } from '../store/PosContext';
import { totalsFor, type CashPeriodKey } from '../lib/cashbookStats';
import { today } from '../lib/format';
import { Icon } from '../components/ui/Icon';

const PERIODS: CashPeriodKey[] = ['day', 'week', 'month', 'year'];

function AddEntryForm({ onClose }: { onClose: () => void }) {
  const pos = usePos();
  const { t } = pos;
  const [date, setDate] = useState(today());
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState(0);

  return (
    <form
      className="card card--pad"
      style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (amount <= 0) return;
        pos.addCashEntry({ date, type, category, note, amount });
        onClose();
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className={`pill pill--sm${type === 'income' ? ' pill--active' : ''}`}
          onClick={() => setType('income')}
        >
          {t.income}
        </button>
        <button
          type="button"
          className={`pill pill--sm${type === 'expense' ? ' pill--active' : ''}`}
          onClick={() => setType('expense')}
        >
          {t.expense}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label>
          <span className="field-label field-label--xs" style={{ display: 'block' }}>
            {t.entryDate}
          </span>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          <span className="field-label field-label--xs" style={{ display: 'block' }}>
            {t.entryAmount}
          </span>
          <input
            className="input"
            type="number"
            step="any"
            min="0"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </label>
        <label>
          <span className="field-label field-label--xs" style={{ display: 'block' }}>
            {t.entryCategory}
          </span>
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <label>
          <span className="field-label field-label--xs" style={{ display: 'block' }}>
            {t.entryNote}
          </span>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--neutral" onClick={onClose}>
          {t.cancel}
        </button>
        <button type="submit" className="btn btn--primary">
          {t.save}
        </button>
      </div>
    </form>
  );
}

export function CashbookView() {
  const pos = usePos();
  const { t } = pos;
  const canManage = pos.hasPerm('cashbook');
  const [period, setPeriod] = useState<CashPeriodKey>('day');
  const [showForm, setShowForm] = useState(false);

  const totals = totalsFor(pos.cashEntries, period);
  const { start, end } = (() => {
    // Same range logic as totalsFor — re-derived here just to filter the
    // entry list below, so it stays visually consistent with the totals.
    const now = new Date();
    if (period === 'day') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const e = new Date(s);
      e.setDate(s.getDate() + 1);
      return { start: s, end: e };
    }
    if (period === 'week') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
      const e = new Date(s);
      e.setDate(s.getDate() + 7);
      return { start: s, end: e };
    }
    if (period === 'month') {
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    }
    return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) };
  })();
  const entries = pos.cashEntries
    .filter((e) => {
      const d = new Date(e.date);
      return d >= start && d < end;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map((key) => (
            <button
              key={key}
              type="button"
              className={`pill${period === key ? ' pill--active' : ''}`}
              onClick={() => setPeriod(key)}
            >
              {t.periods[key]}
            </button>
          ))}
        </div>
        {canManage && (
          <button type="button" className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
            <Icon name="wallet" size={14} />+ {t.addEntry}
          </button>
        )}
      </div>

      {showForm && canManage && <AddEntryForm onClose={() => setShowForm(false)} />}

      <div className="kpis" style={{ marginBottom: 16 }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 8 }}>
            {t.totalIncome}
          </div>
          <div className="display" style={{ fontSize: 20, color: 'var(--success)' }}>
            {pos.fmt(totals.income)}
          </div>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 8 }}>
            {t.totalExpense}
          </div>
          <div className="display" style={{ fontSize: 20, color: 'var(--danger)' }}>
            {pos.fmt(totals.expense)}
          </div>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 8 }}>
            {t.netCashflow}
          </div>
          <div className="display" style={{ fontSize: 20, color: totals.net >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
            {pos.fmt(totals.net)}
          </div>
        </div>
      </div>

      <div className="card table-list">
        <div className="grid-head" style={{ gridTemplateColumns: '1fr 1fr 1.4fr 1.4fr 1fr auto', background: 'transparent', fontSize: 11.5, padding: '14px 20px' }}>
          <div>{t.entryDate}</div>
          <div>{t.entryType}</div>
          <div>{t.entryCategory}</div>
          <div>{t.entryNote}</div>
          <div className="num">{t.entryAmount}</div>
          {canManage && <div>{t.actionsCol}</div>}
        </div>

        {entries.map((e) => (
          <div key={e.id} className="grid-row" style={{ gridTemplateColumns: '1fr 1fr 1.4fr 1.4fr 1fr auto' }}>
            <div style={{ color: 'var(--text-muted)' }}>{e.date}</div>
            <div style={{ color: e.type === 'income' ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
              {e.type === 'income' ? t.income : t.expense}
            </div>
            <div>{e.category || '—'}</div>
            <div className="truncate" style={{ color: 'var(--text-muted)' }}>
              {e.note || '—'}
            </div>
            <div className="num" style={{ fontWeight: 700 }}>
              {pos.fmt(e.amount)}
            </div>
            {canManage && (
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                aria-label={`${t.actionsCol} ${e.category || e.date}`}
                onClick={() => pos.deleteCashEntry(e.id)}
              >
                <Icon name="trash" size={14} />
              </button>
            )}
          </div>
        ))}
        {entries.length === 0 && <p className="empty">{t.noEntriesYet}</p>}
      </div>
    </>
  );
}
