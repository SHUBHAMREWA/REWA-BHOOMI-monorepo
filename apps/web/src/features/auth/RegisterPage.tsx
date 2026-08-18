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
      router.replace('/profile');
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
      router.push('/dashboard');
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
              <Typography variant="caption" color="text.secondary">
                Real Estate Platform
              </Typography>
            </Box>
          </Box>

          <Typography variant="h4" fontWeight={800} gutterBottom>
            Create an account
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Join thousands of users finding their dream property
          </Typography>

          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  setIsLoading(true);
                  try {
                    await loginWithGoogle(credentialResponse.credential);
                    toast.success('Account linked & logged in successfully!');
                    router.push('/dashboard');
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
              size="large"
              width="350"
              text="continue_with"
            />
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              OR REGISTER WITH EMAIL
            </Typography>
          </Divider>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12}>
                <TextField
                  id="register-name"
                  label="Full Name"
                  fullWidth
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
                  autoComplete="tel"
                  {...register('phone')}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="register-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
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
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="register-confirm-password"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
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
              size="large"
              disabled={isLoading}
              sx={{ py: 1.75, fontSize: '1rem', borderRadius: 2.5, mt: 2 }}
            >
              {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
            </Button>
          </form>

          <Typography variant="body2" textAlign="center" sx={{ mt: 3 }} color="text.secondary">
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
