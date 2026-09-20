import { Box, Container, Grid, Typography, Button } from '@mui/material';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PropertyCard, { PropertyCardData } from '@/features/properties/PropertyCard';

async function fetchPopularProperties(): Promise<PropertyCardData[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const res = await fetch(
      `${apiUrl}/api/v1/properties?sortBy=views&limit=4&status=PUBLISHED`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.data ?? [];
  } catch {
    return [];
  }
}

export default async function PopularProperties() {
  const properties = await fetchPopularProperties();

  if (properties.length === 0) return null;

  return (
    <Box component="section" sx={{ py: { xs: 4, sm: 5, md: 7 }, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: { xs: 2.5, sm: 3, md: 4 }, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#166534', mb: 0.3 }}>
              <TrendingUpIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                High Demand
              </Typography>
            </Box>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.25rem' }, fontWeight: 850, color: '#0F172A' }}>
              Explore Popular Properties
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/properties?sortBy=popular"
            endIcon={<ArrowForwardIcon />}
            sx={{ fontWeight: 700, color: '#1B4FD8', textTransform: 'none', fontSize: { xs: '0.84rem', sm: '0.92rem' } }}
          >
            View Popular
          </Button>
        </Box>

        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {properties.map((property) => (
            <Grid item xs={6} sm={6} md={3} key={property.id}>
              <PropertyCard property={property} viewMode="grid" />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
