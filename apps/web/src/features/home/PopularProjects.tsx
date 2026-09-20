import { Box, Container, Grid, Typography, Button } from '@mui/material';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ProjectCard, { ProjectCardData } from '@/features/projects/ProjectCard';

async function fetchProjects(): Promise<ProjectCardData[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const res = await fetch(`${apiUrl}/api/v1/projects?limit=4`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.data ?? [];
  } catch {
    return [];
  }
}

export default async function PopularProjects() {
  const projects = await fetchProjects();

  if (projects.length === 0) return null;

  return (
    <Box component="section" sx={{ py: { xs: 6, md: 10 }, bgcolor: '#F0F4FF' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: { xs: 3, md: 4 }, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              New Launches
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.4rem', md: '2.25rem' }, fontWeight: 800, mt: 0.5 }}>
              Popular Projects
            </Typography>
          </Box>
          <Button component={Link} href="/projects" endIcon={<ArrowForwardIcon />} sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
            View All Projects
          </Button>
        </Box>

        <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
          {projects.map((project) => (
            <Grid item xs={6} sm={6} md={3} key={project.id}>
              <ProjectCard project={project} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
