'use client';

import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Button, Box, Typography } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useAuth } from '@/features/auth/AuthContext';
import { usePushNotifications } from './usePushNotifications';

export default function NotificationPrompt() {
  const { isAuthenticated } = useAuth();
  const { isSupported, isSubscribed, enableNotifications } = usePushNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isSupported) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Show prompt if notifications permission is default/not granted and user hasn't dismissed it this session
    const dismissed = sessionStorage.getItem('notif_login_prompt_dismissed');
    if (Notification.permission !== 'granted' && !dismissed && !isSubscribed) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isSupported, isSubscribed]);

  const handleEnable = async () => {
    setOpen(false);
    sessionStorage.setItem('notif_login_prompt_dismissed', 'true');
    await enableNotifications();
  };

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem('notif_login_prompt_dismissed', 'true');
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
            Enable Notifications
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
            Turn on chat notifications
          </Typography>
          <Typography variant="caption" color="#64748B" display="block">
            Get instant alerts when admin or buyers reply — even when the app is closed.
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
}
