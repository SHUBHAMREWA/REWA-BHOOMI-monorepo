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
            Reset Password
          </Typography>

          {!isSent ? (
            <>
              <Typography color="text.secondary" sx={{ mb: { xs: 1.5, sm: 2.5 }, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </Typography>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <TextField
                  id="forgot-email"
                  label="Email address"
                  type="email"
                  fullWidth
                  size="small"
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{ mb: { xs: 1.5, sm: 2.5 } }}
                />

                <Button
                  id="forgot-submit"
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="medium"
                  disabled={isLoading}
                  sx={{ py: { xs: 1, sm: 1.25 }, fontSize: { xs: '0.88rem', sm: '0.95rem' }, borderRadius: 2 }}
                >
                  {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Send Reset Link'}
                </Button>
              </form>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h6" color="success.main" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mb: 1 }}>
                Check your email
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                We have sent a password reset link to your email address.
                Please check your inbox (and spam folder) and click the link to continue.
              </Typography>
            </Box>
          )}

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
