# Frontend Architecture Hardening — 2026-06-14

**Status:** design approved, pending implementation plan
**Scope:** `asima-frontend` only (cross-references parent universal-guidelines)
**Decision:** harden the existing Feature-Sliced architecture; do NOT adopt
backend-style hexagonal layering.

## 1. Context & problem

`asima-frontend` is a Next.js App Router SPA organized as feature slices
(`app/` routes → `features/<slice>/` → `lib/`). It is well-structured, but
three things will not scale cleanly as the product grows from identity +
leave + time-correction into schedules, timesheets, and payroll:

1. **Stringly-typed query keys.** React Query keys (`['time-entries']`,
   `['admin-users', ...]`, `['approvals']`) are hand-written across ~30
   sites. Cache invalidation matches queries by string convention only — a
   typo produces a silently stale screen, not an error.
2. **No single home for server-state.** `useQuery`/`useMutation` live in
   dedicated `hooks/` (approvals, time-correction), inline in
   `app/.../page.tsx` (home, employees), and inline in **18 components**.
   The same job has three patterns; orchestration (what to invalidate) is
   re-derived per component.
3. **Rules are undocumented.** Unlike the backend, there is no
   `asima-frontend/CLAUDE.md`. The real architectural rules (dependency
   direction, the zod boundary, where data-access belongs) live only in
   contributors' heads, so new code drifts.

## 2. Current architecture (the baseline we are keeping)

```
app/                 Next.js App Router. Route groups (auth)/(app); admin/
                     + employee/ segments. Thin shells composing features.
   │ (downward deps only)
features/<slice>/    Vertical slices:
   ├─ api.ts         HTTP + zod .parse() → anti-corruption boundary.
   │                 Injectable ApiClient (testable).
   ├─ schemas.ts     zod schemas + inferred types; mirror backend domain
   │                 (snake_case end-to-end).
   ├─ hooks/         React Query wrappers (present in SOME slices today).
   ├─ actions.ts     Cross-kind dispatch (approvals → leave/time-correction).
   ├─ format.ts /    Pure feature-local helpers.
   │  datetime.ts
   └─ components/     UI: *-page.tsx, drawers, dialogs, cells.
components/          Shared cross-feature UI + shadcn primitives under ui/.
lib/                 api-client (single HTTP entry; token+refresh injected
                     at runtime by AuthProvider), query-client, env, cn, tz,
                     request-id. Never imports from features.
```

**Strengths to preserve (do not regress):**

- **Anti-corruption boundary:** every `api.ts` validates responses with zod,
  giving the frontend its own contract decoupled from raw backend JSON.
- **One-way dependency rule + dependency inversion:** `features → lib`, never
  reverse; `api-client` exposes `setAccessToken`/`setRefreshHandler` and
  `AuthProvider` is the only injector. This is the one piece of "hexagonal"
  worth having on a frontend, and it already exists.
- **Separation of concerns** where hooks exist: HTTP vs caching vs rendering.
  The refresh-mutex lives in `api-client`, not the UI.
- **Centralized permission gating:** `usePermissions()` + `require-permission`;
  permission cache invalidated on logout so grants never leak between sessions.

## 3. Decision: harden Feature-Sliced; reject hexagonal

We adopt **Feature-Sliced Design (FSD) discipline**, made explicit and
enforced. We **reject** porting the backend's domain/ports/adapters/mappers
hexagonal layering.

**Why not hexagonal (recorded so it is not re-litigated):** hexagonal exists
to isolate pure business logic from infrastructure. On a frontend, the
**backend owns the domain**, and **React Query is the infrastructure/state
layer**. Adding `domain/ → ports/ → adapters/` would mostly produce
pass-through mappers wrapping data already validated by zod — backend-level
ceremony protecting a layer with little independent logic. The two hexagonal
ideas that do pay off on a frontend (an anti-corruption boundary and
dependency inversion) are already present.

## 4. Target standard (the go-forward rules)

### Rule 1 — Canonical slice shape
```
features/<slice>/
├─ api.ts          HTTP + zod parse ONLY. No React, no caching.
├─ schemas.ts      zod schemas + types. The slice contract.
├─ keys.ts         Query-key factory (Rule 3). Only place keys are defined.
├─ hooks/          ALL React Query (Rule 2). use-x-query.ts / use-x-mutation.ts.
├─ <pure>.ts       format.ts, datetime.ts — pure, unit-tested.
├─ components/      UI only. Calls hooks; never api.ts/fetch directly.
└─ index.ts         Public API (Rule 4).
```
`api.ts` knows HTTP, `hooks/` knows caching, `components/` knows rendering.
Each layer depends only on the one below it.

### Rule 2 — All server-state in `hooks/`
Components and pages never call `api.ts` or `useQuery`/`useMutation`
directly. Every read/write is a named hook (`useApplyLeave`,
`useTimesheet`), so orchestration (invalidations, optimistic updates) is
testable, reusable, and in one place.

```ts
// features/leave/hooks/use-apply-leave.ts
export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplyLeaveInput) => leaveApi.apply(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.lists() });
      qc.invalidateQueries({ queryKey: leaveKeys.balance() });
    },
  });
}
```

