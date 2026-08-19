'use client';

import { useRouter } from 'next/navigation';
import { Box, Typography, Button, Paper } from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PropertyPostingWizard from './PropertyPostingWizard';
import { useAuth } from '@/features/auth/AuthContext';

export default function CreatePropertyPage({ propertyId }: { propertyId?: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#F8FAFC',
          px: 2,
          pt: 8,
          pb: 6,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 480,
            width: '100%',
            borderRadius: 4,
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          {/* Top Banner */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1B4FD8 0%, #3B82F6 100%)',
              py: 5,
              px: 3,
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
              }}
            >
              <HomeWorkIcon sx={{ fontSize: 36, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight={800} color="white" mb={1}>
              Apni Property List Karein
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
              Rewa Bhoomi ke #1 Real Estate Platform par
            </Typography>
          </Box>

          {/* Content */}
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 2.5,
                bgcolor: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: 2,
                px: 2.5,
                py: 1.5,
              }}
            >
              <LockOutlinedIcon sx={{ fontSize: 18, color: '#EF4444' }} />
              <Typography variant="body2" color="#EF4444" fontWeight={600}>
                Property post karne ke liye pehle login karein
              </Typography>
            </Box>

            <Typography color="text.secondary" fontSize="0.9rem" mb={3.5} lineHeight={1.7}>
              Apni zameen, ghar, plot ya commercial property list karne ke liye account mein
              login karna zaroori hai. Login ke baad aap seedha property post kar sakte hain.
            </Typography>

            {/* Features */}
            {[
              '✅ 0% Commission & Brokerage',
              '🏠 Direct Buyer se Connection',
              '📊 Free Property Listing',
            ].map((f) => (
              <Box
                key={f}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1,
                  px: 1.5,
                  py: 0.75,
                  bgcolor: '#F8FAFC',
                  borderRadius: 2,
                  border: '1px solid #E2E8F0',
                }}
              >
                <Typography variant="body2" fontWeight={500} color="#334155">
                  {f}
                </Typography>
              </Box>
            ))}

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => router.push('/auth/login?redirect=/properties/create')}
              sx={{
                mt: 3,
                py: 1.4,
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #1B4FD8, #3B82F6)',
                boxShadow: '0 8px 20px -6px rgba(27,79,216,0.5)',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1D4ED8, #2563EB)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 24px -6px rgba(27,79,216,0.6)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Login Karein & Property Post Karein
            </Button>

            <Button
              variant="text"
              fullWidth
              onClick={() => router.push('/auth/register?redirect=/properties/create')}
              sx={{ mt: 1.5, textTransform: 'none', color: '#64748B', fontWeight: 500 }}
            >
              Account nahi hai?{' '}
              <Box component="span" sx={{ color: '#1B4FD8', fontWeight: 700, ml: 0.5 }}>
                Abhi Register Karein
              </Box>
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return <PropertyPostingWizard propertyId={propertyId} />;
}
