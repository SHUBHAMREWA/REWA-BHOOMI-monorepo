'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

// Icons
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import StraightenIcon from '@mui/icons-material/Straighten';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ApartmentIcon from '@mui/icons-material/Apartment';
import TerrainIcon from '@mui/icons-material/Terrain';
import StorefrontIcon from '@mui/icons-material/Storefront';
import HotelIcon from '@mui/icons-material/Hotel';
import SellIcon from '@mui/icons-material/Sell';
import KeyIcon from '@mui/icons-material/Key';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth/AuthContext';
import { apiPost, apiDelete } from '@/lib/api';

export interface PropertyCardData {
  id: string;
  slug: string;
  title: string;
  description?: string;
  price: number;
  listing_type: string;
  city: string;
  state: string;
  address?: string | null;
  is_price_negotiable?: boolean;
  area?: number | null;
  area_unit?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  category_name?: string;
  thumbnail?: string | null;
  images?: string[] | null;
  is_popular?: boolean;
  owner_name?: string;
  owner_avatar?: string | null;
  owner_phone?: string | null;
  created_at?: string;
  image_count?: number;
  is_favorited?: boolean;
  dimensions?: string;
  status?: string;
  ownership?: string;
  listing_purpose?: string;
  category_type?: string;
  property_type?: string;
  video_url?: string | null;
}

interface PropertyCardProps {
  property: PropertyCardData;
  viewMode?: 'list' | 'grid';
  showStatusBadge?: boolean;
  onEdit?: (propertyId: string) => void;
}

