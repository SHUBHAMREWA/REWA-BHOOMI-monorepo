'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, TextField, InputAdornment, Button, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Tooltip, Avatar, IconButton, Checkbox } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Link from 'next/link';
import { apiGet, apiPatch, apiDelete, apiPost } from '@/lib/api';
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
  
  // Deletion state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyAdmin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(properties.map((p) => p.id));
      return;
    }
    setSelectedIds([]);
  };

  const handleSelectClick = (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1),
      );
    }
    setSelectedIds(newSelected);
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await apiPost('/admin/properties/bulk-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} properties deleted successfully`);
      setSelectedIds([]);
      fetchProperties();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete properties');
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleDeleteClick = (property: PropertyAdmin) => {
    setPropertyToDelete(property);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    setIsDeleting(true);
    try {
      await apiDelete(`/admin/properties/${propertyToDelete.id}`);
      toast.success('Property and related data deleted successfully');
      fetchProperties();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete property');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {properties.length} properties found
        </Typography>
        {selectedIds.length > 1 && (
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => setBulkDeleteDialogOpen(true)}
          >
            Delete Selected ({selectedIds.length})
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selectedIds.length > 0 && selectedIds.length < properties.length}
                  checked={properties.length > 0 && selectedIds.length === properties.length}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Owner</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Type & Price</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5, align: 'right' }}>Actions</TableCell>
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
              properties.map((property) => {
                const isItemSelected = selectedIds.indexOf(property.id) !== -1;
                
                return (
                <TableRow key={property.id} hover selected={isItemSelected}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={isItemSelected}
                      onChange={(e) => handleSelectClick(e, property.id)}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', py: 1 }}>
                    <Typography variant="body2" fontWeight={600} noWrap title={property.title}>{property.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(property.created_at).toLocaleDateString()}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Box 
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover .owner-name': { color: '#2563EB', textDecoration: 'underline' } }} 
                      onClick={() => window.open(`/profile/${property.owner_email}`, '_blank')}
                    >
                      <Avatar src={property.owner_avatar || undefined} sx={{ width: 28, height: 28, fontSize: '0.875rem' }}>
                        {property.owner_name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" className="owner-name" sx={{ fontWeight: 600, transition: 'color 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }} title={property.owner_name}>{property.owner_name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }} title={property.owner_email}>{property.owner_email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{property.listing_type}</Typography>
                    <Typography variant="caption" color="text.secondary">₹{Number(property.price).toLocaleString()}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip 
                      label={property.status.replace('_', ' ')} 
                      color={getStatusColor(property.status) as any} 
                      size="small" 
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1, align: 'right' }}>
                    <Box sx={{ display: 'flex', gap: 0, flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Tooltip title="View Property">
                        <IconButton 
                          size="small" 
                          component={Link}
                          href={`/property/${property.slug}`}
                          target="_blank"
                          sx={{ color: '#6366F1' }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Approve">
                        <span>
                          <IconButton 
                            size="small" 
                            color="success"
                            disabled={property.status === 'PUBLISHED'}
                            onClick={() => handleModerateClick(property, 'PUBLISHED')}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <span>
                          <IconButton 
                            size="small" 
                            color="error"
                            disabled={property.status === 'REJECTED'}
                            onClick={() => handleModerateClick(property, 'REJECTED')}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          color="primary"
                          component={Link}
                          href={`/properties/edit/${property.slug}`}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(property)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={property.is_popular ? "Remove Popular" : "Make Popular"}>
                        <span>
                          <IconButton 
                            size="small" 
                            disabled={property.status !== 'PUBLISHED'}
                            onClick={() => togglePopular(property)}
                            sx={{ color: property.is_popular ? '#F59E0B' : 'action.disabled' }}
                          >
                            {property.is_popular ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !isDeleting && setDeleteDialogOpen(false)}>
        <DialogTitle>
          Delete Property
        </DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            Are you sure you want to permanently delete the property "{propertyToDelete?.title}"? 
            This action cannot be undone and will delete all related documents and images.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" disabled={isDeleting}>Cancel</Button>
          <Button 
            onClick={confirmDelete} 
            color="error"
            variant="contained" 
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={24} color="inherit" /> : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => !isDeleting && setBulkDeleteDialogOpen(false)}>
        <DialogTitle>
          Delete {selectedIds.length} Properties
        </DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            Are you sure you want to permanently delete {selectedIds.length} properties? 
            This action cannot be undone and will delete all related documents and images.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} color="inherit" disabled={isDeleting}>Cancel</Button>
          <Button 
            onClick={confirmBulkDelete} 
            color="error"
            variant="contained" 
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={24} color="inherit" /> : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
