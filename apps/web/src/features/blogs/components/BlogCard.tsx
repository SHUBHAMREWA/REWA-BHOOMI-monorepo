'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  Avatar,
  Stack,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Blog } from '@rewa-bhoomi/types';
import { format } from 'date-fns';
import { useDeleteBlog } from '@/features/blogs/api/useBlogs';
import toast from 'react-hot-toast';

interface BlogCardProps {
  blog: Blog;
  adminView?: boolean;
}

// Calculate reading time based on word count
function getReadTime(content?: string, excerpt?: string): string {
  const text = (content || excerpt || '').replace(/<[^>]*>?/gm, '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min read`;
}

export const BlogCard: React.FC<BlogCardProps> = ({ blog, adminView = false }) => {
  const router = useRouter();
  const { mutateAsync: deleteBlog } = useDeleteBlog();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedDate = blog.publishedAt
    ? format(new Date(blog.publishedAt), 'MMM dd, yyyy')
    : blog.createdAt
    ? format(new Date(blog.createdAt), 'MMM dd, yyyy')
    : 'Recently';

  const readTime = blog.readingTime
    ? `${blog.readingTime} min read`
    : getReadTime(blog.contentHtml || blog.content, blog.excerpt);

  const categoryName = blog.category?.name || (blog.tags && blog.tags.length > 0 ? blog.tags[0] : 'Real Estate');

  const authorName = blog.author?.name || 'Rewa Bhoomi Expert';
  const authorAvatar = blog.author?.avatar_url || '';

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await deleteBlog(blog.id);
      toast.success('Blog delete ho gaya! Cloudflare se photos bhi remove ho gayi.');
      setDeleteOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Blog delete nahi ho saka');
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── ADMIN CARD VIEW ──────────────────────────────────────────────────────────
  if (adminView) {
    return (
      <>
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderRadius: '20px',
            overflow: 'hidden',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 16px 32px rgba(15, 23, 42, 0.08)',
              transform: 'translateY(-4px)',
              borderColor: '#93C5FD',
              '& .blog-img': {
                transform: 'scale(1.05)',
              },
            },
          }}
        >
          {/* Cover Media */}
          <Box sx={{ position: 'relative', overflow: 'hidden', height: 190, bgcolor: '#0F172A' }}>
            <CardMedia
              className="blog-img"
              component="img"
              height="190"
              image={blog.featuredImageUrl || '/placeholder-image.jpg'}
              alt={blog.title}
              sx={{
                objectFit: 'cover',
                transition: 'transform 0.5s ease',
              }}
            />
            {/* Category Overlay Tag */}
            <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
              <Chip
                label={categoryName}
                size="small"
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(6px)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.02em',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              />
            </Box>

            {/* Status Chip */}
            <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
              <Chip
                label={blog.status}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  letterSpacing: '0.04em',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  bgcolor:
                    blog.status === 'PUBLISHED'
                      ? '#D1FAE5'
                      : blog.status === 'DRAFT'
                      ? '#F1F5F9'
                      : '#FEF3C7',
                  color:
                    blog.status === 'PUBLISHED'
                      ? '#065F46'
                      : blog.status === 'DRAFT'
                      ? '#475569'
                      : '#92400E',
                  border: '1px solid rgba(255,255,255,0.6)',
                }}
              />
            </Box>
          </Box>

          {/* Content Body */}
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
            {/* Date & Read time */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, color: '#64748B' }}>
              <Typography variant="caption" fontWeight={600} sx={{ color: '#64748B' }}>
                {formattedDate}
              </Typography>
              <Typography variant="caption" sx={{ color: '#CBD5E1' }}>•</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                  {readTime}
                </Typography>
              </Box>
            </Stack>

            {/* Title */}
            <Typography
              variant="subtitle1"
              component="h2"
              sx={{
                fontWeight: 800,
                fontSize: '1.05rem',
                lineHeight: 1.4,
                color: '#0F172A',
                mb: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {blog.title}
            </Typography>

            {/* Excerpt */}
            <Typography
              variant="body2"
              sx={{
                color: '#64748B',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                mb: 2.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {blog.excerpt || 'No description provided for this blog post...'}
            </Typography>

            {/* Author Footer */}
            <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={authorAvatar}
                  alt={authorName}
                  sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#1B4FD8', fontWeight: 700 }}
                >
                  {authorName.charAt(0)}
                </Avatar>
                <Typography variant="caption" fontWeight={700} color="#334155">
                  {authorName}
                </Typography>
              </Box>

              {/* View Live Link */}
              <Tooltip title="View Published Article">
                <IconButton
                  component={Link}
                  href={`/blog/${blog.slug}`}
                  target="_blank"
                  size="small"
                  sx={{
                    color: '#64748B',
                    bgcolor: '#F8FAFC',
                    '&:hover': { color: '#1B4FD8', bgcolor: '#EFF6FF' },
                  }}
                >
                  <OpenInNewRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Action Buttons Row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={() => router.push(`/admin/blogs/${blog.id}/edit`)}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  py: 0.8,
                  borderColor: '#DBEAFE',
                  bgcolor: '#F0F7FF',
                  color: '#1B4FD8',
                  '&:hover': {
                    bgcolor: '#1B4FD8',
                    color: '#FFFFFF',
                    borderColor: '#1B4FD8',
                  },
                }}
              >
                Edit Post
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={() => setDeleteOpen(true)}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  py: 0.8,
                  borderColor: '#FEE2E2',
                  bgcolor: '#FEF2F2',
                  color: '#DC2626',
                  '&:hover': {
                    bgcolor: '#DC2626',
                    color: '#FFFFFF',
                    borderColor: '#DC2626',
                  },
                }}
              >
                Delete
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <Dialog
          open={deleteOpen}
          onClose={() => !isDeleting && setDeleteOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, color: '#DC2626' }}>
            <Avatar sx={{ bgcolor: '#FEF2F2', color: '#DC2626' }}>
              <WarningAmberRoundedIcon />
            </Avatar>
            <DialogTitle sx={{ p: 0, fontWeight: 800, color: '#0F172A', fontSize: '1.2rem' }}>
              Delete Blog Post?
            </DialogTitle>
          </Box>
          <DialogContent sx={{ pt: 1 }}>
            <DialogContentText sx={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Are you sure you want to delete <strong>"{blog.title}"</strong>?
              <br /><br />
              ⚠️ <strong>Cloudflare Clean-up:</strong> The featured photo and social preview image will be automatically deleted from Cloudflare R2.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
              variant="outlined"
              sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700, flex: 1, borderColor: '#CBD5E1', color: '#64748B' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              variant="contained"
              color="error"
              sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700, flex: 1, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // ─── PUBLIC CARD VIEW ─────────────────────────────────────────────────────────
  return (
    <Card
      component={Link}
      href={`/blog/${blog.slug}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: '20px',
        overflow: 'hidden',
        bgcolor: '#FFFFFF',
        textDecoration: 'none',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 20px 35px rgba(27, 79, 216, 0.10)',
          transform: 'translateY(-6px)',
          borderColor: '#93C5FD',
          '& .blog-img': {
            transform: 'scale(1.06)',
          },
          '& .read-more-arrow': {
            transform: 'translateX(4px)',
            color: '#1B4FD8',
          },
          '& .blog-title': {
            color: '#1B4FD8',
          },
        },
      }}
    >
      {/* Thumbnail */}
      <Box sx={{ position: 'relative', overflow: 'hidden', height: 210, bgcolor: '#0F172A' }}>
        <CardMedia
          className="blog-img"
          component="img"
          height="210"
          image={blog.featuredImageUrl || '/placeholder-image.jpg'}
          alt={blog.title}
          sx={{
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
        />
        {/* Category Pill Tag */}
        <Box sx={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }}>
          <Chip
            label={categoryName}
            size="small"
            sx={{
              bgcolor: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.03em',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            }}
          />
        </Box>
      </Box>

      {/* Body Content */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
        {/* Meta info: Date & Read Time */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, color: '#64748B' }}>
          <Typography variant="caption" fontWeight={600} sx={{ color: '#64748B' }}>
            {formattedDate}
          </Typography>
          <Typography variant="caption" sx={{ color: '#CBD5E1' }}>•</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeRoundedIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
              {readTime}
            </Typography>
          </Box>
        </Stack>

        {/* Title */}
        <Typography
          className="blog-title"
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 800,
            fontSize: '1.15rem',
            lineHeight: 1.4,
            color: '#0F172A',
            mb: 1.5,
            transition: 'color 0.2s ease',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {blog.title}
        </Typography>

        {/* Excerpt */}
        <Typography
          variant="body2"
          sx={{
            color: '#64748B',
            fontSize: '0.88rem',
            lineHeight: 1.6,
            mb: 3,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {blog.excerpt || 'Explore helpful insights, tips, and property guidelines in Rewa...'}
        </Typography>

        {/* Card Footer: Author + Read Link */}
        <Box
          sx={{
            mt: 'auto',
            pt: 2,
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={authorAvatar}
              alt={authorName}
              sx={{ width: 30, height: 30, fontSize: '0.8rem', bgcolor: '#1B4FD8', fontWeight: 700 }}
            >
              {authorName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="caption" fontWeight={700} color="#1E293B" display="block" lineHeight={1.2}>
                {authorName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem' }}>
                Rewa Bhoomi
              </Typography>
            </Box>
          </Box>

          <Box
            className="read-more-arrow"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: '#1B4FD8',
              fontWeight: 700,
              fontSize: '0.82rem',
              transition: 'all 0.2s ease',
            }}
          >
            Read Article
            <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
