import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { PERMISSION_KEYS, type PeriodKey } from '../data/seed';
import { T, type Translation } from '../i18n/translations';
import { formatMoney } from '../lib/format';
import { supabase } from '../lib/supabaseClient';
import {
  PRODUCTS_KEY,
  deleteProductRow,
  insertProduct,
  setProductStock,
  updateProductRow,
  useProductsQuery,
} from './queries/useProducts';
import {
  MATERIALS_KEY,
  deleteMaterialRow,
  insertMaterial,
  setMaterialStock,
  updateMaterialRow,
  useMaterialsQuery,
} from './queries/useMaterials';
import { VENDORS_KEY, deleteVendorRow, insertVendor, updateVendorRow, useVendorsQuery } from './queries/useVendors';
import {
  CATEGORIES_KEY,
  deleteCategoryRow,
  insertCategory,
  updateCategoryRow,
  useCategoriesQuery,
  useToggleCategoryVisibleMutation,
} from './queries/useCategories';
import { PROFILES_KEY, deleteProfileRow, updateProfileRow, useProfilesQuery } from './queries/useProfiles';
import {
  RECIPES_KEY,
  deleteIngredientRow,
  deleteRecipeRow,
  insertIngredient,
  insertRecipe,
  useRecipesQuery,
  useUpdateIngredientMutation,
  useUpdateRecipeMutation,
} from './queries/useRecipes';
import {
  useRolePermissionsQuery,
  useToggleRolePermMutation,
} from './queries/useRolePermissions';
import {
  STORE_SETTINGS_KEY,
  updateStoreSettingsRow,
  useStoreSettingsQuery,
  useToggleFeatureMutation,
  useUpdateAccentMutation,
} from './queries/useStoreSettings';
import { SALES_KEY, insertSale, useSalesQuery, type Sale } from './queries/useSales';
import {
  PURCHASE_REQUESTS_KEY,
  convertPrToPoRpc,
  deletePrItemRow,
  insertPrItem,
  insertPurchaseRequest,
  updatePrItemRow,
  updatePurchaseRequestRow,
  usePurchaseRequestsQuery,
} from './queries/usePurchaseRequests';
import {
  PURCHASE_ORDERS_KEY,
  deletePoItemRow,
  deletePoScheduleRow,
  insertPoItem,
  insertPoSchedule,
  insertPurchaseOrder,
  updatePoItemRow,
  updatePoScheduleRow,
  updatePurchaseOrderRow,
  usePurchaseOrdersQuery,
} from './queries/usePurchaseOrders';
import {
  SALES_ORDERS_KEY,
  deleteSoItemRow,
  insertSalesOrder,
  insertSoItem,
  updateSalesOrderStatus,
  updateSoItemRow,
  useSalesOrdersQuery,
} from './queries/useSalesOrders';
import { GOODS_RECEIPTS_KEY, completeGoodsReceiptRpc, useGoodsReceiptsQuery } from './queries/useGoodsReceipts';
import { MOVEMENTS_KEY, insertMovement, useMovementsQuery } from './queries/useMovements';
import { nextDocNo } from './queries/useDocNumbering';
import type {
  Cart,
  Category,
  ConfirmAction,
  CrudModalState,
  FeatureKey,
  GoodsReceipt,
  GrDraft,
  Ingredient,
  Lang,
  Material,
  Movement,
  PermissionKey,
  PoItem,
  PoScheduleLine,
  PrItem,
  PrintDocRef,
  Product,
  PurchaseOrder,
  PurchaseRequest,
  Recipe,
  RoleName,
  RolePermissions,
  SalesOrder,
  SoItem,
  StoreSettings,
  User,
  Vendor,
  View,
} from '../types';

export type ExpandableMenu = 'reports' | 'users' | 'purchasing';
export type ReportTab = 'daily' | 'monthly' | 'yearly' | 'stock' | 'movement';
export type UsersTab = 'list' | 'roles';
export type ProcTab = 'pr' | 'po' | 'gr' | 'vendor';
export type BomTab = 'bom' | 'materials';
export type PaymentStep = 'method' | 'matching' | 'success';

export interface CurrentUser {
  name: string;
  role: RoleName;
}

interface PosState {
  currentUser: CurrentUser | null;
  /** True until the initial Supabase session check resolves — gates the Login/Shell flash on load. */
  authLoading: boolean;
  /** True while a signInWithPassword call is in flight. */
  loginBusy: boolean;
  loginEmail: string;
  loginPassword: string;
  loginError: boolean;

  /** True while an invite-user request is in flight. */
  inviteBusy: boolean;
  /** Set on a failed invite so CrudModal can show it inline and stay open. */
  inviteError: string | null;

  lang: Lang;
  view: View;
  sidebarCollapsed: boolean;
  expandedMenu: ExpandableMenu | null;
  reportTab: ReportTab;
  usersTab: UsersTab;
  procTab: ProcTab;
  bomTab: BomTab;

  prHeaderOpen: boolean;
  prItemsOpen: boolean;
  poHeaderOpen: boolean;
  poItemsOpen: boolean;
  poScheduleOpen: boolean;

  expandedPrId: string | null;
  expandedPoId: string | null;
  expandedSoId: string | null;
  expandedProductId: number | null;

