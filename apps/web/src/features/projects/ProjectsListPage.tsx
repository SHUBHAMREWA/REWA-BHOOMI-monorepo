'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Chip, Button, CircularProgress, InputBase, IconButton, Skeleton } from '@mui/material';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ShareIcon from '@mui/icons-material/Share';
import toast from 'react-hot-toast';

import ProjectCard from './ProjectCard';

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiGet<any[]>('/projects')
      .then((data) => setProjects(data || []))
      .catch((err) => console.error('Failed to fetch projects:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = projects.filter((project) => {
    const term = search.toLowerCase();
    return (
      project.name.toLowerCase().includes(term) ||
      (project.description && project.description.toLowerCase().includes(term)) ||
      project.city.toLowerCase().includes(term) ||
      (project.developer && project.developer.toLowerCase().includes(term))
    );
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 10 }}>
      {/* Compact Hero Section (20% height) */}
      <Box sx={{ bgcolor: '#0F172A', color: 'white', pt: { xs: 7.2, md: 8.5 }, pb: { xs: 1.5, md: 2 }, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 1.2, sm: 2 } }}>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.15rem', md: '1.5rem' }, color: '#FFFFFF', lineHeight: 1.2 }}>
                Explore Mega Projects
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: { xs: '0.75rem', md: '0.82rem' }, mt: 0.2 }}>
                Discover premium plotted developments & townships in Rewa.
              </Typography>
            </Box>

            {/* Compact Project Search Box */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                bgcolor: 'rgba(255,255,255,0.08)', 
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '24px', 
                px: 1.8, 
                py: 0.3,
                height: { xs: 34, sm: 36 },
                width: { xs: '100%', sm: 260, md: 320 },
                backdropFilter: 'blur(5px)',
                transition: 'all 0.25s ease',
                '&:focus-within': {
                  bgcolor: 'rgba(255,255,255,0.14)',
                  borderColor: '#38BDF8',
                  boxShadow: '0 0 10px rgba(56,189,248,0.25)'
                }
              }}
            >
              <SearchIcon sx={{ color: 'rgba(255,255,255,0.6)', mr: 0.8, fontSize: 17 }} />
              <InputBase
                placeholder="Search project, builder ya location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ 
                  color: 'white', 
                  flex: 1, 
                  fontSize: '0.78rem',
                  '&::placeholder': { color: 'rgba(255,255,255,0.5)' }
                }}
              />
              {search && (
                <IconButton size="small" onClick={() => setSearch('')} sx={{ color: 'rgba(255,255,255,0.6)', p: 0.2 }}>
                  <ClearIcon sx={{ fontSize: 15 }} />
                </IconButton>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Projects Grid Container (2 cards per row on mobile) */}
      <Container maxWidth="xl" sx={{ mt: { xs: 2.5, md: 4 }, px: { xs: 1.5, sm: 3, md: 4 } }}>
        {loading ? (
          <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3, lg: 4 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Grid item xs={6} sm={6} md={4} lg={3} key={i}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: { xs: '12px', sm: '16px' }, border: '1.5px solid #80DEEA', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
                  <Skeleton variant="rectangular" height={130} animation="wave" />
                  <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
                    <Skeleton variant="text" height={22} width="85%" sx={{ mb: 0.5 }} animation="wave" />
                    <Skeleton variant="text" height={16} width="60%" sx={{ mb: 1 }} animation="wave" />
                    <Skeleton variant="rounded" height={24} width="100%" sx={{ mb: 1.5, borderRadius: '6px' }} animation="wave" />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5, borderTop: '1px solid #F1F5F9' }}>
                      <Skeleton variant="text" height={18} width="40%" animation="wave" />
                      <Skeleton variant="text" height={18} width="30%" animation="wave" />
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : filteredProjects.length === 0 ? (
          <Box p={10} textAlign="center">
            <Typography variant="h6" color="text.secondary">
              {search ? 'Koi matching projects nahi mile.' : 'No projects available at the moment.'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3, lg: 4 }}>
            {filteredProjects.map((project) => (
              <Grid item xs={6} sm={6} md={4} lg={3} key={project.id}>
                <ProjectCard project={project} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
