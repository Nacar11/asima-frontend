# Spec: `asima-frontend` v0

Phase-1 specification for the frontend companion to `asima-backend`. This
document is the source of truth between human and agent for what we're
building, why, and how we'll know it's done. Phase 2 (Plan) and Phase 3
(Tasks) follow from this — do not skip ahead.

---

## 1. Objective

Build the v0 **employee self-service web app** for asima — an
Ashima-inspired Employee Time Management System. Single-tenant, internal
HR-style tool, sibling to `asima-backend` under the same parent repo.

### User stories

1. **As an employee**, I can log in with my credentials and stay logged in
   across refreshes (until my refresh token expires).
2. **As an employee**, I can see my profile (name, title, role) and the
   weekly schedule I'm expected to follow.
3. **As an employee**, I can punch in / punch out with a single button
   and see today's segments without reloading.
4. **As an employee**, I can review my past time entries (paginated, with
   date filters).
5. **As an employee**, I can change my password (requires current password).
6. **As an unauthenticated user**, the only thing I can reach is `/login`
   — every other route bounces me there.

Admin surfaces (managing other users, roles, schedules) are deliberately
**out of v0** — they ship in v1 once the self-service path is proven.
See §10 for what's deferred.

### Success criteria

- A fresh clone runs `npm install && npm run dev` and serves the login
  page at `http://localhost:3001` against a local `asima-backend` at
  `http://localhost:3000`.
- An employee with the seeded `Asima@1234` password can log in, see
  `/me`, punch in, punch out, and see today's segment — without page
  reloads beyond the initial login.
- A 401 from any API call triggers a single refresh attempt; if refresh
  fails, the user is bounced to `/login` with a "session expired" toast.
- The Lighthouse performance score is **≥ 90** on the production build
  for the `/me/time-entries` page on a desktop profile.
- `npm run test` (unit) and `npm run test:e2e` (Playwright) are both
  green in CI.

---

## 2. Tech stack (locked-in for v0)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) | Modern default; server components for static shells, client components for interactive screens. |
| Language | TypeScript 5+ (strict) | Matches backend; runtime-validated at every API boundary via Zod. |
| Styling | **Tailwind CSS 3.4+** | De facto Next.js standard; pairs with shadcn/ui. |
| Components | **shadcn/ui + Radix UI** | Components copied INTO the repo — you own the source. Accessibility-first (Radix). Matches the "owned code, abstraction only when needed" ethos of the backend. |
| Icons | `lucide-react` | shadcn's default; one icon set repo-wide. |
| Data fetching | **TanStack Query v5** | Caching, refetch, mutation invalidation, refresh interceptor pattern, devtools. |
| HTTP client | `fetch` wrapped in a thin `apiClient` | No axios/ky — modern fetch + AbortController is enough. |
| Forms | **React Hook Form + Zod resolver** | Type-safe, performant; Zod schemas double as wire-validation. |
| Date / time | **`date-fns`** | Tree-shakeable. No moment.js. |
| Toasts | `sonner` (shadcn integration) | Tiny, accessible, declarative. |
| Auth state | React Context + TanStack Query for `/auth/me` | One source of truth for "who am I." |
| Token storage | **Access in memory; refresh in `localStorage`** | v0 trade-off; v1 follow-up migrates to httpOnly cookies (already on the backend roadmap). |
| Unit testing | **Vitest + React Testing Library** | Faster than Jest; first-class TS. |
| E2E testing | **Playwright** | Industry standard; runs the real auth round-trip. |
| Linting | ESLint + Prettier (next/core-web-vitals config) | Same convention as Next.js defaults. |
| Package manager | **npm** | Matches backend; one tool less to learn. |
| Node version | `>=20` (pinned via `engines`) | Matches backend. |

### Versions to pin in `package.json`

```json
{
  "engines": { "node": ">=20" },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-query-devtools": "^5.0.0",
    "react-hook-form": "^7.51.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.4.0",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.400.0",
    "sonner": "^1.5.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "@playwright/test": "^1.45.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^24.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.3.0"
  }
}
```

---

## 3. Commands

