# Plan — Admin Users → Employees: route rename + filter toolbar

## Context

The admin user-management page is shown to HR Admins, who think in terms
of **employees** rather than the underlying `users` table. Two distinct
problems on `/admin/users`:

1. **URL/audience mismatch.** The URL says `/admin/users` but the sidebar
   label and copy already say "Employees". Aligning the URL to the
   HR-Admin mental model (`/admin/employees`) makes the route
   self-describing without renaming the DB column or backend route.
2. **No filtering UI.** With many seeded users, the list is hard to
   browse. The screenshot's empty rectangle next to the header is
   wasted space; the user wants it filled with a **search input** plus
   **Role** and **Status** dropdowns. The header text
   ("Employees / Create, edit, and manage…") is also redundant — the
   sidebar's active item already labels the page.

**Backend is already capable.** `GET /admin/users` accepts
`search`, `role_id`, and `is_active` query params today
(`asima-backend/src/users/dto/admin/query-user.dto.ts` + the SQL in
`asima-backend/src/users/persistence/repositories/user.repository.ts:38-47`,
which `ILIKE`s email/first_name/last_name/title). No backend work.

**Scope guardrails (per CLAUDE.md "don't grow features beyond the
task"):**
- Frontend URL only — backend route stays `/admin/users`.
- DB column / domain field stays `users` / `User`. We don't rename the
  TS type, the API client, or the `features/admin-users/` folder. Doing
  that would touch dozens of files for zero user-visible value.
- No URL-state persistence for filters (the codebase doesn't use that
  pattern anywhere else; adding it here would be inconsistent).

## Approach (one vertical slice)

A single feature slice — route rename + toolbar — landed as one PR. The
two changes are small, share the same files, and aren't independently
shippable (renaming the route without filters delivers a regression in
URL with no upside; adding filters under the wrong URL means a second
sidebar churn). Bundle them.

### Files changed (4 source files + 1 folder move)

| Change | File | What |
|---|---|---|
| Folder move | `asima-frontend/src/app/(app)/admin/users/` → `…/admin/employees/` | Rename folder. Only file inside is `page.tsx`. |
| Sidebar nav | `asima-frontend/src/components/layout/app-shell.tsx:55` | `href: '/admin/users'` → `'/admin/employees'`. Label stays `'Employees'`. |
| Query type | `asima-frontend/src/features/admin-users/schemas.ts:76-80` | Extend `AdminUsersQuery` with `role_id?: number` and `is_active?: boolean`. (`search` already present.) |
| Page body | `asima-frontend/src/app/(app)/admin/employees/page.tsx` | Remove header block (lines 49-54). Add `<Toolbar>` in that slot. Wire filter state into `listQuery`. |

The page-internal `<Toolbar>` is a local function component in the same
file (matches the existing `<Paginator>` pattern at lines 108-156 — no
new file).

### Page changes — concrete shape

**State** (added to `AdminUsersPageBody`):
```ts
const [search, setSearch] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');
const [roleId, setRoleId] = useState<number | ''>('');
const [isActive, setIsActive] = useState<'' | 'true' | 'false'>('');

useEffect(() => {
  const t = setTimeout(() => setDebouncedSearch(search), 300);
  return () => clearTimeout(t);
}, [search]);

// reset to page 1 whenever a filter changes
useEffect(() => { setPage(1); }, [debouncedSearch, roleId, isActive]);
```

**Query key + params:**
```ts
const listQuery = useQuery({
  queryKey: ['admin-users', 'list', page, debouncedSearch, roleId, isActive],
  queryFn: () => adminUsersApi.list({
    page,
    limit: PAGE_LIMIT,
    search: debouncedSearch || undefined,
    role_id: roleId === '' ? undefined : roleId,
    is_active: isActive === '' ? undefined : isActive === 'true',
  }),
  placeholderData: (prev) => prev,
});
```
The api-client (`src/lib/api-client.ts:154`) already strips `undefined`
values from query strings, so absent filters won't appear on the wire.

**Roles fetch for the dropdown** — reuse the existing
`adminRolesApi.list()` (already in
`src/features/admin-roles/api.ts:25`, fetches `?limit=100`):
```ts
const rolesQuery = useQuery({
  queryKey: ['admin-roles', 'list'],
  queryFn: () => adminRolesApi.list(),
  staleTime: 5 * 60 * 1000, // roles change rarely
});
```

**Layout** — replace the header block with a Toolbar that sits on the
left, and keep `Add employee` on the right:
```
┌───────────────────────────────────────────────────────────────────────┐
│ [🔍 search name/email/title]  [Role ▾]  [Status ▾]      [+ Add employee]
├───────────────────────────────────────────────────────────────────────┤
│ (existing AdminUsersTable)                                            │
└───────────────────────────────────────────────────────────────────────┘
```
- Search input: native `<input>` with the project's shared `inputCls`
  (used in `create-user-dialog.tsx:129` — copy the constant up to the
  page or inline the class string). Placeholder
  `"Search name, email, or title…"`. Leading `Search` icon from
  lucide-react matches the codebase's icon convention.
- Role select: native `<select>` (the project doesn't yet have a shadcn
  Select; native is the existing pattern in the dialogs). First option:
  `<option value="">All roles</option>`, then one `<option value={id}>`
  per role from `rolesQuery.data?.data`. Display `role.name` directly —
  the role enum names are already user-readable (e.g. `EMPLOYEE`,
  `HR_ADMIN`); a friendlier-label map is out of scope.
- Status select: native `<select>` with three options: `All statuses`,
  `Active`, `Inactive`. Maps to `is_active` true/false/undefined.

### What does NOT change

- `adminUsersApi.list()` URL — still `GET /admin/users`. Only the
  frontend route path changes.
- The folder `src/features/admin-users/` and all type names (`AdminUser`,
  `AdminUsersTable`, dialog components). Renaming these would be a
  cosmetic refactor of ~10 files with no user-visible value.
- Backend, migrations, seeds. Nothing.
- The `AdminUsersTable` component itself — columns, badges, actions all
  stay as-is.

## Verification

Manual (golden path + edge cases — per CLAUDE.md "for UI changes, use
the feature in a browser"):

1. **Route rename works:** navigate to `localhost:3001/admin/employees`
   → page renders. Old `/admin/users` returns 404 (Next.js will, since
   the folder is gone). Sidebar "Employees" item is the active link.
2. **Header is gone:** the `"Employees"` h1 and subtitle are removed.
3. **Search:** type `dan` → after ~300ms the list narrows to users
   whose name/email/title contains "dan". Clear → full list returns.
   Page resets to 1 if you were on page 2.
4. **Role filter:** select `EMPLOYEE` → only employees show. Combine
   with search → both filters AND together.
5. **Status filter:** create or update a user to inactive (via existing
   Edit dialog), then filter Status=`Inactive` → only that user shows.
   Switch to `Active` → that user disappears.
6. **Pagination still works:** with all filters cleared, paging through
   the 30+ seeded users behaves the same as before.
7. **Permission gate:** as a non-`USER:View` user, page still 403s via
   `<RequirePermission>` — unchanged.
8. **Network check (DevTools):** confirm the request URL shows only the
   active filters (e.g. `?page=1&limit=20&search=dan` — no
   `role_id=&is_active=` empties).

Automated:
- `npm run lint` and `npm run build` (Next.js typecheck) clean.
- No existing tests cover this page, so none to update. Adding a
  Playwright/unit test for the toolbar is **out of scope for this slice**
  — flag if you want it as a follow-up.

## Phases / checkpoints

This is small enough to land as one phase, but two natural checkpoints
if you want pause-points during implementation:

- **Checkpoint A** — route renamed + sidebar link updated + header
  removed. Page still functions (no filters yet, same as today minus
  the header). `npm run build` clean. Visual smoke test.
- **Checkpoint B** — toolbar wired (search + role + status). Verification
  steps 3-5 above pass.
