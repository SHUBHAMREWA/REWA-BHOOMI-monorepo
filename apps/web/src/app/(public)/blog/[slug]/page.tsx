import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
import { Container, Typography, Box, Chip, Divider, Avatar, Paper, Stack } from '@mui/material';
import { format } from 'date-fns';
import { Blog } from '@rewa-bhoomi/types';
import { APP_URL, APP_NAME } from '@rewa-bhoomi/config';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TranslateIcon from '@mui/icons-material/Translate';
import ShareButtons from '@/features/blogs/components/ShareButtons';

// ─── Server-side data fetch ──────────────────────────────────────────────────

async function getBlogData(slug: string): Promise<Blog | null> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${API_URL}/api/v1/blogs/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

// ─── Metadata (Next.js generateMetadata) ─────────────────────────────────────

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const blog = await getBlogData(params.slug);
  if (!blog) return { title: 'Blog Not Found' };

  const blogUrl = `${APP_URL}/blog/${blog.slug}`;
  const title = blog.seoTitle || blog.metaTitle || blog.title;
  const description = blog.seoDescription || blog.metaDescription || blog.excerpt || '';
  const image = blog.ogImageUrl || blog.featuredImageUrl || `${APP_URL}/placeholder-image.jpg`;
  const imageAlt = blog.ogImageAlt || blog.featuredImageAlt || blog.title;

  // Build hreflang alternates for translated versions
  const langAlternates: Record<string, string> = {};
  if (blog.language) {
    langAlternates[blog.language === 'hinglish' ? 'hi-Latn' : blog.language] = blogUrl;
  }
  const translations = (blog as any).translations as Array<{ slug: string; language: string }> | undefined;
  if (translations && translations.length > 0) {
    for (const t of translations) {
      const tUrl = `${APP_URL}/blog/${t.slug}`;
      langAlternates[t.language === 'hinglish' ? 'hi-Latn' : t.language] = tUrl;
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical: blog.canonicalUrl || blogUrl,
      languages: Object.keys(langAlternates).length > 1 ? langAlternates : undefined,
    },
    robots: {
      index: blog.allowIndex !== undefined ? blog.allowIndex : !blog.noIndex,
      follow: blog.allowFollow !== undefined ? blog.allowFollow : !blog.noFollow,
    },
    openGraph: {
      title: blog.ogTitle || title,
      description: blog.ogDescription || description,
      url: blogUrl,
      images: [{ url: image, alt: imageAlt }],
      type: 'article',
      publishedTime: blog.publishedAt,
      modifiedTime: blog.updatedAt,
      authors: [blog.author?.name || APP_NAME],
      tags: blog.blogTags?.map(t => t.name) || blog.tags || [],
    },
    twitter: {
      card: (blog.twitterCard as any) || 'summary_large_image',
      title: blog.twitterTitle || blog.ogTitle || title,
      description: blog.twitterDescription || blog.ogDescription || description,
      images: [blog.twitterImageUrl || image],
    },
  };
}

// ─── Table of Contents ────────────────────────────────────────────────────────