```bash
# Development
npm run dev              # next dev — http://localhost:3001 (port intentionally different from backend)
npm run build            # next build
npm run start            # next start (production)

# Quality gates
npm run lint             # eslint --fix
npm run format           # prettier --write
npm run typecheck        # tsc --noEmit

# Tests
npm run test             # vitest run
npm run test:watch       # vitest --watch
npm run test:e2e         # playwright test
npm run test:e2e:ui      # playwright test --ui (debug)

# shadcn/ui component generation
npx shadcn@latest add button card input dialog form
```

### Environment

| Var | Required | Default | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | yes | `http://localhost:3000/api/v1` | Backend mount point |
| `NEXT_PUBLIC_APP_NAME` | no | `asima` | UI display name |

Anything secret stays out of `NEXT_PUBLIC_*` — there is no v0 frontend
secret beyond the API URL, which is non-sensitive.

---

## 4. Project structure

```
asima-frontend/
├── public/                    # static assets (favicon, og image)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # route group — unauthenticated
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx     # centered card layout
│   │   ├── (app)/             # route group — authenticated
│   │   │   ├── layout.tsx     # nav, auth guard
│   │   │   ├── me/
│   │   │   │   ├── page.tsx         # profile
│   │   │   │   ├── password/page.tsx
│   │   │   │   ├── schedule/page.tsx
│   │   │   │   └── time-entries/
│   │   │   │       └── page.tsx     # punch + history
│   │   │   └── dashboard/page.tsx
│   │   ├── api/                     # NO server routes in v0
│   │   ├── layout.tsx               # root, providers, fonts
│   │   ├── not-found.tsx
│   │   └── globals.css              # Tailwind directives only
│   │
│   ├── features/              # vertical slices — mirrors backend modules
│   │   ├── auth/
│   │   │   ├── api.ts               # /auth/* endpoint calls
│   │   │   ├── schemas.ts           # Zod: LoginInput, AuthUser, etc.
│   │   │   ├── auth-provider.tsx    # context + token state; wires apiClient
│   │   │   ├── use-auth.ts          # hook
│   │   │   └── components/
│   │   │       └── login-form.tsx
│   │   ├── users/
│   │   │   ├── api.ts               # GET /users/me, PATCH /users/me, GET /users/me/permissions, PATCH /users/me/password
│   │   │   ├── schemas.ts
│   │   │   ├── hooks.ts             # useMe, useMyPermissions, useUpdateMe, useChangeMyPassword
│   │   │   └── components/
│   │   │       ├── profile-card.tsx
│   │   │       └── change-password-form.tsx
│   │   ├── time-entries/
│   │   │   ├── api.ts               # POST punch, GET range, GET today
│   │   │   ├── schemas.ts
│   │   │   ├── hooks.ts             # usePunch, useMyTimeEntries, useToday
│   │   │   └── components/
│   │   │       ├── punch-button.tsx
│   │   │       ├── today-segments.tsx
│   │   │       └── time-entries-table.tsx
│   │   └── work-schedules/
│   │       ├── api.ts               # GET /users/me/work-schedule
│   │       ├── schemas.ts
│   │       ├── hooks.ts             # useMySchedule
│   │       └── components/
│   │           └── weekly-schedule.tsx
│   │
│   ├── lib/                   # cross-feature primitives only
│   │   ├── api-client.ts            # fetch wrapper; settable access-token + refresh-handler
│   │   ├── query-client.ts          # configured TanStack QueryClient
│   │   ├── env.ts                   # parsed NEXT_PUBLIC_* with Zod
│   │   ├── format.ts                # date / time formatters (Asia/Manila aware)
│   │   ├── tz.ts                    # resolveDisplayTz(): prod → "Asia/Manila", dev → browser-local
│   │   ├── cn.ts                    # clsx + tailwind-merge helper
│   │   └── request-id.ts            # generate / propagate X-Request-ID
│   │
│   ├── components/            # generic shared UI (NOT feature-specific)
│   │   ├── ui/                      # shadcn-generated primitives (Button, Card, Input, Form, ...)
│   │   ├── layout/                  # AppShell, Sidebar, TopBar, ProtectedRoute
│   │   └── feedback/                # Toaster, EmptyState, ErrorBoundary
│   │
│   ├── styles/
│   │   └── (only globals.css; everything else is Tailwind classes)
│   │
│   └── types/                 # types that are NOT owned by a single feature
│       └── api.ts                   # PaginatedResponse<T>, ApiError shape
│
├── tests/
│   ├── unit/                  # vitest — mirrors src/ layout
│   └── e2e/                   # playwright
│       ├── auth.spec.ts
│       ├── punch.spec.ts
│       └── fixtures/
│           └── api-mock.ts          # backend stub for offline e2e
│
├── docker/                    # parity with backend
│   ├── Dockerfile
│   └── entrypoint.sh
├── .dockerignore
├── docker-compose.yml         # builds against ../asima-backend's api
├── .github/workflows/ci.yml
├── .env.example
├── .gitignore
├── components.json            # shadcn/ui config
├── eslint.config.js
├── next.config.ts
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── README.md
├── SPEC.md                    # this file
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

### Layout rules

1. **Feature folders** (`src/features/<name>/`) own ALL feature-specific
   logic — API calls, hooks, schemas, components. Mirrors backend
   modules. Nothing feature-specific lives in `src/components/`.
2. **`src/components/ui/`** is reserved for **shadcn-generated** primitives.
   Don't write hand-rolled components here. Custom shared components go
   in `src/components/layout/` or `src/components/feedback/`.
3. **`src/lib/`** is cross-feature primitives ONLY. If two features need
   the same thing, it goes here. If only one feature uses it, it stays
   in that feature folder.
4. **App Router groups** `(auth)` and `(app)` split the auth-required
   surface from the public surface. The `(app)/layout.tsx` is the guard
   point — server-side check + client redirect.
5. **Tests mirror `src/`** under `tests/unit/`. E2E specs live in
   `tests/e2e/` and reach the running app, not the React tree.
6. **Page-scoped one-offs**: components that live on a single page (and
   shouldn't be reused) go in `app/(app)/<route>/_components/`. The
   underscore prefix is the Next.js convention for non-route folders.
   The moment a second page imports it, it graduates to
   `features/<name>/components/`.

### Dependency direction — non-negotiable

```
   app/  ─────►  features/<name>/  ─────►  lib/
                       ▲                     │
                       └─────────────────────┘  ❌ lib MUST NOT import from features
