import { useCartTotals } from '../hooks/useCartTotals';
import { usePos } from '../store/PosContext';

/**
 * Thermal-printer receipt (58mm) for the payment success step. Invisible on
 * screen — only rendered via `@media print` (see styles.css's `.receipt`
 * rules, scoped to `.modal--pay`'s children) when the customer's copy is
 * printed. Reads the live cart, which is why this only makes sense while
 * still on the success step — "New Order" clears it.
 */
export function Receipt() {
  const pos = usePos();
  const { t, storeSettings, currentUser, saleRef, saleCompletedAt, paymentMethodKey } = pos;
  const { cartLines, subtotal, tax, total, taxRate } = useCartTotals();

  const dateLabel = saleCompletedAt
    ? new Date(saleCompletedAt).toLocaleString(pos.lang === 'th' ? 'th-TH' : 'en-GB', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '';

  return (
    <div className="receipt" aria-hidden="true">
      <div className="receipt__store">{storeSettings.name}</div>
      {storeSettings.businessType && <div className="receipt__muted">{storeSettings.businessType}</div>}
      <div className="receipt__muted">
        {dateLabel}
        {saleRef ? ` · ${t.receiptRef} ${saleRef}` : ''}
      </div>

      <div className="receipt__divider" />
      <div className="receipt__muted">
        {t.receiptCashier}: {currentUser?.name ?? ''}
      </div>
      <div className="receipt__divider" />

      {cartLines.map((line) => (
        <div key={line.product.id} className="receipt__item">
          <div>{line.product.name}</div>
          <div className="receipt__item-row">
            <span className="receipt__muted">
              {line.qty} x {pos.fmt(line.product.price)}
            </span>
            <span>{pos.fmt(line.product.price * line.qty)}</span>
          </div>
        </div>
      ))}

      <div className="receipt__divider" />
      <div className="receipt__row">
        <span>{t.subtotal}</span>
        <span>{pos.fmt(subtotal)}</span>
      </div>
      <div className="receipt__row">
        <span>{`${t.taxLabelPrefix} (${taxRate}%)`}</span>
        <span>{pos.fmt(tax)}</span>
      </div>
      <div className="receipt__row receipt__row--total">
        <span>{t.total}</span>
        <span>{pos.fmt(total)}</span>
      </div>

      <div className="receipt__divider" />
      <div className="receipt__muted receipt__center">
        {t.receiptPaidVia}: {t.paymentMethods[paymentMethodKey ?? 'cash']}
      </div>
      <div className="receipt__thanks">{t.receiptThankYou}</div>
    </div>
  );
}
