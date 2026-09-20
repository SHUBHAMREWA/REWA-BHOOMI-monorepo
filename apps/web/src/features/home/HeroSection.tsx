'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, InputBase, Button, Paper, Chip, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LandscapeIcon from '@mui/icons-material/Landscape';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

const quickCategories = [
  {
    name: 'प्लॉट / जमीन',
    mobileName: 'प्लॉट / जमीन',
    icon: <LandscapeIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />,
    query: 'categoryType=LAND',
    hideOnMobile: false,
  },
  {
    name: 'मकान',
    mobileName: 'मकान',
    icon: <HomeIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />,
    query: 'categoryType=RESIDENTIAL',
    hideOnMobile: false,
  },
  {
    name: 'दुकान',
    mobileName: 'दुकान',
    icon: <StorefrontIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />,
    query: 'categoryType=COMMERCIAL',
    hideOnMobile: false,
  },
  {
    name: 'खेत',
    mobileName: 'खेत',
    icon: <LandscapeIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 }, color: '#15803D' }} />,
    query: 'categoryType=LAND&propertyType=FARM_LAND',
    hideOnMobile: false,
  },
  {
    name: 'किराए पर',
    mobileName: 'किराए पर',
    icon: <VpnKeyIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />,
    query: 'listingPurpose=RENT',
    hideOnMobile: true,
  },
  {
    name: 'प्रोजेक्ट्स',
    mobileName: 'प्रोजेक्ट्स',
    icon: <MapsHomeWorkIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />,
    query: 'projects',
    isProject: true,
    hideOnMobile: true,
  },
];

const quickFilterChips = [
  { label: 'Plot', query: 'categoryType=LAND' },
  { label: 'House', query: 'categoryType=RESIDENTIAL&propertyType=HOUSE' },
  { label: 'Land', query: 'categoryType=LAND' },
  { label: 'Commercial', query: 'categoryType=COMMERCIAL' },
  { label: 'Villa', query: 'categoryType=RESIDENTIAL&propertyType=VILLA' },
];

