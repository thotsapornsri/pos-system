import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  BOM_RECIPES,
  CUSTOMERS,
  DEFAULT_ACCENT,
  DEFAULT_ROLE_PERMS,
  GOODS_RECEIPTS,
  INITIAL_MOVEMENTS,
  MATERIALS,
  PERMISSION_KEYS,
  PRODUCTS,
  PURCHASE_ORDERS,
  PURCHASE_REQUESTS,
  SALES_ORDERS,
  USERS,
  VENDORS,
  clone,
  type PeriodKey,
} from '../data/seed';
import { T, type Translation } from '../i18n/translations';
import { formatMoney, initialsOf, today } from '../lib/format';
import { uid } from '../lib/id';
import { supabase } from '../lib/supabaseClient';
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

/** Document numbers run on an independent sequence per prefix. */
const DOC_SEQ: Record<string, number> = { PR: 1002, PO: 2002, SO: 3002, GR: 4001 };

/** Product ids are numeric in the data model, so allocate the next free one. */
function nextProductId(products: Product[]): number {
  return products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

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

  products: Product[];
  materials: Material[];
  bomRecipes: Recipe[];
  users: User[];
  vendors: Vendor[];
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
  rolePermissions: RolePermissions;
  featureFlags: Record<FeatureKey, boolean>;

  storeSettings: StoreSettings;
  settingsDraft: StoreSettings | null;
  accent: string;

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

    products: clone(PRODUCTS),
    materials: clone(MATERIALS),
    bomRecipes: clone(BOM_RECIPES),
    users: clone(USERS),
    vendors: clone(VENDORS),
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
    rolePermissions: clone(DEFAULT_ROLE_PERMS),
    featureFlags: { inventory: true, dashboard: true, payments: true, loyalty: false, multiBranch: false },

    storeSettings: { name: 'Brew & Co.', businessType: 'Café & Bakery', currency: 'THB', taxRate: 7 },
    settingsDraft: null,
    accent: DEFAULT_ACCENT,

    confirmAction: null,
    modal: null,
    bomMsg: null,
  };
}

type Patch<T> = Partial<T>;

