'use client';

import { useState, useEffect } from 'react';


import { useRouter } from 'next/navigation';
import { Box, Container, Typography, InputBase, Button, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LandscapeIcon from '@mui/icons-material/Landscape';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';

const categories = [
  { name: 'Houses', icon: <HomeIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 } }} />, query: 'category=house' },
  { name: 'Plots', icon: <LandscapeIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 } }} />, query: 'category=plot' },
  { name: 'Commercial', icon: <StorefrontIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 } }} />, query: 'category=commercial' },
  { name: 'Agriculture', icon: <LandscapeIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 }, color: '#4CAF50' }}/>, query: 'category=agricultural' },
  { name: 'Rentals', icon: <VpnKeyIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 } }} />, query: 'listingType=RENT' },
  { name: 'Projects', icon: <MapsHomeWorkIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 } }} />, query: 'projects', isProject: true },
];


const animatedIcons = [
  <TravelExploreIcon key="explore" sx={{ fontSize: '1.15rem' }} />,
  <HomeIcon key="house" sx={{ fontSize: '1.15rem' }} />,
  <LandscapeIcon key="plot" sx={{ fontSize: '1.15rem' }} />,
  <StorefrontIcon key="commercial" sx={{ fontSize: '1.15rem' }} />,
  <LandscapeIcon key="agri" sx={{ fontSize: '1.15rem', color: '#86EFAC' }} />,
  <VpnKeyIcon key="rent" sx={{ fontSize: '1.15rem' }} />,
  <MapsHomeWorkIcon key="project" sx={{ fontSize: '1.15rem' }} />,
];

export default function HeroSection() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);
  const [iconFading, setIconFading] = useState(false);

  // Cycling animated icon in Explore Properties button
  useEffect(() => {
    const interval = setInterval(() => {
      setIconFading(true);
      setTimeout(() => {
        setIconIndex((prev) => (prev + 1) % animatedIcons.length);
        setIconFading(false);
      }, 200);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
    <Box component="section" sx={{ bgcolor: '#F7F8F9', pt: { xs: 3, sm: 4, md: 5 }, pb: { xs: 3, md: 4 }, borderBottom: '1px solid #E5E7EB' }}>
      <Container maxWidth="lg">
        
        {/* Compact Search Bar Area */}
        <Box sx={{ maxWidth: 800, mx: 'auto', mb: { xs: 2.5, md: 3.5 } }}>
          <Typography variant="h4" component="h1" sx={{ textAlign: 'center', fontWeight: 800, color: '#0F172A', mb: 0.5, fontSize: { xs: '1.4rem', sm: '1.85rem', md: '2.3rem' }, lineHeight: 1.25 }}>
            रीवा में खोजें अपने सपनों की संपत्ति
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', color: '#64748B', mb: 1.5, fontSize: { xs: '0.85rem', md: '0.95rem' } }}>
            Rewa ke aaspas verified plots, makaan, aur commercial properties dhoodhein.
          </Typography>

          {/* Action Buttons: Properties & Contact */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1.2, sm: 2 }, mb: 2, flexWrap: 'wrap' }}>

            <Button
              variant="contained"
              onClick={() => router.push('/properties')}
              sx={{
                bgcolor: '#1E40AF',
                color: 'white',
                px: { xs: 2.5, sm: 3 },
                py: { xs: 0.9, sm: 1.1 },
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: { xs: '0.82rem', sm: '0.92rem' },
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(30, 64, 175, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                '&:hover': { bgcolor: '#1E3A8A' },
              }}
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: iconFading ? 'scale(0.5) rotate(-20deg)' : 'scale(1) rotate(0deg)',
                  opacity: iconFading ? 0 : 1,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  mr: 1,
                }}
              >
                {animatedIcons[iconIndex]}
              </Box>
              Explore Properties
            </Button>

            <Button
              variant="outlined"
              onClick={() => router.push('/contact')}
              startIcon={<PhoneInTalkIcon />}
              sx={{
                borderColor: '#CBD5E1',
                bgcolor: '#FFFFFF',
                color: '#1E293B',
                px: { xs: 2.5, sm: 3 },
                py: { xs: 0.9, sm: 1.1 },
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: { xs: '0.82rem', sm: '0.92rem' },
                textTransform: 'none',
                '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
              }}
            >
              Contact Us
            </Button>
          </Box>

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

        {/* Compact Categories Row (Single Row on Mobile & Desktop) */}
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 1.2, sm: 2.5, md: 4.5 },
            justifyContent: { xs: 'space-between', sm: 'center' },
            flexWrap: 'nowrap',
            overflowX: { xs: 'auto', sm: 'visible' },
            pb: { xs: 0.5, sm: 0 },
            px: { xs: 0.5, sm: 0 },
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
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
                gap: 0.8,
                cursor: 'pointer',
                flexShrink: 0,
                width: { xs: '52px', sm: '68px', md: '84px' },
                '&:hover .icon-box': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                  bgcolor: '#FFFFFF',
                  borderColor: '#3B82F6',
                },
                '&:hover .cat-text': {
                  color: '#1E40AF',
                  fontWeight: 700,
                },
              }}
            >
              <Box
                className="icon-box"
                sx={{
                  width: { xs: 46, sm: 54, md: 64 },
                  height: { xs: 46, sm: 54, md: 64 },
                  bgcolor: '#FFFFFF',
                  borderRadius: { xs: '12px', sm: '14px', md: '16px' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  transition: 'all 0.25s ease',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                {cat.icon}
              </Box>
              <Typography
                className="cat-text"
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#334155',
                  textAlign: 'center',
                  fontSize: { xs: '0.7rem', sm: '0.78rem', md: '0.86rem' },
                  transition: 'all 0.2s',
                  lineHeight: 1.15,
                }}
              >
                {cat.name}
              </Typography>
            </Box>
          ))}
        </Box>


      </Container>
    </Box>
  );
}
