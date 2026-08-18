'use client';

import { Box, Container, Grid, Typography, Avatar } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';

const features = [
  {
    icon: <VerifiedIcon fontSize="large" />,
    title: 'Verified Listings',
    desc: 'Every property is manually reviewed to ensure accuracy and legitimacy.',
    color: '#10B981',
  },
  {
    icon: <SupportAgentIcon fontSize="large" />,
    title: 'Expert Support',
    desc: 'Chat directly with our real estate experts for guidance on any property.',
    color: '#1B4FD8',
  },
  {
    icon: <SpeedIcon fontSize="large" />,
    title: 'Fast & Easy',
    desc: 'List your property in minutes and reach thousands of buyers instantly.',
    color: '#F59E0B',
  },
  {
    icon: <SecurityIcon fontSize="large" />,
    title: 'Secure Platform',
    desc: 'Your data and transactions are protected with enterprise-grade security.',
    color: '#8B5CF6',
  },
];

export default function WhyChooseUs() {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, background: '#F0F4FF' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="caption" sx={{
            color: '#1B4FD8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Why Rewa Bhoomi
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 800, mt: 1 }}>
            The Smarter Way to{' '}
            <Box component="span" sx={{
              background: 'linear-gradient(135deg, #1B4FD8, #5B8EFF)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Find Property
            </Box>
          </Typography>
          <Typography sx={{ color: '#475569', mt: 1.5, maxWidth: 500, mx: 'auto' }}>
            We combine local expertise with modern technology to deliver the best real estate experience in Rewa.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {features.map((f) => (
            <Grid item xs={12} sm={6} md={3} key={f.title}>
              <Box
                className="property-card"
                sx={{ p: 3.5, height: '100%' }}
              >
                <Avatar sx={{ bgcolor: `${f.color}15`, width: 56, height: 56, mb: 2.5, color: f.color }}>
                  {f.icon}
                </Avatar>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {f.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                  {f.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
