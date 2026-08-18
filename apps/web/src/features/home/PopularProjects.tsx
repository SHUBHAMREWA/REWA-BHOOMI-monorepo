import { Box, Container, Grid, Typography, Button, Chip } from '@mui/material';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GridViewIcon from '@mui/icons-material/GridView';

interface ProjectData {
  id: string;
  slug: string;
  name: string;
  status: string;
  total_plots: number;
  developer?: string;
  city: string;
  state: string;
}

async function fetchProjects(): Promise<ProjectData[]> {
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
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F0F4FF' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#1B4FD8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              New Launches
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 800, mt: 0.5 }}>
              Popular Projects
            </Typography>
          </Box>
          <Button component={Link} href="/projects" endIcon={<ArrowForwardIcon />} sx={{ fontWeight: 600 }}>
            View All Projects
          </Button>
        </Box>

        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} key={project.id}>
              <Box
                component={Link}
                href={`/projects/${project.slug}`}
                className="property-card"
                sx={{ display: 'block', textDecoration: 'none' }}
              >
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Chip label={project.status} size="small" sx={{ bgcolor: '#1B4FD810', color: '#1B4FD8', fontWeight: 700 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <GridViewIcon fontSize="small" />
                      <Typography variant="caption">{project.total_plots} Plots</Typography>
                    </Box>
                  </Box>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {project.name}
                  </Typography>
                  {project.developer && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      by {project.developer}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                    <LocationOnIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      {project.city}, {project.state}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 2.5, borderRadius: 2 }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    View Plot Map
                  </Button>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
