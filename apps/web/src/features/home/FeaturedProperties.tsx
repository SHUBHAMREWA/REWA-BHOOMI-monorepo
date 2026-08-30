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
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#1B4FD8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <PropertyCardSkeleton />
              </Grid>
            ))}
          </Grid>

        ) : (
          <Grid container spacing={3}>
            {properties.map((property) => (
              <Grid item xs={12} sm={6} md={4} key={property.id}>
                <PropertyCard property={property} viewMode="grid" />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
