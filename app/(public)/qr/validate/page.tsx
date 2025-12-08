import QRValidateContent from './validate-content';

// Force dynamic rendering for this page since it uses searchParams
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    token?: string;
  };
}

export default function QRValidatePage({ searchParams }: PageProps) {
  return <QRValidateContent token={searchParams.token} />;
}
