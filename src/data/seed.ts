import type {
  Category,
  GoodsReceipt,
  Material,
  Product,
  ProductCategory,
  PurchaseOrder,
  PurchaseRequest,
  Recipe,
  RoleName,
  RolePermissions,
  SalesOrder,
  User,
  Vendor,
} from '../types';

export const CATS: Category[] = ['All', 'Beverages', 'Bakery', 'Food', 'Retail'];

export const CAT_UNITS: Record<ProductCategory, string> = {
  Beverages: 'แก้ว',
  Bakery: 'ชิ้น',
  Food: 'ชิ้น',
  Retail: 'ชิ้น',
};

const RAW_PRODUCTS: Omit<Product, 'unit'>[] = [
  { id: 1, code: 'PRD-001', name: 'Espresso', price: 3.5, cat: 'Beverages', grad: 'linear-gradient(135deg,#8b5e3c,#5a3a24)', initial: 'E', stock: 120, description: 'Single shot of concentrated espresso.' },
  { id: 2, code: 'PRD-002', name: 'Cappuccino', price: 4.5, cat: 'Beverages', grad: 'linear-gradient(135deg,#c8a27a,#8b5e3c)', initial: 'C', stock: 95, description: 'Espresso with steamed milk and foam.' },
  { id: 3, code: 'PRD-003', name: 'Iced Latte', price: 5.0, cat: 'Beverages', grad: 'linear-gradient(135deg,#a8794f,#6d4a2f)', initial: 'I', stock: 80, description: 'Chilled espresso with milk over ice.' },
  { id: 4, code: 'PRD-004', name: 'Matcha Latte', price: 5.5, cat: 'Beverages', grad: 'linear-gradient(135deg,#7fae5e,#4f7a3a)', initial: 'M', stock: 40, description: 'Japanese matcha whisked with steamed milk.' },
  { id: 5, code: 'PRD-005', name: 'Croissant', price: 3.25, cat: 'Bakery', grad: 'linear-gradient(135deg,#e2b464,#c98f3a)', initial: 'C', stock: 36, description: 'Buttery, flaky French pastry.' },
  { id: 6, code: 'PRD-006', name: 'Blueberry Muffin', price: 3.75, cat: 'Bakery', grad: 'linear-gradient(135deg,#6f6bab,#4a4780)', initial: 'M', stock: 28, description: 'Soft muffin loaded with blueberries.' },
  { id: 7, code: 'PRD-007', name: 'Cinnamon Roll', price: 4.0, cat: 'Bakery', grad: 'linear-gradient(135deg,#d99a5b,#a8672f)', initial: 'R', stock: 22, description: 'Rolled pastry with cinnamon sugar glaze.' },
  { id: 8, code: 'PRD-008', name: 'Avocado Toast', price: 7.5, cat: 'Food', grad: 'linear-gradient(135deg,#6fa678,#3f6f4a)', initial: 'A', stock: 18, description: 'Sourdough toast topped with mashed avocado.' },
  { id: 9, code: 'PRD-009', name: 'Club Sandwich', price: 8.25, cat: 'Food', grad: 'linear-gradient(135deg,#d18a5c,#a3572e)', initial: 'S', stock: 15, description: 'Triple-decker sandwich with chicken and bacon.' },
  { id: 10, code: 'PRD-010', name: 'Caesar Salad', price: 8.75, cat: 'Food', grad: 'linear-gradient(135deg,#7fae5e,#4f7a3a)', initial: 'S', stock: 12, description: 'Romaine, parmesan, croutons, caesar dressing.' },
  { id: 11, code: 'PRD-011', name: 'Ceramic Mug', price: 12.0, cat: 'Retail', grad: 'linear-gradient(135deg,#9a9aab,#5a5a6b)', initial: 'M', stock: 30, description: 'Branded ceramic mug, 350ml.' },
  { id: 12, code: 'PRD-012', name: 'Coffee Beans 250g', price: 14.0, cat: 'Retail', grad: 'linear-gradient(135deg,#5a3a24,#2e1d12)', initial: 'B', stock: 24, description: 'House-roasted whole bean coffee, 250g bag.' },
];

export const PRODUCTS: Product[] = RAW_PRODUCTS.map((p) => ({ ...p, unit: CAT_UNITS[p.cat] }));

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

export const DAILY_SALES: [string, number, number][] = [];

export const MONTHLY_SALES: [string, number][] = [];

export const YEARLY_SALES: [string, number][] = [];

export type PeriodKey = 'day' | 'month' | 'year';
export type KpiKey = 'revenue' | 'orders' | 'avgOrder' | 'grossProfit';

interface PeriodData {
  kpis: [KpiKey, number | string, number][];
  bars: number[];
  barLabels: string[];
  cogs: number;
  opex: number;
  net: number;
}

export const PERIOD_DATA: Record<PeriodKey, PeriodData> = {
  day: {
    kpis: [['revenue', 0, 0], ['orders', '0', 0], ['avgOrder', 0, 0], ['grossProfit', 0, 0]],
    bars: [0, 0, 0, 0, 0, 0, 0],
    barLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    cogs: 0, opex: 0, net: 0,
  },
  month: {
    kpis: [['revenue', 0, 0], ['orders', '0', 0], ['avgOrder', 0, 0], ['grossProfit', 0, 0]],
    bars: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    barLabels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    cogs: 0, opex: 0, net: 0,
  },
  year: {
    kpis: [['revenue', 0, 0], ['orders', '0', 0], ['avgOrder', 0, 0], ['grossProfit', 0, 0]],
    bars: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    barLabels: ["'24", "'25", "'26", '', '', '', '', '', '', '', '', ''],
    cogs: 0, opex: 0, net: 0,
  },
};

export const BEST_SELLERS: [string, number][] = [];

export const WORST_SELLERS: [string, number][] = [];

export const ACCENT_SWATCHES = ['#6d5ef8', '#10b981', '#f43f5e', '#f59e0b'];

export const DEFAULT_ACCENT = '#10b981';

export const INITIAL_MOVEMENTS: { ts: string; type: 'in' | 'out'; item: string; qty: number; unit: string }[] = [];

export const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
