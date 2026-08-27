'use client';

import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Typography, Snackbar, Alert } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkIcon from '@mui/icons-material/Link';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
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

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mr: 1 }}>
          Share this article:
        </Typography>

        <Tooltip title="Share on WhatsApp">
          <IconButton 
            size="small" 
            onClick={() => handleShare(shareUrls.whatsapp)}
            sx={{ bgcolor: '#25D366', color: 'white', '&:hover': { bgcolor: '#128C7E' } }}
          >
            <WhatsAppIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share on Facebook">
          <IconButton 
            size="small" 
            onClick={() => handleShare(shareUrls.facebook)}
            sx={{ bgcolor: '#1877F2', color: 'white', '&:hover': { bgcolor: '#165eab' } }}
          >
            <FacebookIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share on Twitter">
          <IconButton 
            size="small" 
            onClick={() => handleShare(shareUrls.twitter)}
            sx={{ bgcolor: '#1DA1F2', color: 'white', '&:hover': { bgcolor: '#1a91da' } }}
          >
            <TwitterIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Copy Link">
          <IconButton 
            size="small" 
            onClick={handleCopyLink}
            sx={{ bgcolor: 'grey.200', color: 'grey.800', '&:hover': { bgcolor: 'grey.300' } }}
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