### Rule 3 — Typed query-key factory per slice
Each slice owns `keys.ts`; no raw key arrays anywhere else.
```ts
// features/time-entries/keys.ts
export const timeEntryKeys = {
  all:   ['time-entries'] as const,
  lists: () => [...timeEntryKeys.all, 'list'] as const,
  list:  (page: number) => [...timeEntryKeys.lists(), page] as const,
  today: () => [...timeEntryKeys.all, 'today'] as const,
};
```
Queries use `timeEntryKeys.list(page)`; invalidation uses `timeEntryKeys.all`
(prefix-matches children). A renamed key is one type-checked edit.

### Rule 4 — Slice public API + enforced boundary
Each slice exposes an `index.ts` barrel; cross-slice imports go through it,
never into another slice's internals.
```ts
// features/leave/index.ts
export { leaveApi } from './api';
export { useApplyLeave } from './hooks/use-apply-leave';
export type { LeaveRequest } from './schemas';
```
Layer law:
```
app → features → lib                     (downward only)
feature → feature  ONLY via index.ts     (no reaching into components/, hooks/)
lib → (nothing in app/features)
```
Enforced mechanically with an ESLint `no-restricted-imports` rule (Phase 3),
not by review alone.

### Rule 5 — Documented, including the rejected option
`asima-frontend/CLAUDE.md` records all of the above plus the explicit
no-hexagonal decision and its rationale.

## 5. Phased migration plan

All five phases are in scope. Each phase ships independently, leaves the app
green (typecheck + lint + the 270-test suite + build), and is a clean
stopping point.

### Phase 0 — Write the rules down (zero code-behavior change)
- Create **`asima-frontend/CLAUDE.md`**: dependency law, canonical slice
  shape, "all server-state in `hooks/`", the zod boundary, the no-hexagonal
  decision.
- Create **`docs/universal-guidelines/frontend-architecture.md`** (parent) as
  the deeper reference, alongside `frontend-stack.md` /
  `frontend-component-blueprint.md`. Link it from the parent `CLAUDE.md`
  "Where authoritative docs live" list.
- **Risk:** none. **Verify:** docs render; links resolve.

### Phase 1 — Query-key factories (mechanical, safe, highest-risk-retiring)
- Add `keys.ts` to each slice; replace all raw key arrays at every query,
  mutation, and `invalidateQueries`/`removeQueries` site with factory calls.
- One commit per slice. Slices: time-entries, approvals, leave,
  time-correction, admin-users, admin-approvers, schedule, profile, auth
  (auth already centralizes `PERMISSIONS_QUERY_KEY` — fold into `keys.ts`).
- **Risk:** low (behavior-preserving). **Verify:** typecheck + full test
  suite green; grep shows no remaining raw key arrays outside `keys.ts`.

### Phase 2 — Data-access layer (the structural win)
- Extract inline `useQuery`/`useMutation` from the 18 components + the
  data-fetching `app/.../page.tsx` files into `hooks/use-*.ts`. Components
  call hooks only.
- One slice per commit; depends on Phase 1 (hooks consume the key factories).
- Order by churn/value: leave, time-correction, admin-users, admin-approvers,
  then the rest.
- **Risk:** medium (touches many components). Mitigated by per-slice commits
  + existing component tests. **Verify:** tests green per slice; no
  `useMutation`/`useQuery` import remains in `components/` or `app/`.

### Phase 3 — Slice public APIs + ESLint-enforced boundary
- Add `index.ts` to each slice exporting its public surface; rewrite
  cross-slice imports (e.g., `approvals/actions.ts`) to use barrels.
- Add an ESLint `no-restricted-imports` (or `import/no-internal-modules`)
  rule forbidding `@/features/*/{components,hooks,api,schemas}` deep imports
  from other slices; allow `@/features/<slice>` (the barrel) and intra-slice
  relative imports.
- **Risk:** low–medium (import churn; the lint rule may surface existing
  violations to fix). **Verify:** `lint:ci` green; deep cross-slice import
  fails lint in a scratch test.

### Phase 4 — Page slim-down (polish)
- Move remaining data logic out of `app/.../page.tsx` (notably home,
  employees) into feature hooks/components so route files are pure shells.
- **Risk:** low. **Verify:** `app/**/page.tsx` contain no `useQuery`/
  `useMutation`; tests green.

## 6. Non-goals / out of scope

- No change to the tech stack (React Query, zod, shadcn, Next App Router all
  stay — per the request to focus solely on architecture).
- No hexagonal domain/ports/adapters/mappers layer.
- No backend changes; no API contract changes.
- No new state-management library (no Redux/Zustand) — React Query + context
  remain the state model.
- No visual/UI redesign.

## 7. Verification (every phase)

`npm run lint:ci && npm run format:check && npm run typecheck && npm test &&
npm run build` must pass. Phases 1–4 are refactors: the existing 270-test
suite is the regression net; add tests only where a new hook encapsulates
non-trivial orchestration.
