'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, AppBar, Toolbar, IconButton, CircularProgress, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import BusinessIcon from '@mui/icons-material/Business';
import MenuIcon from '@mui/icons-material/Menu';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import ArticleIcon from '@mui/icons-material/Article';
import ChatIcon from '@mui/icons-material/Chat';
import BlockIcon from '@mui/icons-material/Block';
import CampaignIcon from '@mui/icons-material/Campaign';
import Badge from '@mui/material/Badge';
import { useAuth } from '@/features/auth/AuthContext';
import { useConversations } from '@/features/chat/chat-api';
import { useSocket } from '@/lib/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';

const DRAWER_WIDTH = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
  { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
  { text: 'Properties', icon: <HomeWorkIcon />, path: '/admin/properties' },
  { text: 'Projects', icon: <BusinessIcon />, path: '/admin/projects' },
  { text: 'Posters & Social', icon: <CampaignIcon />, path: '/admin/posters-communication' },
  { text: 'Blogs', icon: <ArticleIcon />, path: '/admin/blogs' },
  { text: 'Chat Support', icon: <ChatIcon />, path: '/admin/chat' },
  { text: 'Audit Logs', icon: <HistoryIcon />, path: '/admin/logs' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isAuthenticated, accessToken, user, isLoading } = useAuth();
  const { data: conversations = [] } = useConversations(!!accessToken);
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!socket) return;
    const handleAdminNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    socket.on('admin_new_message', handleAdminNewMessage);
    return () => {
      socket.off('admin_new_message', handleAdminNewMessage);
    };
  }, [socket, queryClient]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAdmin) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', p: 3 }}>
        <BlockIcon sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
        <Typography variant="h4" fontWeight={800} color="#0F172A" mb={1}>
          403 — Access Denied
        </Typography>
        <Typography variant="body1" color="#64748B" mb={3} sx={{ maxWidth: 450 }}>
          Aapke paas Admin Panel access karne ke permissions nahi hain. Sirf authorized admins hi is page ko dekh sakte hain.
        </Typography>
        <Button
          variant="contained"
          component={Link}
          href="/"
          sx={{
            bgcolor: '#1B4FD8',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            py: 1,
            '&:hover': { bgcolor: '#1640B0' },
          }}
        >
          Go to Homepage
        </Button>
      </Box>
    );
  }
  
  const unreadCount = conversations.reduce((acc, conv) => acc + parseInt(conv.unread_count || '0', 10), 0);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0F172A', color: 'white' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ background: 'linear-gradient(135deg, #1B4FD8, #3B82F6)', borderRadius: 2, p: 0.75 }}>
          <HomeWorkIcon sx={{ color: 'white' }} />
        </Box>
        <Typography variant="h6" fontWeight={800}>Admin Panel</Typography>
      </Box>

      <List sx={{ px: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                href={item.path}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  color: isActive ? 'white' : '#94A3B8',
                  bgcolor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', color: 'white' },
                  '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.text === 'Chat Support' ? (
                    <Badge badgeContent={unreadCount} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 700 : 500 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={logout}
          sx={{ borderRadius: 2, color: '#EF4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 80px)', bgcolor: '#F1F5F9' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: 'white',
          borderBottom: '1px solid #E2E8F0',
          top: '80px',
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' }, color: 'text.primary' }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" color="text.primary" fontWeight={700}>
            {menuItems.find(i => i.path === pathname)?.text || 'Dashboard'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 'none', top: '80px', height: 'calc(100vh - 80px)' } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 'none', top: '80px', height: 'calc(100vh - 80px)' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 5 }, width: { xs: '100%', sm: `calc(100% - ${DRAWER_WIDTH}px)` }, maxWidth: '100vw', mt: 8, overflowX: 'hidden' }}>
        {children}
      </Box>
    </Box>
  );
}
