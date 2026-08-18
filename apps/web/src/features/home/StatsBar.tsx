import { Box, Container, Grid, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import StarIcon from '@mui/icons-material/Star';

const stats = [
  { icon: <HomeIcon />, value: '5,000+', label: 'Properties Listed' },
  { icon: <PeopleIcon />, value: '12,000+', label: 'Happy Customers' },
  { icon: <BusinessIcon />, value: '50+', label: 'Projects Available' },
  { icon: <StarIcon />, value: '4.9★', label: 'Average Rating' },
];

export default function StatsBar() {
  return (
    <Box sx={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
      <Container maxWidth="lg">
        <Grid container>
          {stats.map((stat, i) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  py: { xs: 3, md: 4 },
                  px: 3,
                  borderRight: i < 3 ? '1px solid #E2E8F0' : 'none',
                  borderBottom: { xs: i < 2 ? '1px solid #E2E8F0' : 'none', md: 'none' },
                }}
              >
                <Box sx={{
                  color: '#1B4FD8',
                  background: 'rgba(27,79,216,0.08)',
                  borderRadius: 2, p: 1, display: 'flex',
                }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={800} color="text.primary">
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {stat.label}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
