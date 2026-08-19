'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Paper, CircularProgress, MenuItem,
  Grid, Alert, Accordion, AccordionSummary, AccordionDetails, FormControlLabel,
  Switch, Chip, Autocomplete, InputAdornment, Divider, Stack, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import SearchIcon from '@mui/icons-material/Search';
import ShareIcon from '@mui/icons-material/Share';
import TwitterIcon from '@mui/icons-material/Twitter';
import QuizIcon from '@mui/icons-material/Quiz';
import PublishIcon from '@mui/icons-material/Publish';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateBlogSchema } from '@rewa-bhoomi/validation';
import type { UpdateBlogInput } from '@rewa-bhoomi/validation';
import { useBlog, useUpdateBlog, useDeleteBlog, useBlogCategories, useBlogTags, useCreateBlogTag } from '@/features/blogs/api/useBlogs';
import { ImageUploader } from '@/features/media/components/ImageUploader';
import { RichTextEditor } from '@/features/blogs/components/editor/RichTextEditor';
import { SeoPreview } from '@/features/blogs/components/seo/SeoPreview';
import { FaqManager, type FaqItem } from '@/features/blogs/components/FaqManager';
import toast from 'react-hot-toast';

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const SectionHeader = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {icon}
    <Typography fontWeight={600}>{label}</Typography>
  </Box>
);

