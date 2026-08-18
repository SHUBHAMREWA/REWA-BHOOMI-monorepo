'use client';

import React from 'react';
import { Box, Typography, Container, Grid, CircularProgress, Alert } from '@mui/material';
import { useBlogs } from '@/features/blogs/api/useBlogs';
import { BlogCard } from '@/features/blogs/components/BlogCard';

export default function BlogListingPage() {
  const { data: blogs, isLoading, error } = useBlogs({ status: 'PUBLISHED', limit: 20 });

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Real Estate Insights & News
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Stay up to date with the latest trends in the property market.
        </Typography>
      </Box>

      {isLoading && (
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          Failed to load blog posts.
        </Alert>
      )}

      {!isLoading && !error && (!blogs || blogs.length === 0) && (
        <Box textAlign="center" my={8}>
          <Typography variant="h6" color="text.secondary">
            No blog posts published yet. Check back later!
          </Typography>
        </Box>
      )}

      <Grid container spacing={4}>
        {blogs?.map((blog) => (
          <Grid item xs={12} sm={6} md={4} key={blog.id}>
            <BlogCard blog={blog} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
