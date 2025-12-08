import type { ReactNode } from 'react';

// Minimal root layout - actual content is in [locale]/layout.tsx
// Force all routes to be dynamic to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