export default function HeroSection() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleSearch = (customQuery?: string) => {
    const q = (customQuery !== undefined ? customQuery : search).trim();
    if (q) {
      router.push(`/properties?keyword=${encodeURIComponent(q)}`);
    } else {
      router.push('/properties');
    }
  };

  return (
    <Box
      component="section"
      sx={{
        bgcolor: '#F8FAFC',
        pt: { xs: 2.5, sm: 3.5, md: 5 },
        pb: { xs: 3, sm: 4, md: 5 },
        borderBottom: '1px solid #E2E8F0',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ maxWidth: 840, mx: 'auto', textAlign: 'center' }}>
          
          {/* Main Hero Headings */}
          <Typography
            variant="h1"
            sx={{
              fontWeight: 850,
              color: '#0F172A',
              mb: { xs: 0.8, sm: 1 },
              fontSize: { xs: '1.45rem', sm: '2rem', md: '2.5rem' },
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
            }}
          >
            रीवा में अपनी प्रॉपर्टी खोजें
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#475569',
              mb: { xs: 2, sm: 2.5 },
              fontSize: { xs: '0.85rem', sm: '0.98rem', md: '1.05rem' },
              fontWeight: 500,
            }}
          >
            Rewa ke aaspaas plots, makaan aur commercial properties dhoondhein.
          </Typography>

          {/* Prominent Search Bar */}
          <Paper
            elevation={0}
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#FFFFFF',
              p: { xs: 0.6, sm: 0.8 },
              borderRadius: { xs: 3, sm: 4 },
              border: '2px solid #CBD5E1',
              boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.2s ease',
              mb: { xs: 1.5, sm: 2 },
              '&:focus-within': {
                borderColor: '#1B4FD8',
                boxShadow: '0 8px 28px -4px rgba(27, 79, 216, 0.22)',
              },
            }}
          >
            <SearchIcon sx={{ color: '#64748B', ml: { xs: 1, sm: 1.5 }, fontSize: { xs: 22, sm: 26 } }} />
            
            <InputBase
              placeholder="Search property, area or locality..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              inputProps={{ 'aria-label': 'Search property, area or locality' }}
              sx={{
                ml: 1,
                flex: 1,
                fontSize: { xs: '0.86rem', sm: '0.98rem' },
                color: '#0F172A',
                fontWeight: 500,
                '& input::placeholder': {
                  color: '#64748B',
                  opacity: 1,
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: '#1B4FD8',
                color: '#FFFFFF',
                borderRadius: { xs: 2.5, sm: 3 },
                px: { xs: 2, sm: 3.5 },
                py: { xs: 1, sm: 1.1 },
                minHeight: { xs: 42, sm: 46 },
                fontSize: { xs: '0.82rem', sm: '0.92rem' },
                fontWeight: 750,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(27, 79, 216, 0.3)',
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: '#1338A8',
                  boxShadow: '0 6px 18px rgba(27, 79, 216, 0.4)',
                },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>🔍 Property Search Karein</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Search</Box>
            </Button>
          </Paper>

          {/* Quick Filter Chips */}
          <Stack
            direction="row"
            spacing={0.8}
            sx={{
              justifyContent: 'center',
              flexWrap: 'wrap',
              rowGap: 1,
              mb: { xs: 3, sm: 4 },
            }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: { xs: '0.74rem', sm: '0.82rem' },
                fontWeight: 700,
                color: '#64748B',
                alignSelf: 'center',
                mr: 0.5,
              }}
            >
              Quick Search:
            </Typography>

            {quickFilterChips.map((chip, idx) => (
              <Chip
                key={idx}
                label={chip.label}
                onClick={() => router.push(`/properties?${chip.query}`)}
                sx={{
                  bgcolor: '#FFFFFF',
                  color: '#1E293B',
                  border: '1px solid #E2E8F0',
                  fontWeight: 600,
                  fontSize: { xs: '0.74rem', sm: '0.82rem' },
                  px: 0.5,
                  height: { xs: 28, sm: 32 },
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#1B4FD8',
                    color: '#FFFFFF',
                    borderColor: '#1B4FD8',
                    transform: 'translateY(-1px)',
                  },
                }}
              />
            ))}
          </Stack>

          {/* Section Heading: आप क्या देखना चाहते हैं? */}
          <Typography
            sx={{
              textAlign: 'center',
              fontWeight: 750,
              color: '#334155',
              fontSize: { xs: '0.86rem', sm: '0.96rem' },
              mb: { xs: 1.5, sm: 2 },
              letterSpacing: 0.2,
            }}
          >
            आप क्या देखना चाहते हैं?
          </Typography>

          {/* Quick Property Categories Bar */}
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 1, sm: 2.2, md: 4 },
              justifyContent: { xs: 'space-around', sm: 'center' },
              alignItems: 'flex-start',
              flexWrap: 'nowrap',
              maxWidth: { xs: '100%', sm: 700, md: 800 },
              mx: 'auto',
              px: { xs: 0.5, sm: 0 },
            }}
          >
            {quickCategories.map((cat, idx) => (
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
                  display: cat.hideOnMobile ? { xs: 'none', sm: 'flex' } : 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.6,
                  cursor: 'pointer',
                  flexShrink: 0,
                  width: { xs: '23%', sm: '68px', md: '84px' },
                  maxWidth: { xs: '80px', sm: 'none' },
                  outline: 'none',
                  '&:focus-visible .icon-box': {
                    outline: '2px solid #1B4FD8',
                    outlineOffset: 2,
                  },
                  '&:hover .icon-box': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                    bgcolor: '#FFFFFF',
                    borderColor: '#3B82F6',
                  },
                  '&:hover .cat-text': {
                    color: '#1B4FD8',
                    fontWeight: 700,
                  },
                }}
              >
                <Box
                  className="icon-box"
                  sx={{
                    width: { xs: 48, sm: 52, md: 60 },
                    height: { xs: 48, sm: 52, md: 60 },
                    bgcolor: '#FFFFFF',
                    borderRadius: { xs: '14px', sm: '13px', md: '15px' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#334155',
                    transition: 'all 0.25s ease',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  {cat.icon}
                </Box>

                {/* Mobile Label */}
                <Typography
                  className="cat-text"
                  sx={{
                    display: { xs: 'block', sm: 'none' },
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    textAlign: 'center',
                    transition: 'color 0.2s',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.mobileName}
                </Typography>

                {/* Desktop / Tablet Label */}
                <Typography
                  className="cat-text"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    fontSize: { sm: '0.78rem', md: '0.88rem' },
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

        </Box>
      </Container>
    </Box>
  );
}
