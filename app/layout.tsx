import type { ReactNode } from 'react';

// Minimal root layout - delegates all rendering to [locale]/layout.tsx
// This file is required by Next.js but should not contain <html>/<body>
// since those are in the locale-specific layout
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