function extractHeadings(html: string): Array<{ id: string; text: string; level: number }> {
  const regex = /<h([23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
  const headings: Array<{ id: string; text: string; level: number }> = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1], 10),
      id: match[2],
      text: match[3].replace(/<[^>]+>/g, ''),
    });
  }
  return headings;
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const blog = await getBlogData(params.slug);
  if (!blog) notFound();

  const publishedDate = blog.publishedAt ? format(new Date(blog.publishedAt), 'MMMM dd, yyyy') : '';
  const blogUrl = `${APP_URL}/blog/${blog.slug}`;

  // Use content_html (rich text) if available, fall back to legacy content
  const renderedContent = blog.contentHtml || blog.content || '';
  const headings = blog.generateToc ? extractHeadings(renderedContent) : [];
  const hasToc = headings.length > 0;

  // ─── JSON-LD Schemas ────────────────────────────────────────────────────────

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': blog.schemaType || 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': blogUrl },
    headline: blog.title,
    description: blog.seoDescription || blog.metaDescription || blog.excerpt || '',
    image: blog.featuredImageUrl
      ? { '@type': 'ImageObject', url: blog.featuredImageUrl, description: blog.featuredImageAlt || blog.title }
      : `${APP_URL}/placeholder-image.jpg`,
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.updatedAt || blog.publishedAt || blog.createdAt,
    author: {
      '@type': 'Person',
      name: blog.author?.name || APP_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_NAME,
      logo: { '@type': 'ImageObject', url: `${APP_URL}/logo.png` },
    },
    keywords: blog.focusKeyword
      ? [blog.focusKeyword, ...(blog.secondaryKeywords || [])].join(', ')
      : undefined,
    inLanguage: blog.language === 'en' ? 'en-IN' : blog.language === 'hi' ? 'hi-IN' : 'hi',
    wordCount: blog.readingTime ? blog.readingTime * 200 : undefined,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${APP_URL}/blog` },
      ...(blog.category ? [{ '@type': 'ListItem', position: 3, name: blog.category.name, item: `${APP_URL}/blog?category=${blog.category.slug}` }] : []),
      { '@type': 'ListItem', position: blog.category ? 4 : 3, name: blog.title, item: blogUrl },
    ],
  };

  // FAQPage schema — only when FAQs exist
  const faqSchema = blog.faqs && blog.faqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: blog.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null;

  const displayTags = blog.blogTags && blog.blogTags.length > 0
    ? blog.blogTags
    : blog.tags?.map(t => ({ id: t, name: t, slug: t })) || [];

  return (
    <>
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          {/* ── Main Content ─────────────────────────────────────── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <Box mb={4}>
              {/* Category + Language */}
              <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                {blog.category && (
                  <Chip label={blog.category.name} color="primary" size="small" />
                )}
                {blog.language && blog.language !== 'en' && (
                  <Chip
                    icon={<TranslateIcon />}
                    label={blog.language === 'hi' ? 'हिंदी' : 'Hinglish'}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Typography
                variant="h1"
                component="h1"
                fontWeight={800}
                gutterBottom
                sx={{ fontSize: { xs: '1.875rem', md: '2.75rem' }, lineHeight: 1.2, color: 'text.primary' }}
              >
                {blog.title}
              </Typography>

              {blog.excerpt && (
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{ fontSize: '1.125rem', lineHeight: 1.6, mt: 1, mb: 2 }}
                >
                  {blog.excerpt}
                </Typography>
              )}

              {/* Author + Meta */}
              <Box display="flex" alignItems="center" gap={2} mt={3} flexWrap="wrap">
                <Avatar
                  src={blog.author?.avatar_url || ''}
                  alt={blog.author?.name || ''}
                  sx={{ width: 44, height: 44 }}
                />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {blog.author?.name || APP_NAME}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {publishedDate}
                  </Typography>
                </Box>
                {blog.readingTime && (
                  <Chip
                    icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
                    label={`${blog.readingTime} min read`}
                    size="small"
                    variant="outlined"
                    sx={{ ml: { xs: 0, sm: 'auto' } }}
                  />
                )}
                
                <ShareButtons url={blogUrl} title={blog.title} compact={true} />
              </Box>
            </Box>

            {/* Featured Image */}
            {blog.featuredImageUrl && (
              <Box mb={5}>
                <Box
                  component="img"
                  src={blog.featuredImageUrl}
                  alt={blog.featuredImageAlt || blog.title}
                  sx={{
                    width: '100%',
                    height: { xs: 220, sm: 350, md: 'auto' }, // Small rectangular on mobile
                    maxHeight: 500,
                    objectFit: 'cover',
                    borderRadius: 3,
                    display: 'block',
                  }}
                />
                {blog.featuredImageCaption && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', textAlign: 'center', mt: 1 }}
                  >
                    {blog.featuredImageCaption}
                  </Typography>
                )}
              </Box>
            )}

            {/* Blog Content */}
            <Box
              className="blog-content"
              sx={{
                fontSize: '1.0625rem',
                lineHeight: 1.8,
                color: 'text.primary',
                mb: 6,
                '& h1': { fontSize: '2rem', fontWeight: 700, mt: 4, mb: 1.5, color: 'text.primary' },
                '& h2': { fontSize: '1.5rem', fontWeight: 700, mt: 3.5, mb: 1.5, color: 'text.primary', scrollMarginTop: '80px' },
                '& h3': { fontSize: '1.25rem', fontWeight: 600, mt: 3, mb: 1, color: 'text.primary', scrollMarginTop: '80px' },
                '& p': { mb: 1.75 },
                '& ul, & ol': { pl: 3, mb: 1.75 },
                '& li': { mb: 0.75, lineHeight: 1.7 },
                '& blockquote': {
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  pl: 3,
                  py: 1,
                  my: 3,
                  color: 'text.secondary',
                  fontStyle: 'italic',
                  bgcolor: 'grey.50',
                  borderRadius: '0 8px 8px 0',
                },
                '& a': {
                  color: 'primary.main',
                  textDecoration: 'none',
                  borderBottom: '1px solid',
                  borderColor: 'primary.light',
                  '&:hover': { borderColor: 'primary.main' },
                },
                '& strong': { fontWeight: 700 },
                '& em': { fontStyle: 'italic' },
                '& code': {
                  fontFamily: 'monospace',
                  bgcolor: 'grey.100',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.75,
                  fontSize: '0.875em',
                  color: 'error.dark',
                },
                '& pre': {
                  bgcolor: '#1e1e1e',
                  color: '#d4d4d4',
                  p: 2.5,
                  borderRadius: 2,
                  overflowX: 'auto',
                  mb: 2.5,
                  '& code': { bgcolor: 'transparent', color: 'inherit', fontSize: '0.9em' },
                },
                '& hr': { my: 4, border: 'none', borderTop: '2px solid', borderColor: 'divider' },
                '& img': { maxWidth: '100%', borderRadius: 2, my: 2 },
                '& figure': { my: 3, textAlign: 'center' },
                '& figcaption': { fontSize: '0.875rem', color: 'text.secondary', mt: 1 },
                '& table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                  mb: 3,
                  fontSize: '0.9375rem',
                },
                '& th, & td': {
                  border: '1px solid',
                  borderColor: 'divider',
                  px: 2,
                  py: 1.25,
                  textAlign: 'left',
                },
                '& th': { bgcolor: 'grey.100', fontWeight: 700 },
                '& .youtube-embed': {
                  position: 'relative',
                  paddingBottom: '56.25%',
                  my: 3,
                  borderRadius: 2,
                  overflow: 'hidden',
                },
                '& .youtube-embed iframe': {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                },
              }}
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />

            {/* FAQ Section */}
            {blog.faqs && blog.faqs.length > 0 && (
              <Box mb={6}>
                <Divider sx={{ mb: 4 }} />
                <Typography variant="h2" component="h2" fontSize="1.5rem" fontWeight={700} mb={3}>
                  Frequently Asked Questions
                </Typography>
                {blog.faqs.map((faq, index) => (
                  <Paper
                    key={faq.id || index}
                    variant="outlined"
                    sx={{ mb: 2, p: 3, borderRadius: 2 }}
                  >
                    <Typography variant="subtitle1" fontWeight={700} mb={1} color="primary.main">
                      {faq.question}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                      {faq.answer}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}

            {/* Tags */}
            {displayTags.length > 0 && (
              <Box mt={4}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                  Tags
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {displayTags.map(tag => (
                    <Chip
                      key={tag.id || tag.name}
                      label={tag.name}
                      variant="outlined"
                      size="small"
                      sx={{ borderRadius: 2 }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Share Buttons */}
            <ShareButtons url={blogUrl} title={blog.title} />

            {/* Author Box */}
            <Paper variant="outlined" sx={{ mt: 6, p: 3, borderRadius: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar
                src={blog.author?.avatar_url || ''}
                alt={blog.author?.name || ''}
                sx={{ width: 56, height: 56 }}
              />
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>Written by {blog.author?.name || APP_NAME}</Typography>
                <Typography variant="caption" color="text.secondary">{APP_NAME} Real Estate Expert</Typography>
              </Box>
            </Paper>
          </Box>

          {/* ── Table of Contents (Sticky Sidebar) ─────────────── */}
          {hasToc && (
            <Box
              component="aside"
              sx={{
                width: 260,
                flexShrink: 0,
                display: { xs: 'none', lg: 'block' },
                position: 'sticky',
                top: 80,
                maxHeight: 'calc(100vh - 100px)',
                overflowY: 'auto',
              }}
            >
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2} color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
                  Table of Contents
                </Typography>
                {headings.map((h, i) => (
                  <Box
                    key={i}
                    component="a"
                    href={`#${h.id}`}
                    sx={{
                      display: 'block',
                      py: 0.5,
                      px: h.level === 3 ? 2 : 0,
                      fontSize: h.level === 2 ? '0.875rem' : '0.8125rem',
                      fontWeight: h.level === 2 ? 500 : 400,
                      color: 'text.secondary',
                      textDecoration: 'none',
                      borderLeft: h.level === 3 ? '2px solid' : 'none',
                      borderColor: 'divider',
                      '&:hover': { color: 'primary.main' },
                      transition: 'color 0.2s',
                    }}
                  >
                    {h.text}
                  </Box>
                ))}
              </Paper>
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
}
