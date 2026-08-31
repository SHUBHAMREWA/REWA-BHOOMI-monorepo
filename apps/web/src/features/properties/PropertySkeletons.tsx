'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';

// ─── 1. Responsive List Card Skeleton ─────────────────────────────────────────
export function PropertyListCardSkeleton() {
  return (
    <Box
      sx={{
        display: 'block',
        bgcolor: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #E2E8F0',
        p: { xs: 1.25, sm: 2.2 },
        mb: { xs: 1.5, sm: 2.5 },
      }}
    >
      {/* Mobile View (xs: block, sm: none) */}
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        <Box sx={{ display: 'flex', gap: 1.2 }}>
          {/* Thumbnail Skeleton */}
          <Skeleton
            variant="rectangular"
            animation="wave"
            sx={{
              width: 112,
              height: 112,
              borderRadius: '10px',
              flexShrink: 0,
              bgcolor: '#F1F5F9',
            }}
          />

          {/* Details Skeleton */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Skeleton variant="text" animation="wave" width="60%" height={26} />
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Skeleton variant="circular" width={22} height={22} />
                <Skeleton variant="circular" width={22} height={22} />
              </Box>
            </Box>

            <Box sx={{ my: 0.3 }}>
              <Skeleton variant="text" animation="wave" width="95%" height={16} />
              <Skeleton variant="text" animation="wave" width="70%" height={16} />
            </Box>

            <Box sx={{ display: 'flex', gap: 1.8 }}>
              <Box>
                <Skeleton variant="text" width={45} height={12} />
                <Skeleton variant="text" width={60} height={16} />
              </Box>
              <Box>
                <Skeleton variant="text" width={45} height={12} />
                <Skeleton variant="text" width={65} height={16} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Location bar skeleton */}
        <Skeleton variant="rounded" animation="wave" width="100%" height={28} sx={{ borderRadius: '8px', mt: 1, mb: 0.6 }} />

        {/* Description snippet */}
        <Skeleton variant="text" animation="wave" width="85%" height={16} />
      </Box>

      {/* Desktop View (xs: none, sm: flex) */}
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'row', gap: 2.5 }}>
        {/* Left media */}
        <Box sx={{ width: { sm: 280, md: 310 }, flexShrink: 0 }}>
          <Skeleton
            variant="rectangular"
            animation="wave"
            sx={{
              width: '100%',
              height: 195,
              borderRadius: '12px',
              bgcolor: '#F1F5F9',
            }}
          />
          <Skeleton variant="text" width={130} height={20} sx={{ mt: 1.2 }} />
        </Box>

        {/* Right details */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
              <Skeleton variant="text" animation="wave" width="75%" height={30} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="circular" width={28} height={28} />
                <Skeleton variant="circular" width={28} height={28} />
              </Box>
            </Box>

            <Skeleton variant="text" animation="wave" width={140} height={34} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" animation="wave" width={220} height={20} sx={{ mb: 1.5 }} />

            <Box sx={{ display: 'flex', gap: 2.5, mb: 1.5 }}>
              <Skeleton variant="rounded" width={90} height={42} sx={{ borderRadius: '8px' }} />
              <Skeleton variant="rounded" width={100} height={42} sx={{ borderRadius: '8px' }} />
              <Skeleton variant="rounded" width={90} height={42} sx={{ borderRadius: '8px' }} />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #F1F5F9' }}>
            <Skeleton variant="text" width={110} height={20} />
            <Skeleton variant="rounded" width={120} height={34} sx={{ borderRadius: '8px' }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── 2. Responsive Grid Card Skeleton ─────────────────────────────────────────
export function PropertyGridCardSkeleton() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #E2E8F0',
        overflow: 'hidden',
      }}
    >
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{ width: '100%', height: 200, bgcolor: '#F1F5F9' }}
      />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Skeleton variant="text" animation="wave" width={100} height={28} />
          <Skeleton variant="circular" width={24} height={24} />
        </Box>
        <Skeleton variant="text" animation="wave" width="90%" height={22} />
        <Skeleton variant="text" animation="wave" width="60%" height={22} sx={{ mb: 1.5 }} />
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <Skeleton variant="rounded" width={65} height={24} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rounded" width={75} height={24} sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton variant="text" animation="wave" width="80%" height={18} />
      </Box>
    </Box>
  );
}

