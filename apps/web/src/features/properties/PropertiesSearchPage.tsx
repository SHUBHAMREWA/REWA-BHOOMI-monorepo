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
  Radio,
  InputAdornment,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LandscapeIcon from '@mui/icons-material/Landscape';
import HomeIcon from '@mui/icons-material/Home';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import TuneIcon from '@mui/icons-material/Tune';
import CheckIcon from '@mui/icons-material/Check';

import PropertyCard, { PropertyCardData } from './PropertyCard';
import { apiGet } from '@/lib/api';
import {
  PROPERTY_CATEGORIES,
  PROPERTY_TYPES,
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
      return;
    }
    // Check if current propertyType belongs to new Category
    const availableSubtypes = getPropertyTypesByCategory(newCat);
    const isValidForNewCat = availableSubtypes.some(st => st.key === propertyType);
    const newPropType = isValidForNewCat ? propertyType : '';
    setPropertyType(newPropType);
  };

  // Subcategories available for selected category
  const activeSubcategories = categoryType ? getPropertyTypesByCategory(categoryType) : [];

  // Active filter tab for Flipkart two-column drawer
  const [activeFilterTab, setActiveFilterTab] = useState<'category' | 'subcategory' | 'purpose' | 'budget' | 'bedrooms' | 'furnishing' | 'area' | 'sortBy'>('category');
  const [subcategorySearch, setSubcategorySearch] = useState('');

  // Filter tabs definition with dynamic selection indicators
  const FILTER_TABS = [
    {
      key: 'category' as const,
      label: 'Category',
      hasValue: Boolean(categoryType),
      preview: categoryType ? PROPERTY_CATEGORIES.find(c => c.key === categoryType)?.title : undefined,
    },
    {
      key: 'subcategory' as const,
      label: 'Subcategory',
      hasValue: Boolean(propertyType),
      preview: propertyType ? PROPERTY_TYPES.find(pt => pt.key === propertyType)?.label.split('(')[0].trim() : undefined,
    },
    {
      key: 'purpose' as const,
      label: 'Purpose',
      hasValue: Boolean(listingPurpose),
      preview: listingPurpose === 'SALE' ? 'Buy / Sell' : listingPurpose === 'RENT' ? 'Rent' : listingPurpose === 'LEASE' ? 'Lease' : listingPurpose === 'PG' ? 'PG' : listingPurpose === 'COMMERCIAL_LEASE' ? 'Commercial Lease' : undefined,
    },
    {
      key: 'budget' as const,
      label: 'Price & Budget',
      hasValue: Boolean(minPrice || maxPrice),
      preview: (minPrice || maxPrice) ? `${formatPriceLabel(Number(minPrice) || 300000)} - ${formatPriceLabel(Number(maxPrice) || 10000000)}` : undefined,
    },
    {
      key: 'bedrooms' as const,
      label: 'Bedrooms',
      hasValue: Boolean(bedrooms),
      preview: bedrooms ? (bedrooms === '4' ? '4+ BHK' : `${bedrooms} BHK`) : undefined,
    },
    {
      key: 'furnishing' as const,
      label: 'Furnishing',
      hasValue: Boolean(furnishedStatus),
      preview: furnishedStatus === 'FULLY_FURNISHED' ? 'Fully' : furnishedStatus === 'SEMI_FURNISHED' ? 'Semi' : furnishedStatus === 'UNFURNISHED' ? 'Unfurnished' : undefined,
    },
    {
      key: 'area' as const,
      label: 'Area (Sq. Ft.)',
      hasValue: Boolean(minArea || maxArea),
      preview: (minArea || maxArea) ? `${minArea || '0'} - ${maxArea || 'Max'}` : undefined,
    },
    {
      key: 'sortBy' as const,
      label: 'Sort By',
      hasValue: Boolean(sortBy && sortBy !== 'newest'),
      preview: sortBy === 'price_asc' ? 'Price Low-High' : sortBy === 'price_desc' ? 'Price High-Low' : sortBy === 'popular' ? 'Popular' : undefined,
    },
  ];

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

        {/* Categories are now inside the Filters Drawer */}

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

        {/* ─── ACTIVE FILTERS BREADCRUMBS ─── */}
        {activeFiltersCount > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2, px: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mr: 0.5 }}>
              Active Filters:
            </Typography>
            
            {categoryType && (
              <Chip 
                label={PROPERTY_CATEGORIES.find(c => c.key === categoryType)?.title || categoryType} 
                size="small" 
                onDelete={() => { setCategoryType(''); setPropertyType(''); handleApplyFilters({ categoryType: '', propertyType: '' }); }} 
                sx={{ bgcolor: '#E0E7FF', color: '#1B4FD8', fontWeight: 650, '& .MuiChip-deleteIcon': { color: '#1B4FD8' } }}
              />
            )}
            
            {propertyType && (
              <Chip 
                label={activeSubcategories.find(c => c.key === propertyType)?.label.split('(')[0].trim() || propertyType} 
                size="small" 
                onDelete={() => { setPropertyType(''); handleApplyFilters({ propertyType: '' }); }} 
                sx={{ bgcolor: '#E0E7FF', color: '#1B4FD8', fontWeight: 650, '& .MuiChip-deleteIcon': { color: '#1B4FD8' } }}
              />
            )}
            
            {listingPurpose && (
              <Chip 
                label={listingPurpose === 'SALE' ? 'Buy / Sell' : listingPurpose === 'RENT' ? 'Rent' : listingPurpose === 'LEASE' ? 'Lease' : listingPurpose === 'PG' ? 'PG' : listingPurpose === 'COMMERCIAL_LEASE' ? 'Commercial Lease' : listingPurpose} 
                size="small" 
                onDelete={() => { setListingPurpose(''); handleApplyFilters({ listingPurpose: '' }); }} 
                sx={{ bgcolor: '#E0E7FF', color: '#1B4FD8', fontWeight: 650, '& .MuiChip-deleteIcon': { color: '#1B4FD8' } }}
              />
            )}
            
            {(minPrice || maxPrice) && (
              <Chip 
                label={`₹${formatPriceLabel(Number(minPrice) || 300000)} - ₹${formatPriceLabel(Number(maxPrice) || 10000000)}`} 
                size="small" 
                onDelete={() => { setMinPrice(''); setMaxPrice(''); handleApplyFilters({ minPrice: '', maxPrice: '' }); }} 
                sx={{ bgcolor: '#E0E7FF', color: '#1B4FD8', fontWeight: 650, '& .MuiChip-deleteIcon': { color: '#1B4FD8' } }}
              />
            )}

            {bedrooms && (
              <Chip 
                label={bedrooms === '4' ? '4+ BHK' : `${bedrooms} BHK`} 
                size="small" 
                onDelete={() => { setBedrooms(''); handleApplyFilters({ bedrooms: '' }); }} 
                sx={{ bgcolor: '#E0E7FF', color: '#1B4FD8', fontWeight: 650, '& .MuiChip-deleteIcon': { color: '#1B4FD8' } }}
              />
            )}
            
            {furnishedStatus && (
              <Chip 
                label={furnishedStatus === 'FURNISHED' ? 'Furnished' : furnishedStatus === 'SEMI_FURNISHED' ? 'Semi-Furnished' : 'Unfurnished'} 
                size="small" 
                onDelete={() => { setFurnishedStatus(''); handleApplyFilters({ furnishedStatus: '' }); }} 
                sx={{ bgcolor: '#E0E7FF', color: '#1B4FD8', fontWeight: 650, '& .MuiChip-deleteIcon': { color: '#1B4FD8' } }}
              />
            )}

            {(minArea || maxArea) && (
              <Chip 
                label={`Area: ${minArea || '0'} - ${maxArea || 'Any'} sq.ft`} 
                size="small" 
                onDelete={() => { setMinArea(''); setMaxArea(''); handleApplyFilters({ minArea: '', maxArea: '' }); }} 
                sx={{ bgcolor: '#E0E7FF', color: '#1B4FD8', fontWeight: 650, '& .MuiChip-deleteIcon': { color: '#1B4FD8' } }}
              />
            )}
            
            <Button 
              size="small" 
              sx={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, p: 0, minWidth: 'auto', ml: 1, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }} 
              onClick={handleClearFilters}
            >
              Reset All
            </Button>
          </Box>
        )}

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

      {/* ─── FLIPKART STYLE TWO-COLUMN ADVANCED FILTERS DRAWER ─── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 540, md: 620 },
            maxWidth: '100vw',
            height: '100vh',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        {/* Flipkart Style Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 1.5, sm: 2.5 },
            py: 1.5,
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setDrawerOpen(false)} size="small" sx={{ color: '#0F172A' }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={800} color="#0F172A" sx={{ fontSize: '1.05rem' }}>
              Filters
            </Typography>
            {activeFiltersCount > 0 && (
              <Chip
                size="small"
                label={`${activeFiltersCount} applied`}
                sx={{
                  bgcolor: '#E0E7FF',
                  color: '#1B4FD8',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 22,
                }}
              />
            )}
          </Box>

          {activeFiltersCount > 0 && (
            <Button
              size="small"
              onClick={handleClearFilters}
              sx={{
                color: '#EF4444',
                fontWeight: 700,
                fontSize: '0.8rem',
                textTransform: 'none',
                p: 0,
                minWidth: 'auto',
                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
              }}
            >
              Clear All
            </Button>
          )}
        </Box>

        {/* Two-Column Flipkart Body */}
        <Box sx={{ display: 'flex', flex: 1, height: 'calc(100vh - 125px)', overflow: 'hidden' }}>
          {/* Left Column: Filter Tabs / Categories */}
          <Box
            sx={{
              width: { xs: '38%', sm: '35%' },
              minWidth: { xs: 125, sm: 160 },
              maxWidth: { xs: 155, sm: 200 },
              bgcolor: '#F1F5F9',
              borderRight: '1px solid #E2E8F0',
              overflowY: 'auto',
              flexShrink: 0,
              '&::-webkit-scrollbar': { width: '3px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1' },
            }}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilterTab === tab.key;
              const hasVal = tab.hasValue;
              return (
                <Box
                  key={tab.key}
                  onClick={() => setActiveFilterTab(tab.key)}
                  sx={{
                    py: 1.5,
                    px: { xs: 1.2, sm: 2 },
                    cursor: 'pointer',
                    bgcolor: isActive ? '#FFFFFF' : 'transparent',
                    borderLeft: isActive ? '3.5px solid #1B4FD8' : '3.5px solid transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    borderBottom: '1px solid #E2E8F0',
                    '&:hover': {
                      bgcolor: isActive ? '#FFFFFF' : '#E2E8F0',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isActive ? 800 : 600,
                        fontSize: { xs: '0.78rem', sm: '0.84rem' },
                        color: isActive ? '#1B4FD8' : '#334155',
                        lineHeight: 1.2,
                      }}
                    >
                      {tab.label}
                    </Typography>
                    {hasVal && (
                      <Box
                        sx={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          bgcolor: '#1B4FD8',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Box>
                  {tab.preview && (
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{
                        fontSize: '0.68rem',
                        color: isActive ? '#64748B' : '#94A3B8',
                        mt: 0.3,
                        fontWeight: 500,
                      }}
                    >
                      {tab.preview}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Right Column: Selected Tab Options */}
          <Box
            sx={{
              flex: 1,
              bgcolor: '#FFFFFF',
              p: { xs: 1.5, sm: 2.5 },
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1' },
            }}
          >
            {/* TAB: CATEGORY */}
            {activeFilterTab === 'category' && (
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={1.5} fontSize="0.9rem">
                  Property Category
                </Typography>
                <Stack spacing={1}>
                  <Box
                    onClick={() => handleCategoryChange('')}
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      border: !categoryType ? '1.5px solid #1B4FD8' : '1px solid #E2E8F0',
                      bgcolor: !categoryType ? '#F0F4FF' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: !categoryType ? '#F0F4FF' : '#F8FAFC' },
                    }}
                  >
                    <Radio checked={!categoryType} size="small" sx={{ p: 0, mr: 1.2, color: '#1B4FD8', '&.Mui-checked': { color: '#1B4FD8' } }} />
                    <Typography fontWeight={!categoryType ? 750 : 600} fontSize="0.85rem" color={!categoryType ? '#1B4FD8' : '#0F172A'}>
                      All Categories
                    </Typography>
                  </Box>

                  {PROPERTY_CATEGORIES.map((cat) => {
                    const isCatSelected = categoryType === cat.key;
                    return (
                      <Box
                        key={cat.key}
                        onClick={() => handleCategoryChange(isCatSelected ? '' : cat.key)}
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          border: isCatSelected ? '1.5px solid #1B4FD8' : '1px solid #E2E8F0',
                          bgcolor: isCatSelected ? '#F0F4FF' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          '&:hover': { bgcolor: isCatSelected ? '#F0F4FF' : '#F8FAFC' },
                        }}
                      >
                        <Radio checked={isCatSelected} size="small" sx={{ p: 0, mr: 1.2, color: '#1B4FD8', '&.Mui-checked': { color: '#1B4FD8' } }} />
                        <Box sx={{ mr: 1, color: isCatSelected ? '#1B4FD8' : '#64748B', display: 'flex', alignItems: 'center' }}>
                          {CATEGORY_ICONS[cat.key]}
                        </Box>
                        <Box>
                          <Typography fontWeight={isCatSelected ? 750 : 600} fontSize="0.85rem" color={isCatSelected ? '#1B4FD8' : '#0F172A'}>
                            {cat.title}
                          </Typography>
                          <Typography variant="caption" color="#64748B" fontSize="0.7rem" display="block">
                            {cat.subtitle}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* TAB: SUBCATEGORY */}
            {activeFilterTab === 'subcategory' && (
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={1} fontSize="0.9rem">
                  {categoryType ? `${PROPERTY_CATEGORIES.find(c => c.key === categoryType)?.title} Subcategories` : 'All Subcategories'}
                </Typography>

                {/* Subcategory Search Input */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search subcategory..."
                  value={subcategorySearch}
                  onChange={(e) => setSubcategorySearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 1.5,
                    '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem', bgcolor: '#F8FAFC' },
                  }}
                />

                <Stack spacing={0.8}>
                  <Box
                    onClick={() => setPropertyType('')}
                    sx={{
                      p: 1.1,
                      borderRadius: 2,
                      border: !propertyType ? '1.5px solid #1B4FD8' : '1px solid #E2E8F0',
                      bgcolor: !propertyType ? '#F0F4FF' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: !propertyType ? '#F0F4FF' : '#F8FAFC' },
                    }}
                  >
                    <Radio checked={!propertyType} size="small" sx={{ p: 0, mr: 1.2, color: '#1B4FD8', '&.Mui-checked': { color: '#1B4FD8' } }} />
                    <Typography fontWeight={!propertyType ? 750 : 600} fontSize="0.84rem" color={!propertyType ? '#1B4FD8' : '#0F172A'}>
                      All Subcategories
                    </Typography>
                  </Box>

                  {/* Filter list */}
                  {(categoryType ? activeSubcategories : PROPERTY_TYPES)
                    .filter(sub => !subcategorySearch || sub.label.toLowerCase().includes(subcategorySearch.toLowerCase()))
                    .map((sub) => {
                      const isSubSelected = propertyType === sub.key;
                      return (
                        <Box
                          key={sub.key}
                          onClick={() => {
                            const newSub = isSubSelected ? '' : sub.key;
                            setPropertyType(newSub);
                            if (!categoryType && sub.category) {
                              setCategoryType(sub.category);
                            }
                          }}
                          sx={{
                            p: 1.1,
                            borderRadius: 2,
                            border: isSubSelected ? '1.5px solid #1B4FD8' : '1px solid #E2E8F0',
                            bgcolor: isSubSelected ? '#F0F4FF' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: isSubSelected ? '#F0F4FF' : '#F8FAFC' },
                          }}
                        >
                          <Radio checked={isSubSelected} size="small" sx={{ p: 0, mr: 1.2, color: '#1B4FD8', '&.Mui-checked': { color: '#1B4FD8' } }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography fontWeight={isSubSelected ? 750 : 600} fontSize="0.84rem" color={isSubSelected ? '#1B4FD8' : '#0F172A'}>
                              {sub.label}
                            </Typography>
                            {!categoryType && (
                              <Typography variant="caption" color="#64748B" fontSize="0.7rem">
                                {PROPERTY_CATEGORIES.find(c => c.key === sub.category)?.title}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                </Stack>
              </Box>
            )}

            {/* TAB: PURPOSE */}
            {activeFilterTab === 'purpose' && (
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={1.5} fontSize="0.9rem">
                  Listing Purpose
                </Typography>
                <Stack spacing={1}>
                  {[
                    { label: 'All Purposes', value: '', desc: 'Show all properties regardless of purpose' },
                    { label: 'Buy / Sell', value: 'SALE', desc: 'Properties available for sale or purchase' },
                    { label: 'Rent', value: 'RENT', desc: 'Properties available for monthly rent' },
                    { label: 'Lease', value: 'LEASE', desc: 'Long-term contractual lease properties' },
                    { label: 'PG Accommodation', value: 'PG', desc: 'Paying guest & room sharing listings' },
                    { label: 'Commercial Lease', value: 'COMMERCIAL_LEASE', desc: 'Commercial shops, offices, warehouses' },
                  ].map((p) => {
                    const isPurSelected = listingPurpose === p.value;
                    return (
                      <Box
                        key={p.value}
                        onClick={() => setListingPurpose(p.value)}
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          border: isPurSelected ? '1.5px solid #1B4FD8' : '1px solid #E2E8F0',
                          bgcolor: isPurSelected ? '#F0F4FF' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: isPurSelected ? '#F0F4FF' : '#F8FAFC' },
                        }}
                      >
                        <Radio checked={isPurSelected} size="small" sx={{ p: 0, mr: 1.2, color: '#1B4FD8', '&.Mui-checked': { color: '#1B4FD8' } }} />
                        <Box>
                          <Typography fontWeight={isPurSelected ? 750 : 600} fontSize="0.85rem" color={isPurSelected ? '#1B4FD8' : '#0F172A'}>
                            {p.label}
                          </Typography>
                          <Typography variant="caption" color="#64748B" fontSize="0.7rem" display="block">
                            {p.desc}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* TAB: BUDGET */}
            {activeFilterTab === 'budget' && (
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={1.5} fontSize="0.9rem">
                  Price & Budget Range
                </Typography>

                {/* Min / Max Dropdowns */}
                <Grid container spacing={1.5} mb={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" fontWeight={700} color="#475569" mb={0.5} display="block">
                      Min Price
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      displayEmpty
                      renderValue={(selected) => formatSelectLabel(selected, 'Min')}
                      sx={{ borderRadius: 2, fontSize: '0.82rem' }}
                    >
                      {BUDGET_OPTIONS_MIN.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" fontWeight={700} color="#475569" mb={0.5} display="block">
                      Max Price
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      displayEmpty
                      renderValue={(selected) => formatSelectLabel(selected, 'Max')}
                      sx={{ borderRadius: 2, fontSize: '0.82rem' }}
                    >
                      {BUDGET_OPTIONS_MAX.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </Grid>
                </Grid>

                {/* Slider */}
                <Box sx={{ px: 1, py: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0', mb: 2 }}>
                  <Typography variant="caption" fontWeight={700} color="#64748B" display="block" mb={0.5}>
                    Drag Slider to Adjust Budget:
                  </Typography>
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
                      '& .MuiSlider-thumb': { height: 16, width: 16, backgroundColor: '#FFFFFF', border: '2px solid #1B4FD8' },
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" color="#64748B" fontSize="0.7rem">₹3 Lac</Typography>
                    <Typography variant="caption" color="#64748B" fontSize="0.7rem">₹1 Cr+</Typography>
                  </Box>
                </Box>

                {/* Quick Presets */}
                <Typography variant="caption" fontWeight={700} color="#475569" mb={1} display="block">
                  Quick Budget Presets:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.8}>
                  {[
                    { label: 'Under ₹10 Lac', min: '', max: '1000000' },
                    { label: '₹10L - ₹25L', min: '1000000', max: '2500000' },
                    { label: '₹25L - ₹50L', min: '2500000', max: '5000000' },
                    { label: '₹50L - ₹1 Cr', min: '5000000', max: '10000000' },
                    { label: 'Above ₹1 Cr', min: '10000000', max: '' },
                  ].map((p) => {
                    const isPreset = minPrice === p.min && maxPrice === p.max;
                    return (
                      <Chip
                        key={p.label}
                        label={p.label}
                        size="small"
                        onClick={() => {
                          setMinPrice(p.min);
                          setMaxPrice(p.max);
                        }}
                        sx={{
                          fontWeight: 650,
                          fontSize: '0.74rem',
                          bgcolor: isPreset ? '#1B4FD8' : '#F1F5F9',
                          color: isPreset ? '#FFFFFF !important' : '#334155',
                          border: isPreset ? 'none' : '1px solid #CBD5E1',
                        }}
                      />
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* TAB: BEDROOMS */}
            {activeFilterTab === 'bedrooms' && (
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={1.5} fontSize="0.9rem">
                  Bedrooms (BHK)
                </Typography>
                <Stack spacing={1}>
                  {[
                    { label: 'Any BHK', value: '' },
                    { label: '1 BHK', value: '1' },
                    { label: '2 BHK', value: '2' },
                    { label: '3 BHK', value: '3' },
                    { label: '4+ BHK', value: '4' },
                  ].map((b) => {
                    const isBhkSelected = bedrooms === b.value;
                    return (
                      <Box
                        key={b.value}
                        onClick={() => setBedrooms(b.value)}
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          border: isBhkSelected ? '1.5px solid #1B4FD8' : '1px solid #E2E8F0',
                          bgcolor: isBhkSelected ? '#F0F4FF' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: isBhkSelected ? '#F0F4FF' : '#F8FAFC' },
                        }}
                      >
                        <Radio checked={isBhkSelected} size="small" sx={{ p: 0, mr: 1.2, color: '#1B4FD8', '&.Mui-checked': { color: '#1B4FD8' } }} />
                        <Typography fontWeight={isBhkSelected ? 750 : 600} fontSize="0.85rem" color={isBhkSelected ? '#1B4FD8' : '#0F172A'}>
                          {b.label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* TAB: FURNISHING */}
            {activeFilterTab === 'furnishing' && (
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={1.5} fontSize="0.9rem">
                  Furnishing Status
                </Typography>
                <Stack spacing={1}>
                  {[
                    { label: 'Any Furnishing Status', value: '' },
                    { label: 'Fully-Furnished', value: 'FULLY_FURNISHED' },
                    { label: 'Semi-Furnished', value: 'SEMI_FURNISHED' },
                    { label: 'Unfurnished', value: 'UNFURNISHED' },
                  ].map((f) => {
                    const isFurnSelected = furnishedStatus === f.value;
                    return (
                      <Box
                        key={f.value}
                        onClick={() => setFurnishedStatus(f.value)}
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          border: isFurnSelected ? '1.5px solid #1B4FD8' : '1px solid #E2E8F0',
                          bgcolor: isFurnSelected ? '#F0F4FF' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: isFurnSelected ? '#F0F4FF' : '#F8FAFC' },
                        }}
                      >
                        <Radio checked={isFurnSelected} size="small" sx={{ p: 0, mr: 1.2, color: '#1B4FD8', '&.Mui-checked': { color: '#1B4FD8' } }} />
                        <Typography fontWeight={isFurnSelected ? 750 : 600} fontSize="0.85rem" color={isFurnSelected ? '#1B4FD8' : '#0F172A'}>
                          {f.label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* TAB: AREA */}
            {activeFilterTab === 'area' && (
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={1.5} fontSize="0.9rem">
                  Area Range (Sq. Ft.)
                </Typography>

                <Grid container spacing={1.5} mb={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Min Area"
                      placeholder="e.g. 500"
                      value={minArea}
                      onChange={(e) => setMinArea(e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">sq.ft</InputAdornment> }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Max Area"
                      placeholder="e.g. 2000"
                      value={maxArea}
                      onChange={(e) => setMaxArea(e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">sq.ft</InputAdornment> }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' } }}
                    />
                  </Grid>
                </Grid>

                {/* Quick Area Presets */}
                <Typography variant="caption" fontWeight={700} color="#475569" mb={1} display="block">
                  Quick Area Presets:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.8}>
                  {[
                    { label: 'Under 500 sq.ft', min: '', max: '500' },
                    { label: '500 - 1,000 sq.ft', min: '500', max: '1000' },
                    { label: '1,000 - 1,500 sq.ft', min: '1000', max: '1500' },
                    { label: '1,500 - 2,500 sq.ft', min: '1500', max: '2500' },
                    { label: '2,500+ sq.ft', min: '2500', max: '' },
                  ].map((a) => {
                    const isAreaPreset = minArea === a.min && maxArea === a.max;
                    return (
                      <Chip
                        key={a.label}
                        label={a.label}
                        size="small"
                        onClick={() => {
                          setMinArea(a.min);
                          setMaxArea(a.max);
                        }}
                        sx={{
                          fontWeight: 650,
                          fontSize: '0.74rem',
                          bgcolor: isAreaPreset ? '#1B4FD8' : '#F1F5F9',
                          color: isAreaPreset ? '#FFFFFF !important' : '#334155',
                          border: isAreaPreset ? 'none' : '1px solid #CBD5E1',
                        }}
                      />
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* TAB: SORT BY */}
            {activeFilterTab === 'sortBy' && (
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={1.5} fontSize="0.9rem">
                  Sort Results By
                </Typography>
                <Stack spacing={1}>
                  {[
                    { label: 'Newest First (Default)', value: 'newest' },
                    { label: 'Price: Low to High', value: 'price_asc' },
                    { label: 'Price: High to Low', value: 'price_desc' },
                    { label: 'Area: Low to High', value: 'area_asc' },
                    { label: 'Area: High to Low', value: 'area_desc' },
                    { label: 'Most Popular', value: 'popular' },
                    { label: 'Oldest First', value: 'oldest' },
                  ].map((s) => {
                    const isSortSelected = sortBy === s.value || (!sortBy && s.value === 'newest');
                    return (
                      <Box
                        key={s.value}
                        onClick={() => setSortBy(s.value)}
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          border: isSortSelected ? '1.5px solid #1B4FD8' : '1px solid #E2E8F0',
                          bgcolor: isSortSelected ? '#F0F4FF' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: isSortSelected ? '#F0F4FF' : '#F8FAFC' },
                        }}
                      >
                        <Radio checked={isSortSelected} size="small" sx={{ p: 0, mr: 1.2, color: '#1B4FD8', '&.Mui-checked': { color: '#1B4FD8' } }} />
                        <Typography fontWeight={isSortSelected ? 750 : 600} fontSize="0.85rem" color={isSortSelected ? '#1B4FD8' : '#0F172A'}>
                          {s.label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Box>
        </Box>

        {/* Flipkart Style Footer */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 65,
            px: 2,
            bgcolor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
            zIndex: 10,
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', lineHeight: 1 }}>
              {activeFiltersCount > 0 ? `${activeFiltersCount} Filter${activeFiltersCount > 1 ? 's' : ''} Selected` : 'No Filters'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 800, fontSize: '0.85rem', mt: 0.3 }}>
              {properties.length} Properties Found
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeFiltersCount > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearFilters}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none',
                  color: '#64748B',
                  borderColor: '#CBD5E1',
                  px: 1.5,
                  py: 0.8,
                  fontSize: '0.82rem',
                  '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
                }}
              >
                Clear All
              </Button>
            )}
            <Button
              variant="contained"
              size="small"
              onClick={() => handleApplyFilters()}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                textTransform: 'none',
                bgcolor: '#1B4FD8',
                px: { xs: 2.5, sm: 3.5 },
                py: 0.9,
                fontSize: '0.85rem',
                boxShadow: '0 4px 12px rgba(27, 79, 216, 0.25)',
                '&:hover': { bgcolor: '#1541B5' },
              }}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
