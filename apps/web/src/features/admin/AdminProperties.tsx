'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, TextField, InputAdornment, Button, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Tooltip, Avatar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Link from 'next/link';
import { apiGet, apiPatch } from '@/lib/api';
import toast from 'react-hot-toast';

interface PropertyAdmin {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  listing_type: string;
  is_popular: boolean;
  created_at: string;
  owner_name: string;
  owner_email: string;
  owner_avatar: string | null;
}

export default function AdminProperties() {
  const [properties, setProperties] = useState<PropertyAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [purposeFilter, setPurposeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Moderation state
  const [moderateDialogOpen, setModerateDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyAdmin | null>(null);
  const [moderateAction, setModerateAction] = useState<'PUBLISHED' | 'REJECTED' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isModerating, setIsModerating] = useState(false);

  const togglePopular = async (property: PropertyAdmin) => {
    try {
      await apiPatch(`/admin/properties/${property.id}/popular`, {
        isPopular: !property.is_popular,
      });
      toast.success(`Property marked as ${!property.is_popular ? 'popular' : 'not popular'}`);
      fetchProperties();
    } catch (error) {
      toast.error('Failed to update popular status');
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      let queryStr = `search=${search}${purposeFilter !== 'ALL' ? `&listingPurpose=${purposeFilter}` : ''}`;
      if (statusFilter !== 'ALL') queryStr += `&status=${statusFilter}`;
      if (startDate) queryStr += `&startDate=${startDate}`;
      if (endDate) queryStr += `&endDate=${endDate}`;
      const data = await apiGet<PropertyAdmin[]>(`/admin/properties?${queryStr}`);
      setProperties(data);
    } catch (error) {
      console.error('Failed to fetch properties', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(fetchProperties, 500);
    return () => clearTimeout(timeoutId);
  }, [search, purposeFilter, statusFilter, startDate, endDate]);

  const handleModerateClick = (property: PropertyAdmin, action: 'PUBLISHED' | 'REJECTED') => {
    setSelectedProperty(property);
    setModerateAction(action);
    setRemarks(action === 'PUBLISHED' ? 'Approved by Admin' : '');
    setModerateDialogOpen(true);
  };

  const confirmModerate = async () => {
    if (!selectedProperty || !moderateAction) return;
    
    setIsModerating(true);
    try {
      await apiPatch(`/admin/properties/${selectedProperty.id}/moderate`, {
        status: moderateAction,
        remarks,
      });
      toast.success(`Property ${moderateAction.toLowerCase()} successfully`);
      fetchProperties(); // Refresh the list
    } catch (error) {
      toast.error('Failed to update property status');
    } finally {
      setIsModerating(false);
      setModerateDialogOpen(false);
      setSelectedProperty(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'PENDING_REVIEW': return 'warning';
      case 'REJECTED': return 'error';
      case 'DRAFT': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
        <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>Properties Management</Typography>
        <TextField
          placeholder="Search properties..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          sx={{ maxWidth: { xs: '100%', md: 300 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            sx: { bgcolor: 'white', borderRadius: 2 }
          }}
        />
      </Box>

      {/* Filters and Date Range */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        {['ALL', 'SELL', 'RENT', 'LEASE'].map(p => (
          <Chip
            key={p}
            label={p === 'SELL' ? 'SALE' : p}
            size="small"
            onClick={() => setPurposeFilter(p)}
            color={purposeFilter === p ? 'primary' : 'default'}
            variant={purposeFilter === p ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600, cursor: 'pointer' }}
          />
        ))}

        <Box sx={{ width: '1px', height: 24, bgcolor: 'divider', mx: 1, display: { xs: 'none', md: 'block' } }} />

        {['ALL', 'PUBLISHED', 'PENDING_REVIEW', 'REJECTED', 'DRAFT'].map(s => (
          <Chip
            key={s}
            label={s.replace('_', ' ')}
            size="small"
            onClick={() => setStatusFilter(s)}
            color={statusFilter === s ? 'secondary' : 'default'}
            variant={statusFilter === s ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600, cursor: 'pointer' }}
          />
        ))}
        
        <Box sx={{ flexGrow: 1, minWidth: { xs: '100%', md: 'auto' } }} />
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            type="date"
            size="small"
            label="From Date"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            sx={{ bgcolor: 'white', minWidth: 150 }}
          />
          <TextField
            type="date"
            size="small"
            label="To Date"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            sx={{ bgcolor: 'white', minWidth: 150 }}
          />
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #E2E8F0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Owner</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Type & Price</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No properties found
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow key={property.id} hover>
                  <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Typography variant="body2" fontWeight={600}>{property.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(property.created_at).toLocaleDateString()}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box 
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover .owner-name': { color: '#2563EB', textDecoration: 'underline' } }} 
                      onClick={() => window.open(`/profile/${property.owner_email}`, '_blank')}
                    >
                      <Avatar src={property.owner_avatar || undefined} sx={{ width: 32, height: 32 }}>
                        {property.owner_name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" className="owner-name" sx={{ fontWeight: 600, transition: 'color 0.2s' }}>{property.owner_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{property.owner_email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{property.listing_type}</Typography>
                    <Typography variant="caption" color="text.secondary">₹{Number(property.price).toLocaleString()}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={property.status.replace('_', ' ')} 
                      color={getStatusColor(property.status) as any} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', alignItems: 'center' }}>
                      <Tooltip title="Property detail preview dekho">
                        <Button 
                          size="small" 
                          variant="outlined"
                          component={Link}
                          href={`/property/${property.slug}`}
                          target="_blank"
                          startIcon={<VisibilityIcon sx={{ fontSize: '1rem !important' }} />}
                          sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem', textTransform: 'none', borderColor: '#6366F1', color: '#6366F1', '&:hover': { bgcolor: 'rgba(99,102,241,0.08)', borderColor: '#4F46E5' } }}
                        >
                          View
                        </Button>
                      </Tooltip>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="success"
                        disabled={property.status === 'PUBLISHED'}
                        onClick={() => handleModerateClick(property, 'PUBLISHED')}
                        sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem', textTransform: 'none' }}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="error"
                        disabled={property.status === 'REJECTED'}
                        onClick={() => handleModerateClick(property, 'REJECTED')}
                        sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem', textTransform: 'none' }}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        component={Link}
                        href={`/properties/edit/${property.slug}`}
                        startIcon={<EditIcon sx={{ fontSize: '1rem !important' }} />}
                        sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem', textTransform: 'none' }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        variant={property.is_popular ? 'contained' : 'outlined'} 
                        color="warning"
                        disabled={property.status !== 'PUBLISHED'}
                        onClick={() => togglePopular(property)}
                        startIcon={property.is_popular ? <StarIcon sx={{ fontSize: '1rem !important' }} /> : <StarBorderIcon sx={{ fontSize: '1rem !important' }} />}
                        sx={{ 
                          minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem', textTransform: 'none',
                          bgcolor: property.is_popular ? '#F59E0B' : 'transparent', 
                          color: property.is_popular ? 'white' : '#F59E0B', 
                          borderColor: '#F59E0B', 
                          '&:hover': { bgcolor: property.is_popular ? '#D97706' : 'rgba(245, 158, 11, 0.1)', borderColor: '#D97706' } 
                        }}
                      >
                        {property.is_popular ? 'Popular' : 'Popular'}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Moderation Dialog */}
      <Dialog open={moderateDialogOpen} onClose={() => !isModerating && setModerateDialogOpen(false)}>
        <DialogTitle>
          {moderateAction === 'PUBLISHED' ? 'Approve Property' : 'Reject Property'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            Are you sure you want to {moderateAction === 'PUBLISHED' ? 'approve' : 'reject'} the property "{selectedProperty?.title}"?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Remarks (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={isModerating}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModerateDialogOpen(false)} color="inherit" disabled={isModerating}>Cancel</Button>
          <Button 
            onClick={confirmModerate} 
            color={moderateAction === 'PUBLISHED' ? 'success' : 'error'} 
            variant="contained" 
            disabled={isModerating}
          >
            {isModerating ? <CircularProgress size={24} color="inherit" /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
