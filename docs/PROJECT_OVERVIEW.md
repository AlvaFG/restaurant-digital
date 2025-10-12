# Project Overview

## What It Is
Web front-end for a restaurant management console. It covers daily operations (dashboard, orders, tables, alerts) plus admin workflows (branding, integrations, users). The UI is built with Next.js App Router and shadcn primitives.

## Tech Stack
- Next.js 14, React 18, TypeScript
- Tailwind CSS with shadcn/ui components
- Mock AuthService + localStorage persistence
- MockSocketClient simulating real-time updates

## Running Locally
- `npm install`
- `npm run dev`
- Demo logins: `admin@admin.com` / `123456`, `staff@staff.com` / `123456`
- Lint and build with `npm run lint` and `npm run build`

## Key Directories
- `app/` routes, layouts, and global styles
- `components/` feature composites + `components/ui/` primitives
- `lib/` mock data, auth utilities, socket client
- `hooks/` shared hooks such as `use-socket` and `use-toast`

## Notes
- Table states are centralized in `lib/table-states.ts` (canonical codes, labels, colors, transitions); use `coerceTableState` for legacy payloads and import `TABLE_STATE_*` helpers instead of hard-coded strings.
- REST table backend lives in `lib/server/table-store.ts`; API routes under `app/api/tables/**` expose layout, catalog and state transitions for future tablet/QR clients.
- Menú mock API reside en `app/api/menu/**`; expone catálogo, listados y validaciones. Los pedidos reales se canalizan a través de `POST /api/order`, respaldado por `lib/server/order-store.ts`, que controla stock, totales y sincroniza el estado de mesa.
- The `/menu` page consumes that catalog with a tablet-first layout, search & filters (categories, availability, tags), allergen badges and a mock cart for future order flows.
- The mobile QR journey (`/qr/{tableId}`) lives in `app/(public)/qr`, is public, and reuses `useMenuCatalog` + `useQrTable`; it keeps the cart in localStorage and posts mock orders through `POST /api/menu/orders` before showing customer confirmation.
- API documentation for the menú endpoints lives in <code>docs/api/menu.md</code>; it details GET/HEAD <code>/api/menu</code>, POST <code>/api/menu/orders</code>, headers, versioning and error handling.
- `lib/server/table-store.ts` exports `getQrUrl(tableId, { origin })` and the mock `data/table-store.json` now includes `qrcodeUrl` per table so ops teams can share QR links.
- Cubiertos: `docs/api/analytics-covers.md` documenta PATCH/GET de cubiertos y el agregado `/api/analytics/covers`; usa `metadata.version` y `metadata.limits.maxCurrent` para invalidar caches y validar formularios.
- Fonts now load latin-ext subsets so accented labels render consistently.
- ProtectedRoute + middleware enforce mocked auth; update AuthService for real APIs.
- Real-time updates flow through /api/socket, the shared bus (lib/server/socket-bus.ts) and the typed client in lib/socket.ts; access them with useSocket().
- The table editor lives at `/salon` via the Estado/Edición/Zonas tabs; `/mesas/editor` redirects to that unified flow.
