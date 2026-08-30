'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Paper, CircularProgress, Chip, Divider, Button, Breadcrumbs, Link as MuiLink, Skeleton } from '@mui/material';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import ShareIcon from '@mui/icons-material/Share';

const PublicMapViewer = dynamic(() => import('./PublicMapViewer'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" width="100%" height={450} animation="wave" sx={{ borderRadius: 3 }} />,
});

export default function ProjectDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [project, setProject] = useState<any>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      apiGet<any>(`/projects/${slug}`)
        .then(data => {
          setProject(data);
          return apiGet<any>(`/projects/${slug}/map`);
        })
        .then(data => setMapData(data))
        .catch(() => toast.error('Failed to load project details'))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 8 }}>
        <Box sx={{ bgcolor: '#0F172A', pt: { xs: 6.2, md: 6.8 }, pb: 1.2, px: { xs: 2, md: 4 } }}>
          <Container maxWidth="xl">
            <Skeleton variant="text" width={200} sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 1 }} />
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Skeleton variant="text" width={250} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Skeleton variant="rounded" width={180} height={26} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
              </Box>
              <Skeleton variant="rounded" width={120} height={30} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
            </Box>
          </Container>
        </Box>

        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Skeleton variant="rounded" width="100%" height={450} animation="wave" sx={{ borderRadius: 3, mb: 2 }} />
          
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
            <Skeleton variant="rounded" width="100%" height={52} sx={{ borderRadius: 3 }} />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Skeleton variant="text" width={150} height={30} sx={{ mb: 2 }} />
                <Divider sx={{ mb: 2 }} />
                {[1, 2, 3, 4].map((i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Skeleton variant="text" width={100} />
                    <Skeleton variant="text" width={120} />
                  </Box>
                ))}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Skeleton variant="text" width={180} height={30} sx={{ mb: 1 }} />
                <Skeleton variant="text" width={250} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" width="100%" height={200} sx={{ borderRadius: 2 }} />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (!project) return <Box p={10} textAlign="center"><Typography>Project not found.</Typography></Box>;

  const plots = mapData?.plots || project.plots || [];
  const mapObjects = mapData?.mapObjects || [];

  const statusColors: Record<string, any> = {
    UPCOMING: 'info',
    ONGOING: 'primary',
    COMPLETED: 'success',
  };

  const googleMapsUrl = project.latitude && project.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${project.latitude},${project.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${project.name}, ${project.city || 'Rewa'}, ${project.state || 'Madhya Pradesh'}`)}`;

  const handleShare = () => {
    const url = window.location.href;
    const title = project.name;
    const text = project.description || `Check out ${project.name} located in ${project.city}.`;

    if (navigator.share) {
      navigator.share({
        title,
        text,
        url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 8 }}>
      {project.schema_data && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(project.schema_data) }}
        />
      )}
      {/* ─── 1. SHIFTED ABOVE COMPACT HEADER BANNER ─── */}
      <Box sx={{ bgcolor: '#0F172A', color: 'white', pt: { xs: 6.2, md: 6.8 }, pb: 1.2, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">
          {/* Breadcrumbs Navigation */}
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" sx={{ color: '#64748B' }} />}
            aria-label="breadcrumb"
            sx={{ mb: 1 }}
          >
            <MuiLink
              component={Link}
              href="/"
              underline="hover"
              sx={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { color: '#38BDF8' } }}
            >
              <HomeIcon sx={{ fontSize: 15 }} /> Home
            </MuiLink>
            <MuiLink
              component={Link}
              href="/projects"
              underline="hover"
              sx={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 500, '&:hover': { color: '#38BDF8' } }}
            >
              Projects
            </MuiLink>
            <Typography sx={{ color: '#F8FAFC', fontSize: '0.82rem', fontWeight: 600 }}>
              {project.name}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' }, color: '#FFFFFF' }}>
                {project.name}
              </Typography>
              <Chip
                label={
                  project.status === 'ONGOING'
                    ? 'ONGOING - Plot Available Hai'
                    : project.status === 'UPCOMING'
                    ? 'UPCOMING - Project Start Hone Wala Hai'
                    : project.status === 'COMPLETED'
                    ? 'COMPLETED - Fully Developed'
                    : project.status
                }
                color={statusColors[project.status] || 'primary'}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.75rem', height: 26, px: 0.5 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 16, color: '#38BDF8' }} />
                <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.85rem' }}>
                  {project.city}, {project.state}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button 
                size="small"
                startIcon={<ShareIcon />} 
                onClick={handleShare}
                sx={{ color: '#94A3B8', '&:hover': { color: '#38BDF8', bgcolor: 'rgba(56,189,248,0.1)' }, textTransform: 'none', fontWeight: 600 }}
              >
                Share Project
              </Button>
              {project.developer && (
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Developer: <Typography component="span" variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>{project.developer}</Typography>
                </Typography>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ─── 2. MAIN LAYOUT: MAP CANVAS & TOP FILTER BAR ─── */}
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <PublicMapViewer project={project} plots={plots} mapObjects={mapObjects} />
        </Paper>

        <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}>
          <Button 
            fullWidth 
            variant="contained" 
            size="large"
            href="tel:+918889999120" // Adjust number or logic as needed
            sx={{ 
              bgcolor: '#1B4FD8', 
              color: 'white', 
              py: 1.5, 
              borderRadius: 3, 
              fontWeight: 800,
              fontSize: '1rem',
              boxShadow: '0 8px 16px rgba(27,79,216,0.2)'
            }}
          >
            Contact for Booking & Info
          </Button>
        </Box>

        {/* ─── 3. BOTTOM CARDS: OVERVIEW & REAL WORLD LOCATION ─── */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" fontWeight={700} mb={2} color="#0F172A">
                Project Overview
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" variant="body2">Developer</Typography>
                  <Typography fontWeight={600} variant="body2">{project.developer || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" variant="body2">Total Area</Typography>
                  <Typography fontWeight={600} variant="body2">{project.total_area ? `${project.total_area} Sq Ft` : 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" variant="body2">Total Plots</Typography>
                  <Typography fontWeight={600} variant="body2">{project.total_plots || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary" variant="body2">Location</Typography>
                  <Typography fontWeight={600} variant="body2">{project.address || `${project.city}, ${project.state}`}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" fontWeight={700} mb={1} color="#0F172A">
                Real World Location
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                {project.address || `${project.city}, ${project.state}`}
              </Typography>
              {project.latitude && project.longitude ? (
                <Box
                  component="iframe"
                  src={`https://maps.google.com/maps?q=${project.latitude},${project.longitude}&output=embed&zoom=15`}
                  sx={{ width: '100%', height: 200, border: 0, borderRadius: 2 }}
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <Box sx={{ height: 180, bgcolor: '#F1F5F9', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Location Map</Typography>
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                startIcon={<LocationOnIcon />}
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  mt: 1.5,
                  borderRadius: 2,
                  fontWeight: 700,
                  bgcolor: '#1B4FD8',
                  textTransform: 'none',
                  boxShadow: 'none',
                  py: 1,
                  '&:hover': { bgcolor: '#1541B5', boxShadow: 'none' },
                }}
              >
                See on Google Maps
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}