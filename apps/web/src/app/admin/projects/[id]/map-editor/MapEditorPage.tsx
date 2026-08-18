'use client';

import dynamic from 'next/dynamic';
import { CircularProgress, Box } from '@mui/material';

const ProjectMapEditor = dynamic(
  () => import('@/features/admin/ProjectMapEditor'),
  { ssr: false, loading: () => <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><CircularProgress /></Box> }
);

export default function MapEditorPage({ projectId }: { projectId: string }) {
  return <ProjectMapEditor projectId={projectId} />;
}