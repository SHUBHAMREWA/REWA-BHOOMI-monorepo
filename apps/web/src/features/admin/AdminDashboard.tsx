'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box, Grid, Paper, Typography, CircularProgress, Button, Chip,
  Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip as MuiTooltip, useTheme
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import WarningIcon from '@mui/icons-material/Warning';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArticleIcon from '@mui/icons-material/Article';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PieChartIcon from '@mui/icons-material/PieChart';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { format } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { apiGet } from '@/lib/api';

interface GrowthPoint {
  label: string;
  key: string;
  properties: number;
  users: number;
}

interface StatusItem {
  status: string;
  count: number;
}

interface PurposeItem {
  purpose: string;
  count: number;
}

interface CategoryItem {
  category: string;
  count: number;
}

interface LocalityItem {
  name: string;
  count: number;
}

interface RecentProperty {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number | null;
  city: string;
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
  is_verified: boolean;
}

interface DashboardData {
  totalUsers: number;
  totalProperties: number;
  pendingProperties: number;
  publishedProperties: number;
  rejectedProperties: number;
  soldProperties: number;
  activeProjects: number;
  totalBlogs: number;
  statusDistribution: StatusItem[];
  purposeDistribution: PurposeItem[];
  categoryDistribution: CategoryItem[];
  growthTrends: GrowthPoint[];
  topLocalities: LocalityItem[];
  recentProperties: RecentProperty[];
  recentUsers: RecentUser[];
}

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: '#10B981',
  PENDING_REVIEW: '#F59E0B',
  REJECTED: '#EF4444',
  SOLD: '#3B82F6',
  DRAFT: '#94A3B8',
  RENTED: '#8B5CF6',
  ARCHIVED: '#64748B',
};