// ─── 3. Full Property Detail Page Skeleton ────────────────────────────────────
export function PropertyDetailPageSkeleton() {
  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 1, sm: 2 }, pb: { xs: 4, sm: 6 }, bgcolor: '#F2F4F7' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.25, sm: 2.5 } }}>
        {/* Back Button Skeleton */}
        <Box sx={{ py: 0.4, mb: { xs: 0.6, sm: 1.2 } }}>
          <Skeleton variant="rounded" width={85} height={32} sx={{ borderRadius: '20px' }} />
        </Box>

        <Grid container spacing={{ xs: 1.5, md: 3 }}>
          {/* Main Column */}
          <Grid item xs={12} md={8}>
            {/* Mobile-only Price/Title Card */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 1.5 }}>
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                  <Skeleton variant="text" animation="wave" width={140} height={32} />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Skeleton variant="circular" width={28} height={28} />
                    <Skeleton variant="circular" width={28} height={28} />
                  </Box>
                </Box>
                <Skeleton variant="text" animation="wave" width="85%" height={22} sx={{ mb: 1 }} />
                <Skeleton variant="text" animation="wave" width="60%" height={18} />
              </Paper>
            </Box>

            {/* Media Gallery Skeleton */}
            <Paper elevation={0} sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', mb: 1.5, bgcolor: '#FFFFFF' }}>
              <Skeleton
                variant="rectangular"
                animation="wave"
                sx={{
                  width: '100%',
                  height: { xs: 240, sm: 360, md: 420 },
                  bgcolor: '#0F172A',
                }}
              />
            </Paper>

            {/* Thumbnails strip skeleton */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rounded" width={80} height={55} sx={{ borderRadius: '6px' }} />
              ))}
            </Box>

            {/* Overview & Details Box Skeleton */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.2 }, borderRadius: '8px', border: '1px solid #E2E8F0', mb: { xs: 1.5, sm: 2 }, bgcolor: '#FFFFFF' }}>
              <Skeleton variant="text" width={150} height={26} sx={{ mb: 1.5 }} />
              <Grid container spacing={{ xs: 1.2, sm: 2 }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Grid item xs={6} sm={4} key={i}>
                    <Skeleton variant="text" width="50%" height={14} />
                    <Skeleton variant="text" width="80%" height={20} />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Future Value Projection 2x2 Grid Skeleton */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: '8px', border: '1px solid #E2E8F0', mb: { xs: 1.5, sm: 2 }, bgcolor: '#FFFFFF' }}>
              <Skeleton variant="text" width={180} height={24} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width={220} height={16} sx={{ mb: 1.5 }} />
              <Grid container spacing={1}>
                {[1, 2, 3, 4].map((i) => (
                  <Grid item xs={6} key={i}>
                    <Box sx={{ p: 1.2, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <Skeleton variant="text" width="60%" height={16} />
                      <Skeleton variant="text" width="80%" height={24} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Amenities Skeleton */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.2 }, borderRadius: '8px', border: '1px solid #E2E8F0', mb: { xs: 1.5, sm: 2 }, bgcolor: '#FFFFFF' }}>
              <Skeleton variant="text" width={160} height={24} sx={{ mb: 1.5 }} />
              <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Grid item xs={6} sm={4} key={i}>
                    <Skeleton variant="text" width="85%" height={20} />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Description Skeleton */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.2 }, borderRadius: '8px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="100%" height={18} />
              <Skeleton variant="text" width="95%" height={18} />
              <Skeleton variant="text" width="70%" height={18} />
            </Paper>
          </Grid>

          {/* Right Column / Desktop Sidebar */}
          <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Price & Title card */}
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Skeleton variant="text" animation="wave" width={160} height={38} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" animation="wave" width="90%" height={26} sx={{ mb: 1 }} />
                <Skeleton variant="text" animation="wave" width="70%" height={20} />
              </Paper>

              {/* Seller info card */}
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Skeleton variant="circular" width={56} height={56} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" height={24} />
                    <Skeleton variant="text" width="50%" height={16} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Skeleton variant="rounded" width="50%" height={36} sx={{ borderRadius: 2 }} />
                  <Skeleton variant="rounded" width="50%" height={36} sx={{ borderRadius: 2 }} />
                </Box>
              </Paper>

              {/* Map skeleton */}
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Skeleton variant="text" width={120} height={24} sx={{ mb: 1.5 }} />
                <Skeleton variant="rectangular" width="100%" height={260} sx={{ borderRadius: '6px' }} />
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

// ─── 4. Full Properties Search Page Skeleton ──────────────────────────────────
export function PropertiesSearchPageSkeleton() {
  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 1, sm: 3.5 }, pb: { xs: 4, sm: 6 }, bgcolor: '#F8FAFC' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.2, sm: 3 } }}>

        {/* Purpose selector chips */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 0.5, sm: 0.8 },
            mb: { xs: 0.6, sm: 1 },
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 0.6,
            overflowX: 'auto',
          }}
        >
          <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '16px' }} />
          <Skeleton variant="rounded" width={90} height={24} sx={{ borderRadius: '16px' }} />
          <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: '16px' }} />
          <Skeleton variant="rounded" width={75} height={24} sx={{ borderRadius: '16px' }} />
          <Skeleton variant="rounded" width={110} height={24} sx={{ borderRadius: '16px' }} />
        </Paper>

        {/* Search and Filters Bar */}
        <Box sx={{ display: 'flex', gap: 0.8, mb: { xs: 0.6, sm: 1 }, alignItems: 'center' }}>
          <Skeleton variant="rounded" width="100%" height={34} sx={{ borderRadius: '28px', flex: 1 }} />
          <Skeleton variant="rounded" width={75} height={34} sx={{ borderRadius: '20px', flexShrink: 0 }} />
        </Box>

        {/* Budget Range Filter Banner */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: '#F1F5F9',
            borderRadius: { xs: '8px', sm: '12px' },
            p: { xs: 0.6, sm: 1.2 },
            mb: { xs: 0.8, sm: 1.2 },
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 0.2, sm: 0.6 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, justifyContent: 'center' }}>
            <Skeleton variant="text" width={50} height={18} />
            <Skeleton variant="rounded" width={65} height={26} sx={{ borderRadius: '6px' }} />
            <Skeleton variant="text" width={15} height={18} />
            <Skeleton variant="rounded" width={65} height={26} sx={{ borderRadius: '6px' }} />
            <Skeleton variant="rounded" width={60} height={26} sx={{ borderRadius: '6px' }} />
          </Box>
          <Skeleton variant="rounded" width="60%" height={4} sx={{ borderRadius: 1 }} />
        </Paper>

        {/* View Toggle and Count Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 1 }}>
          <Skeleton variant="text" width={150} height={24} />
          <Skeleton variant="rounded" width={130} height={32} sx={{ borderRadius: 2 }} />
        </Box>

        {/* 4 Cards Skeleton */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {[1, 2, 3, 4].map((i) => (
            <PropertyListCardSkeleton key={i} />
          ))}
        </Box>
      </Container>
    </Box>
  );
}

