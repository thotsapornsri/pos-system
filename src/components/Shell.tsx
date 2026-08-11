import { usePos } from '../store/PosContext';
import type { Lang, View } from '../types';
import { initialsOf } from '../lib/format';
import { Icon } from './ui/Icon';
import { ImageSlot } from './ui/ImageSlot';
import { Sidebar } from './Sidebar';

import { HomeView } from '../views/HomeView';
import { SalesView } from '../views/SalesView';
import { ProductsView } from '../views/ProductsView';
import { BomView } from '../views/BomView';
import { DashboardView } from '../views/DashboardView';
import { ReportsView } from '../views/ReportsView';
import { UsersView } from '../views/UsersView';
import { SettingsView } from '../views/SettingsView';
import { SellingView } from '../views/SellingView';
import { PurchasingView } from '../views/purchasing/PurchasingView';

import { ConfirmModal } from './modals/ConfirmModal';
import { CrudModal } from './modals/CrudModal';
import { PaymentModal } from './modals/PaymentModal';
import { PrintPreviewModal } from './modals/PrintPreviewModal';

const LANGS: [Lang, string][] = [
  ['en', 'EN'],
  ['th', 'TH'],
];

function CurrentView({ view }: { view: View }) {
  switch (view) {
    case 'sales':
      return <SalesView />;
    case 'products':
      return <ProductsView />;
    case 'bom':
      return <BomView />;
    case 'dashboard':
      return <DashboardView />;
    case 'reports':
      return <ReportsView />;
    case 'users':
      return <UsersView />;
    case 'settings':
      return <SettingsView />;
    case 'purchasing':
      return <PurchasingView />;
    case 'selling':
      return <SellingView />;
    case 'home':
      return <HomeView />;
  }
}

export function Shell() {
  const pos = usePos();
  const { t, currentUser } = pos;
  if (!currentUser) return null;

  const titles: Record<View, string> = {
    ...t.nav,
    purchasing: t.purchasing,
    selling: t.selling,
  };

  return (
    <div className="app">
      <header className="shellbar">
        <button type="button" className="shellbar__brand" onClick={() => pos.setView('home')}>
          <span style={{ width: 26, height: 26, display: 'block' }}>
            <ImageSlot id="store-logo" shape="rounded" radius={7} placeholder="Logo" fontSize={8} interactive={false} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{pos.storeSettings.name}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="langswitch">
            {LANGS.map(([code, label]) => (
              <button key={code} type="button" aria-pressed={pos.lang === code} onClick={() => pos.set({ lang: code })}>
                {label}
              </button>
            ))}
          </div>
          <Icon name="bell" size={20} style={{ color: 'rgba(255,255,255,.7)' }} />
          <button
            type="button"
            className="shellbar__brand"
            onClick={pos.logout}
            style={{ gap: 8 }}
          >
            <span
              className="avatar"
              style={{ width: 26, height: 26, background: '#3a3a4a', fontSize: 10.5 }}
            >
              {initialsOf(currentUser.name)}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>{t.logout}</span>
          </button>
        </div>
      </header>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Sidebar />

        <main className="main">
          <div className="topbar">
            <h1 className="display" style={{ fontSize: 17, margin: 0 }}>
              {titles[pos.view]}
            </h1>
            {pos.view === 'sales' && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--success)',
                  background: 'var(--success-bg)',
                  padding: '6px 12px',
                  borderRadius: 20,
                }}
              >
                {t.shift(3, 12)}
              </span>
            )}
          </div>

          <div className="viewport">
            <CurrentView view={pos.view} />
          </div>
        </main>
      </div>

      <PaymentModal />
      <PrintPreviewModal />
      <CrudModal />
      <ConfirmModal />
    </div>
  );
}
