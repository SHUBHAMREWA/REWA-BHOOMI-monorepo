import { Metadata } from 'next';
import ProjectDetailsPage from '@/features/projects/ProjectDetailsPage';
import { apiGet } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const project = await apiGet<any>(`/projects/${params.slug}`);
    
    if (!project) {
      return { title: 'Project Not Found' };
    }

    const title = project.name;
    const description = project.description || `Discover ${project.name} located in ${project.city}.`;
    const image = project.featured_image_url || 'https://rewabhoomi.com/default-og.jpg'; // Adjust fallback as needed

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [image],
        type: 'website',
      },
    };
  } catch (error) {
    return { title: 'Rewa Bhoomi Projects' };
  }
}

export default function PublicProjectPage() {
  return <ProjectDetailsPage />;
}
