'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Paper, CircularProgress, MenuItem,
  Grid, Accordion, AccordionSummary, AccordionDetails, FormControlLabel,
  Switch, Chip, Autocomplete, InputAdornment, Alert, Divider, Stack,
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
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateBlogSchema } from '@rewa-bhoomi/validation';
import type { CreateBlogInput } from '@rewa-bhoomi/validation';
import { useCreateBlog, useBlogCategories, useBlogTags, useCreateBlogTag } from '@/features/blogs/api/useBlogs';
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

export default function CreateBlogPage() {
  const router = useRouter();
  const { mutateAsync: createBlog } = useCreateBlog();
  const { data: categories = [] } = useBlogCategories();
  const { data: allTags = [] } = useBlogTags();
  const { mutateAsync: createTag } = useCreateBlogTag();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateBlogInput>({
    resolver: zodResolver(CreateBlogSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: ' ', // satisfy either/or refine with a space
      language: 'en',
      status: 'DRAFT',
      twitterCard: 'summary_large_image',
      schemaType: 'BlogPosting',
      noIndex: false,
      noFollow: false,
      allowIndex: true,
      allowFollow: true,
      generateToc: false,
      secondaryKeywords: [],
      tagIds: [],
      faqs: [],
    },
  });

  const watchTitle = watch('title');
  const watchSlug = watch('slug');
  const watchSeoTitle = watch('seoTitle');
  const watchSeoDesc = watch('seoDescription');
  const watchOgTitle = watch('ogTitle');
  const watchOgDesc = watch('ogDescription');
  const watchOgImage = watch('ogImageUrl');
  const watchFeaturedImage = watch('featuredImageUrl');
  const watchTwitterTitle = watch('twitterTitle');
  const watchTwitterDesc = watch('twitterDescription');
  const watchTwitterImage = watch('twitterImageUrl');

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual && watchTitle) {
      setValue('slug', slugify(watchTitle));
    }
  }, [watchTitle, slugManual, setValue]);

  const handleCreateTag = useCallback(async (name: string) => {
    try {
      const result = await createTag({ name });
      setSelectedTagIds(prev => [...prev, result.data.id]);
      toast.success(`Tag "${name}" created`);
    } catch {
      toast.error('Failed to create tag');
    }
  }, [createTag]);

  const onSubmit = async (formData: CreateBlogInput) => {
    try {
      setIsSubmitting(true);

      // Clean empty strings for URL fields
      const cleanData: any = { ...formData };
      const urlFields = ['featuredImageUrl', 'canonicalUrl', 'ogImageUrl', 'twitterImageUrl'];
      urlFields.forEach(f => { if (cleanData[f] === '') cleanData[f] = undefined; });

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

      // If no contentJson, we use content field
      if (!cleanData.contentJson) {
        if (!cleanData.content || cleanData.content === ' ') {
          toast.error('Please write some content in the editor');
          setIsSubmitting(false);
          return;
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
          <Typography variant="h4" fontWeight={700}>Create New Blog</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Production-ready SEO-friendly blog post
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="blog-form"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} /> : <PublishIcon />}
          >
            {isSubmitting ? 'Creating...' : 'Create Blog'}
          </Button>
        </Stack>
      </Box>

      <form id="blog-form" onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {/* ── 1. Basic Information ───────────────────────────────────── */}
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

              {/* Slug */}
              <Grid item xs={12}>
                <Controller name="slug" control={control} render={({ field }) => (
                  <TextField
                    {...field}
                    label="URL Slug"
                    fullWidth
                    error={!!errors.slug}
                    helperText={errors.slug?.message || `URL: /blog/${watchSlug || 'auto-generated'}`}
                    onChange={(e) => {
                      setSlugManual(true);
                      field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    }}
                    InputProps={{
                      endAdornment: slugManual ? (
                        <InputAdornment position="end">
                          <Button size="small" onClick={() => { setSlugManual(false); setValue('slug', slugify(watchTitle)); }}>
                            Auto
                          </Button>
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                )} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller name="language" control={control} render={({ field }) => (
                  <TextField {...field} select label="Language" fullWidth>
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
                    helperText={`${(field.value || '').length}/500 — Shown in blog cards and search results`}
                    inputProps={{ maxLength: 500 }}
                  />
                )} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ── 2. Content ─────────────────────────────────────────────── */}
        <Accordion defaultExpanded sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<ArticleIcon color="primary" />} label="Content" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Controller
              name="contentJson"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value as Record<string, unknown> | null}
                  onChange={(json) => {
                    field.onChange(json);
                    setValue('content', ' '); // satisfy refine
                  }}
                  error={!!errors.content}
                  helperText={errors.content?.message}
                  minHeight={450}
                />
              )}
            />
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Controller name="generateToc" control={control} render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={!!field.value} onChange={field.onChange} />}
                  label="Auto-generate Table of Contents from H2/H3 headings"
                />
              )} />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* ── 3. Featured Image ───────────────────────────────────────── */}
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<ImageIcon color="primary" />} label="Featured Image" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Controller name="featuredImageUrl" control={control} render={({ field }) => (
                  <ImageUploader value={field.value || ''} onChange={field.onChange} label="Featured Image (auto-converted to WebP)" />
                )} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={2}>
                  <Controller name="featuredImageAlt" control={control} render={({ field }) => (
                    <TextField {...field} label="Alt Text" fullWidth size="small"
                      helperText="Describe the image for accessibility & SEO"
                      inputProps={{ maxLength: 200 }}
                    />
                  )} />
                  <Controller name="featuredImageCaption" control={control} render={({ field }) => (
                    <TextField {...field} label="Caption" fullWidth size="small"
                      helperText="Displayed below image on the blog post"
                      inputProps={{ maxLength: 500 }}
                    />
                  )} />
                </Stack>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ── 4. SEO Fields ──────────────────────────────────────────── */}
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<SearchIcon color="primary" />} label="SEO Settings" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller name="seoTitle" control={control} render={({ field }) => (
                  <TextField {...field} label="SEO Title" fullWidth
                    helperText={`${(field.value || '').length}/70 chars — if blank, blog title is used`}
                    inputProps={{ maxLength: 70 }}
                  />
                )} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="focusKeyword" control={control} render={({ field }) => (
                  <TextField {...field} label="Focus Keyword" fullWidth
                    helperText="Primary keyword this blog targets"
                    inputProps={{ maxLength: 100 }}
                  />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="seoDescription" control={control} render={({ field }) => (
                  <TextField {...field} label="Meta Description" multiline rows={2} fullWidth
                    helperText={`${(field.value || '').length}/160 chars — shown in Google search results`}
                    inputProps={{ maxLength: 160 }}
                  />
                )} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="canonicalUrl" control={control} render={({ field }) => (
                  <TextField {...field} label="Canonical URL" fullWidth size="small"
                    helperText="Leave empty to use this page's URL"
                    placeholder="https://rewabhoomi.com/blog/..."
                  />
                )} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={watch('secondaryKeywords') || []}
                  onChange={(_, val) => setValue('secondaryKeywords', val as string[])}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={index} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Secondary Keywords" size="small" helperText="Press Enter after each keyword" />
                  )}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ── 5. SEO Preview ─────────────────────────────────────────── */}
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<VisibilityIcon color="primary" />} label="Live Preview (Google + Social)" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <SeoPreview
              title={watchSeoTitle || watchTitle || ''}
              description={watchSeoDesc || ''}
              slug={watchSlug || ''}
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

        {/* ── 6. Open Graph / Social ─────────────────────────────────── */}
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<ShareIcon color="primary" />} label="Open Graph / Social Sharing" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              These override what appears when users share your post on Facebook, WhatsApp, LinkedIn etc. Leave blank to use SEO title/description.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller name="ogTitle" control={control} render={({ field }) => (
                  <TextField {...field} label="OG Title" fullWidth size="small"
                    helperText={`${(field.value || '').length}/95 chars`}
                    inputProps={{ maxLength: 95 }}
                  />
                )} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="ogDescription" control={control} render={({ field }) => (
                  <TextField {...field} label="OG Description" fullWidth size="small"
                    helperText={`${(field.value || '').length}/200 chars`}
                    inputProps={{ maxLength: 200 }}
                  />
                )} />
              </Grid>
              <Grid item xs={12} md={8}>
                <Controller name="ogImageUrl" control={control} render={({ field }) => (
                  <ImageUploader value={field.value || ''} onChange={field.onChange} label="OG Image (1200×630px recommended)" />
                )} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller name="ogImageAlt" control={control} render={({ field }) => (
                  <TextField {...field} label="OG Image Alt Text" fullWidth size="small" inputProps={{ maxLength: 200 }} />
                )} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ── 7. Twitter / X Card ────────────────────────────────────── */}
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<TwitterIcon color="primary" />} label="Twitter / X Card" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Controller name="twitterCard" control={control} render={({ field }) => (
                  <TextField {...field} select label="Card Type" fullWidth size="small">
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
                  <ImageUploader value={field.value || ''} onChange={field.onChange} label="Twitter Image (2:1 ratio recommended)" />
                )} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ── 8. FAQ ─────────────────────────────────────────────────── */}
        <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader
              icon={<QuizIcon color="primary" />}
              label={`FAQ Section${faqs.length > 0 ? ` (${faqs.length})` : ''}`}
            />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <FaqManager value={faqs} onChange={setFaqs} />
          </AccordionDetails>
        </Accordion>

        {/* ── 9. Publishing ───────────────────────────────────────────── */}
        <Accordion defaultExpanded sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3 }}>
            <SectionHeader icon={<PublishIcon color="primary" />} label="Publishing & Advanced SEO" />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Controller name="status" control={control} render={({ field }) => (
                  <TextField {...field} select label="Status" fullWidth>
                    <MenuItem value="DRAFT">📝 Draft</MenuItem>
                    <MenuItem value="PUBLISHED">✅ Published</MenuItem>
                    <MenuItem value="ARCHIVED">🗄️ Archived</MenuItem>
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller name="schemaType" control={control} render={({ field }) => (
                  <TextField {...field} select label="Schema Type" fullWidth>
                    <MenuItem value="BlogPosting">BlogPosting (Recommended)</MenuItem>
                    <MenuItem value="Article">Article</MenuItem>
                    <MenuItem value="NewsArticle">NewsArticle</MenuItem>
                  </TextField>
                )} />
              </Grid>

              {/* Tags */}
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
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Robot / Indexing Settings</Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Controller name="allowIndex" control={control} render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={!!field.value} onChange={field.onChange} color="success" />}
                      label="Allow Search Engines to Index"
                    />
                  )} />
                  <Controller name="allowFollow" control={control} render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={!!field.value} onChange={field.onChange} color="success" />}
                      label="Allow Link Following"
                    />
                  )} />
                </Box>
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Keep both ON for published blogs. Turning OFF will hide the post from Google.
                </Alert>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Bottom Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
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
            {isSubmitting ? 'Creating...' : 'Create Blog'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
