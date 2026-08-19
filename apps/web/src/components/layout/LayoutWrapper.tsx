'use client';

import { usePathname, useRouter } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { Paper, BottomNavigation, BottomNavigationAction, Box } from '@mui/material';
import { Home, Search, AddCircle, Person } from '@mui/icons-material';
import { useEffect, useState } from 'react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith('/admin');
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (pathname === '/') setValue(0);
    else if (pathname?.startsWith('/properties/create')) setValue(2);
    else if (pathname?.startsWith('/properties')) setValue(1);
    else if (pathname?.startsWith('/profile')) setValue(3);
  }, [pathname]);

  return (
    <>
      <Navbar />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', pb: { xs: 7, md: 0 } }}>
        <main style={{ flex: 1 }}>
          {children}
        </main>
        {!isAdmin && <Footer />}
      </Box>

      {!isAdmin && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            display: { xs: 'block', md: 'none' },
            boxShadow: '0 -4px 10px rgba(0,0,0,0.05)',
          }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue);
              if (newValue === 0) router.push('/');
              if (newValue === 1) router.push('/properties');
              if (newValue === 2) router.push('/properties/create');
              if (newValue === 3) router.push('/profile');
            }}
            sx={{
              height: 65,
              '& .MuiBottomNavigationAction-root': {
                color: '#94A3B8',
                '&.Mui-selected': { color: '#1B4FD8' }
              }
            }}
          >
            <BottomNavigationAction label="Home" icon={<Home />} />
            <BottomNavigationAction label="Search" icon={<Search />} />
            <BottomNavigationAction 
              label="Sell" 
              icon={<AddCircle sx={{ fontSize: 32, color: value === 2 ? '#1B4FD8' : '#3B82F6', mb: 0.5 }} />} 
            />
            <BottomNavigationAction label="Profile" icon={<Person />} />
          </BottomNavigation>
        </Paper>
      )}
    </>
  );
}
