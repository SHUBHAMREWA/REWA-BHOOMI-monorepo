'use client';

import React from 'react';
import { Box, Typography, Button, Grid, CircularProgress, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import { useBlogs } from '@/features/blogs/api/useBlogs';
import { BlogCard } from '@/features/blogs/components/BlogCard';

export default function AdminBlogsPage() {
  const router = useRouter();
  const { data: blogs, isLoading, error } = useBlogs({ limit: 100 });

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Manage Blogs
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/admin/blogs/create')}
        >
          Create Blog
        </Button>
      </Box>

      {isLoading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          Failed to load blogs. Please try again later.
        </Alert>
      )}

      {!isLoading && !error && (!blogs || blogs.length === 0) && (
        <Alert severity="info">No blogs found. Create one to get started!</Alert>
      )}

      <Grid container spacing={3}>
        {blogs?.map((blog) => (
          <Grid item xs={12} sm={6} md={4} key={blog.id}>
            <BlogCard blog={blog} adminView />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
