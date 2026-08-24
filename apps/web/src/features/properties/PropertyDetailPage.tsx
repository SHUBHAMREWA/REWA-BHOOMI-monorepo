'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Button, Chip, Divider, Avatar, Paper, Breadcrumbs, IconButton, Dialog, Alert, CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth/AuthContext';
import { apiPost, apiDelete } from '@/lib/api';

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
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  
  const [property, setProperty] = useState<PropertyData | null>(initialProperty);
  const [loading, setLoading] = useState(!initialProperty);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!initialProperty && !isAuthLoading) {
      // Fetch property client-side if missing from SSR (e.g. requires auth)
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
  }, [initialProperty, slug, isAuthLoading]);

  const [isFavorited, setIsFavorited] = useState(property?.is_favorited || false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    if (property) {
      setIsFavorited(property.is_favorited);
    }
  }, [property]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
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

  const handleOpenModal = () => {
    setZoomScale(1);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setZoomScale(1);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale(1);
  };

  const validImages = (property.images || []).filter((img) => img && typeof img.url === 'string' && img.url.trim() !== '');
  const fallbackPlaceholder = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80';

  const imagesList = validImages.length > 0
    ? validImages
    : [{ id: 'placeholder', url: fallbackPlaceholder, sort_order: 0 }];

  const activeImageUrl = imagesList[activeImgIdx]?.url || fallbackPlaceholder;

  const priceFormatted = property.price?.toLocaleString('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }) || '₹ 0';

  const dateFormatted = property.created_at
    ? new Date(property.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    : 'Recently';

  const handlePrevImg = () => {
    if (imagesList.length <= 1) return;
    setActiveImgIdx((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  const handleNextImg = () => {
    if (imagesList.length <= 1) return;
    setActiveImgIdx((prev) => (prev + 1) % imagesList.length);
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

  const PROPERTY_TYPE_LABEL_MAP: Record<string, string> = {
    FLAT_APARTMENT: 'Flat / Apartment', INDEPENDENT_HOUSE_VILLA: 'House / Villa',
    ROOM: 'Single Room', PG: 'PG Accommodation', HOSTEL: 'Hostel Room', BUILDER_FLOOR: 'Builder Floor',
    STUDIO: 'Studio Apartment', SHOP: 'Dukaan / Shop', OFFICE: 'Office Space', SHOWROOM: 'Showroom',
    WAREHOUSE: 'Warehouse / Godown', COMMERCIAL_BUILDING: 'Commercial Building', CO_WORKING: 'Co-Working Space',
    INDUSTRIAL_PROPERTY: 'Industrial Property', RESIDENTIAL_PLOT: 'Residential Plot (Basti Plot)',
    COMMERCIAL_PLOT: 'Commercial Plot', AGRICULTURAL_LAND: 'Kheti ki Zameen (Agricultural Land)',
    FARM_LAND: 'Farm Land', INDUSTRIAL_LAND: 'Industrial Land', LAND_PARCEL: 'Badi Zameen (Large Land Parcel)',
    HALL: 'Hall', MARRIAGE_HALL: 'Marriage / Banquet Hall', GUEST_HOUSE: 'Guest House',
    HOTEL: 'Hotel / Resort', SCHOOL: 'School / Institute', OTHER: 'Other',
  };

  const formattedPropertyType = property.property_type 
    ? (PROPERTY_TYPE_LABEL_MAP[property.property_type] || property.property_type.replace(/_/g, ' '))
    : property.category_type 
      ? property.category_type.replace(/_/g, ' ') 
      : property.category_name;

  const categoryLabel = formattedPropertyType || (property.category_name || (property.property_type === 'PLOT' ? 'Plot' : 'Property'));
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
        p: { xs: 2.5, sm: 3 },
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        bgcolor: '#FFFFFF',
        ...displayProps,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: '#0F172A', fontSize: { xs: '1.6rem', sm: '2rem' } }}>
          {priceFormatted}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton onClick={handleShare} size="small" sx={{ color: '#475569', '&:hover': { color: '#0F172A' } }}>
            <ShareIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={handleToggleFavorite} size="small" sx={{ color: isFavorited ? '#EF4444' : '#475569', '&:hover': { color: '#EF4444' } }}>
            {isFavorited ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      <Typography
        variant="body1"
        fontWeight={600}
        sx={{
          color: '#334155',
          fontSize: '1rem',
          lineHeight: 1.45,
          mb: 2.5,
        }}
      >
        {property.title}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1.5, borderTop: '1px solid #F1F5F9' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <LocationOnIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
            {addressLabel}, {cityLabel}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
            {dateFormatted}
          </Typography>
        </Box>

        {(() => {
          const mapLink = property.location?.googleMapsLink || property.location?.google_maps_link;
          if (!mapLink) return null;
          return (
            <Button
              variant="outlined"
              size="small"
              href={mapLink}
              target="_blank"
              startIcon={
                <svg width="20" height="20" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                  <path d="M32 62 C32 62 8 36 8 24 C8 10.7 18.7 0 32 0 C45.3 0 56 10.7 56 24 C56 36 32 62 32 62Z" fill="#34A853"/>
                  <path d="M32 0 C18.7 0 8 10.7 8 24 L32 24 L32 0Z" fill="#4285F4"/>
                  <path d="M32 0 L32 24 L56 24 C56 10.7 45.3 0 32 0Z" fill="#EA4335"/>
                  <path d="M8 24 C8 36 20 50 32 62 L32 24 L8 24Z" fill="#FBBC05"/>
                  <path d="M32 24 L32 62 C44 50 56 36 56 24 L32 24Z" fill="#34A853"/>
                  <circle cx="32" cy="24" r="11" fill="white"/>
                </svg>
              }
              sx={{
                textTransform: 'none',
                alignSelf: 'flex-start',
                borderRadius: 2,
                mt: 0.5,
                borderColor: '#4285F4',
                color: '#4285F4',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#1A73E8',
                  bgcolor: 'rgba(66,133,244,0.06)',
                },
              }}
            >
              View on Google Maps
            </Button>
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
      { label: '2 Saal Mein', multiplier: 1.25 },
      { label: '3 Saal Mein', multiplier: 1.50 },
      { label: '5 Saal Mein', multiplier: 2.375 },
      { label: '10 Saal Mein', multiplier: 3.75 },
    ];
    return (
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: '10px', border: '1px solid #E2E8F0', bgcolor: '#fff', ...displayProps }}>
        <Typography variant="body2" fontWeight={700} color="#0F172A" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
          Es property ki kimat, agle kuch saalon mein lagbag itni ho sakti hai
        </Typography>
        <Typography variant="caption" color="#94A3B8" sx={{ fontSize: '0.7rem', display: 'block', mb: 2 }}>
          Market average ke hisaab se anumaan
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4 }}>
          {projections.map((p) => {
            const projVal = Math.round(base * p.multiplier);
            return (
              <Box key={p.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={600} color="#334155" sx={{ fontSize: '0.83rem' }}>
                  {p.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box component="span" sx={{ color: '#CBD5E1', fontSize: '0.9rem' }}>→</Box>
                  <Typography variant="body2" fontWeight={700} color="#16A34A" sx={{ fontSize: '0.85rem' }}>
                    ₹{fmt(projVal)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        <Typography variant="caption" color="#CBD5E1" sx={{ display: 'block', mt: 2, fontSize: '0.67rem' }}>
          Ye sirf ek anumaan hai. Asli kimat market par depend karti hai.
        </Typography>
      </Paper>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 4, sm: 8.5 }, pb: { xs: 6, sm: 8 }, bgcolor: '#F2F4F7' }}>
      <Container maxWidth="lg">
        
        {/* ─── BREADCRUMBS & BACK BUTTON BAR ─── */}
        <Box sx={{ py: { xs: 0.2, sm: 0.8 }, mb: { xs: 0.8, sm: 1.5 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
              <Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>
                Home
              </Link>
              <Link href="/properties" style={{ color: '#475569', textDecoration: 'none' }}>
                Properties
              </Link>
              <Link href={`/properties?category=${property.category_slug || ''}`} style={{ color: '#475569', textDecoration: 'none' }}>
                {categoryLabel}
              </Link>
              <Link href={`/properties?state=${encodeURIComponent(stateLabel)}`} style={{ color: '#475569', textDecoration: 'none' }}>
                {categoryLabel} in {stateLabel}
              </Link>
              <Link href={`/properties?city=${encodeURIComponent(cityLabel)}`} style={{ color: '#475569', textDecoration: 'none' }}>
                {categoryLabel} in {cityLabel}
              </Link>
              <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' }, color: '#0F172A', fontWeight: 600, maxWidth: { xs: 150, sm: 300 }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {property.title}
              </Typography>
            </Breadcrumbs>
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
              onClick={handleOpenModal}
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
                cursor: 'pointer',
                '&:hover .zoom-badge': { opacity: 1, transform: 'scale(1.05)' },
              }}
            >
              {activeImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={activeImgIdx}
                  src={activeImageUrl}
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

              {/* Navigation Left Arrow */}
              {imagesList.length > 1 && (
                <IconButton
                  onClick={handlePrevImg}
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
              {imagesList.length > 1 && (
                <IconButton
                  onClick={handleNextImg}
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
                {activeImgIdx + 1} / {imagesList.length} Photos
              </Box>
            </Paper>

            {/* Thumbnails Row */}
            {imagesList.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, mb: 3 }}>
                {imagesList.map((img, idx) => (
                  <Box
                    key={img.id || idx}
                    onClick={() => setActiveImgIdx(idx)}
                    sx={{
                      width: 90,
                      height: 60,
                      flexShrink: 0,
                      borderRadius: '6px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: activeImgIdx === idx ? '2.5px solid #1B4FD8' : '2px solid transparent',
                      opacity: activeImgIdx === idx ? 1 : 0.65,
                      transition: 'all 0.2s ease',
                      '&:hover': { opacity: 1 },
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ))}
              </Box>
            )}

            {/* 2. Overview & Details Box */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3.5 }, borderRadius: '8px', border: '1px solid #E2E8F0', mb: { xs: 2, sm: 3 }, bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" fontWeight={700} mb={2.5} color="#0F172A">
                Overview & Details
              </Typography>

              <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 1 }}>
                <Grid item xs={6} sm={4}>
                  <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Type / Purpose</Typography>
                  <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{property.listing_purpose || property.listing_type || 'SALE'}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</Typography>
                  <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{categoryLabel}</Typography>
                </Grid>
                {(() => {
                  const displayArea = property.area || (land && land.total_land_area) || (res && (res.carpet_area || res.built_up_area)) || (comm && (comm.carpet_area || comm.built_up_area));
                  const displayUnit = property.area_unit || (land && land.area_unit) || 'ft²';
                  
                  if (!displayArea) return null;
                  
                  return (
                    <Grid item xs={6} sm={4}>
                      <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Plot / Built Area</Typography>
                      <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{displayArea} {displayUnit}</Typography>
                    </Grid>
                  );
                })()}

                {/* 🌾 Land Specific Details */}
                {land && (
                  <>
                    {(land.plot_length || land.plot_width) && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Dimensions (L x W)</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>
                          {land.plot_length || '?'} x {land.plot_width || '?'}
                        </Typography>
                      </Grid>
                    )}
                    {['FARM_LAND', 'INDUSTRIAL_LAND', 'LAND_PARCEL'].includes(property.property_type || '') && (
                      <>
                        {land.soil_type && (
                          <Grid item xs={6} sm={4}>
                            <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Soil Type</Typography>
                            <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{land.soil_type}</Typography>
                          </Grid>
                        )}
                        {land.current_crop && (
                          <Grid item xs={6} sm={4}>
                            <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Current Crop</Typography>
                            <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{land.current_crop}</Typography>
                          </Grid>
                        )}
                        <Grid item xs={6} sm={4}>
                          <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Irrigation Facility</Typography>
                          <Typography fontWeight={700} color={land.irrigation_available ? '#16A34A' : '#DC2626'} sx={{ mt: 0.3 }}>
                            {land.irrigation_available ? 'Available' : 'Not Available'}
                          </Typography>
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
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Bedrooms</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{res.bedrooms} BHK</Typography>
                      </Grid>
                    )}
                    {res.bathrooms && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Bathrooms</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{res.bathrooms}</Typography>
                      </Grid>
                    )}
                    {res.carpet_area && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Carpet Area</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{res.carpet_area} sqft</Typography>
                      </Grid>
                    )}
                    {res.built_up_area && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Built-up Area</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{res.built_up_area} sqft</Typography>
                      </Grid>
                    )}
                    {res.furnished_status && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Furnished</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{res.furnished_status.replace('_', ' ')}</Typography>
                      </Grid>
                    )}
                    {res.facing && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Facing (प्रॉपर्टी की दिशा)</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>
                          {(() => {
                            const map: Record<string, string> = {
                              'EAST': 'East (पूर्व)',
                              'WEST': 'West (पश्चिम)',
                              'NORTH': 'North (उत्तर)',
                              'SOUTH': 'South (दक्षिण)',
                              'NORTH_EAST': 'North-East (उत्तर-पूर्व)',
                              'NORTH_WEST': 'North-West (उत्तर-पश्चिम)',
                              'SOUTH_EAST': 'South-East (दक्षिण-पूर्व)',
                              'SOUTH_WEST': 'South-West (दक्षिण-पश्चिम)'
                            };
                            return map[String(res.facing).toUpperCase()] || res.facing;
                          })()}
                        </Typography>
                      </Grid>
                    )}
                    {res.possession_status && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Possession</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{res.possession_status}</Typography>
                      </Grid>
                    )}
                    {property.listing_purpose === 'RENT' && res.tenant_preference && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Tenant Preference (किरायेदार की प्राथमिकता)</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>
                          {res.tenant_preference === 'ANY' ? 'Any (कोई भी)' : res.tenant_preference === 'BOTH' ? 'Both Allowed (दोनों)' : res.tenant_preference === 'BACHELORS' ? 'Bachelors Allowed (बैचलर्स)' : 'Family Allowed (परिवार)'}
                        </Typography>
                      </Grid>
                    )}
                  </>
                )}

                {/* 🏢 Commercial Details */}
                {comm && (
                  <>
                    {comm.carpet_area && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Carpet Area</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{comm.carpet_area} sqft</Typography>
                      </Grid>
                    )}
                    {comm.built_up_area && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Built-up Area</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{comm.built_up_area} sqft</Typography>
                      </Grid>
                    )}
                    {comm.frontage && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Width (ft)</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{comm.frontage}</Typography>
                      </Grid>
                    )}
                    {comm.depth && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Length (ft)</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{comm.depth}</Typography>
                      </Grid>
                    )}
                    {comm.washrooms && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Washrooms</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{comm.washrooms}</Typography>
                      </Grid>
                    )}
                    {comm.floor !== undefined && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Floor</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{comm.floor} {comm.total_floors ? `out of ${comm.total_floors}` : ''}</Typography>
                      </Grid>
                    )}
                  </>
                )}

                {/* 🛏️ PG Details */}
                {pg && (
                  <>
                    {pg.pg_name && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>PG Name</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{pg.pg_name}</Typography>
                      </Grid>
                    )}
                    {pg.room_type && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Room Type</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{pg.room_type.replace('_', ' ')}</Typography>
                      </Grid>
                    )}
                    {pg.gender_preference && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Gender</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{pg.gender_preference}</Typography>
                      </Grid>
                    )}
                    <Grid item xs={6} sm={4}>
                      <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Food Available</Typography>
                      <Typography fontWeight={700} color={pg.food_available ? '#16A34A' : '#DC2626'} sx={{ mt: 0.3 }}>
                        {pg.food_available ? '✅ Yes' : '❌ No'}
                      </Typography>
                    </Grid>
                  </>
                )}

                {/* 📜 Lease Details */}
                {lease && (
                  <>
                    {lease.lease_duration_years && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Lease Duration</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{lease.lease_duration_years} Years</Typography>
                      </Grid>
                    )}
                    {lease.lock_in_period_months && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Lock-in Period</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{lease.lock_in_period_months} Months</Typography>
                      </Grid>
                    )}
                    {lease.security_deposit && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Security Deposit</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>₹{Number(lease.security_deposit).toLocaleString('en-IN')}</Typography>
                      </Grid>
                    )}
                  </>
                )}

                {/* 🎭 Hall Details */}
                {hall && (
                  <>
                    {hall.hall_type && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Hall Type</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{hall.hall_type}</Typography>
                      </Grid>
                    )}
                    {hall.capacity_people && (
                      <Grid item xs={6} sm={4}>
                        <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Capacity</Typography>
                        <Typography fontWeight={700} color="#0F172A" sx={{ mt: 0.3 }}>{hall.capacity_people} People</Typography>
                      </Grid>
                    )}
                    <Grid item xs={6} sm={4}>
                      <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>AC / Non-AC</Typography>
                      <Typography fontWeight={700} color={hall.ac_available ? '#16A34A' : '#DC2626'} sx={{ mt: 0.3 }}>
                        {hall.ac_available ? '❄️ AC Available' : '🔥 Non-AC'}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>

            {/* Mobile-only Future Value Projection (Right under Overview) */}
            {renderFutureValueProjection({ display: { xs: 'block', md: 'none' }, mb: 2 })}

            {/* 3. Amenities & Features Box */}
            {((property.amenities && property.amenities.length > 0) || (property.custom_amenities && property.custom_amenities.length > 0)) && (
              <Paper elevation={0} sx={{ p: { xs: 2, sm: 3.5 }, borderRadius: '8px', border: '1px solid #E2E8F0', mb: { xs: 2, sm: 3 }, bgcolor: '#FFFFFF' }}>
                <Typography variant="h6" fontWeight={700} mb={2.5} color="#0F172A">Amenities & Features (सुख सुविधाएं)</Typography>
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  {property.amenities?.map((amenity) => (
                    <Grid item xs={6} sm={4} key={amenity.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: '#16A34A' }} />
                        <Typography fontWeight={600} color="#334155" variant="body2">{amenity.name}</Typography>
                      </Box>
                    </Grid>
                  ))}
                  {property.custom_amenities?.map((amenity, index) => (
                    <Grid item xs={6} sm={4} key={`custom-${index}`}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: '#0EA5E9' }} />
                        <Typography fontWeight={600} color="#334155" variant="body2">{amenity}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* 4. Description Box */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3.5 }, borderRadius: '8px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="h6" fontWeight={700} mb={1.5} color="#0F172A">Description</Typography>
              <Typography color="#475569" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.95rem' }}>
                {property.description}
              </Typography>
            </Paper>
          </Grid>

          {/* ─── RIGHT COLUMN (~32% width) — Exactly matching screenshot ─── */}
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
                  p: 3,
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  bgcolor: '#FFFFFF',
                }}
              >
                {/* Seller Header Row */}
                <Box 
                  component={property.owner_username ? Link : 'div'}
                  href={property.owner_username ? `/u/${property.owner_username}` : '#'}
                  sx={{ 
                    display: 'flex', alignItems: 'center', gap: 2,
                    textDecoration: 'none', color: 'inherit',
                    '&:hover': property.owner_username ? { opacity: 0.8 } : {}
                  }}
                >
                  <Avatar
                    src={property.owner_avatar || undefined}
                    sx={{ width: 56, height: 56, bgcolor: '#1B4FD8', fontWeight: 700, fontSize: '1.2rem' }}
                  >
                    {(property.owner_name || 'Owner').charAt(0).toUpperCase()}
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={700} sx={{ color: '#0F172A', fontSize: '0.98rem' }}>
                      Posted By {property.owner_name || 'Satish Pandey'}
                    </Typography>
                    {property.owner_username ? (
                      <Typography variant="caption" sx={{ color: '#1B4FD8', display: 'block', fontWeight: 600 }}>
                        See profile of {property.owner_name}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        Member since Aug 2020
                      </Typography>
                    )}
                  </Box>

                  {property.owner_username && <ChevronRightIcon sx={{ color: '#94A3B8' }} />}
                </Box>
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
                  <Typography variant="body1" fontWeight={700} sx={{ mb: 2, color: '#0F172A', fontSize: '1.05rem' }}>
                    Map Location
                  </Typography>
                  <Box sx={{ width: '100%', height: 280, borderRadius: '6px', overflow: 'hidden' }}>
                    <iframe 
                      width="100%" 
                      height="100%" 
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
            justify: 'center',
          }}
        >
          {/* Top Floating Controls */}
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              width: '100%',
              maxWidth: 900,
              mb: 1.5,
              px: 1,
              zIndex: 10,
              position: 'relative',
            }}
          >
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {activeImgIdx + 1} / {imagesList.length} Photos
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={handleZoomOut} disabled={zoomScale <= 0.5} size="small" sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>
                {Math.round(zoomScale * 100)}%
              </Typography>
              <IconButton onClick={handleZoomIn} disabled={zoomScale >= 3} size="small" sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={handleResetZoom} size="small" sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                <RestartAltIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={handleCloseModal} size="small" sx={{ color: 'white', bgcolor: '#EF4444', ml: 1, '&:hover': { bgcolor: '#DC2626' } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Main Floating Image Container */}
          <Box
            onClick={(e) => {
              e.stopPropagation();
              setZoomScale((prev) => (prev === 1 ? 1.8 : 1));
            }}
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: 900,
              maxHeight: '75vh',
              borderRadius: '8px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              bgcolor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              cursor: zoomScale > 1 ? 'zoom-out' : 'zoom-in',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImageUrl}
              alt={property.title}
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: `scale(${zoomScale})`,
                position: 'relative',
                zIndex: 1,
              }}
            />

            {/* Left Nav Arrow */}
            {imagesList.length > 1 && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImg();
                  setZoomScale(1);
                }}
                sx={{
                  position: 'absolute',
                  left: 12,
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
            {imagesList.length > 1 && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImg();
                  setZoomScale(1);
                }}
                sx={{
                  position: 'absolute',
                  right: 12,
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