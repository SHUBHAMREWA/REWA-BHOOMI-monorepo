'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Chip, Button, CircularProgress, InputBase, IconButton } from '@mui/material';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

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
      {/* Hero Section */}
      <Box sx={{ bgcolor: '#0F172A', color: 'white', pt: { xs: 12, md: 14 }, pb: 5, px: { xs: 2, md: 5 } }}>
        <Container maxWidth="xl">
          <Grid container spacing={3} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={7}>
              <Typography variant="h3" fontWeight={800} mb={1} sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                Explore Mega Projects
              </Typography>
              <Typography variant="body1" sx={{ color: '#94A3B8', fontSize: '0.92rem' }}>
                Discover our premium plotted developments, townships, and commercial projects in and around Rewa.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4.5}>
              {/* Project Search Box */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  bgcolor: 'rgba(255,255,255,0.06)', 
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '30px', 
                  px: 2.5, 
                  py: 0.8,
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.3s ease',
                  '&:focus-within': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderColor: '#1B4FD8',
                    boxShadow: '0 0 10px rgba(27,79,216,0.25)'
                  }
                }}
              >
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)', mr: 1.2, fontSize: 20 }} />
                <InputBase
                  placeholder="Project name, builder ya location search karein..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ 
                    color: 'white', 
                    flex: 1, 
                    fontSize: '0.85rem',
                    '&::placeholder': { color: 'rgba(255,255,255,0.45)' }
                  }}
                />
                {search && (
                  <IconButton size="small" onClick={() => setSearch('')} sx={{ color: 'rgba(255,255,255,0.5)', p: 0.5 }}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {loading ? (
          <Box p={10} textAlign="center">
            <CircularProgress />
          </Box>
        ) : filteredProjects.length === 0 ? (
          <Box p={10} textAlign="center">
            <Typography variant="h6" color="text.secondary">
              {search ? 'Koi matching projects nahi mile.' : 'No projects available at the moment.'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {filteredProjects.map((project) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                <Card 
                  component={Link} 
                  href={`/projects/${project.slug}`}
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    textDecoration: 'none',
                    borderRadius: '16px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      borderColor: '#1B4FD8',
                      '& .MuiCardMedia-root': {
                        transform: 'scale(1.03)',
                      },
                      '& .project-logo-emblem': {
                        transform: 'scale(1.1) translateY(-2px)',
                        boxShadow: '0 12px 20px rgba(0,0,0,0.4)',
                      }
                    }
                  }}
                >
                  <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                    <CardMedia
                      component="div"
                      sx={{ 
                        height: 200,
                        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
                        backgroundImage: `radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 0)`,
                        backgroundSize: '16px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        position: 'relative',
                        transition: 'transform 0.5s ease',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0, left: 0, right: 0, height: '40%',
                          background: 'linear-gradient(to top, rgba(15,23,42,0.8), transparent)'
                        }
                      }}
                    >
                      {/* Logo Emblem */}
                      <Box 
                        className="project-logo-emblem"
                        sx={{
                          width: 60, height: 60,
                          borderRadius: '50%',
                          bgcolor: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                          mb: 1,
                          border: '2px solid rgba(255,255,255,0.8)',
                          zIndex: 2,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Typography variant="h5" fontWeight={900} sx={{ color: '#1B4FD8', letterSpacing: '-0.5px' }}>
                          {project.name.substring(0,2).toUpperCase()}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.6, fontSize: '0.68rem', fontWeight: 700, zIndex: 2 }}>
                        Mega Development
                      </Typography>
                    </CardMedia>
                    <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 3 }}>
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
                        size="small"
                        sx={{ 
                          fontWeight: 800, 
                          fontSize: '0.7rem', 
                          boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                          bgcolor: project.status === 'ONGOING' 
                            ? '#D1FAE5' 
                            : project.status === 'UPCOMING' 
                            ? '#FEF3C7' 
                            : '#DBEAFE',
                          color: project.status === 'ONGOING' 
                            ? '#065F46' 
                            : project.status === 'UPCOMING' 
                            ? '#92400E' 
                            : '#1E40AF',
                          border: '1px solid rgba(255,255,255,0.4)',
                        }}
                      />
                    </Box>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" fontWeight={700} mb={1} color="text.primary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {project.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2, color: 'text.secondary' }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight={500}>
                        {project.city}, {project.state}
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 3 }}>
                      {project.description}
                    </Typography>

                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid #F1F5F9' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Developer</Typography>
                        <Typography variant="body2" fontWeight={600} color="text.primary">{project.developer || 'N/A'}</Typography>
                      </Box>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        sx={{ 
                          borderRadius: '20px',
                          textTransform: 'none',
                          fontWeight: 700,
                          borderColor: '#1B4FD8',
                          color: '#1B4FD8',
                          px: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: '#1B4FD8',
                            color: 'white',
                            borderColor: '#1B4FD8',
                            transform: 'scale(1.05)',
                          }
                        }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
