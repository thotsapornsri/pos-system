# Brew & Co. POS

A point-of-sale and light-ERP web app for a café/bakery: checkout, product and
raw-material inventory, production recipes (BOM), procurement (PR → PO → GR),
sales orders, dashboards, reports, and role-based access — bilingual Thai/English.

Implemented from the Claude Design project **"Web application POS system"**. The
original design file is kept under [design/](design/) for reference.

## Setting up your own Supabase project (one-time)

The app needs a real [Supabase](https://supabase.com) project for auth. Free tier is enough.

1. Create a project at supabase.com (any name/region/password).
2. Open **SQL Editor** in the Supabase dashboard, paste in and run
   [`supabase/migrations/0001_auth.sql`](supabase/migrations/0001_auth.sql), then
   [`supabase/seed.sql`](supabase/seed.sql) (seed.sql has commented steps for creating
   your first Owner account — read it before running the last statement).
3. Copy `.env.example` to `.env` and fill in your project's URL + anon key
   (**Project Settings → API** in the dashboard).

If `.env` is missing or empty, the app shows a setup screen with these same steps
instead of crashing.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173.

Other scripts: `npm run build` (typecheck + production bundle), `npm run preview`,
`npm run typecheck`.

## Signing in

Real email/password auth via Supabase — sign in with the account you created in
`supabase/seed.sql`. New staff accounts are created by the Owner directly in the
Supabase dashboard (**Authentication → Users → Add user**, then insert a matching
row in `profiles` — see the template at the bottom of `supabase/seed.sql`) until a
later phase adds an in-app invite flow.

Role permissions (`role_permissions` table, seeded to match `DEFAULT_ROLE_PERMS` in
`src/data/seed.ts`) still only gate the current in-memory catalogue/documents data —
see [Migration status](#migration-status) below.

## Migration status

Login/auth is real (Supabase Auth + a `profiles` table). Everything else —
products, materials, recipes, purchasing docs, sales, movements, role
permissions — still lives in memory in `PosContext.tsx` and resets on reload,
same as the original design prototype. Moving each of those into Supabase is
tracked as follow-on work; see `supabase/migrations/` for what's live so far.

## How it is put together

React 18 + TypeScript + Vite + Supabase (auth only, for now — see
[Migration status](#migration-status)).

```
src/
  data/seed.ts          Seed catalogue, users, vendors, documents, chart data
  i18n/translations.ts  Thai + English strings (one typed shape, `Translation`)
  store/PosContext.tsx  Single state object + every action; `usePos()` is the API
  types.ts              Domain model
  lib/                  Money formatting, CSV/PDF export, doc printing, status colours, Supabase client
  hooks/                Cart totals, print-data plumbing
  components/           Shell, sidebar, login, modals, UI primitives
  views/                One file per screen; `views/purchasing/` holds PR/PO/GR/vendor
  styles.css            Design tokens + component classes
supabase/
  migrations/           SQL to run against your Supabase project, in order
  seed.sql               Demo store row + role_permissions + first-Owner template
```

**State.** `PosProvider` holds one `PosState` object. Components read and write
through `usePos()`. Actions are plain functions on that object; there is no
reducer indirection because every action is a direct patch.

**Theming.** The accent colour is a runtime setting, so it is written to
`--accent` on the document root rather than threaded through inline styles.
Everything else is a static token in `styles.css`.

**Permissions.** `hasPerm(key)` checks the current user's role against the
editable permission matrix in Settings → Roles. Nav items, action buttons, and
whole tabs are gated on it, so toggling a permission immediately changes what
that role can see.

**Images.** `<ImageSlot>` is the real-app equivalent of the design's
`<image-slot>` element: click or drop an image file onto a logo or product
thumbnail and it is stored per-slot in `localStorage`.

## Differences from the design file

The design prototype had a few defects that were corrected while implementing it:

- **Goods receipt lines** looked materials up by `materialId`, but receipt lines
  carry `materialCode` — every line rendered a blank name. Now matched by code.
- **The GR "select a PO" dropdown** read `po.supplier`, a field purchase orders
  do not have, so every option read `PO-2001 — undefined`. It now shows the
  vendor name.
- **View titles** were read from `t.nav[view]`, which has no entry for
  Purchasing or Selling — both screens rendered a blank title bar.
- **A received line's colour** was set from a boolean (`color: {{ l.full }}`).
  Fully-received lines are now green.
- **Document numbers** came off one shared counter, so a purchase order created
  after a purchase request could be numbered `PO-1005`. Each prefix now has its
  own sequence.
- **Login** was a fake username lookup where any password worked and an
  unrecognised username silently fell back to the Owner account. Replaced with
  real Supabase email/password auth — see [Signing in](#signing-in).
