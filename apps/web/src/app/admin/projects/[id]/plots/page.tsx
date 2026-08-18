import AdminPlotsManager from '@/features/admin/AdminPlotsManager';

export const dynamic = 'force-dynamic';

export default function ManagePlotsPage({ params }: { params: { id: string } }) {
  return <AdminPlotsManager projectId={params.id} />;
}
