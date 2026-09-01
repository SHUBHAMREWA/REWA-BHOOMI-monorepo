import { Box, Container, Grid, Typography, Button } from '@mui/material';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PropertyCard, { PropertyCardData } from '@/features/properties/PropertyCard';
import { PropertyCardSkeleton } from './HomeSkeletons';


async function fetchFeaturedProperties(): Promise<PropertyCardData[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const res = await fetch(
      `${apiUrl}/api/v1/properties?sortBy=popular&limit=6&status=PUBLISHED`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.data ?? [];
  } catch {
    return [];
  }
}

export default async function FeaturedProperties() {
  const properties = await fetchFeaturedProperties();

  return (
    <Box component="section" sx={{ pt: { xs: 2, sm: 2.5, md: 3.5 }, pb: { xs: 5, md: 8 }, bgcolor: '#FFFFFF' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: { xs: 2.5, sm: 3, md: 4 }, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Top Picks
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 800, mt: 0.5 }}>
              Featured Properties
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/properties"
            endIcon={<ArrowForwardIcon />}
            sx={{ fontWeight: 600 }}
          >
            View All
          </Button>
        </Box>

        {properties.length === 0 ? (
          <Grid container spacing={{ xs: 1.2, sm: 2, md: 3 }}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={6} sm={6} md={4} key={i}>
                <PropertyCardSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={{ xs: 1.2, sm: 2, md: 3 }}>
            {properties.map((property) => (
              <Grid item xs={6} sm={6} md={4} key={property.id}>
                <PropertyCard property={property} viewMode="grid" />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Explore All Properties Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3.5, sm: 4.5, md: 5 } }}>
          <Button
            component={Link}
            href="/properties"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{
              bgcolor: '#1B4FD8',
              color: '#FFFFFF',
              px: { xs: 3.5, sm: 4.5 },
              py: { xs: 1.1, sm: 1.3 },
              borderRadius: '28px',
              fontSize: { xs: '0.88rem', sm: '0.96rem' },
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 4px 16px rgba(27, 79, 216, 0.28)',
              transition: 'all 0.25s ease-in-out',
              '&:hover': {
                bgcolor: '#1338A8',
                boxShadow: '0 6px 22px rgba(27, 79, 216, 0.4)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Explore All Properties
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
