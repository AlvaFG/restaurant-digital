import type { ReactNode } from 'react';

// Root layout required by Next.js
// This is a minimal layout that just wraps the locale-specific layouts
// Force dynamic rendering for all routes to avoid prerendering issues
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
