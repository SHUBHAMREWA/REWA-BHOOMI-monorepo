'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, InputBase, Button, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LandscapeIcon from '@mui/icons-material/Landscape';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';

const categories = [
  { name: 'Houses', icon: <HomeIcon fontSize="large" />, query: 'category=house' },
  { name: 'Plots', icon: <LandscapeIcon fontSize="large" />, query: 'category=plot' },
  { name: 'Commercial', icon: <StorefrontIcon fontSize="large" />, query: 'category=commercial' },
  { name: 'Agriculture', icon: <LandscapeIcon fontSize="large" sx={{ color: '#4CAF50' }}/>, query: 'category=agricultural' },
  { name: 'Rentals', icon: <VpnKeyIcon fontSize="large" />, query: 'listingType=RENT' },
  { name: 'Projects', icon: <MapsHomeWorkIcon fontSize="large" />, query: 'projects', isProject: true },
];

export default function HeroSection() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSearch = (customSearch?: string) => {
    if (isRedirecting) return;
    setIsRedirecting(true);

    const query = customSearch !== undefined ? customSearch : search;
    const params = new URLSearchParams();
    if (query) params.set('keyword', query);
    params.set('city', 'Rewa');
    params.set('focus', 'true');

    setTimeout(() => {
      router.push(`/properties?${params.toString()}`);
    }, 300);
  };

  return (
    <Box component="section" sx={{ bgcolor: '#F7F8F9', pt: { xs: 10, md: 12 }, pb: { xs: 4, md: 6 }, borderBottom: '1px solid #E5E7EB' }}>
      <Container maxWidth="lg">
        
        {/* Compact Search Bar Area */}
        <Box sx={{ maxWidth: 800, mx: 'auto', mb: { xs: 4, md: 6 } }}>
          <Typography variant="h4" component="h1" sx={{ textAlign: 'center', fontWeight: 800, color: '#0F172A', mb: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
            रीवा में खोजें अपने सपनों की संपत्ति
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', color: '#64748B', mb: 3, fontSize: { xs: '0.9rem', md: '1rem' } }}>
            Rewa ke aaspas verified plots, makaan, aur commercial properties dhoodhein.
          </Typography>

          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 0.8,
              borderRadius: 3,
              border: '2px solid #E2E8F0',
              transition: 'all 0.2s',
              '&:focus-within': { borderColor: '#3B82F6', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)' },
            }}
          >
            <InputBase
              placeholder="Area ya locality search karein... (e.g. Nehru Nagar)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ ml: 2, flex: 1, fontSize: { xs: '0.9rem', sm: '1rem' }, fontWeight: 500 }}
            />
            <Button
              variant="contained"
              onClick={() => handleSearch()}
              sx={{
                bgcolor: '#1E40AF', borderRadius: 2, px: { xs: 3, sm: 4 }, py: 1.2, fontWeight: 700, textTransform: 'none',
                '&:hover': { bgcolor: '#1E3A8A' },
                boxShadow: 'none',
              }}
            >
              Search
            </Button>
          </Paper>
        </Box>

        {/* OLX-style Categories Row */}
        <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3, md: 5 }, justifyContent: 'center', flexWrap: 'wrap' }}>
          {categories.map((cat, idx) => (
            <Box
              key={idx}
              onClick={() => {
                if (cat.isProject) router.push('/projects');
                else router.push(`/properties?city=Rewa&${cat.query}`);
              }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                width: { xs: '75px', sm: '100px' },
                '&:hover .icon-box': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  bgcolor: '#FFFFFF',
                  borderColor: '#3B82F6',
                },
                '&:hover .cat-text': {
                  color: '#1E40AF',
                  fontWeight: 700,
                }
              }}
            >
              <Box
                className="icon-box"
                sx={{
                  width: { xs: 60, sm: 76 },
                  height: { xs: 60, sm: 76 },
                  bgcolor: '#FFFFFF',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  transition: 'all 0.3s ease',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}
              >
                {cat.icon}
              </Box>
              <Typography className="cat-text" variant="body2" sx={{ fontWeight: 600, color: '#334155', textAlign: 'center', fontSize: { xs: '0.75rem', sm: '0.85rem' }, transition: 'all 0.2s' }}>
                {cat.name}
              </Typography>
            </Box>
          ))}
        </Box>

      </Container>
    </Box>
  );
}
