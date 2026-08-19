'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
  MenuItem,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useRouter } from 'next/navigation';
import { useBlogsWithMeta } from '@/features/blogs/api/useBlogs';
import { BlogCard } from '@/features/blogs/components/BlogCard';

export default function AdminBlogsPage() {
  const router = useRouter();

  // Search & Filter States
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);

  // Debounce search input to avoid spamming the backend
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, error } = useBlogsWithMeta({
    page,
    limit,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    search: debouncedSearch || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const blogs = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, totalPages: 1, limit: 9, hasMore: false };

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchInput || statusFilter !== 'ALL' || startDate || endDate
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1300, mx: 'auto' }}>
      {/* Header Row */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A">
            Manage Blogs
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Create, search, filter by date, and manage all articles & insights.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/admin/blogs/create')}
          sx={{
            bgcolor: '#1B4FD8',
            borderRadius: '24px',
            px: 3,
            py: 1.2,
            fontWeight: 700,
            textTransform: 'none',
            boxShadow: '0 4px 14px rgba(27, 79, 216, 0.35)',
            '&:hover': { bgcolor: '#1642b5' },
          }}
        >
          Create Blog
        </Button>
      </Box>

      {/* Filter & Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 4,
          borderRadius: 3,
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Search Box */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by title, excerpt, content..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchInput('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: { borderRadius: '20px', bgcolor: '#F8FAFC' },
              }}
            />
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              InputProps={{
                sx: { borderRadius: '20px', bgcolor: '#F8FAFC' },
              }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="PUBLISHED">Published</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="ARCHIVED">Archived</MenuItem>
            </TextField>
          </Grid>

          {/* Date From */}
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From Date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: { borderRadius: '20px', bgcolor: '#F8FAFC', fontSize: '0.85rem' },
              }}
            />
          </Grid>

          {/* Date To */}
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To Date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: { borderRadius: '20px', bgcolor: '#F8FAFC', fontSize: '0.85rem' },
              }}
            />
          </Grid>

          {/* Action / Reset */}
          <Grid item xs={12} md={2} sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={handleClearFilters}
                sx={{
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderColor: '#CBD5E1',
                  color: '#64748B',
                  '&:hover': { borderColor: '#94A3B8', bgcolor: '#F1F5F9' },
                }}
              >
                Reset
              </Button>
            )}
          </Grid>
        </Grid>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', fontWeight: 600 }}>
              Active Filters:
            </Typography>
            {debouncedSearch && (
              <Chip
                label={`Search: "${debouncedSearch}"`}
                size="small"
                onDelete={() => setSearchInput('')}
                sx={{ bgcolor: '#EFF6FF', color: '#1B4FD8', fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
            {statusFilter !== 'ALL' && (
              <Chip
                label={`Status: ${statusFilter}`}
                size="small"
                onDelete={() => setStatusFilter('ALL')}
                sx={{ bgcolor: '#EFF6FF', color: '#1B4FD8', fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
            {startDate && (
              <Chip
                icon={<CalendarMonthIcon fontSize="small" />}
                label={`From: ${startDate}`}
                size="small"
                onDelete={() => setStartDate('')}
                sx={{ bgcolor: '#F1F5F9', color: '#334155', fontSize: '0.75rem' }}
              />
            )}
            {endDate && (
              <Chip
                icon={<CalendarMonthIcon fontSize="small" />}
                label={`To: ${endDate}`}
                size="small"
                onDelete={() => setEndDate('')}
                sx={{ bgcolor: '#F1F5F9', color: '#334155', fontSize: '0.75rem' }}
              />
            )}
          </Stack>
        )}
      </Paper>

      {/* Meta Summary & Loading Indicator */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Showing <strong>{blogs.length}</strong> of <strong>{meta.total}</strong> blogs
          {meta.totalPages > 1 && ` (Page ${meta.page} of ${meta.totalPages})`}
        </Typography>

        {isFetching && !isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Updating...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Loading state */}
      {isLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" my={10}>
          <CircularProgress />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
          Failed to load blogs. Please try again.
        </Alert>
      )}

      {/* Empty state */}
      {!isLoading && !error && blogs.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
            border: '1px dashed #CBD5E1',
            bgcolor: '#F8FAFC',
          }}
        >
          <Typography variant="h6" fontWeight={700} color="#334155" gutterBottom>
            No blogs match your search criteria.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {hasActiveFilters
              ? 'Try changing or clearing your search and date filters.'
              : 'Start by creating your first blog post!'}
          </Typography>
          {hasActiveFilters ? (
            <Button variant="outlined" onClick={handleClearFilters} sx={{ borderRadius: '20px', textTransform: 'none' }}>
              Clear All Filters
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/admin/blogs/create')}
              sx={{ borderRadius: '20px', bgcolor: '#1B4FD8', textTransform: 'none' }}
            >
              Create New Blog
            </Button>
          )}
        </Paper>
      )}

      {/* Blogs Grid */}
      {!isLoading && blogs.length > 0 && (
        <>
          <Grid container spacing={3}>
            {blogs.map((blog) => (
              <Grid item xs={12} sm={6} md={4} key={blog.id}>
                <BlogCard blog={blog} adminView />
              </Grid>
            ))}
          </Grid>

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <Box
              sx={{
                mt: 6,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Pagination
                count={meta.totalPages}
                page={page}
                onChange={(_, value) => {
                  setPage(value);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: '8px',
                    fontWeight: 600,
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
