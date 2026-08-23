import { usePos } from '../store/PosContext';
import { Icon } from '../components/ui/Icon';
import { ImageSlot } from '../components/ui/ImageSlot';
import { useCartTotals } from '../hooks/useCartTotals';

export function SalesView() {
  const pos = usePos();
  const { t } = pos;
  const { cartLines, cartCount, subtotal, tax, total, taxRate } = useCartTotals();
  // Product prices are tax-inclusive; back the per-unit tax portion out of
  // each price so it can be shown alongside it (e.g. "฿12.00 · incl. tax ฿0.79").
  const unitTax = (price: number) => price - price / (1 + taxRate / 100);

  const query = pos.searchQuery.trim().toLowerCase();
  // Hiding a category (Categories page) hides its products from the selling
  // page entirely — including under "All" — not just its own filter chip.
  const visibleCatNames = new Set(pos.categories.filter((c) => c.visible).map((c) => c.name));
  const visible = pos.products.filter(
    (p) =>
      visibleCatNames.has(p.cat) &&
      (pos.activeCategory === 'All' || p.cat === pos.activeCategory) &&
      (!query || p.name.toLowerCase().includes(query)),
  );

  return (
    <div className="pos">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="search" style={{ marginBottom: 14 }}>
          <input
            className="input"
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            value={pos.searchQuery}
            onChange={(e) => pos.set({ searchQuery: e.target.value })}
          />
          <span className="search__icon">
            <Icon name="search" size={16} strokeWidth={2} />
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`pill${pos.activeCategory === 'All' ? ' pill--active' : ''}`}
            onClick={() => pos.set({ activeCategory: 'All' })}
          >
            {t.allCategories}
          </button>
          {pos.categories
            .filter((c) => c.visible)
            .map((c) => (
              <button
                key={c.id}
                type="button"
                className={`pill${pos.activeCategory === c.name ? ' pill--active' : ''}`}
                onClick={() => pos.set({ activeCategory: c.name })}
              >
                {c.name}
              </button>
            ))}
        </div>

        <div className="pos__grid">
          {visible.map((p) => {
            const expanded = pos.expandedProductId === p.id;
            return (
              <article key={p.id} className="prodcard">
                <button
                  type="button"
                  className="prodcard__art"
                  style={{ background: p.grad }}
                  onClick={() => pos.addToCart(p.id)}
                  aria-label={`${t.addItem}: ${p.name}`}
                >
                  <span style={{ pointerEvents: 'none', display: 'block', width: '100%', height: '100%' }}>
                    <ImageSlot id={`prod-img-${p.id}`} shape="rect" placeholder={p.initial} fontSize={22} tone="light" interactive={false} />
                  </span>
                </button>

                <button type="button" className="prodcard__body" onClick={() => pos.addToCart(p.id)}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, marginBottom: 2 }}>{p.name}</span>
                  <span className="truncate" style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
                    {p.description}
                  </span>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--accent)' }}>
                        {pos.fmt(p.price)}
                      </span>
                      <span style={{ display: 'block', fontSize: 9.5, color: 'var(--text-dim)' }}>
                        {t.inclTax(pos.fmt(unitTax(p.price)))}
                      </span>
                    </span>
                    <span
                      style={{
                        width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-chip)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 700, color: 'var(--text-muted)',
                      }}
                    >
                      +
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className="prodcard__more"
                  aria-expanded={expanded}
                  onClick={() => pos.set({ expandedProductId: expanded ? null : p.id })}
                >
                  <span>{t.viewMore}</span>
                  <Icon
                    name="chevronDown"
                    size={11}
                    strokeWidth={2}
                    className="chevron"
                    style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
                  />
                </button>

                {expanded && (
                  <div className="prodcard__detail">
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, marginBottom: 8 }}>
                      {p.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-dim)' }}>
                      <span>
                        {t.stockCol}: {p.stock} {p.unit}
                      </span>
                      <span>
                        {t.categoryCol}: {p.cat}
                      </span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <aside className="cart">
        <h2 className="display" style={{ fontSize: 15, margin: 0, marginBottom: 14 }}>
          {t.currentOrder} · {cartCount} {t.items}
        </h2>

        {cartLines.length > 0 ? (
          <>
            <div className="cart__lines">
              {cartLines.map((line) => (
                <div key={line.product.id} className="cart__line">
                  <div
                    className="avatar"
                    style={{ width: 38, height: 38, borderRadius: 9, background: line.product.grad, fontSize: 14, fontFamily: 'var(--font-display)' }}
                  >
                    {line.product.initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: 12.5, fontWeight: 700 }}>
                      {line.product.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#8a8a9a' }}>
                      {pos.fmt(line.product.price)} · {t.inclTax(pos.fmt(unitTax(line.product.price)))}
                    </div>
                  </div>
                  <div className="stepper">
                    <button type="button" onClick={() => pos.decQty(line.product.id)} aria-label={`−1 ${line.product.name}`}>
                      –
                    </button>
                    <span style={{ fontSize: 12.5, fontWeight: 700, width: 16, textAlign: 'center' }}>{line.qty}</span>
                    <button type="button" onClick={() => pos.addToCart(line.product.id)} aria-label={`+1 ${line.product.name}`}>
                      +
                    </button>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, width: 64, textAlign: 'right', flex: 'none' }}>
                    {pos.fmt(line.product.price * line.qty)}
                  </div>
                </div>
              ))}
            </div>

            <div className="totals">
              <div className="totals__row">
                <span>{t.subtotal}</span>
                <span>{pos.fmt(subtotal)}</span>
              </div>
              <div className="totals__row">
                <span>{`${t.taxLabelPrefix} (${taxRate}%)`}</span>
                <span>{pos.fmt(tax)}</span>
              </div>
              <div className="totals__row totals__row--grand">
                <span>{t.total}</span>
                <span>{pos.fmt(total)}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => pos.set({ paymentOpen: true, paymentStep: 'method', matchedTxnId: null })}
            >
              {t.charge} {pos.fmt(total)}
            </button>
          </>
        ) : (
          <p className="empty">{t.cartEmpty}</p>
        )}
      </aside>
    </div>
  );
}
