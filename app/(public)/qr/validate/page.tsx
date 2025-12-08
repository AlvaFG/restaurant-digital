import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import QRValidateContent from './validate-content';

// Force dynamic rendering for this page since it uses searchParams
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function QRValidatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    }>
      <QRValidateContent token={params.token} />
    </Suspense>
  );
}
