'use client';

import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Typography, Snackbar, Alert } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import LinkIcon from '@mui/icons-material/Link';
import ShareIcon from '@mui/icons-material/Share';

interface ShareButtonsProps {
  url: string;
  title: string;
  compact?: boolean;
}

export default function ShareButtons({ url, title, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrls = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} \n${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleShare = (platformUrl: string) => {
    window.open(platformUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url
        });
      } catch (err) {
        console.error('Native share failed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  if (compact) {
    return (
      <>
        <Tooltip title="Share Article">
          <IconButton
            size="small"
            aria-label="Share Article"
            onClick={handleNativeShare}
            sx={{ border: '1px solid', borderColor: 'divider', width: 36, height: 36 }}
          >
            <ShareIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </IconButton>
        </Tooltip>
        <Snackbar 
          open={copied} 
          autoHideDuration={3000} 
          onClose={() => setCopied(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setCopied(false)} sx={{ width: '100%' }}>
            Link copied to clipboard!
          </Alert>
        </Snackbar>
      </>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mr: 1 }}>
          Share this article:
        </Typography>

        <Tooltip title="Share on WhatsApp">
          <IconButton 
            size="small" 
            aria-label="Share on WhatsApp"
            onClick={() => handleShare(shareUrls.whatsapp)}
            sx={{ bgcolor: '#25D366', color: 'white', width: 36, height: 36, '&:hover': { bgcolor: '#128C7E' } }}
          >
            <WhatsAppIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share on Facebook">
          <IconButton 
            size="small" 
            aria-label="Share on Facebook"
            onClick={() => handleShare(shareUrls.facebook)}
            sx={{ bgcolor: '#1877F2', color: 'white', width: 36, height: 36, '&:hover': { bgcolor: '#165eab' } }}
          >
            <FacebookIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share on X (Twitter)">
          <IconButton 
            size="small" 
            aria-label="Share on X (Twitter)"
            onClick={() => handleShare(shareUrls.twitter)}
            sx={{ bgcolor: '#000000', color: 'white', width: 36, height: 36, '&:hover': { bgcolor: '#333333' } }}
          >
            <XIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Copy Link">
          <IconButton 
            size="small" 
            aria-label="Copy Link"
            onClick={handleCopyLink}
            sx={{ bgcolor: 'grey.200', color: 'grey.800', width: 36, height: 36, '&:hover': { bgcolor: 'grey.300' } }}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Snackbar 
        open={copied} 
        autoHideDuration={3000} 
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setCopied(false)} sx={{ width: '100%' }}>
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
}
