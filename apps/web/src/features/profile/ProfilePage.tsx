'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Container, Typography, Paper, Grid, TextField, Button,
  CircularProgress, Avatar, Divider, Tabs, Tab, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Chip,
  useTheme, useMediaQuery, Switch, Alert
} from '@mui/material';
import { PhotoCamera, Security, Person, MapsHomeWork, Favorite, Edit, Delete, MoreVert, Logout, Share, WhatsApp, Facebook, Twitter, LinkedIn, Telegram, ContentCopy, NotificationsActive } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { UpdateProfileSchema, type UpdateProfileInput } from '@rewa-bhoomi/validation';
import { useAuth } from '../auth/AuthContext';
import { apiPatch, apiClient } from '@/lib/api';
import PropertyCard, { formatPrice } from '@/features/properties/PropertyCard';
import { usePushNotifications } from '@/features/notifications/usePushNotifications';

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
        <Box sx={{ py: { xs: 0.5, md: 1.5 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, refreshAuth, logout, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Push notifications controller hook
  const { isSupported, isSubscribed, enableNotifications, disableNotifications } = usePushNotifications();

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
  const [selectedPropertyStatus, setSelectedPropertyStatus] = useState<string | null>(null);
  
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
    if (isAuthLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    reset({
      name: user.name,
      username: (user.username || '').toLowerCase(),
      bio: user.bio || '',
      phone: user.phone || '',
      avatar_url: user.avatar_url,
    });
  }, [user, isAuthLoading, reset, router]);

  // Username availability check (debounced)
  useEffect(() => {
    const cleanUsername = watchUsername?.trim().toLowerCase();
    if (!cleanUsername || cleanUsername === user?.username?.toLowerCase()) {
      setUsernameStatus('idle');
      return;
    }
    if (cleanUsername.length < 3 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
      setUsernameStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const res = await apiClient.get(`/auth/check-username/${cleanUsername}`);
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, propertyId: string, propertySlug: string, propertyStatus: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPropertyId(propertyId);
    setSelectedPropertySlug(propertySlug);
    setSelectedPropertyStatus(propertyStatus);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleShareProperty = (e: React.MouseEvent, propertySlug: string, propertyTitle: string) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/property/${propertySlug}` : '';
    if (navigator.share) {
      navigator.share({ title: propertyTitle, url: shareUrl }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Property link copied to clipboard!');
    }
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

  
  const handleToggleSoldStatus = async () => {
    if (!selectedPropertyId) return;
    const isCurrentlySold = selectedPropertyStatus === 'SOLD';
    const newIsSold = !isCurrentlySold;
    
    try {
      await apiClient.patch(`/properties/${selectedPropertyId}/status`, { isSold: newIsSold });
      toast.success(`Property marked as ${newIsSold ? 'SOLD' : 'AVAILABLE'}`);
      setMyProperties(prev => prev.map(p => {
        if (p.id === selectedPropertyId) {
          return { ...p, status: newIsSold ? 'SOLD' : 'PUBLISHED' };
        }
        return p;
      }));
    } catch (error) {
      toast.error('Failed to update property status');
    }
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
      const payload: UpdateProfileInput = {
        ...data,
        username: data.username ? data.username.trim().toLowerCase() : data.username,
      };
      await apiPatch('/auth/me', payload);
      await refreshAuth();
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);

  const handleShareProfile = async (event?: React.MouseEvent<HTMLElement>) => {
    if (!user?.username) {
      toast.error('Please set and save a username first!');
      return;
    }
    const profileLink = `${window.location.origin}/u/${user.username}`;
    const shareData = {
      title: `${user.name}'s Profile | Rewa Bhoomi`,
      text: `Check out ${user.name}'s profile on Rewa Bhoomi!`,
      url: profileLink,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError' && event) {
          setShareMenuAnchor(event.currentTarget);
        }
        return;
      }
    }

    if (event) {
      setShareMenuAnchor(event.currentTarget);
    } else {
      navigator.clipboard.writeText(profileLink);
      toast.success('Profile link copied to clipboard!');
    }
  };

  const handleSocialShare = (platform: string) => {
    if (!user?.username) return;
    const profileLink = `${window.location.origin}/u/${user.username}`;
    const text = `Check out ${user.name}'s profile on Rewa Bhoomi!`;

    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + profileLink)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(profileLink)}&text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileLink)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileLink)}&text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileLink)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(profileLink);
        toast.success('Profile link copied to clipboard!');
        setShareMenuAnchor(null);
        return;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      setShareMenuAnchor(null);
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 4, sm: 5 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2.5 } }}>
        {/* Compact Header Bar */}
        <Box sx={{ mb: { xs: 1.2, sm: 1.8 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: 1 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0F172A" sx={{ fontSize: { xs: '1.15rem', sm: '1.4rem' } }}>
              Account Dashboard
            </Typography>
            <Typography color="#64748B" sx={{ mt: 0.2, fontSize: { xs: '0.72rem', sm: '0.82rem' }, display: { xs: 'none', sm: 'block' } }}>
              Manage your saved properties, active listings, and personal profile.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: { xs: 0.8, sm: 1.2 }, flexShrink: 0 }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<Share sx={{ fontSize: '1rem' }} />}
              onClick={(e) => handleShareProfile(e)}
              sx={{ fontWeight: 650, borderRadius: 2, textTransform: 'none', px: { xs: 1.2, sm: 1.8 }, py: 0.5, fontSize: '0.8rem' }}
            >
              {isMobile ? 'Share' : 'Share Profile'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Logout sx={{ fontSize: '1rem' }} />}
              onClick={() => {
                logout().then(() => router.push('/'));
              }}
              sx={{ fontWeight: 650, borderRadius: 2, textTransform: 'none', px: { xs: 1.2, sm: 1.8 }, py: 0.5, fontSize: '0.8rem' }}
            >
              {isMobile ? 'Logout' : 'Sign Out'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.2, sm: 1.5 } }}>
          {/* Top Profile Summary & Quick Tabs Card */}
          <Paper elevation={0} sx={{ pt: { xs: 1.5, sm: 2 }, px: { xs: 1.5, sm: 2.5 }, pb: 0, borderRadius: { xs: 2.5, sm: 3 }, border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 1.5, sm: 2.5 }, justifyContent: 'space-between', mb: 1.5 }}>
              
              {/* User Avatar + Info */}
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar
                    src={currentAvatarUrl || undefined}
                    sx={{ width: { xs: 52, sm: 64 }, height: { xs: 52, sm: 64 }, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
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
                        bottom: -2,
                        right: -2,
                        bgcolor: '#1B4FD8',
                        color: 'white',
                        p: 0.4,
                        '&:hover': { bgcolor: '#1D4ED8' },
                        boxShadow: '0 2px 6px rgba(27, 79, 216, 0.4)'
                      }}
                      disabled={isUploading}
                    >
                      {isUploading ? <CircularProgress size={10} color="inherit" /> : <PhotoCamera sx={{ fontSize: 13 }} />}
                    </IconButton>
                  </label>
                </Box>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" fontWeight={750} color="#0F172A" sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' }, lineHeight: 1.2 }}>
                      {user.name}
                    </Typography>
                    <Box sx={{ display: 'inline-flex', px: 0.8, py: 0.15, bgcolor: 'rgba(27, 79, 216, 0.1)', color: '#1B4FD8', borderRadius: 20, fontSize: '0.62rem', fontWeight: 750 }}>
                      {user.roles.includes('ADMIN') ? 'ADMINISTRATOR' : 'USER'}
                    </Box>
                  </Box>
                  <Typography variant="caption" color="#64748B" sx={{ display: 'block', mt: 0.2, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>

              {/* Compact Username Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' }, maxWidth: { xs: '100%', sm: 300 } }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="username"
                  {...register('username', {
                    onChange: (e) => {
                      const lower = e.target.value.toLowerCase().replace(/\s+/g, '_');
                      setValue('username', lower, { shouldValidate: true });
                    },
                  })}
                  inputProps={{
                    style: { textTransform: 'lowercase' },
                    autoCapitalize: 'none',
                    autoCorrect: 'off',
                    spellCheck: 'false',
                  }}
                  error={!!errors.username || usernameStatus === 'taken'}
                  helperText={
                    errors.username?.message ||
                    (usernameStatus === 'checking' && 'Checking...') ||
                    (usernameStatus === 'available' && '✓ Available') ||
                    (usernameStatus === 'taken' && 'Taken') ||
                    ''
                  }
                  FormHelperTextProps={{
                    sx: { color: usernameStatus === 'available' ? 'success.main' : undefined, mx: 0, fontSize: '0.68rem', mt: 0.2 }
                  }}
                  InputProps={{
                    sx: { fontSize: '0.82rem', height: 36, bgcolor: '#F8FAFC', borderRadius: 2 },
                    endAdornment: usernameStatus === 'checking' ? <CircularProgress size={14} /> : null
                  }}
                />
                <Button 
                  size="small" 
                  variant="outlined" 
                  disabled={isSaving || usernameStatus === 'checking' || usernameStatus === 'taken'}
                  onClick={handleSubmit(onSubmit)}
                  sx={{ textTransform: 'none', borderRadius: 2, height: 36, px: 1.5, fontSize: '0.78rem', fontWeight: 650, flexShrink: 0 }}
                >
                  Update
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mt: 1, mb: 0 }} />
            
            {/* Tabs Row */}
            <Tabs
              orientation="horizontal"
              variant="fullWidth"
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                minHeight: { xs: 40, sm: 44 },
                '& .MuiTab-root': {
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 0.5,
                  px: { xs: 0.5, sm: 1.5 },
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  minHeight: { xs: 40, sm: 44 },
                  whiteSpace: 'nowrap',
                  borderBottom: '2.5px solid transparent',
                  flexDirection: 'row',
                  gap: { xs: 0.4, sm: 0.8 },
                  color: '#64748B',
                  fontWeight: 650,
                  textTransform: 'none',
                },
                '& .Mui-selected': { 
                  color: '#1B4FD8 !important', 
                  borderBottomColor: '#1B4FD8'
                }
              }}
            >
              <Tab icon={<Person sx={{ fontSize: { xs: 16, sm: 18 } }} />} label={isMobile ? "Profile" : "Profile Details"} />
              <Tab icon={<Security sx={{ fontSize: { xs: 16, sm: 18 } }} />} label="Security" />
              <Tab icon={<MapsHomeWork sx={{ fontSize: { xs: 16, sm: 18 } }} />} label={isMobile ? "Properties" : "My Properties"} />
              <Tab icon={<Favorite sx={{ color: '#EF4444', fontSize: { xs: 16, sm: 18 } }} />} label={isMobile ? "Saved" : "Saved Properties"} />
            </Tabs>
          </Paper>

          {/* Tab Content Panel Card */}
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: { xs: 2.5, sm: 3 }, border: '1px solid #E2E8F0', minHeight: { xs: 260, md: 320 } }}>
              
              {/* PROFILE TAB */}
              <CustomTabPanel value={tabValue} index={0}>
                <Box sx={{ px: { xs: 0, sm: 1 }, pt: { xs: 0.5, sm: 0 } }}>
                  <Typography variant="subtitle1" fontWeight={750} mb={1.5} color="#0F172A">Personal Information</Typography>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          size="small"
                          label="Full Name"
                          fullWidth
                          {...register('name')}
                          error={!!errors.name}
                          helperText={errors.name?.message}
                          InputProps={{ sx: { fontSize: '0.85rem' } }}
                          InputLabelProps={{ sx: { fontSize: '0.85rem' } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          size="small"
                          label="Email Address"
                          fullWidth
                          value={user.email}
                          disabled
                          helperText="Email address cannot be changed."
                          InputProps={{ sx: { fontSize: '0.85rem' } }}
                          InputLabelProps={{ sx: { fontSize: '0.85rem' } }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          size="small"
                          label="Phone Number"
                          fullWidth
                          {...register('phone')}
                          error={!!errors.phone}
                          helperText={errors.phone?.message}
                          InputProps={{ sx: { fontSize: '0.85rem' } }}
                          InputLabelProps={{ sx: { fontSize: '0.85rem' } }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          size="small"
                          label="Bio"
                          fullWidth
                          multiline
                          rows={2}
                          {...register('bio')}
                          error={!!errors.bio}
                          helperText={errors.bio?.message || 'A short description about yourself'}
                          InputProps={{ sx: { fontSize: '0.85rem' } }}
                          InputLabelProps={{ sx: { fontSize: '0.85rem' } }}
                        />
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="small"
                        disabled={isSaving}
                        sx={{
                          bgcolor: '#1B4FD8', px: 3, py: 0.7, borderRadius: 2, textTransform: 'none', fontWeight: 650, fontSize: '0.82rem',
                          boxShadow: '0 2px 10px rgba(27, 79, 216, 0.25)',
                          '&:hover': { bgcolor: '#1D4ED8' }
                        }}
                      >
                        {isSaving ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
                      </Button>
                    </Box>
                  </form>

                  <Divider sx={{ my: 2.5 }} />
                  
                  <Box>
                    <Typography variant="subtitle1" fontWeight={750} mb={0.5} display="flex" alignItems="center" gap={0.8} color="#0F172A" sx={{ fontSize: '0.95rem' }}>
                      <NotificationsActive sx={{ color: '#1B4FD8', fontSize: 18 }} /> Notifications & Alerts
                    </Typography>
                    <Typography variant="caption" color="#64748B" mb={1.5} display="block">
                      Get real-time push notifications when you receive messages or support chat updates.
                    </Typography>

                    {isSupported ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="#0F172A" sx={{ fontSize: '0.85rem' }}>Push Notifications</Typography>
                          <Typography variant="caption" color="#64748B">
                            {isSubscribed ? 'Notifications are currently enabled' : 'Notifications are currently disabled'}
                          </Typography>
                        </Box>
                        <Switch
                          size="small"
                          checked={isSubscribed}
                          onChange={(e) => {
                            if (e.target.checked) {
                              enableNotifications();
                            } else {
                              disableNotifications();
                            }
                          }}
                          color="primary"
                        />
                      </Box>
                    ) : (
                      <Alert severity="warning" sx={{ borderRadius: 2, fontWeight: 500, py: 0.5, fontSize: '0.8rem' }}>
                        Push notifications are not supported on this browser or device.
                      </Alert>
                    )}
                  </Box>
                </Box>
              </CustomTabPanel>

              {/* SECURITY TAB */}
              <CustomTabPanel value={tabValue} index={1}>
                <Box sx={{ px: { xs: 0, sm: 2 }, pt: { xs: 1, sm: 0 } }}>
                  <Typography variant="subtitle1" fontWeight={750} mb={1.5} color="#0F172A">Security Settings</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: '0.85rem' }}>
                    To change your password, please request a password reset email to your registered email address.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => router.push('/auth/forgot-password')}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 650, px: 2, py: 0.6 }}
                  >
                    Reset Password
                  </Button>
                </Box>
              </CustomTabPanel>

              {/* MY PROPERTIES TAB */}
              <CustomTabPanel value={tabValue} index={2}>
                <Box sx={{ px: { xs: 0, sm: 1 }, pt: { xs: 1, sm: 0 } }}>
                  <Typography variant="subtitle1" fontWeight={750} mb={2} color="#0F172A">My Listings</Typography>
                  
                  {isLoadingProperties ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : myProperties.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <MapsHomeWork sx={{ fontSize: 44, color: '#CBD5E1', mb: 1 }} />
                      <Typography variant="subtitle1" fontWeight={750} color="#334155">No Listed Properties</Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5} mb={2} sx={{ fontSize: '0.82rem' }}>
                        You haven't listed any properties yet.
                      </Typography>
                      <Button variant="contained" size="small" sx={{ bgcolor: '#1B4FD8', textTransform: 'none', borderRadius: 2, fontWeight: 650 }} onClick={() => router.push('/properties/create')}>
                        Post a Property
                      </Button>
                    </Box>
                  ) : (
                    <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                      {myProperties.map((property: any) => (
                        <Grid item xs={6} sm={6} md={4} key={property.id}>
                          <Paper 
                            elevation={0} 
                            sx={{
                              borderRadius: { xs: 2, sm: 2.5 },
                              border: '1px solid #E2E8F0',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                              transition: 'all 0.2s',
                              '&:hover': { borderColor: '#1B4FD8', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
                            }}
                            onClick={() => router.push(`/property/${property.slug}`)}
                          >
                            <Box sx={{ height: { xs: 105, sm: 135, md: 155 }, bgcolor: '#F1F5F9', position: 'relative' }}>
                              {property.thumbnail ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={property.thumbnail} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                  <MapsHomeWork sx={{ fontSize: 36, color: '#94A3B8' }} />
                                </Box>
                              )}

                              {/* Share Button on Image */}
                              <IconButton
                                onClick={(e) => handleShareProperty(e, property.slug, property.title)}
                                size="small"
                                aria-label="Share property"
                                sx={{
                                  position: 'absolute',
                                  top: { xs: 5, sm: 8 },
                                  left: { xs: 5, sm: 8 },
                                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                                  backdropFilter: 'blur(4px)',
                                  p: { xs: 0.35, sm: 0.5 },
                                  color: '#64748B',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                                  zIndex: 2,
                                  '&:hover': { bgcolor: '#FFFFFF', color: '#1B4FD8', transform: 'scale(1.08)' },
                                }}
                              >
                                <Share sx={{ fontSize: { xs: 13, sm: 16 } }} />
                              </IconButton>

                              {/* Status Badge */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: { xs: 5, sm: 8 },
                                  right: { xs: 5, sm: 8 },
                                  bgcolor: property.status === 'PUBLISHED' ? '#22C55E' : property.status === 'REJECTED' ? '#EF4444' : '#EAB308',
                                  color: 'white',
                                  px: { xs: 0.6, sm: 1 },
                                  py: { xs: 0.15, sm: 0.3 },
                                  borderRadius: 1,
                                  fontSize: { xs: '0.6rem', sm: '0.68rem' },
                                  fontWeight: 700,
                                  zIndex: 2,
                                }}
                              >
                                {property.status}
                              </Box>
                            </Box>

                            <Box sx={{ p: { xs: 1, sm: 1.5 }, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                              <Box sx={{ overflow: 'hidden', flex: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.2 }}>
                                  <Typography
                                    variant="subtitle2"
                                    fontWeight={750}
                                    sx={{
                                      fontSize: { xs: '0.78rem', sm: '0.88rem' },
                                      lineHeight: 1.25,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 1,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      flex: 1,
                                      mr: 0.5,
                                    }}
                                  >
                                    {property.title}
                                  </Typography>
                                  <IconButton
                                    onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, property.id, property.slug, property.status); }}
                                    size="small"
                                    sx={{ color: '#64748B', p: 0.2, mt: -0.3, mr: -0.4 }}
                                    aria-label="More options"
                                  >
                                    <MoreVert sx={{ fontSize: { xs: 16, sm: 18 } }} />
                                  </IconButton>
                                </Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                  sx={{ display: 'block', fontSize: { xs: '0.66rem', sm: '0.75rem' }, mb: { xs: 0.3, sm: 0.6 } }}
                                >
                                  {property.city}, {property.state}
                                </Typography>
                              </Box>
                              <Typography
                                color="#1B4FD8"
                                fontWeight={800}
                                sx={{ fontSize: { xs: '0.88rem', sm: '0.98rem' }, lineHeight: 1.1 }}
                              >
                                {formatPrice(property.price)}
                              </Typography>
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
                <Box sx={{ px: { xs: 0, sm: 1 }, pt: { xs: 1, sm: 0 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={750} color="#0F172A">
                      Saved Properties
                    </Typography>
                    <Chip label={`${favoriteProperties.length} Saved`} size="small" color="primary" sx={{ fontWeight: 700, height: 24, fontSize: '0.72rem' }} />
                  </Box>
                  
                  {isLoadingFavorites ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : favoriteProperties.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Favorite sx={{ fontSize: 44, color: '#FCA5A5', mb: 1 }} />
                      <Typography variant="subtitle1" fontWeight={750} color="#334155">No Saved Properties Yet</Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5} mb={2} sx={{ fontSize: '0.82rem' }}>
                        Click the heart icon on any property card to save it for easy access later.
                      </Typography>
                      <Button variant="contained" size="small" sx={{ bgcolor: '#1B4FD8', textTransform: 'none', borderRadius: 2, fontWeight: 650 }} onClick={() => router.push('/properties')}>
                        Explore Properties
                      </Button>
                    </Box>
                  ) : (
                    <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                      {favoriteProperties.map((property: any) => (
                        <Grid item xs={6} sm={6} md={4} key={property.id}>
                          <PropertyCard property={property} viewMode="grid" showStatusBadge={true} />
                        </Grid>
                      ))}
                    </Grid>
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
                <MenuItem onClick={(e) => {
                  if (selectedPropertySlug) {
                    handleShareProperty(e, selectedPropertySlug, 'Check out this property on Rewa Bhoomi');
                  }
                  handleMenuClose();
                }}>
                  <Share fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> Share Listing
                </MenuItem>
                <MenuItem onClick={handleToggleSoldStatus}>
                  <MapsHomeWork fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> {selectedPropertyStatus === 'SOLD' ? 'Mark as Available' : 'Mark as Sold'}
                </MenuItem>
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

              {/* Share Profile Menu Fallback */}
              <Menu
                anchorEl={shareMenuAnchor}
                open={Boolean(shareMenuAnchor)}
                onClose={() => setShareMenuAnchor(null)}
                PaperProps={{
                  elevation: 4,
                  sx: { borderRadius: 3, minWidth: 220, p: 1, border: '1px solid #E2E8F0' }
                }}
              >
                <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 700, color: '#0F172A' }}>
                  Share Profile
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={() => handleSocialShare('whatsapp')} sx={{ borderRadius: 1.5, py: 1, gap: 1.5, fontSize: '0.9rem' }}>
                  <WhatsApp sx={{ color: '#25D366' }} /> WhatsApp
                </MenuItem>
                <MenuItem onClick={() => handleSocialShare('telegram')} sx={{ borderRadius: 1.5, py: 1, gap: 1.5, fontSize: '0.9rem' }}>
                  <Telegram sx={{ color: '#0088cc' }} /> Telegram
                </MenuItem>
                <MenuItem onClick={() => handleSocialShare('facebook')} sx={{ borderRadius: 1.5, py: 1, gap: 1.5, fontSize: '0.9rem' }}>
                  <Facebook sx={{ color: '#1877F2' }} /> Facebook
                </MenuItem>
                <MenuItem onClick={() => handleSocialShare('twitter')} sx={{ borderRadius: 1.5, py: 1, gap: 1.5, fontSize: '0.9rem' }}>
                  <Twitter sx={{ color: '#1DA1F2' }} /> Twitter / X
                </MenuItem>
                <MenuItem onClick={() => handleSocialShare('linkedin')} sx={{ borderRadius: 1.5, py: 1, gap: 1.5, fontSize: '0.9rem' }}>
                  <LinkedIn sx={{ color: '#0A66C2' }} /> LinkedIn
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={() => handleSocialShare('copy')} sx={{ borderRadius: 1.5, py: 1, gap: 1.5, fontSize: '0.9rem' }}>
                  <ContentCopy sx={{ color: '#64748B' }} /> Copy Link
                </MenuItem>
              </Menu>

            </Paper>
        </Box>
      </Container>
    </Box>
  );
}
