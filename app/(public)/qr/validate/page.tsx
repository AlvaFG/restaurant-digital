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
  return <QRValidateContent token={params.token} />;
}