```

`lib/` is the lowest layer. Anything that needs feature-specific behavior
(like the 401 refresh handler in `apiClient`) is **injected at runtime**
by `AuthProvider`, not imported as a static dependency. See §6 for the
apiClient wiring pattern.

---

## 5. Code style

### TypeScript

- **`strict: true`**, **`noUncheckedIndexedAccess: true`**, **`noImplicitOverride: true`**.
- **`@/` path alias** resolves to `src/` (configured in `tsconfig.json` and `next.config.ts`).
- Prefer `type` for objects, `interface` only when extension is needed.

### Snake_case at the API boundary — non-negotiable

The backend ships snake_case end-to-end (`created_at`, `password_hash`,
`is_active`). The frontend does **not** add a camelCase translation
layer. Domain types, Zod schemas, and component props all use the same
shape as the wire payload.

```ts
// ✅ Correct — matches the backend wire contract
export const TimeEntrySchema = z.object({
  id: z.number(),
  employee_id: z.number(),
  work_date: z.string(),           // YYYY-MM-DD
  time_in: z.string().datetime(),
  time_out: z.string().datetime().nullable(),
  status: z.enum(['open', 'confirmed']),
  source: z.enum(['manual', 'biometric', 'admin']),
  created_at: z.string().datetime(),
});
export type TimeEntry = z.infer<typeof TimeEntrySchema>;

// ❌ Wrong — introduces a translation layer we don't want
export type TimeEntry = { id: number; employeeId: number; workDate: string; ... };
```

### Example: feature API module

One real snippet beats three paragraphs. This is the target style:

```ts
// src/features/time-entries/api.ts
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { PaginatedResponseSchema } from '@/types/api';
import { TimeEntrySchema, type TimeEntry } from './schemas';

const TimeEntriesListSchema = PaginatedResponseSchema(TimeEntrySchema);

export const timeEntriesApi = {
  punch: () =>
    apiClient
      .post('/users/me/time-entries/punch')
      .then((r) => TimeEntrySchema.parse(r)),

  listMine: (params: { from?: string; to?: string; page?: number; limit?: number }) =>
    apiClient
      .get('/users/me/time-entries', { params })
      .then((r) => TimeEntriesListSchema.parse(r)),

  today: () =>
    apiClient
      .get('/users/me/time-entries/today')
      .then((r) => TimeEntriesListSchema.parse(r)),
};
```

### Example: hook layer

```ts
// src/features/time-entries/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi } from './api';