function useActions(setState: React.Dispatch<React.SetStateAction<PosState>>) {
  const patch = useCallback(
    (p: Patch<PosState> | ((s: PosState) => Patch<PosState>)) =>
      setState((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) })),
    [setState],
  );
  return patch;
}

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
  const set = useActions(setState);

  const t = T[state.lang];

  const fmt = useCallback(
    (n: number) => formatMoney(n, state.storeSettings.currency),
    [state.storeSettings.currency],
  );

  const hasPerm = useCallback(
    (key: PermissionKey) => {
      if (!state.currentUser) return false;
      const idx = PERMISSION_KEYS.indexOf(key);
      return idx >= 0 && !!state.rolePermissions[state.currentUser.role][idx];
    },
    [state.currentUser, state.rolePermissions],
  );

  const requestConfirm = useCallback(
    (message: string, onConfirm: () => void) => set({ confirmAction: { message, onConfirm } }),
    [set],
  );

  // Subscribes once to Supabase's auth state and mirrors it into `currentUser`
  // by joining the session against `profiles` for name/role. Kept outside the
  // action useMemo below since it's a one-time subscription, not an action.
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
  }, [set]);

  const api = useMemo<PosApi>(() => {
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
    const addToCart = (id: number) =>
      set((s) => ({ cart: { ...s.cart, [id]: (s.cart[id] ?? 0) + 1 } }));

    const decQty = (id: number) =>
      set((s) => {
        const q = (s.cart[id] ?? 0) - 1;
        const c = { ...s.cart };
        if (q <= 0) delete c[id];
        else c[id] = q;
        return { cart: c };
      });

    const completeSale = () =>
      set((s) => {
        const products = s.products.map((p) => {
          const qty = s.cart[p.id];
          return qty ? { ...p, stock: Math.max(0, p.stock - qty) } : p;
        });
        const movements: Movement[] = [
          ...Object.entries(s.cart)
            .filter(([, q]) => q > 0)
            .map(([id, qty]) => {
              const p = s.products.find((x) => x.id === Number(id))!;
              return { ts: T[s.lang].justNow, type: 'out' as const, item: p.name, qty: -qty, unit: p.unit };
            }),
          ...s.movements,
        ];
        return { products, movements };
      });

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

    const saveModal = () =>
      set((s) => {
        if (!s.modal) return {};
        const { type, mode, data } = s.modal;
        if (type === 'product') {
          const products =
            mode === 'add'
              ? [...s.products, { ...(data as unknown as Product), id: nextProductId(s.products), grad: 'linear-gradient(135deg,#8a8a9a,#5a5a6b)' }]
              : s.products.map((p) => (p.id === data.id ? { ...p, ...(data as unknown as Product) } : p));
          return { products, modal: null };
        }
        if (type === 'material') {
          const materials =
            mode === 'add'
              ? [...s.materials, { ...(data as unknown as Material), id: uid('m') }]
              : s.materials.map((m) => (m.id === data.id ? { ...m, ...(data as unknown as Material) } : m));
          return { materials, modal: null };
        }
        if (type === 'user') {
          const users =
            mode === 'add'
              ? [
                  ...s.users,
                  {
                    ...(data as unknown as User),
                    id: uid('u'),
                    initials: initialsOf(String(data.name ?? '??')),
                    grad: 'linear-gradient(135deg,#8a8a9a,#5a5a6b)',
                    lastActive: T[s.lang].justNow,
                    status: 'active' as const,
                    locked: false,
                  },
                ]
              : s.users.map((u) => (u.id === data.id ? { ...u, ...(data as unknown as User) } : u));
          return { users, modal: null };
        }
        const vendors =
          mode === 'add'
            ? [...s.vendors, { ...(data as unknown as Vendor), id: uid('v') }]
            : s.vendors.map((v) => (v.id === data.id ? { ...v, ...(data as unknown as Vendor) } : v));
        return { vendors, modal: null };
      });

    /* ---------- deletes ---------- */
    const confirmDelete = (run: () => void) => requestConfirm(t.confirmDeleteMsg, run);
    const deleteProduct = (id: number) =>
      confirmDelete(() => set((s) => ({ products: s.products.filter((p) => p.id !== id) })));
    const deleteMaterial = (id: string) =>
      confirmDelete(() => set((s) => ({ materials: s.materials.filter((m) => m.id !== id) })));
    const deleteUser = (id: string) =>
      confirmDelete(() => set((s) => ({ users: s.users.filter((u) => u.id !== id) })));
    const deleteVendor = (id: string) =>
      confirmDelete(() => set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) })));

    /* ---------- BOM ---------- */
    const addRecipe = () =>
      set((s) => ({
        bomRecipes: [
          ...s.bomRecipes,
          {
            id: uid('r'),
            outputProductId: s.products[0]?.id ?? 0,
            batchQty: 1,
            ingredients: [{ materialId: s.materials[0]?.id ?? '', qty: 1 }],
          },
        ],
      }));

    const deleteRecipe = (id: string) =>
      confirmDelete(() => set((s) => ({ bomRecipes: s.bomRecipes.filter((r) => r.id !== id) })));

    const updateRecipe = (id: string, p: Patch<Recipe>) =>
      set((s) => ({ bomRecipes: s.bomRecipes.map((r) => (r.id === id ? { ...r, ...p } : r)) }));

    const addIngredient = (recipeId: string) =>
      set((s) => ({
        bomRecipes: s.bomRecipes.map((r) =>
          r.id === recipeId
            ? { ...r, ingredients: [...r.ingredients, { materialId: s.materials[0]?.id ?? '', qty: 1 }] }
            : r,
        ),
      }));

    const removeIngredient = (recipeId: string, idx: number) =>
      set((s) => ({
        bomRecipes: s.bomRecipes.map((r) =>
          r.id === recipeId ? { ...r, ingredients: r.ingredients.filter((_, i) => i !== idx) } : r,
        ),
      }));

    const updateIngredient = (recipeId: string, idx: number, p: Patch<Ingredient>) =>
      set((s) => ({
        bomRecipes: s.bomRecipes.map((r) =>
          r.id === recipeId
            ? { ...r, ingredients: r.ingredients.map((ing, i) => (i === idx ? { ...ing, ...p } : ing)) }
            : r,
        ),
      }));

    const processRecipe = (recipeId: string) =>
      set((s) => {
        const recipe = s.bomRecipes.find((r) => r.id === recipeId);
        const outputProduct = recipe && s.products.find((p) => p.id === recipe.outputProductId);
        if (!recipe || !outputProduct) return {};
        const tt = T[s.lang];
        const materials = s.materials.map((m) => {
          const ing = recipe.ingredients.find((i) => i.materialId === m.id);
          return ing ? { ...m, stock: Math.max(0, m.stock - ing.qty * recipe.batchQty) } : m;
        });
        const products = s.products.map((p) =>
          p.id === recipe.outputProductId ? { ...p, stock: p.stock + recipe.batchQty } : p,
        );
        const movements: Movement[] = [
          { ts: tt.justNow, type: 'in', item: outputProduct.name, qty: recipe.batchQty, unit: outputProduct.unit },
          ...recipe.ingredients.map((ing) => {
            const mat = s.materials.find((m) => m.id === ing.materialId);
            return {
              ts: tt.justNow,
              type: 'out' as const,
              item: mat?.name ?? ing.materialId,
              qty: -(ing.qty * recipe.batchQty),
              unit: mat?.unit ?? '',
            };
          }),
          ...s.movements,
        ];
        return {
          materials,
          products,
          movements,
          bomMsg: {
            id: recipeId,
            text: tt.bomProcessed(outputProduct.name, recipe.batchQty, outputProduct.unit),
          },
        };
      });

    /* ---------- purchase requests ---------- */
    const addPr = () =>
      set((s) => {
        const id = uid('pr');
        return {
          purchaseRequests: [
            ...s.purchaseRequests,
            {
              id,
              no: '',
              date: today(),
              requester: s.currentUser?.name ?? '',
              status: 'draft' as const,
              items: [{ materialCode: s.materials[0]?.code ?? '', qty: 1 }],
            },
          ],
          expandedPrId: id,
        };
      });

    const updatePr = (id: string, p: Patch<PurchaseRequest>) =>
      set((s) => ({ purchaseRequests: s.purchaseRequests.map((d) => (d.id === id ? { ...d, ...p } : d)) }));

    const addPrItem = (id: string) =>
      set((s) => ({
        purchaseRequests: s.purchaseRequests.map((d) =>
          d.id === id ? { ...d, items: [...d.items, { materialCode: s.materials[0]?.code ?? '', qty: 1 }] } : d,
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
        purchaseRequests: s.purchaseRequests.map((d) =>
          d.id === id ? { ...d, items: d.items.filter((_, i) => i !== idx) } : d,
        ),
      }));

    // Document numbers come off a module-level counter, so they are drawn here
    // rather than inside the updater — an updater may run more than once.
    const savePr = (id: string) => {
      const no = state.purchaseRequests.find((d) => d.id === id)?.no || nextDocNo('PR');
      set((s) => ({
        purchaseRequests: s.purchaseRequests.map((d) => (d.id === id ? { ...d, no, status: 'pending' as const } : d)),
      }));
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
            vendorCode: s.vendors[0]?.code ?? '',
            status: 'ordered' as const,
            schedule: [],
            items: pr.items.map((it) => ({
              materialCode: it.materialCode,
              qty: it.qty,
              price: s.materials.find((m) => m.code === it.materialCode)?.unitCost ?? 0,
            })),
          },
        ],
      }));
    };

    /* ---------- purchase orders ---------- */
    const addPo = () =>
      set((s) => {
        const id = uid('po');
        return {
          purchaseOrders: [
            ...s.purchaseOrders,
            {
              id,
              no: '',
              date: today(),
              poType: 'noPr' as const,
              refPrNo: '',
              vendorCode: s.vendors[0]?.code ?? '',
              status: 'draft' as const,
              items: [{ materialCode: s.materials[0]?.code ?? '', qty: 1, price: s.materials[0]?.unitCost ?? 0 }],
              schedule: [],
            },
          ],
          expandedPoId: id,
        };
      });

    const updatePo = (id: string, p: Patch<PurchaseOrder>) =>
      set((s) => ({ purchaseOrders: s.purchaseOrders.map((d) => (d.id === id ? { ...d, ...p } : d)) }));

    const addPoItem = (id: string) =>
      set((s) => ({
        purchaseOrders: s.purchaseOrders.map((d) =>
          d.id === id
            ? {
                ...d,
                items: [
                  ...d.items,
                  { materialCode: s.materials[0]?.code ?? '', qty: 1, price: s.materials[0]?.unitCost ?? 0 },
                ],
              }
            : d,
        ),
      }));

    const updatePoItem = (id: string, idx: number, p: Patch<PoItem>) =>
      set((s) => ({
        purchaseOrders: s.purchaseOrders.map((d) =>
          d.id === id ? { ...d, items: d.items.map((it, i) => (i === idx ? { ...it, ...p } : it)) } : d,
        ),
      }));

    const removePoItem = (id: string, idx: number) =>
      set((s) => ({
        purchaseOrders: s.purchaseOrders.map((d) =>
          d.id === id ? { ...d, items: d.items.filter((_, i) => i !== idx) } : d,
        ),
      }));

    const addPoSchedule = (id: string) =>
      set((s) => ({
        purchaseOrders: s.purchaseOrders.map((d) =>
          d.id === id
            ? {
                ...d,
                schedule: [
                  ...d.schedule,
                  { materialCode: s.materials[0]?.code ?? '', startDate: today(), deliveryDate: today(), scheduleQty: 1 },
                ],
              }
            : d,
        ),
      }));

    const updatePoScheduleItem = (id: string, idx: number, p: Patch<PoScheduleLine>) =>
      set((s) => ({
        purchaseOrders: s.purchaseOrders.map((d) =>
          d.id === id ? { ...d, schedule: d.schedule.map((sc, i) => (i === idx ? { ...sc, ...p } : sc)) } : d,
        ),
      }));

    const removePoSchedule = (id: string, idx: number) =>
      set((s) => ({
        purchaseOrders: s.purchaseOrders.map((d) =>
          d.id === id ? { ...d, schedule: d.schedule.filter((_, i) => i !== idx) } : d,
        ),
      }));

    const savePo = (id: string) => {
      const no = state.purchaseOrders.find((d) => d.id === id)?.no || nextDocNo('PO');
      set((s) => ({
        purchaseOrders: s.purchaseOrders.map((d) => (d.id === id ? { ...d, no, status: 'ordered' as const } : d)),
      }));
    };

    /* ---------- sales orders ---------- */
    const addSo = () => {
      const id = uid('so');
      const no = nextDocNo('SO');
      set((s) => {
        return {
          salesOrders: [
            ...s.salesOrders,
            {
              id,
              no,
              date: today(),
              customer: CUSTOMERS[0],
              status: 'draft' as const,
              items: [{ productId: s.products[0]?.id ?? 0, qty: 1 }],
            },
          ],
          expandedSoId: id,
        };
      });
    };

    const addSoItem = (id: string) =>
      set((s) => ({
        salesOrders: s.salesOrders.map((d) =>
          d.id === id ? { ...d, items: [...d.items, { productId: s.products[0]?.id ?? 0, qty: 1 }] } : d,
        ),
      }));

    const updateSoItem = (id: string, idx: number, p: Patch<SoItem>) =>
      set((s) => ({
        salesOrders: s.salesOrders.map((d) =>
          d.id === id ? { ...d, items: d.items.map((it, i) => (i === idx ? { ...it, ...p } : it)) } : d,
        ),
      }));

    const removeSoItem = (id: string, idx: number) =>
      set((s) => ({
        salesOrders: s.salesOrders.map((d) =>
          d.id === id ? { ...d, items: d.items.filter((_, i) => i !== idx) } : d,
        ),
      }));

    const submitSo = (id: string) =>
      set((s) => ({
        salesOrders: s.salesOrders.map((d) => (d.id === id ? { ...d, status: 'confirmed' as const } : d)),
      }));

    /* ---------- goods receipt ---------- */
    const selectGrPo = (poId: string) =>
      set((s) => {
        const po = s.purchaseOrders.find((p) => p.id === poId);
        return {
          grSelectedPo: po
            ? { poId, lines: po.items.map((it) => ({ materialCode: it.materialCode, ordered: it.qty, received: 0 })) }
            : null,
        };
      });

    const scanReceive = (code: string) =>
      set((s) => {
        if (!s.grSelectedPo) return {};
        const needle = code.trim().toLowerCase();
        const mat = s.materials.find(
          (m) => m.code.toLowerCase() === needle || m.name.toLowerCase() === needle,
        );
        if (!mat) return { grScanCode: '' };
        const lines = s.grSelectedPo.lines.map((l) =>
          l.materialCode === mat.code ? { ...l, received: Math.min(l.ordered, l.received + 1) } : l,
        );
        return { grSelectedPo: { ...s.grSelectedPo, lines }, grScanCode: '' };
      });

    const completeGoodsReceipt = () => {
      if (!state.grSelectedPo) return;
      const grNo = nextDocNo('GR');
      const grId = uid('gr');
      set((s) => {
        const draft = s.grSelectedPo;
        if (!draft) return {};
        const materials = s.materials.map((m) => {
          const line = draft.lines.find((l) => l.materialCode === m.code);
          return line ? { ...m, stock: m.stock + line.received } : m;
        });
        const purchaseOrders = s.purchaseOrders.map((p) =>
          p.id === draft.poId ? { ...p, status: 'received' as const } : p,
        );
        const goodsReceipts = [
          ...s.goodsReceipts,
          { id: grId, no: grNo, date: today(), poId: draft.poId, lines: draft.lines },
        ];
        const movements: Movement[] = [
          ...draft.lines
            .filter((l) => l.received > 0)
            .map((l) => {
              const mat = s.materials.find((m) => m.code === l.materialCode);
              return {
                ts: T[s.lang].justNow,
                type: 'in' as const,
                item: mat?.name ?? l.materialCode,
                qty: l.received,
                unit: mat?.unit ?? '',
              };
            }),
          ...s.movements,
        ];
        return { materials, purchaseOrders, goodsReceipts, movements, grSelectedPo: null };
      });
    };

    /* ---------- roles / features / settings ---------- */
    const toggleRolePerm = (role: RoleName, idx: number) =>
      set((s) => {
        const rp = { ...s.rolePermissions };
        rp[role] = rp[role].map((v, i) => (i === idx ? !v : v));
        return { rolePermissions: rp };
      });

    const toggleFeature = (key: FeatureKey) =>
      set((s) => ({ featureFlags: { ...s.featureFlags, [key]: !s.featureFlags[key] } }));

    const saveSettings = () =>
      requestConfirm(t.confirmSaveMsg, () =>
        set((s) => (s.settingsDraft ? { storeSettings: s.settingsDraft, settingsDraft: null } : {})),
      );

    const resetData = () =>
      set({
        products: clone(PRODUCTS),
        materials: clone(MATERIALS),
        movements: [],
        cart: {},
      });

    return {
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
    };
  }, [state, t, fmt, hasPerm, set, requestConfirm]);

  return <PosContext.Provider value={api}>{children}</PosContext.Provider>;
}

export function usePos(): PosApi {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error('usePos must be used inside <PosProvider>');
  return ctx;
}