const PURPOSE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export default function AdminDashboard() {
  const theme = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await apiGet<DashboardData>('/admin/stats');
      setData(res);
    } catch (error) {
      console.error('Failed to fetch admin stats', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: { xs: 8, sm: 15 } }}>
        <CircularProgress size={42} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Loading dashboard analytics...
        </Typography>
      </Box>
    );
  }

  const primaryCards = [
    {
      title: 'Total Users',
      value: data?.totalUsers || 0,
      icon: <PeopleIcon sx={{ fontSize: { xs: 18, sm: 24, md: 26 } }} />,
      color: '#3B82F6',
      bg: '#EFF6FF',
      href: '/admin/users',
      subtext: 'Registered accounts',
    },
    {
      title: 'Total Properties',
      value: data?.totalProperties || 0,
      icon: <HomeWorkIcon sx={{ fontSize: { xs: 18, sm: 24, md: 26 } }} />,
      color: '#10B981',
      bg: '#ECFDF5',
      href: '/admin/properties',
      subtext: `${data?.publishedProperties || 0} active`,
    },
    {
      title: 'Pending Review',
      value: data?.pendingProperties || 0,
      icon: <WarningIcon sx={{ fontSize: { xs: 18, sm: 24, md: 26 } }} />,
      color: '#F59E0B',
      bg: '#FFFBEB',
      href: '/admin/properties',
      subtext: (data?.pendingProperties || 0) > 0 ? 'Action needed' : 'All clear',
      highlight: (data?.pendingProperties || 0) > 0,
    },
    {
      title: 'Active Projects',
      value: data?.activeProjects || 0,
      icon: <BusinessIcon sx={{ fontSize: { xs: 18, sm: 24, md: 26 } }} />,
      color: '#8B5CF6',
      bg: '#F5F3FF',
      href: '/admin/projects',
      subtext: 'Townships & colonies',
    },
    {
      title: 'Sold / Closed',
      value: data?.soldProperties || 0,
      icon: <MonetizationOnIcon sx={{ fontSize: { xs: 18, sm: 24, md: 26 } }} />,
      color: '#0284C7',
      bg: '#F0F9FF',
      href: '/admin/properties',
      subtext: 'Deals completed',
    },
    {
      title: 'Published Blogs',
      value: data?.totalBlogs || 0,
      icon: <ArticleIcon sx={{ fontSize: { xs: 18, sm: 24, md: 26 } }} />,
      color: '#EC4899',
      bg: '#FDF2F8',
      href: '/admin/blogs',
      subtext: 'Articles & guides',
    },
  ];

  // Prepare Status Pie Data
  const statusPieData = (data?.statusDistribution || []).map((item) => ({
    name: item.status.replace('_', ' '),
    value: item.count,
    color: STATUS_COLORS[item.status] || '#94A3B8',
  }));

  const totalPropCount = data?.totalProperties || 1;
  const publishedPct = Math.round(((data?.publishedProperties || 0) / totalPropCount) * 100);
  const pendingPct = Math.round(((data?.pendingProperties || 0) / totalPropCount) * 100);
  const soldPct = Math.round(((data?.soldProperties || 0) / totalPropCount) * 100);
  const rejectedPct = Math.round(((data?.rejectedProperties || 0) / totalPropCount) * 100);

  return (
    <Box sx={{ pb: { xs: 3, sm: 6 } }}>
      {/* Top Header - Compact on Mobile */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: { xs: 2, sm: 3.5 }, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0F172A" sx={{ fontSize: { xs: '1.25rem', sm: '1.65rem', md: '2rem' } }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: { xs: '0.72rem', sm: '0.85rem' } }}>
            Real-time analytics, property listings moderation & users across Rewa.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            startIcon={refreshing ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
            sx={{
              flex: { xs: 1, sm: 'none' },
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 600,
              color: '#475569',
              borderColor: '#CBD5E1',
              py: { xs: 0.6, sm: 0.8 },
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            component={Link}
            href="/admin/properties"
            size="small"
            sx={{
              flex: { xs: 1, sm: 'none' },
              bgcolor: '#1B4FD8',
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 700,
              py: { xs: 0.6, sm: 0.8 },
              px: { xs: 1.5, sm: 2.5 },
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
            }}
          >
            Moderate
          </Button>
        </Box>
      </Box>

      {/* KPI Cards Grid: 2 Columns on Mobile (xs={6}) for Compact Information Density */}
      <Grid container spacing={{ xs: 1.25, sm: 2, md: 2.5 }}>
        {primaryCards.map((card) => (
          <Grid item xs={6} sm={4} md={4} lg={2} key={card.title}>
            <Paper
              elevation={0}
              component={Link}
              href={card.href}
              sx={{
                p: { xs: 1.25, sm: 1.75, md: 2.25 },
                borderRadius: { xs: 2.5, sm: 3.5 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: card.highlight ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: card.highlight ? '0 3px 14px rgba(245, 158, 11, 0.12)' : '0 2px 8px rgba(0,0,0,0.02)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                height: '100%',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
                  borderColor: card.color,
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1, sm: 1.25 } }}>
                <Box sx={{ bgcolor: card.bg, color: card.color, p: { xs: 0.7, sm: 1 }, borderRadius: { xs: 1.75, sm: 2 }, display: 'flex' }}>
                  {card.icon}
                </Box>
                {card.highlight && (
                  <Chip
                    label="Alert"
                    size="small"
                    sx={{
                      bgcolor: '#FEF3C7',
                      color: '#B45309',
                      fontWeight: 800,
                      fontSize: { xs: '0.58rem', sm: '0.65rem' },
                      height: { xs: 18, sm: 20 },
                      px: { xs: 0.25, sm: 0.5 },
                    }}
                  />
                )}
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={850} color="#0F172A" sx={{ fontSize: { xs: '1.25rem', sm: '1.6rem', md: '1.85rem' }, lineHeight: 1.1 }}>
                  {card.value}
                </Typography>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color="#334155"
                  noWrap
                  sx={{ mt: 0.5, fontSize: { xs: '0.72rem', sm: '0.8rem', md: '0.875rem' } }}
                  title={card.title}
                >
                  {card.title}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    mt: 0.25,
                    fontSize: { xs: '0.62rem', sm: '0.7rem' },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={card.subtext}
                >
                  {card.subtext}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Compact Moderation Status Health Strip */}
      <Paper
        elevation={0}
        sx={{
          mt: { xs: 1.5, sm: 2.5 },
          p: { xs: 1.25, sm: 2 },
          borderRadius: { xs: 2.5, sm: 3 },
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <AnalyticsIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#1B4FD8' }} />
            <Typography variant="subtitle2" fontWeight={750} color="#0F172A" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Inventory Health Ratio
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.68rem', sm: '0.75rem' } }}>
            {data?.totalProperties || 0} Total Properties Listed
          </Typography>
        </Box>

        {/* Multi-segmented Progress Bar */}
        <Box sx={{ width: '100%', height: { xs: 6, sm: 8 }, bgcolor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
          <Box sx={{ width: `${publishedPct}%`, bgcolor: '#10B981', transition: 'width 0.3s' }} title={`Published: ${publishedPct}%`} />
          <Box sx={{ width: `${pendingPct}%`, bgcolor: '#F59E0B', transition: 'width 0.3s' }} title={`Pending: ${pendingPct}%`} />
          <Box sx={{ width: `${soldPct}%`, bgcolor: '#3B82F6', transition: 'width 0.3s' }} title={`Sold: ${soldPct}%`} />
          <Box sx={{ width: `${rejectedPct}%`, bgcolor: '#EF4444', transition: 'width 0.3s' }} title={`Rejected: ${rejectedPct}%`} />
        </Box>

        {/* Legend / Metrics */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.2, sm: 2.5 }, mt: 1.2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
            <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#334155', fontWeight: 600 }}>
              Published: <strong>{data?.publishedProperties || 0}</strong> ({publishedPct}%)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
            <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#334155', fontWeight: 600 }}>
              Pending: <strong>{data?.pendingProperties || 0}</strong> ({pendingPct}%)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3B82F6' }} />
            <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#334155', fontWeight: 600 }}>
              Sold: <strong>{data?.soldProperties || 0}</strong> ({soldPct}%)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
            <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#334155', fontWeight: 600 }}>
              Rejected: <strong>{data?.rejectedProperties || 0}</strong> ({rejectedPct}%)
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Visualizations Section */}
      <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }} sx={{ mt: { xs: 0.5, sm: 1 } }}>
        {/* Growth Trend Area Chart (6 Months) */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5, md: 3 },
              borderRadius: { xs: 2.5, sm: 3.5, md: 4 },
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 1.5, sm: 2.5 }, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ bgcolor: '#EFF6FF', color: '#1B4FD8', p: { xs: 0.6, sm: 1 }, borderRadius: 1.75, display: 'flex' }}>
                  <TrendingUpIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={750} color="#0F172A" sx={{ fontSize: { xs: '0.88rem', sm: '1.05rem', md: '1.15rem' } }}>
                    Platform Growth Trends
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block' }}>
                    Monthly new property listings vs user registrations
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#1B4FD8' }} />
                  <Typography variant="caption" fontWeight={600} color="#475569" sx={{ fontSize: { xs: '0.68rem', sm: '0.75rem' } }}>Properties</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10B981' }} />
                  <Typography variant="caption" fontWeight={600} color="#475569" sx={{ fontSize: { xs: '0.68rem', sm: '0.75rem' } }}>Users</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ width: '100%', height: { xs: 210, sm: 260, md: 300 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.growthTrends || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B4FD8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1B4FD8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: 8, border: 'none', color: '#FFFFFF', fontSize: '12px', padding: '6px 10px' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Area type="monotone" dataKey="properties" name="Properties" stroke="#1B4FD8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProp)" />
                  <Area type="monotone" dataKey="users" name="Users" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUser)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Status Distribution Donut Chart */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5, md: 3 },
              borderRadius: { xs: 2.5, sm: 3.5, md: 4 },
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box sx={{ bgcolor: '#ECFDF5', color: '#10B981', p: { xs: 0.6, sm: 1 }, borderRadius: 1.75, display: 'flex' }}>
                <PieChartIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={750} color="#0F172A" sx={{ fontSize: { xs: '0.88rem', sm: '1.05rem', md: '1.15rem' } }}>
                  Status Breakdown
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Current moderation distribution
                </Typography>
              </Box>
            </Box>

            {statusPieData.length === 0 ? (
              <Box sx={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.disabled" sx={{ fontSize: '0.8rem' }}>No data</Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: { xs: 180, sm: 210, md: 230 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: 8, border: 'none', color: '#FFFFFF', fontSize: '12px', padding: '6px 10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Custom Legend */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.75, sm: 1.25 }, justifyContent: 'center', mt: 0.5 }}>
              {statusPieData.map((item) => (
                <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                  <Typography variant="caption" fontWeight={600} color="#334155" sx={{ fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>
                    {item.name}: <strong style={{ color: '#0F172A' }}>{item.value}</strong>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Top Property Categories Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5, md: 3 },
              borderRadius: { xs: 2.5, sm: 3.5, md: 4 },
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ bgcolor: '#F0F9FF', color: '#0284C7', p: { xs: 0.6, sm: 1 }, borderRadius: 1.75, display: 'flex' }}>
                <CategoryIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={750} color="#0F172A" sx={{ fontSize: { xs: '0.88rem', sm: '1.05rem', md: '1.15rem' } }}>
                  Top Categories
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Listing distribution by property category
                </Typography>
              </Box>
            </Box>

            <Box sx={{ width: '100%', height: { xs: 190, sm: 230, md: 250 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.categoryDistribution || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="category" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: 8, border: 'none', color: '#FFFFFF', fontSize: '12px', padding: '6px 10px' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Bar dataKey="count" name="Listings" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Top Localities in Rewa */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5, md: 3 },
              borderRadius: { xs: 2.5, sm: 3.5, md: 4 },
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ bgcolor: '#FEF3C7', color: '#B45309', p: { xs: 0.6, sm: 1 }, borderRadius: 1.75, display: 'flex' }}>
                <LocationOnIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={750} color="#0F172A" sx={{ fontSize: { xs: '0.88rem', sm: '1.05rem', md: '1.15rem' } }}>
                  Top Localities in Rewa
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Localities with highest listing volume
                </Typography>
              </Box>
            </Box>

            <Box sx={{ width: '100%', height: { xs: 190, sm: 230, md: 250 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.topLocalities || []}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} tickLine={false} width={75} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: 8, border: 'none', color: '#FFFFFF', fontSize: '12px', padding: '6px 10px' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Bar dataKey="count" name="Properties" fill="#10B981" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity Section */}
      <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }} sx={{ mt: { xs: 0.5, sm: 1 } }}>
        {/* Recent Property Submissions: Adaptive Table (Desktop) & Cards (Mobile) */}
        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5, md: 3 },
              borderRadius: { xs: 2.5, sm: 3.5, md: 4 },
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
              <Box>
                <Typography variant="h6" fontWeight={750} color="#0F172A" sx={{ fontSize: { xs: '0.88rem', sm: '1.05rem', md: '1.15rem' } }}>
                  Recent Property Submissions
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Latest properties submitted by owners
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/admin/properties"
                endIcon={<ArrowForwardIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                size="small"
                sx={{ textTransform: 'none', fontWeight: 700, color: '#1B4FD8', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}
              >
                View All
              </Button>
            </Box>

            {/* Mobile View: Clean Card List */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
              {(!data?.recentProperties || data.recentProperties.length === 0) ? (
                <Typography variant="body2" color="text.disabled" textAlign="center" py={3} sx={{ fontSize: '0.8rem' }}>
                  No recent properties
                </Typography>
              ) : (
                data.recentProperties.map((prop) => {
                  const color = STATUS_COLORS[prop.status] || '#94A3B8';
                  return (
                    <Box
                      key={prop.id}
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        border: '1px solid #F1F5F9',
                        bgcolor: '#F8FAFC',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <Typography
                          component={Link}
                          href={`/property/${prop.slug}`}
                          variant="body2"
                          fontWeight={700}
                          color="#0F172A"
                          sx={{
                            textDecoration: 'none',
                            fontSize: '0.82rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            '&:hover': { color: '#1B4FD8' }
                          }}
                        >
                          {prop.title}
                        </Typography>
                        <Chip
                          label={prop.status.replace('_', ' ')}
                          size="small"
                          sx={{
                            fontWeight: 750,
                            fontSize: '0.62rem',
                            height: 19,
                            color,
                            bgcolor: `${color}15`,
                            border: `1px solid ${color}30`,
                            flexShrink: 0,
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={800} color="#1B4FD8" sx={{ fontSize: '0.82rem' }}>
                          {prop.price ? `₹${Number(prop.price).toLocaleString('en-IN')}` : 'Contact for Price'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                          {prop.created_at ? format(new Date(prop.created_at), 'dd MMM yyyy') : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#64748B' }}>
                        <span>👤 {prop.owner_name || 'Anonymous'}</span>
                        <span>📍 {prop.city}</span>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>

            {/* Desktop View: Full Data Table */}
            <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: '1.5px solid #E2E8F0', color: '#64748B', fontWeight: 700, fontSize: '0.78rem' } }}>
                    <TableCell>Property</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(!data?.recentProperties || data.recentProperties.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#94A3B8' }}>
                        No properties found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.recentProperties.map((prop) => {
                      const color = STATUS_COLORS[prop.status] || '#94A3B8';
                      return (
                        <TableRow key={prop.id} hover sx={{ '& td': { borderBottom: '1px solid #F1F5F9', py: 1.5 } }}>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography
                              component={Link}
                              href={`/property/${prop.slug}`}
                              variant="body2"
                              fontWeight={700}
                              color="#0F172A"
                              noWrap
                              sx={{ textDecoration: 'none', display: 'block', '&:hover': { color: '#1B4FD8' } }}
                            >
                              {prop.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {prop.city}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} color="#334155" noWrap sx={{ maxWidth: 120 }}>
                              {prop.owner_name || 'Anonymous'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 120 }}>
                              {prop.owner_email || ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={750} color="#0F172A">
                              {prop.price ? `₹${Number(prop.price).toLocaleString('en-IN')}` : 'Contact for Price'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={prop.status.replace('_', ' ')}
                              size="small"
                              sx={{
                                fontWeight: 750,
                                fontSize: '0.68rem',
                                color,
                                bgcolor: `${color}15`,
                                border: `1px solid ${color}30`,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              {prop.created_at ? format(new Date(prop.created_at), 'dd MMM') : ''}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Users Registered */}
        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5, md: 3 },
              borderRadius: { xs: 2.5, sm: 3.5, md: 4 },
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
              <Box>
                <Typography variant="h6" fontWeight={750} color="#0F172A" sx={{ fontSize: { xs: '0.88rem', sm: '1.05rem', md: '1.15rem' } }}>
                  Recently Joined Users
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Latest members on the platform
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/admin/users"
                endIcon={<ArrowForwardIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                size="small"
                sx={{ textTransform: 'none', fontWeight: 700, color: '#1B4FD8', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}
              >
                View All
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.5 } }}>
              {(!data?.recentUsers || data.recentUsers.length === 0) ? (
                <Typography variant="body2" color="text.disabled" textAlign="center" py={3} sx={{ fontSize: '0.8rem' }}>
                  No recent users
                </Typography>
              ) : (
                data.recentUsers.map((user) => (
                  <Box
                    key={user.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: { xs: 1, sm: 1.25 },
                      borderRadius: 2.5,
                      border: '1px solid #F1F5F9',
                      bgcolor: '#F8FAFC',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: '#F1F5F9', borderColor: '#E2E8F0' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minWidth: 0 }}>
                      <Avatar
                        src={user.avatar_url || undefined}
                        sx={{
                          bgcolor: '#1B4FD8',
                          color: 'white',
                          fontWeight: 700,
                          width: { xs: 32, sm: 38 },
                          height: { xs: 32, sm: 38 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight={700} color="#0F172A" noWrap sx={{ fontSize: { xs: '0.78rem', sm: '0.875rem' } }}>
                            {user.name || 'User'}
                          </Typography>
                          {user.is_verified && (
                            <MuiTooltip title="Verified Email">
                              <CheckCircleIcon sx={{ fontSize: 13, color: '#10B981' }} />
                            </MuiTooltip>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Chip
                        label={user.status}
                        size="small"
                        sx={{
                          fontSize: { xs: '0.6rem', sm: '0.68rem' },
                          fontWeight: 700,
                          height: { xs: 18, sm: 22 },
                          bgcolor: user.status === 'ACTIVE' ? '#ECFDF5' : '#FEF2F2',
                          color: user.status === 'ACTIVE' ? '#059669' : '#DC2626',
                          border: `1px solid ${user.status === 'ACTIVE' ? '#A7F3D0' : '#FECACA'}`,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: { xs: '0.6rem', sm: '0.68rem' } }}>
                        {user.created_at ? format(new Date(user.created_at), 'dd MMM') : ''}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
