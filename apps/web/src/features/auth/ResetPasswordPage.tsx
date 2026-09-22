'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Container, TextField, Button, Typography, Paper, CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import { HomeWork, ArrowBack, Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { ResetPasswordSchema, type ResetPasswordInput } from '@rewa-bhoomi/validation';
import { apiPost } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token: token || '' },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      await apiPost('/auth/reset-password', data);
      toast.success('Password reset successfully. You can now log in.');
      router.push('/auth/login');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Failed to reset password. The link might be invalid or expired.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">Invalid or missing reset token.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1B4FD8 50%, #1338A8 100%)',
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2 },
      }}
    >
      <Box sx={{
        position: 'fixed', inset: 0, opacity: 0.04, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />

      <Container maxWidth="sm" sx={{ position: 'relative', px: { xs: 1, sm: 2 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3.5, md: 4 },
            borderRadius: { xs: 3, sm: 4 },
            boxShadow: '0 24px 64px rgba(15,23,42,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: { xs: 1.5, sm: 2.5 } }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #1B4FD8, #1338A8)',
              borderRadius: 1.5, p: 0.75, display: 'flex',
            }}>
              <HomeWork sx={{ color: 'white', fontSize: { xs: 22, sm: 26 } }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="text.primary" lineHeight={1} sx={{ fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                Rewa Bhoomi
              </Typography>
            </Box>
          </Box>

          <Typography fontWeight={800} sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem' }, mb: 0.2 }}>
            Create new password
          </Typography>
          <Typography color="text.secondary" sx={{ mb: { xs: 1.5, sm: 2.5 }, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
            Please enter your new password below.
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <input type="hidden" {...register('token')} />

            <TextField
              id="reset-password"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              size="small"
              autoComplete="new-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" size="small">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: { xs: 1.5, sm: 2.5 } }}
            />

            <Button
              id="reset-submit"
              type="submit"
              fullWidth
              variant="contained"
              size="medium"
              disabled={isLoading}
              sx={{ py: { xs: 1, sm: 1.25 }, fontSize: { xs: '0.88rem', sm: '0.95rem' }, borderRadius: 2 }}
            >
              {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Reset Password'}
            </Button>
          </form>

          <Box sx={{ mt: { xs: 1.5, sm: 2.5 } }}>
            <Button
              component={Link}
              href="/auth/login"
              startIcon={<ArrowBack fontSize="small" />}
              size="small"
              sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.82rem' }}
            >
              Back to sign in
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
