# asima-frontend

Next.js (App Router) SPA for Asima. TypeScript, React Query, zod, shadcn/ui.

System-level context (cross-cutting concepts, terminology, API conventions)
lives in the parent `CLAUDE.md`. This file is **frontend-only rules**.

## Architecture: Feature-Sliced (NOT the backend's DDD layering)

The frontend is organized as vertical feature slices. We deliberately do
**not** mirror the backend's Domain-Driven Design layering (aggregates /
value objects / ports / mappers) — the backend owns the domain, and React
Query is our infrastructure/state layer.
The two ideas worth borrowing (an anti-corruption boundary and dependency
inversion) already exist: zod at `api.ts`, and token/refresh injected into
`lib/api-client`. Do not add `domain/ → ports/ → adapters/` folders.

### Dependency law (one direction only)

```
app/        → Next.js routes. Thin shells that compose feature components.
features/   → vertical slices (below). May import lib/ and other slices'
              public API (their index.ts) — never another slice's internals.
lib/        → cross-cutting primitives. NEVER imports from app/ or features/.
```

A slice may import another slice ONLY through its `index.ts` barrel. Reaching
into `@/features/<other>/components|hooks|api|schemas` is forbidden and fails
lint (`no-restricted-imports`).

### Canonical slice shape

```
features/<slice>/
├─ api.ts        HTTP + zod .parse() ONLY. No React, no caching. Injectable ApiClient.
├─ schemas.ts    zod schemas + inferred types. The slice's contract (snake_case).
├─ keys.ts       Query-key factory. The ONLY place this slice's cache keys are defined.
├─ hooks/        ALL React Query. use-<x>-query.ts / use-<x>-mutation.ts.
├─ <pure>.ts     format.ts, datetime.ts — pure helpers, unit-tested.
├─ components/    UI only. Calls hooks; never api.ts or fetch directly.
└─ index.ts       Public API — what other slices may import.
```

`api.ts` knows HTTP, `hooks/` knows caching, `components/` knows rendering.

### Rules

1. **Every API response is validated with zod** at `api.ts` (`Schema.parse`).
   Components consume validated types, never raw JSON.
2. **All server-state lives in `hooks/`.** Components and `app/.../page.tsx`
   never call `api.ts`, `useQuery`, or `useMutation` directly — they call a
   named hook (`useApplyLeave`, `useTimesheet`). Orchestration (which queries
   to invalidate, optimistic updates) lives in the hook, in one place.
3. **Cache keys come from `keys.ts` factories** — never inline arrays. Queries
   use the leaf (`leaveKeys.list(page)`); invalidation uses a parent
   (`leaveKeys.all`) to prefix-match. A renamed key is one type-checked edit.
4. **Cross-slice imports go through `index.ts`.** Enforced by ESLint.
5. **`lib/api-client` is feature-agnostic.** Token + refresh handler are
   injected by `AuthProvider` (the only injector). Never import a feature
   from `lib/`.

### State model

React Query for server-state; React context for session/auth
(`AuthProvider`). No Redux/Zustand — do not add a global store without an ADR.

## Documentation lives in the parent repo

All **committed documentation** — plan snapshots, ADRs, and guidelines —
lives ONLY in the parent repo under `asima-parent/docs/`, referenced from
here as `../docs/`. **Do not create a `docs/` directory in this repo.**

- Plan snapshots → `../docs/plans/YYYY-MM-DD-<slug>.md`
- ADRs → `../docs/adr/`
- Guidelines → `../docs/universal-guidelines/`

The only doc-like files that stay local are the **gitignored** `tasks/`
working files (`tasks/plan.md`, `tasks/todo.md`) — a private workspace, not
documentation, never committed.

## Where to look first

- `../docs/plans/` — committed plan snapshots (audit trail).
- `tasks/plan.md` + `tasks/todo.md` — the active working plan + checklist (gitignored).
- `../docs/universal-guidelines/frontend-architecture.md` — the deeper reference.
- `../docs/universal-guidelines/frontend-stack.md` — authoritative stack table.
- `../docs/universal-guidelines/frontend-component-blueprint.md` — component rules.
