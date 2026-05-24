# Active todo — Admin Employees page

See `tasks/plan.md` for full context.

## Checkpoint A — route rename + header removal (independently verifiable)

- [ ] Move folder `src/app/(app)/admin/users/` → `src/app/(app)/admin/employees/` (rename only — sole file inside is `page.tsx`)
- [ ] Update sidebar nav link in `src/components/layout/app-shell.tsx:55`: `href: '/admin/users'` → `'/admin/employees'` (label stays `'Employees'`)
- [ ] Remove the header block (h1 "Employees" + subtitle) from `page.tsx` lines 49-54
- [ ] Grep for any other internal references to `/admin/users` and update them
- [ ] Verify: `npm run build` clean; `localhost:3001/admin/employees` renders; sidebar item active; old `/admin/users` 404s

## Checkpoint B — filter toolbar wired

- [ ] Extend `AdminUsersQuery` in `src/features/admin-users/schemas.ts` with `role_id?: number` and `is_active?: boolean`
- [ ] In `employees/page.tsx`, add state: `search`, `debouncedSearch` (300ms), `roleId`, `isActive`; reset `page` to 1 on any filter change
- [ ] Fetch roles via `adminRolesApi.list()` (existing — `features/admin-roles/api.ts:25`) with `staleTime: 5min`
- [ ] Update `listQuery`: include filters in `queryKey`, pass them as params to `adminUsersApi.list()`, leave undefined when empty
- [ ] Render `<Toolbar>` (local component in same file) in the slot the header occupied: `[search] [Role ▾] [Status ▾]` on the left, `Add employee` stays on the right
- [ ] Search input: native `<input>` + lucide `Search` icon; placeholder `"Search name, email, or title…"`
- [ ] Role select: `"All roles"` + one option per role (`role.name`, value = id)
- [ ] Status select: `All statuses` / `Active` / `Inactive` → maps to is_active true/false/undefined

## Verification (golden + edges)

- [ ] Manual: run verification steps 1-8 from `tasks/plan.md`
- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] DevTools network check: filter params absent from URL when empty
