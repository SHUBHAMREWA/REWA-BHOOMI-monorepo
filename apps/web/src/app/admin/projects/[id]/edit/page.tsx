import AdminProjectForm from '@/features/admin/AdminProjectForm';

export const dynamic = 'force-dynamic';

export default function EditProjectPage({ params }: { params: { id: string } }) {
  return <AdminProjectForm projectId={params.id} />;
}
