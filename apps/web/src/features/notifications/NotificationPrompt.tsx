'use client';

import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Button, Box, Typography } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { usePushNotifications } from './usePushNotifications';

export default function NotificationPrompt() {
  const { isSupported, isSubscribed, enableNotifications } = usePushNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // In PWA standalone mode (app installed on home screen), prompt faster
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    // Show prompt if notifications permission is default/not granted and user hasn't dismissed it this session
    const dismissed = sessionStorage.getItem('notif_prompt_dismissed');
    if (Notification.permission !== 'granted' && !dismissed && !isSubscribed) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, isStandalone ? 1200 : 2500);
      return () => clearTimeout(timer);
    }
  }, [isSupported, isSubscribed]);

  // Listen for custom trigger (e.g. immediately after PWA install)
  useEffect(() => {
    const handleTrigger = () => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
        sessionStorage.removeItem('notif_prompt_dismissed');
        setOpen(true);
      }
    };

    window.addEventListener('rewa_trigger_notif_prompt', handleTrigger);
    return () => window.removeEventListener('rewa_trigger_notif_prompt', handleTrigger);
  }, []);

  const handleEnable = async () => {
    setOpen(false);
    sessionStorage.setItem('notif_prompt_dismissed', 'true');
    await enableNotifications();
  };

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem('notif_prompt_dismissed', 'true');
  };

  if (!open) return null;

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 85, sm: 30 }, zIndex: 1350 }}
    >
      <Alert
        severity="info"
        icon={<NotificationsActiveIcon sx={{ color: '#1B4FD8' }} />}
        onClose={handleClose}
        action={
          <Button
            variant="contained"
            size="small"
            onClick={handleEnable}
            sx={{
              bgcolor: '#1B4FD8',
              color: 'white',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              ml: 1,
              '&:hover': { bgcolor: '#1D4ED8' }
            }}
          >
            Enable Alerts
          </Button>
        }
        sx={{
          bgcolor: '#FFFFFF',
          color: '#0F172A',
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          borderRadius: 3,
          border: '1px solid #E2E8F0',
          fontWeight: 600,
          alignItems: 'center',
          maxWidth: 480
        }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="#0F172A">
            Turn on property alerts
          </Typography>
          <Typography variant="caption" color="#64748B" display="block">
            Get instant alerts when new properties are listed in Rewa — even when the app is closed.
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
}
