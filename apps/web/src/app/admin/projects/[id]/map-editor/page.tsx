import type { Metadata } from 'next';
import MapEditorPage from './MapEditorPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Map Editor — Admin | Rewa Bhoomi',
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: { id: string } }) {
  return <MapEditorPage projectId={params.id} />;
}