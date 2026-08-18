'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Container, Typography, Paper, Grid, TextField, Button,
  CircularProgress, Avatar, Divider, Tabs, Tab, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Chip,
  useTheme, useMediaQuery
} from '@mui/material';
import { PhotoCamera, Security, Person, MapsHomeWork, Favorite, Edit, Delete, MoreVert } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { UpdateProfileSchema, type UpdateProfileInput } from '@rewa-bhoomi/validation';
import { useAuth } from '../auth/AuthContext';
import { apiPatch, apiClient } from '@/lib/api';
import PropertyCard from '@/features/properties/PropertyCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: { xs: 1.5, md: 4 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, refreshAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get('tab') === 'favorites' ? 3 : searchParams.get('tab') === 'properties' ? 2 : 0;
  const [tabValue, setTabValue] = useState(initialTab);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Listings State
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  // Favorites State
  const [favoriteProperties, setFavoriteProperties] = useState<any[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  
  // Menu State for Property Cards
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedPropertySlug, setSelectedPropertySlug] = useState<string | null>(null);
  
  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
  });

  const currentAvatarUrl = watch('avatar_url');
  const watchUsername = watch('username');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    reset({
      name: user.name,
      username: user.username || '',
      bio: user.bio || '',
      phone: user.phone || '',
      avatar_url: user.avatar_url,
    });
  }, [user, reset, router]);

  // Username availability check (debounced)
  useEffect(() => {
    if (!watchUsername || watchUsername === user?.username) {
      setUsernameStatus('idle');
      return;
    }
    if (watchUsername.length < 3 || !/^[a-zA-Z0-9_]+$/.test(watchUsername)) {
      setUsernameStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const res = await apiClient.get(`/auth/check-username/${watchUsername}`);
        if (res.data.data.available) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus('taken');
        }
      } catch (err) {
        setUsernameStatus('idle');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [watchUsername, user?.username]);

  // Sync tab from URL if changed
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'favorites') setTabValue(3);
    else if (tabParam === 'properties') setTabValue(2);
  }, [searchParams]);

  // Fetch user listings
  useEffect(() => {
    if (tabValue === 2 && user && myProperties.length === 0) {
      setIsLoadingProperties(true);
      apiClient.get('/properties/me/listings')
        .then(res => {
          const result = res.data.data;
          setMyProperties(result?.items || result?.data || []);
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoadingProperties(false));
    }
  }, [tabValue, user, myProperties.length]);

  // Fetch favorite properties
  useEffect(() => {
    if (tabValue === 3 && user) {
      setIsLoadingFavorites(true);
      apiClient.get('/properties/me/favorites')
        .then(res => {
          const result = res.data.data;
          setFavoriteProperties(result?.data || result?.items || []);
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoadingFavorites(false));
    }
  }, [tabValue, user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 3) router.replace('/profile?tab=favorites');
    else if (newValue === 2) router.replace('/profile?tab=properties');
    else router.replace('/profile');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, propertyId: string, propertySlug: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPropertyId(propertyId);
    setSelectedPropertySlug(propertySlug);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    if (selectedPropertySlug) {
      router.push(`/properties/edit/${selectedPropertySlug}`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (!selectedPropertyId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/properties/${selectedPropertyId}`);
      toast.success('Property deleted successfully');
      setMyProperties(prev => prev.filter(p => p.id !== selectedPropertyId));
    } catch (error) {
      toast.error('Failed to delete property');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedPropertyId(null);
      setSelectedPropertySlug(null);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image must be less than 5MB');
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newAvatarUrl = response.data.data.url;
      setValue('avatar_url', newAvatarUrl, { shouldDirty: true });
      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsSaving(true);
    try {
      await apiPatch('/auth/me', data);
      await refreshAuth();
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pt: { xs: 3.5, md: 8 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ mb: { xs: 2, md: 6 } }}>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ fontSize: { xs: '1.3rem', md: '2.1rem' } }}>
            Account Dashboard
          </Typography>
          <Typography color="#64748B" sx={{ mt: { xs: 0.3, md: 1 }, fontSize: { xs: '0.8rem', md: '1rem' } }}>
            Manage your saved properties, active listings, and personal profile.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2, md: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: { xs: 3, md: 4 }, border: '1px solid #E2E8F0', mb: { xs: 1.5, md: 0 } }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, alignItems: 'center', textAlign: { xs: 'left', md: 'center' }, gap: { xs: 2, md: 0 } }}>
                <Box sx={{ position: 'relative', mb: { xs: 0, md: 3 }, flexShrink: 0 }}>
                  <Avatar
                    src={currentAvatarUrl || undefined}
                    sx={{ width: { xs: 72, md: 140 }, height: { xs: 72, md: 140 }, border: '3px solid white', boxShadow: '0 6px 18px rgba(0,0,0,0.1)' }}
                  >
                    {!currentAvatarUrl && user.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <input
                    accept="image/*"
                    type="file"
                    id="avatar-upload"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                  />
                  <label htmlFor="avatar-upload">
                    <IconButton
                      component="span"
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: '#1B4FD8',
                        color: 'white',
                        p: { xs: 0.4, md: 0.8 },
                        '&:hover': { bgcolor: '#1D4ED8' },
                        boxShadow: '0 4px 10px rgba(27, 79, 216, 0.4)'
                      }}
                      disabled={isUploading}
                    >
                      {isUploading ? <CircularProgress size={16} color="inherit" /> : <PhotoCamera sx={{ fontSize: { xs: 16, md: 20 } }} />}
                    </IconButton>
                  </label>
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} color="#0F172A" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" color="#64748B" sx={{ fontSize: { xs: '0.78rem', md: '0.88rem' }, mb: 0.5 }}>
                    {user.email}
                  </Typography>
                  <Box sx={{ display: 'inline-flex', px: 1.5, py: 0.2, bgcolor: 'rgba(27, 79, 216, 0.1)', color: '#1B4FD8', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, mt: 0.5 }}>
                    {user.roles.includes('ADMIN') ? 'ADMINISTRATOR' : 'USER'}
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: { xs: 1.5, md: 4 } }} />
              
              <Tabs
                orientation={isMobile ? 'horizontal' : 'vertical'}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                value={tabValue}
                onChange={handleTabChange}
                sx={{
                  borderRight: isMobile ? 0 : 1,
                  borderBottom: isMobile ? 1 : 0,
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    alignItems: 'center',
                    justify: isMobile ? 'center' : 'flex-start',
                    py: { xs: 1, md: 2 },
                    px: { xs: 1.5, md: 3 },
                    borderRadius: 2,
                    mb: { xs: 0, md: 1 },
                    mr: { xs: 1, md: 0 },
                    fontSize: { xs: '0.78rem', md: '0.88rem' },
                    minHeight: { xs: 38, md: 48 },
                    whiteSpace: 'nowrap',
                  },
                  '& .Mui-selected': { bgcolor: 'rgba(27, 79, 216, 0.08)', color: '#1B4FD8 !important', fontWeight: 700 }
                }}
              >
                <Tab icon={<Person sx={{ mr: 0.8, fontSize: { xs: 18, md: 22 } }} />} iconPosition="start" label="Profile Details" />
                <Tab icon={<Security sx={{ mr: 0.8, fontSize: { xs: 18, md: 22 } }} />} iconPosition="start" label="Security" />
                <Tab icon={<MapsHomeWork sx={{ mr: 0.8, fontSize: { xs: 18, md: 22 } }} />} iconPosition="start" label="My Properties" />
                <Tab icon={<Favorite sx={{ mr: 0.8, color: '#EF4444', fontSize: { xs: 18, md: 22 } }} />} iconPosition="start" label="Saved Properties" />
              </Tabs>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 3, md: 4 }, border: '1px solid #E2E8F0', minHeight: { xs: 300, md: 500 } }}>
              
              {/* PROFILE TAB */}
              <CustomTabPanel value={tabValue} index={0}>
                <Box sx={{ px: { xs: 2, sm: 4 } }}>
                  <Typography variant="h6" fontWeight={700} mb={4}>Personal Information</Typography>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Full Name"
                          fullWidth
                          {...register('name')}
                          error={!!errors.name}
                          helperText={errors.name?.message}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Email Address"
                          fullWidth
                          value={user.email}
                          disabled
                          helperText="Email address cannot be changed."
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Username"
                          fullWidth
                          {...register('username')}
                          error={!!errors.username || usernameStatus === 'taken'}
                          helperText={
                            errors.username?.message ||
                            (usernameStatus === 'checking' && 'Checking availability...') ||
                            (usernameStatus === 'available' && '✓ Username is available!') ||
                            (usernameStatus === 'taken' && 'Username is already taken.') ||
                            'Unique profile URL: /u/username'
                          }
                          FormHelperTextProps={{
                            sx: { color: usernameStatus === 'available' ? 'success.main' : undefined }
                          }}
                          InputProps={{
                            endAdornment: usernameStatus === 'checking' ? <CircularProgress size={20} /> : null
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Phone Number"
                          fullWidth
                          {...register('phone')}
                          error={!!errors.phone}
                          helperText={errors.phone?.message}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Bio"
                          fullWidth
                          multiline
                          rows={3}
                          {...register('bio')}
                          error={!!errors.bio}
                          helperText={errors.bio?.message || 'A short description about yourself'}
                        />
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={isSaving}
                        sx={{
                          bgcolor: '#1B4FD8', px: 4, borderRadius: 2, textTransform: 'none', fontWeight: 600,
                          boxShadow: '0 4px 14px rgba(27, 79, 216, 0.3)',
                          '&:hover': { bgcolor: '#1D4ED8' }
                        }}
                      >
                        {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                      </Button>
                    </Box>
                  </form>
                </Box>
              </CustomTabPanel>

              {/* SECURITY TAB */}
              <CustomTabPanel value={tabValue} index={1}>
                <Box sx={{ px: { xs: 2, sm: 4 } }}>
                  <Typography variant="h6" fontWeight={700} mb={4}>Security Settings</Typography>
                  <Typography color="text.secondary" mb={3}>
                    To change your password, please request a password reset email to your registered email address.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => router.push('/auth/forgot-password')}
                  >
                    Reset Password
                  </Button>
                </Box>
              </CustomTabPanel>

              {/* MY PROPERTIES TAB */}
              <CustomTabPanel value={tabValue} index={2}>
                <Box sx={{ px: { xs: 2, sm: 4 }, py: 1 }}>
                  <Typography variant="h6" fontWeight={700} mb={4}>My Listings</Typography>
                  
                  {isLoadingProperties ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                      <CircularProgress />
                    </Box>
                  ) : myProperties.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <MapsHomeWork sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} />
                      <Typography variant="h6" fontWeight={700} color="#334155">No Listed Properties</Typography>
                      <Typography color="text.secondary" mt={1} mb={4}>
                        You haven't listed any properties yet.
                      </Typography>
                      <Button variant="contained" sx={{ bgcolor: '#1B4FD8' }} onClick={() => router.push('/properties/create')}>
                        Post a Property
                      </Button>
                    </Box>
                  ) : (
                    <Grid container spacing={3}>
                      {myProperties.map((property: any) => (
                        <Grid item xs={12} sm={6} key={property.id}>
                          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                            <Box sx={{ height: 160, bgcolor: '#F1F5F9', position: 'relative' }}>
                              {property.thumbnail ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={property.thumbnail} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                  <MapsHomeWork sx={{ fontSize: 40, color: '#94A3B8' }} />
                                </Box>
                              )}
                              <Box sx={{ position: 'absolute', top: 12, right: 12, bgcolor: property.status === 'PUBLISHED' ? '#22C55E' : '#EAB308', color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600 }}>
                                {property.status}
                              </Box>
                              <IconButton
                                onClick={(e) => handleMenuOpen(e, property.id, property.slug)}
                                sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' } }}
                                size="small"
                              >
                                <MoreVert fontSize="small" />
                              </IconButton>
                            </Box>
                            <Box sx={{ p: 2 }}>
                              <Typography variant="subtitle1" fontWeight={700} noWrap>{property.title}</Typography>
                              <Typography variant="body2" color="text.secondary" noWrap mb={1}>{property.city}, {property.state}</Typography>
                              <Typography variant="h6" color="#1B4FD8" fontWeight={700}>₹{property.price.toLocaleString()}</Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </CustomTabPanel>

              {/* SAVED / FAVORITES TAB */}
              <CustomTabPanel value={tabValue} index={3}>
                <Box sx={{ px: { xs: 2, sm: 4 }, py: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="#0F172A">
                      Saved Properties
                    </Typography>
                    <Chip label={`${favoriteProperties.length} Saved`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  </Box>
                  
                  {isLoadingFavorites ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                      <CircularProgress />
                    </Box>
                  ) : favoriteProperties.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Favorite sx={{ fontSize: 64, color: '#FCA5A5', mb: 2 }} />
                      <Typography variant="h6" fontWeight={700} color="#334155">No Saved Properties Yet</Typography>
                      <Typography color="text.secondary" mt={1} mb={4}>
                        Click the heart icon on any property card to save it for easy access later.
                      </Typography>
                      <Button variant="contained" sx={{ bgcolor: '#1B4FD8' }} onClick={() => router.push('/properties')}>
                        Explore Properties
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {favoriteProperties.map((property: any) => (
                        <PropertyCard key={property.id} property={property} viewMode="list" />
                      ))}
                    </Box>
                  )}
                </Box>
              </CustomTabPanel>

              {/* Property Menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleEditClick}>
                  <Edit fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> Edit
                </MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                  <Delete fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> Delete
                </MenuItem>
              </Menu>

              {/* Delete Confirmation Dialog */}
              <Dialog open={deleteDialogOpen} onClose={() => {
                if (!isDeleting) {
                  setDeleteDialogOpen(false);
                  setSelectedPropertyId(null);
                  setSelectedPropertySlug(null);
                }
              }}>
                <DialogTitle>Delete Property?</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Are you sure you want to delete this property? This action cannot be undone and will permanently remove the listing from Rewa Bhoomi.
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => {
                    setDeleteDialogOpen(false);
                    setSelectedPropertyId(null);
                    setSelectedPropertySlug(null);
                  }} color="inherit" disabled={isDeleting}>Cancel</Button>
                  <Button onClick={confirmDelete} color="error" variant="contained" disabled={isDeleting}>
                    {isDeleting ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
                  </Button>
                </DialogActions>
              </Dialog>

            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
