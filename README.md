# asima-frontend

Next.js 15 SPA for **asima**, an Ashima-inspired Employee Time
Management System. v0 ships the self-service surface only — admin
screens land in v1.

System-level architecture lives in `../CLAUDE.md` (parent repo).
Frontend-only rules live in `./SPEC.md`. This README is the runbook.

## Stack

- **Next.js 15** (App Router, `output: 'standalone'`)
- **React 19 RC** + TypeScript strict + `noUncheckedIndexedAccess`
- **Tailwind CSS 3.4** (CSS variables for fonts, black-on-white theme)
- **TanStack Query v5** for server state, **React Hook Form + Zod** for forms
- **Vitest + jsdom + React Testing Library** for tests
- **`date-fns`** + `Intl.DateTimeFormat` for timezone-aware formatting

## Prerequisites

- Node 20+
- The backend (`../asima-backend`) running on port 3000.
  See `../asima-backend/README.md`.

## Local development

```bash
cp .env.local.example .env.local   # if you haven't already
npm ci
npm run dev                        # → http://localhost:3001
```

Open the app at `http://localhost:3001`. The root route redirects to
`/dashboard`, which redirects to `/login?reason=expired` for an
unauthenticated visitor.

The backend's `CORS_ALLOWED_ORIGINS` env var must include
`http://localhost:3001` or the browser will block requests.

## Scripts

```
npm run dev         # next dev on :3001
npm run build       # next build (standalone output)
npm run start       # next start on :3001 (post-build)
npm run lint        # next lint --fix
npm run typecheck   # tsc --noEmit (strict + noUncheckedIndexedAccess)
npm run test        # vitest run
npm run test:watch  # vitest watch mode
npm run format      # prettier write
```

## Tests

The suite is small-and-fast (Vitest unit tests on schemas, helpers, and
the auth guard). Run on every commit; CI re-runs the full suite plus
typecheck and build.

```bash
npm test
```

## Docker

Multi-stage Dockerfile at `docker/Dockerfile` produces a slim image
running Next.js in standalone mode on port 3001. Build and run with
docker compose:

```bash
# Start the backend first (separate repo)
cd ../asima-backend && docker compose up -d

# Build and run the frontend
cd ../asima-frontend
docker compose up --build
# → http://localhost:3001
```

`NEXT_PUBLIC_API_BASE_URL` is baked at build time (next/font and page
metadata read it then). To point at a different backend, pass it as
a build arg:

```bash
docker compose build --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api/v1
```

## Deployment

The standalone output also runs on Vercel without changes — point a
Vercel project at this directory, set `NEXT_PUBLIC_API_BASE_URL` in
the project's environment, and deploy.

When deploying to Vercel, add the Vercel preview/production domains
to the backend's `CORS_ALLOWED_ORIGINS`. Wildcards (e.g.
`https://*.vercel.app`) are supported.

## Security notes

- The refresh token lives in `localStorage` (XSS surface). v1 migrates
  to an httpOnly cookie via a backend-issued Set-Cookie. Documented
  tradeoff — do not extend the v0 storage strategy.
- Access tokens live in memory (a ref inside `AuthProvider`). They
  rotate every 15 minutes via the apiClient's refresh mutex.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`) are set in
  `next.config.ts`. A strict CSP is intentionally deferred to v1
  (Next 15 inline-script handling needs middleware + nonces).
- Never commit `.env.local`. The `.dockerignore` and `.gitignore`
  both exclude it.

## CI

GitHub Actions runs lint, typecheck, tests, and the production build
on every push and pull request — see `.github/workflows/ci.yml`.

## Project layout

```
src/
├── app/                  # Next.js App Router routes
│   ├── (auth)/           # /login — unauthenticated surface
│   ├── (app)/            # /dashboard, /me, /me/schedule, /me/time-entries
│   ├── layout.tsx        # root layout (fonts + providers)
│   ├── providers.tsx     # QueryClientProvider + AuthProvider + Toaster
│   └── page.tsx          # redirects to /dashboard
├── features/             # feature-scoped slices (auth, profile, schedule, time-entries)
│   └── <feature>/
│       ├── schemas.ts    # Zod schemas + types
│       ├── api.ts        # endpoint wrappers
│       └── components/   # feature-scoped UI
├── components/layout/    # cross-feature UI (AppShell, Card)
└── lib/                  # cross-cutting primitives (apiClient, env, tz, format)

tests/
├── setup.ts              # jsdom + @testing-library/jest-dom
└── unit/                 # mirrors src/ layout

docker/                   # Dockerfile + (eventually) entrypoint.sh
```

See `SPEC.md` for the full architecture rationale.
