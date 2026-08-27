'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Paper,
  Chip,
  Drawer,
  IconButton,
  Badge,
  Divider,
  FormControl,
  Stack,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LandscapeIcon from '@mui/icons-material/Landscape';
import HomeIcon from '@mui/icons-material/Home';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import TuneIcon from '@mui/icons-material/Tune';

import PropertyCard, { PropertyCardData } from './PropertyCard';
import { apiGet } from '@/lib/api';
import {
  PROPERTY_CATEGORIES,
  getPropertyTypesByCategory,
} from '@/config/propertyFormConfig';
import { PropertyCategoryType, PropertyTypeEnum } from '@rewa-bhoomi/types';

const BUDGET_OPTIONS_MIN = [
  { label: 'Min', value: '' },
  { label: '₹ 3 Lac', value: '300000' },
  { label: '₹ 5 Lac', value: '500000' },
  { label: '₹ 10 Lac', value: '1000000' },
  { label: '₹ 20 Lac', value: '2000000' },
  { label: '₹ 50 Lac', value: '5000000' },
];

const BUDGET_OPTIONS_MAX = [
  { label: 'Max', value: '' },
  { label: '₹ 10 Lac', value: '1000000' },
  { label: '₹ 25 Lac', value: '2500000' },
  { label: '₹ 50 Lac', value: '5000000' },
  { label: '₹ 1 Cr', value: '10000000' },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  LAND: <LandscapeIcon fontSize="small" />,
  RESIDENTIAL: <HomeIcon fontSize="small" />,
  COMMERCIAL: <StorefrontIcon fontSize="small" />,
  SPECIAL: <MeetingRoomIcon fontSize="small" />,
};

