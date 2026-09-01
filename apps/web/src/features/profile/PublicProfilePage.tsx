'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Typography, Avatar, Grid, Paper, CircularProgress, Chip, Button } from '@mui/material';
import { Person, CalendarToday, Chat, Share } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { apiClient } from '@/lib/api';
import PropertyCard from '@/features/properties/PropertyCard';
import { useAuth } from '@/features/auth/AuthContext';
import type { User } from '@rewa-bhoomi/types';

interface PublicProfilePageProps {
  username: string;
}

export default function PublicProfilePage({ username }: PublicProfilePageProps) {
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.roles?.includes('ADMIN') || authUser?.roles?.includes('SUPER_ADMIN');
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleShare = () => {
    const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      navigator.share({
        title: `${user?.name || 'User'} - Rewa Bhoomi Profile`,
        text: `Check out ${user?.name || 'this profile'} on Rewa Bhoomi!`,
        url: profileUrl,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied to clipboard!');
    }
  };

  useEffect(() => {
    async function fetchProfileData() {
      setIsLoading(true);
      try {
        const [profileRes, propertiesRes] = await Promise.all([
          apiClient.get(`/users/profile/${username}`),
          apiClient.get(`/users/properties/${username}`),
        ]);
        
        setUser(profileRes.data.data);
        setProperties(propertiesRes.data.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('User not found.');
        } else {
          setError('Failed to load profile.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfileData();
  }, [username]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Person sx={{ fontSize: 80, color: '#CBD5E1', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} color="#334155">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pt: { xs: 4, md: 8 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 } }}>
        
        {/* Profile Header */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid #E2E8F0', mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' }, gap: 4 }}>
          <Avatar
            src={user.avatar_url || undefined}
            sx={{ width: { xs: 100, md: 140 }, height: { xs: 100, md: 140 }, border: '4px solid white', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
          >
            {!user.avatar_url && user.name.charAt(0).toUpperCase()}
          </Avatar>
          
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h4" fontWeight={800} color="#0F172A" mb={0.5}>
              {user.name}
            </Typography>
            <Typography variant="subtitle1" color="#1B4FD8" fontWeight={600} mb={2}>
              @{user.username}
            </Typography>
            
            {user.bio && (
              <Typography color="#475569" mb={3} sx={{ maxWidth: 600, mx: { xs: 'auto', md: 0 } }}>
                {user.bio}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' }, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip 
                icon={<CalendarToday sx={{ fontSize: 16 }} />} 
                label={`Joined ${format(new Date(user.createdAt || (user as any).created_at || new Date()), 'MMMM yyyy')}`}
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2 }}
              />
              <Chip 
                label={`${properties.length} Active Listings`}
                color="primary"
                size="small"
                sx={{ borderRadius: 2, fontWeight: 600 }}
              />
              {authUser?.id !== user.id && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Chat sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    if (isAdmin) {
                      window.location.href = `/admin/chat?userId=${user.id}`;
                    } else {
                      window.dispatchEvent(new CustomEvent('open-chat', { detail: { userId: user.id } }));
                    }
                  }}
                  sx={{
                    bgcolor: '#1B4FD8',
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2,
                    py: 0.6,
                    '&:hover': { bgcolor: '#1640B0' }
                  }}
                >
                  Chat with {user.name.split(' ')[0]}
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<Share sx={{ fontSize: 16 }} />}
                onClick={handleShare}
                sx={{
                  borderColor: '#1B4FD8',
                  color: '#1B4FD8',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 2,
                  py: 0.6,
                  '&:hover': { bgcolor: 'rgba(27, 79, 216, 0.08)', borderColor: '#1640B0' }
                }}
              >
                Share
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Property Listings */}
        <Typography variant="h5" fontWeight={800} color="#0F172A" mb={3}>
          Listings by {user.name}
        </Typography>
        
        {properties.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, borderRadius: 4, border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <Typography color="#64748B" fontWeight={500}>
              This user hasn't published any properties yet.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={{ xs: 1.2, sm: 2, md: 3 }}>
            {properties.map((property) => (
              <Grid item xs={6} sm={6} md={4} key={property.id}>
                <PropertyCard property={property} viewMode="grid" showStatusBadge={isAdmin} />
              </Grid>
            ))}
          </Grid>
        )}

      </Container>
    </Box>
  );
}
