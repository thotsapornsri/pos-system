import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  CUSTOMERS,
  GOODS_RECEIPTS,
  INITIAL_MOVEMENTS,
  PERMISSION_KEYS,
  PURCHASE_ORDERS,
  PURCHASE_REQUESTS,
  SALES_ORDERS,
  clone,
  type PeriodKey,
} from '../data/seed';
import { T, type Translation } from '../i18n/translations';
import { formatMoney, today } from '../lib/format';
import { uid } from '../lib/id';
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
import type {
  Cart,
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

/** Document numbers run on an independent sequence per prefix. Still in-memory — Phase 3 moves this server-side. */
const DOC_SEQ: Record<string, number> = { PR: 1002, PO: 2002, SO: 3002, GR: 4001 };

function nextDocNo(prefix: string): string {
  const n = DOC_SEQ[prefix] ?? 1;
  DOC_SEQ[prefix] = n + 1;
  return `${prefix}-${n}`;
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

  lang: Lang;
  view: View;
  sidebarCollapsed: boolean;
  expandedMenu: ExpandableMenu | null;
  reportTab: ReportTab;
  usersTab: UsersTab;
  procTab: ProcTab;
  bomTab: BomTab;

  // Still in-memory — Phase 3 migrates these.
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  goodsReceipts: GoodsReceipt[];
  movements: Movement[];

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

    lang: 'th',
    view: 'home',
    sidebarCollapsed: false,
    expandedMenu: null,
    reportTab: 'daily',
    usersTab: 'list',
    procTab: 'pr',
    bomTab: 'bom',

    purchaseRequests: clone(PURCHASE_REQUESTS),
    purchaseOrders: clone(PURCHASE_ORDERS),
    salesOrders: clone(SALES_ORDERS),
    goodsReceipts: clone(GOODS_RECEIPTS),
    movements: clone(INITIAL_MOVEMENTS),

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
  rolePermissions: RolePermissions;
  storeSettings: StoreSettings;
  accent: string;
  featureFlags: Record<FeatureKey, boolean>;
  /** True only on first load per query (React Query semantics) — gates the initial Shell paint. */
  dataLoading: boolean;
  /** First error hit by any core query, if any — a lightweight "something's wrong" signal. */
  apiError: string | null;
  setAccent: (color: string) => void;

  addToCart: (id: number) => void;
  decQty: (id: number) => void;
  completeSale: () => void;

  requestConfirm: (message: string, onConfirm: () => void) => void;
  confirmYes: () => void;
  confirmNo: () => void;

  openModal: (state: CrudModalState) => void;
  closeModal: () => void;
  updateModalField: (field: string, value: string | number) => void;
  saveModal: () => void;

  deleteProduct: (id: number) => void;
  deleteMaterial: (id: string) => void;
  deleteUser: (id: string) => void;
  deleteVendor: (id: string) => void;

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

  const updateRecipeMutation = useUpdateRecipeMutation();
  const updateIngredientMutation = useUpdateIngredientMutation();
  const toggleRolePermMutation = useToggleRolePermMutation();
  const updateAccentMutation = useUpdateAccentMutation();
  const toggleFeatureMutation = useToggleFeatureMutation();

  const products = productsQuery.data ?? [];
  const materials = materialsQuery.data ?? [];
  const vendors = vendorsQuery.data ?? [];
  const users = profilesQuery.data ?? [];
  const bomRecipes = recipesQuery.data ?? [];
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
    storeSettingsQuery.isLoading;

  const apiError =
    (productsQuery.error ||
      materialsQuery.error ||
      vendorsQuery.error ||
      profilesQuery.error ||
      recipesQuery.error ||
      rolePermissionsQuery.error ||
      storeSettingsQuery.error)?.message ?? null;

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

  // Stock lives in Supabase now, so checkout writes through: compute each
  // affected product's new stock from the cached query data, persist it,
  // then refresh. The movements ledger stays in-memory (Phase 3).
  const completeSale = () => {
    const cart = state.cart;
    const affected = Object.entries(cart).filter(([, q]) => q > 0);
    const movements: Movement[] = affected.map(([id, qty]) => {
      const p = products.find((x) => x.id === Number(id))!;
      return { ts: t.justNow, type: 'out', item: p.name, qty: -qty, unit: p.unit };
    });
    set((s) => ({ movements: [...movements, ...s.movements] }));
    void Promise.all(
      affected.map(([id, qty]) => {
        const p = products.find((x) => x.id === Number(id));
        return p ? setProductStock(p.id, Math.max(0, p.stock - qty)) : Promise.resolve();
      }),
    )
      .then(() => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }))
      .catch((err) => console.error('completeSale failed to persist stock:', err));
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
        // "Add" isn't reachable — UsersView shows a hint instead of this
        // modal for adding, since a profiles row needs an existing
        // auth.users row that only Supabase's admin API can create.
        const d = data as unknown as User;
        if (mode === 'edit') await updateProfileRow(d.id, { name: d.name, phone: d.phone, role: d.role });
        await qc.invalidateQueries({ queryKey: PROFILES_KEY });
      } else {
        const d = data as unknown as Vendor;
        const fields = { code: d.code, name: d.name, address: d.address, phone: d.phone, email: d.email };
        if (mode === 'add') await insertVendor(fields);
        else await updateVendorRow(d.id, fields);
        await qc.invalidateQueries({ queryKey: VENDORS_KEY });
      }
    };
    void run().catch((err) => console.error('saveModal failed:', err));
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

    const movements: Movement[] = [
      { ts: t.justNow, type: 'in', item: outputProduct.name, qty: recipe.batchQty, unit: outputProduct.unit },
      ...recipe.ingredients.map((ing) => {
        const mat = materials.find((m) => m.id === ing.materialId);
        return { ts: t.justNow, type: 'out' as const, item: mat?.name ?? ing.materialId, qty: -(ing.qty * recipe.batchQty), unit: mat?.unit ?? '' };
      }),
    ];
    set((s) => ({
      movements: [...movements, ...s.movements],
      bomMsg: { id: recipeId, text: t.bomProcessed(outputProduct.name, recipe.batchQty, outputProduct.unit) },
    }));

    void Promise.all([...materialWrites, productWrite])
      .then(() => Promise.all([qc.invalidateQueries({ queryKey: MATERIALS_KEY }), qc.invalidateQueries({ queryKey: PRODUCTS_KEY })]))
      .catch((err) => console.error('processRecipe failed to persist stock:', err));
  };

  /* ---------- purchase requests (still in-memory — Phase 3) ---------- */
  const addPr = () =>
    set((s) => {
      const id = uid('pr');
      return {
        purchaseRequests: [
          ...s.purchaseRequests,
          { id, no: '', date: today(), requester: s.currentUser?.name ?? '', status: 'draft' as const, items: [{ materialCode: materials[0]?.code ?? '', qty: 1 }] },
        ],
        expandedPrId: id,
      };
    });

  const updatePr = (id: string, p: Patch<PurchaseRequest>) =>
    set((s) => ({ purchaseRequests: s.purchaseRequests.map((d) => (d.id === id ? { ...d, ...p } : d)) }));

  const addPrItem = (id: string) =>
    set((s) => ({
      purchaseRequests: s.purchaseRequests.map((d) =>
        d.id === id ? { ...d, items: [...d.items, { materialCode: materials[0]?.code ?? '', qty: 1 }] } : d,
      ),
    }));

  const updatePrItem = (id: string, idx: number, p: Patch<PrItem>) =>
    set((s) => ({
      purchaseRequests: s.purchaseRequests.map((d) =>
        d.id === id ? { ...d, items: d.items.map((it, i) => (i === idx ? { ...it, ...p } : it)) } : d,
      ),
    }));

  const removePrItem = (id: string, idx: number) =>
    set((s) => ({
      purchaseRequests: s.purchaseRequests.map((d) => (d.id === id ? { ...d, items: d.items.filter((_, i) => i !== idx) } : d)),
    }));

  // Document numbers come off a module-level counter, so they are drawn here
  // rather than inside the updater — an updater may run more than once.
  const savePr = (id: string) => {
    const no = state.purchaseRequests.find((d) => d.id === id)?.no || nextDocNo('PR');
    set((s) => ({ purchaseRequests: s.purchaseRequests.map((d) => (d.id === id ? { ...d, no, status: 'pending' as const } : d)) }));
  };

  const approvePr = (id: string) => updatePr(id, { status: 'approved' });
  const rejectPr = (id: string) => updatePr(id, { status: 'rejected' });

  const convertPrToPo = (pr: PurchaseRequest) => {
    const no = nextDocNo('PO');
    const id = uid('po');
    set((s) => ({
      purchaseRequests: s.purchaseRequests.map((d) => (d.id === pr.id ? { ...d, status: 'converted' as const } : d)),
      purchaseOrders: [
        ...s.purchaseOrders,
        {
          id,
          no,
          date: today(),
          poType: 'fromPr' as const,
          refPrNo: pr.no,
          vendorCode: vendors[0]?.code ?? '',
          status: 'ordered' as const,
          schedule: [],
          items: pr.items.map((it) => ({ materialCode: it.materialCode, qty: it.qty, price: materials.find((m) => m.code === it.materialCode)?.unitCost ?? 0 })),
        },
      ],
    }));
  };

  /* ---------- purchase orders (still in-memory — Phase 3) ---------- */
  const addPo = () =>
    set((s) => {
      const id = uid('po');
      return {
        purchaseOrders: [
          ...s.purchaseOrders,
          { id, no: '', date: today(), poType: 'noPr' as const, refPrNo: '', vendorCode: vendors[0]?.code ?? '', status: 'draft' as const, items: [{ materialCode: materials[0]?.code ?? '', qty: 1, price: materials[0]?.unitCost ?? 0 }], schedule: [] },
        ],
        expandedPoId: id,
      };
    });

  const updatePo = (id: string, p: Patch<PurchaseOrder>) =>
    set((s) => ({ purchaseOrders: s.purchaseOrders.map((d) => (d.id === id ? { ...d, ...p } : d)) }));

  const addPoItem = (id: string) =>
    set((s) => ({
      purchaseOrders: s.purchaseOrders.map((d) =>
        d.id === id ? { ...d, items: [...d.items, { materialCode: materials[0]?.code ?? '', qty: 1, price: materials[0]?.unitCost ?? 0 }] } : d,
      ),
    }));

  const updatePoItem = (id: string, idx: number, p: Patch<PoItem>) =>
    set((s) => ({
      purchaseOrders: s.purchaseOrders.map((d) => (d.id === id ? { ...d, items: d.items.map((it, i) => (i === idx ? { ...it, ...p } : it)) } : d)),
    }));

  const removePoItem = (id: string, idx: number) =>
    set((s) => ({ purchaseOrders: s.purchaseOrders.map((d) => (d.id === id ? { ...d, items: d.items.filter((_, i) => i !== idx) } : d)) }));

  const addPoSchedule = (id: string) =>
    set((s) => ({
      purchaseOrders: s.purchaseOrders.map((d) =>
        d.id === id ? { ...d, schedule: [...d.schedule, { materialCode: materials[0]?.code ?? '', startDate: today(), deliveryDate: today(), scheduleQty: 1 }] } : d,
      ),
    }));

  const updatePoScheduleItem = (id: string, idx: number, p: Patch<PoScheduleLine>) =>
    set((s) => ({
      purchaseOrders: s.purchaseOrders.map((d) => (d.id === id ? { ...d, schedule: d.schedule.map((sc, i) => (i === idx ? { ...sc, ...p } : sc)) } : d)),
    }));

  const removePoSchedule = (id: string, idx: number) =>
    set((s) => ({ purchaseOrders: s.purchaseOrders.map((d) => (d.id === id ? { ...d, schedule: d.schedule.filter((_, i) => i !== idx) } : d)) }));

  const savePo = (id: string) => {
    const no = state.purchaseOrders.find((d) => d.id === id)?.no || nextDocNo('PO');
    set((s) => ({ purchaseOrders: s.purchaseOrders.map((d) => (d.id === id ? { ...d, no, status: 'ordered' as const } : d)) }));
  };

  /* ---------- sales orders (still in-memory — Phase 3) ---------- */
  const addSo = () => {
    const id = uid('so');
    const no = nextDocNo('SO');
    set((s) => ({
      salesOrders: [...s.salesOrders, { id, no, date: today(), customer: CUSTOMERS[0], status: 'draft' as const, items: [{ productId: products[0]?.id ?? 0, qty: 1 }] }],
      expandedSoId: id,
    }));
  };

  const addSoItem = (id: string) =>
    set((s) => ({
      salesOrders: s.salesOrders.map((d) => (d.id === id ? { ...d, items: [...d.items, { productId: products[0]?.id ?? 0, qty: 1 }] } : d)),
    }));

  const updateSoItem = (id: string, idx: number, p: Patch<SoItem>) =>
    set((s) => ({ salesOrders: s.salesOrders.map((d) => (d.id === id ? { ...d, items: d.items.map((it, i) => (i === idx ? { ...it, ...p } : it)) } : d)) }));

  const removeSoItem = (id: string, idx: number) =>
    set((s) => ({ salesOrders: s.salesOrders.map((d) => (d.id === id ? { ...d, items: d.items.filter((_, i) => i !== idx) } : d)) }));

  const submitSo = (id: string) =>
    set((s) => ({ salesOrders: s.salesOrders.map((d) => (d.id === id ? { ...d, status: 'confirmed' as const } : d)) }));

  /* ---------- goods receipt (still in-memory — Phase 3) ---------- */
  const selectGrPo = (poId: string) =>
    set((s) => {
      const po = s.purchaseOrders.find((p) => p.id === poId);
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

  const completeGoodsReceipt = () => {
    if (!state.grSelectedPo) return;
    const grNo = nextDocNo('GR');
    const grId = uid('gr');
    set((s) => {
      const draft = s.grSelectedPo;
      if (!draft) return {};
      const purchaseOrders = s.purchaseOrders.map((p) => (p.id === draft.poId ? { ...p, status: 'received' as const } : p));
      const goodsReceipts = [...s.goodsReceipts, { id: grId, no: grNo, date: today(), poId: draft.poId, lines: draft.lines }];
      const movements: Movement[] = [
        ...draft.lines.filter((l) => l.received > 0).map((l) => {
          const mat = materials.find((m) => m.code === l.materialCode);
          return { ts: t.justNow, type: 'in' as const, item: mat?.name ?? l.materialCode, qty: l.received, unit: mat?.unit ?? '' };
        }),
        ...s.movements,
      ];
      return { purchaseOrders, goodsReceipts, movements, grSelectedPo: null };
    });
    // Received quantities also bump the real materials.stock — Phase 3's
    // proper RPC will make this atomic with the rest; for now this mirrors
    // the same pattern completeSale/processRecipe already use.
    const lines = state.grSelectedPo.lines.filter((l) => l.received > 0);
    void Promise.all(
      lines.map((l) => {
        const mat = materials.find((m) => m.code === l.materialCode);
        return mat ? setMaterialStock(mat.id, mat.stock + l.received) : Promise.resolve();
      }),
    )
      .then(() => qc.invalidateQueries({ queryKey: MATERIALS_KEY }))
      .catch((err) => console.error('completeGoodsReceipt failed to persist stock:', err));
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

  // Product/material stock now lives in Supabase, so "reset" only clears
  // what's still local (movements ledger, cart) — resetting real stock back
  // to seed values would mean bulk-overwriting every row, which isn't
  // implemented yet. Dashboard/Reports' reset button is scoped down to match.
  const resetData = () => set({ movements: [], cart: {} });

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
        rolePermissions,
        storeSettings,
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
        deleteProduct,
        deleteMaterial,
        deleteUser,
        deleteVendor,
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
