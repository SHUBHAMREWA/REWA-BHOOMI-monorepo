'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Button } from '@mui/material';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PropertyCard, { PropertyCardData } from '@/features/properties/PropertyCard';
import { PropertyCardSkeleton } from './HomeSkeletons';
import {
  getCachedQuery,
  setCachedQuery,
  isHardRefreshOrReload,
} from '@/lib/propertyIndexedDb';

const CACHE_KEY = 'home_popular_properties';

export default function PopularProperties() {
  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPopularProperties() {
      try {
        // Check IndexedDB cache first unless hard refresh / reload
        if (!isHardRefreshOrReload()) {
          const cached = await getCachedQuery(CACHE_KEY);
          if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
            if (isMounted) {
              setProperties(cached.data);
              setLoading(false);
            }
            return;
          }
        }

        // Fetch fresh from backend (8 items)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
        const res = await fetch(
          `${apiUrl}/api/v1/properties?sortBy=views&limit=8&status=PUBLISHED`
        );
        if (!res.ok) {
          if (isMounted) setLoading(false);
          return;
        }

        const json = await res.json();
        const data: PropertyCardData[] = json.data?.data ?? [];

        if (isMounted) {
          setProperties(data);
          setLoading(false);
        }

        if (data.length > 0) {
          await setCachedQuery(CACHE_KEY, data, false, null);
        }
      } catch (err) {
        console.error('[PopularProperties] Fetch error:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadPopularProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && properties.length === 0) return null;

  return (
    <Box component="section" sx={{ py: { xs: 4, sm: 5, md: 7 }, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: { xs: 2.5, sm: 3, md: 4 }, flexWrap: 'nowrap', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#166534', mb: 0.3 }}>
              <TrendingUpIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: { xs: '0.68rem', sm: '0.75rem' } }}>
                High Demand
              </Typography>
            </Box>
            <Typography variant="h2" noWrap sx={{ fontSize: { xs: '1.18rem', sm: '1.75rem', md: '2.25rem' }, fontWeight: 850, color: '#0F172A' }}>
              Explore Popular Properties
            </Typography>
          </Box>
          <Button
            variant="contained"
            component={Link}
            href="/properties?sortBy=popular"
            endIcon={<ArrowForwardIcon sx={{ fontSize: { xs: '0.95rem', sm: '1.15rem' } }} />}
            sx={{
              fontWeight: 750,
              bgcolor: '#1B4FD8',
              color: '#FFFFFF',
              textTransform: 'none',
              fontSize: { xs: '0.78rem', sm: '0.88rem' },
              whiteSpace: 'nowrap',
              flexShrink: 0,
              minWidth: 'fit-content',
              px: { xs: 1.6, sm: 2.2 },
              py: { xs: 0.6, sm: 0.75 },
              borderRadius: '20px',
              boxShadow: '0 4px 12px rgba(27, 79, 216, 0.3)',
              '&:hover': {
                bgcolor: '#1338A8',
                boxShadow: '0 6px 16px rgba(27, 79, 216, 0.4)',
              },
            }}
          >
            View Popular
          </Button>
        </Box>

        {loading ? (
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Grid item xs={6} sm={6} md={3} key={i}>
                <PropertyCardSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
            {properties.map((property) => (
              <Grid item xs={6} sm={6} md={3} key={property.id}>
                <PropertyCard property={property} viewMode="grid" />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
