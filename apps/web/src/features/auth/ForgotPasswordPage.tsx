'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box, Container, TextField, Button, Typography, Paper, CircularProgress
} from '@mui/material';
import { HomeWork, ArrowBack } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@rewa-bhoomi/validation';
import { apiPost } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(ForgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      await apiPost('/auth/forgot-password', data);
      setIsSent(true);
      toast.success('Reset link sent to your email');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Failed to send reset link.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1B4FD8 50%, #1338A8 100%)',
        py: 4,
      }}
    >
      <Box sx={{
        position: 'fixed', inset: 0, opacity: 0.04, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />

      <Container maxWidth="sm" sx={{ position: 'relative' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            boxShadow: '0 24px 64px rgba(15,23,42,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #1B4FD8, #1338A8)',
              borderRadius: 2, p: 1, display: 'flex',
            }}>
              <HomeWork sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="text.primary" lineHeight={1}>
                Rewa Bhoomi
              </Typography>
            </Box>
          </Box>

          <Typography variant="h4" fontWeight={800} gutterBottom>
            Reset Password
          </Typography>

          {!isSent ? (
            <>
              <Typography color="text.secondary" sx={{ mb: 4 }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </Typography>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <TextField
                  id="forgot-email"
                  label="Email address"
                  type="email"
                  fullWidth
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{ mb: 3 }}
                />

                <Button
                  id="forgot-submit"
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ py: 1.75, fontSize: '1rem', borderRadius: 2.5 }}
                >
                  {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Link'}
                </Button>
              </form>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                Check your email
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>
                We have sent a password reset link to your email address.
                Please check your inbox (and spam folder) and click the link to continue.
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 4 }}>
            <Button
              component={Link}
              href="/auth/login"
              startIcon={<ArrowBack />}
              sx={{ fontWeight: 600, color: 'text.secondary' }}
            >
              Back to sign in
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