export const timeEntryKeys = {
  all: ['time-entries'] as const,
  today: () => [...timeEntryKeys.all, 'today'] as const,
  list: (filters: { from?: string; to?: string; page?: number }) =>
    [...timeEntryKeys.all, 'list', filters] as const,
};

export function useToday() {
  return useQuery({
    queryKey: timeEntryKeys.today(),
    queryFn: timeEntriesApi.today,
    staleTime: 30_000,
  });
}

export function usePunch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: timeEntriesApi.punch,
    onSuccess: () => qc.invalidateQueries({ queryKey: timeEntryKeys.all }),
  });
}
```

### Component conventions

- **Server components by default**; add `'use client'` only when the
  component needs `useState`, `useEffect`, `useQuery`, or DOM events.
- **One component per file**, file named in `kebab-case`, component
  exported as named `PascalCase`.
- **Props typed inline** unless reused — then put the type next to the
  component, not in a separate `types.ts`.
- **No prop-drilling past two levels** — reach for Context (auth, theme)
  or composition (children pattern).

### Form pattern (RHF + Zod)

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const ChangePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(128),
});
type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordInput>({ resolver: zodResolver(ChangePasswordSchema) });
  // ...
}
```

### Naming

- **Files**: `kebab-case.tsx` / `kebab-case.ts`.
- **Components**: `PascalCase`.
- **Hooks**: `useThing`.
- **Boolean props**: prefix with `is_` / `has_` / `should_` to match
  the snake_case wire contract.

---

## 5b. Branding & theme

**Look**: high-contrast monochrome — black chrome on a white canvas.

| Surface | Color | Tailwind token |
|---|---|---|
| Top navbar / sidebar / app chrome | Black `#0a0a0a` | `bg-neutral-950` |
| Content area / cards / forms | White `#ffffff` | `bg-white` |
| Primary action button | Black on white | `bg-neutral-950 text-white` |
| Secondary / outline | White with black border | `border-neutral-950 text-neutral-950` |
| Body text on white | `#0a0a0a` | `text-neutral-950` |
| Muted text | `#737373` | `text-neutral-500` |
| Borders / dividers | `#e5e5e5` | `border-neutral-200` |
| Destructive (delete confirms, errors) | Red 600 | `bg-red-600 text-white` |
| Success (punch confirmation, toasts) | Green 600 | accent only — keep the palette monochrome |

### How this maps to shadcn theme tokens

shadcn drives all primitives off CSS variables in `globals.css`. The v0
theme overrides:

```css
:root {
  --background: 0 0% 100%;            /* white */
  --foreground: 0 0% 4%;              /* near-black */
  --primary: 0 0% 4%;                 /* black */
  --primary-foreground: 0 0% 100%;    /* white */
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;
  --border: 0 0% 90%;
  --input: 0 0% 90%;
  --ring: 0 0% 4%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
}
```

No `.dark` block in v0 — dark mode is a v1 follow-up (§11).

### Layout convention

- **Navbar** (top): black, fixed, full-width, white text, contains app
  name + user menu (avatar + logout).
- **Content area**: white, max-width 1280px centered, generous padding
  (`p-6 md:p-10`).
- **Cards on content**: white with `border-neutral-200`, no fill — the
  border alone separates them from the background.
- **Tables**: zebra striping with `bg-neutral-50` on odd rows; black
  text throughout.

### Typography

- **Display / nav**: `font-sans` (Inter via `next/font/google`), tracking-tight, weight 600.
- **Body**: Inter regular, leading-relaxed.
- **Monospace** (time entries, IDs, timestamps): `font-mono` (JetBrains Mono via `next/font/google`).

Fonts are loaded via `next/font` — zero FOUT, no extra request, embeds at build time.

---

## 6. Auth contract & refresh interceptor

The backend ships:

- `POST /auth/login` → `{ access_token, refresh_token, token_expires_in, user }`
- `GET /auth/me` (Bearer access)
- `POST /auth/refresh` (Bearer refresh) → fresh `{ access_token, refresh_token }` pair (rotation)
- `POST /auth/logout` (Bearer access) → 204, stateless no-op
- `GET /users/me/permissions` → `{ permissions: string[] }`

