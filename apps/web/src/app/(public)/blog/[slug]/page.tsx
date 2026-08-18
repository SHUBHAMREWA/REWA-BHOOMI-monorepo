import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { Container, Typography, Box, Chip, Divider, Avatar } from '@mui/material';
import { format } from 'date-fns';
import { Blog } from '@rewa-bhoomi/types';
import { APP_URL, APP_NAME } from '@rewa-bhoomi/config';

// We fetch blog data on the server side for SEO
async function getBlogData(slug: string): Promise<Blog | null> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${API_URL}/api/v1/blogs/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const blog = await getBlogData(params.slug);

  if (!blog) {
    return { title: 'Blog Not Found' };
  }

  const blogUrl = `${APP_URL}/blog/${blog.slug}`;
  const title = blog.metaTitle || blog.title;
  const description = blog.metaDescription || blog.excerpt || '';
  const image = blog.ogImageUrl || blog.featuredImageUrl || `${APP_URL}/placeholder-image.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: blog.canonicalUrl || blogUrl,
    },
    robots: {
      index: !blog.noIndex,
      follow: !blog.noFollow,
    },
    openGraph: {
      title: blog.ogTitle || title,
      description: blog.ogDescription || description,
      url: blogUrl,
      images: [
        {
          url: image,
          alt: blog.title,
        },
      ],
      type: 'article',
      publishedTime: blog.publishedAt,
      authors: [blog.author?.name || 'Admin'],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.ogTitle || title,
      description: blog.ogDescription || description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const blog = await getBlogData(params.slug);

  if (!blog) {
    notFound();
  }

  const publishedDate = blog.publishedAt ? format(new Date(blog.publishedAt), 'MMMM dd, yyyy') : '';
  const blogUrl = `${APP_URL}/blog/${blog.slug}`;

  // Structured Data (JSON-LD) with dynamic Schema Type configured by admin
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': blog.schemaType || 'BlogPosting',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': blogUrl,
    },
    'headline': blog.title,
    'description': blog.excerpt || blog.metaDescription || '',
    'image': blog.featuredImageUrl || `${APP_URL}/placeholder-image.jpg`,
    'datePublished': blog.publishedAt || blog.createdAt,
    'dateModified': blog.updatedAt || blog.publishedAt || blog.createdAt,
    'author': {
      '@type': 'Person',
      'name': blog.author?.name || 'Admin',
    },
    'publisher': {
      '@type': 'Organization',
      'name': APP_NAME,
      'logo': {
        '@type': 'ImageObject',
        'url': `${APP_URL}/logo.png`, // Fallback url
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': APP_URL,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Blog',
        'item': `${APP_URL}/blog`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': blog.title,
        'item': blogUrl,
      },
    ],
  };

  return (
    <>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box mb={4}>
          {blog.category && (
            <Chip label={blog.category.name} color="primary" sx={{ mb: 2 }} />
          )}
          <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2.25rem', md: '3.5rem' } }}>
            {blog.title}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={2} mt={3} mb={3}>
            <Avatar src={blog.author?.avatar_url} alt={blog.author?.name} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {blog.author?.name || 'Admin'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {publishedDate}
              </Typography>
            </Box>
          </Box>
        </Box>

        {blog.featuredImageUrl && (
          <Box 
            component="img"
            src={blog.featuredImageUrl}
            alt={blog.title}
            sx={{ width: '100%', height: 'auto', borderRadius: 2, mb: 4, objectFit: 'cover', maxHeight: 500 }}
          />
        )}

        <Box sx={{ typography: 'body1', lineHeight: 1.8, fontSize: '1.1rem', mb: 6 }}
             dangerouslySetInnerHTML={{ __html: blog.content }} 
        />

        {blog.tags && blog.tags.length > 0 && (
          <Box mt={4}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Tags
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {blog.tags.map((tag) => (
                <Chip key={tag} label={tag} variant="outlined" />
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
}
