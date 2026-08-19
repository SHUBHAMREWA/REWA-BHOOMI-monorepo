'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';

// Icons
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
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

  // Prepare images array for auto slideshow
  const filteredImages = (property.images || []).filter((img): img is string => typeof img === 'string' && img.trim() !== '');
  const fallbackPlaceholder = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';

  const imageList = filteredImages.length > 0
    ? filteredImages
    : (property.thumbnail && property.thumbnail.trim() !== '')
    ? [property.thumbnail]
    : [fallbackPlaceholder];

  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Auto-change image every 1300ms with smooth transition
  useEffect(() => {
    if (imageList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % imageList.length);
    }, 1300);
    return () => clearInterval(interval);
  }, [imageList.length]);

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
    : property.bedrooms
    ? 'CONFIG (BED/BATH)'
    : 'PROPERTY TYPE';

  const col2Value = isLand
    ? (property.category_name || 'Plot / Land')
    : isCommercial
    ? (property.category_name || 'Commercial')
    : isPG
    ? 'Single / Shared'
    : property.bedrooms
    ? `${property.bedrooms} BHK / ${property.bathrooms || 1} Bath`
    : (property.category_name || 'Residential');

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
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          textDecoration: 'none',
          color: 'inherit',
          bgcolor: '#FFFFFF',
          borderRadius: '16px',
          border: '1.5px solid #80DEEA',
          overflow: 'hidden',
          transition: 'all 0.25s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: '#00BCD4',
            boxShadow: '0 12px 32px rgba(0, 188, 212, 0.16)',
          },
        }}
      >
        {/* Media Top */}
        <Box sx={{ position: 'relative', height: 200, bgcolor: '#F0F4FF' }}>
          {activeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={currentImageIdx} src={activeImage} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeCross 0.5s ease-in-out' }} />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#E2E8F0' }}>
              <Typography color="text.secondary" variant="caption">No Image</Typography>
            </Box>
          )}

          {/* Badges */}
          <Box sx={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 1 }}>
            <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: 'white', px: 1, py: 0.3, borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <PhotoCameraIcon sx={{ fontSize: 13 }} />
              {photoCount}+ Photos
            </Box>
            {showStatusBadge && property.status && (
              <Box sx={{ bgcolor: property.status === 'PUBLISHED' ? 'success.main' : property.status === 'REJECTED' ? 'error.main' : 'warning.main', color: 'white', px: 1, py: 0.3, borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                {property.status === 'PUBLISHED' ? 'APPROVED' : property.status.replace('_', ' ')}
              </Box>
            )}
          </Box>

          {/* Left & Right Navigation Arrows */}
          {imageList.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevImage}
                size="small"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 6,
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(15, 23, 42, 0.55)',
                  color: '#FFFFFF',
                  p: 0.3,
                  zIndex: 3,
                  '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.85)' },
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                onClick={handleNextImage}
                size="small"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: 6,
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(15, 23, 42, 0.55)',
                  color: '#FFFFFF',
                  p: 0.3,
                  zIndex: 3,
                  '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.85)' },
                }}
              >
                <ChevronRightIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem', lineHeight: 1.35, mb: 0.5, color: '#0F172A' }}>
              {property.title}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.82rem' }}>
                <LocationOnIcon sx={{ fontSize: 16, color: '#EF4444' }} />
                {property.city}, {property.state}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>
                {formatDaysAgo(property.created_at)}
              </Typography>
            </Box>

            {/* Spec Box */}
            <Box sx={{ bgcolor: '#F4F5F7', borderRadius: '8px', p: 1, mb: 1.5, display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>{col1Title}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{col1Value}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>{col2Title}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{col2Value}</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #F1F5F9' }}>
            <Typography variant="h6" color="primary" fontWeight={800} sx={{ fontSize: '1.15rem' }}>
              {formattedPrice}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {onEdit && (
                <IconButton 
                  size="small" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(property.id); }} 
                  color="primary" 
                  sx={{ border: '1px solid', borderColor: 'primary.main', p: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              <Typography variant="caption" color="primary" fontWeight={700} sx={{ textDecoration: 'underline' }}>
                View Details →
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Listing View (Responsive Mobile Card + Desktop Card)
  return (
    <Box
      sx={{
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

        {/* Top Row: Left Image (~130px), Right Specs */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {/* Image Container */}
          <Box
            component={Link}
            href={`/property/${property.slug}`}
            sx={{
              position: 'relative',
              width: 130,
              height: 130,
              borderRadius: '10px',
              overflow: 'hidden',
              flexShrink: 0,
              bgcolor: '#F1F5F9',
              display: 'block',
            }}
          >
            {activeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={currentImageIdx} src={activeImage} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeCross 0.5s ease-in-out' }} />
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.disabled">No Image</Typography>
              </Box>
            )}

            {/* Photo count top left */}
            <Box sx={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 1 }}>
              <Box
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.75)',
                  color: 'white',
                  px: 0.8,
                  py: 0.2,
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.4,
                }}
              >
                <PhotoCameraIcon sx={{ fontSize: 12 }} />
                {photoCount}+
              </Box>
              {showStatusBadge && property.status && (
                <Box sx={{ bgcolor: property.status === 'PUBLISHED' ? 'success.main' : property.status === 'REJECTED' ? 'error.main' : 'warning.main', color: 'white', px: 0.8, py: 0.2, borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  {property.status === 'PUBLISHED' ? 'APPROVED' : property.status.replace('_', ' ')}
                </Box>
              )}
            </Box>

            {/* Bottom Dots Indicator (Dynamic according to image count) */}
            {imageList.length > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  zIndex: 2,
                }}
              >
                {imageList.slice(0, 8).map((_, dotIdx) => {
                  const isActive = currentImageIdx === dotIdx;
                  return (
                    <Box
                      key={dotIdx}
                      sx={{
                        width: isActive ? 7 : 5,
                        height: isActive ? 7 : 5,
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
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 4,
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(15, 23, 42, 0.55)',
                    color: '#FFFFFF',
                    p: 0.2,
                    zIndex: 3,
                    '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.85)' },
                  }}
                >
                  <ChevronLeftIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  onClick={handleNextImage}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: 4,
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(15, 23, 42, 0.55)',
                    color: '#FFFFFF',
                    p: 0.2,
                    zIndex: 3,
                    '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.85)' },
                  }}
                >
                  <ChevronRightIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </>
            )}
          </Box>

          {/* Right Details Column */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Price & Action Icons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.25rem', lineHeight: 1.1 }}>
                {formattedPrice}
              </Typography>

              <Box sx={{ display: 'flex', gap: 0.2, mt: -0.5, mr: -0.5 }}>
                <IconButton onClick={handleShare} size="small" sx={{ p: 0.5, color: '#64748B' }}>
                  <ShareIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton onClick={handleToggleFavorite} size="small" sx={{ p: 0.5, color: isFavorited ? '#EF4444' : '#64748B' }}>
                  {isFavorited ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </Box>
            </Box>

            {/* Title */}
            <Typography
              component={Link}
              href={`/property/${property.slug}`}
              sx={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#334155',
                lineHeight: 1.3,
                textDecoration: 'none',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                my: 0.4,
                '&:hover': { color: '#1B4FD8' },
              }}
            >
              {property.category_name
                ? `${property.category_name} in ${property.city}, ${property.state}`
                : property.title}
            </Typography>

            {/* Plot Area & Dimensions Specs */}
            <Box sx={{ display: 'flex', gap: 2, mt: 0.3, justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>Plot Area</Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{areaDisplay}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>Dimensions (L X B)</Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{dimensionsDisplay}</Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem', fontWeight: 600 }}>
                {formatDaysAgo(property.created_at)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* VIEW PLOT ON MAP Bar */}
        <Box
          component={Link}
          href={`/property/${property.slug}`}
          sx={{
            mt: 1.2,
            mb: 1,
            bgcolor: '#F1F5F9',
            borderRadius: '8px',
            py: 0.8,
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: 0.8,
            textDecoration: 'none',
            color: '#334155',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            '&:hover': { bgcolor: '#E2E8F0', color: '#1B4FD8' },
          }}
        >
          <LocationOnIcon sx={{ fontSize: 16, color: '#475569' }} />
          VIEW PLOT ON MAP
        </Box>

        {/* Description snippet with arrow */}
        <Box
          onClick={() => setDescriptionOpen(!descriptionOpen)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            cursor: 'pointer',
            py: 0.5,
            color: '#475569',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8rem',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: descriptionOpen ? 'normal' : 'nowrap',
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
            component={Link}
            href={`/property/${property.slug}`}
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
                style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeCross 0.5s ease-in-out' }}
              />
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#E2E8F0' }}>
                <Typography color="text.secondary" variant="caption">No Image Available</Typography>
              </Box>
            )}

            {/* Top Left Badge: Photos count */}
            <Box sx={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 1 }}>
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
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 6,
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(15, 23, 42, 0.55)',
                    color: '#FFFFFF',
                    p: 0.4,
                    zIndex: 3,
                    '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.85)' },
                  }}
                >
                  <ChevronLeftIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  onClick={handleNextImage}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: 6,
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(15, 23, 42, 0.55)',
                    color: '#FFFFFF',
                    p: 0.4,
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
                component={Link}
                href={`/property/${property.slug}`}
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#1E293B',
                  fontSize: { sm: '1.1rem', md: '1.18rem' },
                  lineHeight: 1.35,
                  textDecoration: 'none',
                  '&:hover': { color: '#1B4FD8' },
                }}
              >
                {property.category_name
                  ? `${property.category_name} in ${property.city}, ${property.state}`
                  : property.title}
              </Typography>

              {/* Action Buttons: Heart & Share */}
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                <Tooltip title={isFavorited ? 'Saved' : 'Save Property'}>
                  <IconButton onClick={handleToggleFavorite} size="small" sx={{ color: isFavorited ? '#EF4444' : '#64748B', '&:hover': { bgcolor: '#FEF2F2' } }}>
                    {isFavorited ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share Property">
                  <IconButton onClick={handleShare} size="small" sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}>
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Location Row with Red Pin */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOnIcon sx={{ color: '#EF4444', fontSize: 18 }} />
                <Typography
                  component={Link}
                  href={`/property/${property.slug}`}
                  variant="body2"
                  sx={{
                    color: '#334155',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': { color: '#1B4FD8' },
                  }}
                >
                  See on map
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, mr: 2 }}>
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
                  <Typography sx={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>
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
                  <Typography sx={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>
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
                  <Typography sx={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>
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
                onClick={() => setDescriptionOpen(!descriptionOpen)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: '#475569',
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
                    whiteSpace: descriptionOpen ? 'normal' : 'nowrap',
                    maxWidth: '90%',
                  }}
                >
                  {descriptionText}
                </Typography>
                {descriptionOpen ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
              </Box>
              <Collapse in={descriptionOpen}>
                <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#64748B', mt: 0.5, pl: 0.5 }}>
                  Full Address: {property.city}, {property.state}. Category: {property.category_name || 'Plot / Land'}. Listed for {property.listing_type || 'Sale'}.
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
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1B4FD8', fontSize: { sm: '1.25rem', md: '1.35rem' } }}>
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
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(property.id); }} 
                  color="primary" 
                  sx={{ border: '1px solid', borderColor: 'primary.main', p: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              <Typography
                component={Link}
                href={`/property/${property.slug}`}
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
        </Box>
      </Box>
    </Box>
  );
}
