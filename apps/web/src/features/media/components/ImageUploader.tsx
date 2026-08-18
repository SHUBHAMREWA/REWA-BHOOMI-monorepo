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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia();
  const { mutateAsync: deleteMedia, isPending: isDeleting } = useDeleteMedia();

  const compressToWebP = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        
        // Calculate new dimensions (max 1920x1080)
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
        }, 'image/webp', 0.85); // 85% quality
      };
      img.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

  const handleRemove = async () => {
    if (!value) return;
    try {
      await deleteMedia(value);
      onChange('');
      toast.success('Image removed');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to remove image');
    }
  };

  const isLoading = isCompressing || isUploading || isDeleting;

  return (
    <Box sx={{ border: '1px dashed #ccc', borderRadius: 2, p: 2, textAlign: 'center' }}>
      <Typography variant="subtitle2" mb={2} color="text.secondary">{label}</Typography>
      
      {value ? (
        <Box position="relative" display="inline-block">
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
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {isCompressing ? 'Compressing...' : isUploading ? 'Uploading...' : 'Select Image'}
          </Button>
          <Typography variant="caption" display="block" mt={1} color="text.secondary">
            Images will be automatically compressed and converted to WebP
          </Typography>
        </Box>
      )}
    </Box>
  );
};
