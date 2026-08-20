import { CATS, ROLE_NAMES } from '../../data/seed';
import type { Translation } from '../../i18n/translations';
import { usePos } from '../../store/PosContext';
import type { CrudModalState } from '../../types';

interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number';
  options?: { value: string; label: string }[];
  readOnly?: boolean;
}

function fieldsFor(modal: CrudModalState, t: Translation): { title: string; fields: FieldDef[] } {
  switch (modal.type) {
    case 'product':
      return {
        title: modal.mode === 'add' ? t.addProduct : t.productCol,
        fields: [
          { key: 'code', label: t.productCode },
          { key: 'name', label: t.productCol },
          {
            key: 'cat',
            label: t.categoryCol,
            options: CATS.filter((c) => c !== 'All').map((c) => ({ value: c, label: t.categories[c] })),
          },
          { key: 'price', label: t.priceCol, type: 'number' },
          { key: 'stock', label: t.stockCol, type: 'number' },
          { key: 'unit', label: t.unitCol },
          { key: 'description', label: t.productDescription },
        ],
      };
    case 'material':
      return {
        title: modal.mode === 'add' ? t.addMaterial : t.matTable.material,
        fields: [
          { key: 'code', label: t.materialCode },
          { key: 'name', label: t.matTable.material },
          { key: 'stock', label: t.stockCol, type: 'number' },
          { key: 'unit', label: t.unitCol },
          { key: 'unitCost', label: t.matTable.unitCost, type: 'number' },
        ],
      };
    case 'vendor':
      return {
        title: modal.mode === 'add' ? t.addVendor : t.vendorMaster,
        fields: [
          { key: 'code', label: t.vendorCode },
          { key: 'name', label: t.vendorName },
          { key: 'address', label: t.vendorAddress },
          { key: 'phone', label: t.vendorPhone },
          { key: 'email', label: t.vendorEmail },
        ],
      };
    case 'user':
      return {
        title: modal.mode === 'add' ? t.addUser : t.usersTable.user,
        fields: [
          { key: 'name', label: t.usersTable.user },
          // Editing this here wouldn't rename their actual Supabase Auth
          // login email (that needs auth.updateUser on their own session) —
          // shown read-only rather than silently doing nothing useful.
          { key: 'email', label: 'Email', readOnly: true },
          { key: 'phone', label: t.phone },
          { key: 'role', label: t.usersTable.role, options: ROLE_NAMES.map((r) => ({ value: r, label: t.roles[r] })) },
        ],
      };
  }
}

export function CrudModal() {
  const pos = usePos();
  const { t, modal } = pos;
  if (!modal) return null;

  const { title, fields } = fieldsFor(modal, t);

  return (
    <div className="overlay" style={{ zIndex: 60 }} role="dialog" aria-modal="true" aria-labelledby="crud-title">
      <form
        className="modal"
        onSubmit={(e) => {
          e.preventDefault();
          pos.requestConfirm(t.confirmSaveMsg, pos.saveModal);
        }}
      >
        <h2 id="crud-title" className="modal__title">
          {title}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {fields.map((f) => {
            const value = modal.data[f.key] ?? (f.type === 'number' ? 0 : '');
            return (
              <label key={f.key}>
                <span className="field-label field-label--xs" style={{ display: 'block' }}>
                  {f.label}
                </span>
                {f.options ? (
                  <select
                    className="input"
                    style={{ padding: '10px 12px', borderRadius: 9 }}
                    value={String(value)}
                    onChange={(e) => pos.updateModalField(f.key, e.target.value)}
                  >
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input"
                    style={{ padding: '10px 12px', borderRadius: 9 }}
                    type={f.type ?? 'text'}
                    step={f.type === 'number' ? 'any' : undefined}
                    value={String(value)}
                    readOnly={f.readOnly}
                    disabled={f.readOnly}
                    onChange={(e) =>
                      pos.updateModalField(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)
                    }
                  />
                )}
              </label>
            );
          })}
        </div>

        <div className="modal__actions">
          <button type="button" className="btn btn--neutral" onClick={pos.closeModal}>
            {t.cancel}
          </button>
          <button type="submit" className="btn btn--primary">
            {t.save}
          </button>
        </div>
      </form>
    </div>
  );
}
