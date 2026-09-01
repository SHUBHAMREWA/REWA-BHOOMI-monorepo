'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Typography, Avatar, Grid, Paper, CircularProgress, Chip, Divider, Button, TextField, InputAdornment } from '@mui/material';
import { Person, CalendarToday, Email, Phone, VerifiedUser, ErrorOutline, Search } from '@mui/icons-material';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { apiGet } from '@/lib/api';
import PropertyCard from '@/features/properties/PropertyCard';
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter } from 'next/navigation';

interface AdminUserProfilePageProps {
  email: string;
}

export default function AdminUserProfilePage({ email }: AdminUserProfilePageProps) {
  const { user: authUser, isLoading: isAuthLoading } = useAuth();
  const isAdmin = authUser?.roles?.includes('ADMIN') || authUser?.roles?.includes('SUPER_ADMIN');
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTitle, setSearchTitle] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (isAuthLoading) return;
    
    if (!isAdmin) {
      setError('You are not authorized to view this page.');
      setIsLoading(false);
      return;
    }

    async function fetchProfileData() {
      setIsLoading(true);
      try {
        // Fetch detailed admin user info
        const usersData = await apiGet<any[]>(`/admin/users?search=${encodeURIComponent(email)}`);
        const foundUser = usersData.find((u) => u.email === email);
        
        if (!foundUser) {
          setError('User not found.');
          setIsLoading(false);
          return;
        }
        
        // Fetch user's properties
        const propertiesData = await apiGet<any[]>(`/users/properties/${encodeURIComponent(email)}`);
        
        setUser(foundUser);
        setProperties(propertiesData);
      } catch (err: any) {
        setError('Failed to load profile data.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfileData();
  }, [email, isAdmin, isAuthLoading]);

  // Derived state for filtering
  const filteredProperties = properties.filter(p => {
    let matchesSearch = true;
    let matchesDate = true;
    
    if (searchTitle) {
      matchesSearch = p.title?.toLowerCase().includes(searchTitle.toLowerCase());
    }
    
    if (fromDate) {
      matchesDate = matchesDate && isAfter(new Date(p.created_at || new Date()), startOfDay(new Date(fromDate)));
    }
    if (toDate) {
      matchesDate = matchesDate && isBefore(new Date(p.created_at || new Date()), endOfDay(new Date(toDate)));
    }
    
    return matchesSearch && matchesDate;
  });

  if (isLoading || isAuthLoading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <ErrorOutline sx={{ fontSize: 80, color: '#ef4444', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} color="#334155">{error}</Typography>
        <Button sx={{ mt: 3 }} variant="contained" onClick={() => router.push('/admin/users')}>Back to Admin</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pt: { xs: 4, md: 8 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Admin User View</Typography>
          <Button variant="outlined" size="small" onClick={() => router.push('/admin/users')}>Back to Admin Panel</Button>
        </Box>
        
        {/* Profile Header */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid #E2E8F0', mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' }, gap: 4 }}>
          <Avatar
            src={user.avatar_url || undefined}
            sx={{ width: { xs: 100, md: 140 }, height: { xs: 100, md: 140 }, border: '4px solid white', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
          >
            {!user.avatar_url && user.name.charAt(0).toUpperCase()}
          </Avatar>
          
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' }, width: '100%' }}>
            <Box display="flex" alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }} gap={2} mb={0.5}>
              <Typography variant="h4" fontWeight={800} color="#0F172A">
                {user.name}
              </Typography>
              <Chip 
                label={user.status} 
                size="small" 
                color={user.status === 'ACTIVE' ? 'success' : user.status === 'SUSPENDED' ? 'error' : 'default'} 
                sx={{ fontWeight: 700 }}
              />
              <Button
                variant="contained"
                size="small"
                color="primary"
                onClick={() => router.push(`/admin/chat?userId=${user.id}`)}
                sx={{ ml: 'auto', borderRadius: 8, textTransform: 'none', px: 3, fontWeight: 600 }}
              >
                Chat with User
              </Button>
            </Box>
            
            <Typography variant="subtitle1" color="#1B4FD8" fontWeight={600} mb={2}>
              {user.username ? `@${user.username}` : 'No username set'}
            </Typography>
            
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} color="#475569">
                  <Email fontSize="small" />
                  <Typography>{user.email}</Typography>
                  {user.is_email_verified && <VerifiedUser fontSize="small" color="success" sx={{ width: 16, height: 16 }} />}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} color="#475569">
                  <Phone fontSize="small" />
                  <Typography>{user.phone || 'No phone number'}</Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: 'wrap' }}>
              <Chip 
                icon={<CalendarToday sx={{ fontSize: 16 }} />} 
                label={`Joined ${format(new Date(user.created_at || new Date()), 'MMMM yyyy')}`}
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2 }}
              />
              <Chip 
                label={`${properties.length} Total Listings`}
                color="primary"
                size="small"
                sx={{ borderRadius: 2, fontWeight: 600 }}
              />
              <Chip 
                label={`${properties.filter(p => p.status === 'PUBLISHED').length} Live Listings`}
                color="success"
                size="small"
                variant="outlined"
                sx={{ borderRadius: 2, fontWeight: 600 }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Property Listings */}
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2} mb={3}>
          <Typography variant="h5" fontWeight={800} color="#0F172A">
            All Properties by {user.name}
          </Typography>
          
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              placeholder="Search by title..."
              size="small"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                sx: { bgcolor: 'white', borderRadius: 2 }
              }}
              sx={{ minWidth: 200 }}
            />
            <TextField
              type="date"
              size="small"
              label="From Date"
              InputLabelProps={{ shrink: true }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              sx={{ bgcolor: 'white', minWidth: 140 }}
            />
            <TextField
              type="date"
              size="small"
              label="To Date"
              InputLabelProps={{ shrink: true }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              sx={{ bgcolor: 'white', minWidth: 140 }}
            />
          </Box>
        </Box>
        
        {properties.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, borderRadius: 4, border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <Typography color="#64748B" fontWeight={500}>
              This user hasn't posted any properties yet.
            </Typography>
          </Paper>
        ) : filteredProperties.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, borderRadius: 4, border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <Typography color="#64748B" fontWeight={500}>
              No properties match your filters.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={{ xs: 1.2, sm: 2, md: 3 }}>
            {filteredProperties.map((property) => (
              <Grid item xs={6} sm={6} md={4} key={property.id}>
                <PropertyCard 
                  property={property} 
                  viewMode="grid" 
                  showStatusBadge={isAdmin} 
                  onEdit={() => router.push(`/properties/edit/${property.slug}`)} 
                />
              </Grid>
            ))}
          </Grid>
        )}

      </Container>
    </Box>
  );
}
