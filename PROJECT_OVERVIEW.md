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
- Fonts now load latin-ext subsets so accented labels render consistently.
- ProtectedRoute + middleware enforce mocked auth; update AuthService for real APIs.
- Socket events are typed in `lib/socket.ts`; emit via `useSocket`.
