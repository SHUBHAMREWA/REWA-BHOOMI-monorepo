import { Metadata } from 'next';
import ProjectDetailsPage from '@/features/projects/ProjectDetailsPage';
import { APP_NAME, APP_URL } from '@rewa-bhoomi/config';

export const revalidate = 300; // 5-minute ISR cache

interface Props {
  params: { slug: string };
}

async function getProject(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${apiUrl}/api/v1/projects/${slug}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${apiUrl}/api/v1/projects?limit=30`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const projects = Array.isArray(json?.data) ? json.data : (Array.isArray(json?.data?.data) ? json.data.data : []);
    return projects.map((p: { slug: string }) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProject(params.slug);
  
  if (!project) {
    return {
      title: `Project Not Found | ${APP_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  const title = `${project.name} in ${project.city || 'Rewa'} | ${APP_NAME}`;
  const description = project.description?.slice(0, 160) || `Discover ${project.name} located in ${project.city || 'Rewa'}, Madhya Pradesh.`;
  const image = project.featured_image_url || `${APP_URL}/og-image.jpg`;
  const canonicalUrl = `${APP_URL}/projects/${params.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: image, width: 1200, height: 630, alt: project.name }],
      type: 'website',
      siteName: APP_NAME,
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function PublicProjectPage() {
  return <ProjectDetailsPage />;
}
