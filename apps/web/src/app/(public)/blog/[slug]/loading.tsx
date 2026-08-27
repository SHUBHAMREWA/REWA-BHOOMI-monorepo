import React from 'react';
import { Container, Box, Skeleton, Divider, Paper } from '@mui/material';

export default function BlogLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header Skeleton */}
          <Box mb={4}>
            <Skeleton variant="text" width={100} height={24} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="90%" height={60} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="70%" height={60} sx={{ mb: 3 }} />
            
            <Box display="flex" alignItems="center" gap={2} mt={3}>
              <Skeleton variant="circular" width={44} height={44} />
              <Box>
                <Skeleton variant="text" width={120} />
                <Skeleton variant="text" width={80} />
              </Box>
            </Box>
          </Box>

          {/* Featured Image Skeleton */}
          <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 3, mb: 5 }} />

          {/* Content Skeleton */}
          <Box mb={6}>
            <Skeleton variant="text" width="100%" height={24} />
            <Skeleton variant="text" width="100%" height={24} />
            <Skeleton variant="text" width="95%" height={24} />
            <Skeleton variant="text" width="100%" height={24} sx={{ mb: 3 }} />
            
            <Skeleton variant="text" width="60%" height={32} sx={{ mt: 4, mb: 2 }} />
            <Skeleton variant="text" width="100%" height={24} />
            <Skeleton variant="text" width="90%" height={24} />
            <Skeleton variant="text" width="95%" height={24} />
          </Box>
          
          <Divider sx={{ mb: 4 }} />
          
          <Paper variant="outlined" sx={{ mt: 6, p: 3, borderRadius: 3, display: 'flex', gap: 2 }}>
            <Skeleton variant="circular" width={56} height={56} />
            <Box flex={1}>
              <Skeleton variant="text" width={150} />
              <Skeleton variant="text" width={200} />
            </Box>
          </Paper>
        </Box>

        {/* Sidebar Skeleton */}
        <Box sx={{ width: 260, display: { xs: 'none', lg: 'block' } }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Skeleton variant="text" width={120} height={24} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" sx={{ my: 1 }} />
            <Skeleton variant="text" width="90%" sx={{ my: 1 }} />
            <Skeleton variant="text" width="95%" sx={{ my: 1 }} />
            <Skeleton variant="text" width="80%" sx={{ my: 1 }} />
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}
