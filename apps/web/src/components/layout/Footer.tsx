'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Link as MuiLink, IconButton, Stack } from '@mui/material';
import Link from 'next/link';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { apiGet } from '@/lib/api';
import type { CompanyCommunication } from '@rewa-bhoomi/types';

export default function Footer() {
  const [comm, setComm] = useState<CompanyCommunication | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadComm() {
      try {
        const data = await apiGet<CompanyCommunication>('/communication');
        if (mounted && data) {
          setComm(data);
        }
      } catch (err) {
        // Silently fallback if communication endpoint is loading or unavailable
      }
    }
    loadComm();
    return () => {
      mounted = false;
    };
  }, []);

  const whatsappHref = comm?.whatsapp_number
    ? `https://wa.me/${comm.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(
        comm.whatsapp_message || 'Namaste, I want to inquire about properties on Rewa Bhoomi'
      )}`
    : null;

  return (
    <Box component="footer" sx={{ bgcolor: '#0F172A', color: 'white', py: { xs: 6, md: 8 }, mt: 'auto' }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Company Brand & Bio */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  bgcolor: 'white',
                  borderRadius: '8px',
                  p: 0.5,
                  width: 56,
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5,
                  overflow: 'hidden',
                }}
              >
                <img
                  src="/favicon.png"
                  alt="Rewa Bhoomi Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.6)' }}
                />
              </Box>
              <Typography variant="h6" fontWeight={800}>
                Rewa Bhoomi
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3, maxWidth: 340, lineHeight: 1.6 }}>
              The trusted real estate marketplace for buying, selling, and renting properties in Rewa, Madhya Pradesh.
            </Typography>

            {/* Social Media Icons */}
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {whatsappHref && (
                <IconButton
                  component="a"
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  sx={{
                    bgcolor: 'rgba(37, 211, 102, 0.15)',
                    color: '#25D366',
                    '&:hover': { bgcolor: '#25D366', color: 'white' },
                  }}
                  size="small"
                >
                  <WhatsAppIcon fontSize="small" />
                </IconButton>
              )}
              {comm?.instagram_url && (
                <IconButton
                  component="a"
                  href={comm.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  sx={{
                    bgcolor: 'rgba(228, 64, 95, 0.15)',
                    color: '#E4405F',
                    '&:hover': { bgcolor: '#E4405F', color: 'white' },
                  }}
                  size="small"
                >
                  <InstagramIcon fontSize="small" />
                </IconButton>
              )}
              {comm?.youtube_url && (
                <IconButton
                  component="a"
                  href={comm.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  sx={{
                    bgcolor: 'rgba(255, 0, 0, 0.15)',
                    color: '#FF0000',
                    '&:hover': { bgcolor: '#FF0000', color: 'white' },
                  }}
                  size="small"
                >
                  <YouTubeIcon fontSize="small" />
                </IconButton>
              )}
              {comm?.twitter_url && (
                <IconButton
                  component="a"
                  href={comm.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  sx={{
                    bgcolor: 'rgba(29, 161, 242, 0.15)',
                    color: '#1DA1F2',
                    '&:hover': { bgcolor: '#1DA1F2', color: 'white' },
                  }}
                  size="small"
                >
                  <TwitterIcon fontSize="small" />
                </IconButton>
              )}
              {comm?.facebook_url && (
                <IconButton
                  component="a"
                  href={comm.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  sx={{
                    bgcolor: 'rgba(24, 119, 242, 0.15)',
                    color: '#1877F2',
                    '&:hover': { bgcolor: '#1877F2', color: 'white' },
                  }}
                  size="small"
                >
                  <FacebookIcon fontSize="small" />
                </IconButton>
              )}
              {comm?.linkedin_url && (
                <IconButton
                  component="a"
                  href={comm.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  sx={{
                    bgcolor: 'rgba(10, 102, 194, 0.15)',
                    color: '#0A66C2',
                    '&:hover': { bgcolor: '#0A66C2', color: 'white' },
                  }}
                  size="small"
                >
                  <LinkedInIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <MuiLink component={Link} href="/properties" color="#94A3B8" underline="hover">
                Properties
              </MuiLink>
              <MuiLink component={Link} href="/projects" color="#94A3B8" underline="hover">
                Projects
              </MuiLink>
              <MuiLink component={Link} href="/blog" color="#94A3B8" underline="hover">
                Blogs
              </MuiLink>
              <MuiLink component={Link} href="/property/new" color="#94A3B8" underline="hover">
                Post Property
              </MuiLink>
            </Box>
          </Grid>

          {/* Support */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <MuiLink component={Link} href="/contact" color="#94A3B8" underline="hover">
                Contact Us
              </MuiLink>
              <MuiLink component={Link} href="/privacy" color="#94A3B8" underline="hover">
                Privacy Policy
              </MuiLink>
              <MuiLink component={Link} href="/terms" color="#94A3B8" underline="hover">
                Terms of Service
              </MuiLink>
            </Box>
          </Grid>

          {/* Contact Details */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, color: '#94A3B8' }}>
              {comm?.contact_phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" sx={{ color: '#38BDF8' }} />
                  <Typography variant="body2">{comm.contact_phone}</Typography>
                </Box>
              )}
              {comm?.contact_email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" sx={{ color: '#38BDF8' }} />
                  <Typography variant="body2">{comm.contact_email}</Typography>
                </Box>
              )}
              {comm?.office_address && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOnIcon fontSize="small" sx={{ color: '#38BDF8', mt: 0.2 }} />
                  <Typography variant="body2">{comm.office_address}</Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>

        <Box
          sx={{
            borderTop: '1px solid #1E293B',
            mt: 6,
            pt: 4,
            display: 'flex',
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="#64748B">
            © {new Date().getFullYear()} Rewa Bhoomi. All rights reserved.
          </Typography>
          <Typography variant="body2" color="#64748B">
            Made with ❤️ for Rewa
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
