'use client';

import { useState } from 'react';
import { Box, Container, Grid, Typography, Link as MuiLink, IconButton, Stack, Button, Tooltip } from '@mui/material';
import Link from 'next/link';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import { useCompanyCommunication } from '@/features/home/api/useHomeData';
import { usePwaInstall } from '@/features/pwa/usePwaInstall';
import ShareAppModal from '@/components/common/ShareAppModal';

function XIcon({ fontSize = 18, color = 'currentColor' }: { fontSize?: number; color?: string }) {
  return (
    <svg
      width={fontSize}
      height={fontSize}
      viewBox="0 0 24 24"
      fill={color}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer() {
  const { data: comm } = useCompanyCommunication();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalInitialTab, setShareModalInitialTab] = useState<'share' | 'qr'>('share');
  const { canInstall, promptInstall } = usePwaInstall();

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
              <Typography variant="h6" component="p" fontWeight={800}>
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
                    width: 40,
                    height: 40,
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
                    width: 40,
                    height: 40,
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
                    width: 40,
                    height: 40,
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
                  aria-label="X"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    width: 40,
                    height: 40,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' },
                  }}
                  size="small"
                >
                  <XIcon fontSize={16} />
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
                    width: 40,
                    height: 40,
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
                    width: 40,
                    height: 40,
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
            <Typography variant="subtitle1" component="p" fontWeight={700} mb={2}>
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
            <Typography variant="subtitle1" component="p" fontWeight={700} mb={2}>
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
              <Typography variant="subtitle1" component="p" fontWeight={700} mb={2}>
                Contact Us
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {comm?.contact_phone && (
                  <MuiLink
                    href={`tel:${comm.contact_phone.replace(/\s+/g, '')}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: '#94A3B8',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': { color: '#FFFFFF', transform: 'translateX(2px)' },
                    }}
                  >
                    <PhoneIcon fontSize="small" sx={{ color: '#38BDF8' }} />
                    <Typography variant="body2">{comm.contact_phone}</Typography>
                  </MuiLink>
                )}
                {comm?.contact_email && (
                  <MuiLink
                    href={`mailto:${comm.contact_email}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: '#94A3B8',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': { color: '#FFFFFF', transform: 'translateX(2px)' },
                    }}
                  >
                    <EmailIcon fontSize="small" sx={{ color: '#38BDF8' }} />
                    <Typography variant="body2">{comm.contact_email}</Typography>
                  </MuiLink>
                )}
                {comm?.office_address && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, color: '#94A3B8' }}>
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
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 2.5,
          }}
        >
          <Typography variant="body2" color="#94A3B8">
            © {new Date().getFullYear()} Rewa Bhoomi. All rights reserved.
          </Typography>

          {/* Quick Action Strip (Matching user design) */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* WhatsApp */}
            <Tooltip title="Share on WhatsApp">
              <IconButton
                component="a"
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent("🏡 Check out Rewa Bhoomi — Rewa's #1 Property Platform: " + (typeof window !== 'undefined' ? window.location.origin : 'https://rewabhoomi.com'))}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on WhatsApp"
                sx={{
                  bgcolor: 'rgba(37, 211, 102, 0.15)',
                  color: '#25D366',
                  width: 38,
                  height: 38,
                  '&:hover': { bgcolor: '#25D366', color: 'white', transform: 'scale(1.08)' },
                  transition: 'all 0.2s',
                }}
                size="small"
              >
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* X */}
            <Tooltip title="Share on X">
              <IconButton
                component="a"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("🏡 Discover properties in Rewa on Rewa Bhoomi!")}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : 'https://rewabhoomi.com')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  width: 38,
                  height: 38,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)', transform: 'scale(1.08)' },
                  transition: 'all 0.2s',
                }}
                size="small"
              >
                <XIcon fontSize={16} />
              </IconButton>
            </Tooltip>

            {/* QR Code */}
            <Tooltip title="Scan & Share QR Code">
              <IconButton
                onClick={() => {
                  setShareModalInitialTab('qr');
                  setShareModalOpen(true);
                }}
                aria-label="Scan QR Code"
                sx={{
                  bgcolor: 'rgba(27, 79, 216, 0.2)',
                  color: '#93C5FD',
                  width: 38,
                  height: 38,
                  '&:hover': { bgcolor: '#1B4FD8', color: 'white', transform: 'scale(1.08)' },
                  transition: 'all 0.2s',
                }}
                size="small"
              >
                <QrCode2Icon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Share Modal */}
            <Tooltip title="Share App">
              <IconButton
                onClick={() => {
                  setShareModalInitialTab('share');
                  setShareModalOpen(true);
                }}
                aria-label="Share App"
                sx={{
                  bgcolor: 'rgba(27, 79, 216, 0.2)',
                  color: '#93C5FD',
                  width: 38,
                  height: 38,
                  '&:hover': { bgcolor: '#1B4FD8', color: 'white', transform: 'scale(1.08)' },
                  transition: 'all 0.2s',
                }}
                size="small"
              >
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Download App */}
            {canInstall && (
              <Button
                variant="contained"
                onClick={() => promptInstall()}
                startIcon={<DownloadIcon fontSize="small" />}
                sx={{
                  bgcolor: '#1B4FD8',
                  background: 'linear-gradient(135deg, #1B4FD8 0%, #1338A8 100%)',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  borderRadius: '24px',
                  px: 2.2,
                  py: 0.65,
                  boxShadow: '0 4px 14px rgba(27, 79, 216, 0.35)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #0F2D82 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 18px rgba(27, 79, 216, 0.45)',
                  },
                }}
              >
                Download App
              </Button>
            )}
          </Stack>

          <Typography variant="body2" color="#94A3B8">
            Made with ❤️ for Rewa
          </Typography>
        </Box>
      </Container>

      {/* Share & QR Code App Modal */}
      <ShareAppModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        initialTab={shareModalInitialTab}
      />
    </Box>
  );
}
