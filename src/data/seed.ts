import type {
  GoodsReceipt,
  Material,
  PurchaseOrder,
  PurchaseRequest,
  Recipe,
  RoleName,
  RolePermissions,
  SalesOrder,
  User,
  Vendor,
} from '../types';

export const MATERIALS: Material[] = [
  { id: 'm1', code: 'RM-001', name: 'Espresso Beans', stock: 8200, unit: 'g', unitCost: 0.018 },
  { id: 'm2', code: 'RM-002', name: 'Milk', stock: 22000, unit: 'ml', unitCost: 0.0014 },
  { id: 'm3', code: 'RM-003', name: 'Matcha Powder', stock: 600, unit: 'g', unitCost: 0.09 },
  { id: 'm4', code: 'RM-004', name: 'Flour', stock: 14000, unit: 'g', unitCost: 0.002 },
  { id: 'm5', code: 'RM-005', name: 'Butter', stock: 3100, unit: 'g', unitCost: 0.012 },
  { id: 'm6', code: 'RM-006', name: 'Avocado', stock: 18, unit: 'pcs', unitCost: 1.2 },
  { id: 'm7', code: 'RM-007', name: 'Bread Loaf', stock: 6, unit: 'loaf', unitCost: 2.5 },
];

export const BOM_RECIPES: Recipe[] = [
  { id: 'r1', outputProductId: 2, batchQty: 1, ingredients: [{ materialId: 'm1', qty: 18 }, { materialId: 'm2', qty: 150 }] },
  { id: 'r2', outputProductId: 5, batchQty: 1, ingredients: [{ materialId: 'm4', qty: 80 }, { materialId: 'm5', qty: 40 }] },
  { id: 'r3', outputProductId: 8, batchQty: 1, ingredients: [{ materialId: 'm7', qty: 0.2 }, { materialId: 'm6', qty: 1 }] },
];

export const USERS: User[] = [
  { id: 'u1', name: 'Alex Rivera', email: 'alex@brewco.com', phone: '081-234-5671', role: 'Owner', initials: 'AR', grad: 'linear-gradient(135deg,#6d5ef8,#4636c9)', lastActive: 'Now', status: 'active', locked: false },
  { id: 'u2', name: 'Jordan Lee', email: 'jordan@brewco.com', phone: '081-234-5672', role: 'Manager', initials: 'JL', grad: 'linear-gradient(135deg,#10b981,#0a8a63)', lastActive: '12m ago', status: 'active', locked: false },
  { id: 'u3', name: 'Sam Patel', email: 'sam@brewco.com', phone: '081-234-5673', role: 'Cashier', initials: 'SP', grad: 'linear-gradient(135deg,#f59e0b,#c9800a)', lastActive: '1h ago', status: 'active', locked: false },
  { id: 'u4', name: 'Casey Kim', email: 'casey@brewco.com', phone: '081-234-5674', role: 'Cashier', initials: 'CK', grad: 'linear-gradient(135deg,#f59e0b,#c9800a)', lastActive: '2d ago', status: 'active', locked: false },
  { id: 'u5', name: 'Morgan Diaz', email: 'morgan@brewco.com', phone: '081-234-5675', role: 'Viewer', initials: 'MD', grad: 'linear-gradient(135deg,#8a8a9a,#5a5a6b)', lastActive: '6d ago', status: 'inactive', locked: false },
];

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

export const CUSTOMERS = ['Walk-in', 'Grand Hotel Café', 'Sunrise Catering'];

export const VENDORS: Vendor[] = [
  { id: 'v1', code: 'VD-001', name: 'Thai Roasters Co.', address: '99/1 ถ.สุขุมวิท กรุงเทพฯ', phone: '02-123-4567', email: 'sales@thairoasters.co.th' },
  { id: 'v2', code: 'VD-002', name: 'Fresh Farm Supply', address: '45 ถ.พระราม 9 กรุงเทพฯ', phone: '02-234-5678', email: 'contact@freshfarm.co.th' },
  { id: 'v3', code: 'VD-003', name: 'Pack Plus Ltd.', address: '12 ถ.ลาดพร้าว กรุงเทพฯ', phone: '02-345-6789', email: 'info@packplus.co.th' },
];

export const PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    id: 'pr1', no: 'PR-1001', date: '2026-07-28', requester: 'Jordan Lee', status: 'pending',
    items: [{ materialCode: 'RM-001', qty: 2000 }, { materialCode: 'RM-003', qty: 500 }],
  },
];

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po1', no: 'PO-2001', date: '2026-07-29', poType: 'noPr', refPrNo: '', vendorCode: 'VD-001', status: 'ordered',
    items: [{ materialCode: 'RM-001', qty: 2000, price: 0.017 }, { materialCode: 'RM-002', qty: 10000, price: 0.0013 }],
    schedule: [
      { materialCode: 'RM-001', startDate: '2026-07-29', deliveryDate: '2026-08-05', scheduleQty: 2000 },
      { materialCode: 'RM-002', startDate: '2026-07-29', deliveryDate: '2026-08-05', scheduleQty: 10000 },
    ],
  },
];

export const SALES_ORDERS: SalesOrder[] = [
  {
    id: 'so1', no: 'SO-3001', date: '2026-07-30', customer: CUSTOMERS[1], status: 'confirmed',
    items: [{ productId: 2, qty: 20 }, { productId: 5, qty: 15 }],
  },
];

export const GOODS_RECEIPTS: GoodsReceipt[] = [];

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

export const INITIAL_MOVEMENTS: { ts: string; type: 'in' | 'out'; item: string; qty: number; unit: string }[] = [];

export const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
