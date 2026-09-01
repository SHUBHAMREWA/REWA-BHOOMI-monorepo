'use client';

import { Box, Container, Grid, Skeleton, Paper } from '@mui/material';

// ─── 1. Poster Banner Skeleton ────────────────────────────────────────────────
export function PosterBannerSkeleton() {
  return (
    <Box component="section" sx={{ pt: { xs: 1.5, sm: 2, md: 2.5 }, pb: { xs: 1, sm: 1.5, md: 2 }, bgcolor: '#F8FAFC' }}>
      <Container maxWidth="lg">
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{
            width: '100%',
            height: { xs: 150, sm: 220, md: 300 },
            borderRadius: { xs: 2.5, md: 3.5 },
            bgcolor: '#E2E8F0',
            transform: 'none',
          }}
        />
      </Container>
    </Box>
  );
}

// ─── 2. Single Property Card Skeleton ─────────────────────────────────────────
export function PropertyCardSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        bgcolor: '#FFFFFF',
      }}
    >
      {/* Image Skeleton */}
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{
          width: '100%',
          height: 220,
          bgcolor: '#F1F5F9',
          transform: 'none',
        }}
      />
      {/* Content Skeleton */}
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 2 }} />
        </Box>
        <Skeleton variant="text" width="85%" height={28} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #F1F5F9' }}>
          <Skeleton variant="text" width="45%" height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </Box>
    </Paper>
  );
}

// ─── 3. Featured Properties Section Skeleton ──────────────────────────────────
export function FeaturedPropertiesSkeleton() {
  return (
    <Box component="section" sx={{ pt: { xs: 2, sm: 2.5, md: 3.5 }, pb: { xs: 5, md: 8 }, bgcolor: '#FFFFFF' }}>
      <Container maxWidth="lg">
        {/* Header Skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: { xs: 2.5, sm: 3, md: 4 } }}>
          <Box>
            <Skeleton variant="text" width={100} height={20} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={260} height={42} />
          </Box>
          <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: 2 }} />
        </Box>

        {/* 3-Card Grid */}
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <PropertyCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

// ─── 4. Single Project Card Skeleton ──────────────────────────────────────────
export function ProjectCardSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        bgcolor: '#FFFFFF',
      }}
    >
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{
          width: '100%',
          height: 180,
          bgcolor: '#F1F5F9',
          transform: 'none',
        }}
      />
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="rounded" width={90} height={24} sx={{ borderRadius: 2 }} />
          <Skeleton variant="text" width={70} height={20} />
        </Box>
        <Skeleton variant="text" width="75%" height={30} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="50%" height={20} />
      </Box>
    </Paper>
  );
}

// ─── 5. Popular Projects Section Skeleton ─────────────────────────────────────
export function PopularProjectsSkeleton() {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F0F4FF' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 5 }}>
          <Box>
            <Skeleton variant="text" width={110} height={20} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={240} height={42} />
          </Box>
          <Skeleton variant="rounded" width={130} height={36} sx={{ borderRadius: 2 }} />
        </Box>

        {/* 2-Column Projects Grid */}
        <Grid container spacing={3}>
          {[1, 2].map((i) => (
            <Grid item xs={12} sm={6} key={i}>
              <ProjectCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
