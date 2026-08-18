'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Container, Grid, Typography, Button, TextField, Select, MenuItem, Skeleton, ToggleButton, ToggleButtonGroup, Slider, Paper } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import PropertyCard, { PropertyCardData } from './PropertyCard';
import { apiGet } from '@/lib/api';

const BUDGET_OPTIONS_MIN = [
  { label: 'Min', value: '' },
  { label: '₹ 5 Lac', value: '500000' },
  { label: '₹ 10 Lac', value: '1000000' },
  { label: '₹ 20 Lac', value: '2000000' },
  { label: '₹ 50 Lac', value: '5000000' },
  { label: '₹ 1 Cr', value: '10000000' },
];

const BUDGET_OPTIONS_MAX = [
  { label: 'Max', value: '' },
  { label: '₹ 10 Lac', value: '1000000' },
  { label: '₹ 25 Lac', value: '2500000' },
  { label: '₹ 50 Lac', value: '5000000' },
  { label: '₹ 1 Cr', value: '10000000' },
  { label: '₹ 5 Cr', value: '50000000' },
];

function formatPriceLabel(val: number): string {
  if (val === 0) return 'Min';
  if (val >= 50000000) return 'Max (₹5Cr+)';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)}Lac`;
  return `₹${val.toLocaleString('en-IN')}`;
}

function formatSelectLabel(selected?: string | null, defaultLabel = 'Min'): string {
  if (!selected || selected === '' || selected === '0') return defaultLabel;
  const num = Number(selected);
  if (isNaN(num)) return selected;
  if (num >= 50000000 && defaultLabel === 'Max') return 'Max';
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

  // Filters state
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [listingType, setListingType] = useState(searchParams.get('listingType') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const keywordInputRef = useRef<HTMLInputElement | null>(null);

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

      setProperties(prev => reset ? data.data : [...prev, ...data.data]);
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

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (city) params.set('city', city);
    if (listingType) params.set('listingType', listingType);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 3.8, sm: 8.5 }, pb: { xs: 8, sm: 8 }, bgcolor: '#F8FAFC' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 } }}>
        
        {/* Search Header */}
        <Box sx={{ mb: { xs: 0.8, sm: 2 } }}>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#0F172A', fontSize: { xs: '1.15rem', sm: '2rem' } }}>
            Properties & Plots for Sale in {city || 'Rewa'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.4, fontSize: { xs: '0.78rem', sm: '0.95rem' }, color: '#64748B', display: { xs: 'none', sm: 'block' } }}>
            Rewa mein Plot, Property, Ghar, Rent par Makan aur Dukaan aasani se khojiye. Apni zarurat ke hisaab se search karein, property pasand aaye toh contact karein.
          </Typography>
        </Box>

        {/* Filters Bar (Types + Filter button) */}
        <Box
          className="glass"
          sx={{
            p: { xs: 1, sm: 1.8 },
            borderRadius: { xs: 2, sm: 3 },
            mb: { xs: 1.2, sm: 2 },
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            justify: 'space-between',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'center', minWidth: 180, flexWrap: 'wrap' }}>
            <TextField
              inputRef={keywordInputRef}
              size="small"
              placeholder="Search by keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyFilters();
              }}
              sx={{ flex: 1, minWidth: { xs: 140, sm: 200 }, bgcolor: 'white', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Select
              size="small"
              displayEmpty
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              sx={{ minWidth: { xs: 110, sm: 150 }, bgcolor: 'white', borderRadius: 2, '& .MuiSelect-select': { py: { xs: 0.5, sm: 0.8 }, px: 1.2, fontSize: { xs: '0.82rem', sm: '0.9rem' } } }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="SELL">Buy</MenuItem>
              <MenuItem value="RENT">Rent</MenuItem>
              <MenuItem value="LEASE">Lease</MenuItem>
            </Select>
            <Button
              variant="contained"
              startIcon={<FilterListIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
              onClick={handleApplyFilters}
              sx={{ py: { xs: 0.5, sm: 1 }, px: { xs: 2, sm: 3 }, borderRadius: 2, bgcolor: '#1B4FD8', fontWeight: 700, fontSize: { xs: '0.82rem', sm: '0.9rem' } }}
            >
              Filter
            </Button>
          </Box>
        </Box>

        {/* ─── BUDGET RANGE FILTER BANNER (Compact for mobile) ─── */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: '#EAEAEA',
            borderRadius: { xs: '12px', sm: '16px' },
            p: { xs: 1.2, sm: 2.5 },
            mb: { xs: 1.5, sm: 3 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justify: 'space-between',
            gap: { xs: 1, md: 2 },
          }}
        >
          {/* Left Title in Hinglish */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#333333',
              fontSize: { xs: '0.85rem', sm: '1.2rem' },
              minWidth: { xs: 'auto', md: 200 },
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            Apna budget range set karein
          </Typography>

          {/* Center Dropdowns & Dual Slider Bar */}
          <Box sx={{ flex: 1, width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
            {/* Dropdowns row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Select
                size="small"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                displayEmpty
                renderValue={(selected) => formatSelectLabel(selected, 'Min')}
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: '8px',
                  minWidth: { xs: 85, sm: 110 },
                  fontSize: { xs: '0.78rem', sm: '0.88rem' },
                  fontWeight: 600,
                  color: '#0F172A',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF8A8A',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF5252',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF1744',
                  },
                  '& .MuiSelect-select': { py: { xs: 0.3, sm: 0.6 }, px: { xs: 1, sm: 1.5 } },
                }}
              >
                {BUDGET_OPTIONS_MIN.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>

              <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, fontSize: { xs: '0.78rem', sm: '0.88rem' } }}>
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
                  borderRadius: '8px',
                  minWidth: { xs: 85, sm: 110 },
                  fontSize: { xs: '0.78rem', sm: '0.88rem' },
                  fontWeight: 600,
                  color: '#0F172A',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF8A8A',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF5252',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF1744',
                  },
                  '& .MuiSelect-select': { py: { xs: 0.3, sm: 0.6 }, px: { xs: 1, sm: 1.5 } },
                }}
              >
                {BUDGET_OPTIONS_MAX.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </Box>

            {/* Dual Thumb Slider matching reference green bar */}
            <Box sx={{ width: { xs: '92%', sm: '88%' }, px: 1, pt: { xs: 1.2, sm: 2 } }}>
              <Slider
                value={[Number(minPrice) || 0, Number(maxPrice) || 50000000]}
                min={0}
                max={50000000}
                step={500000}
                valueLabelDisplay="on"
                valueLabelFormat={formatPriceLabel}
                onChange={(_, val) => {
                  if (Array.isArray(val)) {
                    setMinPrice(val[0] === 0 ? '' : String(val[0]));
                    setMaxPrice(val[1] === 50000000 ? '' : String(val[1]));
                  }
                }}
                sx={{
                  color: '#00B5AD',
                  height: { xs: 4, sm: 5 },
                  '& .MuiSlider-valueLabel': {
                    bgcolor: '#0F172A',
                    color: '#FFFFFF',
                    fontSize: { xs: '0.65rem', sm: '0.72rem' },
                    fontWeight: 700,
                    borderRadius: '4px',
                    py: 0.1,
                    px: 0.6,
                    top: -4,
                    '& *': {
                      background: 'transparent',
                      color: '#FFFFFF',
                    },
                  },
                  '& .MuiSlider-track': {
                    border: 'none',
                    bgcolor: '#00B5AD',
                  },
                  '& .MuiSlider-thumb': {
                    height: { xs: 16, sm: 20 },
                    width: { xs: 16, sm: 20 },
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #00B5AD',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 6px rgba(0, 181, 173, 0.2)',
                    },
                  },
                  '& .MuiSlider-rail': {
                    opacity: 0.35,
                    bgcolor: '#94A3B8',
                  },
                }}
              />
            </Box>
          </Box>

          {/* Right Apply Button */}
          <Button
            variant="contained"
            onClick={handleApplyFilters}
            sx={{
              bgcolor: '#272727',
              color: '#FFFFFF',
              borderRadius: '24px',
              px: { xs: 2.5, sm: 3.5 },
              py: { xs: 0.4, sm: 0.9 },
              fontWeight: 700,
              fontSize: { xs: '0.78rem', sm: '0.88rem' },
              textTransform: 'none',
              boxShadow: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: '#000000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          >
            Apply Budget
          </Button>
        </Paper>

        {/* Results Count Bar & View Switcher (below Budget Range) */}
        {!loading && (() => {
          const hasFilter = Boolean(keyword || city || listingType || minPrice || maxPrice);
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

              {/* View Mode Switcher: List vs Grid */}
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
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => router.push('/properties')}>
              Clear Filters
            </Button>
          </Box>
        ) : (
          <>
            {/* List View vs Grid View Layout */}
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
    </Box>
  );
}
