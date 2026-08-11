import { useMemo } from 'react';
import { useCartTotals } from '../../hooks/useCartTotals';
import { usePos } from '../../store/PosContext';

export function PaymentModal() {
  const pos = usePos();
  const { t } = pos;
  const { total } = useCartTotals();

  const bankTxns = useMemo(
    () => [
      { id: 't1', who: 'Somchai Prasert', time: 'Just now', amount: total },
      { id: 't2', who: 'Kanya Wattana', time: '2 min ago', amount: total + 4.2 },
      { id: 't3', who: 'Niran Boonmee', time: '5 min ago', amount: total - 1.8 },
    ],
    [total],
  );

  if (!pos.paymentOpen) return null;

  const pay = () => {
    pos.completeSale();
    pos.set({ paymentStep: 'success' });
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="pay-title">
      <div className="modal modal--pay">
        {pos.paymentStep === 'method' && (
          <>
            <h2 id="pay-title" className="display" style={{ fontSize: 17, margin: 0, marginBottom: 4 }}>
              {t.takePayment}
            </h2>
            <p style={{ fontSize: 13, color: '#8a8a9a', margin: 0, marginBottom: 20 }}>
              {t.totalDue} {pos.fmt(total)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { name: t.paymentMethods.cash, icon: '$', onClick: pay },
                { name: t.paymentMethods.card, icon: '⎯', onClick: pay },
                { name: t.paymentMethods.bank, icon: 'B', onClick: () => pos.set({ paymentStep: 'matching' }) },
              ].map((m) => (
                <button key={m.name} type="button" className="paymethod" onClick={m.onClick}>
                  <span
                    style={{
                      width: 34, height: 34, borderRadius: 9, background: 'var(--bg-chip)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13, color: 'var(--text-muted)',
                    }}
                  >
                    {m.icon}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{m.name}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn"
              style={{ width: '100%', fontSize: 12.5, color: 'var(--text-dim)' }}
              onClick={() => pos.set({ paymentOpen: false })}
            >
              {t.cancel}
            </button>
          </>
        )}

        {pos.paymentStep === 'matching' && (
          <>
            <h2 id="pay-title" className="display" style={{ fontSize: 17, margin: 0, marginBottom: 4 }}>
              {t.confirmBank}
            </h2>
            <p style={{ fontSize: 13, color: '#8a8a9a', margin: 0, marginBottom: 18 }}>
              {t.matchStatement} ({pos.fmt(total)})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {bankTxns.map((tx) => {
                const matches = Math.abs(tx.amount - total) < 0.01;
                return (
                  <button
                    key={tx.id}
                    type="button"
                    className={`txn${pos.matchedTxnId === tx.id ? ' txn--matched' : ''}`}
                    onClick={() => {
                      if (!matches) return;
                      pos.completeSale();
                      pos.set({ matchedTxnId: tx.id, paymentStep: 'success' });
                    }}
                  >
                    <span>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: 13 }}>{tx.who}</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)' }}>{tx.time}</span>
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 14, color: matches ? 'var(--success)' : 'var(--text)' }}>
                      {pos.fmt(tx.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="btn"
              style={{ width: '100%', fontSize: 12.5, color: 'var(--text-dim)' }}
              onClick={() => pos.set({ paymentOpen: false })}
            >
              {t.cancel}
            </button>
          </>
        )}

        {pos.paymentStep === 'success' && (
          <>
            <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
              <div
                style={{
                  width: 56, height: 56, borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontWeight: 700, margin: '0 auto 16px',
                }}
                aria-hidden="true"
              >
                ✓
              </div>
              <h2 id="pay-title" className="display" style={{ fontSize: 17, margin: 0, marginBottom: 6 }}>
                {t.paymentConfirmed}
              </h2>
              <p style={{ fontSize: 13, color: '#8a8a9a', margin: 0, marginBottom: 22 }}>
                {pos.fmt(total)} {t.receivedVia}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="button" className="btn btn--primary btn--block" style={{ padding: 13, fontSize: 13.5 }} onClick={() => window.print()}>
                {t.printReceipt}
              </button>
              <button
                type="button"
                className="btn btn--neutral btn--block"
                style={{ padding: 13, fontSize: 13.5 }}
                onClick={() => pos.set({ paymentOpen: false, cart: {}, matchedTxnId: null, paymentStep: 'method' })}
              >
                {t.newOrder}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
