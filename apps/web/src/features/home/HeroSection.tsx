'use client';

import { useState, useEffect } from 'react';


import { useRouter } from 'next/navigation';
import { Box, Container, Typography, InputBase, Button, Paper, Link as MuiLink } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LandscapeIcon from '@mui/icons-material/Landscape';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useCompanyCommunication } from './api/useHomeData';


const categories = [
  { name: 'Houses', icon: <HomeIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 } }} />, query: 'categoryType=RESIDENTIAL' },
  { name: 'Plots', icon: <LandscapeIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 } }} />, query: 'categoryType=LAND' },
  { name: 'Commercial', icon: <StorefrontIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 } }} />, query: 'categoryType=COMMERCIAL' },
  { name: 'Agriculture', icon: <LandscapeIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 }, color: '#15803D' }}/>, query: 'categoryType=LAND&propertyType=FARM_LAND' },
  { name: 'Rentals', icon: <VpnKeyIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 } }} />, query: 'listingPurpose=RENT' },
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

    const query = (customSearch !== undefined ? customSearch : search).trim();
    if (query) {
      router.push(`/properties?keyword=${encodeURIComponent(query)}`);
    } else {
      router.push('/properties');
    }
  };


  const { data: comm } = useCompanyCommunication();
  const contactPhone = comm?.contact_phone || '+91 7898522932';
  const whatsappNumber = (comm?.contact_phone || '917898522932').replace(/[^0-9]/g, '');

  return (
    <Box component="section" sx={{ bgcolor: '#F7F8F9', pt: { xs: 2, sm: 3.5, md: 4.5 }, pb: { xs: 2, sm: 3, md: 4 }, borderBottom: '1px solid #E5E7EB' }}>
      <Container maxWidth="lg">
        
        {/* Compact Search Bar Area */}
        <Box sx={{ maxWidth: 800, mx: 'auto', mb: { xs: 1.8, sm: 2.5, md: 3 } }}>
          <Typography variant="h4" component="h1" sx={{ textAlign: 'center', fontWeight: 800, color: '#0F172A', mb: { xs: 0.3, sm: 0.5 }, fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.2rem' }, lineHeight: 1.25 }}>
            रीवा में खोजें अपने सपनों की संपत्ति
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', color: '#334155', mb: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.78rem', sm: '0.88rem', md: '0.95rem' } }}>
            Rewa ke aaspas verified plots, makaan, aur commercial properties dhoodhein.
          </Typography>

          {/* Action Buttons: Properties & Contact */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 0.8, sm: 1.5 }, mb: { xs: 1, sm: 1.4 }, flexWrap: 'wrap' }}>

            <Button
              variant="contained"
              onClick={() => router.push('/properties')}
              sx={{
                bgcolor: '#1E40AF',
                color: 'white',
                px: { xs: 1.8, sm: 2.5, md: 3 },
                py: { xs: 0.6, sm: 0.85, md: 1.1 },
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: { xs: '0.75rem', sm: '0.84rem', md: '0.92rem' },
                textTransform: 'none',
                boxShadow: '0 3px 10px rgba(30, 64, 175, 0.2)',
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
                  mr: 0.8,
                }}
              >
                {animatedIcons[iconIndex]}
              </Box>
              Explore Properties
            </Button>

            <Button
              variant="outlined"
              onClick={() => router.push('/contact')}
              startIcon={<PhoneInTalkIcon sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }} />}
              sx={{
                borderColor: '#CBD5E1',
                bgcolor: '#FFFFFF',
                color: '#1E293B',
                px: { xs: 1.8, sm: 2.5, md: 3 },
                py: { xs: 0.6, sm: 0.85, md: 1.1 },
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: { xs: '0.75rem', sm: '0.84rem', md: '0.92rem' },
                textTransform: 'none',
                '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
              }}
            >
              Contact Us
            </Button>
          </Box>

          {/* अधिक जानकारी के लिए संपर्क करें Badge - Compact Single-Line on Mobile */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 0.5, sm: 1 },
              flexWrap: { xs: 'nowrap', sm: 'wrap' },
              mb: { xs: 1.2, sm: 1.8 },
              px: { xs: 1, sm: 1.8 },
              py: { xs: 0.35, sm: 0.6 },
              bgcolor: '#FFFFFF',
              borderRadius: '30px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              maxWidth: 'fit-content',
              mx: 'auto',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.84rem' },
                fontWeight: 700,
                color: '#1E293B',
                whiteSpace: 'nowrap',
              }}
            >
              अधिक जानकारी:
            </Typography>

            {/* Direct Phone Call */}
            <MuiLink
              href={`tel:${contactPhone.replace(/\s+/g, '')}`}
              aria-label={`Call ${contactPhone}`}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: '#1E40AF',
                bgcolor: 'rgba(30, 64, 175, 0.08)',
                px: { xs: 1.2, sm: 1.5 },
                py: { xs: 0.5, sm: 0.5 },
                minHeight: 36,
                borderRadius: '16px',
                fontSize: { xs: '0.72rem', sm: '0.84rem' },
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#1E40AF',
                  color: '#FFFFFF',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <PhoneInTalkIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
              {contactPhone}
            </MuiLink>

            {/* Direct WhatsApp Chat */}
            <MuiLink
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('नमस्ते Rewa Bhoomi, मुझे प्रॉपर्टी के बारे में अधिक जानकारी चाहिए।')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: '#166534',
                bgcolor: 'rgba(22, 101, 52, 0.08)',
                px: { xs: 1.2, sm: 1.5 },
                py: { xs: 0.5, sm: 0.5 },
                minHeight: 36,
                borderRadius: '16px',
                fontSize: { xs: '0.72rem', sm: '0.84rem' },
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#166534',
                  color: '#FFFFFF',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <WhatsAppIcon sx={{ fontSize: { xs: 15, sm: 17 } }} />
              WhatsApp
            </MuiLink>
          </Box>

          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#FFFFFF',
              p: { xs: 0.5, sm: 0.75 },
              borderRadius: { xs: 2.5, sm: 3 },
              border: '2px solid #E2E8F0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              transition: 'border-color 0.2s ease',
              '&:focus-within': {
                borderColor: '#1E40AF',
              },
            }}
          >
            <InputBase
              placeholder="Search by city, locality or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              inputProps={{ 'aria-label': 'Search properties by city, locality or project' }}
              sx={{
                ml: { xs: 1, sm: 1.5 },
                flex: 1,
                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                color: '#0F172A',
                '& input::placeholder': {
                  color: '#475569',
                  opacity: 1,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => handleSearch()}
              aria-label="Search properties"
              sx={{
                bgcolor: '#1E40AF',
                borderRadius: 2,
                px: { xs: 2.2, sm: 3.5 },
                py: { xs: 0.75, sm: 1.1 },
                minHeight: 44,
                fontSize: { xs: '0.8rem', sm: '0.92rem' },
                fontWeight: 700,
                textTransform: 'none',
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
            gap: { xs: 1, sm: 2.2, md: 4 },
            justifyContent: { xs: 'space-between', sm: 'center' },
            flexWrap: 'nowrap',
            overflowX: { xs: 'auto', sm: 'visible' },
            pb: { xs: 0.3, sm: 0 },
            px: { xs: 0.3, sm: 0 },
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {categories.map((cat, idx) => (
            <Box
              key={idx}
              role="button"
              tabIndex={0}
              aria-label={`View ${cat.name} properties`}
              onClick={() => {
                if (cat.isProject) router.push('/projects');
                else router.push(`/properties?${cat.query}`);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (cat.isProject) router.push('/projects');
                  else router.push(`/properties?${cat.query}`);
                }
              }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                flexShrink: 0,
                width: { xs: '56px', sm: '68px', md: '84px' },
                outline: 'none',
                '&:focus-visible .icon-box': {
                  outline: '2px solid #1E40AF',
                  outlineOffset: 2,
                },
                '&:hover .icon-box': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
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
                  width: { xs: 44, sm: 52, md: 60 },
                  height: { xs: 44, sm: 52, md: 60 },
                  bgcolor: '#FFFFFF',
                  borderRadius: { xs: '12px', sm: '13px', md: '15px' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  transition: 'all 0.25s ease',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                {cat.icon}
              </Box>
              <Typography
                className="cat-text"
                sx={{
                  fontSize: { xs: '0.68rem', sm: '0.78rem', md: '0.88rem' },
                  fontWeight: 600,
                  color: '#1E293B',
                  textAlign: 'center',
                  transition: 'color 0.2s',
                  lineHeight: 1.2,
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
