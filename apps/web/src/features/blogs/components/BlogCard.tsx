'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card, CardContent, CardMedia, Typography, Box, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
  Tooltip, Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Blog } from '@rewa-bhoomi/types';
import { format } from 'date-fns';
import { useDeleteBlog } from '@/features/blogs/api/useBlogs';
import toast from 'react-hot-toast';

interface BlogCardProps {
  blog: Blog;
  adminView?: boolean;
}

export const BlogCard: React.FC<BlogCardProps> = ({ blog, adminView = false }) => {
  const router = useRouter();
  const { mutateAsync: deleteBlog } = useDeleteBlog();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const publishedDate = blog.publishedAt
    ? format(new Date(blog.publishedAt), 'MMM dd, yyyy')
    : 'Unpublished';

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await deleteBlog(blog.id);
      toast.success('Blog delete ho gaya! Cloudflare se photo bhi hat gayi.');
      setDeleteOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Blog delete nahi ho saka');
    } finally {
      setIsDeleting(false);
    }
  };

  if (adminView) {
    return (
      <>
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.25s ease',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
              transform: 'translateY(-3px)',
              borderColor: '#1B4FD8',
            }
          }}
        >
          {/* Cover Image */}
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="180"
              image={blog.featuredImageUrl || '/placeholder-image.jpg'}
              alt={blog.title}
              sx={{ objectFit: 'cover' }}
            />
            {/* Status Badge */}
            <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
              <Chip
                label={blog.status}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  bgcolor:
                    blog.status === 'PUBLISHED' ? '#D1FAE5' :
                    blog.status === 'DRAFT' ? '#F1F5F9' : '#FEF3C7',
                  color:
                    blog.status === 'PUBLISHED' ? '#065F46' :
                    blog.status === 'DRAFT' ? '#475569' : '#92400E',
                }}
              />
            </Box>
          </Box>

          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              {publishedDate}
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="text.primary"
              sx={{
                mb: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4,
              }}
            >
              {blog.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 2,
                fontSize: '0.8rem',
              }}
            >
              {blog.excerpt || 'No excerpt available...'}
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', mb: 1.5, display: 'block' }}>
              By {blog.author?.name || 'Admin'}
            </Typography>

            <Divider sx={{ mb: 1.5 }} />

            {/* Action Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* View Live */}
              <Tooltip title="Live Blog Dekho">
                <IconButton
                  component={Link}
                  href={`/blog/${blog.slug}`}
                  target="_blank"
                  size="small"
                  sx={{ color: '#64748B', '&:hover': { color: '#1B4FD8', bgcolor: '#EFF6FF' } }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Edit Button */}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon fontSize="small" />}
                  onClick={() => router.push(`/admin/blogs/${blog.id}/edit`)}
                  sx={{
                    borderRadius: '20px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    px: 1.5,
                    borderColor: '#1B4FD8',
                    color: '#1B4FD8',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: '#1B4FD8', color: 'white', borderColor: '#1B4FD8' }
                  }}
                >
                  Edit
                </Button>

                {/* Delete Button */}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DeleteIcon fontSize="small" />}
                  onClick={() => setDeleteOpen(true)}
                  sx={{
                    borderRadius: '20px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    px: 1.5,
                    borderColor: '#EF4444',
                    color: '#EF4444',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: '#EF4444', color: 'white', borderColor: '#EF4444' }
                  }}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteOpen}
          onClose={() => !isDeleting && setDeleteOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1 }}>
            Blog Delete Karein?
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: '#475569', fontSize: '0.9rem' }}>
              <strong>"{blog.title}"</strong> ko permanently delete kar diya jayega.
              <br /><br />
              ⚠️ Cloudflare se <strong>sabhi photos bhi delete</strong> ho jayengi. Ye action undo nahi ho sakta.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
              variant="outlined"
              sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700, flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              variant="contained"
              color="error"
              sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700, flex: 1 }}
            >
              {isDeleting ? 'Deleting...' : 'Haan, Delete Karo'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // ── Public Blog Card (non-admin) ──
  return (
    <Card
      component={Link}
      href={`/blog/${blog.slug}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid #E2E8F0',
        transition: 'all 0.25s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          transform: 'translateY(-3px)',
          borderColor: '#1B4FD8',
        }
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={blog.featuredImageUrl || '/placeholder-image.jpg'}
        alt={blog.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {publishedDate}
          </Typography>
        </Box>
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {blog.title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {blog.excerpt || 'Read more...'}
        </Typography>
        <Box mt="auto" display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" fontWeight="medium">
            By {blog.author?.name || 'Admin'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
