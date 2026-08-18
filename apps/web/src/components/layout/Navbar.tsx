'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import {
  AppBar, Toolbar, Button, IconButton, Box, Container, Drawer, List,
  ListItem, ListItemButton, ListItemText, ListItemIcon, Avatar, Menu, MenuItem, Tooltip, Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonIcon from '@mui/icons-material/Person';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import AddIcon from '@mui/icons-material/Add';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ArticleIcon from '@mui/icons-material/Article';

const navLinks = [
  { name: 'Properties', href: '/properties', icon: HomeWorkIcon },
  { name: 'Projects', href: '/projects', icon: ApartmentIcon },
  { name: 'Blogs', href: '/blog', icon: ArticleIcon },
];

const changingWords = ['plot', 'house', 'land', 'apartment', 'villa', 'farm'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % changingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

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
        <IconButton onClick={handleDrawerToggle}>
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
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: 80 }}>
            {/* Logo */}
            <Box sx={{ flex: { md: 1 }, display: 'flex', alignItems: 'center' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#1B4FD8' }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <img src="/favicon.png" alt="Rewa Bhoomi Logo" style={{ width: '90px', height: '90px', margin: '-15px -25px -15px -15px', objectFit: 'contain' }} />
                </Box>
                <Typography component="span" sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 800, letterSpacing: '-0.5px', marginRight: { xs: '6px', sm: '12px' } }}>
                  Rewa Bhoomi
                </Typography>
                
                {/* Animated Text Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.3, sm: 0.5 }, bgcolor: 'rgba(27, 79, 216, 0.08)', px: { xs: 1, sm: 1.5 }, py: { xs: 0.3, sm: 0.5 }, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: '#475569', fontSize: { xs: '0.75rem', sm: '0.9rem' } }}>Buy</Typography>
                  <Typography 
                    key={wordIndex} 
                    sx={{ 
                      fontWeight: 800, 
                      color: '#1B4FD8', 
                      fontSize: { xs: '0.75rem', sm: '0.9rem' }, 
                      minWidth: { xs: '55px', sm: '70px' },
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
              </Link>
            </Box>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', alignItems: 'center', gap: 4 }}>
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
            </Box>

            {/* Auth Controls & Saved Properties Quick Icon */}
            <Box sx={{ flex: { md: 1 }, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
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
                      sx={{
                        bgcolor: 'rgba(239, 68, 68, 0.08)',
                        color: '#EF4444',
                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.16)' },
                        mr: 0.5,
                      }}
                    >
                      <FavoriteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <IconButton onClick={handleMenuOpen} sx={{ p: 0, border: '2px solid #E2E8F0' }}>
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
                      <span style={{ fontSize: '13px', color: '#64748B' }}>{user.email}</span>
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

            {/* Mobile Menu Button */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, color: '#0F172A' }}
            >
              <MenuIcon />
            </IconButton>
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
      <Box sx={{ height: 80 }} /> {/* Spacer for fixed navbar */}
    </>
  );
}