  grSelectedPo: GrDraft | null;
  grScanCode: string;
  printDoc: PrintDocRef | null;

  cart: Cart;
  activeCategory: string;
  searchQuery: string;
  productSearch: string;

  paymentOpen: boolean;
  paymentStep: PaymentStep;
  matchedTxnId: string | null;
  /** Set when a sale completes — drives the printable receipt. */
  paymentMethodKey: 'cash' | 'card' | 'bank' | null;
  saleCompletedAt: string | null;
  saleRef: string | null;

  dashboardPeriod: PeriodKey;
  selectedRole: RoleName;

  settingsDraft: StoreSettings | null;

  confirmAction: ConfirmAction | null;
  modal: CrudModalState | null;
  bomMsg: { id: string; text: string } | null;
}

function initialState(): PosState {
  return {
    currentUser: null,
    authLoading: true,
    loginBusy: false,
    loginEmail: '',
    loginPassword: '',
    loginError: false,

    inviteBusy: false,
    inviteError: null,

    lang: 'th',
    view: 'home',
    sidebarCollapsed: false,
    expandedMenu: null,
    reportTab: 'daily',
    usersTab: 'list',
    procTab: 'pr',
    bomTab: 'bom',

    prHeaderOpen: true,
    prItemsOpen: true,
    poHeaderOpen: true,
    poItemsOpen: true,
    poScheduleOpen: true,

    expandedPrId: null,
    expandedPoId: null,
    expandedSoId: null,
    expandedProductId: null,

    grSelectedPo: null,
    grScanCode: '',
    printDoc: null,

    cart: {},
    activeCategory: 'All',
    searchQuery: '',
    productSearch: '',

    paymentOpen: false,
    paymentStep: 'method',
    matchedTxnId: null,
    paymentMethodKey: null,
    saleCompletedAt: null,
    saleRef: null,

    dashboardPeriod: 'day',
    selectedRole: 'Owner',

    settingsDraft: null,

    confirmAction: null,
    modal: null,
    bomMsg: null,
  };
}

type Patch<T> = Partial<T>;

export interface PosApi extends PosState {
  t: Translation;
  fmt: (n: number) => string;
  hasPerm: (key: PermissionKey) => boolean;

  set: (p: Patch<PosState> | ((s: PosState) => Patch<PosState>)) => void;

  login: () => void;
  logout: () => void;
  setView: (v: View) => void;
  toggleMenu: (key: ExpandableMenu) => void;
  toggleSidebar: () => void;

  // Server-backed master data (Phase 2).
  products: Product[];
  materials: Material[];
  vendors: Vendor[];
  users: User[];
  bomRecipes: Recipe[];
  sales: Sale[];
  categories: Category[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  goodsReceipts: GoodsReceipt[];
  movements: Movement[];
  rolePermissions: RolePermissions;
  storeSettings: StoreSettings;
  storeId: string | undefined;
  accent: string;
  featureFlags: Record<FeatureKey, boolean>;
  /** True only on first load per query (React Query semantics) — gates the initial Shell paint. */
  dataLoading: boolean;
  /** First error hit by any core query, if any — a lightweight "something's wrong" signal. */
  apiError: string | null;
  setAccent: (color: string) => void;

  addToCart: (id: number) => void;
  decQty: (id: number) => void;
  completeSale: (paymentMethod: 'cash' | 'card' | 'bank', ref: string) => void;

  requestConfirm: (message: string, onConfirm: () => void) => void;
  confirmYes: () => void;
  confirmNo: () => void;

  openModal: (state: CrudModalState) => void;
  closeModal: () => void;
  updateModalField: (field: string, value: string | number) => void;
  saveModal: () => void;
  inviteUser: () => void;

  deleteProduct: (id: number) => void;
  deleteMaterial: (id: string) => void;
  deleteUser: (id: string) => void;
  deleteVendor: (id: string) => void;
  deleteCategory: (id: string) => void;
  toggleCategoryVisible: (id: string, visible: boolean) => void;

  addRecipe: () => void;
  deleteRecipe: (id: string) => void;
  updateRecipe: (id: string, p: Patch<Recipe>) => void;
  addIngredient: (recipeId: string) => void;
  removeIngredient: (recipeId: string, idx: number) => void;
  updateIngredient: (recipeId: string, idx: number, p: Patch<Ingredient>) => void;
  processRecipe: (recipeId: string) => void;

  addPr: () => void;
  updatePr: (id: string, p: Patch<PurchaseRequest>) => void;
  addPrItem: (id: string) => void;
  updatePrItem: (id: string, idx: number, p: Patch<PrItem>) => void;
  removePrItem: (id: string, idx: number) => void;
  savePr: (id: string) => void;
  approvePr: (id: string) => void;
  rejectPr: (id: string) => void;
  convertPrToPo: (pr: PurchaseRequest) => void;

  addPo: () => void;
  updatePo: (id: string, p: Patch<PurchaseOrder>) => void;
  addPoItem: (id: string) => void;
  updatePoItem: (id: string, idx: number, p: Patch<PoItem>) => void;
  removePoItem: (id: string, idx: number) => void;
  addPoSchedule: (id: string) => void;
  updatePoScheduleItem: (id: string, idx: number, p: Patch<PoScheduleLine>) => void;
  removePoSchedule: (id: string, idx: number) => void;
  savePo: (id: string) => void;

  addSo: () => void;
  addSoItem: (id: string) => void;
  updateSoItem: (id: string, idx: number, p: Patch<SoItem>) => void;
  removeSoItem: (id: string, idx: number) => void;
  submitSo: (id: string) => void;

  selectGrPo: (poId: string) => void;
  scanReceive: (code: string) => void;
  completeGoodsReceipt: () => void;

  toggleRolePerm: (role: RoleName, idx: number) => void;
  toggleFeature: (key: FeatureKey) => void;
  saveSettings: () => void;
  resetData: () => void;
}

const PosContext = createContext<PosApi | null>(null);

export function PosProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PosState>(initialState);
  const set = (p: Patch<PosState> | ((s: PosState) => Patch<PosState>)) =>
    setState((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));

