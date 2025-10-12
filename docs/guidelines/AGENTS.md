# Repository Guidelines

## Project Structure & Module Organization
- `app/` is the Next.js App Router; folders such as `dashboard`, `pedidos`, `usuarios` map to pages. Shared layout sits in `app/layout.tsx`, globals in `app/globals.css`.
- `components/` holds feature composites (e.g., `analytics-dashboard.tsx`); reusable primitives stay in `components/ui` and should mirror shadcn patterns.
- `contexts/auth-context.tsx` exposes session state; wrap protected routes with `ProtectedRoute`.
- Shared hooks live in `hooks/`; keep new hooks beside their feature before promoting them.
- `lib/` contains integration helpers (`auth.ts`, `mock-data.ts`, `socket.ts`, `utils.ts`). Treat this folder as the boundary for API and realtime logic.
- Static assets go under `public/`, theme overrides under `styles/globals.css`.

## Build, Test, and Development Commands
- `npm install` installs dependencies (repo is locked to npm; remove `pnpm-lock.yaml` if unused).
- `npm run dev` serves `http://localhost:3000`.
- `npm run lint` runs the Next.js ESLint rules; fix all warnings.
- `npm run build` validates the production bundle; run before merges.
- `npm run start` serves the built output for smoke tests.

## Coding Style & Naming Conventions
- Target Node 18+ with TypeScript `strict`; favor typed props and returns.
- Components use `PascalCase`, hooks/utilities `camelCase`, folders kebab-case.
- Prefer the `@/...` alias, ordering imports: node, third-party, local.
- Tailwind classes stay inline; extract repeated patterns into components.
- Use 2 spaces in TSX/JSON; format via Prettier or compatible editor settings.

## Testing Guidelines
- Until automated suites exist, add manual verification notes to each PR.
- New component tests should use React Testing Library colocated under the feature (`components/__tests__/order-form.test.tsx`).
- Capture coverage goals or skipped scenarios in the PR body.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feature(dashboard): add occupancy graph`) to keep history scannable.
- Rebase or squash before review; avoid merge commits.
- PRs need: summary, linked issue, manual test log, and UI evidence when visuals change.
- Request review only after `npm run lint` and `npm run build` pass.

## Security & Configuration Tips
- Secrets belong in `.env.local` or `.env.production`; never commit keys.
- Websocket URLs live in `lib/socket.ts`; document env vars when they change.
- Note required scopes or callbacks for third-party services in the PR description.
