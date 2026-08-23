import { exportCSV, exportPDF } from '../lib/export';
import { usePos } from '../store/PosContext';
import { Icon } from '../components/ui/Icon';
import { ImageSlot } from '../components/ui/ImageSlot';
import { EditDeleteActions } from '../components/ui/primitives';

export function ProductsView() {
  const pos = usePos();
  const { t } = pos;
  const canManage = pos.hasPerm('inventory');

  const query = pos.productSearch.trim().toLowerCase();
  const rows = pos.products.filter((p) => !query || p.name.toLowerCase().includes(query));
  const cols = canManage ? '1fr 1.8fr 1fr 1fr 1fr 1fr 1fr' : '1fr 1.8fr 1fr 1fr 1fr 1fr';

  const doExportExcel = () =>
    exportCSV(
      'products.csv',
      [t.productCol, t.categoryCol, t.priceCol, t.stockCol, t.unitCol, t.productDescription],
      rows.map((p) => [p.name, p.cat, pos.fmt(p.price), p.stock, p.unit, p.description]),
    );

  const openAdd = () =>
    pos.openModal({
      type: 'product',
      mode: 'add',
      data: {
        code: `PRD-${String(pos.products.length + 1).padStart(3, '0')}`,
        name: '',
        cat: pos.categories[0]?.name ?? '',
        price: 0,
        stock: 0,
        unit: 'ชิ้น',
        initial: 'N',
        description: '',
      },
    });

  return (
    <>
      <div className="viewhead">
        <div>
          <h2 className="display" style={{ fontSize: 16, margin: 0, marginBottom: 2 }}>
            {t.productListTitle}
          </h2>
          <p className="card-sub" style={{ margin: 0 }}>
            {rows.length} {t.items}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="search search--sm" style={{ width: 260 }}>
            <input
              className="input"
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              value={pos.productSearch}
              onChange={(e) => pos.set({ productSearch: e.target.value })}
            />
            <span className="search__icon">
              <Icon name="search" size={14} strokeWidth={2} />
            </span>
          </div>
          <button type="button" className="btn btn--ghost" onClick={exportPDF}>
            <Icon name="doc" size={14} />
            PDF
          </button>
          <button type="button" className="btn btn--ghost" onClick={doExportExcel}>
            <Icon name="sheet" size={14} />
            Excel
          </button>
          {canManage && (
            <button type="button" className="btn btn--primary" onClick={openAdd}>
              + {t.addProduct}
            </button>
          )}
        </div>
      </div>

      <div className="card table-list">
        <div className="grid-head" style={{ gridTemplateColumns: cols }}>
          <div>{t.productCode}</div>
          <div>{t.productCol}</div>
          <div>{t.categoryCol}</div>
          <div className="num">{t.priceCol}</div>
          <div className="num">{t.stockCol}</div>
          <div>{t.unitCol}</div>
          {canManage && <div>{t.actionsCol}</div>}
        </div>

        {rows.map((p) => (
          <div key={p.id} className="grid-row grid-row--hover" style={{ gridTemplateColumns: cols }}>
            <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{p.code}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, flex: 'none', background: p.grad, borderRadius: 8 }}>
                <ImageSlot id={`prod-img-${p.id}`} shape="rounded" radius={8} placeholder={p.initial} fontSize={13} tone="light" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="truncate" style={{ fontWeight: 700 }}>
                  {p.name}
                </div>
                <div className="truncate" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {p.description}
                </div>
              </div>
            </div>
            <div>
              <span className="tag">{p.cat}</span>
            </div>
            <div className="num" style={{ fontWeight: 700 }}>
              {pos.fmt(p.price)}
            </div>
            <div className="num" style={{ color: 'var(--text-muted)' }}>
              {p.stock}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>{p.unit}</div>
            {canManage && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`${t.copyProduct} ${p.name}`}
                  title={t.copyProduct}
                  onClick={() => pos.duplicateProduct(p.id)}
                >
                  <Icon name="copy" size={14} />
                </button>
                <EditDeleteActions
                  editLabel={`${t.save} ${p.name}`}
                  deleteLabel={`${t.actionsCol} ${p.name}`}
                  onEdit={() =>
                    pos.openModal({ type: 'product', mode: 'edit', data: { ...p } as unknown as Record<string, string | number> })
                  }
                  onDelete={() => pos.deleteProduct(p.id)}
                />
              </div>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="empty">{t.searchPlaceholder}</p>}
      </div>
    </>
  );
}
