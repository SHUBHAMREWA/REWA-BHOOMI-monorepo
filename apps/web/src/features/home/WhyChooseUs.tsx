'use client';

import { Box, Container, Grid, Typography, Paper } from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import SearchIcon from '@mui/icons-material/Search';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import LocationCityIcon from '@mui/icons-material/LocationCity';

const trustPoints = [
  {
    icon: <HomeWorkIcon sx={{ fontSize: 28, color: '#1B4FD8' }} />,
    title: 'Local Property Listings',
    desc: 'Dedicated property discovery platform focused specifically on Rewa and nearby areas.',
  },
  {
    icon: <SearchIcon sx={{ fontSize: 28, color: '#0284C7' }} />,
    title: 'Easy Property Search',
    desc: 'Find plots, मकान, shops and farm land quickly by type, size, and locality.',
  },
  {
    icon: <PhoneInTalkIcon sx={{ fontSize: 28, color: '#166534' }} />,
    title: 'Direct Seller Contact',
    desc: 'Connect directly with property owners and sellers via Phone and WhatsApp.',
  },
  {
    icon: <LocationCityIcon sx={{ fontSize: 28, color: '#7C3AED' }} />,
    title: 'Rewa Market Focused',
    desc: 'Built specifically for buyers, sellers, and investors in the local Rewa market.',
  },
];

export default function WhyChooseUs() {
  return (
    <Box component="section" sx={{ py: { xs: 4, sm: 5, md: 7 }, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4.5 } }}>
          <Typography
            variant="caption"
            sx={{
              color: '#1B4FD8',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Why Rewa Bhoomi
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.25rem' },
              fontWeight: 850,
              color: '#0F172A',
              mt: 0.5,
            }}
          >
            The Simple Way to Find Property in Rewa
          </Typography>
          <Typography sx={{ color: '#475569', mt: 1, maxWidth: 540, mx: 'auto', fontSize: { xs: '0.84rem', sm: '0.94rem' } }}>
            Connecting buyers and property owners directly with local market clarity and ease.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {trustPoints.map((point, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  height: '100%',
                  borderRadius: 3.5,
                  border: '1.5px solid #E2E8F0',
                  bgcolor: '#FFFFFF',
                  transition: 'all 0.22s ease-in-out',
                  '&:hover': {
                    borderColor: '#1B4FD8',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(27, 79, 216, 0.08)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2.5,
                    bgcolor: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.8,
                  }}
                >
                  {point.icon}
                </Box>
                <Typography variant="h6" component="h3" fontWeight={750} sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: '#0F172A', mb: 0.8 }}>
                  {point.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6, fontSize: { xs: '0.8rem', sm: '0.86rem' } }}>
                  {point.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