  const qc = useQueryClient();
  const t = T[state.lang];

  const fmt = (n: number) => formatMoney(n, storeSettingsQuery.data?.storeSettings.currency ?? 'THB');

  /* ---------- Phase 2 server-backed queries ---------- */
  const productsQuery = useProductsQuery();
  const materialsQuery = useMaterialsQuery();
  const vendorsQuery = useVendorsQuery();
  const profilesQuery = useProfilesQuery();
  const recipesQuery = useRecipesQuery();
  const rolePermissionsQuery = useRolePermissionsQuery();
  const storeSettingsQuery = useStoreSettingsQuery();
  const salesQuery = useSalesQuery();
  const categoriesQuery = useCategoriesQuery();
  const purchaseRequestsQuery = usePurchaseRequestsQuery();
  const purchaseOrdersQuery = usePurchaseOrdersQuery();
  const salesOrdersQuery = useSalesOrdersQuery();
  const goodsReceiptsQuery = useGoodsReceiptsQuery();
  const movementsQuery = useMovementsQuery();

  const updateRecipeMutation = useUpdateRecipeMutation();
  const updateIngredientMutation = useUpdateIngredientMutation();
  const toggleRolePermMutation = useToggleRolePermMutation();
  const updateAccentMutation = useUpdateAccentMutation();
  const toggleFeatureMutation = useToggleFeatureMutation();
  const toggleCategoryVisibleMutation = useToggleCategoryVisibleMutation();

  const products = productsQuery.data ?? [];
  const materials = materialsQuery.data ?? [];
  const vendors = vendorsQuery.data ?? [];
  const users = profilesQuery.data ?? [];
  const bomRecipes = recipesQuery.data ?? [];
  const sales = salesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const purchaseRequests = purchaseRequestsQuery.data ?? [];
  const purchaseOrders = purchaseOrdersQuery.data ?? [];
  const salesOrders = salesOrdersQuery.data ?? [];
  const goodsReceipts = goodsReceiptsQuery.data ?? [];
  const movements = movementsQuery.data ?? [];
  const rolePermissions =
    rolePermissionsQuery.data ?? ({ Owner: [], Manager: [], Cashier: [], Viewer: [] } as RolePermissions);
  const storeSettings = storeSettingsQuery.data?.storeSettings ?? { name: '', businessType: '', currency: 'THB' as const, taxRate: 0 };
  const accent = storeSettingsQuery.data?.accent ?? '#10b981';
  const featureFlags =
    storeSettingsQuery.data?.featureFlags ?? { inventory: false, dashboard: false, payments: false, loyalty: false, multiBranch: false };
  const storeId = storeSettingsQuery.data?.id;

  const dataLoading =
    productsQuery.isLoading ||
    materialsQuery.isLoading ||
    vendorsQuery.isLoading ||
    profilesQuery.isLoading ||
    recipesQuery.isLoading ||
    rolePermissionsQuery.isLoading ||
    storeSettingsQuery.isLoading ||
    categoriesQuery.isLoading;

  const apiError =
    (productsQuery.error ||
      materialsQuery.error ||
      vendorsQuery.error ||
      profilesQuery.error ||
      recipesQuery.error ||
      rolePermissionsQuery.error ||
      storeSettingsQuery.error ||
      salesQuery.error ||
      categoriesQuery.error ||
      purchaseRequestsQuery.error ||
      purchaseOrdersQuery.error ||
      salesOrdersQuery.error ||
      goodsReceiptsQuery.error ||
      movementsQuery.error)?.message ?? null;

  const hasPerm = (key: PermissionKey): boolean => {
    if (!state.currentUser) return false;
    const idx = PERMISSION_KEYS.indexOf(key);
    return idx >= 0 && !!rolePermissions[state.currentUser.role]?.[idx];
  };

  const requestConfirm = (message: string, onConfirm: () => void) => set({ confirmAction: { message, onConfirm } });

