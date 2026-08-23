import type { ReactNode } from 'react';
import { usePos, type CashbookTab, type ProcTab, type ReportTab, type UsersTab } from '../store/PosContext';
import type { View } from '../types';
import { Icon, type IconName } from './ui/Icon';
import { Avatar } from './ui/primitives';
import { initialsOf } from '../lib/format';

function NavItem({
  icon,
  label,
  active,
  collapsed,
  onClick,
  chevron,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  chevron?: 'open' | 'closed';
}) {
  return (
    <button
      type="button"
      className={`navitem${active ? ' navitem--active' : ''}`}
      onClick={onClick}
      title={label}
      aria-current={active ? 'page' : undefined}
    >
      <Icon name={icon} size={19} />
      {!collapsed && (
        <>
          <span className="navitem__label">{label}</span>
          {chevron && (
            <Icon
              name="chevronRight"
              size={13}
              strokeWidth={2}
              className="chevron"
              style={{ transform: chevron === 'open' ? 'rotate(90deg)' : 'none' }}
            />
          )}
        </>
      )}
    </button>
  );
}

function SubNavItem({
  icon,
  label,
  current,
  collapsed,
  onClick,
}: {
  icon: IconName;
  label: string;
  current: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} title={label} aria-current={current}>
      <Icon name={icon} size={15} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

export function Sidebar() {
  const pos = usePos();
  const { t, currentUser, view, expandedMenu, sidebarCollapsed: collapsed } = pos;
  if (!currentUser) return null;

  const goto = (v: View) => () => pos.setView(v);
  const gotoProc = (tab: ProcTab) => () => pos.set({ view: 'purchasing', procTab: tab });
  const gotoReport = (tab: ReportTab) => () => pos.set({ view: 'reports', reportTab: tab });
  const gotoUsers = (tab: UsersTab) => () => pos.set({ view: 'users', usersTab: tab });
  const gotoCashbook = (tab: CashbookTab) => () => pos.set({ view: 'cashbook', cashbookTab: tab });

  const showFullReports = currentUser.role !== 'Cashier';
  const gate = (key: Parameters<typeof pos.hasPerm>[0], node: ReactNode) => (pos.hasPerm(key) ? node : null);

  return (
    <nav className="sidebar" style={{ width: collapsed ? 76 : 232 }} aria-label={t.nav.home}>
      <button
        type="button"
        className="navitem"
        style={{ justifyContent: collapsed ? 'center' : 'flex-end', color: 'var(--text-dim)', marginBottom: 6 }}
        onClick={pos.toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Icon
          name="chevronLeft"
          size={17}
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      <NavItem icon="home" label={t.nav.home} active={view === 'home'} collapsed={collapsed} onClick={goto('home')} />

      {gate(
        'sales',
        <NavItem icon="sales" label={t.nav.sales} active={view === 'sales'} collapsed={collapsed} onClick={goto('sales')} />,
      )}

      {gate(
        'inventory',
        <NavItem icon="products" label={t.nav.products} active={view === 'products'} collapsed={collapsed} onClick={goto('products')} />,
      )}

      {gate(
        'inventory',
        <NavItem icon="tag" label={t.nav.categories} active={view === 'categories'} collapsed={collapsed} onClick={goto('categories')} />,
      )}

      {gate(
        'bom',
        <NavItem icon="bom" label={t.nav.bom} active={view === 'bom'} collapsed={collapsed} onClick={goto('bom')} />,
      )}

      {gate(
        'procurement',
        <>
          <NavItem
            icon="cart"
            label={t.purchasing}
            active={view === 'purchasing'}
            collapsed={collapsed}
            onClick={() => pos.toggleMenu('purchasing')}
            chevron={expandedMenu === 'purchasing' ? 'open' : 'closed'}
          />
          {expandedMenu === 'purchasing' && (
            <div className="subnav">
              <SubNavItem icon="docLines" label={t.pr} collapsed={collapsed} onClick={gotoProc('pr')} current={view === 'purchasing' && pos.procTab === 'pr'} />
              <SubNavItem icon="po" label={t.po} collapsed={collapsed} onClick={gotoProc('po')} current={view === 'purchasing' && pos.procTab === 'po'} />
              <SubNavItem icon="inbox" label={t.gr} collapsed={collapsed} onClick={gotoProc('gr')} current={view === 'purchasing' && pos.procTab === 'gr'} />
              {pos.hasPerm('vendor') && (
                <SubNavItem icon="sheet" label={t.vendorMaster} collapsed={collapsed} onClick={gotoProc('vendor')} current={view === 'purchasing' && pos.procTab === 'vendor'} />
              )}
            </div>
          )}
          <NavItem icon="sales" label={t.selling} active={view === 'selling'} collapsed={collapsed} onClick={goto('selling')} />
        </>,
      )}

      {gate(
        'dashboard',
        <NavItem icon="dashboard" label={t.nav.dashboard} active={view === 'dashboard'} collapsed={collapsed} onClick={goto('dashboard')} />,
      )}

      {gate(
        'cashbook',
        <>
          <NavItem
            icon="wallet"
            label={t.nav.cashbook}
            active={view === 'cashbook'}
            collapsed={collapsed}
            onClick={() => pos.toggleMenu('cashbook')}
            chevron={expandedMenu === 'cashbook' ? 'open' : 'closed'}
          />
          {expandedMenu === 'cashbook' && (
            <div className="subnav">
              <SubNavItem icon="wallet" label={t.cashEntriesTab} collapsed={collapsed} onClick={gotoCashbook('entries')} current={view === 'cashbook' && pos.cashbookTab === 'entries'} />
              <SubNavItem icon="tag" label={t.cashCategoriesTab} collapsed={collapsed} onClick={gotoCashbook('categories')} current={view === 'cashbook' && pos.cashbookTab === 'categories'} />
            </div>
          )}
        </>,
      )}

      {gate(
        'salesReport',
        <>
          <NavItem
            icon="doc"
            label={t.nav.reports}
            active={view === 'reports'}
            collapsed={collapsed}
            onClick={() => pos.toggleMenu('reports')}
            chevron={expandedMenu === 'reports' ? 'open' : 'closed'}
          />
          {expandedMenu === 'reports' && (
            <div className="subnav">
              <SubNavItem icon="calendarDay" label={t.dailySales} collapsed={collapsed} onClick={gotoReport('daily')} current={view === 'reports' && pos.reportTab === 'daily'} />
              {showFullReports && (
                <>
                  <SubNavItem icon="calendarMonth" label={t.monthlySales} collapsed={collapsed} onClick={gotoReport('monthly')} current={view === 'reports' && pos.reportTab === 'monthly'} />
                  <SubNavItem icon="bars" label={t.yearlySales} collapsed={collapsed} onClick={gotoReport('yearly')} current={view === 'reports' && pos.reportTab === 'yearly'} />
                </>
              )}
              <SubNavItem icon="products" label={t.stockReport} collapsed={collapsed} onClick={gotoReport('stock')} current={view === 'reports' && pos.reportTab === 'stock'} />
              <SubNavItem icon="swap" label={t.movementReport} collapsed={collapsed} onClick={gotoReport('movement')} current={view === 'reports' && pos.reportTab === 'movement'} />
            </div>
          )}
        </>,
      )}

      {gate(
        'users',
        <>
          <NavItem
            icon="users"
            label={t.nav.users}
            active={view === 'users'}
            collapsed={collapsed}
            onClick={() => pos.toggleMenu('users')}
            chevron={expandedMenu === 'users' ? 'open' : 'closed'}
          />
          {expandedMenu === 'users' && (
            <div className="subnav">
              <SubNavItem icon="users" label={t.usersTable.user} collapsed={collapsed} onClick={gotoUsers('list')} current={view === 'users' && pos.usersTab === 'list'} />
              <SubNavItem icon="shield" label={t.rolesPerm} collapsed={collapsed} onClick={gotoUsers('roles')} current={view === 'users' && pos.usersTab === 'roles'} />
            </div>
          )}
        </>,
      )}

      {gate(
        'settings',
        <NavItem icon="settings" label={t.nav.settings} active={view === 'settings'} collapsed={collapsed} onClick={goto('settings')} />,
      )}

      <div className="sidebar__user">
        <Avatar initials={initialsOf(currentUser.name)} background="var(--accent)" size={28} />
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div className="truncate" style={{ fontSize: 12, fontWeight: 700 }}>
              {currentUser.name}
            </div>
            <div className="truncate" style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
              {t.roles[currentUser.role]}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
