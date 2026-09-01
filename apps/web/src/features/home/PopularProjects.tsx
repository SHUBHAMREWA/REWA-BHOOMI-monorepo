import { Box, Container, Grid, Typography, Button, Chip } from '@mui/material';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GridViewIcon from '@mui/icons-material/GridView';

import ShareButton from '@/components/ShareButton';

interface ProjectData {
  id: string;
  slug: string;
  name: string;
  status: string;
  total_plots: number;
  developer?: string;
  city: string;
  state: string;
  featured_image_url?: string;
  description?: string;
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
            <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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
                sx={{ display: 'block', textDecoration: 'none', overflow: 'hidden', position: 'relative' }}
              >
                <ShareButton 
                  url={`/projects/${project.slug}`}
                  title={project.name}
                  text={project.description || `Check out ${project.name}`}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 4,
                    bgcolor: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#0F172A',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    '&:hover': { bgcolor: '#1B4FD8', color: 'white' }
                  }}
                />
                {project.featured_image_url && (
                  <Box 
                    sx={{ 
                      height: 180, 
                      width: '100%', 
                      background: `url(${project.featured_image_url}) center/cover no-repeat` 
                    }} 
                  />
                )}
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Chip label={project.status} size="small" sx={{ bgcolor: 'rgba(30, 64, 175, 0.08)', color: '#1E40AF', fontWeight: 700 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#334155' }}>
                      <GridViewIcon fontSize="small" sx={{ color: '#334155' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>{project.total_plots} Plots</Typography>
                    </Box>
                  </Box>
                  <Typography variant="h5" component="h3" fontWeight={700} gutterBottom>
                    {project.name}
                  </Typography>
                  {project.developer && (
                    <Typography variant="body2" sx={{ color: '#475569' }} gutterBottom>
                      by {project.developer}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                    <LocationOnIcon fontSize="small" color="primary" />
                    <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
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