  // Subscribes once to Supabase's auth state and mirrors it into `currentUser`
  // by joining the session against `profiles` for name/role. Kept outside the
  // action definitions below since it's a one-time subscription, not an action.
  useEffect(() => {
    let cancelled = false;

    const applySession = async (userId: string | undefined, resetView: boolean) => {
      if (!userId) {
        if (!cancelled) set({ currentUser: null, authLoading: false, loginBusy: false });
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', userId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        // Signed in with Supabase but no profiles row yet (e.g. the Owner
        // hasn't created one for this account) — don't show a broken shell.
        await supabase.auth.signOut();
        set({ currentUser: null, authLoading: false, loginBusy: false, loginError: true });
        return;
      }
      set({
        currentUser: { name: data.name as string, role: data.role as RoleName },
        authLoading: false,
        loginBusy: false,
        loginError: false,
        ...(resetView ? { view: 'home' as View } : {}),
      });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Only jump to Home on an actual sign-in, not on background token
      // refreshes (which fire this same callback roughly hourly).
      void applySession(session?.user.id, event === 'SIGNED_IN');
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- session ---------- */
  const login = () => {
    set({ loginBusy: true, loginError: false });
    supabase.auth
      .signInWithPassword({ email: state.loginEmail.trim(), password: state.loginPassword })
      .then(({ error }) => {
        // On success the onAuthStateChange listener above clears loginBusy
        // and populates currentUser; only handle the failure path here.
        if (error) set({ loginBusy: false, loginError: true, loginPassword: '' });
      });
  };

  const logout = () => {
    void supabase.auth.signOut();
    set({ loginEmail: '', loginPassword: '', loginError: false });
  };

  const setView = (v: View) => set({ view: v });

  const toggleMenu = (key: ExpandableMenu) =>
    set((s) => {
      const next = s.expandedMenu === key ? null : key;
      return { expandedMenu: next, view: next ? (next as View) : s.view };
    });

  const toggleSidebar = () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));

  /* ---------- cart / sales ---------- */
  const addToCart = (id: number) => set((s) => ({ cart: { ...s.cart, [id]: (s.cart[id] ?? 0) + 1 } }));

  const decQty = (id: number) =>
    set((s) => {
      const q = (s.cart[id] ?? 0) - 1;
      const c = { ...s.cart };
      if (q <= 0) delete c[id];
      else c[id] = q;
      return { cart: c };
    });

  // Stock and the sale record both live in Supabase now: checkout writes
  // through to products.stock and inserts a sales/sale_items row (the real
  // data source Dashboard/Reports read from), refreshing both afterward.
  // The movements ledger stays in-memory (Phase 3).
  const completeSale = (paymentMethod: 'cash' | 'card' | 'bank', ref: string) => {
    const cart = state.cart;
    const affected = Object.entries(cart).filter(([, q]) => q > 0);
    void Promise.all(
      affected.map(([id, qty]) => {
        const p = products.find((x) => x.id === Number(id));
        return p ? insertMovement({ type: 'out', item: p.name, qty: -qty, unit: p.unit }) : Promise.resolve();
      }),
    )
      .then(() => qc.invalidateQueries({ queryKey: MOVEMENTS_KEY }))
      .catch((err) => console.error('completeSale failed to log movement:', err));
    void Promise.all(
      affected.map(([id, qty]) => {
        const p = products.find((x) => x.id === Number(id));
        return p ? setProductStock(p.id, Math.max(0, p.stock - qty)) : Promise.resolve();
      }),
    )
      .then(() => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }))
      .catch((err) => console.error('completeSale failed to persist stock:', err));

