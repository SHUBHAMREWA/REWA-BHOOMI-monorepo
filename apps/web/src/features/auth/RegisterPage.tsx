'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Container, TextField, Button, Typography, Paper,
  InputAdornment, IconButton, CircularProgress, Divider, Grid
} from '@mui/material';
import { Visibility, VisibilityOff, HomeWork, Google } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { RegisterSchema, type RegisterInput } from '@rewa-bhoomi/validation';
import { apiPost } from '@/lib/api';
import { useAuth } from './AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshAuth, loginWithGoogle, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/properties');
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      await apiPost('/auth/register', data);
      await refreshAuth();
      toast.success('Account created successfully!');
      router.push('/properties');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Registration failed. Please try again.';
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
            p: { xs: 2.25, sm: 3.5, md: 4 },
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
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                Real Estate Platform
              </Typography>
            </Box>
          </Box>

          <Typography fontWeight={800} sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem' }, mb: 0.2 }}>
            Create an account
          </Typography>
          <Typography color="text.secondary" sx={{ mb: { xs: 1.5, sm: 2.5 }, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
            Join thousands of users finding their dream property
          </Typography>

          <Box sx={{ mb: { xs: 1.5, sm: 2.5 }, display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  setIsLoading(true);
                  try {
                    await loginWithGoogle(credentialResponse.credential);
                    toast.success('Account linked & logged in successfully!');
                    router.push('/properties');
                  } catch (err: any) {
                    const message = err?.response?.data?.error?.message ?? 'Google signup failed';
                    toast.error(message);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              onError={() => {
                toast.error('Google Sign Up failed');
              }}
              shape="rectangular"
              size="medium"
              width="320"
              text="signup_with"
            />
          </Box>

          <Divider sx={{ mb: { xs: 1.5, sm: 2.5 } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.7rem' }}>
              OR REGISTER WITH EMAIL
            </Typography>
          </Divider>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={{ xs: 1.25, sm: 2 }} sx={{ mb: { xs: 1.25, sm: 2 } }}>
              <Grid item xs={12}>
                <TextField
                  id="register-name"
                  label="Full Name"
                  fullWidth
                  size="small"
                  autoComplete="name"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="register-email"
                  label="Email address"
                  type="email"
                  fullWidth
                  size="small"
                  autoComplete="email"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="register-phone"
                  label="Phone Number"
                  type="tel"
                  fullWidth
                  size="small"
                  autoComplete="tel"
                  {...register('phone')}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="register-password"
                  label="Password"
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
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="register-confirm-password"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  size="small"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                />
              </Grid>
            </Grid>

            <Button
              id="register-submit"
              type="submit"
              fullWidth
              variant="contained"
              size="medium"
              disabled={isLoading}
              sx={{ py: { xs: 1, sm: 1.25 }, fontSize: { xs: '0.88rem', sm: '0.95rem' }, borderRadius: 2, mt: { xs: 0.5, sm: 1 } }}
            >
              {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Create Account'}
            </Button>
          </form>

          <Typography variant="body2" textAlign="center" sx={{ mt: { xs: 1.5, sm: 2.5 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }} color="text.secondary">
            Already have an account?{' '}
            <Typography
              component={Link}
              href="/auth/login"
              variant="body2"
              color="primary"
              fontWeight={700}
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Sign in
            </Typography>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
