'use client';

import { usePathname, useRouter } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingWhatsAppButton from './FloatingWhatsAppButton';
import { Paper, BottomNavigation, BottomNavigationAction, Box } from '@mui/material';
import { Home, HomeWork, Apartment, AddCircle, Person } from '@mui/icons-material';
import { useEffect, useState } from 'react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith('/admin');
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (pathname === '/') setValue(0);
    else if (pathname?.startsWith('/properties/create')) setValue(3);
    else if (pathname?.startsWith('/properties') || pathname?.startsWith('/property')) setValue(1);
    else if (pathname?.startsWith('/projects') || pathname?.startsWith('/project')) setValue(2);
    else if (pathname?.startsWith('/profile')) setValue(4);
    else setValue(-1);
  }, [pathname]);

  return (
    <>
      <Navbar />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', pb: { xs: 7, md: 0 } }}>
        <main style={{ flex: 1 }}>
          {children}
        </main>
        {!isAdmin && <Footer />}
        {!isAdmin && <FloatingWhatsAppButton />}
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
            boxShadow: '0 -4px 10px rgba(0,0,0,0.06)',
            borderTop: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
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
              if (newValue === 2) router.push('/projects');
              if (newValue === 3) router.push('/properties/create');
              if (newValue === 4) router.push('/profile');
            }}
            sx={{
              height: 60,
              '& .MuiBottomNavigationAction-root': {
                minWidth: 0,
                px: 0.5,
                py: 0.5,
                color: '#94A3B8',
                '&.Mui-selected': { color: '#1B4FD8' },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.66rem',
                  fontWeight: 600,
                  mt: 0.2,
                  '&.Mui-selected': { fontSize: '0.68rem', fontWeight: 700 },
                },
              },
            }}
          >
            <BottomNavigationAction label="Home" icon={<Home sx={{ fontSize: 22 }} />} />
            <BottomNavigationAction label="Properties" icon={<HomeWork sx={{ fontSize: 22 }} />} />
            <BottomNavigationAction label="Projects" icon={<Apartment sx={{ fontSize: 22 }} />} />
            <BottomNavigationAction 
              label="Sell" 
              icon={<AddCircle sx={{ fontSize: 28, color: value === 3 ? '#1B4FD8' : '#3B82F6', mb: 0.2 }} />} 
            />
            <BottomNavigationAction label="Profile" icon={<Person sx={{ fontSize: 22 }} />} />
          </BottomNavigation>
        </Paper>
      )}
    </>
  );
}

