'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Container, Grid, Typography, Button, Chip, Divider, Avatar, Paper, Breadcrumbs, IconButton, Dialog, Alert, CircularProgress, Stack } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonIcon from '@mui/icons-material/Person';
import ShareIcon from '@mui/icons-material/Share';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CategoryIcon from '@mui/icons-material/Category';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import StraightenIcon from '@mui/icons-material/Straighten';
import HotelIcon from '@mui/icons-material/Hotel';
import BathtubIcon from '@mui/icons-material/Bathtub';
import ExploreIcon from '@mui/icons-material/Explore';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LayersIcon from '@mui/icons-material/Layers';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GrassIcon from '@mui/icons-material/Grass';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import GetAppIcon from '@mui/icons-material/GetApp';
import EditIcon from '@mui/icons-material/Edit';
import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth/AuthContext';
import { usePwaInstall } from '@/features/pwa/usePwaInstall';
import { apiPost, apiDelete } from '@/lib/api';
import { PROPERTY_CATEGORIES, PROPERTY_TYPES } from '@/config/propertyFormConfig';
import { PropertyCategoryType } from '@rewa-bhoomi/types';
import { PropertyDetailPageSkeleton } from './PropertySkeletons';

const GoogleMapsColorfulPin = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, marginTop: 1, display: 'inline-block', verticalAlign: 'top' }}
  >
    {/* Red base */}
    <path
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
      fill="#EA4335"
    />
    {/* Blue top-left segment */}
    <path
      d="M12 2C8.13 2 5 5.13 5 9c0 2.5 1.5 5.5 3.5 8.5L12 12V2z"
      fill="#4285F4"
    />
    {/* Yellow top-right segment */}
    <path
      d="M12 2v10l3.5 5.5C17.5 14.5 19 11.5 19 9c0-3.87-3.13-7-7-7z"
      fill="#FBBC04"
    />
    {/* Green bottom point segment */}
    <path
      d="M12 22s-2.5-3.5-3.5-4.5L12 12l3.5 5.5c-1 1-3.5 4.5-3.5 4.5z"
      fill="#34A853"
    />
    {/* Center white circle */}
    <circle cx="12" cy="9" r="3.5" fill="#FFFFFF" />
  </svg>
);

interface PropertyImage {
  id: string;
  url: string;
  sort_order: number;
}

interface PropertyAmenity {
  id: string;
  name: string;
  icon: string;
}

interface PropertyData {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  video_url?: string | null;
  created_at?: string;
  listing_type?: string;
  listing_purpose?: string;
  category_type?: string;
  property_type?: string;
  category_name?: string;
  category_slug?: string;
  city: string;
  state: string;
  address: string | null;
  area?: number;
  area_unit?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  furnished_status?: string | null;
  construction_status?: string | null;
  is_price_negotiable?: boolean;
  price_per_sqft?: number;
  owner_name: string;
  owner_phone: string | null;
  owner_avatar: string | null;
  owner_username?: string | null;
  is_favorited: boolean;
  images: PropertyImage[];
  amenities: PropertyAmenity[];
  custom_amenities?: string[];
  residentialDetails?: any;
  commercialDetails?: any;
  landDetails?: any;
  pgDetails?: any;
  leaseDetails?: any;
  commercialLeaseDetails?: any;
  hallDetails?: any;
  location?: {
    googleMapsLink?: string;
    google_maps_link?: string;
    latitude?: number;
    longitude?: number;
  };
  status?: string;
  owner_id?: string;
}

