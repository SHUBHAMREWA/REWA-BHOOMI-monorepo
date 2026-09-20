'use client';

import { Box, Container, Typography, Paper, Grid } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRouter } from 'next/navigation';

const rewaLocations = [
  { name: 'Chorahata', count: 'Plots & Houses' },
  { name: 'Amahiya', count: 'Commercial & Plots' },
  { name: 'Saman', count: 'Residential & Houses' },
  { name: 'University Road', count: 'Student Rooms & Houses' },
  { name: 'Civil Lines', count: 'Prime Properties' },
  { name: 'Bichhiya', count: 'Plots & Farm Land' },
  { name: 'Bodabag', count: 'Plots & Houses' },
];

export default function ExploreLocations() {
  const router = useRouter();

  return (
    <Box component="section" sx={{ py: { xs: 4, sm: 5, md: 7 }, bgcolor: '#FFFFFF' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: { xs: 2.5, sm: 3, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#1B4FD8', mb: 0.3 }}>
            <LocationOnIcon sx={{ fontSize: 18 }} />
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Local Market Areas
            </Typography>
          </Box>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.25rem' }, fontWeight: 850, color: '#0F172A' }}>
            📍 Explore Properties by Location
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 1.2, sm: 1.8, md: 2.5 }}>
          {rewaLocations.map((loc, idx) => (
            <Grid item xs={6} sm={4} md={3} key={idx}>
              <Paper
                elevation={0}
                onClick={() => router.push(`/properties?keyword=${encodeURIComponent(loc.name)}`)}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 3,
                  border: '1.5px solid #E2E8F0',
                  bgcolor: '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.22s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': {
                    borderColor: '#1B4FD8',
                    bgcolor: '#FFFFFF',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 18px rgba(27, 79, 216, 0.12)',
                    '& .loc-icon': { color: '#1B4FD8', transform: 'translateX(2px)' },
                  },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={750} sx={{ fontSize: { xs: '0.88rem', sm: '0.98rem' }, color: '#0F172A' }} noWrap>
                    {loc.name}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }} noWrap display="block">
                    {loc.count}
                  </Typography>
                </Box>
                <ArrowForwardIcon className="loc-icon" sx={{ fontSize: 18, color: '#94A3B8', transition: 'all 0.2s ease', flexShrink: 0, ml: 1 }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
