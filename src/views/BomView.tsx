import { usePos } from '../store/PosContext';
import { Icon } from '../components/ui/Icon';
import { EditDeleteActions } from '../components/ui/primitives';

function RecipeCard({ recipeId }: { recipeId: string }) {
  const pos = usePos();
  const { t } = pos;
  const canManage = pos.hasPerm('bom');

  const recipe = pos.bomRecipes.find((r) => r.id === recipeId);
  if (!recipe) return null;

  const output = pos.products.find((p) => p.id === recipe.outputProductId);
  const totalCost = recipe.ingredients.reduce((sum, ing) => {
    const mat = pos.materials.find((m) => m.id === ing.materialId);
    return sum + (mat ? mat.unitCost * ing.qty : 0);
  }, 0);
  const margin = output && output.price > 0 ? ((output.price - totalCost) / output.price) * 100 : 0;
  const showMsg = pos.bomMsg?.id === recipe.id;

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, gap: 12 }}>
        <label style={{ flex: 1 }}>
          <span className="field-label field-label--xs" style={{ display: 'block' }}>
            {t.outputProduct}
          </span>
          <select
            className="input input--sm"
            style={{ padding: '9px 12px', borderRadius: 9, fontSize: 13 }}
            value={recipe.outputProductId}
            onChange={(e) => pos.updateRecipe(recipe.id, { outputProductId: Number(e.target.value) })}
            disabled={!canManage}
          >
            {pos.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {canManage && (
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            style={{ width: 32, height: 32, borderRadius: 8 }}
            onClick={() => pos.deleteRecipe(recipe.id)}
            aria-label={`${t.actionsCol}: ${output?.name ?? ''}`}
          >
            <Icon name="trash" size={15} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {recipe.ingredients.map((ing, idx) => {
          const mat = pos.materials.find((m) => m.id === ing.materialId);
          return (
            <div
              key={idx}
              className="line-row"
              style={{ gridTemplateColumns: canManage ? '2fr 1fr 1fr auto' : '2fr 1fr 1fr' }}
            >
              <select
                className="input input--xs"
                value={ing.materialId}
                onChange={(e) => pos.updateIngredient(recipe.id, idx, { materialId: e.target.value })}
                disabled={!canManage}
                aria-label={t.material}
              >
                {pos.materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <input
                className="input input--xs"
                type="number"
                value={ing.qty}
                onChange={(e) => pos.updateIngredient(recipe.id, idx, { qty: Number(e.target.value) })}
                disabled={!canManage}
                aria-label={t.qty}
              />
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                {mat ? pos.fmt(mat.unitCost * ing.qty) : '-'}
              </div>
              {canManage && (
                <button
                  type="button"
                  className="icon-btn icon-btn--plain"
                  onClick={() => pos.removeIngredient(recipe.id, idx)}
                  aria-label={`${t.actionsCol}: ${mat?.name ?? ''}`}
                >
                  <Icon name="trash" size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {canManage && (
        <button
          type="button"
          className="link-action"
          style={{ marginBottom: 14 }}
          onClick={() => pos.addIngredient(recipe.id)}
        >
          + {t.addIngredient}
        </button>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          borderTop: '1px dashed var(--border-strong)',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {t.bom.sellsFor} {output ? pos.fmt(output.price) : '-'} · {t.bom.cost} <b>{pos.fmt(totalCost)}</b> ·{' '}
          {t.bom.margin} {margin.toFixed(0)}%
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)', marginRight: 6 }}>{t.batchQty}</span>
            <input
              className="input input--xs"
              type="number"
              style={{ width: 56 }}
              value={recipe.batchQty}
              onChange={(e) => pos.updateRecipe(recipe.id, { batchQty: Math.max(1, Number(e.target.value)) })}
              disabled={!canManage}
            />
          </label>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            style={{ borderRadius: 9, fontSize: 12.5 }}
            onClick={() => pos.processRecipe(recipe.id)}
            disabled={!canManage}
          >
            {t.processBom}
          </button>
        </div>
      </div>

      {showMsg && (
        <div
          role="status"
          style={{
            marginTop: 10,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--success)',
            background: 'var(--success-bg)',
            padding: '8px 12px',
            borderRadius: 8,
          }}
        >
          {pos.bomMsg?.text}
        </div>
      )}
    </div>
  );
}

function MaterialsTable() {
  const pos = usePos();
  const { t } = pos;
  const canManage = pos.hasPerm('bom');
  const cols = canManage ? '1fr 1.6fr 1fr 1fr 1fr 1fr' : '1fr 1.6fr 1fr 1fr 1fr';

  return (
    <>
      {canManage && (
        <button
          type="button"
          className="btn btn--primary"
          style={{ marginBottom: 16, fontSize: 13 }}
          onClick={() =>
            pos.openModal({
              type: 'material',
              mode: 'add',
              data: { code: `RM-${String(pos.materials.length + 1).padStart(3, '0')}`, name: '', stock: 0, unit: 'g', unitCost: 0 },
            })
          }
        >
          + {t.addMaterial}
        </button>
      )}
      <div className="card table-list">
        <div className="grid-head" style={{ gridTemplateColumns: cols, background: 'transparent', fontSize: 11.5 }}>
          <div>{t.materialCode}</div>
          <div>{t.matTable.material}</div>
          <div className="num">{t.matTable.stock}</div>
          <div className="num">{t.matTable.unitCost}</div>
          <div className="num">{t.matTable.value}</div>
          {canManage && <div>{t.actionsCol}</div>}
        </div>
        {pos.materials.map((m) => (
          <div key={m.id} className="grid-row" style={{ gridTemplateColumns: cols, padding: '14px 20px' }}>
            <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{m.code}</div>
            <div style={{ fontWeight: 700 }}>{m.name}</div>
            <div className="num" style={{ color: 'var(--text-muted)' }}>
              {m.stock} {m.unit}
            </div>
            <div className="num" style={{ color: 'var(--text-muted)' }}>
              {pos.fmt(m.unitCost)}/{m.unit}
            </div>
            <div className="num" style={{ fontWeight: 700 }}>
              {pos.fmt(m.unitCost * m.stock)}
            </div>
            {canManage && (
              <EditDeleteActions
                editLabel={`${t.save} ${m.name}`}
                deleteLabel={`${t.actionsCol} ${m.name}`}
                onEdit={() =>
                  pos.openModal({ type: 'material', mode: 'edit', data: { ...m } as unknown as Record<string, string | number> })
                }
                onDelete={() => pos.deleteMaterial(m.id)}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function BomView() {
  const pos = usePos();
  const { t } = pos;
  const canManage = pos.hasPerm('bom');

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          type="button"
          className={`pill${pos.bomTab === 'bom' ? ' pill--active' : ''}`}
          onClick={() => pos.set({ bomTab: 'bom' })}
        >
          {t.bomTab}
        </button>
        <button
          type="button"
          className={`pill${pos.bomTab === 'materials' ? ' pill--active' : ''}`}
          onClick={() => pos.set({ bomTab: 'materials' })}
        >
          {t.materialsTab}
        </button>
      </div>

      {pos.bomTab === 'bom' ? (
        <>
          {canManage && (
            <button type="button" className="btn btn--primary" style={{ marginBottom: 16, fontSize: 13 }} onClick={pos.addRecipe}>
              + {t.addRecipe}
            </button>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pos.bomRecipes.map((r) => (
              <RecipeCard key={r.id} recipeId={r.id} />
            ))}
          </div>
        </>
      ) : (
        <MaterialsTable />
      )}
    </>
  );
}