function formatPriceLabel(val: number): string {
  if (val <= 300000) return 'Min';
  if (val >= 10000000) return 'Max (₹1Cr+)';
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)}Lac`;
  return `₹${val.toLocaleString('en-IN')}`;
}

function formatSelectLabel(selected?: string | null, defaultLabel = 'Min'): string {
  if (!selected || selected === '' || selected === '0') return defaultLabel;
  const num = Number(selected);
  if (isNaN(num)) return selected;
  if (num >= 10000000 && defaultLabel === 'Max') return 'Max';
  if (num >= 10000000) return `₹ ${Number.isInteger(num / 10000000) ? (num / 10000000).toFixed(0) : (num / 10000000).toFixed(1)} Cr`;
  if (num >= 100000) return `₹ ${Number.isInteger(num / 100000) ? (num / 100000).toFixed(0) : (num / 100000).toFixed(1)} Lac`;
  return `₹ ${num.toLocaleString('en-IN')}`;
}

export default function PropertiesSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Parse initial state from URL params
  const rawCat = searchParams.get('categoryType') || searchParams.get('category') || '';
  const initialCategoryType = (['LAND', 'RESIDENTIAL', 'COMMERCIAL', 'SPECIAL'].includes(rawCat.toUpperCase())
    ? rawCat.toUpperCase()
    : rawCat.toLowerCase() === 'land' || rawCat.toLowerCase() === 'plot' || rawCat.toLowerCase() === 'agricultural' ? 'LAND'
    : rawCat.toLowerCase() === 'house' || rawCat.toLowerCase() === 'apartment' || rawCat.toLowerCase() === 'villa' ? 'RESIDENTIAL'
    : rawCat.toLowerCase() === 'commercial' || rawCat.toLowerCase() === 'office' || rawCat.toLowerCase() === 'shop' ? 'COMMERCIAL'
    : '') as PropertyCategoryType | '';

  const initialPropertyType = (searchParams.get('propertyType') || searchParams.get('type') || '') as PropertyTypeEnum | '';

  // Filter States
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [listingPurpose, setListingPurpose] = useState<string>(searchParams.get('listingPurpose') || searchParams.get('listingType') || '');
  const [categoryType, setCategoryType] = useState<PropertyCategoryType | ''>(initialCategoryType);
  const [propertyType, setPropertyType] = useState<PropertyTypeEnum | ''>(initialPropertyType);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [furnishedStatus, setFurnishedStatus] = useState(searchParams.get('furnishedStatus') || '');
  const [minArea, setMinArea] = useState(searchParams.get('minArea') || '');
  const [maxArea, setMaxArea] = useState(searchParams.get('maxArea') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  const keywordInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when URL params change
  useEffect(() => {
    setKeyword(searchParams.get('keyword') || '');
    setCity(searchParams.get('city') || '');
    setListingPurpose(searchParams.get('listingPurpose') || searchParams.get('listingType') || '');
    
    const cat = searchParams.get('categoryType') || searchParams.get('category') || '';
    const normCat = (['LAND', 'RESIDENTIAL', 'COMMERCIAL', 'SPECIAL'].includes(cat.toUpperCase())
      ? cat.toUpperCase()
      : cat.toLowerCase() === 'land' || cat.toLowerCase() === 'plot' || cat.toLowerCase() === 'agricultural' ? 'LAND'
      : cat.toLowerCase() === 'house' || cat.toLowerCase() === 'apartment' || cat.toLowerCase() === 'villa' ? 'RESIDENTIAL'
      : cat.toLowerCase() === 'commercial' || cat.toLowerCase() === 'office' || cat.toLowerCase() === 'shop' ? 'COMMERCIAL'
      : '') as PropertyCategoryType | '';
    setCategoryType(normCat);

    setPropertyType((searchParams.get('propertyType') || searchParams.get('type') || '') as PropertyTypeEnum | '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setBedrooms(searchParams.get('bedrooms') || '');
    setFurnishedStatus(searchParams.get('furnishedStatus') || '');
    setMinArea(searchParams.get('minArea') || '');
    setMaxArea(searchParams.get('maxArea') || '');
    setSortBy(searchParams.get('sortBy') || 'newest');
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('focus') === 'true' || searchParams.get('autoFocus') === 'true') {
      const timer = setTimeout(() => {
        if (keywordInputRef.current) {
          keywordInputRef.current.focus();
          keywordInputRef.current.select();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const fetchProperties = async (reset = false) => {
    try {
      if (reset) setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      if (!reset && cursor) params.append('cursor', cursor);
      params.set('limit', '12');

      const data = await apiGet<{ data: PropertyCardData[]; meta: { hasMore: boolean; cursor: string | null } }>(
        `/properties?${params.toString()}`
      );

      setProperties(prev => (reset ? data.data : [...prev, ...data.data]));
      setHasMore(data.meta.hasMore);
      setCursor(data.meta.cursor);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleApplyFilters = (customOverrides?: Partial<{
    keyword: string;
    city: string;
    listingPurpose: string;
    categoryType: string;
    propertyType: string;
    minPrice: string;
    maxPrice: string;
    bedrooms: string;
    furnishedStatus: string;
    minArea: string;
    maxArea: string;
    sortBy: string;
  }>) => {
    const pKeyword = customOverrides?.keyword !== undefined ? customOverrides.keyword : keyword;
    const pCity = customOverrides?.city !== undefined ? customOverrides.city : city;
    const pPurpose = customOverrides?.listingPurpose !== undefined ? customOverrides.listingPurpose : listingPurpose;
    const pCategory = customOverrides?.categoryType !== undefined ? customOverrides.categoryType : categoryType;
    const pPropType = customOverrides?.propertyType !== undefined ? customOverrides.propertyType : propertyType;
    const pMinPrice = customOverrides?.minPrice !== undefined ? customOverrides.minPrice : minPrice;
    const pMaxPrice = customOverrides?.maxPrice !== undefined ? customOverrides.maxPrice : maxPrice;
    const pBedrooms = customOverrides?.bedrooms !== undefined ? customOverrides.bedrooms : bedrooms;
    const pFurnished = customOverrides?.furnishedStatus !== undefined ? customOverrides.furnishedStatus : furnishedStatus;
    const pMinArea = customOverrides?.minArea !== undefined ? customOverrides.minArea : minArea;
    const pMaxArea = customOverrides?.maxArea !== undefined ? customOverrides.maxArea : maxArea;
    const pSortBy = customOverrides?.sortBy !== undefined ? customOverrides.sortBy : sortBy;

    const params = new URLSearchParams();
    if (pKeyword) params.set('keyword', pKeyword);
    if (pCity) params.set('city', pCity);
    if (pPurpose) params.set('listingPurpose', pPurpose);
    if (pCategory) params.set('categoryType', pCategory);
    if (pPropType) params.set('propertyType', pPropType);
    if (pMinPrice) params.set('minPrice', pMinPrice);
    if (pMaxPrice) params.set('maxPrice', pMaxPrice);
    if (pBedrooms) params.set('bedrooms', pBedrooms);
    if (pFurnished) params.set('furnishedStatus', pFurnished);
    if (pMinArea) params.set('minArea', pMinArea);
    if (pMaxArea) params.set('maxArea', pMaxArea);
    if (pSortBy && pSortBy !== 'newest') params.set('sortBy', pSortBy);

    setDrawerOpen(false);
    router.push(`/properties?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setKeyword('');
    setCity('');
    setListingPurpose('');
    setCategoryType('');
    setPropertyType('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setFurnishedStatus('');
    setMinArea('');
    setMaxArea('');
    setSortBy('newest');
    setDrawerOpen(false);
    router.push('/properties');
  };

  // Helper to change Category & handle propertyType compatibility
  const handleCategoryChange = (newCat: PropertyCategoryType | '') => {
    setCategoryType(newCat);
    if (!newCat) {
      setPropertyType('');
      handleApplyFilters({ categoryType: '', propertyType: '' });
      return;
    }
    // Check if current propertyType belongs to new Category
    const availableSubtypes = getPropertyTypesByCategory(newCat);
    const isValidForNewCat = availableSubtypes.some(st => st.key === propertyType);
    const newPropType = isValidForNewCat ? propertyType : '';
    setPropertyType(newPropType);
    handleApplyFilters({ categoryType: newCat, propertyType: newPropType });
  };

  // Subcategories available for selected category
  const activeSubcategories = categoryType ? getPropertyTypesByCategory(categoryType) : [];

  // Active filters count for Badge
  const activeFiltersCount = [
    categoryType,
    propertyType,
    listingPurpose,
    minPrice,
    maxPrice,
    bedrooms,
    furnishedStatus,
    minArea,
    maxArea,
  ].filter(Boolean).length;

  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 2, sm: 3.5 }, pb: { xs: 6, sm: 6 }, bgcolor: '#F8FAFC' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 } }}>
        
        {/* Compact Search Header */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#0F172A', fontSize: { xs: '1.1rem', sm: '1.4rem' } }}>
            Properties & Plots in {city || 'Rewa'}
          </Typography>
        </Box>

        {/* ─── MAIN DYNAMIC CATEGORY BAR (Ultra-Compact) ─── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 0.8, sm: 1 },
            mb: 1,
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Chip
            size="small"
            label="All Categories"
            onClick={() => handleCategoryChange('')}
            color={!categoryType ? 'primary' : 'default'}
            variant={!categoryType ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 700,
              fontSize: '0.78rem',
              py: 1.5,
              px: 0.2,
              bgcolor: !categoryType ? '#1B4FD8' : '#F1F5F9',
              color: !categoryType ? '#FFFFFF' : '#475569',
              border: !categoryType ? 'none' : '1px solid #CBD5E1',
              '&:hover': { bgcolor: !categoryType ? '#1541B5' : '#E2E8F0' },
            }}
          />
          {PROPERTY_CATEGORIES.map(cat => {
            const isSelected = categoryType === cat.key;
            return (
              <Chip
                key={cat.key}
                size="small"
                icon={CATEGORY_ICONS[cat.key] ? (CATEGORY_ICONS[cat.key] as any) : undefined}
                label={cat.title}
                onClick={() => handleCategoryChange(isSelected ? '' : cat.key)}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  py: 1.5,
                  px: 0.2,
                  bgcolor: isSelected ? '#1B4FD8' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF !important' : '#334155',
                  border: isSelected ? 'none' : '1px solid #E2E8F0',
                  '& .MuiChip-icon': {
                    fontSize: '1rem',
                    color: isSelected ? '#FFFFFF !important' : '#1B4FD8 !important',
                  },
                  '&:hover': {
                    bgcolor: isSelected ? '#1541B5' : '#F8FAFC',
                    borderColor: '#CBD5E1',
                  },
                }}
              />
            );
          })}
        </Paper>

        {/* ─── DYNAMIC SUBCATEGORY DEPENDENT BAR (Clean & Compact) ─── */}
        {categoryType && activeSubcategories.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 0.6, sm: 0.8 },
              mb: 1,
              borderRadius: '8px',
              border: '1px dashed #CBD5E1',
              bgcolor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
              overflowX: 'auto',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap', mr: 0.3, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.04em' }}>
              Subcategory:
            </Typography>
            <Chip
              size="small"
              label="All Types"
              onClick={() => {
                setPropertyType('');
                handleApplyFilters({ propertyType: '' });
              }}
              sx={{
                fontWeight: 650,
                fontSize: '0.72rem',
                height: 24,
                bgcolor: !propertyType ? '#0F172A' : '#FFFFFF',
                color: !propertyType ? '#FFFFFF' : '#475569',
                border: '1px solid #E2E8F0',
              }}
            />
            {activeSubcategories.map(sub => {
              const isSubSelected = propertyType === sub.key;
              const cleanSubLabel = sub.label.split('(')[0].trim();
              return (
                <Chip
                  key={sub.key}
                  size="small"
                  label={cleanSubLabel}
                  onClick={() => {
                    const newSub = isSubSelected ? '' : sub.key;
                    setPropertyType(newSub);
                    handleApplyFilters({ propertyType: newSub });
                  }}
                  sx={{
                    fontWeight: 650,
                    fontSize: '0.72rem',
                    height: 24,
                    bgcolor: isSubSelected ? '#0F172A' : '#FFFFFF',
                    color: isSubSelected ? '#FFFFFF' : '#334155',
                    border: isSubSelected ? 'none' : '1px solid #E2E8F0',
                    '&:hover': {
                      bgcolor: isSubSelected ? '#1E293B' : '#FFFFFF',
                      borderColor: '#94A3B8',
                    },
                  }}
                />
              );
            })}
          </Paper>
        )}

        {/* ─── LISTING PURPOSE SELECTOR BAR (Separate & Clean) ─── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 0.6, sm: 0.8 },
            mb: 1,
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 0.6,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap', mr: 0.3, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.04em' }}>
            Purpose:
          </Typography>
          {[
            { label: 'All Purposes', value: '' },
            { label: 'Buy / Sell', value: 'SALE' },
            { label: 'Rent', value: 'RENT' },
            { label: 'Lease', value: 'LEASE' },
            { label: 'PG Accommodation', value: 'PG' },
            { label: 'Commercial Lease', value: 'COMMERCIAL_LEASE' },
          ].map(p => {
            const isSelected = listingPurpose === p.value;
            return (
              <Chip
                key={p.value}
                size="small"
                label={p.label}
                onClick={() => {
                  setListingPurpose(p.value);
                  handleApplyFilters({ listingPurpose: p.value });
                }}
                sx={{
                  fontWeight: 650,
                  fontSize: '0.72rem',
                  height: 25,
                  bgcolor: isSelected ? '#1B4FD8' : '#F1F5F9',
                  color: isSelected ? '#FFFFFF !important' : '#475569',
                  border: isSelected ? 'none' : '1px solid #CBD5E1',
                  '&:hover': {
                    bgcolor: isSelected ? '#1541B5' : '#E2E8F0',
                  },
                }}
              />
            );
          })}
        </Paper>

        {/* ─── SEARCH & QUICK FILTERS BAR ─── */}
        <Box
          className="glass"
          sx={{
            p: { xs: 0.8, sm: 1.2 },
            borderRadius: { xs: 2, sm: 2.5 },
            mb: 1,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexWrap: 'wrap',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          }}
        >
          {/* Keyword Search */}
          <TextField
            inputRef={keywordInputRef}
            size="small"
            placeholder="Search location, title, keyword..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApplyFilters();
            }}
            sx={{
              flex: 1,
              minWidth: { xs: 140, sm: 200 },
              bgcolor: 'white',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' },
            }}
          />

          {/* Category-Specific Quick Filters: Residential Bedrooms */}
          {categoryType === 'RESIDENTIAL' && (
            <Select
              size="small"
              displayEmpty
              value={bedrooms}
              onChange={(e) => {
                const val = e.target.value;
                setBedrooms(val);
                handleApplyFilters({ bedrooms: val });
              }}
              sx={{
                minWidth: { xs: 85, sm: 100 },
                bgcolor: 'white',
                borderRadius: 2,
                '& .MuiSelect-select': { py: { xs: 0.4, sm: 0.6 }, px: 1, fontSize: '0.82rem' },
              }}
            >
              <MenuItem value="">Bedrooms</MenuItem>
              <MenuItem value="1">1 BHK</MenuItem>
              <MenuItem value="2">2 BHK</MenuItem>
              <MenuItem value="3">3 BHK</MenuItem>
              <MenuItem value="4">4+ BHK</MenuItem>
            </Select>
          )}

          {/* Advanced Filter Drawer Trigger Button */}
          <Badge badgeContent={activeFiltersCount} color="primary">
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneIcon sx={{ fontSize: '1rem !important' }} />}
              onClick={() => setDrawerOpen(true)}
              sx={{
                py: { xs: 0.4, sm: 0.6 },
                px: { xs: 1.2, sm: 2 },
                borderRadius: 2,
                borderColor: '#CBD5E1',
                color: '#0F172A',
                fontWeight: 700,
                fontSize: '0.82rem',
                bgcolor: '#FFFFFF',
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' },
              }}
            >
              Filters
            </Button>
          </Badge>

          {/* Primary Apply Filter Button */}
          <Button
            variant="contained"
            size="small"
            startIcon={<FilterListIcon sx={{ fontSize: '1rem !important' }} />}
            onClick={() => handleApplyFilters()}
            sx={{
              py: { xs: 0.4, sm: 0.6 },
              px: { xs: 1.8, sm: 2.5 },
              borderRadius: 2,
              bgcolor: '#1B4FD8',
              fontWeight: 700,
              fontSize: '0.82rem',
              '&:hover': { bgcolor: '#1541B5' },
            }}
          >
            Search
          </Button>

          {/* Reset Filters Icon Button */}
          {activeFiltersCount > 0 && (
            <Button
              size="small"
              startIcon={<RestartAltIcon fontSize="small" />}
              onClick={handleClearFilters}
              sx={{ color: '#EF4444', fontWeight: 650, fontSize: '0.75rem', py: 0.3 }}
            >
              Reset
            </Button>
          )}
        </Box>

        {/* ─── BUDGET RANGE FILTER BANNER (Perfect Inline Alignment) ─── */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: '#F1F5F9',
            borderRadius: '12px',
            p: { xs: 1, sm: 1.5 },
            mb: 1.2,
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {/* Top Row: Budget Selects & Apply Button (Centered) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              width: '100%',
              gap: { xs: 0.8, sm: 1.2 },
              flexWrap: 'wrap',
            }}
          >
            {/* Centered Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.8 }, flexWrap: 'nowrap' }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: '#334155',
                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  whiteSpace: 'nowrap',
                }}
              >
                Budget:
              </Typography>

              <Select
                size="small"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                displayEmpty
                renderValue={(selected) => formatSelectLabel(selected, 'Min')}
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: '6px',
                  minWidth: { xs: 65, sm: 90 },
                  fontSize: { xs: '0.72rem', sm: '0.78rem' },
                  fontWeight: 600,
                  color: '#0F172A',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94A3B8' },
                  '& .MuiSelect-select': { py: 0.3, px: { xs: 0.6, sm: 1 } },
                }}
              >
                {BUDGET_OPTIONS_MIN.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>

              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem' }}>
                to
              </Typography>

              <Select
                size="small"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                displayEmpty
                renderValue={(selected) => formatSelectLabel(selected, 'Max')}
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: '6px',
                  minWidth: { xs: 65, sm: 90 },
                  fontSize: { xs: '0.72rem', sm: '0.78rem' },
                  fontWeight: 600,
                  color: '#0F172A',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94A3B8' },
                  '& .MuiSelect-select': { py: 0.3, px: { xs: 0.6, sm: 1 } },
                }}
              >
                {BUDGET_OPTIONS_MAX.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>

              <Button
                variant="contained"
                size="small"
                onClick={() => handleApplyFilters()}
                sx={{
                  bgcolor: '#1B4FD8',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  px: { xs: 1.2, sm: 2.5 },
                  py: 0.35,
                  fontWeight: 700,
                  fontSize: { xs: '0.72rem', sm: '0.78rem' },
                  textTransform: 'none',
                  boxShadow: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  '&:hover': { bgcolor: '#1541B5' },
                }}
              >
                Apply
              </Button>
            </Box>
          </Box>

          {/* Bottom Row: Centered Half-Width Touch Slider */}
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', pt: 0.2, pb: 0.2 }}>
            <Box sx={{ width: { xs: '80%', sm: '50%' }, px: 1 }}>
              <Slider
                value={[Number(minPrice) || 300000, Number(maxPrice) || 10000000]}
                min={300000}
                max={10000000}
                step={100000}
                valueLabelDisplay="auto"
                valueLabelFormat={formatPriceLabel}
                onChange={(_, val) => {
                  if (Array.isArray(val)) {
                    setMinPrice(val[0] <= 300000 ? '' : String(val[0]));
                    setMaxPrice(val[1] >= 10000000 ? '' : String(val[1]));
                  }
                }}
                sx={{
                  color: '#1B4FD8',
                  height: 4,
                  py: 0.8,
                  '& .MuiSlider-thumb': { height: 16, width: 16, backgroundColor: '#FFFFFF', border: '2px solid #1B4FD8' },
                  '& .MuiSlider-track': { border: 'none', bgcolor: '#1B4FD8' },
                  '& .MuiSlider-rail': { opacity: 0.3, bgcolor: '#94A3B8' },
                }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Results Count Bar & View Switcher */}
        {!loading && (() => {
          const hasFilter = Boolean(activeFiltersCount > 0 || keyword || city);
          return (
            <Box
              sx={{
                mb: 2.5,
                px: 0.5,
                display: 'flex',
                alignItems: 'center',
                justify: hasFilter ? 'space-between' : 'flex-end',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              {hasFilter && (
                <Typography variant="body1" sx={{ color: '#334155', fontWeight: 700, fontSize: '0.95rem' }}>
                  Showing <span style={{ color: '#1B4FD8' }}>{properties.length}</span> {properties.length === 1 ? 'Result' : 'Results'} for your search criteria
                </Typography>
              )}

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="small"
                sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                <ToggleButton value="list" aria-label="list view">
                  <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
                  List
                </ToggleButton>
                <ToggleButton value="grid" aria-label="grid view">
                  <GridViewIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Grid
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          );
        })()}

        {/* Results Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} variant="rectangular" height={220} sx={{ borderRadius: 4 }} />
            ))}
          </Box>
        ) : properties.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'white', borderRadius: 4, border: '1px solid #E2E8F0' }}>
            <Typography variant="h5" color="text.secondary">
              No properties found matching your criteria.
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </Box>
        ) : (
          <>
            {viewMode === 'list' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {properties.map(property => (
                  <PropertyCard key={property.id} property={property} viewMode="list" />
                ))}
              </Box>
            ) : (
              <Grid container spacing={3}>
                {properties.map(property => (
                  <Grid item xs={12} sm={6} md={4} key={property.id}>
                    <PropertyCard property={property} viewMode="grid" />
                  </Grid>
                ))}
              </Grid>
            )}

            {hasMore && (
              <Box sx={{ textAlign: 'center', mt: 6 }}>
                <Button variant="outlined" size="large" onClick={() => fetchProperties()} sx={{ borderRadius: 3, px: 4, fontWeight: 700 }}>
                  Load More Properties
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* ─── EXPANDABLE ADVANCED FILTERS DRAWER / MODAL ─── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            p: 3,
            bgcolor: '#FFFFFF',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" fontWeight={800} color="#0F172A">
            Advanced Search Filters
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3} sx={{ overflowY: 'auto', pb: 8 }}>
          {/* Major Category */}
          <Box>
            <Typography variant="subtitle2" fontWeight={750} color="#0F172A" mb={1}>
              Property Category
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant={!categoryType ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => handleCategoryChange('')}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  All Categories
                </Button>
              </Grid>
              {PROPERTY_CATEGORIES.map(cat => (
                <Grid item xs={6} key={cat.key}>
                  <Button
                    fullWidth
                    variant={categoryType === cat.key ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleCategoryChange(categoryType === cat.key ? '' : cat.key)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                  >
                    {cat.title}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Subcategory */}
          {categoryType && activeSubcategories.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={750} color="#0F172A" mb={1}>
                Subcategory ({PROPERTY_CATEGORIES.find(c => c.key === categoryType)?.title})
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyTypeEnum)}
                  displayEmpty
                >
                  <MenuItem value="">All Subcategories</MenuItem>
                  {activeSubcategories.map(sub => (
                    <MenuItem key={sub.key} value={sub.key}>
                      {sub.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Purpose */}
          <Box>
            <Typography variant="subtitle2" fontWeight={750} color="#0F172A" mb={1}>
              Listing Purpose
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={listingPurpose}
                onChange={(e) => setListingPurpose(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All Purposes</MenuItem>
                <MenuItem value="SALE">Buy / Sell</MenuItem>
                <MenuItem value="RENT">Rent</MenuItem>
                <MenuItem value="LEASE">Lease</MenuItem>
                <MenuItem value="PG">PG Accommodation</MenuItem>
                <MenuItem value="COMMERCIAL_LEASE">Commercial Lease</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Category-Specific: Residential Bedrooms & Furnished */}
          {categoryType === 'RESIDENTIAL' && (
            <>
              <Box>
                <Typography variant="subtitle2" fontWeight={750} color="#0F172A" mb={1}>
                  Bedrooms (BHK)
                </Typography>
                <Stack direction="row" spacing={1}>
                  {['', '1', '2', '3', '4'].map(b => (
                    <Chip
                      key={b}
                      label={b === '' ? 'Any' : b === '4' ? '4+ BHK' : `${b} BHK`}
                      onClick={() => setBedrooms(b)}
                      color={bedrooms === b ? 'primary' : 'default'}
                      variant={bedrooms === b ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 700 }}
                    />
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={750} color="#0F172A" mb={1}>
                  Furnished Status
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={furnishedStatus}
                    onChange={(e) => setFurnishedStatus(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">Any Furnished Status</MenuItem>
                    <MenuItem value="UNFURNISHED">Unfurnished</MenuItem>
                    <MenuItem value="SEMI_FURNISHED">Semi-Furnished</MenuItem>
                    <MenuItem value="FULLY_FURNISHED">Fully-Furnished</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </>
          )}

          {/* Plot / Built Area Range */}
          <Box>
            <Typography variant="subtitle2" fontWeight={750} color="#0F172A" mb={1}>
              Area Range (Sq. Ft.)
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Min Area"
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Max Area"
                  value={maxArea}
                  onChange={(e) => setMaxArea(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Sort By */}
          <Box>
            <Typography variant="subtitle2" fontWeight={750} color="#0F172A" mb={1}>
              Sort Results By
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="price_asc">Price: Low to High</MenuItem>
                <MenuItem value="price_desc">Price: High to Low</MenuItem>
                <MenuItem value="area_asc">Area: Low to High</MenuItem>
                <MenuItem value="area_desc">Area: High to Low</MenuItem>
                <MenuItem value="popular">Most Popular</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>

        {/* Drawer Action Footer */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2.5,
            bgcolor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: 1.5,
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={handleClearFilters}
            sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}
          >
            Clear All
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => handleApplyFilters()}
            sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none', bgcolor: '#1B4FD8', '&:hover': { bgcolor: '#1541B5' } }}
          >
            Apply Filters
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
