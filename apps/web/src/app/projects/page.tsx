import ProjectsListPage from '@/features/projects/ProjectsListPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mega Projects | Rewa Bhoomi',
  description: 'Explore premium plotted developments, townships, and commercial projects in and around Rewa.',
};

export default function PublicProjectsPage() {
  return <ProjectsListPage />;
}
