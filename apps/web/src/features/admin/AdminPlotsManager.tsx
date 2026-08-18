'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, MenuItem } from '@mui/material';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import toast from 'react-hot-toast';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface PlotAdmin {
  id: string;
  plot_number: string;
  area: number;
  area_unit: string;
  price: number;
  status: string;
  facing: string;
  polygon_geometry?: any;
}

export default function AdminPlotsManager({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [plots, setPlots] = useState<PlotAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [open, setOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<PlotAdmin | null>(null);
  const [formData, setFormData] = useState({
    plot_number: '',
    area: '',
    price: '',
    status: 'AVAILABLE',
    facing: '',
    polygon_geometry: '',
  });

  const fetchPlots = async () => {
    try {
      setLoading(true);
      const data = await apiGet<any>(`/admin/projects/${projectId}`);
      setPlots(data.plots || []);
    } catch (error) {
      toast.error('Failed to fetch plots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchPlots();
  }, [projectId]);

  const handleOpen = (plot?: PlotAdmin) => {
    if (plot) {
      setEditingPlot(plot);
      setFormData({
        plot_number: plot.plot_number,
        area: String(plot.area),
        price: String(plot.price),
        status: plot.status,
        facing: plot.facing || '',
        polygon_geometry: plot.polygon_geometry ? JSON.stringify(plot.polygon_geometry) : '',
      });
    } else {
      setEditingPlot(null);
      setFormData({
        plot_number: '', area: '', price: '', status: 'AVAILABLE', facing: '', polygon_geometry: ''
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!formData.plot_number || !formData.area || !formData.price) {
      toast.error('Please fill required fields');
      return;
    }

    let parsedGeometry = null;
    if (formData.polygon_geometry) {
      try {
        parsedGeometry = JSON.parse(formData.polygon_geometry);
      } catch (e) {
        toast.error('Invalid JSON in polygon geometry');
        return;
      }
    }

    try {
      await apiPost(`/admin/projects/${projectId}/plots`, {
        plot_number: formData.plot_number,
        area: Number(formData.area),
        price: Number(formData.price),
        status: formData.status,
        facing: formData.facing || null,
        polygon_geometry: parsedGeometry,
      });
      toast.success(editingPlot ? 'Plot updated successfully' : 'Plot created successfully');
      setOpen(false);
      fetchPlots();
    } catch (error) {
      toast.error('Failed to save plot');
    }
  };

  const handleDelete = async (plotId: string) => {
    if (!confirm('Are you sure you want to delete this plot?')) return;
    try {
      await apiDelete(`/admin/projects/${projectId}/plots/${plotId}`);
      toast.success('Plot deleted successfully');
      fetchPlots();
    } catch (error) {
      toast.error('Failed to delete plot');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'RESERVED': return 'warning';
      case 'SOLD': return 'error';
      case 'BLOCKED': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
          Back to Projects
        </Button>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add New Plot
        </Button>
      </Box>

      <Typography variant="h5" fontWeight={700} mb={3}>Manage Project Plots</Typography>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #E2E8F0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Plot Number</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Area (Sq Ft)</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Price (₹)</TableCell>
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
            ) : plots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No plots found for this project
                </TableCell>
              </TableRow>
            ) : (
              plots.map((plot) => (
                <TableRow key={plot.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{plot.plot_number}</Typography>
                  </TableCell>
                  <TableCell>{plot.area}</TableCell>
                  <TableCell>₹{Number(plot.price).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={plot.status} color={getStatusColor(plot.status) as any} size="small" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" onClick={() => handleOpen(plot)}>Edit</Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(plot.id)}>Delete</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Plot Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPlot ? 'Edit Plot' : 'Add Plot'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Plot Number" required
                value={formData.plot_number} onChange={(e) => setFormData({...formData, plot_number: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Status" select
                value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <MenuItem value="AVAILABLE">AVAILABLE</MenuItem>
                <MenuItem value="RESERVED">RESERVED</MenuItem>
                <MenuItem value="SOLD">SOLD</MenuItem>
                <MenuItem value="BLOCKED">BLOCKED</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Area (Sq Ft)" required type="number"
                value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Price (₹)" required type="number"
                value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Facing" select
                value={formData.facing} onChange={(e) => setFormData({...formData, facing: e.target.value})}>
                <MenuItem value="">None</MenuItem>
                <MenuItem value="NORTH">North</MenuItem>
                <MenuItem value="SOUTH">South</MenuItem>
                <MenuItem value="EAST">East</MenuItem>
                <MenuItem value="WEST">West</MenuItem>
                <MenuItem value="NORTH_EAST">North East</MenuItem>
                <MenuItem value="NORTH_WEST">North West</MenuItem>
                <MenuItem value="SOUTH_EAST">South East</MenuItem>
                <MenuItem value="SOUTH_WEST">South West</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Polygon GeoJSON (Optional)" multiline rows={4}
                placeholder='{"type":"Polygon","coordinates":[[...]]}'
                value={formData.polygon_geometry} onChange={(e) => setFormData({...formData, polygon_geometry: e.target.value})} />
              <Typography variant="caption" color="text.secondary">
                Paste valid GeoJSON polygon feature coordinates to render on the interactive map.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save Plot</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
