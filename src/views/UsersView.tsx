import { PERMISSION_KEYS, ROLE_COLORS, ROLE_NAMES } from '../data/seed';
import { usePos } from '../store/PosContext';
import { Avatar, Badge, EditDeleteActions, Toggle } from '../components/ui/primitives';

function UsersList() {
  const pos = usePos();
  const { t } = pos;
  const canManage = pos.hasPerm('users');
  const cols = canManage ? '2fr 1.4fr 1fr 1fr 1fr' : '2fr 1.4fr 1fr 1fr';

  return (
    <>
      {canManage && (
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--warn)',
            background: 'var(--warn-bg)',
            padding: '9px 12px',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {t.addUserHint}
        </div>
      )}

      <div className="card table-list">
        <div className="grid-head" style={{ gridTemplateColumns: cols, background: 'transparent', fontSize: 11.5, padding: '14px 20px' }}>
          <div>{t.usersTable.user}</div>
          <div>{t.usersTable.role}</div>
          <div>{t.usersTable.lastActive}</div>
          <div>{t.usersTable.status}</div>
          {canManage && <div>{t.actionsCol}</div>}
        </div>

        {pos.users.map((u) => {
          const [roleBg, roleColor] = ROLE_COLORS[u.role];
          return (
            <div key={u.id} className="grid-row" style={{ gridTemplateColumns: cols }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={u.initials} background={u.grad} />
                <div>
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {u.email} · {u.phone}
                  </div>
                </div>
              </div>
              <div>
                <Badge bg={roleBg} color={roleColor}>
                  {t.roles[u.role]}
                </Badge>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{u.lastActive}</div>
              <div
                style={{
                  color: u.status === 'active' ? 'var(--success)' : 'var(--text-dim)',
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                {u.status === 'active' ? t.usersTable.active : t.usersTable.inactive}
              </div>
              {canManage && (
                <EditDeleteActions
                  editLabel={`${t.save} ${u.name}`}
                  deleteLabel={`${t.actionsCol} ${u.name}`}
                  onEdit={() =>
                    pos.openModal({ type: 'user', mode: 'edit', data: { ...u } as unknown as Record<string, string | number> })
                  }
                  onDelete={() => pos.deleteUser(u.id)}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function RolesPanel() {
  const pos = usePos();
  const { t } = pos;
  const perms = pos.rolePermissions[pos.selectedRole];

  return (
    <div className="card card--pad-lg">
      <h2 className="card-title" style={{ margin: 0, marginBottom: 4 }}>
        {t.rolesPerm}
      </h2>
      <p className="card-sub" style={{ margin: 0, marginBottom: 16 }}>
        {t.rolesPermDesc}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {ROLE_NAMES.map((role) => (
          <button
            key={role}
            type="button"
            className={`pill pill--sm${pos.selectedRole === role ? ' pill--active' : ''}`}
            onClick={() => pos.set({ selectedRole: role })}
          >
            {t.roles[role]}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {PERMISSION_KEYS.map((key, idx) => (
          <div
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '11px 14px',
              background: 'var(--bg-muted)',
              borderRadius: 10,
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t.permissions[idx]}</span>
            <Toggle on={perms[idx]} label={t.permissions[idx]} onToggle={() => pos.toggleRolePerm(pos.selectedRole, idx)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UsersView() {
  const pos = usePos();
  return pos.usersTab === 'list' ? <UsersList /> : <RolesPanel />;
}
