import { usePos } from '../store/PosContext';
import { EditDeleteActions, Toggle } from '../components/ui/primitives';

export function CategoriesView() {
  const pos = usePos();
  const { t } = pos;
  const canManage = pos.hasPerm('inventory');
  const cols = canManage ? '2fr 1fr 1fr' : '2fr 1fr';

  return (
    <>
      {canManage && (
        <button
          type="button"
          className="btn btn--primary"
          style={{ marginBottom: 16, fontSize: 13 }}
          onClick={() => pos.openModal({ type: 'category', mode: 'add', data: { name: '' } })}
        >
          + {t.addCategory}
        </button>
      )}

      <div className="card table-list">
        <div className="grid-head" style={{ gridTemplateColumns: cols, background: 'transparent', fontSize: 11.5, padding: '14px 20px' }}>
          <div>{t.categoryName}</div>
          <div>{t.showInSales}</div>
          {canManage && <div>{t.actionsCol}</div>}
        </div>

        {pos.categories.map((c) => (
          <div key={c.id} className="grid-row" style={{ gridTemplateColumns: cols }}>
            <div style={{ fontWeight: 700 }}>{c.name}</div>
            <div>
              <Toggle on={c.visible} label={c.name} onToggle={() => pos.toggleCategoryVisible(c.id, !c.visible)} />
            </div>
            {canManage && (
              <EditDeleteActions
                editLabel={`${t.save} ${c.name}`}
                deleteLabel={`${t.actionsCol} ${c.name}`}
                onEdit={() => pos.openModal({ type: 'category', mode: 'edit', data: { id: c.id, name: c.name } })}
                onDelete={() => pos.deleteCategory(c.id)}
              />
            )}
          </div>
        ))}
        {pos.categories.length === 0 && <p className="empty">{t.noCategoriesYet}</p>}
      </div>
    </>
  );
}
