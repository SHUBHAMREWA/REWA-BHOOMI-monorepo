'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton, 
  Slide, 
  Avatar, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import CloseIcon from '@mui/icons-material/Close';
import IosShareIcon from '@mui/icons-material/IosShare';
import AddBoxIcon from '@mui/icons-material/AddBox';
import toast from 'react-hot-toast';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIosPrompt, setIsIosPrompt] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check if user is ALREADY running the app in standalone mode (installed PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      // User is already using the installed PWA — do not show prompt
      return;
    }

    // 2. Check if user already installed or dismissed recently
    const isInstalled = localStorage.getItem('pwa_installed') === 'true';
    if (isInstalled) return;

    const dismissedUntil = localStorage.getItem('pwa_install_dismissed_until');
    if (dismissedUntil && parseInt(dismissedUntil, 10) > Date.now()) {
      return;
    }

    // 3. Listen for standard PWA beforeinstallprompt (Chrome / Android / Edge / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait 2.5 seconds after page load before showing popup
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Handle iOS Safari
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIos && isSafari && !isStandalone) {
      const timer = setTimeout(() => {
        setIsIosPrompt(true);
        setShowPrompt(true);
      }, 3500);
      return () => clearTimeout(timer);
    }

    // 5. Listen for successful app installation
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa_installed', 'true');
      toast.success('Rewa Bhoomi App installed successfully! 🎉');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIosPrompt) {
        toast('Tap Share ⎋ and select "Add to Home Screen" ➕', {
          icon: '📱',
          duration: 5000,
        });
      }
      return;
    }

    // Show browser native install prompt
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_installed', 'true');
      setShowPrompt(false);
    } else {
      // User cancelled install prompt
      handleDismiss(1); // dismiss for 1 day
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = (days = 3) => {
    setShowPrompt(false);
    // Dismiss for 3 days
    const nextAllowedTime = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa_install_dismissed_until', nextAllowedTime.toString());
  };

  if (!showPrompt) return null;

  return (
    <Slide direction="up" in={showPrompt} mountOnEnter unmountOnExit>
      <Paper
        elevation={12}
        sx={{
          position: 'fixed',
          bottom: { xs: 76, sm: 24 },
          left: { xs: 12, sm: 24 },
          right: { xs: 12, sm: 'auto' },
          maxWidth: { xs: 'calc(100% - 24px)', sm: 380 },
          width: '100%',
          zIndex: 1300,
          p: 2,
          borderRadius: 3,
          bgcolor: 'white',
          border: '1px solid #E2E8F0',
          boxShadow: '0 12px 36px rgba(15, 23, 42, 0.2)',
        }}
      >
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1.5}>
          <Box display="flex" alignItems="center" gap={1.5}>
            {/* App Logo */}
            <Avatar
              src="/favicon.png"
              alt="Rewa Bhoomi"
              variant="rounded"
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                bgcolor: '#EFF6FF',
                p: 0.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />

            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#0F172A" lineHeight={1.2}>
                Install Rewa Bhoomi App
              </Typography>
              <Typography variant="caption" color="#64748B" display="block" mt={0.3} lineHeight={1.3}>
                Faster access, offline mode & real-time chat alerts.
              </Typography>
            </Box>
          </Box>

          <IconButton
            size="small"
            onClick={() => handleDismiss(3)}
            sx={{
              color: '#94A3B8',
              p: 0.5,
              '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {isIosPrompt ? (
          // iOS Safari specific instructions
          <Box
            sx={{
              mt: 1.5,
              p: 1.2,
              bgcolor: '#F8FAFC',
              borderRadius: 2,
              border: '1px dashed #CBD5E1',
            }}
          >
            <Typography variant="caption" fontWeight={600} color="#334155" display="flex" alignItems="center" gap={0.5}>
              1. Tap Share <IosShareIcon sx={{ fontSize: 16, color: '#1B4FD8' }} /> in bottom bar
            </Typography>
            <Typography variant="caption" fontWeight={600} color="#334155" display="flex" alignItems="center" gap={0.5} mt={0.5}>
              2. Select <AddBoxIcon sx={{ fontSize: 16, color: '#1B4FD8' }} /> <strong>&ldquo;Add to Home Screen&rdquo;</strong>
            </Typography>
          </Box>
        ) : (
          // Android & Desktop install button
          <Box display="flex" gap={1} mt={1.8}>
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={<GetAppIcon />}
              onClick={handleInstallClick}
              sx={{
                bgcolor: '#1B4FD8',
                color: 'white',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                py: 0.9,
                fontSize: '0.85rem',
                boxShadow: '0 4px 12px rgba(27, 79, 216, 0.35)',
                '&:hover': { bgcolor: '#1D4ED8' },
              }}
            >
              Install App
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleDismiss(3)}
              sx={{
                color: '#64748B',
                borderColor: '#E2E8F0',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                px: 1.5,
                fontSize: '0.82rem',
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' },
              }}
            >
              Not now
            </Button>
          </Box>
        )}
      </Paper>
    </Slide>
  );
}