### Frontend storage (v0)

- **Access token**: in-memory only (`AuthProvider` state). Lost on tab
  close — that's fine because refresh rebuilds it.
- **Refresh token**: `localStorage` under key `asima:refresh_token`.
  This is the documented v0 trade-off; v1 migrates to httpOnly cookies
  per backend ADR roadmap.
- On app boot (`AuthProvider`), if `localStorage` has a refresh token,
  immediately call `/auth/refresh` to get a fresh access token AND a
  rotated refresh token. Store the new refresh token.

### Logout is stateless — be honest about the implication

`POST /auth/logout` is a no-op server-side in v0 (no sessions table).
The frontend logout flow:

1. Clear access token from memory.
2. Remove refresh token from `localStorage`.
3. Call `POST /auth/logout` (mostly for symmetry; backend just returns 204).
4. Redirect to `/login`.

**The implication you must explain to security-conscious reviewers**:
if the refresh token was XSS-exfiltrated *before* logout, the attacker
can still use it for the remainder of its 7-day expiry — logout does
not revoke it server-side. True revocation lands with the v1 sessions
table.

### How `apiClient` knows about tokens (resolves the lib/ → features/ violation)

`apiClient` is a class in `lib/` with **settable handlers**, not a static
dependency on `features/auth/`. `AuthProvider` constructs the closures
and registers them at mount:

```ts
// lib/api-client.ts (cross-feature primitive — no auth imports)
class ApiClient {
  private accessToken: string | null = null;
  private refreshHandler: (() => Promise<string>) | null = null;
  private refreshInFlight: Promise<string> | null = null;

  setAccessToken(token: string | null) { this.accessToken = token; }
  setRefreshHandler(fn: () => Promise<string>) { this.refreshHandler = fn; }

  async request(...) {
    // attach Authorization: Bearer <accessToken>
    // if 401:
    //   if refreshInFlight, await it
    //   else refreshInFlight = this.refreshHandler!()
    //   retry once with new token; if it still fails, throw
  }
}
export const apiClient = new ApiClient();

// features/auth/auth-provider.tsx (depends on lib, NOT the other way)
useEffect(() => {
  apiClient.setAccessToken(accessToken);
  apiClient.setRefreshHandler(async () => {
    const { access_token, refresh_token } = await authApi.refresh(localRefreshToken);
    setAccessToken(access_token);
    localStorage.setItem('asima:refresh_token', refresh_token);
    return access_token;
  });
}, [accessToken]);
```

This keeps `lib/api-client.ts` testable in isolation (mock the handler)
and respects the dependency-direction rule. **The single refresh mutex
lives entirely inside `apiClient` — `features/auth` doesn't need to
know about it.**

### The 401 refresh interceptor

This is the single most important piece of plumbing. Every `apiClient`
call goes through this guard:

```
request                  → succeeds                        → return
        ↘
         → 401            → refresh in flight? → wait for it → retry
                                          ↓ no in-flight
                                          → start /auth/refresh
                                          → success: update tokens, retry original
                                          → fail:    logout, redirect /login?reason=expired
```

The **refresh mutex** ensures that 10 concurrent requests all hitting
401 only fire ONE `/auth/refresh` — the other 9 await the same promise.
This is explicitly called out in the backend's `CLAUDE.md` v1 follow-ups
as a frontend concern.

### Permission-driven UI gating

The backend exposes `GET /users/me/permissions` as a **flat string
array**. UI gating reads from there, never from `role.permissions`.

```tsx
const { data } = useMyPermissions();
const canSeeAdminLink = data?.permissions.includes('USER:View');
```

For v0 (self-service only) there are very few gates. They become useful
when v1 admin surfaces ship.

---

## 7. Testing strategy

| Level | Tool | Where | What it covers |
|---|---|---|---|
| Unit | Vitest + RTL | `tests/unit/**` mirroring `src/` | Pure logic (hooks, formatters, Zod schemas, reducer-style state). Components with non-trivial logic. |
| Integration | Vitest + RTL + MSW | `tests/unit/**/*.integration.spec.tsx` | Feature flows with mocked HTTP (login form → submit → success). |
| E2E | Playwright | `tests/e2e/**` | Real backend (or stubbed fixtures): login → punch → punch → history visible. |

