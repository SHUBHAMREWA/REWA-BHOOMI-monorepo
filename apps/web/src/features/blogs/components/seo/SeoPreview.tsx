'use client';

import React from 'react';
import { Box, Typography, Paper, Divider, Avatar, Chip } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';

interface SeoPreviewProps {
  title: string;
  description: string;
  slug: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageUrl?: string;
  featuredImageUrl?: string;
  siteUrl?: string;
}

const MAX_TITLE_CHARS = 60;
const MAX_DESC_CHARS = 160;

const getCharCountColor = (count: number, max: number) => {
  const ratio = count / max;
  if (ratio < 0.5) return '#9e9e9e';
  if (ratio <= 1) return '#4caf50';
  return '#f44336';
};

export const SeoPreview: React.FC<SeoPreviewProps> = ({
  title = '',
  description = '',
  slug = '',
  ogTitle,
  ogDescription,
  ogImageUrl,
  featuredImageUrl,
  twitterTitle,
  twitterDescription,
  twitterImageUrl,
  siteUrl = 'rewabhoomi.com',
}) => {
  const displayTitle = title ? (title.length > 60 ? title.slice(0, 57) + '...' : title) : 'Blog Title Preview';
  const displayDescription = description
    ? description.length > 160 ? description.slice(0, 157) + '...' : description
    : 'Your meta description will appear here. Write a compelling summary that encourages users to click.';
  const displayUrl = `${siteUrl}/blog/${slug || 'your-blog-slug'}`;

  const ogImg = ogImageUrl || featuredImageUrl;
  const socialTitle = ogTitle || title;
  const socialDesc = ogDescription || description;
  const twtImg = twitterImageUrl || ogImg;
  const twtTitle = twitterTitle || socialTitle;
  const twtDesc = twitterDescription || socialDesc;

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <PublicIcon fontSize="small" />
        Google Search Preview
      </Typography>

      {/* Google SERP Preview */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2,
          bgcolor: '#fff',
          mb: 3,
          maxWidth: 600,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            R
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#202124', lineHeight: 1.2, display: 'block' }}>
              {siteUrl}
            </Typography>
            <Typography variant="caption" sx={{ color: '#4d5156', fontSize: '0.7rem', display: 'block' }}>
              {displayUrl}
            </Typography>
          </Box>
        </Box>
        <Typography
          sx={{
            color: '#1a0dab',
            fontSize: '1.1rem',
            lineHeight: 1.3,
            mb: 0.5,
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {displayTitle}
        </Typography>
        <Typography variant="body2" sx={{ color: '#4d5156', lineHeight: 1.5, fontSize: '0.875rem' }}>
          {displayDescription}
        </Typography>
      </Paper>

      {/* Character counters */}
      <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">SEO Title</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 80,
                height: 4,
                borderRadius: 2,
                bgcolor: 'grey.200',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${Math.min(100, (title.length / MAX_TITLE_CHARS) * 100)}%`,
                  bgcolor: getCharCountColor(title.length, MAX_TITLE_CHARS),
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: getCharCountColor(title.length, MAX_TITLE_CHARS) }}>
              {title.length}/{MAX_TITLE_CHARS}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Meta Description</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 120, height: 4, borderRadius: 2, bgcolor: 'grey.200', overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${Math.min(100, (description.length / MAX_DESC_CHARS) * 100)}%`,
                  bgcolor: getCharCountColor(description.length, MAX_DESC_CHARS),
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: getCharCountColor(description.length, MAX_DESC_CHARS) }}>
              {description.length}/{MAX_DESC_CHARS}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Social Preview */}
      <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <FacebookIcon fontSize="small" />
        Open Graph / Social Preview
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          maxWidth: 500,
          mb: 3,
          bgcolor: '#f0f2f5',
        }}
      >
        {ogImg ? (
          <Box
            component="img"
            src={ogImg}
            alt="OG preview"
            sx={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: 260,
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.disabled">No OG image set</Typography>
          </Box>
        )}
        <Box sx={{ p: 1.5, bgcolor: '#f0f2f5' }}>
          <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
            {siteUrl.toUpperCase()}
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ color: '#1d2129', lineHeight: 1.3, my: 0.25 }}>
            {socialTitle || 'Blog Title'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#606770', display: 'block' }}>
            {socialDesc
              ? socialDesc.length > 100 ? socialDesc.slice(0, 97) + '...' : socialDesc
              : 'Description preview...'}
          </Typography>
        </Box>
      </Paper>

      {/* Twitter Preview */}
      <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TwitterIcon fontSize="small" />
        Twitter / X Card Preview
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          maxWidth: 500,
          position: 'relative',
        }}
      >
        {twtImg ? (
          <Box
            component="img"
            src={twtImg}
            alt="Twitter card preview"
            sx={{ width: '100%', height: 250, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: 250,
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.disabled">No Twitter image set</Typography>
          </Box>
        )}
        <Box sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight={600} sx={{ color: '#0f1419', lineHeight: 1.3 }}>
            {twtTitle || 'Twitter Card Title'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#536471', display: 'block', mt: 0.25 }}>
            {twtDesc
              ? twtDesc.length > 100 ? twtDesc.slice(0, 97) + '...' : twtDesc
              : 'Twitter description preview...'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#536471', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <PublicIcon sx={{ fontSize: 12 }} /> {siteUrl}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
