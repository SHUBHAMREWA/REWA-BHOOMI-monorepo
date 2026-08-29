'use client';

import { IconButton } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  url: string;
  title: string;
  text: string;
  sx?: any;
}

export default function ShareButton({ url, title, text, sx }: ShareButtonProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ensure absolute URL if relative is passed
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

    if (navigator.share) {
      navigator.share({ title, text, url: fullUrl }).catch(console.error);
    } else {
      navigator.clipboard.writeText(fullUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <IconButton onClick={handleShare} sx={sx} size="small">
      <ShareIcon fontSize="small" />
    </IconButton>
  );
}
