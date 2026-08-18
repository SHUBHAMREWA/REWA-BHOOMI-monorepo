'use client';

import { Box, Container, Grid, Typography, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import HomeWorkIcon from '@mui/icons-material/HomeWork';

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#0F172A', color: 'white', py: 8, mt: 'auto' }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                bgcolor: 'white', 
                borderRadius: '8px', 
                p: 0.5, 
                width: 56,
                height: 56,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mr: 1.5,
                overflow: 'hidden'
              }}>
                <img src="/favicon.png" alt="Rewa Bhoomi Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.6)' }} />
              </Box>
              <Typography variant="h6" fontWeight={800}>Rewa Bhoomi</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2, maxWidth: 300 }}>
              The premium real estate marketplace for buying, selling, and renting properties in Rewa, Madhya Pradesh.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>Quick Links</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink component={Link} href="/properties" color="#94A3B8" underline="hover">Properties</MuiLink>
              <MuiLink component={Link} href="/projects" color="#94A3B8" underline="hover">Projects</MuiLink>
              <MuiLink component={Link} href="/blog" color="#94A3B8" underline="hover">Blogs</MuiLink>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>Support</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink component={Link} href="/contact" color="#94A3B8" underline="hover">Contact Us</MuiLink>
              <MuiLink component={Link} href="/privacy" color="#94A3B8" underline="hover">Privacy Policy</MuiLink>
              <MuiLink component={Link} href="/terms" color="#94A3B8" underline="hover">Terms of Service</MuiLink>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ borderTop: '1px solid #1E293B', mt: 6, pt: 4, display: 'flex', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
          <Typography variant="body2" color="#64748B">
            © {new Date().getFullYear()} Rewa Bhoomi. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
