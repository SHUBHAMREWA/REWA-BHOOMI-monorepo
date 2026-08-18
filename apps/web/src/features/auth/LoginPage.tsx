'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Container, TextField, Button, Typography, Paper,
  InputAdornment, IconButton, CircularProgress, Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, HomeWork, Google } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { LoginSchema, type LoginInput } from '@rewa-bhoomi/validation';
import { useAuth } from './AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, user } = useAuth();
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
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      const redirect = searchParams.get('redirect') ?? '/dashboard';
      router.push(redirect);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Login failed. Please try again.';
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
      {/* Background pattern */}
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
          {/* Logo */}
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
            Welcome back
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Sign in to your account to continue
          </Typography>

          {/* Google Sign In */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  setIsLoading(true);
                  try {
                    await loginWithGoogle(credentialResponse.credential);
                    toast.success('Welcome back!');
                    const redirect = searchParams.get('redirect') ?? '/dashboard';
                    router.push(redirect);
                  } catch (err: any) {
                    const message = err?.response?.data?.error?.message ?? 'Google login failed';
                    toast.error(message);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              onError={() => {
                toast.error('Google Sign In failed');
              }}
              shape="rectangular"
              size="large"
              width="350"
              text="continue_with"
            />
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              OR SIGN IN WITH EMAIL
            </Typography>
          </Divider>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              id="login-email"
              label="Email address"
              type="email"
              fullWidth
              autoComplete="email"
              autoFocus
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2.5 }}
            />

            <TextField
              id="login-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" size="small">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            <Box sx={{ textAlign: 'right', mb: 3 }}>
              <Typography
                component={Link}
                href="/auth/forgot-password"
                variant="body2"
                color="primary"
                sx={{ fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Forgot password?
              </Typography>
            </Box>

            <Button
              id="login-submit"
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ py: 1.75, fontSize: '1rem', borderRadius: 2.5 }}
            >
              {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          <Typography variant="body2" textAlign="center" sx={{ mt: 3 }} color="text.secondary">
            Don&apos;t have an account?{' '}
            <Typography
              component={Link}
              href="/auth/register"
              variant="body2"
              color="primary"
              fontWeight={700}
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Create one free
            </Typography>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
