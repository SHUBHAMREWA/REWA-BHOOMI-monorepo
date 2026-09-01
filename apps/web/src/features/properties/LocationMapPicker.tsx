'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Paper, InputAdornment, CircularProgress, Autocomplete } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(() => import('./InteractiveMap'), { ssr: false });

interface LocationMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  city: string;
  state: string;
  address?: string;
  pincode?: string;
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }) => void;
}

export default function LocationMapPicker({
  initialLat = 24.5362, // Default Rewa, MP coordinates
  initialLng = 81.3037,
  city,
  state,
  address,
  pincode,
  onLocationSelect,
}: LocationMapPickerProps) {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchReverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await res.json();
      if (data && data.address) {
        onLocationSelect({
          lat: latitude,
          lng: longitude,
          address: data.display_name,
          city: data.address.city || data.address.town || data.address.village || city,
          state: data.address.state || state,
          pincode: data.address.postcode || pincode,
        });
      } else {
        onLocationSelect({ lat: latitude, lng: longitude });
      }
    } catch (e) {
      console.error('Reverse geocoding error:', e);
      onLocationSelect({ lat: latitude, lng: longitude });
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          setLat(newLat);
          setLng(newLng);
          fetchReverseGeocode(newLat, newLng);
        },
        () => {
          // Fallback
        }
      );
    }
  };

  const handleMapChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    fetchReverseGeocode(newLat, newLng);
  };

  const [options, setOptions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Debounced search for Autocomplete
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setLoadingSuggestions(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5`);
          const data = await res.json();
          setOptions(data || []);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        setOptions([]);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchLocation = async () => {
    if (!searchQuery) return;
    try {
      // First try the raw searchQuery, fallback to appending city/state if no results
      let queryStr = searchQuery;
      let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}`);
      let data = await res.json();
      
      if (!data || data.length === 0) {
         queryStr = `${searchQuery}, ${city || 'Rewa'}, ${state || 'Madhya Pradesh'}, India`;
         res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}`);
         data = await res.json();
      }

      if (data && data.length > 0) {
        const first = data[0];
        const newLat = parseFloat(first.lat);
        const newLng = parseFloat(first.lon);
        setLat(newLat);
        setLng(newLng);
        onLocationSelect({
          lat: newLat,
          lng: newLng,
          address: first.display_name,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box sx={{ width: '100%', mt: { xs: 1.2, sm: 2 } }}>
      <Typography variant="subtitle2" fontWeight={600} mb={0.8} sx={{ fontSize: { xs: '0.82rem', sm: '0.9rem' } }}>
        Pinpoint Property Location on Map
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 0.8, mb: 1.5 }}>
        <Autocomplete
          freeSolo
          fullWidth
          size="small"
          options={options}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.display_name}
          filterOptions={(x) => x}
          inputValue={searchQuery}
          onInputChange={(event, newInputValue) => {
            setSearchQuery(newInputValue);
          }}
          onChange={(event, newValue) => {
            if (typeof newValue === 'object' && newValue !== null) {
              const newLat = parseFloat(newValue.lat);
              const newLng = parseFloat(newValue.lon);
              setLat(newLat);
              setLng(newLng);
              onLocationSelect({
                lat: newLat,
                lng: newLng,
                address: newValue.display_name,
              });
            } else if (typeof newValue === 'string') {
              handleSearchLocation();
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Search landmark, city (e.g., Lucknow)..."
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#94A3B8', fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {loadingSuggestions ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchLocation(); }}
            />
          )}
        />
        <Box sx={{ display: 'flex', gap: 0.8, flexShrink: 0 }}>
          <Button variant="contained" size="small" onClick={handleSearchLocation} sx={{ px: { xs: 1.5, sm: 3 }, height: { xs: 32, sm: 36 }, fontSize: { xs: '0.78rem', sm: '0.85rem' }, flex: { xs: 1, sm: 'auto' }, textTransform: 'none' }}>
            Search
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MyLocationIcon sx={{ fontSize: { xs: '0.95rem', sm: '1.15rem' } }} />}
            onClick={handleGetCurrentLocation}
            sx={{ textTransform: 'none', height: { xs: 32, sm: 36 }, fontSize: { xs: '0.78rem', sm: '0.85rem' }, flex: { xs: 1, sm: 'auto' }, whiteSpace: 'nowrap' }}
          >
            Use Current GPS
          </Button>
        </Box>
      </Box>

      {/* Embedded OpenStreetMap Leaflet Map */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', height: { xs: 220, sm: 320 }, position: 'relative' }}>
        {isClient ? (
          <InteractiveMap lat={lat} lng={lng} onChange={handleMapChange} />
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', color: '#64748B' }}>Loading Map...</Box>
        )}
      </Paper>

      {/* Coordinates Display Badge */}
      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Paper sx={{ px: 2, py: 0.75, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1.5 }}>
          <Typography variant="caption" sx={{ color: '#64748B' }}>Latitude: </Typography>
          <Typography variant="caption" fontWeight={700} color="text.primary">{Number(lat).toFixed(6)}</Typography>
        </Paper>
        <Paper sx={{ px: 2, py: 0.75, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1.5 }}>
          <Typography variant="caption" sx={{ color: '#64748B' }}>Longitude: </Typography>
          <Typography variant="caption" fontWeight={700} color="text.primary">{Number(lng).toFixed(6)}</Typography>
        </Paper>
        <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>
          ✓ Coordinates auto-saved
        </Typography>
      </Box>
    </Box>
  );
}