### Coverage targets

- **Lib helpers**: 100% line coverage (small, pure, easy).
- **Feature hooks / api modules**: 80%+ line coverage.
- **Components**: behavioral tests only — no snapshot abuse. If a
  component has no logic worth testing, don't test it.
- **E2E**: every happy-path user story from §1 is exercised by at
  least one spec.

### What we DON'T test

- Third-party library behavior (TanStack Query internals, RHF state).
- Tailwind class application — that's a Tailwind concern.
- Pure presentational components with no branching.

---

## 8. Boundaries

### Always
- Run `npm run lint && npm run typecheck && npm run test` before opening a PR.
- Keep snake_case end-to-end at the API boundary.
- Parse every API response with its Zod schema — never trust the wire.
- Propagate `X-Request-ID` from server-side fetches (when SSR'd) so
  backend logs correlate.
- Use the shared `apiClient` for every backend call — never call `fetch`
  directly. The refresh interceptor only protects `apiClient`.
- Generate UI primitives via `npx shadcn@latest add <component>`. Don't
  hand-write components into `src/components/ui/`.
- Configure security headers via `next.config.ts` `headers()` — CSP
  (no `unsafe-inline` / `unsafe-eval`), `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`.
- Run `npm audit` in CI (warn on moderate, fail on high+).
- Use `next/image` for non-trivial images and `next/font` for all fonts.
- Render timestamps via `formatInTz()` from `lib/format.ts` — never call
  `toLocaleString()` directly (see §11a).
- Run `npm run dev` and verify the change in a browser before saying
  "done" on UI work.

### Ask first
- Adding any new dependency (the `package.json` list in §2 is the
  baseline; additions need a one-line justification).
- Changing the API contract the backend expects (snake_case shape,
  token storage strategy, refresh interceptor design).
- Adding a server route under `src/app/api/` — v0 is intentionally
  client-side only.
- Adding global state beyond React Context + TanStack Query
  (no Redux, no Zustand in v0 without justification).
- Touching `components.json` or the shadcn theme variables.

### Never
- Commit secrets or real `.env` files.
- Edit shadcn-generated primitives in `src/components/ui/` to add
  feature logic — extend them via composition in feature components.
- Introduce a camelCase translation layer between API and UI.
- Use `next/cache` or `revalidatePath` in v0 — we're a SPA-style auth'd
  app; caching is TanStack Query's job.
- Skip the refresh interceptor by calling `fetch` directly.
- Add `unsafe-inline` / `unsafe-eval` to CSP without ADR.
- Disable strict mode in `tsconfig.json`.

---

## 9. Success criteria (testable, gated)

### Phase 0 — Walking skeleton
- [ ] `next dev` boots on port 3001.
- [ ] Tailwind utilities work (sanity check).
- [ ] `apiClient` calls `${API_BASE_URL}/health` and renders the JSON.
- [ ] CI workflow green on a throwaway PR.

### Phase 1 — Auth round-trip
- [ ] `/login` form with RHF + Zod.
- [ ] Successful login stores tokens, redirects to `/dashboard`.
- [ ] `/dashboard` is gated — unauthenticated user lands at `/login`.
- [ ] `AuthProvider` calls `/auth/refresh` on boot when refresh token
      exists.
- [ ] 401 from any `apiClient` call triggers refresh-then-retry.
- [ ] Logout clears tokens and redirects to `/login`.

### Phase 2 — Self-service screens
- [ ] `/me` shows profile from `GET /users/me` with role + permissions
      visible.
- [ ] `/me/password` change form, with current-password verification.
- [ ] `/me/schedule` shows the weekly schedule from
      `GET /users/me/work-schedule` ordered Sun..Sat.
- [ ] `/me/time-entries` has a punch button that toggles open/closed
      via `POST /users/me/time-entries/punch`. No confirmation modal —
      success toast within 500ms.
- [ ] Today's segments list updates after each punch (TanStack Query
      invalidation).
- [ ] History table paginates against `GET /users/me/time-entries`
      with date-range filter.
- [ ] All timestamps render via `formatInTz()` — verifiable by setting
      `NODE_ENV=production` locally and watching dates flip to PHT.
- [ ] Login throttle 429 surfaces a live countdown (§11b).

