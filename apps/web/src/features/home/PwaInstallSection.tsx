'use client';

import { Box, Container, Paper, Typography, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import { usePwaInstall } from '@/features/pwa/usePwaInstall';

export default function PwaInstallSection() {
  const { canInstall, promptInstall } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <Box component="section" sx={{ py: { xs: 4, sm: 5, md: 6 }, bgcolor: '#FFFFFF' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5, md: 4 },
            borderRadius: 4,
            bgcolor: 'rgba(27, 79, 216, 0.04)',
            border: '1.5px solid rgba(27, 79, 216, 0.18)',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: { xs: 52, sm: 60 },
                height: { xs: 52, sm: 60 },
                borderRadius: 3,
                bgcolor: '#1B4FD8',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(27, 79, 216, 0.3)',
              }}
            >
              <PhoneAndroidIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
            </Box>
            <Box>
              <Typography variant="h5" component="h3" fontWeight={800} sx={{ fontSize: { xs: '1.05rem', sm: '1.25rem' }, color: '#0F172A' }}>
                Get the Rewa Bhoomi App
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', mt: 0.3, fontSize: { xs: '0.8rem', sm: '0.88rem' } }}>
                Install on your phone for instant property updates, fast searching, and saved listings.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={promptInstall}
            startIcon={<DownloadIcon />}
            sx={{
              bgcolor: '#1B4FD8',
              color: '#FFFFFF',
              px: 3.5,
              py: 1.1,
              borderRadius: 3,
              fontSize: '0.88rem',
              fontWeight: 750,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(27, 79, 216, 0.28)',
              whiteSpace: 'nowrap',
              width: { xs: '100%', sm: 'auto' },
              '&:hover': {
                bgcolor: '#1338A8',
              },
            }}
          >
            Install App
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