export default function PropertyDetailPage({ initialProperty, slug }: { initialProperty: PropertyData | null, slug: string }) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: isAuthLoading, accessToken } = useAuth();
  const { canInstall, promptInstall } = usePwaInstall();
  
  const [property, setProperty] = useState<PropertyData | null>(initialProperty);
  const [loading, setLoading] = useState(!initialProperty);
  const [error, setError] = useState(false);

  const isAdmin = Boolean(user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN'));
  const isOwner = Boolean(user?.id && (property?.owner_id === user.id || (property as any)?.ownerId === user.id));
  const canEdit = Boolean(isAdmin || isOwner);

  useEffect(() => {
    if (!initialProperty && !isAuthLoading) {
      // Fetch property client-side if missing from SSR (e.g. admin previewing PENDING).
      // We wait for isAuthLoading=false (set only after refreshAuth resolves & token is ready).
      setLoading(true);
      setError(false);
      import('@/lib/api').then(({ apiClient }) => {
        apiClient.get(`/properties/${slug}`)
          .then(res => {
            setProperty(res.data.data);
            setLoading(false);
          })
          .catch(() => {
            setError(true);
            setLoading(false);
          });
      });
    }
  // accessToken is in deps so if the token arrives late we still retry
  }, [initialProperty, slug, isAuthLoading, accessToken]);

  const [isFavorited, setIsFavorited] = useState(property?.is_favorited || false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const pinchStartDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const modalTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const initialPanOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (property) {
      setIsFavorited(property.is_favorited);
    }
  }, [property]);

  if (loading) {
    return <PropertyDetailPageSkeleton />;
  }

  if (error || !property) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h5" color="error">Property not found</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => router.push('/properties')}>Go Back</Button>
      </Box>
    );
  }

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/properties');
    }
  };

  const resetZoomAndPan = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsPinching(false);
    setIsDragging(false);
    pinchStartDistanceRef.current = null;
    modalTouchStartRef.current = null;
    mouseDragStartRef.current = null;
  };

  const handleOpenModal = () => {
    resetZoomAndPan();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetZoomAndPan();
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    resetZoomAndPan();
  };

  const validImages = (property.images || []).filter((img) => img && typeof img.url === 'string' && img.url.trim() !== '');
  const fallbackPlaceholder = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80';

  // Construct combined media list
  interface MediaItem {
    type: 'image' | 'video';
    url: string;
    id: string;
  }

  const mediaList: MediaItem[] = [];

  // Video is featured first on the property page with lightweight facade
  if (property.video_url && property.video_url.trim() !== '') {
    mediaList.push({
      type: 'video',
      url: property.video_url,
      id: 'video-0'
    });
  }

  validImages.forEach((img, idx) => {
    mediaList.push({
      type: 'image',
      url: img.url,
      id: img.id || `img-${idx}`
    });
  });

  if (mediaList.length === 0) {
    mediaList.push({
      type: 'image',
      url: fallbackPlaceholder,
      id: 'placeholder'
    });
  }

  const getVideoPoster = (url: string) => {
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1].split('?')[0];
        return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      }
      if (url.includes('youtube.com')) {
        let id = '';
        if (url.includes('v=')) id = url.split('v=')[1].split('&')[0];
        else if (url.includes('/shorts/')) id = url.split('/shorts/')[1].split('?')[0];
        if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      }
    } catch {
      // fallback
    }
    return validImages[0]?.url || fallbackPlaceholder;
  };

  const activeMedia = mediaList[activeImgIdx] || { type: 'image', url: fallbackPlaceholder, id: 'placeholder' };

  // Swipe handlers for mobile touch
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNextImg();
    } else if (isRightSwipe) {
      handlePrevImg();
    }
  };

  // Lightbox Modal: 2-Finger Pinch Zoom & Pan handlers
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleModalTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2-Finger Pinch Zoom Start
      const dist = getTouchDistance(e.touches);
      pinchStartDistanceRef.current = dist;
      initialScaleRef.current = zoomScale;
      setIsPinching(true);
    } else if (e.touches.length === 1) {
      // 1-Finger Touch Start (Pan or Swipe or Double Tap)
      const touch = e.touches[0];
      modalTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
      initialPanOffsetRef.current = { ...panOffset };

      // Double-Tap to Toggle Zoom
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (zoomScale > 1) {
          resetZoomAndPan();
        } else {
          setZoomScale(2.2);
        }
      }
      lastTapRef.current = now;
    }
  };

  const handleModalTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistanceRef.current && pinchStartDistanceRef.current > 0) {
      // 2-Finger Pinch Zooming
      const currentDist = getTouchDistance(e.touches);
      const ratio = currentDist / pinchStartDistanceRef.current;
      const newScale = Math.min(Math.max(initialScaleRef.current * ratio, 0.8), 4.5);
      setZoomScale(newScale);
    } else if (e.touches.length === 1 && modalTouchStartRef.current) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - modalTouchStartRef.current.x;
      const deltaY = touch.clientY - modalTouchStartRef.current.y;

      if (zoomScale > 1.05) {
        // Pan image when zoomed in
        setPanOffset({
          x: initialPanOffsetRef.current.x + deltaX,
          y: initialPanOffsetRef.current.y + deltaY,
        });
      }
    }
  };

  const handleModalTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchStartDistanceRef.current = null;
      setIsPinching(false);
      // Snap back if pinched below 1
      if (zoomScale < 1) {
        resetZoomAndPan();
      }
    }

    if (e.touches.length === 0) {
      // If 1-finger swipe on normal scale (<= 1.05), navigate image
      if (modalTouchStartRef.current && zoomScale <= 1.05 && e.changedTouches.length > 0) {
        const touchEnd = e.changedTouches[0];
        const distanceX = modalTouchStartRef.current.x - touchEnd.clientX;
        const distanceY = Math.abs(modalTouchStartRef.current.y - touchEnd.clientY);
        if (Math.abs(distanceX) > 50 && distanceY < 80) {
          if (distanceX > 0) {
            handleNextImg();
          } else {
            handlePrevImg();
          }
          resetZoomAndPan();
        }
      }
      modalTouchStartRef.current = null;
      if (zoomScale <= 1) {
        setPanOffset({ x: 0, y: 0 });
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale > 1) {
      setIsDragging(true);
      mouseDragStartRef.current = { x: e.clientX, y: e.clientY };
      initialPanOffsetRef.current = { ...panOffset };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && mouseDragStartRef.current && zoomScale > 1) {
      const deltaX = e.clientX - mouseDragStartRef.current.x;
      const deltaY = e.clientY - mouseDragStartRef.current.y;
      setPanOffset({
        x: initialPanOffsetRef.current.x + deltaX,
        y: initialPanOffsetRef.current.y + deltaY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    mouseDragStartRef.current = null;
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setZoomScale((prev) => Math.min(prev + 0.25, 4));
    } else {
      setZoomScale((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const getEmbedUrl = (url: string) => {
    let embedUrl = '';
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('/shorts/')) videoId = url.split('/shorts/')[1].split('?')[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}&playsinline=1`;
      } 
      else if (url.includes('facebook.com') || url.includes('fb.watch')) {
        embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=1`;
      }
      else if (url.includes('instagram.com')) {
        let baseUrl = url.split('?')[0];
        if (!baseUrl.endsWith('/')) baseUrl += '/';
        embedUrl = `${baseUrl}embed`;
      }
    } catch (e) {
      console.error('Error parsing video URL', e);
    }
    return embedUrl;
  };

  const renderVideoInGallery = (url: string) => {
    const embedUrl = getEmbedUrl(url);
    const isVertical = url.includes('/shorts/') || url.includes('/reel/') || url.includes('instagram.com');

    if (!embedUrl) {
      return (
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: '#0F172A', color: '#fff', width: '100%' }}>
          <Typography mb={2}>Video Link is available</Typography>
          <Button variant="contained" color="primary" href={url} target="_blank" rel="noopener noreferrer">
            Watch Video
          </Button>
        </Box>
      );
    }

    const playerWidth = isVertical
      ? { xs: '180px', sm: '236px', md: '270px' }
      : '100%';

    // Performance Optimization: Facade pattern prevents loading 3+ MB YouTube scripts on initial page load
    if (!isVideoPlaying) {
      const posterUrl = getVideoPoster(url);
      return (
        <Box
          onClick={(e) => {
            e.stopPropagation();
            setIsVideoPlaying(true);
          }}
          sx={{
            position: 'relative',
            width: playerWidth,
            height: '100%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#000',
            mx: 'auto',
            overflow: 'hidden',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl}
            alt={`${property.title} Video Preview`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.85,
            }}
          />
          {/* Center Play Button Badge */}
          <Box
            sx={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              zIndex: 2,
            }}
          >
            <Box
              component="button"
              type="button"
              aria-label="Play video preview"
              sx={{
                width: { xs: 54, sm: 68 },
                height: { xs: 54, sm: 68 },
                borderRadius: '50%',
                bgcolor: 'rgba(239, 68, 68, 0.95)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'scale(1.1)', bgcolor: '#DC2626' },
              }}
            >
              <PlayArrowIcon sx={{ fontSize: { xs: 34, sm: 44 }, ml: 0.4 }} />
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: '#FFFFFF',
                fontWeight: 700,
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                px: 1.2,
                py: 0.4,
                borderRadius: '20px',
                fontSize: '0.75rem',
              }}
            >
              Watch Video Preview
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ width: playerWidth, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000', mx: 'auto' }}>
        <iframe
          src={embedUrl}
          title="Property video preview"
          style={{ width: '100%', height: '100%', border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </Box>
    );
  };

  const renderDetailCard = (label: string, value: React.ReactNode, icon?: React.ReactNode) => {
    const formattedVal = typeof value === 'string'
      ? value.replace(/SQ_FT/gi, 'ft²').replace(/SQ_MT/gi, 'm²')
      : value;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="caption"
          sx={{
            color: '#64748B',
            fontWeight: 650,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            fontSize: '0.66rem',
            lineHeight: 1.1,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 750,
            color: '#0F172A',
            fontSize: '0.82rem',
            mt: 0.25,
            lineHeight: 1.25,
            wordBreak: 'break-word',
          }}
        >
          {formattedVal}
        </Typography>
      </Box>
    );
  };

  const priceFormatted = property.price 
    ? Number(property.price).toLocaleString('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
      }) 
    : '₹ 0';

  const dateFormatted = property.created_at
    ? new Date(property.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    : 'Recently';

  const handlePrevImg = () => {
    if (mediaList.length <= 1) return;
    setIsVideoPlaying(false);
    setActiveImgIdx((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const handleNextImg = () => {
    if (mediaList.length <= 1) return;
    setIsVideoPlaying(false);
    setActiveImgIdx((prev) => (prev + 1) % mediaList.length);
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save properties');
      return;
    }
    try {
      if (isFavorited) {
        await apiDelete(`/properties/${property.id}/favorite`);
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await apiPost(`/properties/${property.id}/favorite`);
        setIsFavorited(true);
        toast.success('Added to favorites');
      }
    } catch {
      toast.error('Failed to update favorites');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  // ─── DYNAMIC CATEGORY & SUBCATEGORY RESOLUTION FOR BREADCRUMBS ───
  const subTypeConfig = PROPERTY_TYPES.find(pt => pt.key === property.property_type);
  const rawCatType = (property.category_type || (subTypeConfig ? subTypeConfig.category : '')) as PropertyCategoryType | '';
  const resolvedCategoryType: PropertyCategoryType = rawCatType
    ? rawCatType
    : property.landDetails ? 'LAND'
    : property.commercialDetails ? 'COMMERCIAL'
    : property.hallDetails ? 'SPECIAL'
    : 'RESIDENTIAL';

  const categoryConfig = PROPERTY_CATEGORIES.find(c => c.key === resolvedCategoryType);
  const categoryTitle = categoryConfig ? categoryConfig.title : 'Properties';
  const categoryHref = `/properties?categoryType=${resolvedCategoryType}`;

  const rawSubcategoryLabel = subTypeConfig
    ? subTypeConfig.label
    : (property.category_name || (property.property_type ? property.property_type.replace(/_/g, ' ') : ''));

  const formatSubcategoryLabel = (lbl: string) => {
    if (!lbl) return '';
    return lbl.split('(')[0].trim();
  };

  const subcategoryTitle = formatSubcategoryLabel(rawSubcategoryLabel);
  const subcategoryHref = property.property_type
    ? `/properties?categoryType=${resolvedCategoryType}&propertyType=${property.property_type}`
    : categoryHref;

  const categoryLabel = subcategoryTitle || categoryTitle || 'Property';
  const stateLabel = property.state || 'Madhya Pradesh';
  const cityLabel = property.city || 'Rewa';
  const addressLabel = property.address || cityLabel;

  const res = property.residentialDetails;
  const land = property.landDetails;
  const comm = property.commercialDetails;
  const pg = property.pgDetails;
  const lease = property.leaseDetails || property.commercialLeaseDetails;
  const hall = property.hallDetails;

  const renderPriceAndTitleCard = (displayProps: any) => (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 3 },
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        bgcolor: '#FFFFFF',
        ...displayProps,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.2 }, flexWrap: 'wrap' }}>
          <Typography variant="h4" component="div" fontWeight={800} sx={{ color: '#0F172A', fontSize: { xs: '1.25rem', sm: '2rem' } }}>
            {priceFormatted}
          </Typography>
          {property.is_price_negotiable && (
            <Chip
              label="Negotiable (मोलभाव संभव)"
              size="small"
              sx={{
                bgcolor: '#DCFCE7',
                color: '#15803D',
                fontWeight: 700,
                fontSize: { xs: '0.68rem', sm: '0.75rem' },
                height: { xs: 22, sm: 26 },
                border: '1px solid #86EFAC',
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton onClick={handleShare} aria-label="Share property" size="small" sx={{ color: '#475569', '&:hover': { color: '#0F172A' } }}>
            <ShareIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={handleToggleFavorite} aria-label={isFavorited ? 'Remove from favorites' : 'Save property'} size="small" sx={{ color: isFavorited ? '#EF4444' : '#475569', '&:hover': { color: '#EF4444' } }}>
            {isFavorited ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      <Typography
        variant="h1"
        component="h1"
        fontWeight={700}
        sx={{
          color: '#0F172A',
          fontSize: { xs: '1rem', sm: '1.25rem' },
          lineHeight: 1.35,
          mb: 0.5,
        }}
      >
        {property.title}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, pt: 0.8, borderTop: '1px solid #F1F5F9' }}>
        {(() => {
          const mapLink = property.location?.googleMapsLink ||
            property.location?.google_maps_link ||
            (property.location?.latitude && property.location?.longitude
              ? `https://maps.google.com/?q=${property.location.latitude},${property.location.longitude}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([addressLabel, cityLabel, property.state, 'India'].filter(Boolean).join(', '))}`);

          return (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
              <Box
                component="a"
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'flex-start',
                  gap: 0.7,
                  textDecoration: 'none',
                  color: '#334155',
                  borderRadius: '6px',
                  py: 0.3,
                  px: 0.4,
                  ml: -0.4,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(66, 133, 244, 0.08)',
                    color: '#1B4FD8',
                  },
                }}
              >
                <GoogleMapsColorfulPin size={20} />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'inherit',
                      fontWeight: 650,
                      fontSize: '0.78rem',
                      lineHeight: 1.35,
                      display: 'inline',
                    }}
                  >
                    {addressLabel ? `${addressLabel}, ` : ''}{cityLabel}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      ml: 0.6,
                      color: '#2563EB',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      textDecoration: 'underline',
                      display: 'inline-block',
                    }}
                  >
                    (Google Map ↗)
                  </Typography>
                </Box>
              </Box>

              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, flexShrink: 0, pt: 0.3, fontSize: '0.72rem' }}>
                {dateFormatted}
              </Typography>
            </Box>
          );
        })()}
      </Box>
    </Paper>
  );

  const renderFutureValueProjection = (displayProps: any) => {
    if (!(property.price && Number(property.price) > 0 && (property.listing_type?.toUpperCase() === 'SELL' || property.listing_type?.toUpperCase() === 'SALE' || property.listing_purpose?.toUpperCase() === 'SELL' || property.listing_purpose?.toUpperCase() === 'SALE'))) {
      return null;
    }
    const base = Number(property.price);
    const fmt = (v: number) => {
      if (v >= 10000000) return (v / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
      if (v >= 100000) return (v / 100000).toFixed(2).replace(/\.?0+$/, '') + ' Lakh';
      if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.?0+$/, '') + 'K';
      return '₹' + v.toLocaleString('en-IN');
    };
    const projections = [
      { label: '2 Saal Mein (2 Years)', multiplier: 1.25 },
      { label: '3 Saal Mein (3 Years)', multiplier: 1.50 },
      { label: '5 Saal Mein (5 Years)', multiplier: 2.375 },
      { label: '10 Saal Mein (10 Years)', multiplier: 3.75 },
    ];
    return (
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: '8px', border: '1px solid #E2E8F0', bgcolor: '#fff', ...displayProps }}>
        <Typography variant="subtitle2" component="h2" fontWeight={750} color="#0F172A" sx={{ fontSize: '0.88rem', mb: 0.3 }}>
          भविष्य में प्रॉपर्टी की कीमत
        </Typography>
        <Typography variant="caption" color="#64748B" sx={{ fontSize: '0.7rem', display: 'block', mb: 1.2 }}>
          इस प्रॉपर्टी की अनुमानित कीमत अगले कुछ सालों में
        </Typography>

        <Grid container spacing={1}>
          {projections.map((p) => {
            const projVal = Math.round(base * p.multiplier);
            return (
              <Grid item xs={6} key={p.label}>
                <Box sx={{ p: 1.2, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.74rem', color: '#1B4FD8', fontWeight: 700, display: 'block', mb: 0.3 }}>
                    {p.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 850, color: '#15803D', fontSize: '0.92rem', letterSpacing: '-0.01em' }}>
                    ₹{fmt(projVal)}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        <Typography variant="caption" color="#64748B" sx={{ display: 'block', mt: 1, fontSize: '0.65rem' }}>
          *ये सिर्फ एक अनुमान है। असली कीमत मार्केट डिमांड पर निर्भर करती है।
        </Typography>
      </Paper>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 1, sm: 2 }, pb: { xs: 4, sm: 6 }, bgcolor: '#F2F4F7' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.25, sm: 2.5 } }}>
        
        {/* ─── BREADCRUMBS, BACK BUTTON & GET APP BAR ─── */}
        <Box sx={{ py: 0.4, mb: { xs: 0.6, sm: 1.2 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
          {/* Left side: Back Button & Breadcrumbs */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
            {/* Back Button */}
            <Button
              startIcon={<ArrowBackIcon sx={{ fontSize: '1rem !important' }} />}
              onClick={handleGoBack}
              size="small"
              sx={{
                color: '#0F172A',
                bgcolor: '#FFFFFF',
                borderRadius: '20px',
                px: 1.8,
                py: 0.35,
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                border: '1px solid #CBD5E1',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&:hover': {
                  bgcolor: '#F1F5F9',
                  borderColor: '#94A3B8',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                },
              }}
            >
              Back
            </Button>

            {/* Breadcrumbs Trail */}
            <Box sx={{ overflowX: 'auto', whiteSpace: 'nowrap', flex: 1, display: { xs: 'none', sm: 'block' } }}>
              <Breadcrumbs
                separator={<NavigateNextIcon sx={{ fontSize: 14, color: '#94A3B8' }} />}
                aria-label="breadcrumb"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' }, color: '#64748B' }}
              >
                <Link href="/" style={{ color: '#475569', textDecoration: 'none', fontWeight: 500 }}>
                  Home
                </Link>
                <Link href={categoryHref} style={{ color: '#475569', textDecoration: 'none', fontWeight: 500 }}>
                  {categoryTitle}
                </Link>
                {subcategoryTitle && subcategoryTitle.toLowerCase() !== categoryTitle.toLowerCase() && (
                  <Link href={subcategoryHref} style={{ color: '#475569', textDecoration: 'none', fontWeight: 500 }}>
                    {subcategoryTitle}
                  </Link>
                )}
                <Typography
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    color: '#0F172A',
                    fontWeight: 600,
                    maxWidth: { xs: 180, sm: 320 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {property.title}
                </Typography>
              </Breadcrumbs>
            </Box>
          </Box>

          {/* Right side: Edit Button (if Admin or Owner) & Get App Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {canEdit && property && (
              <Button
                startIcon={<EditIcon sx={{ fontSize: '0.95rem !important' }} />}
                onClick={() => router.push(`/properties/edit/${property.slug}`)}
                size="small"
                variant="outlined"
                sx={{
                  color: '#1B4FD8',
                  borderColor: '#CBD5E1',
                  bgcolor: '#FFFFFF',
                  borderRadius: '20px',
                  px: { xs: 1.2, sm: 2 },
                  py: 0.35,
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  '&:hover': {
                    bgcolor: '#EFF6FF',
                    borderColor: '#1B4FD8',
                  },
                }}
              >
                {isAdmin ? 'Admin Edit' : 'Edit Property'}
              </Button>
            )}

            {canInstall && (
              <Button
                startIcon={<GetAppIcon sx={{ fontSize: '1rem !important' }} />}
                onClick={promptInstall}
                size="small"
                sx={{
                  color: '#FFFFFF',
                  bgcolor: '#1B4FD8',
                  borderRadius: '20px',
                  px: { xs: 1.6, sm: 2.2 },
                  py: 0.35,
                  fontSize: '0.78rem',
                  fontWeight: 750,
                  textTransform: 'none',
                  boxShadow: '0 2px 8px rgba(27, 79, 216, 0.35)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  '&:hover': {
                    bgcolor: '#1D4ED8',
                    boxShadow: '0 4px 12px rgba(27, 79, 216, 0.45)',
                  },
                }}
              >
                Get App
              </Button>
            )}
          </Box>
        </Box>

        {/* ─── STATUS BANNER for Owner Preview (Non-Published) ─── */}
        {property.status && property.status !== 'PUBLISHED' && (
          <Box mb={2}>
            {property.status === 'PENDING_REVIEW' && (
              <Alert
                severity="warning"
                sx={{ borderRadius: 2, fontWeight: 500 }}
              >
                <strong>⏳ Yeh Aapka Listing Preview Hai</strong> — Aapki property abhi Admin Review Queue mein hai. Approve hone ke baad hi yeh public hogi. Baaki users abhi nahi dekh sakte.
              </Alert>
            )}
            {property.status === 'REJECTED' && (
              <Alert
                severity="error"
                sx={{ borderRadius: 2, fontWeight: 500 }}
              >
                <strong>❌ Property Reject Hui</strong> — Aapki property admin ne reject kar di hai. Kripya edit karke dobara submit karein.
              </Alert>
            )}
            {property.status === 'DRAFT' && (
              <Alert
                severity="info"
                sx={{ borderRadius: 2, fontWeight: 500 }}
              >
                <strong>📝 Draft Mode</strong> — Yeh property abhi draft mein hai, public nahi hai.
              </Alert>
            )}
          </Box>
        )}

        {/* ─── MAIN 2-COLUMN GRID (Left: Image + Details, Right: Price + Seller) ─── */}
        <Grid container spacing={2.5}>
          
          {/* ─── LEFT COLUMN (~68% width) ─── */}
          <Grid item xs={12} md={8}>
            {/* Mobile-only Price & Title Card (Top) */}
            {renderPriceAndTitleCard({ display: { xs: 'block', md: 'none' }, mb: 2.5 })}
            
            {/* 1. Large Image Viewer Box (Click opens Zoom Modal) */}
            <Paper
              elevation={0}
              onClick={() => {
                if (activeMedia.type !== 'video') {
                  handleOpenModal();
                }
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              sx={{
                borderRadius: '8px',
                overflow: 'hidden',
                bgcolor: '#000000',
                position: 'relative',
                height: { xs: 320, sm: 420, md: 480 },
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                mb: 1.5,
                cursor: activeMedia.type === 'video' ? 'default' : 'pointer',
                '&:hover .zoom-badge': { opacity: 1, transform: 'scale(1.05)' },
              }}
            >
              {activeMedia.type === 'video' ? (
                renderVideoInGallery(activeMedia.url)
              ) : activeMedia.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={activeImgIdx}
                  src={activeMedia.url}
                  alt={property.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    animation: 'fadeImg 0.4s ease-in-out',
                  }}
                />
              ) : (
                <Typography color="white">No Image Available</Typography>
              )}

              {/* Top Right Zoom Hint Badge */}
              {activeMedia.type !== 'video' && (
                <Box
                  className="zoom-badge"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    bgcolor: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: 'white',
                    px: 1.2,
                    py: 0.5,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    opacity: 0.85,
                    transition: 'all 0.25s ease',
                    zIndex: 2,
                  }}
                >
                  <ZoomInIcon sx={{ fontSize: 16 }} />
                  Click to Zoom
                </Box>
              )}

              {/* Navigation Left Arrow */}
              {mediaList.length > 1 && (
                <IconButton
                  aria-label="Previous image"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImg();
                  }}
                  sx={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: '#FFFFFF',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
                    zIndex: 2,
                  }}
                >
                  <ChevronLeftIcon fontSize="large" />
                </IconButton>
              )}

              {/* Navigation Right Arrow */}
              {mediaList.length > 1 && (
                <IconButton
                  aria-label="Next image"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImg();
                  }}
                  sx={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: '#FFFFFF',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
                    zIndex: 2,
                  }}
                >
                  <ChevronRightIcon fontSize="large" />
                </IconButton>
              )}

              {/* Photo Index Counter Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  bgcolor: 'rgba(15, 23, 42, 0.75)',
                  color: 'white',
                  px: 1.2,
                  py: 0.4,
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {activeImgIdx + 1} / {mediaList.length} {activeMedia.type === 'video' ? 'Video/Photos' : 'Photos'}
              </Box>
            </Paper>

            {/* Thumbnails Row */}
            {/* Thumbnail Strip */}
            {mediaList.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, mb: 1.5 }}>
                {mediaList.map((item, idx) => (
                  <Box
                    key={item.id || idx}
                    onClick={() => {
                      setIsVideoPlaying(false);
                      setActiveImgIdx(idx);
                    }}
                    sx={{
                      width: { xs: 75, sm: 90 },
                      height: { xs: 50, sm: 60 },
                      flexShrink: 0,
                      borderRadius: '6px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: activeImgIdx === idx ? '2.5px solid #1B4FD8' : '2px solid transparent',
                      opacity: activeImgIdx === idx ? 1 : 0.65,
                      transition: 'all 0.2s ease',
                      '&:hover': { opacity: 1 },
                      position: 'relative',
                    }}
                  >
                    {item.type === 'video' ? (
                      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0F172A', position: 'relative' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getVideoPoster(item.url)} alt={`${property.title} video thumbnail`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} />
                        <Box sx={{ position: 'absolute', width: 24, height: 24, borderRadius: '50%', bgcolor: 'rgba(239, 68, 68, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PlayArrowIcon sx={{ fontSize: 16, color: '#fff', ml: 0.2 }} />
                        </Box>
                      </Box>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={`${property.title} thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* 2. Overview & Details Box */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.2 }, borderRadius: '8px', border: '1px solid #E2E8F0', mb: { xs: 1.5, sm: 2 }, bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle1" component="h2" fontWeight={750} mb={1.2} color="#0F172A" sx={{ fontSize: '0.95rem' }}>
                Overview & Details
              </Typography>

              <Grid container spacing={{ xs: 1.2, sm: 2 }} sx={{ mb: 0.5 }}>
                <Grid item xs={6} sm={4}>
                  {renderDetailCard('Type / Purpose', property.listing_purpose || property.listing_type || 'SALE', <LocalOfferIcon sx={{ fontSize: 18 }} />)}
                </Grid>
                <Grid item xs={6} sm={4}>
                  {renderDetailCard('Category', categoryLabel, <CategoryIcon sx={{ fontSize: 18 }} />)}
                </Grid>
                {property.is_price_negotiable !== undefined && (
                  <Grid item xs={6} sm={4}>
                    {renderDetailCard(
                      'Price Negotiable',
                      property.is_price_negotiable ? 'Haan (हाँ / Negotiable)' : 'Fixed (तय मूल्य)',
                      <LocalOfferIcon sx={{ fontSize: 18 }} />
                    )}
                  </Grid>
                )}
                 {(() => {
                   const displayArea = property.area || (land && land.total_land_area) || (res && (res.carpet_area || res.built_up_area)) || (comm && (comm.carpet_area || comm.built_up_area));
                   const displayUnit = property.area_unit || (land && land.area_unit) || 'ft²';
                   
                   if (!displayArea) return null;
                   
                   return (
                     <Grid item xs={6} sm={4}>
                       {renderDetailCard('Plot / Built Area', `${displayArea} ${displayUnit}`, <AspectRatioIcon sx={{ fontSize: 18 }} />)}
                     </Grid>
                   );
                 })()}

                {/* 🌾 Land Specific Details */}
                {land && (
                  <>
                    {(land.plot_length || land.plot_width) && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Dimensions (L x W)', `${land.plot_length || '?'} x ${land.plot_width || '?'}`, <StraightenIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {['FARM_LAND', 'INDUSTRIAL_LAND', 'LAND_PARCEL'].includes(property.property_type || '') && (
                      <>
                        {land.soil_type && (
                          <Grid item xs={6} sm={4}>
                            {renderDetailCard('Soil Type', land.soil_type, <GrassIcon sx={{ fontSize: 18 }} />)}
                          </Grid>
                        )}
                        {land.current_crop && (
                          <Grid item xs={6} sm={4}>
                            {renderDetailCard('Current Crop', land.current_crop, <GrassIcon sx={{ fontSize: 18 }} />)}
                          </Grid>
                        )}
                        <Grid item xs={6} sm={4}>
                          {renderDetailCard(
                            'Irrigation Facility',
                            land.irrigation_available ? 'Available' : 'Not Available',
                            <WaterDropIcon sx={{ fontSize: 18, color: land.irrigation_available ? '#16A34A' : '#DC2626' }} />
                          )}
                        </Grid>
                      </>
                    )}
                  </>
                )}

                {/* 🏠 Residential Details */}
                {res && property.listing_purpose !== 'PG' && (
                  <>
                    {res.bedrooms && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Bedrooms', `${res.bedrooms} BHK`, <HotelIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {res.bathrooms && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Bathrooms', res.bathrooms, <BathtubIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {res.carpet_area && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Carpet Area', `${res.carpet_area} sqft`, <AspectRatioIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {res.built_up_area && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Built-up Area', `${res.built_up_area} sqft`, <AspectRatioIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {res.furnished_status && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Furnished', res.furnished_status.replace('_', ' '), <LayersIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {res.facing && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard(
                          'Facing',
                          (() => {
                            const map: Record<string, string> = {
                              'EAST': 'East (पूर्व)',
                              'WEST': 'West (पश्चिम)',
                              'NORTH': 'North (उत्तर)',
                              'SOUTH': 'South (दक्षिण)',
                              'NORTH_EAST': 'North-East',
                              'NORTH_WEST': 'North-West',
                              'SOUTH_EAST': 'South-East',
                              'SOUTH_WEST': 'South-West'
                            };
                            return map[String(res.facing).toUpperCase()] || res.facing;
                          })(),
                          <ExploreIcon sx={{ fontSize: 18 }} />
                        )}
                      </Grid>
                    )}
                    {res.possession_status && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Possession', res.possession_status, <EventAvailableIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {property.listing_purpose === 'RENT' && res.tenant_preference && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard(
                          'Tenant Preference',
                          res.tenant_preference === 'ANY' ? 'Any' : res.tenant_preference === 'BOTH' ? 'Both' : res.tenant_preference === 'BACHELORS' ? 'Bachelors' : 'Family',
                          <GroupIcon sx={{ fontSize: 18 }} />
                        )}
                      </Grid>
                    )}
                  </>
                )}

                {/* 🏢 Commercial Details */}
                {comm && (
                  <>
                    {comm.carpet_area && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Carpet Area', `${comm.carpet_area} sqft`, <AspectRatioIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {comm.built_up_area && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Built-up Area', `${comm.built_up_area} sqft`, <AspectRatioIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {comm.frontage && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Width', `${comm.frontage} ft`, <StraightenIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {comm.depth && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Length', `${comm.depth} ft`, <StraightenIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {comm.washrooms && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Washrooms', comm.washrooms, <BathtubIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {comm.floor !== undefined && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Floor', `${comm.floor} ${comm.total_floors ? `(of ${comm.total_floors})` : ''}`, <LayersIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                  </>
                )}

                {/* 🛏️ PG Details */}
                {pg && (
                  <>
                    {pg.pg_name && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('PG Name', pg.pg_name, <HotelIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {pg.room_type && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Room Type', pg.room_type.replace('_', ' '), <HotelIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {pg.gender_preference && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Gender', pg.gender_preference, <GroupIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    <Grid item xs={6} sm={4}>
                      {renderDetailCard(
                        'Food Available',
                        pg.food_available ? 'Yes' : 'No',
                        <CheckCircleIcon sx={{ fontSize: 18, color: pg.food_available ? '#16A34A' : '#DC2626' }} />
                      )}
                    </Grid>
                  </>
                )}

                {/* 📜 Lease Details */}
                {lease && (
                  <>
                    {lease.lease_duration_years && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Min Lease Period', `${lease.lease_duration_years} Years (कम से कम ${lease.lease_duration_years} साल)`, <AccessTimeIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {lease.lock_in_period_months && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Lock-in Period', `${lease.lock_in_period_months} Months`, <AccessTimeIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {lease.security_deposit && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Security Deposit', `₹${Number(lease.security_deposit).toLocaleString('en-IN')}`, <AccountBalanceWalletIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                  </>
                )}

                {/* 🎭 Hall Details */}
                {hall && (
                  <>
                    {hall.hall_type && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Hall Type', hall.hall_type, <LayersIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    {hall.capacity_people && (
                      <Grid item xs={6} sm={4}>
                        {renderDetailCard('Capacity', `${hall.capacity_people} People`, <GroupIcon sx={{ fontSize: 18 }} />)}
                      </Grid>
                    )}
                    <Grid item xs={6} sm={4}>
                      {renderDetailCard(
                        'AC / Non-AC',
                        hall.ac_available ? 'AC Available' : 'Non-AC',
                        <CheckCircleIcon sx={{ fontSize: 18, color: hall.ac_available ? '#16A34A' : '#DC2626' }} />
                      )}
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>

            {/* Mobile-only Future Value Projection (Right under Overview) */}
            {renderFutureValueProjection({ display: { xs: 'block', md: 'none' }, mb: 1.5 })}

            {/* 3. Amenities & Features Box */}
            {((property.amenities && property.amenities.length > 0) || (property.custom_amenities && property.custom_amenities.length > 0)) && (
              <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.2 }, borderRadius: '8px', border: '1px solid #E2E8F0', mb: { xs: 1.5, sm: 2 }, bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle1" component="h2" fontWeight={750} mb={1.2} color="#0F172A" sx={{ fontSize: '0.95rem' }}>
                  Amenities & Features (सुख सुविधाएं)
                </Typography>
                <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                  {property.amenities?.map((amenity) => (
                    <Grid item xs={6} sm={4} key={amenity.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#16A34A' }} />
                        <Typography fontWeight={600} color="#334155" variant="body2" sx={{ fontSize: '0.8rem' }}>{amenity.name}</Typography>
                      </Box>
                    </Grid>
                  ))}
                  {property.custom_amenities?.map((amenity, index) => (
                    <Grid item xs={6} sm={4} key={`custom-${index}`}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#0EA5E9' }} />
                        <Typography fontWeight={600} color="#334155" variant="body2" sx={{ fontSize: '0.8rem' }}>{amenity}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* 4. Description Box */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.2 }, borderRadius: '8px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle1" component="h2" fontWeight={750} mb={1} color="#0F172A" sx={{ fontSize: '0.95rem' }}>
                Description
              </Typography>
              <Typography color="#475569" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, fontSize: '0.86rem' }}>
                {property.description}
              </Typography>
            </Paper>
          </Grid>

          {/* ─── RIGHT COLUMN (~32% width) ─── */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 76, display: 'flex', flexDirection: 'column', gap: 2 }}>
              
              {/* CARD 1: Price & Title Box */}
              {renderPriceAndTitleCard({ display: { xs: 'none', md: 'block' } })}

              {/* CARD 3: Future Value Projection */}
              {renderFutureValueProjection({ display: { xs: 'none', md: 'block' } })}


              {/* CARD 2: Seller Info & Action Buttons */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  bgcolor: '#FFFFFF',
                }}
              >
                {/* Seller Header Row & Action Buttons */}
                {(() => {
                  const ownerProfileHref = property.owner_username 
                    ? `/u/${property.owner_username}` 
                    : property.owner_id 
                      ? `/u/${property.owner_id}` 
                      : '#';

                  return (
                    <>
                      <Box 
                        component={Link}
                        href={ownerProfileHref}
                        sx={{ 
                          display: 'flex', alignItems: 'center', gap: 2,
                          textDecoration: 'none', color: 'inherit',
                          '&:hover': { opacity: 0.85 }
                        }}
                      >
                        <Avatar
                          src={property.owner_avatar || undefined}
                          alt={property.owner_name || 'Property Owner'}
                          sx={{ width: 56, height: 56, bgcolor: '#1B4FD8', fontWeight: 700, fontSize: '1.2rem' }}
                        >
                          {(property.owner_name || 'Owner').charAt(0).toUpperCase()}
                        </Avatar>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" component="h3" fontWeight={700} sx={{ color: '#0F172A', fontSize: '0.98rem' }}>
                            Posted By {property.owner_name || 'Satish Pandey'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#1B4FD8', display: 'flex', alignItems: 'center', gap: 0.4, fontWeight: 600 }}>
                            See profile of {property.owner_name || 'Seller'}
                          </Typography>
                        </Box>

                        <ChevronRightIcon sx={{ color: '#94A3B8' }} />
                      </Box>

                      {/* Seller Action Buttons (See Profile & Chat with Owner) */}
                      <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
                        <Button
                          fullWidth
                          component={Link}
                          href={ownerProfileHref}
                          variant="outlined"
                          startIcon={<PersonIcon />}
                          sx={{
                            borderColor: '#1B4FD8',
                            color: '#1B4FD8',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 2,
                            py: 1,
                            fontSize: { xs: '0.78rem', sm: '0.85rem' },
                            whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: '#F0F4FF', borderColor: '#1541B5' },
                          }}
                        >
                          See Profile
                        </Button>

                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<ChatBubbleOutlineIcon />}
                          onClick={() => {
                            if (property.owner_id) {
                              window.dispatchEvent(new CustomEvent('open-chat', { detail: { userId: property.owner_id } }));
                            }
                          }}
                          sx={{
                            bgcolor: '#1B4FD8',
                            color: '#FFFFFF',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 2,
                            py: 1,
                            fontSize: { xs: '0.78rem', sm: '0.85rem' },
                            whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: '#1640B0' },
                          }}
                        >
                          Chat with Owner
                        </Button>
                      </Stack>
                    </>
                  );
                })()}
              </Paper>

              {/* Embedded Google Map */}
              {(property.location?.latitude && property.location?.longitude) && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 3,
                    p: 3,
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    bgcolor: '#FFFFFF',
                    overflow: 'hidden'
                  }}
                >
                  <Typography variant="body1" component="h2" fontWeight={700} sx={{ mb: 2, color: '#0F172A', fontSize: '1.05rem' }}>
                    Map Location
                  </Typography>
                  <Box sx={{ width: '100%', height: 280, borderRadius: '6px', overflow: 'hidden' }}>
                    <iframe 
                      width="100%" 
                      height="100%" 
                      title="Property location on Google Maps"
                      style={{ border: 0 }} 
                      loading="lazy" 
                      allowFullScreen 
                      referrerPolicy="no-referrer-when-downgrade" 
                      src={`https://maps.google.com/maps?q=${property.location.latitude},${property.location.longitude}&t=m&z=15&output=embed&iwloc=near`}
                    ></iframe>
                  </Box>
                </Paper>
              )}
            </Box>
          </Grid>

        </Grid>
      </Container>

      {/* ─── TRANSPARENT OVERLAY LIGHTBOX MODAL (Matches 2nd reference image) ─── */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="lg"
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible',
            m: { xs: 1, sm: 3 },
            maxHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: 'rgba(0, 0, 0, 0.78)',
              backdropFilter: 'blur(6px)',
            },
          },
        }}
      >
        {/* Outer click-to-close wrapper */}
        <Box
          onClick={handleCloseModal}
          sx={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Top Floating Controls */}
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: 900,
              mb: 1.5,
              px: { xs: 0.5, sm: 1.5 },
              zIndex: 10,
              position: 'relative',
              gap: { xs: 0.5, sm: 1 },
              flexWrap: 'nowrap',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'white',
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
                fontSize: { xs: '0.75rem', sm: '0.9rem' },
                flexShrink: 0,
              }}
            >
              {activeImgIdx + 1} / {mediaList.length} Photos
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.4, sm: 1 }, flexShrink: 0 }}>
              <IconButton
                aria-label="Zoom out"
                onClick={handleZoomOut}
                disabled={zoomScale <= 1}
                size="small"
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  p: { xs: 0.5, sm: 0.8 },
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                  '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(0,0,0,0.2)' },
                }}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>

              <Typography
                variant="caption"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  minWidth: { xs: 32, sm: 42 },
                  textAlign: 'center',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                }}
              >
                {Math.round(zoomScale * 100)}%
              </Typography>

              <IconButton
                aria-label="Zoom in"
                onClick={handleZoomIn}
                disabled={zoomScale >= 4}
                size="small"
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  p: { xs: 0.5, sm: 0.8 },
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                  '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(0,0,0,0.2)' },
                }}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>

              <IconButton
                aria-label="Reset zoom"
                onClick={handleResetZoom}
                size="small"
                title="Reset Zoom"
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  p: { xs: 0.5, sm: 0.8 },
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                }}
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>

              <IconButton
                aria-label="Close image viewer"
                onClick={handleCloseModal}
                size="small"
                title="Close"
                sx={{
                  color: 'white',
                  bgcolor: '#EF4444',
                  p: { xs: 0.5, sm: 0.8 },
                  ml: { xs: 0.3, sm: 1 },
                  '&:hover': { bgcolor: '#DC2626' },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Main Floating Image Container with Pinch-to-Zoom & Pan */}
          <Box
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleModalTouchStart}
            onTouchMove={handleModalTouchMove}
            onTouchEnd={handleModalTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheelZoom}
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: 900,
              maxHeight: { xs: '70vh', sm: '75vh' },
              height: { xs: '65vh', sm: '75vh' },
              borderRadius: '8px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              bgcolor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              touchAction: 'none',
              userSelect: 'none',
              cursor: zoomScale > 1.05 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeMedia.url}
              alt={property.title}
              draggable={false}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transition: isPinching || isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomScale})`,
                transformOrigin: 'center center',
                position: 'relative',
                zIndex: 1,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />

            {/* Left Nav Arrow */}
            {mediaList.length > 1 && zoomScale <= 1.05 && (
              <IconButton
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImg();
                  resetZoomAndPan();
                }}
                sx={{
                  position: 'absolute',
                  left: { xs: 6, sm: 12 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                  zIndex: 10,
                }}
              >
                <ChevronLeftIcon fontSize="large" />
              </IconButton>
            )}

            {/* Right Nav Arrow */}
            {mediaList.length > 1 && zoomScale <= 1.05 && (
              <IconButton
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImg();
                  resetZoomAndPan();
                }}
                sx={{
                  position: 'absolute',
                  right: { xs: 6, sm: 12 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                  zIndex: 10,
                }}
              >
                <ChevronRightIcon fontSize="large" />
              </IconButton>
            )}
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}