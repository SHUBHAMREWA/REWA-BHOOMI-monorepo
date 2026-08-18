'use client';

import { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import WarningIcon from '@mui/icons-material/Warning';
import BusinessIcon from '@mui/icons-material/Business';
import { apiGet } from '@/lib/api';

interface Stats {
  totalUsers: number;
  totalProperties: number;
  pendingProperties: number;
  activeProjects: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await apiGet<Stats>('/admin/stats');
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: <PeopleIcon sx={{ fontSize: 40 }} />, color: '#3B82F6', bg: '#EFF6FF' },
    { title: 'Total Properties', value: stats?.totalProperties || 0, icon: <HomeWorkIcon sx={{ fontSize: 40 }} />, color: '#10B981', bg: '#ECFDF5' },
    { title: 'Pending Review', value: stats?.pendingProperties || 0, icon: <WarningIcon sx={{ fontSize: 40 }} />, color: '#F59E0B', bg: '#FFFBEB' },
    { title: 'Active Projects', value: stats?.activeProjects || 0, icon: <BusinessIcon sx={{ fontSize: 40 }} />, color: '#8B5CF6', bg: '#F5F3FF' },
  ];

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} mb={4}>Dashboard Overview</Typography>

      <Grid container spacing={3}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3, border: '1px solid #E2E8F0' }}>
              <Box sx={{ bgcolor: stat.bg, color: stat.color, p: 1.5, borderRadius: 3, display: 'flex' }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                  {stat.title}
                </Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary">
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 5 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #E2E8F0', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.disabled">Chart Visualization Placeholder (Phase 5/6)</Typography>
        </Paper>
      </Box>
    </Box>
  );
}