### Phase 3 — Production readiness
- [ ] Multi-stage Dockerfile + `entrypoint.sh` using `output: 'standalone'`.
- [ ] `docker-compose.yml` extended with `asima-web` service alongside
      `asima-postgres` and `asima-api`, with healthchecks on all three.
- [ ] Vercel deploy succeeds; preview URL renders the login page.
- [ ] Backend `.env.example` updated with frontend origins.
- [ ] Security headers configured in `next.config.ts` (CSP, X-Frame-Options).
- [ ] Lighthouse ≥ 90 (mobile, prod build, cold cache) on `/me/time-entries`.
- [ ] README walks a new contributor from clone to running locally
      in < 5 min.

---

## 10. Out of scope for v0 (v1 follow-ups)

Don't introduce these without an ADR:

- **Admin surfaces**: `/admin/users`, `/admin/roles`, `/admin/permissions`,
  `/admin/time-entries`, `/admin/work-schedules`. The backend exposes
  them; the frontend ships them in v1.
- **Dark mode toggle**: shadcn's CSS variables are dark-mode ready; we
  ship light only for v0. v1 follow-up is a 1-day task.
- **i18n**: English only.
- **Server components for data fetching**: All API calls go through
  TanStack Query on the client in v0. Server-rendered data is a v1
  optimization once we know what's slow.
- **Notifications / real-time presence**: WebSocket hookup, "who's
  clocked in" widget — backend doesn't expose these either yet.
- **Mobile app**: web is responsive; native is far-future.
- **Offline support**: PWA + service-worker is v1+ depending on
  whether employees actually need offline punching.
- **Cookie-based auth storage**: paired with the backend's v1 follow-up
  (split-storage cookies + sessions table).

---

## 11. Decision log (resolved open questions)

These were Phase-1 open questions; all six are now locked in for v0.

### 11a. Timezone — `Asia/Manila` in production, browser-local in dev

Backend stores everything in UTC (`timestamptz` columns). The frontend
**displays** times in a fixed company timezone so all employees agree on
what "today" means regardless of where they're located.

| Environment | Display timezone | How |
|---|---|---|
| Production | `Asia/Manila` (UTC+08) | Hard-coded in `lib/tz.ts` |
| Dev / `NODE_ENV !== 'production'` | Browser-local | `Intl.DateTimeFormat().resolvedOptions().timeZone` |

```ts
// lib/tz.ts
const COMPANY_TZ = 'Asia/Manila';
export function resolveDisplayTz(): string {
  if (process.env.NODE_ENV === 'production') return COMPANY_TZ;
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// lib/format.ts — every component renders via this, NEVER toLocaleString() directly
export function formatInTz(d: Date | string, opts: Intl.DateTimeFormatOptions = {}) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: resolveDisplayTz(),
    ...opts,
  }).format(date);
}
```

**Why localhost falls back to browser-local**: dev environments may run
anywhere (Vercel preview from any timezone, dev laptop on the road). The
server's UTC clock + browser-local rendering is unambiguous in dev. In
production every user sees the same Manila-anchored display.

**Rule**: never call `toLocaleString()` / `Date.prototype.toString()` /
`date-fns.format(d)` (which uses local) directly. Always go through
`formatInTz()` so we have one place to flip the timezone for v1.

### 11b. Login throttle UX — countdown timer

Backend throttles `POST /auth/login` at **10/min per IP** (returns 429).
Frontend behavior:

- On 429, parse `Retry-After` header if present (NestJS throttler ships
  it). Fall back to a 60-second default.
- Disable the submit button.
- Render a live countdown in the form area:
  `Too many attempts. Try again in 0:42`.
- Tick down once per second using a single `setInterval`.
- When the countdown reaches zero, re-enable the button and clear the message.

This communicates *why* the form is locked instead of leaving the user
hammering an unresponsive submit.

### 11c. Punch confirmation — instant, no modal

`POST /users/me/time-entries/punch` fires **immediately** on button
click. No "are you sure?" dialog. The button shows a transient loading
spinner while the request is in flight (typically < 200ms on a healthy
backend), then a brief success toast: `Punched in at 09:03 AM` or
`Punched out at 5:48 PM`.

Rationale: this is a high-frequency action (twice per day per employee,
minimum). Modal friction destroys the UX without preventing a class of
real mistakes — if someone fat-fingers, they immediately re-punch and
the toggle endpoint closes the just-opened segment. The history table
shows the malformed minute-long entry as evidence.