// Helper to format Indian price currency
export function formatPrice(price: number): string {
  if (!price && price !== 0) return '₹ 0';
  if (price >= 10000000) {
    const cr = price / 10000000;
    return `₹ ${cr % 1 === 0 ? cr : cr.toFixed(2)} Lac`;
  }
  if (price >= 100000) {
    const lac = price / 100000;
    return `₹ ${lac % 1 === 0 ? lac : lac.toFixed(2)} Lac`;
  }
  return `₹ ${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// Helper to format area units (e.g. SQ_FT -> ft²)
export function formatAreaUnit(unit?: string | null): string {
  if (!unit) return 'ft²';
  const u = unit.toUpperCase().trim();
  if (u === 'SQ_FT' || u === 'SQFT' || u === 'SQ FT' || u === 'FT2' || u === 'FT²') return 'ft²';
  if (u === 'SQ_MT' || u === 'SQMT' || u === 'SQ MT' || u === 'M2' || u === 'M²') return 'm²';
  if (u === 'ACRE') return 'acre';
  if (u === 'HECTARE') return 'ha';
  if (u === 'BIGHA') return 'bigha';
  return unit.toLowerCase();
}

// Helper to format relative time
function formatDaysAgo(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Updated recently';
  if (diffDays > 30) {
    return `Updated ${Math.floor(diffDays / 30)} months ago`;
  }
  return `Updated ${diffDays} days ago`;
}

export default function PropertyCard({ property, viewMode = 'list', showStatusBadge = false, onEdit }: PropertyCardProps) {
  const { isAuthenticated, user: authUser } = useAuth();
  const [isFavorited, setIsFavorited] = useState(!!property.is_favorited);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const getEmbedUrl = (url: string) => {
    let embedUrl = '';
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('/shorts/')) videoId = url.split('/shorts/')[1].split('?')[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1`;
      } 
      else if (url.includes('facebook.com') || url.includes('fb.watch')) {
        embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
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

  const renderVideoDialog = () => {
    if (!property.video_url) return null;
    return (
      <Dialog
        open={videoOpen}
        onClose={(e: any) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          setVideoOpen(false);
        }}
        maxWidth="md"
        fullWidth
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: '#0F172A',
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" fontWeight={700}>Property Video Walkthrough</Typography>
          <IconButton
            aria-label="close"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setVideoOpen(false);
            }}
            sx={{
              color: '#94A3B8',
              '&:hover': { color: '#FFF' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#000' }}>
          {getEmbedUrl(property.video_url) ? (
            <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
              <iframe
                src={getEmbedUrl(property.video_url)}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', color: '#fff' }}>
              <Typography mb={2}>Video URL: {property.video_url}</Typography>
              <Button
                variant="contained"
                color="primary"
                href={property.video_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                Watch Video Externally
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  // Prepare images array for auto slideshow
  const filteredImages = (property.images || []).filter((img): img is string => typeof img === 'string' && img.trim() !== '');
  const fallbackPlaceholder = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';

  const imageList = filteredImages.length > 0
    ? filteredImages
    : (property.thumbnail && property.thumbnail.trim() !== '')
    ? [property.thumbnail]
    : [fallbackPlaceholder];

  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-cycle images only when user hovers on card/image (eliminates continuous CPU churn on main thread)
  useEffect(() => {
    if (!isHovered || imageList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % imageList.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isHovered, imageList.length]);

  const activeImage = imageList[currentImageIdx] || property.thumbnail;
  const photoCount = property.image_count || imageList.length || 1;
  const ownerName = property.owner_name || 'shubham kushwaha';
  const formattedPrice = formatPrice(property.price);

  const areaDisplay = property.area
    ? `${property.area} ${formatAreaUnit(property.area_unit)}`
    : '6600 ft²';

  const dimensionsDisplay = property.dimensions
    ? property.dimensions
    : property.bedrooms
    ? `${property.bedrooms} BHK / ${property.bathrooms || 1} Bath`
    : '110 X 60';

  const ownershipDisplay = property.ownership
    ? property.ownership
    : property.listing_type === 'SELL' || property.listing_purpose === 'SALE'
    ? 'Freehold'
    : property.listing_type === 'RENT' || property.listing_purpose === 'RENT'
    ? 'Rental'
    : 'Leasehold';

  // Determine Category / Purpose
  const isLand = property.category_name?.toLowerCase().includes('plot') ||
    property.category_name?.toLowerCase().includes('land') ||
    property.title?.toLowerCase().includes('plot') ||
    property.title?.toLowerCase().includes('land');
  const isCommercial = property.category_name?.toLowerCase().includes('commercial') || property.title?.toLowerCase().includes('shop') || property.title?.toLowerCase().includes('office');
  const isPG = property.listing_type === 'PG' || property.title?.toLowerCase().includes('pg') || property.title?.toLowerCase().includes('hostel');

  // Specs Columns calculation
  const col1Title = isLand ? 'PLOT AREA' : isCommercial ? 'CARPET AREA' : isPG ? 'RENT TYPE' : 'AREA';
  const col1Value = isPG ? 'Monthly Rent' : areaDisplay;

  const col2Title = isLand
    ? 'PROPERTY TYPE'
    : isCommercial
    ? 'TYPE'
    : isPG
    ? 'PG / HOSTEL'
    : 'PROPERTY TYPE';

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

  const fallbackValue = isLand
    ? 'Plot / Land'
    : isCommercial
    ? 'Commercial'
    : isPG
    ? 'Single / Shared'
    : 'Residential';

  const baseType = formattedPropertyType || fallbackValue;
  const configSuffix = property.bedrooms ? ` (${property.bedrooms} BHK)` : '';

  const col2Value = `${baseType}${configSuffix}`;

  const col3Title = 'PURPOSE';
  const col3Value = property.listing_type || ownershipDisplay;

  const Col1Icon = isPG ? MonetizationOnIcon : SquareFootIcon;
  const Col2Icon = isLand ? TerrainIcon : isCommercial ? StorefrontIcon : isPG ? HotelIcon : ApartmentIcon;
  const Col3Icon = property.listing_type === 'RENT' || property.listing_purpose === 'RENT' ? KeyIcon : SellIcon;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
        toast.success('Saved to favorites');
      }
    } catch {
      toast.error('Failed to update favorite status');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/property/${property.slug}` : '';
    if (navigator.share) {
      navigator.share({ title: property.title, url: shareUrl }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Property link copied to clipboard');
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (imageList.length <= 1) return;
    setCurrentImageIdx((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (imageList.length <= 1) return;
    setCurrentImageIdx((prev) => (prev + 1) % imageList.length);
  };

  const descriptionText = property.description || `Farmhouse plot is available for sale. Area ${areaDisplay}. Great connectivity in ${property.city || 'Rewa'}.`;

  if (viewMode === 'grid') {
    return (
      <Box
        component={Link}
        href={`/property/${property.slug}`}
        id={`property-${property.id}`}
        data-property-slug={property.slug}
        data-property-card="true"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          textDecoration: 'none',
          color: 'inherit',
          bgcolor: '#FFFFFF',
          borderRadius: { xs: '12px', sm: '16px' },
          border: '1.5px solid #80DEEA',
          overflow: 'hidden',
          transition: 'all 0.25s ease',
          boxShadow: '0 2px 8px rgba(0, 188, 212, 0.06)',
          '&:hover': {
            transform: 'translateY(-3px)',
            borderColor: '#00BCD4',
            boxShadow: '0 10px 24px rgba(0, 188, 212, 0.16)',
          },
        }}
      >
        {/* Media Top */}
        <Box sx={{ position: 'relative', height: { xs: 115, sm: 165, md: 195 }, bgcolor: '#F0F4FF' }}>
          {activeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={currentImageIdx}
              src={activeImage}
              alt={property.title}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeCross 0.5s ease-in-out' }}
            />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#E2E8F0' }}>
              <Typography color="text.secondary" variant="caption" sx={{ fontSize: '0.7rem' }}>No Image</Typography>
            </Box>
          )}
          
          {property.status === 'SOLD' && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <Typography component="span" fontWeight={900} sx={{ color: '#F87171', letterSpacing: 2, transform: 'rotate(-15deg)', border: '2px solid #F87171', px: 1, py: 0.2, borderRadius: 1.5, fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                SOLD
              </Typography>
            </Box>
          )}

          {/* Badges: Photos & Video */}
          <Box sx={{ position: 'absolute', top: { xs: 5, sm: 8 }, left: { xs: 5, sm: 8 }, display: 'flex', gap: 0.5, zIndex: 2 }}>
            <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: 'white', px: { xs: 0.5, sm: 0.8 }, py: 0.2, borderRadius: '4px', fontSize: { xs: '0.6rem', sm: '0.72rem' }, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <PhotoCameraIcon sx={{ fontSize: { xs: 10, sm: 13 } }} />
              <span>{photoCount}+</span>
            </Box>
            {property.video_url && (
              <Box 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVideoOpen(true); }}
                sx={{ bgcolor: '#EF4444', color: 'white', px: { xs: 0.5, sm: 0.8 }, py: 0.2, borderRadius: '4px', fontSize: { xs: '0.6rem', sm: '0.72rem' }, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3, cursor: 'pointer', '&:hover': { bgcolor: '#DC2626' } }}
              >
                <PlayArrowIcon sx={{ fontSize: { xs: 10, sm: 13 } }} />
                <span>Video</span>
              </Box>
            )}
            {showStatusBadge && property.status && (
              <Box sx={{ bgcolor: property.status === 'PUBLISHED' ? 'success.main' : property.status === 'REJECTED' ? 'error.main' : 'warning.main', color: 'white', px: 0.6, py: 0.2, borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                {property.status === 'PUBLISHED' ? 'APPROVED' : property.status.replace('_', ' ')}
              </Box>
            )}
          </Box>

          {/* Top-Right Action Buttons: Share & Favorite */}
          <Box sx={{ position: 'absolute', top: { xs: 5, sm: 8 }, right: { xs: 5, sm: 8 }, display: 'flex', gap: { xs: 0.6, sm: 0.8 }, zIndex: 2 }}>
            <IconButton
              onClick={handleShare}
              size="small"
              aria-label="Share property"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                width: { xs: 34, sm: 38 },
                height: { xs: 34, sm: 38 },
                color: '#334155',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                '&:hover': { bgcolor: '#FFFFFF', color: '#1B4FD8', transform: 'scale(1.08)' },
              }}
            >
              <ShareIcon sx={{ fontSize: { xs: 14, sm: 17 } }} />
            </IconButton>

            <IconButton
              onClick={handleToggleFavorite}
              size="small"
              aria-label="Save property"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                width: { xs: 34, sm: 38 },
                height: { xs: 34, sm: 38 },
                color: isFavorited ? '#EF4444' : '#334155',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                '&:hover': { bgcolor: '#FFFFFF', transform: 'scale(1.08)' },
              }}
            >
              {isFavorited ? <FavoriteIcon sx={{ fontSize: { xs: 15, sm: 18 } }} /> : <FavoriteBorderIcon sx={{ fontSize: { xs: 15, sm: 18 } }} />}
            </IconButton>
          </Box>

          {/* Left & Right Navigation Arrows (Desktop / Hover) */}
          {imageList.length > 1 && (
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <IconButton
                onClick={handlePrevImage}
                size="small"
                aria-label="Previous image"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 6,
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(15, 23, 42, 0.55)',
                  color: '#FFFFFF',
                  width: 36,
                  height: 36,
                  zIndex: 3,
                  '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.85)' },
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton
                onClick={handleNextImage}
                size="small"
                aria-label="Next image"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: 6,
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(15, 23, 42, 0.55)',
                  color: '#FFFFFF',
                  width: 36,
                  height: 36,
                  zIndex: 3,
                  '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.85)' },
                }}
              >
                <ChevronRightIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          <Box>
            {/* Title */}
            <Typography variant="h6" component="h3" fontWeight={700} sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.95rem' }, 
              lineHeight: 1.25, 
              mb: 0.3, 
              color: '#0F172A',
              display: '-webkit-box',
              WebkitLineClamp: { xs: 1, sm: 2 },
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden' 
            }}>
              {property.title}
            </Typography>

            {/* Location */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 0.4, sm: 1 }, gap: 0.5 }}>
              <Typography variant="body2" noWrap title={property.address || `${property.city}, ${property.state}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.3, fontSize: { xs: '0.66rem', sm: '0.78rem' }, minWidth: 0, overflow: 'hidden', color: '#334155' }}>
                <LocationOnIcon sx={{ fontSize: { xs: 13, sm: 15 }, color: '#EF4444', flexShrink: 0 }} />
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {property.address || `${property.city}, ${property.state}`}
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem', fontWeight: 600, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                {formatDaysAgo(property.created_at)}
              </Typography>
            </Box>

            {/* Compact Specs: On Mobile, sleek pill; On Desktop, 2-column box */}
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.4, bgcolor: '#F1F5F9', borderRadius: '6px', px: 0.6, py: 0.25, mb: 0.6, overflow: 'hidden' }}>
              <SquareFootIcon sx={{ fontSize: 12, color: '#334155', flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {col1Value} • {baseType}
              </Typography>
            </Box>

            {/* Desktop Spec Box */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, bgcolor: '#F4F5F7', borderRadius: '8px', p: 1, mb: 1.5, justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: '#334155', fontWeight: 700 }}>{col1Title}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{col1Value}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: '#334155', fontWeight: 700 }}>{col2Title}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{col2Value}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Price & Details Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: { xs: 0.5, sm: 1 }, borderTop: '1px solid #F1F5F9' }}>
            <Typography variant="h6" component="span" color="primary" fontWeight={800} sx={{ fontSize: { xs: '0.9rem', sm: '1.15rem' }, lineHeight: 1.1 }}>
              {formattedPrice}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              {onEdit && (
                <IconButton 
                  size="small" 
                  aria-label="Edit property"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(property.id); }} 
                  color="primary" 
                  sx={{ border: '1px solid', borderColor: 'primary.main', width: 34, height: 34, p: 0.4 }}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
              <Typography variant="caption" color="primary" fontWeight={700} sx={{ fontSize: { xs: '0.68rem', sm: '0.75rem' }, textDecoration: 'underline' }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>View Details →</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>View →</Box>
              </Typography>
            </Box>
          </Box>
        </Box>
        {renderVideoDialog()}
      </Box>
    );
  }

  // Listing View (Responsive Mobile Card + Desktop Card)
  return (
    <Box
      component={Link}
      href={`/property/${property.slug}`}
      id={`property-${property.id}`}
      data-property-slug={property.slug}
      data-property-card="true"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        bgcolor: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #80DEEA',
        p: { xs: 1.5, sm: 2.2 },
        mb: 2.5,
        transition: 'all 0.25s ease',
        boxShadow: '0 2px 10px rgba(0, 188, 212, 0.05)',
        '&:hover': {
          borderColor: '#00BCD4',
          boxShadow: '0 8px 30px rgba(0, 188, 212, 0.14)',
        },
        '@keyframes fadeCross': {
          '0%': { opacity: 0.35, transform: 'scale(1.02)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      }}
    >
      {/* ─── MOBILE VIEW (xs: block, sm: none) — Matches reference image ─── */}
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        {/* MB Prime Badge if applicable */}
        {property.is_popular && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 1, px: 1, py: 0.3, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 1 }}>
            <WorkspacePremiumIcon sx={{ fontSize: 14, color: '#D97706' }} />
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#92400E' }}>MB PRIME</Typography>
          </Box>
        )}
        
        {/* Top Row: Left Image (~115px), Right Specs */}
        <Box sx={{ display: 'flex', gap: { xs: 1.2, sm: 1.5 } }}>
          {/* Image Container */}
          <Box
            sx={{
              position: 'relative',
              width: { xs: 112, sm: 130 },
              height: { xs: 112, sm: 130 },
              borderRadius: '10px',
              overflow: 'hidden',
              flexShrink: 0,
              bgcolor: '#F1F5F9',
              display: 'block',
            }}
          >
            {activeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={currentImageIdx}
                src={activeImage}
                alt={property.title}
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeCross 0.5s ease-in-out' }}
              />
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.disabled">No Image</Typography>
              </Box>
            )}
            
            {property.status === 'SOLD' && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <Typography component="span" fontWeight={900} sx={{ color: '#F87171', letterSpacing: 3, transform: 'rotate(-20deg)', border: '4px solid #F87171', px: 1.5, py: 0.2, borderRadius: 2, textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                  SOLD
                </Typography>
              </Box>
            )}

            {/* Photo count top left */}
            <Box sx={{ position: 'absolute', top: 5, left: 5, display: 'flex', gap: 0.6, zIndex: 2 }}>
              <Box
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.75)',
                  color: 'white',
                  px: 0.6,
                  py: 0.15,
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.3,
                }}
              >
                <PhotoCameraIcon sx={{ fontSize: 11 }} />
                {photoCount}+
              </Box>
              {property.video_url && (
                <Box 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVideoOpen(true); }}
                  sx={{ bgcolor: '#EF4444', color: 'white', px: 0.6, py: 0.15, borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3, cursor: 'pointer', '&:hover': { bgcolor: '#DC2626' } }}
                >
                  <PlayArrowIcon sx={{ fontSize: 11 }} />
                  Video
                </Box>
              )}
              {showStatusBadge && property.status && (
                <Box sx={{ bgcolor: property.status === 'PUBLISHED' ? 'success.main' : property.status === 'REJECTED' ? 'error.main' : 'warning.main', color: 'white', px: 0.6, py: 0.15, borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  {property.status === 'PUBLISHED' ? 'APPROVED' : property.status.replace('_', ' ')}
                </Box>
              )}
            </Box>

            {/* Bottom Dots Indicator */}
            {imageList.length > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.4,
                  zIndex: 2,
                }}
              >
                {imageList.slice(0, 8).map((_, dotIdx) => {
                  const isActive = currentImageIdx === dotIdx;
                  return (
                    <Box
                      key={dotIdx}
                      sx={{
                        width: isActive ? 6 : 4,
                        height: isActive ? 6 : 4,
                        borderRadius: '50%',
                        bgcolor: isActive ? '#EF4444' : '#FFFFFF',
                        opacity: isActive ? 1 : 0.6,
                        transition: 'all 0.3s ease',
                      }}
                    />
                  );
                })}
              </Box>
            )}

            {/* Left & Right Navigation Arrows */}
            {imageList.length > 1 && (
              <>
                <IconButton
                  onClick={handlePrevImage}
                  size="small"
                  aria-label="Previous image"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 3,
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(15, 23, 42, 0.55)',
                    color: '#FFFFFF',
                    width: 32,
                    height: 32,
                    p: 0,
                    zIndex: 3,
                    '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.85)' },
                  }}
                >
                  <ChevronLeftIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  onClick={handleNextImage}
                  size="small"
                  aria-label="Next image"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: 3,
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(15, 23, 42, 0.55)',
                    color: '#FFFFFF',
                    width: 32,
                    height: 32,
                    p: 0,
                    zIndex: 3,
                    '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.85)' },
                  }}
                >
                  <ChevronRightIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </>
            )}
          </Box>

          {/* Right Details Column */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Price & Action Icons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 0.5 }}>
              <Typography variant="h6" component="span" sx={{ fontWeight: 800, color: '#0F172A', fontSize: { xs: '1.1rem', sm: '1.25rem' }, lineHeight: 1.1, flex: 1, minWidth: 0 }}>
                {formattedPrice}
              </Typography>

              <Box sx={{ display: 'flex', gap: 0.5, mt: -0.4, flexShrink: 0 }}>
                <IconButton onClick={handleShare} size="small" aria-label="Share property" sx={{ width: 36, height: 36, color: '#334155' }}>
                  <ShareIcon sx={{ fontSize: 17 }} />
                </IconButton>
                <IconButton onClick={handleToggleFavorite} size="small" aria-label="Save property" sx={{ width: 36, height: 36, color: isFavorited ? '#EF4444' : '#334155' }}>
                  {isFavorited ? <FavoriteIcon sx={{ fontSize: 17 }} /> : <FavoriteBorderIcon sx={{ fontSize: 17 }} />}
                </IconButton>
              </Box>
            </Box>

            {/* Title */}
            <Typography
              component="h3"
              sx={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#334155',
                lineHeight: 1.25,
                textDecoration: 'none',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                my: 0.3,
                '&:hover': { color: '#1B4FD8' },
              }}
            >
              {property.title}
            </Typography>

            {/* Plot Area & Dimensions Specs */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.2, sm: 1.8 }, mt: 0.3, alignItems: 'center' }}>
              <Box sx={{ minWidth: 'fit-content' }}>
                <Typography sx={{ fontSize: '0.62rem', color: '#334155', fontWeight: 700, lineHeight: 1.1 }}>{col1Title}</Typography>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 750, color: '#0F172A' }}>{col1Value}</Typography>
              </Box>
              <Box sx={{ minWidth: 'fit-content' }}>
                <Typography sx={{ fontSize: '0.62rem', color: '#334155', fontWeight: 700, lineHeight: 1.1 }}>{col2Title}</Typography>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 750, color: '#0F172A' }}>{col2Value}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* VIEW PLOT ON MAP & Updated Time Bar */}
        <Box
          sx={{
            mt: 1,
            mb: 0.6,
            bgcolor: '#F1F5F9',
            borderRadius: '8px',
            py: 0.6,
            px: 1.2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            textDecoration: 'none',
            color: '#334155',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0, overflow: 'hidden' }}>
            <LocationOnIcon sx={{ fontSize: 15, color: '#EF4444', flexShrink: 0 }} />
            <Typography noWrap title={property.address || `${property.city}, ${property.state}`} sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {property.address || `${property.city}, ${property.state}`}
            </Typography>
          </Box>
          {property.created_at && (
            <Typography variant="caption" sx={{ color: '#334155', fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {formatDaysAgo(property.created_at)}
            </Typography>
          )}
        </Box>

        {/* Description snippet with arrow */}
        <Box
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDescriptionOpen(!descriptionOpen);
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            py: 0.3,
            color: '#334155',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.78rem',
              lineHeight: 1.35,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: descriptionOpen ? 3 : 1,
              WebkitBoxOrient: 'vertical',
              whiteSpace: 'normal',
              maxWidth: '92%',
            }}
          >
            {descriptionText}
          </Typography>
          {descriptionOpen ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
        </Box>
      </Box>

      {/* ─── DESKTOP VIEW (sm: flex, xs: none) ─── */}
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: { sm: 'row' }, gap: 2.5 }}>
        {/* Left Side: Media Container & Owner Info */}
        <Box sx={{ width: { sm: 280, md: 310 }, flexShrink: 0 }}>
          {/* Image Frame */}
          <Box


            sx={{
              position: 'relative',
              height: 195,
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'block',
              bgcolor: '#F1F5F9',
            }}
          >
            {activeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={currentImageIdx}
                src={activeImage}
                alt={property.title}
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeCross 0.5s ease-in-out' }}
              />
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#E2E8F0' }}>
                <Typography color="text.secondary" variant="caption">No Image Available</Typography>
              </Box>
            )}

            
            {property.status === 'SOLD' && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <Typography component="span" fontWeight={900} sx={{ color: '#F87171', letterSpacing: 3, transform: 'rotate(-20deg)', border: '4px solid #F87171', px: 1.5, py: 0.2, borderRadius: 2, textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                  SOLD
                </Typography>
              </Box>
            )}


            {/* Top Left Badge: Photos count */}
            <Box sx={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 1, zIndex: 2 }}>
              <Box
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(4px)',
                  color: '#FFFFFF',
                  px: 1.2,
                  py: 0.4,
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <PhotoCameraIcon sx={{ fontSize: 14 }} />
                {photoCount}+ Photos
              </Box>
              {property.video_url && (
                <Box 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVideoOpen(true); }}
                  sx={{ bgcolor: '#EF4444', color: 'white', px: 1.2, py: 0.4, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover': { bgcolor: '#DC2626' } }}
                >
                  <PlayArrowIcon sx={{ fontSize: 14 }} />
                  Video
                </Box>
              )}
              {showStatusBadge && property.status && (
                <Box
                  sx={{
                    bgcolor: property.status === 'PUBLISHED' ? 'success.main' : property.status === 'REJECTED' ? 'error.main' : 'warning.main',
                    color: '#FFFFFF',
                    px: 1.2,
                    py: 0.4,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {property.status === 'PUBLISHED' ? 'APPROVED' : property.status.replace('_', ' ')}
                </Box>
              )}
            </Box>

            {/* Bottom Center Dots Carousel Indicator (Dynamic according to image count) */}
            {imageList.length > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  zIndex: 2,
                }}
              >
                {imageList.slice(0, 8).map((_, dotIdx) => {
                  const isActive = currentImageIdx === dotIdx;
                  return (
                    <Box
                      key={dotIdx}
                      sx={{
                        width: isActive ? 8 : 6,
                        height: isActive ? 8 : 6,
                        borderRadius: '50%',
                        bgcolor: isActive ? '#EF4444' : '#FFFFFF',
                        opacity: isActive ? 1 : 0.6,
                        transition: 'all 0.3s ease',
                      }}
                    />
                  );
                })}
              </Box>
            )}

            {/* Left & Right Navigation Arrows */}
            {imageList.length > 1 && (
              <>
                <IconButton
                  onClick={handlePrevImage}
                  size="small"
                  aria-label="Previous image"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 6,
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(15, 23, 42, 0.55)',
                    color: '#FFFFFF',
                    width: 38,
                    height: 38,
                    zIndex: 3,
                    '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.85)' },
                  }}
                >
                  <ChevronLeftIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  onClick={handleNextImage}
                  size="small"
                  aria-label="Next image"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: 6,
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(15, 23, 42, 0.55)',
                    color: '#FFFFFF',
                    width: 38,
                    height: 38,
                    zIndex: 3,
                    '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.85)' },
                  }}
                >
                  <ChevronRightIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </>
            )}
          </Box>

          {/* Owner Info below Image */}
          <Box sx={{ mt: 1.2 }}>
            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.85rem' }}>
              Owner: {ownerName}
            </Typography>
          </Box>
        </Box>

        {/* Right Side: Details, Specs Box & Price */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          {/* Header Row: Title & Actions */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 600,
                  color: '#1E293B',
                  fontSize: { sm: '1.1rem', md: '1.18rem' },
                  lineHeight: 1.35,
                  textDecoration: 'none',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  '&:hover': { color: '#1B4FD8' },
                }}
              >
                {property.title}
              </Typography>

              {/* Action Buttons: Heart & Share */}
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                <Tooltip title={isFavorited ? 'Saved' : 'Save Property'}>
                  <IconButton onClick={handleToggleFavorite} size="small" aria-label="Save property" sx={{ width: 36, height: 36, color: isFavorited ? '#EF4444' : '#334155', '&:hover': { bgcolor: '#FEF2F2' } }}>
                    {isFavorited ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share Property">
                  <IconButton onClick={handleShare} size="small" aria-label="Share property" sx={{ width: 36, height: 36, color: '#334155', '&:hover': { bgcolor: '#F1F5F9' } }}>
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Location Row with Red Pin */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, overflow: 'hidden', mr: 2 }}>
                <LocationOnIcon sx={{ color: '#EF4444', fontSize: 18, flexShrink: 0 }} />
                <Typography
                  variant="body2"
                  noWrap
                  title={property.address || `${property.city}, ${property.state}`}
                  sx={{
                    color: '#334155',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    '&:hover': { color: '#1B4FD8' },
                  }}
                >
                  {property.address || `${property.city}, ${property.state}`}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.75rem', fontWeight: 600, mr: 2 }}>
                {formatDaysAgo(property.created_at)}
              </Typography>
            </Box>

            {/* Grey Container Box: Key Property Specs (3 Columns) */}
            <Box
              sx={{
                bgcolor: '#F4F5F7',
                border: '1px solid #EAEEF4',
                borderRadius: '10px',
                p: { xs: 1.2, sm: 1.5 },
                my: 1.5,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
              }}
            >
              {/* Column 1 */}
              <Box sx={{ borderRight: '1px solid #E2E8F0', pr: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Col1Icon sx={{ fontSize: 18, color: '#E53935' }} />
                  <Typography sx={{ fontSize: '0.68rem', color: '#334155', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {col1Title}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: { sm: '0.88rem', md: '0.98rem' }, fontWeight: 700, color: '#0F172A', mt: 0.3 }}>
                  {col1Value}
                </Typography>
              </Box>

              {/* Column 2 */}
              <Box sx={{ borderRight: '1px solid #E2E8F0', px: { sm: 1 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Col2Icon sx={{ fontSize: 18, color: '#E53935' }} />
                  <Typography sx={{ fontSize: '0.68rem', color: '#334155', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {col2Title}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: { sm: '0.88rem', md: '0.98rem' }, fontWeight: 700, color: '#0F172A', mt: 0.3 }}>
                  {col2Value}
                </Typography>
              </Box>

              {/* Column 3 */}
              <Box sx={{ pl: { sm: 1 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Col3Icon sx={{ fontSize: 18, color: '#E53935' }} />
                  <Typography sx={{ fontSize: '0.68rem', color: '#334155', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {col3Title}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: { sm: '0.88rem', md: '0.98rem' }, fontWeight: 700, color: '#0F172A', mt: 0.3 }}>
                  {col3Value}
                </Typography>
              </Box>
            </Box>

            {/* Description Snippet with Expand Arrow */}
            <Box>
              <Box
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDescriptionOpen(!descriptionOpen);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: '#334155',
                  '&:hover': { color: '#0F172A' },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.82rem',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: descriptionOpen ? 4 : 1,
                    WebkitBoxOrient: 'vertical',
                    whiteSpace: 'normal',
                    maxWidth: '90%',
                  }}
                >
                  {descriptionText}
                </Typography>
                {descriptionOpen ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
              </Box>
              <Collapse in={descriptionOpen}>
                <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#64748B', mt: 0.5, pl: 0.5 }}>
                  Full Address: {property.address || `${property.city}, ${property.state}`}. Category: {property.category_name || 'Plot / Land'}. Listed for {property.listing_type || 'Sale'}.
                </Typography>
              </Collapse>
            </Box>
          </Box>

          {/* Bottom Row: Price & Legal Status Link */}
          <Box
            sx={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              pt: 1.5,
              mt: 1.5,
              borderTop: '1px solid #F1F5F9',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h5" component="span" sx={{ fontWeight: 800, color: '#1B4FD8', fontSize: { sm: '1.25rem', md: '1.35rem' } }}>
                {formattedPrice}
              </Typography>
              {property.area && (
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  ({Math.round(property.price / property.area)} / {formatAreaUnit(property.area_unit)})
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {onEdit && (
                <IconButton 
                  size="small" 
                  aria-label="Edit property"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(property.id); }} 
                  color="primary" 
                  sx={{ border: '1px solid', borderColor: 'primary.main', width: 36, height: 36, p: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              <Typography


                variant="body2"
                sx={{
                  color: '#334155',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  '&:hover': { color: '#1B4FD8' },
                }}
              >
                Legal & Civic Infra Status
              </Typography>
            </Box>
          </Box>
          {renderVideoDialog()}
        </Box>
      </Box>
    </Box>
  );
}
