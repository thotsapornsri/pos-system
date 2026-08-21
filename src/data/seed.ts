import type { RoleName, RolePermissions } from '../types';

export const ROLE_COLORS: Record<RoleName, [string, string]> = {
  Owner: ['#efe9ff', '#6d43e0'],
  Manager: ['#e6f9f1', '#0a8a63'],
  Cashier: ['#fff3e0', '#c9800a'],
  Viewer: ['#f0f0f7', '#6b6b7b'],
};

export const PERMISSION_KEYS = [
  'sales', 'orders', 'inventory', 'bom', 'dashboard', 'users',
  'settings', 'reports', 'salesReport', 'procurement', 'vendor', 'prApprove',
] as const;

export const DEFAULT_ROLE_PERMS: RolePermissions = {
  Owner: PERMISSION_KEYS.map(() => true),
  Manager: [true, true, true, true, true, false, false, true, true, true, true, true],
  Cashier: [true, true, false, false, false, false, false, false, true, false, false, false],
  Viewer: [false, false, false, false, true, false, false, true, false, false, false, false],
};

export const ROLE_NAMES = Object.keys(DEFAULT_ROLE_PERMS) as RoleName[];

export type PeriodKey = 'day' | 'month' | 'year';
export type KpiKey = 'revenue' | 'orders' | 'avgOrder' | 'grossProfit';

export interface PeriodData {
  kpis: [KpiKey, number | string, number][];
  bars: number[];
  barLabels: string[];
  cogs: number;
  opex: number;
  net: number;
}

export const ACCENT_SWATCHES = ['#6d5ef8', '#10b981', '#f43f5e', '#f59e0b'];

export const DEFAULT_ACCENT = '#10b981';
