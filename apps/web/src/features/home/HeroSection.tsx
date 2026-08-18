'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Container, Typography, Button, InputBase, Select, MenuItem, Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ApartmentIcon from '@mui/icons-material/Apartment';
import StackedCardDeck from './components/StackedCardDeck';

const listingTypes = [
  { value: '', label: 'Buy / Rent' },
  { value: 'SELL', label: 'Buy' },
  { value: 'RENT', label: 'Rent' },
  { value: 'LEASE', label: 'Lease' },
];

const popularCities = ['Rewa', 'Bhopal', 'Indore', 'Satna', 'Jabalpur'];

export default function HeroSection() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const city = 'Rewa';
  const [listingType, setListingType] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSearch = (customSearch?: string) => {
    if (isRedirecting) return;
    setIsRedirecting(true);

    const query = customSearch !== undefined ? customSearch : search;
    const params = new URLSearchParams();
    if (query) params.set('keyword', query);
    if (city) params.set('city', city);
    if (listingType) params.set('listingType', listingType);
    params.set('focus', 'true');

    setTimeout(() => {
      router.push(`/properties?${params.toString()}`);
    }, 350);
  };

  const handleInputFocus = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);

    const params = new URLSearchParams();
    if (search) params.set('keyword', search);
    if (city) params.set('city', city);
    if (listingType) params.set('listingType', listingType);
    params.set('focus', 'true');

    setTimeout(() => {
      router.push(`/properties?${params.toString()}`);
    }, 350);
  };

  return (
    <Box
      component="section"
      className="hero-gradient"
      sx={{
        minHeight: { xs: 'auto', md: '80vh' },
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 11, md: 12 },
        pb: { xs: 6, md: 8 },
      }}
    >
      {/* Background pattern */}
      <Box
        sx={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          {/* Left Column - Search & Headline */}
          <Grid item xs={12} md={7.5}>
            {/* Sliding Hindi Text */}
            <Box 
              sx={{ 
                width: '100%', 
                overflow: 'hidden', 
                bgcolor: 'rgba(255,255,255,0.08)', 
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 2, 
                py: 1, 
                px: 2,
                mb: 3, 
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Typography 
                sx={{ 
                  color: '#E2E8F0', 
                  whiteSpace: 'nowrap', 
                  display: 'inline-block',
                  fontWeight: 500,
                  fontSize: { xs: '0.85rem', md: '0.95rem' },
                  '@keyframes marquee': {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(-120%)' }
                  },
                  animation: 'marquee 40s linear infinite',
                  '&:hover': { animationPlayState: 'paused' }
                }}
              >
                स्वागत है आपका हमारी इस वेबसाइट में! यहाँ अगर आपको कोई जानकारी लेनी है और कहीं भी प्लॉट या ज़मीन लेनी है, तो आप हमें संपर्क कर सकते हैं। नीचे हमारा नंबर और WhatsApp दिया गया है। (Swagat hai apka hamare es website me yaha agar apko koi janakari leni hai aur kahi bhi plot ya jamni leni hai toh app hame contact kr sakte hai niche number and whatsapp diya gaya hai)
              </Typography>
            </Box>

            {/* Badge */}
            <Box
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1,
                background: 'rgba(91,142,255,0.18)',
                border: '1px solid rgba(91,142,255,0.35)',
                borderRadius: 10, px: 2, py: 0.75, mb: 3,
              }}
            >
              <HomeWorkIcon sx={{ fontSize: 16, color: '#5B8EFF' }} />
              <Typography variant="caption" sx={{ color: '#A5C0FF', fontWeight: 600, letterSpacing: '0.05em' }}>
                REWA KA NO.1 REAL ESTATE PLATFORM
              </Typography>
            </Box>

            {/* Headline */}
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
                fontWeight: 800,
                color: '#FFFFFF',
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                mb: 2,
              }}
            >
              Rewa Me Dhoodhein Apna{' '}
              <Box component="span" className="gradient-text"
                sx={{ background: 'linear-gradient(135deg, #5B8EFF, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Dream Property
              </Box>
            </Typography>

            <Typography
              sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.95rem', md: '1.05rem' }, maxWidth: 550, mb: 2.5 }}
            >
              Rewa ke aaspas hazaaron verified plots, makaan, flats aur commercial properties bina kisi extra brokerage ke dhoodhein.
            </Typography>

            {/* 0% Trust Badges */}
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, mb: 3.5, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { icon: '🏷️', text: '0% Commission' },
                { icon: '💸', text: '0% Brokerage' },
                { icon: '✅', text: 'Direct Owner Deal' },
              ].map(({ icon, text }) => (
                <Box
                  key={text}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.6,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    px: { xs: 1.4, sm: 2 },
                    py: { xs: 0.5, sm: 0.65 },
                    fontSize: { xs: '0.75rem', sm: '0.82rem' },
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.92)',
                    letterSpacing: '0.01em',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.16)',
                      color: '#fff',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <span style={{ fontSize: '1em' }}>{icon}</span>
                  {text}
                </Box>
              ))}
            </Box>

            {/* Quick Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                component={Link}
                href="/properties"
                startIcon={<HomeWorkIcon sx={{ transition: 'transform 0.3s' }} />}
                sx={{
                  background: 'linear-gradient(135deg, #1B4FD8 0%, #3B82F6 100%)',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  borderRadius: '30px',
                  px: 3.5,
                  py: 1.4,
                  boxShadow: '0 8px 20px -6px rgba(27, 79, 216, 0.6)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                    transform: 'translateY(-3px) scale(1.03)',
                    boxShadow: '0 14px 28px -6px rgba(27, 79, 216, 0.75)',
                    '& svg': { transform: 'scale(1.15) rotate(-5deg)' }
                  }
                }}
              >
                Click to see Property
              </Button>
              <Button
                variant="contained"
                component={Link}
                href="/projects"
                startIcon={<ApartmentIcon sx={{ transition: 'transform 0.3s' }} />}
                sx={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#0F172A',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  borderRadius: '30px',
                  px: 3.5,
                  py: 1.4,
                  boxShadow: '0 8px 20px -6px rgba(245, 158, 11, 0.4)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                    transform: 'translateY(-3px) scale(1.03)',
                    boxShadow: '0 14px 28px -6px rgba(245, 158, 11, 0.55)',
                    '& svg': { transform: 'scale(1.15)' }
                  }
                }}
              >
                Click to see Project
              </Button>
            </Box>

            {/* Search Box */}
            <Box
              className="glass"
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 0,
                borderRadius: 3,
                p: 1,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(20px)',
                // Transition styling
                transform: isRedirecting ? 'translate3d(0, -20px, 0) scale(1.025)' : 'translate3d(0, 0, 0) scale(1)',
                boxShadow: isRedirecting 
                  ? '0 20px 40px rgba(0,0,0,0.4), 0 0 15px rgba(91,142,255,0.25)' 
                  : 'none',
                opacity: isRedirecting ? 0.5 : 1,
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease, box-shadow 0.35s ease',
              }}
            >
              {/* Listing Type */}
              <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, minWidth: 100 }}>
                <Select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  variant="standard"
                  disableUnderline
                  displayEmpty
                  sx={{
                    color: 'white', fontSize: '0.85rem', fontWeight: 500,
                    '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.7)' },
                  }}
                >
                  {listingTypes.map((lt) => (
                    <MenuItem key={lt.value} value={lt.value}>{lt.label}</MenuItem>
                  ))}
                </Select>
              </Box>

              <Box sx={{ width: '1px', background: 'rgba(255,255,255,0.15)', my: 1, display: { xs: 'none', md: 'block' } }} />

              {/* Keyword Input */}
              <InputBase
                placeholder="Area ya locality search karein..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={handleInputFocus}
                onClick={handleInputFocus}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                sx={{
                  flex: 1, color: 'white', px: 2, fontSize: '0.85rem',
                  '&::placeholder': { color: 'rgba(255,255,255,0.5)' },
                  '& input::placeholder': { color: 'rgba(255,255,255,0.5)' },
                }}
              />

              {/* CTA */}
              <Button
                variant="contained"
                size="large"
                startIcon={<SearchIcon />}
                onClick={() => handleSearch()}
                sx={{
                  borderRadius: 2.5, px: 2.5, py: 1.2, fontWeight: 700,
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#0F172A',
                  '&:hover': { background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', transform: 'none' },
                  flexShrink: 0,
                }}
              >
                Search
              </Button>
            </Box>

            {/* Popular searches */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 3, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                Popular:
              </Typography>
              {['Plot in Rewa', 'House for Rent', '2BHK Flat', 'Commercial Space'].map((tag) => (
                <Box
                  key={tag}
                  onClick={() => { setSearch(tag); handleSearch(); }}
                  sx={{
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10, px: 1.5, py: 0.5,
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: '0.75rem', fontWeight: 500,
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.18)',
                      color: 'white',
                    },
                  }}
                >
                  {tag}
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Right Column - Stacked Cards */}
          <Grid item xs={12} md={4.5} sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 6, md: 0 } }}>
            <StackedCardDeck />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