    const lineItems = affected.map(([id, qty]) => {
      const p = products.find((x) => x.id === Number(id))!;
      return { productId: p.id, productName: p.name, qty, unitPrice: p.price, lineTotal: p.price * qty };
    });
    // product.price is tax-inclusive — see useCartTotals.ts for the same maths.
    const total = lineItems.reduce((sum, it) => sum + it.lineTotal, 0);
    const subtotal = total / (1 + storeSettings.taxRate / 100);
    const tax = total - subtotal;
    insertSale({ ref, cashierName: state.currentUser?.name ?? '', paymentMethod, subtotal, tax, total, items: lineItems })
      .then(() => qc.invalidateQueries({ queryKey: SALES_KEY }))
      .catch((err) => console.error('completeSale failed to persist sale record:', err));
  };

  /* ---------- confirm dialog ---------- */
  // The callback must run outside the state updater: React can invoke an
  // updater more than once, which would apply the confirmed action twice.
  const confirmYes = () => {
    const action = state.confirmAction;
    set({ confirmAction: null });
    action?.onConfirm();
  };

  const confirmNo = () => set({ confirmAction: null });

  /* ---------- CRUD modal ---------- */
  const openModal = (modal: CrudModalState) => set({ modal });
  const closeModal = () => set({ modal: null });
  const updateModalField = (field: string, value: string | number) =>
    set((s) => (s.modal ? { modal: { ...s.modal, data: { ...s.modal.data, [field]: value } } } : {}));

  const saveModal = () => {
    const modal = state.modal;
    if (!modal) return;
    const { type, mode, data } = modal;
    set({ modal: null });

    const run = async () => {
      if (type === 'product') {
        const d = data as unknown as Product;
        const fields = { code: d.code, name: d.name, price: d.price, cat: d.cat, initial: d.initial, stock: d.stock, unit: d.unit, description: d.description };
        // `id` is a GENERATED ALWAYS identity column — Postgres rejects an
        // UPDATE that includes it at all, even unchanged, so it must never
        // be spread into the patch payload (same for materials/vendors below).
        if (mode === 'add') await insertProduct({ ...fields, grad: 'linear-gradient(135deg,#8a8a9a,#5a5a6b)' });
        else await updateProductRow(d.id, fields);
        await qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      } else if (type === 'material') {
        const d = data as unknown as Material;
        const fields = { code: d.code, name: d.name, stock: d.stock, unit: d.unit, unitCost: d.unitCost };
        if (mode === 'add') await insertMaterial(fields);
        else await updateMaterialRow(d.id, fields);
        await qc.invalidateQueries({ queryKey: MATERIALS_KEY });
      } else if (type === 'user') {
        // 'add' goes through inviteUser() instead (CrudModal routes there),
        // since creating a profiles row needs a matching auth.users row that
        // only api/invite-user.ts's service-role client can create.
        const d = data as unknown as User;
        if (mode === 'edit') await updateProfileRow(d.id, { name: d.name, phone: d.phone, role: d.role });
        await qc.invalidateQueries({ queryKey: PROFILES_KEY });
      } else if (type === 'vendor') {
        const d = data as unknown as Vendor;
        const fields = { code: d.code, name: d.name, address: d.address, phone: d.phone, email: d.email };
        if (mode === 'add') await insertVendor(fields);
        else await updateVendorRow(d.id, fields);
        await qc.invalidateQueries({ queryKey: VENDORS_KEY });
      } else {
        const d = data as unknown as Category;
        if (mode === 'add') {
          await insertCategory(d.name);
        } else {
          // Products link back to a category by name (soft reference, same
          // pattern PR/PO line items use for materialCode) — renaming has to
          // cascade onto every product still tagged with the old name, or
          // they'd silently fall out of their category's filter chip.
          const prevName = categories.find((c) => c.id === d.id)?.name;
          await updateCategoryRow(d.id, { name: d.name });
          if (prevName && prevName !== d.name) {
            const { error } = await supabase.from('products').update({ cat: d.name }).eq('cat', prevName);
            if (error) throw error;
            await qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
          }
        }
        await qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
      }
    };
    void run().catch((err) => console.error('saveModal failed:', err));
  };

  // Separate from saveModal: invites can fail in ways worth showing the
  // Owner inline (duplicate email, etc.), so this keeps the modal open on
  // failure instead of closing immediately like the generic CRUD flow.
  const inviteUser = () => {
    const modal = state.modal;
    if (!modal || modal.type !== 'user') return;
    const d = modal.data as unknown as User;
    set({ inviteBusy: true, inviteError: null });

    const run = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not signed in.');

      const res = await fetch('/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: d.email, name: d.name, phone: d.phone, role: d.role }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || t.inviteGenericError);

      set({ modal: null, inviteBusy: false, inviteError: null });
      await qc.invalidateQueries({ queryKey: PROFILES_KEY });
    };

    void run().catch((err: unknown) => {
      set({ inviteBusy: false, inviteError: err instanceof Error ? err.message : t.inviteGenericError });
    });
  };

  /* ---------- deletes ---------- */
  const confirmDelete = (run: () => void) => requestConfirm(t.confirmDeleteMsg, run);

  const deleteProduct = (id: number) =>
    confirmDelete(() =>
      void deleteProductRow(id)
        .then(() => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }))
        .catch((err) => console.error('deleteProduct failed:', err)),
    );
  const deleteMaterial = (id: string) =>
    confirmDelete(() =>
      void deleteMaterialRow(id)
        .then(() => qc.invalidateQueries({ queryKey: MATERIALS_KEY }))
        .catch((err) => console.error('deleteMaterial failed:', err)),
    );
  const deleteUser = (id: string) =>
    confirmDelete(() =>
      void deleteProfileRow(id)
        .then(() => qc.invalidateQueries({ queryKey: PROFILES_KEY }))
        .catch((err) => console.error('deleteUser failed:', err)),
    );
  const deleteVendor = (id: string) =>
    confirmDelete(() =>
      void deleteVendorRow(id)
        .then(() => qc.invalidateQueries({ queryKey: VENDORS_KEY }))
        .catch((err) => console.error('deleteVendor failed:', err)),
    );
  // Deleting a category doesn't touch products still tagged with its name —
  // they just lose that filter chip on the Selling page, same soft-orphan
  // behavior as deleting a vendor still referenced by a PO's vendorCode.
  const deleteCategory = (id: string) =>
    confirmDelete(() =>
      void deleteCategoryRow(id)
        .then(() => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }))
        .catch((err) => console.error('deleteCategory failed:', err)),
    );
  const toggleCategoryVisible = (id: string, visible: boolean) => toggleCategoryVisibleMutation.mutate({ id, visible });

  /* ---------- BOM ---------- */
  const addRecipe = () => {
    const outputProductId = products[0]?.id;
    const materialId = materials[0]?.id;
    if (outputProductId === undefined || !materialId) return;
    void insertRecipe(outputProductId, materialId)
      .then(() => qc.invalidateQueries({ queryKey: RECIPES_KEY }))
      .catch((err) => console.error('addRecipe failed:', err));
  };

  const deleteRecipe = (id: string) =>
    confirmDelete(() =>
      void deleteRecipeRow(id)
        .then(() => qc.invalidateQueries({ queryKey: RECIPES_KEY }))
        .catch((err) => console.error('deleteRecipe failed:', err)),
    );

  const updateRecipe = (id: string, p: Patch<Recipe>) =>
    updateRecipeMutation.mutate({ id, patch: p });

  const addIngredient = (recipeId: string) => {
    const recipe = bomRecipes.find((r) => r.id === recipeId);
    const materialId = materials[0]?.id;
    if (!recipe || !materialId) return;
    void insertIngredient(recipeId, materialId, recipe.ingredients.length)
      .then(() => qc.invalidateQueries({ queryKey: RECIPES_KEY }))
      .catch((err) => console.error('addIngredient failed:', err));
  };

  const removeIngredient = (recipeId: string, idx: number) => {
    const ingredientId = (recipesQuery.data as (Recipe & { ingredientIds: string[] })[] | undefined)
      ?.find((r) => r.id === recipeId)?.ingredientIds[idx];
    if (!ingredientId) return;
    void deleteIngredientRow(ingredientId)
      .then(() => qc.invalidateQueries({ queryKey: RECIPES_KEY }))
      .catch((err) => console.error('removeIngredient failed:', err));
  };

  const updateIngredient = (recipeId: string, idx: number, p: Patch<Ingredient>) =>
    updateIngredientMutation.mutate({ recipeId, idx, patch: p });

  const processRecipe = (recipeId: string) => {
    const recipe = bomRecipes.find((r) => r.id === recipeId);
    const outputProduct = recipe && products.find((p) => p.id === recipe.outputProductId);
    if (!recipe || !outputProduct) return;

    const materialWrites = recipe.ingredients.map((ing) => {
      const mat = materials.find((m) => m.id === ing.materialId);
      return mat ? setMaterialStock(mat.id, Math.max(0, mat.stock - ing.qty * recipe.batchQty)) : Promise.resolve();
    });
    const productWrite = setProductStock(outputProduct.id, outputProduct.stock + recipe.batchQty);

    set({ bomMsg: { id: recipeId, text: t.bomProcessed(outputProduct.name, recipe.batchQty, outputProduct.unit) } });

    const movementWrites = [
      insertMovement({ type: 'in', item: outputProduct.name, qty: recipe.batchQty, unit: outputProduct.unit }),
      ...recipe.ingredients.map((ing) => {
        const mat = materials.find((m) => m.id === ing.materialId);
        return insertMovement({ type: 'out', item: mat?.name ?? ing.materialId, qty: -(ing.qty * recipe.batchQty), unit: mat?.unit ?? '' });
      }),
    ];
    void Promise.all(movementWrites)
      .then(() => qc.invalidateQueries({ queryKey: MOVEMENTS_KEY }))
      .catch((err) => console.error('processRecipe failed to log movement:', err));

    void Promise.all([...materialWrites, productWrite])
      .then(() => Promise.all([qc.invalidateQueries({ queryKey: MATERIALS_KEY }), qc.invalidateQueries({ queryKey: PRODUCTS_KEY })]))
      .catch((err) => console.error('processRecipe failed to persist stock:', err));
  };

  /* ---------- purchase requests ---------- */
  const addPr = () => {
    void insertPurchaseRequest(state.currentUser?.name ?? '', materials[0]?.code ?? '')
      .then((id) => {
        set({ expandedPrId: id });
        return qc.invalidateQueries({ queryKey: PURCHASE_REQUESTS_KEY });
      })
      .catch((err) => console.error('addPr failed:', err));
  };

  const updatePr = (id: string, p: Patch<PurchaseRequest>) => {
    void updatePurchaseRequestRow(id, p)
      .then(() => qc.invalidateQueries({ queryKey: PURCHASE_REQUESTS_KEY }))
      .catch((err) => console.error('updatePr failed:', err));
  };

  const addPrItem = (id: string) => {
    const pr = purchaseRequests.find((d) => d.id === id);
    void insertPrItem(id, materials[0]?.code ?? '', pr?.items.length ?? 0)
      .then(() => qc.invalidateQueries({ queryKey: PURCHASE_REQUESTS_KEY }))
      .catch((err) => console.error('addPrItem failed:', err));
  };

  const updatePrItem = (id: string, idx: number, p: Patch<PrItem>) => {
    const itemId = purchaseRequests.find((d) => d.id === id)?.itemIds[idx];
    if (!itemId) return;
    void updatePrItemRow(itemId, p)
      .then(() => qc.invalidateQueries({ queryKey: PURCHASE_REQUESTS_KEY }))
      .catch((err) => console.error('updatePrItem failed:', err));
  };

  const removePrItem = (id: string, idx: number) => {
    const itemId = purchaseRequests.find((d) => d.id === id)?.itemIds[idx];
    if (!itemId) return;
    void deletePrItemRow(itemId)
      .then(() => qc.invalidateQueries({ queryKey: PURCHASE_REQUESTS_KEY }))
      .catch((err) => console.error('removePrItem failed:', err));
  };

  const savePr = (id: string) => {
    const pr = purchaseRequests.find((d) => d.id === id);
    const run = async () => {
      const no = pr?.no || (await nextDocNo('PR'));
      await updatePurchaseRequestRow(id, { no, status: 'pending' });
      await qc.invalidateQueries({ queryKey: PURCHASE_REQUESTS_KEY });
    };
    void run().catch((err) => console.error('savePr failed:', err));
  };

  const approvePr = (id: string) => updatePr(id, { status: 'approved' });
  const rejectPr = (id: string) => updatePr(id, { status: 'rejected' });

  const convertPrToPo = (pr: PurchaseRequest) => {
    void convertPrToPoRpc(pr.id)
      .then(() =>
        Promise.all([
          qc.invalidateQueries({ queryKey: PURCHASE_REQUESTS_KEY }),
          qc.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY }),
        ]),
      )
      .catch((err) => console.error('convertPrToPo failed:', err));
  };

  /* ---------- purchase orders ---------- */
  const addPo = () => {
    void insertPurchaseOrder(vendors[0]?.code ?? '', materials[0]?.code ?? '', materials[0]?.unitCost ?? 0)
      .then((id) => {
        set({ expandedPoId: id });
        return qc.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      })
      .catch((err) => console.error('addPo failed:', err));
  };

  const updatePo = (id: string, p: Patch<PurchaseOrder>) => {
    void updatePurchaseOrderRow(id, p)
      .then(() => qc.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY }))
      .catch((err) => console.error('updatePo failed:', err));
  };

  const addPoItem = (id: string) => {
    const po = purchaseOrders.find((d) => d.id === id);
    void insertPoItem(id, materials[0]?.code ?? '', materials[0]?.unitCost ?? 0, po?.items.length ?? 0)
      .then(() => qc.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY }))
      .catch((err) => console.error('addPoItem failed:', err));
  };

  const updatePoItem = (id: string, idx: number, p: Patch<PoItem>) => {
    const itemId = purchaseOrders.find((d) => d.id === id)?.itemIds[idx];
    if (!itemId) return;
    void updatePoItemRow(itemId, p)
      .then(() => qc.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY }))
      .catch((err) => console.error('updatePoItem failed:', err));
  };

  const removePoItem = (id: string, idx: number) => {
    const itemId = purchaseOrders.find((d) => d.id === id)?.itemIds[idx];
    if (!itemId) return;
    void deletePoItemRow(itemId)
      .then(() => qc.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY }))
      .catch((err) => console.error('removePoItem failed:', err));
  };

  const addPoSchedule = (id: string) => {
    const po = purchaseOrders.find((d) => d.id === id);
    void insertPoSchedule(id, materials[0]?.code ?? '', po?.schedule.length ?? 0)
      .then(() => qc.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY }))
      .catch((err) => console.error('addPoSchedule failed:', err));
  };

  const updatePoScheduleItem = (id: string, idx: number, p: Patch<PoScheduleLine>) => {
    const scheduleId = purchaseOrders.find((d) => d.id === id)?.scheduleIds[idx];
    if (!scheduleId) return;
    void updatePoScheduleRow(scheduleId, p)
      .then(() => qc.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY }))
      .catch((err) => console.error('updatePoScheduleItem failed:', err));
  };

  const removePoSchedule = (id: string, idx: number) => {
    const scheduleId = purchaseOrders.find((d) => d.id === id)?.scheduleIds[idx];
    if (!scheduleId) return;
    void deletePoScheduleRow(scheduleId)
      .then(() => qc.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY }))
      .catch((err) => console.error('removePoSchedule failed:', err));
  };

  const savePo = (id: string) => {
    const po = purchaseOrders.find((d) => d.id === id);
    const run = async () => {
      const no = po?.no || (await nextDocNo('PO'));
      await updatePurchaseOrderRow(id, { no, status: 'ordered' });
      await qc.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
    };
    void run().catch((err) => console.error('savePo failed:', err));
  };

  /* ---------- sales orders ---------- */
  const addSo = () => {
    const run = async () => {
      const no = await nextDocNo('SO');
      const id = await insertSalesOrder(no, 'Walk-in', products[0]?.id ?? 0);
      set({ expandedSoId: id });
      await qc.invalidateQueries({ queryKey: SALES_ORDERS_KEY });
    };
    void run().catch((err) => console.error('addSo failed:', err));
  };

  const addSoItem = (id: string) => {
    const so = salesOrders.find((d) => d.id === id);
    void insertSoItem(id, products[0]?.id ?? 0, so?.items.length ?? 0)
      .then(() => qc.invalidateQueries({ queryKey: SALES_ORDERS_KEY }))
      .catch((err) => console.error('addSoItem failed:', err));
  };

  const updateSoItem = (id: string, idx: number, p: Patch<SoItem>) => {
    const itemId = salesOrders.find((d) => d.id === id)?.itemIds[idx];
    if (!itemId) return;
    void updateSoItemRow(itemId, p)
      .then(() => qc.invalidateQueries({ queryKey: SALES_ORDERS_KEY }))
      .catch((err) => console.error('updateSoItem failed:', err));
  };

  const removeSoItem = (id: string, idx: number) => {
    const itemId = salesOrders.find((d) => d.id === id)?.itemIds[idx];
    if (!itemId) return;
    void deleteSoItemRow(itemId)
      .then(() => qc.invalidateQueries({ queryKey: SALES_ORDERS_KEY }))
      .catch((err) => console.error('removeSoItem failed:', err));
  };

  const submitSo = (id: string) => {
    void updateSalesOrderStatus(id, 'confirmed')
      .then(() => qc.invalidateQueries({ queryKey: SALES_ORDERS_KEY }))
      .catch((err) => console.error('submitSo failed:', err));
  };

  /* ---------- goods receipt ---------- */
  // selectGrPo/scanReceive stay pure local UI state — nothing is persisted
  // until completeGoodsReceipt commits the draft via the RPC.
  const selectGrPo = (poId: string) =>
    set(() => {
      const po = purchaseOrders.find((p) => p.id === poId);
      return { grSelectedPo: po ? { poId, lines: po.items.map((it) => ({ materialCode: it.materialCode, ordered: it.qty, received: 0 })) } : null };
    });

  const scanReceive = (code: string) =>
    set((s) => {
      if (!s.grSelectedPo) return {};
      const needle = code.trim().toLowerCase();
      const mat = materials.find((m) => m.code.toLowerCase() === needle || m.name.toLowerCase() === needle);
      if (!mat) return { grScanCode: '' };
      const lines = s.grSelectedPo.lines.map((l) => (l.materialCode === mat.code ? { ...l, received: Math.min(l.ordered, l.received + 1) } : l));
      return { grSelectedPo: { ...s.grSelectedPo, lines }, grScanCode: '' };
    });

  // Numbering, the gr_lines insert, the materials.stock bump, and the
  // movement log entry all happen atomically inside complete_goods_receipt().
  const completeGoodsReceipt = () => {
    const draft = state.grSelectedPo;
    if (!draft) return;
    void completeGoodsReceiptRpc(draft.poId, draft.lines)
      .then(() =>
        Promise.all([
          qc.invalidateQueries({ queryKey: GOODS_RECEIPTS_KEY }),
          qc.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY }),
          qc.invalidateQueries({ queryKey: MATERIALS_KEY }),
          qc.invalidateQueries({ queryKey: MOVEMENTS_KEY }),
        ]),
      )
      .then(() => set({ grSelectedPo: null }))
      .catch((err) => console.error('completeGoodsReceipt failed:', err));
  };

  /* ---------- roles / features / settings ---------- */
  const toggleRolePerm = (role: RoleName, idx: number) => {
    if (!storeId) return;
    toggleRolePermMutation.mutate({ storeId, role, idx, allowed: !rolePermissions[role]?.[idx] });
  };

  const toggleFeature = (key: FeatureKey) => {
    if (!storeId) return;
    toggleFeatureMutation.mutate({ id: storeId, key, value: !featureFlags[key], flags: featureFlags });
  };

  const setAccent = (color: string) => {
    if (!storeId) return;
    updateAccentMutation.mutate({ id: storeId, accent: color });
  };

  const saveSettings = () =>
    requestConfirm(t.confirmSaveMsg, () => {
      const draft = state.settingsDraft;
      if (!draft || !storeId) return;
      set({ settingsDraft: null });
      void updateStoreSettingsRow(storeId, draft)
        .then(() => qc.invalidateQueries({ queryKey: STORE_SETTINGS_KEY }))
        .catch((err) => console.error('saveSettings failed:', err));
    });

  // Every other domain (stock, sales, movements, purchasing/selling docs) is
  // real data in Supabase now — nothing left to "reset" except the in-progress
  // cart, which is the only thing that was ever meant to be disposable.
  const resetData = () => set({ cart: {} });

  return (
    <PosContext.Provider
      value={{
        ...state,
        t,
        fmt,
        hasPerm,
        set,
        login,
        logout,
        setView,
        toggleMenu,
        toggleSidebar,
        products,
        materials,
        vendors,
        users,
        bomRecipes,
        sales,
        categories,
        purchaseRequests,
        purchaseOrders,
        salesOrders,
        goodsReceipts,
        movements,
        rolePermissions,
        storeSettings,
        storeId,
        accent,
        featureFlags,
        dataLoading,
        apiError,
        setAccent,
        addToCart,
        decQty,
        completeSale,
        requestConfirm,
        confirmYes,
        confirmNo,
        openModal,
        closeModal,
        updateModalField,
        saveModal,
        inviteUser,
        deleteProduct,
        deleteMaterial,
        deleteUser,
        deleteVendor,
        deleteCategory,
        toggleCategoryVisible,
        addRecipe,
        deleteRecipe,
        updateRecipe,
        addIngredient,
        removeIngredient,
        updateIngredient,
        processRecipe,
        addPr,
        updatePr,
        addPrItem,
        updatePrItem,
        removePrItem,
        savePr,
        approvePr,
        rejectPr,
        convertPrToPo,
        addPo,
        updatePo,
        addPoItem,
        updatePoItem,
        removePoItem,
        addPoSchedule,
        updatePoScheduleItem,
        removePoSchedule,
        savePo,
        addSo,
        addSoItem,
        updateSoItem,
        removeSoItem,
        submitSo,
        selectGrPo,
        scanReceive,
        completeGoodsReceipt,
        toggleRolePerm,
        toggleFeature,
        saveSettings,
        resetData,
      }}
    >
      {children}
    </PosContext.Provider>
  );
}

export function usePos(): PosApi {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error('usePos must be used inside <PosProvider>');
  return ctx;
}
