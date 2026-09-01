import type { Metadata } from 'next';
import ProjectsListPage from '@/features/projects/ProjectsListPage';
import { APP_NAME, APP_URL } from '@rewa-bhoomi/config';

export const metadata: Metadata = {
  title: `Mega Projects | ${APP_NAME}`,
  description: 'Explore premium plotted developments, townships, and commercial projects in and around Rewa.',
  openGraph: {
    title: `Mega Projects | ${APP_NAME}`,
    description: 'Explore premium plotted developments, townships, and commercial projects in and around Rewa.',
    url: `${APP_URL}/projects`,
    siteName: APP_NAME,
    images: [{ url: `${APP_URL}/og-image.jpg`, width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Mega Projects | ${APP_NAME}`,
    description: 'Explore premium plotted developments, townships, and commercial projects in and around Rewa.',
    images: [`${APP_URL}/og-image.jpg`],
  },
};

export default function PublicProjectsPage() {
  return <ProjectsListPage />;
}
