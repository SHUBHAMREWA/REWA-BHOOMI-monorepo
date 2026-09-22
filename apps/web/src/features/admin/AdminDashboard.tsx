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
import { format } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 15 }}>
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
          Loading dashboard analytics...
        </Typography>
      </Box>
    );
  }

  const primaryCards = [
    {
      title: 'Total Users',
      value: data?.totalUsers || 0,
      icon: <PeopleIcon sx={{ fontSize: 32 }} />,
      color: '#3B82F6',
      bg: '#EFF6FF',
      href: '/admin/users',
      subtext: 'Registered platform accounts',
    },
    {
      title: 'Total Properties',
      value: data?.totalProperties || 0,
      icon: <HomeWorkIcon sx={{ fontSize: 32 }} />,
      color: '#10B981',
      bg: '#ECFDF5',
      href: '/admin/properties',
      subtext: `${data?.publishedProperties || 0} active & published`,
    },
    {
      title: 'Pending Review',
      value: data?.pendingProperties || 0,
      icon: <WarningIcon sx={{ fontSize: 32 }} />,
      color: '#F59E0B',
      bg: '#FFFBEB',
      href: '/admin/properties',
      subtext: (data?.pendingProperties || 0) > 0 ? 'Requires moderation approval' : 'All properties moderated',
      highlight: (data?.pendingProperties || 0) > 0,
    },
    {
      title: 'Active Projects',
      value: data?.activeProjects || 0,
      icon: <BusinessIcon sx={{ fontSize: 32 }} />,
      color: '#8B5CF6',
      bg: '#F5F3FF',
      href: '/admin/projects',
      subtext: 'Townships & colonies in Rewa',
    },
    {
      title: 'Sold / Closed',
      value: data?.soldProperties || 0,
      icon: <MonetizationOnIcon sx={{ fontSize: 32 }} />,
      color: '#0284C7',
      bg: '#F0F9FF',
      href: '/admin/properties',
      subtext: 'Deals marked as closed',
    },
    {
      title: 'Published Blogs',
      value: data?.totalBlogs || 0,
      icon: <ArticleIcon sx={{ fontSize: 32 }} />,
      color: '#EC4899',
      bg: '#FDF2F8',
      href: '/admin/blogs',
      subtext: 'Content & market guides',
    },
  ];

  // Prepare Status Pie Data
  const statusPieData = (data?.statusDistribution || []).map((item) => ({
    name: item.status.replace('_', ' '),
    value: item.count,
    color: STATUS_COLORS[item.status] || '#94A3B8',
  }));

  // Prepare Purpose Pie Data
  const purposePieData = (data?.purposeDistribution || []).map((item, idx) => ({
    name: item.purpose,
    value: item.count,
    color: PURPOSE_COLORS[idx % PURPOSE_COLORS.length],
  }));

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A">
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time analytics, property listings moderation, and user activity across Rewa.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: '#475569', borderColor: '#CBD5E1' }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button
            variant="contained"
            component={Link}
            href="/admin/properties"
            size="small"
            sx={{ bgcolor: '#1B4FD8', textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 2 }}
          >
            Moderate Properties
          </Button>
        </Box>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={2.5}>
        {primaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.title}>
            <Paper
              elevation={0}
              component={Link}
              href={card.href}
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: card.highlight ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: card.highlight ? '0 4px 20px rgba(245, 158, 11, 0.12)' : '0 2px 10px rgba(0,0,0,0.02)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                height: '100%',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  borderColor: card.color,
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ bgcolor: card.bg, color: card.color, p: 1.25, borderRadius: 2.5, display: 'flex' }}>
                  {card.icon}
                </Box>
                {card.highlight && (
                  <Chip label="Attention" size="small" sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 700, fontSize: '0.7rem' }} />
                )}
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} color="#0F172A">
                  {card.value}
                </Typography>
                <Typography variant="subtitle2" fontWeight={700} color="#334155" sx={{ mt: 0.25 }}>
                  {card.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                  {card.subtext}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Visualizations Section */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Growth Trend Area Chart (6 Months) */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ bgcolor: '#EFF6FF', color: '#1B4FD8', p: 1, borderRadius: 2, display: 'flex' }}>
                  <TrendingUpIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={750} color="#0F172A">
                    Platform Growth Trends
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Monthly new property listings vs user registrations
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#1B4FD8' }} />
                  <Typography variant="caption" fontWeight={600} color="#475569">Properties</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10B981' }} />
                  <Typography variant="caption" fontWeight={600} color="#475569">Users</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.growthTrends || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B4FD8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1B4FD8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: 8, border: 'none', color: '#FFFFFF', fontSize: '13px' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Area type="monotone" dataKey="properties" name="New Properties" stroke="#1B4FD8" strokeWidth={3} fillOpacity={1} fill="url(#colorProp)" />
                  <Area type="monotone" dataKey="users" name="New Users" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorUser)" />
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
              p: 3,
              borderRadius: 4,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ bgcolor: '#ECFDF5', color: '#10B981', p: 1, borderRadius: 2, display: 'flex' }}>
                <PieChartIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={750} color="#0F172A">
                  Property Status Breakdown
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Current moderation distribution
                </Typography>
              </Box>
            </Box>

            {statusPieData.length === 0 ? (
              <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.disabled">No property data available</Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: 8, border: 'none', color: '#FFFFFF', fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Custom Legend */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mt: 1 }}>
              {statusPieData.map((item) => (
                <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                  <Typography variant="caption" fontWeight={600} color="#334155">
                    {item.name}: <strong style={{ color: '#0F172A' }}>{item.value}</strong>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Listing Purpose & Category Breakdown Bar Charts */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ bgcolor: '#F0F9FF', color: '#0284C7', p: 1, borderRadius: 2, display: 'flex' }}>
                <CategoryIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={750} color="#0F172A">
                  Top Property Categories
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Distribution by property type in Rewa
                </Typography>
              </Box>
            </Box>

            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.categoryDistribution || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="category" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: 8, border: 'none', color: '#FFFFFF', fontSize: '13px' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Bar dataKey="count" name="Listings" fill="#3B82F6" radius={[6, 6, 0, 0]} />
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
              p: 3,
              borderRadius: 4,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ bgcolor: '#FEF3C7', color: '#B45309', p: 1, borderRadius: 2, display: 'flex' }}>
                <LocationOnIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={750} color="#0F172A">
                  Top Active Localities
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Highest volume of listings in Rewa
                </Typography>
              </Box>
            </Box>

            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.topLocalities || []}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#475569" fontSize={11} tickLine={false} width={80} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: 8, border: 'none', color: '#FFFFFF', fontSize: '13px' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Bar dataKey="count" name="Properties" fill="#10B981" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity Tables */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Recent Properties Table */}
        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={750} color="#0F172A">
                  Recent Property Submissions
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Latest properties submitted by owners & agents
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/admin/properties"
                endIcon={<ArrowForwardIcon />}
                size="small"
                sx={{ textTransform: 'none', fontWeight: 700, color: '#1B4FD8' }}
              >
                View All
              </Button>
            </Box>

            <TableContainer>
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
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                        No properties found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.recentProperties.map((prop) => {
                      const color = STATUS_COLORS[prop.status] || '#94A3B8';
                      return (
                        <TableRow key={prop.id} hover sx={{ '& td': { borderBottom: '1px solid #F1F5F9', py: 1.75 } }}>
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
                            <Typography variant="body2" fontWeight={600} color="#334155" noWrap>
                              {prop.owner_name || 'Anonymous'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 140 }}>
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
                                fontSize: '0.7rem',
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
              p: 3,
              borderRadius: 4,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={750} color="#0F172A">
                  Recently Joined Users
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Latest members registered on the platform
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/admin/users"
                endIcon={<ArrowForwardIcon />}
                size="small"
                sx={{ textTransform: 'none', fontWeight: 700, color: '#1B4FD8' }}
              >
                View All
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(!data?.recentUsers || data.recentUsers.length === 0) ? (
                <Typography variant="body2" color="text.disabled" textAlign="center" py={4}>
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
                      p: 1.5,
                      borderRadius: 3,
                      border: '1px solid #F1F5F9',
                      bgcolor: '#F8FAFC',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: '#F1F5F9', borderColor: '#E2E8F0' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0 }}>
                      <Avatar
                        src={user.avatar_url || undefined}
                        sx={{ bgcolor: '#1B4FD8', color: 'white', fontWeight: 700, width: 42, height: 42 }}
                      >
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography variant="body2" fontWeight={700} color="#0F172A" noWrap>
                            {user.name || 'User'}
                          </Typography>
                          {user.is_verified && (
                            <MuiTooltip title="Verified Email">
                              <CheckCircleIcon sx={{ fontSize: 15, color: '#10B981' }} />
                            </MuiTooltip>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Chip
                        label={user.status}
                        size="small"
                        sx={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          bgcolor: user.status === 'ACTIVE' ? '#ECFDF5' : '#FEF2F2',
                          color: user.status === 'ACTIVE' ? '#059669' : '#DC2626',
                          border: `1px solid ${user.status === 'ACTIVE' ? '#A7F3D0' : '#FECACA'}`,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                        {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : ''}
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