export default function EditBlogPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const { data: blog, isLoading: isLoadingBlog, error: fetchError } = useBlog(id);
  const { mutateAsync: updateBlog } = useUpdateBlog();
  const { mutateAsync: deleteBlog } = useDeleteBlog();
  const { data: categories = [] } = useBlogCategories();
  const { data: allTags = [] } = useBlogTags();
  const { mutateAsync: createTag } = useCreateBlogTag();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [editorKey, setEditorKey] = useState(0);

  const { control, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<UpdateBlogInput>({
    resolver: zodResolver(UpdateBlogSchema),
  });

  // Pre-fill form when blog data loads
  useEffect(() => {
    if (blog) {
      reset({
        title: blog.title || '',
        slug: blog.slug || '',
        excerpt: blog.excerpt || '',
        content: blog.content || ' ',
        contentJson: blog.contentJson || undefined,
        language: blog.language || 'en',
        status: blog.status,
        featuredImageUrl: blog.featuredImageUrl || '',
        featuredImageAlt: blog.featuredImageAlt || '',
        featuredImageCaption: blog.featuredImageCaption || '',
        categoryId: blog.category?.id || '',
        // SEO
        seoTitle: blog.seoTitle || blog.metaTitle || '',
        seoDescription: blog.seoDescription || blog.metaDescription || '',
        focusKeyword: blog.focusKeyword || '',
        secondaryKeywords: blog.secondaryKeywords || [],
        canonicalUrl: blog.canonicalUrl || '',
        // OG
        ogTitle: blog.ogTitle || '',
        ogDescription: blog.ogDescription || '',
        ogImageUrl: blog.ogImageUrl || '',
        ogImageAlt: blog.ogImageAlt || '',
        // Twitter
        twitterCard: (blog.twitterCard as any) || 'summary_large_image',
        twitterTitle: blog.twitterTitle || '',
        twitterDescription: blog.twitterDescription || '',
        twitterImageUrl: blog.twitterImageUrl || '',
        // Advanced
        schemaType: blog.schemaType || 'BlogPosting',
        allowIndex: blog.allowIndex !== undefined ? blog.allowIndex : !blog.noIndex,
        allowFollow: blog.allowFollow !== undefined ? blog.allowFollow : !blog.noFollow,
        generateToc: blog.generateToc || false,
      });

      // Pre-fill tags
      if (blog.blogTags && blog.blogTags.length > 0) {
        setSelectedTagIds(blog.blogTags.map(t => t.id));
      } else if (blog.tags && blog.tags.length > 0) {
        // Migration helper: find or create tag IDs for legacy tags
        const migrateTags = async () => {
          const ids: string[] = [];
          for (const name of blog.tags) {
            const match = (allTags as any[]).find(t => t.name.toLowerCase() === name.toLowerCase());
            if (match) {
              ids.push(match.id);
            } else {
              try {
                const res = await createTag({ name });
                ids.push(res.data.id);
              } catch (err) {
                console.error('Failed to migrate tag', name, err);
              }
            }
          }
          setSelectedTagIds(ids);
        };
        migrateTags();
      }

      // Pre-fill FAQs
      if (blog.faqs && blog.faqs.length > 0) {
        setFaqs(blog.faqs.map(f => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          sortOrder: f.sortOrder,
        })));
      }

      // Force editor re-mount so it picks up the initial contentJson
      setEditorKey(k => k + 1);
    }
  }, [blog, reset, allTags]);

  const watchTitle = watch('title') || '';
  const watchSlug = watch('slug') || '';
  const watchSeoTitle = watch('seoTitle') || '';
  const watchSeoDesc = watch('seoDescription') || '';
  const watchOgTitle = watch('ogTitle');
  const watchOgDesc = watch('ogDescription');
  const watchOgImage = watch('ogImageUrl');
  const watchFeaturedImage = watch('featuredImageUrl');
  const watchTwitterTitle = watch('twitterTitle');
  const watchTwitterDesc = watch('twitterDescription');
  const watchTwitterImage = watch('twitterImageUrl');

  useEffect(() => {
    if (!slugManual && watchTitle && blog && blog.slug !== watchSlug) {
      // Only auto-update slug if it matches original pattern (was auto-generated)
    }
  }, [watchTitle, slugManual, blog, watchSlug]);

  const handleCreateTag = useCallback(async (name: string) => {
    try {
      const result = await createTag({ name });
      setSelectedTagIds(prev => [...prev, result.data.id]);
      toast.success(`Tag "${name}" created`);
    } catch {
      toast.error('Failed to create tag');
    }
  }, [createTag]);

  const onSubmit = async (formData: UpdateBlogInput) => {
    try {
      setIsSubmitting(true);

      const cleanData: any = { ...formData };
      const urlFields = ['featuredImageUrl', 'canonicalUrl', 'ogImageUrl', 'twitterImageUrl'];
      urlFields.forEach(f => { if (cleanData[f] === '') cleanData[f] = undefined; });
      if (cleanData.categoryId === '') cleanData.categoryId = undefined;

      // Resolve any remaining tags in input box (e.g. comma-separated)
      const finalTagIds = [...selectedTagIds];
      const cleanedInput = tagInput.trim();
      if (cleanedInput) {
        const names = cleanedInput.split(',').map(n => n.trim()).filter(Boolean);
        for (const name of names) {
          const match = (allTags as any[]).find(t => t.name.toLowerCase() === name.toLowerCase());
          if (match) {
            if (!finalTagIds.includes(match.id)) {
              finalTagIds.push(match.id);
            }
          } else {
            try {
              const res = await createTag({ name });
              finalTagIds.push(res.data.id);
            } catch (err) {
              console.error('Failed to create tag', name, err);
            }
          }
        }
      }

      cleanData.tagIds = finalTagIds;
      cleanData.faqs = faqs.map((f, i) => ({ ...f, sortOrder: i }));

      await updateBlog({ id: blog!.id, data: cleanData });
      toast.success('Blog updated successfully!');
      router.push('/admin/blogs');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteBlog(blog!.id);
      toast.success('Blog deleted successfully!');
      router.push('/admin/blogs');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to delete blog');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoadingBlog) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError || !blog) {
    return (
      <Box p={4}>
        <Alert severity="error">Failed to load blog details. Make sure the backend is running.</Alert>
      </Box>
    );
  }

  const onInvalid = (errs: any) => {
    console.error('Validation Errors:', errs);
    const firstErr: any = Object.values(errs)[0];
    if (firstErr?.message) {
      toast.error(`Validation Error: ${firstErr.message}`);
    } else {
      toast.error('Please fix validation errors in the form.');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Edit Blog</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {blog.slug}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="error" onClick={() => setDeleteDialogOpen(true)} disabled={isDeleting} startIcon={<DeleteIcon />}>
            Delete
          </Button>
          <Button variant="outlined" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-blog-form"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} /> : <PublishIcon />}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Box>

      <form id="edit-blog-form" onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {/* ── 1. Basic Information ────────────────────────────────── */}
        <Accordion defaultExpanded sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<ArticleIcon color="primary" />} label="Basic Information" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller name="title" control={control} render={({ field }) => (
                  <TextField {...field} label="Blog Title *" fullWidth error={!!errors.title} helperText={errors.title?.message} />
                )} />
              </Grid>

              <Grid item xs={12}>
                <Controller name="slug" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    label="URL Slug"
                    fullWidth
                    error={!!errors.slug}
                    helperText={errors.slug?.message || `URL: /blog/${watchSlug}`}
                    onChange={(e) => {
                      setSlugManual(true);
                      field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    }}
                    InputProps={{
                      endAdornment: slugManual ? (
                        <InputAdornment position="end">
                          <Button size="small" onClick={() => { setSlugManual(false); setValue('slug', slugify(watchTitle)); }}>
                            Reset
                          </Button>
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                )} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller name="language" control={control} render={({ field }) => (
                  <TextField {...field} select label="Language" fullWidth value={field.value || 'en'}>
                    <MenuItem value="en">🇬🇧 English</MenuItem>
                    <MenuItem value="hi">🇮🇳 Hindi (हिंदी)</MenuItem>
                    <MenuItem value="hinglish">🗣️ Hinglish</MenuItem>
                  </TextField>
                )} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller name="categoryId" control={control} render={({ field }) => (
                  <TextField {...field} select label="Category" fullWidth value={field.value || ''}>
                    <MenuItem value="">None</MenuItem>
                    {(categories as any[]).map((cat: any) => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                  </TextField>
                )} />
              </Grid>

              <Grid item xs={12}>
                <Controller name="excerpt" control={control} render={({ field }) => (
                  <TextField {...field} label="Excerpt / Summary" multiline rows={2} fullWidth
                    helperText={`${(field.value || '').length}/500`}
                    inputProps={{ maxLength: 500 }}
                  />
                )} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ── 2. Content ──────────────────────────────────────────── */}
        <Accordion defaultExpanded sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<ArticleIcon color="primary" />} label="Content" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            {blog.contentJson ? (
              <Controller
                key={editorKey}
                name="contentJson"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value as Record<string, unknown> | null ?? blog.contentJson}
                    onChange={(json) => { field.onChange(json); setValue('content', ' '); }}
                    error={!!errors.content}
                    helperText={errors.content?.message}
                    minHeight={450}
                  />
                )}
              />
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  This blog was created with the old plain-text editor. Saving with the rich editor below will upgrade it to Tiptap format.
                </Alert>
                <Controller
                  key={editorKey}
                  name="contentJson"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value as Record<string, unknown> | null}
                      onChange={(json) => { field.onChange(json); setValue('content', ' '); }}
                      error={!!errors.content}
                      minHeight={450}
                    />
                  )}
                />
              </>
            )}
            <Box sx={{ mt: 2 }}>
              <Controller name="generateToc" control={control} render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={!!field.value} onChange={field.onChange} />}
                  label="Auto-generate Table of Contents from H2/H3 headings"
                />
              )} />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* ── 3. Featured Image ────────────────────────────────────── */}
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<ImageIcon color="primary" />} label="Featured Image" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Controller name="featuredImageUrl" control={control} render={({ field }) => (
                  <ImageUploader value={field.value || ''} onChange={field.onChange} label="Featured Image" />
                )} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={2}>
                  <Controller name="featuredImageAlt" control={control} render={({ field }) => (
                    <TextField {...field} label="Alt Text" fullWidth size="small" inputProps={{ maxLength: 200 }} />
                  )} />
                  <Controller name="featuredImageCaption" control={control} render={({ field }) => (
                    <TextField {...field} label="Caption" fullWidth size="small" inputProps={{ maxLength: 500 }} />
                  )} />
                </Stack>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ── 4. SEO ──────────────────────────────────────────────── */}
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<SearchIcon color="primary" />} label="SEO Settings" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller name="seoTitle" control={control} render={({ field }) => (
                  <TextField {...field} label="SEO Title" fullWidth
                    helperText={`${(field.value || '').length}/70 chars`}
                    inputProps={{ maxLength: 70 }}
                  />
                )} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="focusKeyword" control={control} render={({ field }) => (
                  <TextField {...field} label="Focus Keyword" fullWidth inputProps={{ maxLength: 100 }} />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="seoDescription" control={control} render={({ field }) => (
                  <TextField {...field} label="Meta Description" multiline rows={2} fullWidth
                    helperText={`${(field.value || '').length}/160 chars`}
                    inputProps={{ maxLength: 160 }}
                  />
                )} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="canonicalUrl" control={control} render={({ field }) => (
                  <TextField {...field} label="Canonical URL" fullWidth size="small" placeholder="https://rewabhoomi.com/blog/..." />
                )} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple freeSolo
                  options={[]}
                  value={watch('secondaryKeywords') || []}
                  onChange={(_, val) => setValue('secondaryKeywords', val as string[])}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={index} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Secondary Keywords" size="small" helperText="Press Enter after each" />
                  )}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ── 5. Live Preview ─────────────────────────────────────── */}
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<VisibilityIcon color="primary" />} label="Live Preview (Google + Social)" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <SeoPreview
              title={watchSeoTitle || watchTitle}
              description={watchSeoDesc}
              slug={watchSlug}
              ogTitle={watchOgTitle}
              ogDescription={watchOgDesc}
              ogImageUrl={watchOgImage}
              featuredImageUrl={watchFeaturedImage}
              twitterTitle={watchTwitterTitle}
              twitterDescription={watchTwitterDesc}
              twitterImageUrl={watchTwitterImage}
            />
          </AccordionDetails>
        </Accordion>

        {/* ── 6. Open Graph ───────────────────────────────────────── */}
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<ShareIcon color="primary" />} label="Open Graph / Social Sharing" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller name="ogTitle" control={control} render={({ field }) => (
                  <TextField {...field} label="OG Title" fullWidth size="small" inputProps={{ maxLength: 95 }} />
                )} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="ogDescription" control={control} render={({ field }) => (
                  <TextField {...field} label="OG Description" fullWidth size="small" inputProps={{ maxLength: 200 }} />
                )} />
              </Grid>
              <Grid item xs={12} md={8}>
                <Controller name="ogImageUrl" control={control} render={({ field }) => (
                  <ImageUploader value={field.value || ''} onChange={field.onChange} label="OG Image (1200×630px)" />
                )} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller name="ogImageAlt" control={control} render={({ field }) => (
                  <TextField {...field} label="OG Image Alt" fullWidth size="small" inputProps={{ maxLength: 200 }} />
                )} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ── 7. Twitter / X Card ─────────────────────────────────── */}
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<TwitterIcon color="primary" />} label="Twitter / X Card" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Controller name="twitterCard" control={control} render={({ field }) => (
                  <TextField {...field} select label="Card Type" fullWidth size="small" value={field.value || 'summary_large_image'}>
                    <MenuItem value="summary_large_image">Summary Large Image</MenuItem>
                    <MenuItem value="summary">Summary</MenuItem>
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller name="twitterTitle" control={control} render={({ field }) => (
                  <TextField {...field} label="Twitter Title" fullWidth size="small" inputProps={{ maxLength: 70 }} />
                )} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller name="twitterDescription" control={control} render={({ field }) => (
                  <TextField {...field} label="Twitter Description" fullWidth size="small" inputProps={{ maxLength: 200 }} />
                )} />
              </Grid>
              <Grid item xs={12} md={8}>
                <Controller name="twitterImageUrl" control={control} render={({ field }) => (
                  <ImageUploader value={field.value || ''} onChange={field.onChange} label="Twitter Image" />
                )} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ── 8. FAQ ──────────────────────────────────────────────── */}
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<QuizIcon color="primary" />} label={`FAQ Section${faqs.length > 0 ? ` (${faqs.length})` : ''}`} />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <FaqManager value={faqs} onChange={setFaqs} />
          </AccordionDetails>
        </Accordion>

        {/* ── 9. Publishing ────────────────────────────────────────── */}
        <Accordion defaultExpanded sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<PublishIcon color="primary" />} label="Publishing & Advanced SEO" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Controller name="status" control={control} render={({ field }) => (
                  <TextField {...field} select label="Status" fullWidth value={field.value || 'DRAFT'}>
                    <MenuItem value="DRAFT">📝 Draft</MenuItem>
                    <MenuItem value="PUBLISHED">✅ Published</MenuItem>
                    <MenuItem value="ARCHIVED">🗄️ Archived</MenuItem>
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller name="schemaType" control={control} render={({ field }) => (
                  <TextField {...field} select label="Schema Type" fullWidth value={field.value || 'BlogPosting'}>
                    <MenuItem value="BlogPosting">BlogPosting (Recommended)</MenuItem>
                    <MenuItem value="Article">Article</MenuItem>
                    <MenuItem value="NewsArticle">NewsArticle</MenuItem>
                  </TextField>
                )} />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={allTags as any[]}
                  getOptionLabel={(option: any) => {
                    if (typeof option === 'string') return option;
                    return option.name || '';
                  }}
                  value={(allTags as any[]).filter((t: any) => selectedTagIds.includes(t.id))}
                  inputValue={tagInput}
                  onInputChange={(_, val) => setTagInput(val)}
                  onChange={async (_, newValue) => {
                    const updatedTagIds: string[] = [];
                    for (const item of newValue as any[]) {
                      if (typeof item === 'string') {
                        const cleanedName = item.trim();
                        if (!cleanedName) continue;
                        
                        // Check if there is already an existing tag with this name to avoid duplicating
                        const match = (allTags as any[]).find((t: any) => t.name.toLowerCase() === cleanedName.toLowerCase());
                        if (match) {
                          updatedTagIds.push(match.id);
                        } else {
                          try {
                            const res = await createTag({ name: cleanedName });
                            updatedTagIds.push(res.data.id);
                            toast.success(`Tag "${cleanedName}" created`);
                          } catch {
                            toast.error(`Failed to create tag "${cleanedName}"`);
                          }
                        }
                      } else if (item && item.id) {
                        updatedTagIds.push(item.id);
                      }
                    }
                    setSelectedTagIds(updatedTagIds);
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option: any, index) => (
                      <Chip
                        size="small"
                        label={typeof option === 'string' ? option : option.name}
                        variant="outlined"
                        color="primary"
                        {...getTagProps({ index })}
                        key={option.id || index}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Tags" 
                      placeholder="Select tags or type and press Enter to create new" 
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Robot / Indexing</Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Controller name="allowIndex" control={control} render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={!!field.value} onChange={field.onChange} color="success" />}
                      label="Allow Indexing"
                    />
                  )} />
                  <Controller name="allowFollow" control={control} render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={!!field.value} onChange={field.onChange} color="success" />}
                      label="Allow Link Following"
                    />
                  )} />
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Bottom CTA */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="outlined" color="error" onClick={() => setDeleteDialogOpen(true)} disabled={isDeleting}>
            Delete Blog
          </Button>
          <Button variant="outlined" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} /> : <PublishIcon />}
            sx={{ minWidth: 160 }}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>Delete Blog?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>"{blog.title}"</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will permanently delete the blog and all associated images from Cloudflare R2. This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={18} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
