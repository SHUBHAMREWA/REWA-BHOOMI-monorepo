'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Container,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
  Paper,
  Button,
  Chip,
  Avatar,
  Stack,
  CardMedia,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import { useBlogsWithMeta } from '@/features/blogs/api/useBlogs';
import { BlogCard } from '@/features/blogs/components/BlogCard';
import { format } from 'date-fns';

const TOPIC_CATEGORIES = [
  'All Topics',
  'Buying Guide',
  'Plot & Land',
  'Rewa Market Trends',
  'Registry & Legal',
  'Investment ROI',
];

export default function BlogListingPage() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [page, setPage] = useState(1);
  const limit = 9;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeSearchQuery = debouncedSearch || (selectedTopic !== 'All Topics' ? selectedTopic : '');

  const { data, isLoading, isFetching, error } = useBlogsWithMeta({
    status: 'PUBLISHED',
    limit,
    page,
    search: activeSearchQuery || undefined,
  });

  const blogs = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, totalPages: 1, limit: 9, hasMore: false };

  // Spotlight Featured Blog is the 1st post on Page 1 without active custom text search
  const isDefaultView = page === 1 && !debouncedSearch && selectedTopic === 'All Topics';
  const featuredBlog = isDefaultView && blogs.length > 0 ? blogs[0] : null;
  const gridBlogs = isDefaultView && blogs.length > 0 ? blogs.slice(1) : blogs;

  return (
    <Box sx={{ minHeight: '90vh', bgcolor: '#F8FAFC', pb: 12 }}>
      {/* ─── Hero Header ─── */}
      <Box
        sx={{
          bgcolor: '#0F172A',
          background: 'linear-gradient(135deg, #0A0F1D 0%, #0F172A 50%, #1E293B 100%)',
          color: '#FFFFFF',
          pt: { xs: 12, md: 15 },
          pb: { xs: 8, md: 10 },
          px: 2,
          position: 'relative',
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Chip
            icon={<AutoAwesomeRoundedIcon sx={{ fontSize: '15px !important', color: '#60A5FA !important' }} />}
            label="Rewa Bhoomi Knowledge Hub"
            size="small"
            sx={{
              bgcolor: 'rgba(59, 130, 246, 0.15)',
              color: '#93C5FD',
              fontWeight: 700,
              letterSpacing: '0.04em',
              fontSize: '0.75rem',
              mb: 2,
              border: '1px solid rgba(147, 197, 253, 0.3)',
              px: 1,
            }}
          />

          <Typography
            variant="h2"
            component="h1"
            fontWeight={900}
            sx={{
              color: '#FFFFFF',
              fontSize: { xs: '2rem', sm: '2.85rem', md: '3.4rem' },
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            Insights & Guides for Property in Rewa
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#CBD5E1',
              maxWidth: 620,
              mx: 'auto',
              mb: 4,
              fontSize: { xs: '0.95rem', md: '1.08rem' },
              lineHeight: 1.6,
            }}
          >
            Master real estate transactions with expert tips, market price updates, legal verification advice, and plotted development news.
          </Typography>

          {/* Search Box */}
          <Paper
            elevation={4}
            sx={{
              p: 0.8,
              display: 'flex',
              alignItems: 'center',
              maxWidth: 580,
              mx: 'auto',
              borderRadius: '35px',
              bgcolor: '#FFFFFF',
              boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
              border: '2px solid rgba(255, 255, 255, 0.9)',
            }}
          >
            <TextField
              fullWidth
              variant="standard"
              placeholder="Search topics, localities, buying advice..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (selectedTopic !== 'All Topics') setSelectedTopic('All Topics');
              }}
              InputProps={{
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start" sx={{ pl: 2 }}>
                    <SearchIcon sx={{ color: '#1B4FD8', fontSize: 24 }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end" sx={{ pr: 1 }}>
                    <IconButton size="small" onClick={() => setSearchInput('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: { px: 1, py: 0.6, fontSize: '0.95rem', color: '#0F172A' },
              }}
            />
          </Paper>

          {/* Category Topics Filter Bar */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 3.5 }}
          >
            {TOPIC_CATEGORIES.map((topic) => {
              const isSelected = selectedTopic === topic && !searchInput;
              return (
                <Chip
                  key={topic}
                  label={topic}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setSearchInput('');
                    setPage(1);
                  }}
                  clickable
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    borderRadius: '20px',
                    py: 2,
                    px: 0.5,
                    transition: 'all 0.2s ease',
                    bgcolor: isSelected ? '#1B4FD8' : 'rgba(255, 255, 255, 0.12)',
                    color: isSelected ? '#FFFFFF' : '#E2E8F0',
                    border: isSelected ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(6px)',
                    '&:hover': {
                      bgcolor: isSelected ? '#1642B5' : 'rgba(255, 255, 255, 0.22)',
                      color: '#FFFFFF',
                      borderColor: '#60A5FA',
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Container>
      </Box>

      {/* ─── Main Content Area ─── */}
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        {/* Results Header Info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={700} color="#1E293B">
            {activeSearchQuery ? (
              <>
                Showing articles for "<strong>{activeSearchQuery}</strong>" (<strong>{meta.total}</strong> found)
              </>
            ) : (
              <>
                All Property Insights & Articles (<strong>{meta.total}</strong>)
              </>
            )}
          </Typography>

          {isFetching && !isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Refreshing...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Loading Spinner */}
        {isLoading && (
          <Box display="flex" justifyContent="center" my={12}>
            <CircularProgress size={45} />
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
            Failed to load blog posts. Please refresh the page or check back shortly.
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && blogs.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 4,
              border: '1px dashed #CBD5E1',
              bgcolor: '#FFFFFF',
            }}
          >
            <Typography variant="h6" fontWeight={700} color="#334155" gutterBottom>
              {activeSearchQuery
                ? `No articles found matching "${activeSearchQuery}"`
                : 'No blog posts published yet.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {activeSearchQuery
                ? 'Try searching for general keywords like "plot", "registry", "Rewa", or "buying".'
                : 'Stay tuned! Our experts are preparing top-tier guides for you.'}
            </Typography>
            {activeSearchQuery && (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchInput('');
                  setSelectedTopic('All Topics');
                }}
                sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700 }}
              >
                Clear Search & Filters
              </Button>
            )}
          </Paper>
        )}

        {/* ─── FEATURED SPOTLIGHT CARD (Top Post on Page 1) ─── */}
        {!isLoading && featuredBlog && (
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{ color: '#1B4FD8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}
            >
              ⭐ Featured Article
            </Typography>

            <Paper
              component={Link}
              href={`/blog/${featuredBlog.slug}`}
              elevation={0}
              sx={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                borderRadius: '24px',
                overflow: 'hidden',
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 25px 45px rgba(27, 79, 216, 0.12)',
                  borderColor: '#93C5FD',
                  '& .featured-cover': { transform: 'scale(1.04)' },
                  '& .featured-title': { color: '#1B4FD8' },
                  '& .featured-btn': { transform: 'translateX(4px)', color: '#1B4FD8' },
                },
              }}
            >
              <Grid container>
                <Grid item xs={12} md={7} sx={{ position: 'relative', overflow: 'hidden', minHeight: { xs: 240, md: 360 }, bgcolor: '#0F172A' }}>
                  <CardMedia
                    className="featured-cover"
                    component="img"
                    image={featuredBlog.featuredImageUrl || '/placeholder-image.jpg'}
                    alt={featuredBlog.title}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease',
                    }}
                  />
                  <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
                    <Chip
                      label={featuredBlog.category?.name || 'Featured Guide'}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(8px)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={5} sx={{ p: { xs: 3, md: 4.5 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, color: '#64748B' }}>
                    <Typography variant="caption" fontWeight={600}>
                      {featuredBlog.publishedAt
                        ? format(new Date(featuredBlog.publishedAt), 'MMM dd, yyyy')
                        : 'Recent'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#CBD5E1' }}>•</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeRoundedIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
                      <Typography variant="caption" fontWeight={500}>
                        {featuredBlog.readingTime
                          ? `${featuredBlog.readingTime} min read`
                          : `${Math.max(1, Math.ceil((featuredBlog.excerpt || '').trim().split(/\s+/).filter(Boolean).length / 180))} min read`}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography
                    className="featured-title"
                    variant="h5"
                    fontWeight={800}
                    color="#0F172A"
                    gutterBottom
                    sx={{
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                      lineHeight: 1.35,
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {featuredBlog.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="#64748B"
                    sx={{
                      lineHeight: 1.65,
                      mb: 3,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {featuredBlog.excerpt || 'Explore this comprehensive guide on property acquisition, documentation, and price trends in Rewa.'}
                  </Typography>

                  <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={featuredBlog.author?.avatar_url}
                        alt={featuredBlog.author?.name}
                        sx={{ width: 32, height: 32, bgcolor: '#1B4FD8', fontWeight: 700, fontSize: '0.8rem' }}
                      >
                        {(featuredBlog.author?.name || 'A').charAt(0)}
                      </Avatar>
                      <Typography variant="caption" fontWeight={700} color="#1E293B">
                        {featuredBlog.author?.name || 'Rewa Bhoomi Expert'}
                      </Typography>
                    </Box>

                    <Box
                      className="featured-btn"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: '#1B4FD8',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Read Guide
                      <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* ─── GRID OF ARTICLES ─── */}
        {!isLoading && gridBlogs.length > 0 && (
          <>
            {isDefaultView && (
              <Typography
                variant="subtitle1"
                fontWeight={800}
                color="#0F172A"
                sx={{ mb: 3 }}
              >
                Latest Articles & Guides
              </Typography>
            )}

            <Grid container spacing={3.5}>
              {gridBlogs.map((blog) => (
                <Grid item xs={12} sm={6} md={4} key={blog.id}>
                  <BlogCard blog={blog} />
                </Grid>
              ))}
            </Grid>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <Box
                sx={{
                  mt: 8,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Pagination
                  count={meta.totalPages}
                  page={page}
                  onChange={(_, value) => {
                    setPage(value);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: '10px',
                      fontWeight: 700,
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}

        {/* ─── Consultation Banner ─── */}
        <Paper
          elevation={0}
          sx={{
            mt: 10,
            p: { xs: 4, md: 5 },
            borderRadius: '24px',
            bgcolor: '#0F172A',
            color: 'white',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 3,
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Looking for Expert Property Guidance in Rewa?
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 600 }}>
              Connect directly with verified local brokers and real estate consultants to find the best plot or home for you.
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/properties"
            variant="contained"
            startIcon={<PhoneInTalkRoundedIcon />}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#1B4FD8',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: '24px',
              px: 3.5,
              py: 1.2,
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#F1F5F9' },
            }}
          >
            Explore Properties
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
