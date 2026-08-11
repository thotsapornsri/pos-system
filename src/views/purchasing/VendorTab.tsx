import { usePos } from '../../store/PosContext';
import { EditDeleteActions } from '../../components/ui/primitives';

const COLS = '1fr 1.5fr 2fr 1.3fr 1.7fr auto';

export function VendorTab() {
  const pos = usePos();
  const { t } = pos;
  const canManage = pos.hasPerm('vendor');
  const cols = canManage ? COLS : '1fr 1.5fr 2fr 1.3fr 1.7fr';

  return (
    <>
      {canManage && (
        <button
          type="button"
          className="btn btn--primary"
          style={{ marginBottom: 16, fontSize: 13 }}
          onClick={() =>
            pos.openModal({
              type: 'vendor',
              mode: 'add',
              data: {
                code: `VD-${String(pos.vendors.length + 1).padStart(3, '0')}`,
                name: '',
                address: '',
                phone: '',
                email: '',
              },
            })
          }
        >
          + {t.addVendor}
        </button>
      )}

      <div className="card table-list">
        <div
          className="grid-head"
          style={{ gridTemplateColumns: cols, gap: 14, padding: '14px 20px', background: 'transparent', fontSize: 11.5, alignItems: 'start' }}
        >
          <div>{t.vendorCode}</div>
          <div>{t.vendorName}</div>
          <div>{t.vendorAddress}</div>
          <div style={{ whiteSpace: 'nowrap' }}>{t.vendorPhone}</div>
          <div>{t.vendorEmail}</div>
          {canManage && <div>{t.actionsCol}</div>}
        </div>

        {pos.vendors.map((v) => (
          <div key={v.id} className="grid-row" style={{ gridTemplateColumns: cols, gap: 14, padding: '14px 20px', alignItems: 'start' }}>
            <div style={{ fontWeight: 700 }}>{v.code}</div>
            <div style={{ fontWeight: 700 }}>{v.name}</div>
            <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{v.address}</div>
            <div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{v.phone}</div>
            <div style={{ color: 'var(--text-muted)', wordBreak: 'break-all' }}>{v.email}</div>
            {canManage && (
              <EditDeleteActions
                editLabel={`${t.save} ${v.name}`}
                deleteLabel={`${t.actionsCol} ${v.name}`}
                onEdit={() =>
                  pos.openModal({ type: 'vendor', mode: 'edit', data: { ...v } as unknown as Record<string, string | number> })
                }
                onDelete={() => pos.deleteVendor(v.id)}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
