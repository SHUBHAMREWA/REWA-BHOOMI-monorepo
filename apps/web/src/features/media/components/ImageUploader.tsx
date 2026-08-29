import React, { useRef, useState } from 'react';
import { Box, Button, Typography, CircularProgress, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useUploadMedia, useDeleteMedia } from '@/features/media/api/useMedia';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange, label = 'Upload Image' }) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia();
  const { mutateAsync: deleteMedia, isPending: isDeleting } = useDeleteMedia();

  const compressToWebP = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        
        let { width, height } = img;
        const maxW = 1920;
        const maxH = 1080;
        
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width *= ratio;
          height *= ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas ctx not available'));
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + '.webp', {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(webpFile);
        }, 'image/webp', 0.85);
      };
      img.onerror = (err) => reject(err);
    });
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }
    try {
      setIsCompressing(true);
      const webpFile = await compressToWebP(file);
      setIsCompressing(false);

      const data = await uploadMedia(webpFile);
      if (data && data.url) {
        onChange(data.url);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      setIsCompressing(false);
      console.error('Upload failed:', error);
      toast.error('Failed to process and upload image');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // 1. Check for standard file drop (from computer)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
      return;
    }

    // 2. Check for dragged image from another browser tab
    const html = e.dataTransfer.getData('text/html');
    const uri = e.dataTransfer.getData('text/uri-list');
    
    let imageUrl = '';
    if (html) {
      const srcMatch = html.match(/src\s*=\s*"([^"]+)"/i);
      if (srcMatch && srcMatch[1]) imageUrl = srcMatch[1];
    }
    if (!imageUrl && uri) {
      imageUrl = uri;
    }

    if (imageUrl) {
      try {
        setIsCompressing(true);
        // First try client side fetch & canvas compression
        try {
          const res = await fetch(imageUrl);
          if (res.ok) {
            const blob = await res.blob();
            if (blob.type.startsWith('image/')) {
              const file = new File([blob], 'dragged-image.jpg', { type: blob.type });
              setIsCompressing(false);
              await processFile(file);
              return;
            }
          }
        } catch {
          // If client fetch is blocked by CORS, proceed to direct server-side download & WebP compression
        }

        // Server-side download + WebP conversion + Cloudflare R2 upload
        const data = await uploadMedia({ imageUrl });
        setIsCompressing(false);
        if (data && data.url) {
          onChange(data.url);
          toast.success('Image imported, converted to WebP, and uploaded to Cloudflare R2!');
        }
      } catch (err) {
        setIsCompressing(false);
        console.error('Cross-tab import failed:', err);
        toast.error('Failed to import image from dragged source.');
      }
    }
  };


  const handleRemove = async () => {
    if (!value) return;
    try {
      await deleteMedia(value);
      onChange('');
      toast.success('Image removed');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to remove image');
    }
  };

  const isLoading = isCompressing || isUploading || isDeleting;

  return (
    <Box 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{ 
        border: '2px dashed', 
        borderColor: isDragging ? 'primary.main' : '#ccc', 
        bgcolor: isDragging ? 'rgba(27, 79, 216, 0.05)' : 'transparent',
        borderRadius: 2, 
        p: 3, 
        textAlign: 'center',
        transition: 'all 0.2s ease',
        cursor: value ? 'default' : 'pointer'
      }}
      onClick={() => !value && !isLoading && fileInputRef.current?.click()}
    >
      <Typography variant="subtitle2" mb={2} color={isDragging ? 'primary.main' : 'text.secondary'}>
        {label}
      </Typography>
      
      {value ? (
        <Box position="relative" display="inline-block" onClick={(e) => e.stopPropagation()}>
          <Box 
            component="img" 
            src={value} 
            alt="Uploaded preview" 
            sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 1 }} 
          />
          <IconButton 
            onClick={handleRemove}
            disabled={isLoading}
            color="error"
            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
          >
            {isDeleting ? <CircularProgress size={24} /> : <DeleteIcon />}
          </IconButton>
        </Box>
      ) : (
        <Box>
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button
            variant="outlined"
            component="span"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            sx={{ pointerEvents: 'none' }}
          >
            {isCompressing ? 'Compressing...' : isUploading ? 'Uploading...' : 'Drag & Drop or Select Image'}
          </Button>
          <Typography variant="caption" display="block" mt={1.5} color="text.secondary">
            Drag an image file here, or drop from another tab
          </Typography>
        </Box>
      )}
    </Box>
  );
};
