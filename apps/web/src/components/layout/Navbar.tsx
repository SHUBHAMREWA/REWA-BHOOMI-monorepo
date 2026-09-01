'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import {
  AppBar, Toolbar, Button, IconButton, Box, Container, Drawer, List,
  ListItem, ListItemButton, ListItemText, ListItemIcon, Avatar, Menu, MenuItem, Tooltip, Typography, Switch,
  InputBase
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonIcon from '@mui/icons-material/Person';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import AddIcon from '@mui/icons-material/Add';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ArticleIcon from '@mui/icons-material/Article';
import ChatIcon from '@mui/icons-material/Chat';
import GetAppIcon from '@mui/icons-material/GetApp';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { usePushNotifications } from '@/features/notifications/usePushNotifications';
import { usePwaInstall } from '@/features/pwa/usePwaInstall';

const navLinks = [
  { name: 'Properties', href: '/properties', icon: HomeWorkIcon },
  { name: 'Projects', href: '/projects', icon: ApartmentIcon },
  { name: 'Blogs', href: '/blog', icon: ArticleIcon },
];

const changingWords = ['plot', 'house', 'land', 'apartment', 'villa', 'farm'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [searchError, setSearchError] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-reset search error after 3 seconds
  useEffect(() => {
    if (searchError) {
      const timer = setTimeout(() => {
        setSearchError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchError]);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isSupported, isSubscribed, enableNotifications, disableNotifications } = usePushNotifications();
  const { canInstall, promptInstall } = usePwaInstall();

  // Close mobile search when clicking / tapping outside of it
  useEffect(() => {
    if (!mobileSearchOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        mobileSearchContainerRef.current &&
        !mobileSearchContainerRef.current.contains(event.target as Node)
      ) {
        setMobileSearchOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileSearchOpen]);



  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % changingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/properties') {
      const params = new URLSearchParams(window.location.search);
      const kw = params.get('keyword') || params.get('search') || params.get('q') || '';
      if (kw) {
        setMobileSearchQuery(kw);
      }
    }
  }, [pathname]);


  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const drawer = (
    <Box sx={{ width: 280, p: 2, height: '100%', bgcolor: '#ffffff' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#1B4FD8' }}>
          <img src="/favicon.png" alt="Rewa Bhoomi Logo" style={{ width: '80px', height: '80px', margin: '-15px -20px -15px -15px', objectFit: 'contain' }} />
          <span style={{ fontSize: '20px', fontWeight: 800 }}>Rewa Bhoomi</span>
        </Link>
        <IconButton onClick={handleDrawerToggle} aria-label="Close navigation menu" sx={{ width: 44, height: 44 }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {navLinks.map((link) => (
          <ListItem key={link.name} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={Link}
              href={link.href}
              onClick={handleDrawerToggle}
              sx={{
                borderRadius: 2,
                bgcolor: pathname === link.href ? 'rgba(27, 79, 216, 0.1)' : 'transparent',
                color: pathname === link.href ? '#1B4FD8' : '#475569',
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: pathname === link.href ? '#1B4FD8' : '#64748B' }}>
                <link.icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={link.name} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={Link}
            href="/properties/create"
            onClick={handleDrawerToggle}
            sx={{
              borderRadius: 2,
              bgcolor: pathname === '/properties/create' ? 'rgba(27, 79, 216, 0.1)' : 'rgba(27, 79, 216, 0.04)',
              color: '#1B4FD8',
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: '#1B4FD8' }}>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sell Property" primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
        </ListItem>

        {/* Get App / Install PWA Option (shown if user has not downloaded/installed PWA) */}
        {canInstall && (
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => {
                handleDrawerToggle();
                promptInstall();
              }}
              sx={{
                borderRadius: 2,
                bgcolor: 'rgba(27, 79, 216, 0.08)',
                border: '1px solid rgba(27, 79, 216, 0.22)',
                color: '#1B4FD8',
                '&:hover': { bgcolor: 'rgba(27, 79, 216, 0.15)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: '#1B4FD8' }}>
                <GetAppIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Get App"
                secondary="Install on your phone"
                primaryTypographyProps={{ fontWeight: 750, fontSize: '0.9rem', color: '#1B4FD8' }}
                secondaryTypographyProps={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        )}
      </List>

      {user && (
        <List sx={{ borderTop: '1px solid #E2E8F0', pt: 1, mt: 1 }}>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={Link}
              href="/profile?tab=favorites"
              onClick={handleDrawerToggle}
              sx={{ borderRadius: 2, color: '#EF4444' }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: '#EF4444' }}>
                <FavoriteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Saved Properties" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={Link}
              href="/profile?tab=properties"
              onClick={handleDrawerToggle}
              sx={{ borderRadius: 2, color: '#475569' }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: '#1B4FD8' }}>
                <MapsHomeWorkIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="My Listings" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>

          {isSupported && (
            <ListItem disablePadding sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: isSubscribed ? 'rgba(27, 79, 216, 0.05)' : '#FEF3C7',
                  border: isSubscribed ? '1px solid #E2E8F0' : '1px solid #FCD34D'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemIcon sx={{ minWidth: 36, color: isSubscribed ? '#1B4FD8' : '#92400E' }}>
                    {isSubscribed ? <NotificationsActiveIcon fontSize="small" /> : <NotificationsOffIcon fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText
                    primary="Notifications"
                    secondary={isSubscribed ? "Enabled" : "Disabled"}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A' }}
                    secondaryTypographyProps={{ fontSize: '0.72rem', color: isSubscribed ? '#16A34A' : '#92400E', fontWeight: 600 }}
                  />
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
            </ListItem>
          )}
        </List>
      )}
      
      <Box sx={{ mt: 3, px: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!user ? (
          <>
            <Button variant="outlined" component={Link} href="/auth/login" fullWidth onClick={handleDrawerToggle}>
              Sign In
            </Button>
            <Button variant="contained" component={Link} href="/auth/register" fullWidth onClick={handleDrawerToggle} sx={{ bgcolor: '#1B4FD8' }}>
              Sign Up
            </Button>
          </>
        ) : (
          <>
            {user.roles.includes('ADMIN') && (
              <Button variant="contained" component={Link} href="/admin" fullWidth onClick={handleDrawerToggle} sx={{ bgcolor: '#0F172A' }}>
                Admin Dashboard
              </Button>
            )}
            <Button variant="outlined" color="error" fullWidth onClick={logout}>
              Sign Out
            </Button>
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={scrolled ? 1 : 0}
        sx={{
          bgcolor: scrolled ? 'rgba(255, 255, 255, 0.9)' : 'white',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: { xs: 60, sm: 70, md: 80 }, position: 'relative' }}>
            {/* Logo: Always Visible on Desktop and Mobile */}
            <Box sx={{ flex: { md: 1 }, display: 'flex', alignItems: 'center', flexShrink: 0, minWidth: 0, mr: { xs: 0.5, sm: 2 } }}>

              <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#1B4FD8' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <img
                    src="/favicon.png"
                    alt="Rewa Bhoomi Logo"
                    style={{
                      width: mobileSearchOpen ? '48px' : '88px',
                      height: mobileSearchOpen ? '48px' : '88px',
                      margin: mobileSearchOpen ? '-6px -8px -6px -6px' : '-12px -22px -12px -10px',
                      objectFit: 'contain',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
                </Box>
                <Typography
                  component="span"
                  sx={{
                    display: { xs: mobileSearchOpen ? 'none' : 'inline', md: 'inline' },
                    fontSize: { xs: '19px', sm: '22px', md: '25px' },
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                    marginRight: { xs: '5px', sm: '10px' },
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Rewa Bhoomi
                </Typography>

                
                {/* Animated Pill Text Section - Visible on mobile & desktop until search is opened */}
                {!mobileSearchOpen && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.2, sm: 0.4 }, bgcolor: 'rgba(27, 79, 216, 0.08)', px: { xs: 0.6, sm: 1 }, py: { xs: 0.2, sm: 0.35 }, borderRadius: 2 }}>
                    <Typography sx={{ fontWeight: 600, color: '#475569', fontSize: { xs: '0.62rem', sm: '0.75rem' } }}>Buy</Typography>

                    <Typography 
                      key={wordIndex} 
                      sx={{ 
                        fontWeight: 800, 
                        color: '#1B4FD8', 
                        fontSize: { xs: '0.62rem', sm: '0.75rem' }, 
                        minWidth: { xs: '38px', sm: '55px' },
                        '@keyframes popIn': {
                          '0%': { opacity: 0, transform: 'translateY(5px)' },
                          '100%': { opacity: 1, transform: 'translateY(0)' },
                        },
                        animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
                      }}
                    >
                      {changingWords[wordIndex]}
                    </Typography>
                  </Box>
                )}
              </Link>
            </Box>

            {/* Mobile Expanding Search Bar: Stretches next to Logo Icon */}
            {mobileSearchOpen && (
              <Box
                ref={mobileSearchContainerRef}
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = mobileSearchQuery.trim();
                  if (q) {
                    setSearchError(false);
                    router.push(`/properties?keyword=${encodeURIComponent(q)}`);
                    setMobileSearchOpen(false);
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('nav-search-keyword', { detail: { keyword: q } }));
                    }
                  } else {
                    setSearchError(true);
                    searchInputRef.current?.focus();
                  }
                }}
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  alignItems: 'center',
                  flex: 1,
                  minWidth: 0,
                  bgcolor: searchError ? '#FEF2F2' : '#F1F5F9',
                  borderRadius: '24px',
                  pl: 1.5,
                  pr: 0.4,
                  py: 0.25,
                  mx: 1,
                  border: searchError ? '1.5px solid #EF4444' : '1.5px solid #1B4FD8',
                  boxShadow: searchError ? '0 2px 10px rgba(239, 68, 68, 0.28)' : '0 2px 10px rgba(27, 79, 216, 0.16)',
                  transition: 'background-color 0.2s, border 0.2s, box-shadow 0.2s',
                  animation: searchError
                    ? 'shakeSearch 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both'
                    : 'stretchSearch 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '@keyframes stretchSearch': {
                    '0%': { width: '40px', opacity: 0.3 },
                    '100%': { width: '100%', opacity: 1 },
                  },
                  '@keyframes shakeSearch': {
                    '10%, 90%': { transform: 'translateX(-2px)' },
                    '20%, 80%': { transform: 'translateX(3px)' },
                    '30%, 50%, 70%': { transform: 'translateX(-4px)' },
                    '40%, 60%': { transform: 'translateX(4px)' },
                  },
                }}
              >
                {/* Search text input */}
                <InputBase
                  autoFocus
                  inputRef={searchInputRef}
                  value={mobileSearchQuery}
                  onChange={(e) => {
                    setMobileSearchQuery(e.target.value);
                    if (searchError) setSearchError(false);
                  }}
                  placeholder={searchError ? 'Please write something to search...' : 'Search locality, house, plot...'}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: '0.82rem',
                    color: searchError ? '#DC2626' : '#0F172A',
                    '& input': { py: 0.3, px: 0 },
                    '& input::placeholder': {
                      color: searchError ? '#DC2626' : '#475569',
                      opacity: 1,
                      fontWeight: searchError ? 600 : 400,
                      transition: 'color 0.2s ease',
                    },
                  }}
                />

                {/* Clear input button */}
                {mobileSearchQuery && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setMobileSearchQuery('');
                      if (searchError) setSearchError(false);
                    }}
                    sx={{ width: 36, height: 36, mr: 0.2, color: '#334155' }}
                    aria-label="Clear text"
                  >
                    <CloseIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                )}

                {/* Dedicated Search Icon Button on RIGHT side of input */}
                <IconButton
                  type="submit"
                  size="small"
                  aria-label="Search properties"
                  sx={{
                    width: 38,
                    height: 38,
                    mr: 0.3,
                    color: '#FFFFFF',
                    bgcolor: searchError ? '#EF4444' : '#1B4FD8',
                    borderRadius: '50%',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: searchError ? '#DC2626' : '#1338A8', transform: 'scale(1.06)' },
                  }}
                >
                  <SearchIcon sx={{ fontSize: 16 }} />
                </IconButton>

                {/* Close search button */}
                <IconButton
                  size="small"
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setSearchError(false);
                  }}
                  sx={{ width: 38, height: 38, bgcolor: '#E2E8F0', color: '#334155', '&:hover': { bgcolor: '#CBD5E1' } }}
                  aria-label="Close search"
                >
                  <CloseIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Box>
            )}




            {/* Desktop Navigation: Centered on Desktop */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center',
                alignItems: 'center',
                gap: { md: 3, lg: 4 },
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1,
              }}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  style={{


                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    color: pathname === link.href ? '#1B4FD8' : '#475569',
                    fontWeight: pathname === link.href ? 700 : 500,
                    fontSize: '15px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#1B4FD8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = pathname === link.href ? '#1B4FD8' : '#475569')}
                >
                  <link.icon sx={{ fontSize: 18 }} />
                  {link.name}
                </Link>
              ))}

              {/* Dynamic Chat Link */}
              {user && user.roles.includes('ADMIN') ? (
                <Link
                  href="/admin/chat"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    textDecoration: 'none', color: pathname === '/admin/chat' ? '#1B4FD8' : '#475569',
                    fontWeight: pathname === '/admin/chat' ? 700 : 500, fontSize: '15px', transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#1B4FD8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = pathname === '/admin/chat' ? '#1B4FD8' : '#475569')}
                >
                  <ChatIcon sx={{ fontSize: 18 }} />
                  Chat
                </Link>
              ) : user ? (
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new Event('open-chat'));
                  }}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    color: '#475569', fontWeight: 500, fontSize: '15px',
                    transition: 'color 0.2s', cursor: 'pointer',
                    '&:hover': { color: '#1B4FD8' }
                  }}
                >
                  <ChatIcon sx={{ fontSize: 18 }} />
                  Chat
                </Box>
              ) : null}
            </Box>

            {/* Auth Controls & Saved Properties Quick Icon */}
            <Box sx={{ flex: { md: 1 }, display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                component={Link}
                href="/properties/create"
                startIcon={<AddIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '8px',
                  borderColor: '#1B4FD8',
                  color: '#1B4FD8',
                  px: 2.5,
                  py: 0.8,
                  mr: 1,
                  '&:hover': {
                    bgcolor: 'rgba(27, 79, 216, 0.05)',
                    borderColor: '#1D4ED8',
                  }
                }}
              >
                Sell
              </Button>
              {!user ? (
                <>
                  <Link href="/auth/login" style={{ textDecoration: 'none', color: '#475569', fontWeight: 600, fontSize: '15px' }}>
                    Log In
                  </Link>
                  <Button
                    variant="contained"
                    component={Link}
                    href="/auth/register"
                    sx={{
                      bgcolor: '#1B4FD8',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '8px',
                      px: 3,
                      py: 1,
                      boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                      '&:hover': { bgcolor: '#1D4ED8', boxShadow: '0 6px 20px rgba(59, 130, 246, 0.23)' }
                    }}
                  >
                    Get Started
                  </Button>
                </>
              ) : (
                <>
                  {/* Quick Heart Saved Properties Button */}
                  <Tooltip title="Saved Properties">
                    <IconButton
                      component={Link}
                      href="/profile?tab=favorites"
                      aria-label="Saved properties"
                      sx={{
                        bgcolor: 'rgba(239, 68, 68, 0.08)',
                        color: '#EF4444',
                        width: 44,
                        height: 44,
                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.16)' },
                        mr: 0.5,
                      }}
                    >
                      <FavoriteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <IconButton 
                    onClick={handleMenuOpen} 
                    aria-label="User account menu"
                    sx={{ p: 0, border: '2px solid #E2E8F0', width: 44, height: 44 }}
                  >
                    <Avatar sx={{ bgcolor: '#1B4FD8', color: 'white', width: 40, height: 40, fontWeight: 700 }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        mt: 1.5,
                        width: 220,
                        borderRadius: 3,
                        boxShadow: '0px 10px 40px rgba(0,0,0,0.1)',
                        border: '1px solid #E2E8F0',
                      }
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ display: 'block', fontWeight: 600, color: '#0F172A' }}>{user.name}</span>
                      <span style={{ display: 'block', fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{user.email}</span>
                      {(user as any).username && (
                        <span style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginTop: '4px', fontWeight: 500 }}>
                          @{ (user as any).username }
                        </span>
                      )}
                    </Box>

                    <MenuItem onClick={handleMenuClose} component={Link} href="/profile" sx={{ py: 1.5, fontWeight: 500 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1.5, color: '#64748B' }} /> My Profile
                    </MenuItem>

                    <MenuItem onClick={handleMenuClose} component={Link} href="/profile?tab=favorites" sx={{ py: 1.5, fontWeight: 600, color: '#EF4444' }}>
                      <FavoriteIcon fontSize="small" sx={{ mr: 1.5, color: '#EF4444' }} /> Saved Properties
                    </MenuItem>

                    <MenuItem onClick={handleMenuClose} component={Link} href="/profile?tab=properties" sx={{ py: 1.5, fontWeight: 500 }}>
                      <MapsHomeWorkIcon fontSize="small" sx={{ mr: 1.5, color: '#1B4FD8' }} /> My Listings
                    </MenuItem>

                    {user.roles.includes('ADMIN') && (
                      <MenuItem onClick={handleMenuClose} component={Link} href="/admin" sx={{ py: 1.5, fontWeight: 500 }}>
                        Admin Dashboard
                      </MenuItem>
                    )}

                    <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#EF4444', fontWeight: 600, borderTop: '1px solid #F1F5F9' }}>
                      Sign Out
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>

            {/* Mobile Actions: Search + Menu */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0.5 }}>
              {!mobileSearchOpen && (
                <IconButton
                  onClick={() => setMobileSearchOpen(true)}
                  aria-label="Search properties"
                  sx={{
                    color: '#1B4FD8',
                    width: 44,
                    height: 44,
                    bgcolor: 'rgba(27, 79, 216, 0.08)',
                    borderRadius: '10px',
                    '&:hover': { bgcolor: 'rgba(27, 79, 216, 0.16)' },
                  }}
                >
                  <SearchIcon sx={{ fontSize: 21 }} />
                </IconButton>
              )}
              <IconButton
                color="inherit"
                aria-label="Open navigation menu"
                edge="end"
                onClick={handleDrawerToggle}
                sx={{ color: '#0F172A', width: 44, height: 44 }}
              >
                <MenuIcon />
              </IconButton>
            </Box>

          </Toolbar>
        </Container>
      </AppBar>

      <Box component="nav">
        <Drawer
          anchor="right"
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280, borderLeft: 'none' },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box sx={{ height: { xs: 60, sm: 70, md: 80 } }} /> {/* Spacer for fixed navbar */}
    </>
  );
}
