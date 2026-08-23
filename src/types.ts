export type Lang = 'en' | 'th';

export type View =
  | 'home'
  | 'sales'
  | 'products'
  | 'categories'
  | 'bom'
  | 'dashboard'
  | 'reports'
  | 'users'
  | 'settings'
  | 'purchasing'
  | 'selling'
  | 'cashbook';

export type RoleName = 'Owner' | 'Manager' | 'Cashier' | 'Viewer';

export type PermissionKey =
  | 'sales'
  | 'orders'
  | 'inventory'
  | 'bom'
  | 'dashboard'
  | 'users'
  | 'settings'
  | 'reports'
  | 'salesReport'
  | 'procurement'
  | 'vendor'
  | 'prApprove'
  | 'cashbook';

/** A store-managed product category — created/renamed/hidden from the
 * Categories page. Products link back by name (soft reference), not id. */
export interface Category {
  id: string;
  name: string;
  visible: boolean;
  position: number;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  /** A category name (Category.name), not a fixed enum — see Category. */
  cat: string;
  grad: string;
  initial: string;
  stock: number;
  unit: string;
  description: string;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  stock: number;
  unit: string;
  unitCost: number;
}

export interface Ingredient {
  materialId: string;
  qty: number;
}

export interface Recipe {
  id: string;
  outputProductId: number;
  batchQty: number;
  ingredients: Ingredient[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RoleName;
  initials: string;
  grad: string;
  lastActive: string;
  status: 'active' | 'inactive';
  locked: boolean;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export type DocStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'converted'
  | 'ordered'
  | 'received'
  | 'confirmed'
  | 'fulfilled';

export interface PrItem {
  materialCode: string;
  qty: number;
}

export interface PurchaseRequest {
  id: string;
  no: string;
  date: string;
  requester: string;
  status: Extract<DocStatus, 'draft' | 'pending' | 'approved' | 'rejected' | 'converted'>;
  items: PrItem[];
}

export interface PoItem {
  materialCode: string;
  qty: number;
  price: number;
}

export interface PoScheduleLine {
  materialCode: string;
  startDate: string;
  deliveryDate: string;
  scheduleQty: number;
}

export interface PurchaseOrder {
  id: string;
  no: string;
  date: string;
  poType: 'fromPr' | 'noPr';
  refPrNo: string;
  vendorCode: string;
  status: Extract<DocStatus, 'draft' | 'ordered' | 'received'>;
  items: PoItem[];
  schedule: PoScheduleLine[];
}

export interface SoItem {
  productId: number;
  qty: number;
}

export interface SalesOrder {
  id: string;
  no: string;
  date: string;
  customer: string;
  status: Extract<DocStatus, 'draft' | 'confirmed' | 'fulfilled'>;
  items: SoItem[];
}

export interface GrLine {
  materialCode: string;
  ordered: number;
  received: number;
}

export interface GoodsReceipt {
  id: string;
  no: string;
  date: string;
  poId: string;
  lines: GrLine[];
}

export interface GrDraft {
  poId: string;
  lines: GrLine[];
}

export interface Movement {
  ts: string;
  type: 'in' | 'out';
  item: string;
  qty: number;
  unit: string;
}

/** A manually logged cashbook entry — daily income/expense not already
 * captured by POS checkout or purchasing (rent, utilities, wages, etc). */
export interface CashEntry {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  note: string;
  amount: number;
  createdBy: string;
}

/** A managed category for cashbook entries — income and expense each have
 * their own separate list. */
export interface CashCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export interface StoreSettings {
  name: string;
  businessType: string;
  currency: 'THB' | 'USD' | 'EUR';
  taxRate: number;
}

export type FeatureKey = 'inventory' | 'dashboard' | 'payments' | 'loyalty' | 'multiBranch';

export type RolePermissions = Record<RoleName, boolean[]>;

export type Cart = Record<number, number>;

/** A document rendered in the print-preview modal / print window. */
export interface PrintData {
  title: string;
  no: string;
  date: string;
  party: string;
  cols: string[];
  rows: (string | number)[][];
  showTotal: boolean;
  totalLabel?: string;
}

export type PrintDocRef =
  | { type: 'pr'; doc: PurchaseRequest }
  | { type: 'po'; doc: PurchaseOrder }
  | { type: 'so'; doc: SalesOrder }
  | { type: 'gr'; doc: GoodsReceipt };

export type ModalType = 'product' | 'material' | 'user' | 'vendor' | 'category' | 'cashCategory';

export interface CrudModalState {
  type: ModalType;
  mode: 'add' | 'edit';
  data: Record<string, string | number>;
}

export interface ConfirmAction {
  message: string;
  onConfirm: () => void;
}
