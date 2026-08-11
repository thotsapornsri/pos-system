import { PERIOD_DATA } from '../data/seed';
import { usePos } from '../store/PosContext';
import type { PermissionKey } from '../types';
import { Icon, type IconName } from '../components/ui/Icon';

export function HomeView() {
  const pos = usePos();
  const { t } = pos;

  const tiles: { perm: PermissionKey; icon: IconName; label: string; stat: string; go: () => void }[] = [
    { perm: 'sales', icon: 'sales', label: t.nav.sales, go: () => pos.setView('sales'), stat: `${Object.values(pos.cart).reduce((a, b) => a + b, 0)} ${t.items}` },
    { perm: 'inventory', icon: 'products', label: t.nav.products, go: () => pos.setView('products'), stat: `${pos.products.length} SKUs` },
    { perm: 'bom', icon: 'bom', label: t.nav.bom, go: () => pos.setView('bom'), stat: `${pos.bomRecipes.length} recipes` },
    { perm: 'procurement', icon: 'cart', label: t.purchasing, go: () => pos.set({ expandedMenu: 'purchasing', view: 'purchasing' }), stat: `${pos.purchaseRequests.length + pos.purchaseOrders.length} docs` },
    { perm: 'procurement', icon: 'sales', label: t.selling, go: () => pos.setView('selling'), stat: `${pos.salesOrders.length} docs` },
    { perm: 'dashboard', icon: 'dashboard', label: t.nav.dashboard, go: () => pos.setView('dashboard'), stat: pos.fmt(PERIOD_DATA.day.kpis[0][1] as number) },
    { perm: 'salesReport', icon: 'doc', label: t.nav.reports, go: () => pos.set({ expandedMenu: 'reports', view: 'reports' }), stat: `${pos.movements.length} logs` },
    { perm: 'users', icon: 'users', label: t.nav.users, go: () => pos.set({ expandedMenu: 'users', view: 'users' }), stat: `${pos.users.length} users` },
    { perm: 'settings', icon: 'settings', label: t.nav.settings, go: () => pos.setView('settings'), stat: pos.storeSettings.name },
  ];

  return (
    <>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, marginBottom: 18 }}>
        {t.homeGreeting}, {pos.currentUser?.name}
      </p>
      <div className="tiles">
        {tiles
          .filter((tile) => pos.hasPerm(tile.perm))
          .map((tile, i) => (
            <button key={`${tile.perm}-${i}`} type="button" className="tile" onClick={tile.go}>
              <span className="tile__icon">
                <Icon name={tile.icon} size={20} />
              </span>
              <span>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>{tile.label}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)' }}>{tile.stat}</span>
              </span>
            </button>
          ))}
      </div>
    </>
  );
}
