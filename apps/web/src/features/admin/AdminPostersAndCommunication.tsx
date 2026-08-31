'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  InputAdornment,
  Stack,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SaveIcon from '@mui/icons-material/Save';

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import type { Poster, CompanyCommunication } from '@rewa-bhoomi/types';

export default function AdminPostersAndCommunication() {
  const [activeTab, setActiveTab] = useState(0);

  // ─── Posters State ────────────────────────────────────────────────────────────
  const [posters, setPosters] = useState<Poster[]>([]);
  const [isLoadingPosters, setIsLoadingPosters] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [posterError, setPosterError] = useState<string | null>(null);
  const [posterSuccess, setPosterSuccess] = useState<string | null>(null);

  // Desktop Poster Image
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [desktopDraggedUrl, setDesktopDraggedUrl] = useState<string | null>(null);
  const [desktopPreviewUrl, setDesktopPreviewUrl] = useState<string | null>(null);
  const [isDesktopDragging, setIsDesktopDragging] = useState(false);
  const desktopFileInputRef = useRef<HTMLInputElement | null>(null);

  // Mobile Poster Image
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [mobileDraggedUrl, setMobileDraggedUrl] = useState<string | null>(null);
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string | null>(null);
  const [isMobileDragging, setIsMobileDragging] = useState(false);
  const mobileFileInputRef = useRef<HTMLInputElement | null>(null);

  // Poster Meta
  const [posterTitle, setPosterTitle] = useState('');
  const [posterVideoUrl, setPosterVideoUrl] = useState('');
  const [posterRedirectUrl, setPosterRedirectUrl] = useState('');
  const [posterSortOrder, setPosterSortOrder] = useState<number>(0);
  const [posterIsActive, setPosterIsActive] = useState(true);

  const getYouTubeVideoId = (url?: string | null): string | null => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Delete Poster Dialog
  const [deleteTarget, setDeleteTarget] = useState<Poster | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Communication State ──────────────────────────────────────────────────────
  const [communication, setCommunication] = useState<CompanyCommunication>({
    id: 'default',
    whatsapp_number: '',
    whatsapp_message: '',
    instagram_url: '',
    twitter_url: '',
    youtube_url: '',
    facebook_url: '',
    linkedin_url: '',
    contact_phone: '',
    contact_email: '',
    office_address: '',
    updated_at: '',
  });
  const [isLoadingComm, setIsLoadingComm] = useState(true);
  const [isSavingComm, setIsSavingComm] = useState(false);
  const [commSuccess, setCommSuccess] = useState<string | null>(null);
  const [commError, setCommError] = useState<string | null>(null);

  // ─── Load Initial Data ────────────────────────────────────────────────────────
  useEffect(() => {
    loadPosters();
    loadCommunication();
  }, []);

  const loadPosters = async () => {
    setIsLoadingPosters(true);
    setPosterError(null);
    try {
      const data = await apiGet<Poster[]>('/posters/admin');
      setPosters(data || []);
      setPosterSortOrder((data || []).length);
    } catch (err: any) {
      setPosterError(err?.response?.data?.error?.message || 'Failed to load posters');
    } finally {
      setIsLoadingPosters(false);
    }
  };

  const loadCommunication = async () => {
    setIsLoadingComm(true);
    setCommError(null);
    try {
      const data = await apiGet<CompanyCommunication>('/communication');
      if (data) {
        setCommunication(data);
      }
    } catch (err: any) {
      setCommError(err?.response?.data?.error?.message || 'Failed to load communication settings');
    } finally {
      setIsLoadingComm(false);
    }
  };

  // Helper to extract image URL from HTML / Drag data
  const extractImageUrlFromData = (dataTransfer: DataTransfer): string | null => {
    const uri = dataTransfer.getData('text/uri-list') || dataTransfer.getData('URL');
    if (uri && (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:image/'))) {
      return uri;
    }

    const html = dataTransfer.getData('text/html');
    if (html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const img = doc.querySelector('img');
      if (img && img.src) {
        return img.src;
      }
    }

    const text = dataTransfer.getData('text/plain');
    if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
      return text.trim();
    }

    return null;
  };

  // ─── Desktop Image Handlers ───────────────────────────────────────────────────
  const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setPosterError('Please select a valid image file');
        return;
      }
      setDesktopFile(file);
      setDesktopDraggedUrl(null);
      setDesktopPreviewUrl(URL.createObjectURL(file));
      setPosterError(null);
    }
  };

  const handleDesktopDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDesktopDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setDesktopFile(file);
        setDesktopDraggedUrl(null);
        setDesktopPreviewUrl(URL.createObjectURL(file));
        setPosterError(null);
        return;
      }
    }

    const extractedUrl = extractImageUrlFromData(e.dataTransfer);
    if (extractedUrl) {
      setDesktopErrorState(null);
      setDesktopPreviewUrl(extractedUrl);
      setDesktopDraggedUrl(extractedUrl);
      setDesktopFile(null);
      return;
    }
    setPosterError('Could not detect an image from dropped content.');
  };

  const handleDesktopPaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        setDesktopFile(file);
        setDesktopDraggedUrl(null);
        setDesktopPreviewUrl(URL.createObjectURL(file));
        setPosterError(null);
        return;
      }
    }
    const text = e.clipboardData.getData('text');
    if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
      setDesktopPreviewUrl(text.trim());
      setDesktopDraggedUrl(text.trim());
      setDesktopFile(null);
      setPosterError(null);
    }
  };

  // ─── Mobile Image Handlers ────────────────────────────────────────────────────
  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setPosterError('Please select a valid image file');
        return;
      }
      setMobileFile(file);
      setMobileDraggedUrl(null);
      setMobilePreviewUrl(URL.createObjectURL(file));
      setPosterError(null);
    }
  };

  const handleMobileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMobileDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setMobileFile(file);
        setMobileDraggedUrl(null);
        setMobilePreviewUrl(URL.createObjectURL(file));
        setPosterError(null);
        return;
      }
    }

    const extractedUrl = extractImageUrlFromData(e.dataTransfer);
    if (extractedUrl) {
      setPosterError(null);
      setMobilePreviewUrl(extractedUrl);
      setMobileDraggedUrl(extractedUrl);
      setMobileFile(null);
      return;
    }
    setPosterError('Could not detect an image from dropped content.');
  };

  const handleMobilePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        setMobileFile(file);
        setMobileDraggedUrl(null);
        setMobilePreviewUrl(URL.createObjectURL(file));
        setPosterError(null);
        return;
      }
    }
    const text = e.clipboardData.getData('text');
    if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
      setMobilePreviewUrl(text.trim());
      setMobileDraggedUrl(text.trim());
      setMobileFile(null);
      setPosterError(null);
    }
  };

  const setDesktopErrorState = (_: any) => setPosterError(null);

  // ─── Poster Upload ────────────────────────────────────────────────────────────
  const handleUploadPoster = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasDesktop = Boolean(desktopFile || desktopDraggedUrl);
    const hasMobile = Boolean(mobileFile || mobileDraggedUrl);
    const hasVideo = Boolean(posterVideoUrl.trim());

    if (hasVideo && !getYouTubeVideoId(posterVideoUrl.trim())) {
      setPosterError('Please enter a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)');
      return;
    }

    if (!hasDesktop && !hasMobile && !hasVideo) {
      setPosterError('Please provide at least a Desktop/Mobile poster image or a YouTube video link.');
      return;
    }
    if (posters.length >= 6) {
      setPosterError('Maximum of 6 posters reached. Delete an existing poster first.');
      return;
    }

    setIsUploading(true);
    setPosterError(null);
    setPosterSuccess(null);

    try {
      const formData = new FormData();

      // Desktop Image
      if (desktopFile) {
        formData.append('desktopImage', desktopFile);
      } else if (desktopDraggedUrl) {
        formData.append('desktopImageUrl', desktopDraggedUrl);
      }

      // Mobile Image
      if (mobileFile) {
        formData.append('mobileImage', mobileFile);
      } else if (mobileDraggedUrl) {
        formData.append('mobileImageUrl', mobileDraggedUrl);
      }

      if (posterTitle) formData.append('title', posterTitle);
      if (hasVideo) formData.append('videoUrl', posterVideoUrl.trim());
      if (posterRedirectUrl) formData.append('redirectUrl', posterRedirectUrl);
      formData.append('sortOrder', posterSortOrder.toString());
      formData.append('isActive', posterIsActive.toString());

      await apiPost('/posters', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPosterSuccess('Poster successfully created and published!');
      
      // Reset inputs
      setDesktopFile(null);
      setDesktopDraggedUrl(null);
      setDesktopPreviewUrl(null);
      setMobileFile(null);
      setMobileDraggedUrl(null);
      setMobilePreviewUrl(null);
      setPosterTitle('');
      setPosterVideoUrl('');
      setPosterRedirectUrl('');
      if (desktopFileInputRef.current) desktopFileInputRef.current.value = '';
      if (mobileFileInputRef.current) mobileFileInputRef.current.value = '';
      
      await loadPosters();
    } catch (err: any) {
      setPosterError(err?.response?.data?.error?.message || 'Failed to upload poster');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (poster: Poster) => {
    try {
      await apiPatch(`/posters/${poster.id}`, { isActive: !poster.is_active });
      setPosters((prev) =>
        prev.map((p) => (p.id === poster.id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch (err: any) {
      setPosterError('Failed to update poster status');
    }
  };

  const handleDeletePoster = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiDelete(`/posters/${deleteTarget.id}`);
      setPosters((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      setPosterSuccess('Poster and all Cloudflare R2 assets successfully deleted');
    } catch (err: any) {
      setPosterError(err?.response?.data?.error?.message || 'Failed to delete poster');
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Communication Handlers ───────────────────────────────────────────────────
  const handleSaveCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingComm(true);
    setCommSuccess(null);
    setCommError(null);

    try {
      const response = await apiPut<CompanyCommunication>('/communication', communication);
      setCommSuccess('Communication and social media settings updated successfully!');
      if (response?.data) {
        setCommunication(response.data);
      }
    } catch (err: any) {
      setCommError(err?.response?.data?.error?.message || 'Failed to update communication settings');
    } finally {
      setIsSavingComm(false);
    }
  };


  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#0F172A">
          Posters & Communication Settings
        </Typography>
        <Typography variant="body1" color="#64748B" mt={0.5}>
          Manage home page banner posters (separate Desktop & Mobile WebP images) and company social media links.
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            px: 2,
            borderBottom: '1px solid #E2E8F0',
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', py: 2 },
          }}
        >
          <Tab label={`Marketing Posters (${posters.length}/6)`} />
          <Tab label="Social Media & Contact Links" />
        </Tabs>

        {/* ─── TAB 1: POSTERS ──────────────────────────────────────────────────── */}
        {activeTab === 0 && (
          <Box sx={{ p: { xs: 2.5, md: 4 } }}>
            {posterSuccess && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setPosterSuccess(null)}>
                {posterSuccess}
              </Alert>
            )}
            {posterError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setPosterError(null)}>
                {posterError}
              </Alert>
            )}

            {/* Poster Upload Form */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                bgcolor: '#F8FAFC',
                border: '2px dashed #CBD5E1',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" fontWeight={700} color="#0F172A" mb={1}>
                Upload New Poster ({posters.length}/6)
              </Typography>
              
              <Box sx={{ mb: 3, p: 2, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
                <Typography variant="subtitle2" fontWeight={700} color="#1E40AF" mb={0.5}>
                  📐 Exact Aspect Ratios & Resolutions Needed:
                </Typography>
                <Typography variant="body2" color="#1E3A8A">
                  • 💻 <strong>Desktop Poster:</strong> <code>1600 × 400 px</code> to <code>1600 × 500 px</code> (Aspect Ratio: <strong>3:1 to 4:1</strong>)<br />
                  • 📱 <strong>Mobile Poster:</strong> <code>800 × 400 px</code> to <code>800 × 500 px</code> (Aspect Ratio: <strong>16:9 to 2:1</strong>)<br />
                  • <em>All banners now scale naturally to 100% full view without cropping any text, logos, or buttons.</em>
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleUploadPoster}>
                <Grid container spacing={3}>
                  
                  {/* 1. Desktop Image Dropzone */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" fontWeight={700} color="#334155" mb={1} display="flex" alignItems="center" gap={0.8}>
                      <DesktopWindowsIcon fontSize="small" sx={{ color: '#1E40AF' }} />
                      1. Desktop Banner (Wide Screen)
                    </Typography>
                    <Box
                      onClick={() => desktopFileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDesktopDragging(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDesktopDragging(false); }}
                      onDrop={handleDesktopDrop}
                      onPaste={handleDesktopPaste}
                      tabIndex={0}
                      sx={{
                        width: '100%',
                        aspectRatio: '24/7',
                        bgcolor: isDesktopDragging ? '#EFF6FF' : '#F8FAFC',
                        border: isDesktopDragging ? '2px dashed #1E40AF' : '2px dashed #94A3B8',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.2s ease-in-out',
                        outline: 'none',
                        '&:hover': { borderColor: '#1E40AF', bgcolor: '#F1F5F9' },
                      }}
                    >
                      {desktopPreviewUrl ? (
                        <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0F172A' }}>
                          <img
                            src={desktopPreviewUrl}
                            alt="Desktop Poster Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                          <Box sx={{ position: 'absolute', bottom: 6, right: 6, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 1, py: 0.3, borderRadius: 1, fontSize: '0.7rem', fontWeight: 600 }}>
                            Desktop Preview
                          </Box>
                        </Box>
                      ) : getYouTubeVideoId(posterVideoUrl) ? (
                        <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0F172A' }}>
                          <img
                            src={`https://img.youtube.com/vi/${getYouTubeVideoId(posterVideoUrl)}/hqdefault.jpg`}
                            alt="YouTube Video Thumbnail"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: '#FF0000', color: 'white', px: 1, py: 0.3, borderRadius: 1, fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <YouTubeIcon sx={{ fontSize: 15 }} /> Video Thumbnail
                          </Box>
                        </Box>
                      ) : (
                        <>
                          <AddPhotoAlternateIcon sx={{ fontSize: 36, color: isDesktopDragging ? '#1E40AF' : '#64748B', mb: 0.5 }} />
                          <Typography variant="body2" fontWeight={700} color={isDesktopDragging ? '#1E40AF' : '#334155'}>
                            {isDesktopDragging ? 'Drop Desktop Image!' : 'Select or Drag Desktop Banner'}
                          </Typography>
                          <Typography variant="caption" color="#64748B">
                            1600 × 400 px (4:1 ratio) • Or enter YouTube link below
                          </Typography>
                        </>
                      )}
                    </Box>
                    <input
                      type="file"
                      ref={desktopFileInputRef}
                      onChange={handleDesktopFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </Grid>

                  {/* 2. Mobile Image Dropzone */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" fontWeight={700} color="#334155" mb={1} display="flex" alignItems="center" gap={0.8}>
                      <PhoneAndroidIcon fontSize="small" sx={{ color: '#10B981' }} />
                      2. Mobile Banner (Phone Screen)
                    </Typography>
                    <Box
                      onClick={() => mobileFileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsMobileDragging(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsMobileDragging(false); }}
                      onDrop={handleMobileDrop}
                      onPaste={handleMobilePaste}
                      tabIndex={0}
                      sx={{
                        width: '100%',
                        aspectRatio: '24/7',
                        bgcolor: isMobileDragging ? '#ECFDF5' : '#F8FAFC',
                        border: isMobileDragging ? '2px dashed #10B981' : '2px dashed #94A3B8',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.2s ease-in-out',
                        outline: 'none',
                        '&:hover': { borderColor: '#10B981', bgcolor: '#F1F5F9' },
                      }}
                    >
                      {mobilePreviewUrl ? (
                        <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0F172A' }}>
                          <img
                            src={mobilePreviewUrl}
                            alt="Mobile Poster Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                          <Box sx={{ position: 'absolute', bottom: 6, right: 6, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 1, py: 0.3, borderRadius: 1, fontSize: '0.7rem', fontWeight: 600 }}>
                            Mobile Preview
                          </Box>
                        </Box>
                      ) : getYouTubeVideoId(posterVideoUrl) ? (
                        <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0F172A' }}>
                          <img
                            src={`https://img.youtube.com/vi/${getYouTubeVideoId(posterVideoUrl)}/hqdefault.jpg`}
                            alt="YouTube Video Thumbnail"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: '#FF0000', color: 'white', px: 1, py: 0.3, borderRadius: 1, fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <YouTubeIcon sx={{ fontSize: 15 }} /> Video Thumbnail
                          </Box>
                        </Box>
                      ) : (
                        <>
                          <AddPhotoAlternateIcon sx={{ fontSize: 36, color: isMobileDragging ? '#10B981' : '#64748B', mb: 0.5 }} />
                          <Typography variant="body2" fontWeight={700} color={isMobileDragging ? '#10B981' : '#334155'}>
                            {isMobileDragging ? 'Drop Mobile Image!' : 'Select or Drag Mobile Banner'}
                          </Typography>
                          <Typography variant="caption" color="#64748B">
                            800 × 400 px (2:1 ratio) • Or enter YouTube link below
                          </Typography>
                        </>
                      )}
                    </Box>
                    <input
                      type="file"
                      ref={mobileFileInputRef}
                      onChange={handleMobileFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </Grid>


                  {/* Poster Details */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Poster Title (Optional)"
                            placeholder="e.g. Special Plot Discount in Rewa"
                            value={posterTitle}
                            onChange={(e) => setPosterTitle(e.target.value)}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="YouTube Video Link (Optional)"
                            placeholder="e.g. https://youtu.be/... or youtube.com/watch?v=..."
                            value={posterVideoUrl}
                            onChange={(e) => setPosterVideoUrl(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <YouTubeIcon fontSize="small" sx={{ color: '#FF0000' }} />
                                </InputAdornment>
                              ),
                            }}
                            helperText={posterVideoUrl && !getYouTubeVideoId(posterVideoUrl) ? 'Invalid YouTube link' : (getYouTubeVideoId(posterVideoUrl) ? '✓ Valid YouTube link detected' : 'Plays inline on mobile & desktop')}
                            error={Boolean(posterVideoUrl && !getYouTubeVideoId(posterVideoUrl))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Redirect Link URL (Optional)"
                            placeholder="e.g. /properties?category=plot or https://..."
                            value={posterRedirectUrl}
                            onChange={(e) => setPosterRedirectUrl(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <OpenInNewIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                      </Grid>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <TextField
                            label="Sort Order"
                            type="number"
                            value={posterSortOrder}
                            onChange={(e) => setPosterSortOrder(parseInt(e.target.value, 10) || 0)}
                            size="small"
                            sx={{ width: 120 }}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={posterIsActive}
                                onChange={(e) => setPosterIsActive(e.target.checked)}
                                color="primary"
                              />
                            }
                            label="Active (Display on Home)"
                          />
                        </Box>

                        <Button
                          type="submit"
                          variant="contained"
                          disabled={
                            (!desktopFile && !desktopDraggedUrl && !mobileFile && !mobileDraggedUrl && !getYouTubeVideoId(posterVideoUrl)) ||
                            isUploading ||
                            posters.length >= 6
                          }
                          startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                          sx={{
                            bgcolor: '#1E40AF',
                            py: 1.2,
                            px: 3.5,
                            borderRadius: 2,
                            fontWeight: 700,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#1E3A8A' },
                          }}
                        >
                          {isUploading
                            ? 'Publishing...'
                            : (!desktopFile && !desktopDraggedUrl && !mobileFile && !mobileDraggedUrl && getYouTubeVideoId(posterVideoUrl))
                            ? 'Publish Video Poster'
                            : 'Upload & Publish Poster'}
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* Uploaded Posters List */}
            <Typography variant="h6" fontWeight={700} color="#0F172A" mb={2}>
              Current Posters ({posters.length}/6)
            </Typography>

            {isLoadingPosters ? (
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : posters.length === 0 ? (
              <Paper elevation={0} sx={{ p: 5, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 3 }}>
                <Typography color="#64748B" fontWeight={500}>
                  No posters uploaded yet. Upload your first poster above to showcase banners on the homepage!
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {posters.map((poster, index) => (
                  <Grid item xs={12} md={6} key={poster.id}>
                    <Card
                      elevation={0}
                      sx={{
                        border: '1px solid #E2E8F0',
                        borderRadius: 3,
                        overflow: 'hidden',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'box-shadow 0.2s',
                        '&:hover': { boxShadow: '0 10px 20px rgba(0,0,0,0.06)' },
                      }}
                    >
                      {/* Image Preview Area */}
                      <Grid container>
                        <Grid item xs={poster.mobile_image_url ? 8 : 12}>
                          <Box sx={{ position: 'relative', aspectRatio: '21/9', bgcolor: '#E2E8F0' }}>
                            <CardMedia
                              component="img"
                              image={poster.image_url}
                              alt={poster.title || `Desktop Poster ${index + 1}`}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {poster.video_url && (
                              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'rgba(255,0,0,0.85)', color: 'white', p: 0.8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                                <YouTubeIcon sx={{ fontSize: 24 }} />
                              </Box>
                            )}
                            <Chip
                              label="💻 Desktop"
                              size="small"
                              sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </Box>
                        </Grid>

                        {poster.mobile_image_url && (
                          <Grid item xs={4}>
                            <Box sx={{ position: 'relative', aspectRatio: '21/9', bgcolor: '#CBD5E1', borderLeft: '1px solid #E2E8F0' }}>
                              <CardMedia
                                component="img"
                                image={poster.mobile_image_url}
                                alt={poster.title || `Mobile Poster ${index + 1}`}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <Chip
                                label="📱 Mobile"
                                size="small"
                                sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                              />
                            </Box>
                          </Grid>
                        )}
                      </Grid>

                      <CardContent sx={{ flex: 1, p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700} color="#0F172A" noWrap>
                            {poster.title || `Untitled Poster #${poster.sort_order + 1}`}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {poster.video_url && (
                              <Chip
                                icon={<YouTubeIcon sx={{ fontSize: '14px !important', color: '#FFF !important' }} />}
                                label="YouTube"
                                size="small"
                                sx={{ bgcolor: '#FF0000', color: '#FFF', fontWeight: 700, fontSize: '0.7rem' }}
                              />
                            )}
                            <Chip
                              label={`Order: ${poster.sort_order}`}
                              size="small"
                              sx={{ bgcolor: '#F1F5F9', fontWeight: 600 }}
                            />
                            <Chip
                              label={poster.is_active ? 'Active' : 'Inactive'}
                              color={poster.is_active ? 'success' : 'default'}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          </Stack>
                        </Box>
                        {poster.video_url && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8, bgcolor: '#FEF2F2', px: 1, py: 0.4, borderRadius: 1.5, border: '1px solid #FEE2E2' }}>
                            <YouTubeIcon sx={{ fontSize: 16, color: '#FF0000', flexShrink: 0 }} />
                            <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 600, wordBreak: 'break-all' }}>
                              {poster.video_url}
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="body2" color="#64748B" sx={{ wordBreak: 'break-all' }} noWrap>
                          {poster.redirect_url ? `Link: ${poster.redirect_url}` : 'No redirect link'}
                        </Typography>
                      </CardContent>

                      <Divider />

                      <CardActions sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={poster.is_active}
                              onChange={() => handleToggleActive(poster)}
                              size="small"
                            />
                          }
                          label={<Typography variant="caption" fontWeight={600}>Visible on Homepage</Typography>}
                        />
                        <IconButton
                          color="error"
                          onClick={() => setDeleteTarget(poster)}
                          size="small"
                          sx={{ '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* ─── TAB 2: COMMUNICATION & SOCIAL MEDIA ─────────────────────────────── */}
        {activeTab === 1 && (
          <Box sx={{ p: { xs: 2.5, md: 4 } }}>
            {commSuccess && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setCommSuccess(null)}>
                {commSuccess}
              </Alert>
            )}
            {commError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setCommError(null)}>
                {commError}
              </Alert>
            )}

            {isLoadingComm ? (
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSaveCommunication}>
                <Typography variant="h6" fontWeight={700} color="#0F172A" mb={1}>
                  WhatsApp & Quick Contact
                </Typography>
                <Typography variant="body2" color="#64748B" mb={3}>
                  These details power the click-to-chat WhatsApp actions and website inquiries.
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="WhatsApp Number"
                      placeholder="+919876543210"
                      value={communication.whatsapp_number || ''}
                      onChange={(e) => setCommunication({ ...communication, whatsapp_number: e.target.value })}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WhatsAppIcon sx={{ color: '#25D366' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Default WhatsApp Message"
                      placeholder="Namaste, I want to inquire about properties in Rewa."
                      value={communication.whatsapp_message || ''}
                      onChange={(e) => setCommunication({ ...communication, whatsapp_message: e.target.value })}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight={700} color="#0F172A" mb={1}>
                  Social Media Channels
                </Typography>
                <Typography variant="body2" color="#64748B" mb={3}>
                  Links displayed in the website footer, contact pages, and social share widgets.
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Instagram URL"
                      placeholder="https://instagram.com/rewabhoomi"
                      value={communication.instagram_url || ''}
                      onChange={(e) => setCommunication({ ...communication, instagram_url: e.target.value })}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <InstagramIcon sx={{ color: '#E4405F' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="YouTube URL"
                      placeholder="https://youtube.com/@rewabhoomi"
                      value={communication.youtube_url || ''}
                      onChange={(e) => setCommunication({ ...communication, youtube_url: e.target.value })}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <YouTubeIcon sx={{ color: '#FF0000' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Twitter / X URL"
                      placeholder="https://twitter.com/rewabhoomi"
                      value={communication.twitter_url || ''}
                      onChange={(e) => setCommunication({ ...communication, twitter_url: e.target.value })}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TwitterIcon sx={{ color: '#1DA1F2' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Facebook URL"
                      placeholder="https://facebook.com/rewabhoomi"
                      value={communication.facebook_url || ''}
                      onChange={(e) => setCommunication({ ...communication, facebook_url: e.target.value })}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FacebookIcon sx={{ color: '#1877F2' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="LinkedIn URL"
                      placeholder="https://linkedin.com/company/rewabhoomi"
                      value={communication.linkedin_url || ''}
                      onChange={(e) => setCommunication({ ...communication, linkedin_url: e.target.value })}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkedInIcon sx={{ color: '#0A66C2' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight={700} color="#0F172A" mb={1}>
                  Official Contact & Office Details
                </Typography>
                <Typography variant="body2" color="#64748B" mb={3}>
                  General support contact info shown on the website.
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Contact Phone Number"
                      placeholder="+91 99999 99999"
                      value={communication.contact_phone || ''}
                      onChange={(e) => setCommunication({ ...communication, contact_phone: e.target.value })}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon sx={{ color: '#64748B' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Contact Email Address"
                      placeholder="support@rewabhoomi.com"
                      value={communication.contact_email || ''}
                      onChange={(e) => setCommunication({ ...communication, contact_email: e.target.value })}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: '#64748B' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Office Address"
                      placeholder="Rewa, Madhya Pradesh, India"
                      value={communication.office_address || ''}
                      onChange={(e) => setCommunication({ ...communication, office_address: e.target.value })}
                      fullWidth
                      multiline
                      rows={2}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOnIcon sx={{ color: '#64748B' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSavingComm}
                  startIcon={isSavingComm ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  sx={{
                    bgcolor: '#1E40AF',
                    py: 1.2,
                    px: 4,
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#1E3A8A' },
                  }}
                >
                  {isSavingComm ? 'Saving Changes...' : 'Save Communication Details'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Poster?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this poster? This will permanently remove both <strong>Desktop and Mobile WebP poster images</strong> from <strong>Cloudflare R2 storage</strong> and the database.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeletePoster}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