For destructive admin actions later (delete user, delete role), modals
DO apply — but punch is not destructive.

---

## 11d. Deployment — Docker (parity) + Vercel (preview / hosting)

Both targets are first-class.

### Docker (matches backend, primary prod path)

- Multi-stage `docker/Dockerfile` mirrors backend's shape — Node 20-alpine
  builder + slim runner running `node server.js` (Next.js standalone
  output).
- `docker/entrypoint.sh` is trivial (no migrations); just `exec node server.js`.
- `docker-compose.yml` adds `asima-web` service alongside backend's
  `asima-api` + `asima-postgres`, with `depends_on: { asima-api: service_healthy }`.
- Use Next's `output: 'standalone'` build mode — produces a ~30 MB
  self-contained server, image lands under 250 MB.

### Vercel (preview + alternative prod)

- Native Next.js host — zero-config for the app itself.
- Each PR gets a unique preview URL: `https://asima-frontend-git-<branch>-<team>.vercel.app`.
- Production branch → `https://asima.your-company.com` (custom domain).
- Environment variables set per environment in Vercel project settings:
  - Production: `NEXT_PUBLIC_API_BASE_URL=https://api.asima.your-company.com/api/v1`
  - Preview: `NEXT_PUBLIC_API_BASE_URL=https://api-staging.asima.your-company.com/api/v1`
- Vercel's edge cache is disabled for everything under `/me/*` and
  `/api/*` (auth'd surface — never cache).

### CORS implications (the v0 work the BACKEND needs)

The frontend serves on a different origin than the backend in every
environment, so the backend's `CORS_ALLOWED_ORIGINS` env must include
every frontend origin we run from. Required values:

| Environment | Backend `CORS_ALLOWED_ORIGINS` includes |
|---|---|
| Local dev | `http://localhost:3001` |
| Vercel previews | `https://*.vercel.app` (regex / explicit allowlist via comma list) |
| Vercel production | `https://asima.your-company.com` |

**Action item for the backend** (before frontend ships): update
`.env.example` and prod `.env` to add the new origins. The backend's
`main.ts` already reads `corsRaw.split(',')` so multi-value is supported.

**Allow-credentials caveat**: when v1 migrates to cookie auth, the
backend MUST set `Access-Control-Allow-Credentials: true` AND echo the
specific origin (no wildcard). Code is already correct; just be aware
this matters once cookies are in play.

---

## 11e. Resolved questions — quick reference

| # | Question | Decision |
|---|---|---|
| 1 | Deployment target | **Docker + Vercel** (both first-class) |
| 2 | CORS | Backend must allow `localhost:3001`, Vercel preview URLs, prod domain (see §11d) |
| 3 | Branding | **Black chrome on white canvas** (see §5b) — Inter + JetBrains Mono via `next/font` |
| 4 | Login throttle UX | **Countdown timer** parsed from `Retry-After`, 60s fallback |
| 5 | Punch confirmation | **Instant**, no modal — toast confirms |
| 6 | Timezone | **`Asia/Manila` in prod, browser-local in dev** — central helper in `lib/tz.ts` |

---

## 12. Phase 2 preview (Plan)

Once this spec is approved, the implementation plan will sequence:

1. **Walking skeleton** — Next.js scaffold, Tailwind, shadcn init,
   `apiClient` against `/health`, CI workflow.
2. **Auth foundation** — `AuthProvider`, login form, refresh
   interceptor, route group guards, logout.
3. **Self-service slice** — `/me` profile + permissions, then
   `/me/schedule`, then `/me/time-entries` (punch + history).
4. **Password change** + edge cases (throttling UX, "session expired").
5. **Production readiness** — Dockerfile, compose entry, README, CI
   passing on PR + main.

Each phase ends in a manual checkpoint before the next starts.

---

**Status**: Phase 1 (Specify) — review iteration 2 complete (all six
open questions resolved into §11a–§11e). Architecture findings from
five-axis review addressed: `apiClient` wiring pattern locked (§6),
dependency direction documented (§4), `lib/tz.ts` introduced (§4 +
§11a), security headers added to Always boundary (§8). Awaiting final
approval to proceed to Phase 2 (Plan).
After approval, agent proceeds to Phase 2 (Plan).
