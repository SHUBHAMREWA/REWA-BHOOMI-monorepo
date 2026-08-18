'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Paper, CircularProgress, MenuItem, Grid, Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Checkbox } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateBlogSchema, CreateBlogInput } from '@rewa-bhoomi/validation';
import { useCreateBlog } from '@/features/blogs/api/useBlogs';
import { ImageUploader } from '@/features/media/components/ImageUploader';
import toast from 'react-hot-toast';

export default function CreateBlogPage() {
  const router = useRouter();
  const { mutateAsync: createBlog } = useCreateBlog();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<CreateBlogInput>({
    resolver: zodResolver(CreateBlogSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      status: 'DRAFT',
      tags: [],
      metaTitle: '',
      metaDescription: '',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImageUrl: '',
      schemaType: 'BlogPosting',
      noIndex: false,
      noFollow: false,
      featuredImageUrl: '',
    },
  });

  const onSubmit = async (formData: CreateBlogInput) => {
    try {
      setIsSubmitting(true);
      
      // Clean up empty strings so Zod url() doesn't fail on optional empty fields
      const cleanData: any = {};
      for (const [key, value] of Object.entries(formData)) {
        if (value === '') {
          cleanData[key] = undefined;
        } else {
          cleanData[key] = value;
        }
      }

      await createBlog(cleanData);
      toast.success('Blog created successfully!');
      router.push('/admin/blogs');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Create New Blog
      </Typography>

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Blog Title"
                    fullWidth
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>

            {/* Excerpt */}
            <Grid item xs={12}>
              <Controller
                name="excerpt"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Excerpt"
                    multiline
                    rows={2}
                    fullWidth
                    error={!!errors.excerpt}
                    helperText={errors.excerpt?.message}
                  />
                )}
              />
            </Grid>

            {/* Content */}
            <Grid item xs={12}>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Content"
                    multiline
                    rows={10}
                    fullWidth
                    error={!!errors.content}
                    helperText={errors.content?.message}
                  />
                )}
              />
            </Grid>

            {/* Image Uploader */}
            <Grid item xs={12} sm={8}>
              <Controller
                name="featuredImageUrl"
                control={control}
                render={({ field }) => (
                  <ImageUploader
                    value={field.value || ''}
                    onChange={field.onChange}
                    label="Featured Image (PNG/JPG auto-converted to WebP)"
                  />
                )}
              />
            </Grid>

            {/* Status Selector */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Status"
                    fullWidth
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    <MenuItem value="DRAFT">Draft</MenuItem>
                    <MenuItem value="PUBLISHED">Published</MenuItem>
                    <MenuItem value="ARCHIVED">Archived</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            {/* SEO Accordion */}
            <Grid item xs={12}>
              <Accordion sx={{ border: '1px solid #E2E8F0', boxShadow: 'none', borderRadius: '8px !important' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight="semibold">Search Engine Optimization (SEO) & Metadata</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '1px solid #E2E8F0', p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="metaTitle"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="SEO Meta Title"
                            fullWidth
                            error={!!errors.metaTitle}
                            helperText={errors.metaTitle?.message || 'Recommended length: ~50-60 characters'}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="canonicalUrl"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Canonical URL"
                            fullWidth
                            error={!!errors.canonicalUrl}
                            helperText={errors.canonicalUrl?.message || 'Optional absolute URL of original source'}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Controller
                        name="metaDescription"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="SEO Meta Description"
                            multiline
                            rows={2}
                            fullWidth
                            error={!!errors.metaDescription}
                            helperText={errors.metaDescription?.message || 'Recommended length: ~150-160 characters'}
                          />
                        )}
                      />
                    </Grid>

                    {/* Social Meta */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight="bold" mt={2} mb={1}>Social Sharing (Open Graph)</Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="ogTitle"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Open Graph Title"
                            fullWidth
                            error={!!errors.ogTitle}
                            helperText={errors.ogTitle?.message || 'Title displayed when shared on social media'}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="ogDescription"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Open Graph Description"
                            fullWidth
                            error={!!errors.ogDescription}
                            helperText={errors.ogDescription?.message || 'Description displayed when shared on social media'}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Controller
                        name="ogImageUrl"
                        control={control}
                        render={({ field }) => (
                          <ImageUploader
                            value={field.value || ''}
                            onChange={field.onChange}
                            label="Social Media Share Image (OG Image)"
                          />
                        )}
                      />
                    </Grid>

                    {/* Advanced SEO */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight="bold" mt={2} mb={1}>Advanced SEO Settings</Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="schemaType"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            label="Structured Data Schema Type"
                            fullWidth
                            error={!!errors.schemaType}
                            helperText={errors.schemaType?.message}
                          >
                            <MenuItem value="BlogPosting">BlogPosting (Recommended)</MenuItem>
                            <MenuItem value="Article">Article</MenuItem>
                            <MenuItem value="NewsArticle">NewsArticle</MenuItem>
                          </TextField>
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6} display="flex" gap={4} alignItems="center" height="100%">
                      <Controller
                        name="noIndex"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Checkbox checked={!!field.value} onChange={field.onChange} />}
                            label="No Index (Hide from Search Engines)"
                          />
                        )}
                      />
                      <Controller
                        name="noFollow"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Checkbox checked={!!field.value} onChange={field.onChange} />}
                            label="No Follow (Do not follow links)"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>

          <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              Create Blog
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
