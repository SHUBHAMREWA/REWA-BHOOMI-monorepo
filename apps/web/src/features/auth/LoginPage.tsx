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
  const { login, loginWithGoogle, user, sendLoginOtp, loginWithOtp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auth view mode: 'none' (options only), 'password', 'otp'
  const [activeForm, setActiveForm] = useState<'none' | 'password' | 'otp'>('none');
  
  // OTP state
  const [otpStep, setOtpStep] = useState<'email' | 'verify'>('email');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect') ?? '/properties';
      router.replace(redirect);
    }
  }, [user, router, searchParams]);

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
      const redirect = searchParams.get('redirect') ?? '/properties';
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail) return toast.error('Please enter your email');
    setIsLoading(true);
    try {
      await sendLoginOtp(otpEmail);
      setOtpStep('verify');
      toast.success('OTP sent to your email');
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Failed to send OTP';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return toast.error('Please enter the OTP');
    setIsLoading(true);
    try {
      await loginWithOtp(otpEmail, otpCode);
      toast.success('Welcome back!');
      const redirect = searchParams.get('redirect') ?? '/properties';
      router.push(redirect);
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Invalid OTP';
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
      {/* Background pattern */}
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
          {/* Logo */}
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
            Welcome back
          </Typography>
          <Typography color="text.secondary" sx={{ mb: { xs: 1.5, sm: 2.5 }, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
            Sign in to your account to continue
          </Typography>

          {/* Google Sign In */}
          <Box sx={{ mb: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  setIsLoading(true);
                  try {
                    await loginWithGoogle(credentialResponse.credential);
                    toast.success('Welcome back!');
                    const redirect = searchParams.get('redirect') ?? '/properties';
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
              width="340"
              text="signin_with"
            />
          </Box>

          <Divider sx={{ mb: { xs: 2, sm: 2.5 } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.7rem', letterSpacing: 0.5 }}>
              OR OTHER LOGIN OPTIONS
            </Typography>
          </Divider>

          {activeForm === 'none' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Button
                fullWidth
                variant="outlined"
                size="medium"
                onClick={() => setActiveForm('otp')}
                sx={{
                  py: { xs: 1, sm: 1.1 },
                  fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  borderRadius: 2,
                  color: '#334155',
                  borderColor: '#CBD5E1',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
                }}
              >
                Login with OTP
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="medium"
                onClick={() => setActiveForm('password')}
                sx={{
                  py: { xs: 1, sm: 1.1 },
                  fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  borderRadius: 2,
                  color: '#64748B',
                  borderColor: '#E2E8F0',
                  fontWeight: 500,
                  textTransform: 'none',
                  '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' },
                }}
              >
                Login with Email & Password
              </Button>
            </Box>
          )}

          {activeForm === 'password' && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                id="login-email"
                label="Email address"
                type="email"
                fullWidth
                size="small"
                autoComplete="email"
                autoFocus
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: { xs: 1.25, sm: 2 } }}
              />

              <TextField
                id="login-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                size="small"
                autoComplete="current-password"
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
                sx={{ mb: 0.5 }}
              />

              <Box sx={{ textAlign: 'right', mb: { xs: 1.5, sm: 2 } }}>
                <Typography
                  component={Link}
                  href="/auth/forgot-password"
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: 600, fontSize: { xs: '0.78rem', sm: '0.85rem' }, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Forgot password?
                </Typography>
              </Box>

              <Button
                id="login-submit"
                type="submit"
                fullWidth
                variant="contained"
                size="medium"
                disabled={isLoading}
                sx={{ py: { xs: 1, sm: 1.25 }, fontSize: { xs: '0.88rem', sm: '0.95rem' }, borderRadius: 2, mb: 1 }}
              >
                {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
              </Button>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => setActiveForm('otp')}
                  sx={{ py: 0.75, fontSize: '0.8rem', borderRadius: 2 }}
                >
                  Login with OTP
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  onClick={() => setActiveForm('none')}
                  sx={{ py: 0.75, fontSize: '0.8rem', color: 'text.secondary' }}
                >
                  Back
                </Button>
              </Box>
            </form>
          )}

          {activeForm === 'otp' && (
            <form onSubmit={otpStep === 'email' ? handleSendOtp : handleVerifyOtp} noValidate>
              <TextField
                id="otp-email"
                label="Email address"
                type="email"
                fullWidth
                size="small"
                autoFocus
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                disabled={otpStep === 'verify'}
                sx={{ mb: { xs: 1.25, sm: 2 } }}
              />

              {otpStep === 'verify' && (
                <TextField
                  id="otp-code"
                  label="6-digit OTP"
                  type="text"
                  fullWidth
                  size="small"
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  sx={{ mb: { xs: 1.5, sm: 2 } }}
                />
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="medium"
                disabled={isLoading || (otpStep === 'verify' && otpCode.length !== 6)}
                sx={{ py: { xs: 1, sm: 1.25 }, fontSize: { xs: '0.88rem', sm: '0.95rem' }, borderRadius: 2, mb: 1 }}
              >
                {isLoading ? <CircularProgress size={20} color="inherit" /> : otpStep === 'email' ? 'Send OTP' : 'Verify & Sign In'}
              </Button>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => setActiveForm('password')}
                  sx={{ py: 0.75, fontSize: '0.8rem', borderRadius: 2 }}
                >
                  Login with Email & Password
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  onClick={() => {
                    setActiveForm('none');
                    setOtpStep('email');
                  }}
                  sx={{ py: 0.75, fontSize: '0.8rem', color: 'text.secondary' }}
                >
                  Back
                </Button>
              </Box>
            </form>
          )}

          <Typography variant="body2" textAlign="center" sx={{ mt: { xs: 1.5, sm: 2.5 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }} color="text.secondary">
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
