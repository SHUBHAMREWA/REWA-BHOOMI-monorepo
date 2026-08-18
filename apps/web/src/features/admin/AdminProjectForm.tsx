'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Grid, Paper, MenuItem, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { apiPost, apiPatch, apiGet } from '@/lib/api';
import toast from 'react-hot-toast';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface AdminProjectFormProps {
  projectId?: string;
}

export default function AdminProjectForm({ projectId }: AdminProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!projectId);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    developer: '',
    status: 'UPCOMING',
    total_plots: 0,
    total_area: 0,
    city: 'Rewa',
    state: 'Madhya Pradesh',
    address: '',
    latitude: 24.53,
    longitude: 81.30,
    google_maps_link: '',
  });
  const [extractedCoords, setExtractedCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (projectId) {
      apiGet<any>(`/admin/projects/${projectId}`)
        .then((data) => {
          setFormData({
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            developer: data.developer || '',
            status: data.status || 'UPCOMING',
            total_plots: data.total_plots || 0,
            total_area: data.total_area || 0,
            city: data.city || 'Rewa',
            state: data.state || 'Madhya Pradesh',
            address: data.address || '',
            latitude: data.latitude || 24.53,
            longitude: data.longitude || 81.30,
            google_maps_link: data.google_maps_link || '',
          });
        })
        .catch((err) => {
          console.error(err);
          toast.error('Failed to fetch project details: ' + (err.response?.data?.error?.message || err.message));
        })
        .finally(() => setFetching(false));
    }
  }, [projectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue: string | number = value;

    if (['total_plots', 'total_area', 'latitude', 'longitude'].includes(name)) {
      if (value === '') {
        finalValue = '';
      } else {
        // Prevent typing "01" (convert directly to number) unless it's a decimal starting with "0."
        finalValue = Number(value);
      }
    }

    setFormData(prev => ({ 
      ...prev, 
      [name]: finalValue
    }));

    // Auto-extract latitude & longitude if google_maps_link is edited/pasted
    if (name === 'google_maps_link' && typeof value === 'string') {
      const coords = parseGoogleMapsUrl(value);
      if (coords) {
        setExtractedCoords(coords);
        setFormData(prev => ({
          ...prev,
          google_maps_link: value,
          latitude: coords.lat,
          longitude: coords.lng,
        }));
        toast.success(`Coordinates auto-extracted! Lat: ${coords.lat}, Lng: ${coords.lng}`);
      } else if (value.includes('goo.gl') || value.includes('maps.app') || value.includes('g.co')) {
        // Short URL: resolve via backend
        apiGet<{ finalUrl: string }>(`/admin/projects/resolve-map-link?url=${encodeURIComponent(value)}`)
          .then((res) => {
            const resolvedCoords = parseGoogleMapsUrl(res.finalUrl);
            if (resolvedCoords) {
              setExtractedCoords(resolvedCoords);
              setFormData(prev => ({
                ...prev,
                latitude: resolvedCoords.lat,
                longitude: resolvedCoords.lng,
              }));
              toast.success(`Coordinates extracted from link! Lat: ${resolvedCoords.lat}, Lng: ${resolvedCoords.lng}`);
            }
          })
          .catch(() => {});
      } else {
        setExtractedCoords(null);
      }
    }
    
    // Auto-generate slug from name if not editing
    if (name === 'name' && !projectId) {
      setFormData(prev => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      }));
    }
  };

  const parseGoogleMapsUrl = (url: string): { lat: number; lng: number } | null => {
    if (!url) return null;
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

    const searchMatch = url.match(/\/maps\/search\/(-?\d+\.\d+)[\s,\+]+(-?\d+\.\d+)/);
    if (searchMatch) return { lat: parseFloat(searchMatch[1]), lng: parseFloat(searchMatch[2]) };

    const queryMatch = url.match(/[?&](?:q|query|ll|center)=(-?\d+\.\d+)(?:%2C|,|\+)+(?:\+)?(-?\d+\.\d+)/i);
    if (queryMatch) return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };

    const embedMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (embedMatch) return { lat: parseFloat(embedMatch[1]), lng: parseFloat(embedMatch[2]) };

    const rawMatch = url.match(/(-?\d+\.\d+)[\s,\+]+(-?\d+\.\d+)/);
    if (rawMatch) return { lat: parseFloat(rawMatch[1]), lng: parseFloat(rawMatch[2]) };

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (projectId) {
        await apiPatch(`/admin/projects/${projectId}`, formData);
        toast.success('Project updated successfully');
      } else {
        const data = await apiPost<any>('/admin/projects', formData);
        toast.success('Project created! Opening map editor...');
        router.push(`/admin/projects/${data.data.id}/map-editor`);
      }
    } catch (error: any) {
      console.error('Project form error:', error);
      const msg = error.response?.data?.error?.message || error.response?.data?.message || (projectId ? 'Failed to update project' : 'Failed to create project');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

  return (
    <Box>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => router.back()} 
        sx={{ mb: 3 }}
      >
        Back to Projects
      </Button>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #E2E8F0' }}>
        <Typography variant="h5" fontWeight={700} mb={4}>
          {projectId ? 'Edit Project' : 'Create New Project'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Project Name" name="name" value={formData.name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="URL Slug" name="slug" value={formData.slug} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" name="description" value={formData.description} onChange={handleChange} multiline rows={4} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Developer / Builder" name="developer" value={formData.developer} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Status" name="status" value={formData.status} onChange={handleChange}>
                <MenuItem value="UPCOMING">Upcoming</MenuItem>
                <MenuItem value="ONGOING">Ongoing</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Total Area (Sq Ft)" type="number" name="total_area" value={formData.total_area} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Total Plots" type="number" name="total_plots" value={formData.total_plots} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="City" name="city" value={formData.city} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="State" name="state" value={formData.state} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Google Maps Location Link" 
                name="google_maps_link" 
                value={formData.google_maps_link} 
                onChange={handleChange}
                placeholder="Paste Google Maps URL (e.g. https://maps.google.com/?q=24.519,81.313 or share link)" 
                helperText={extractedCoords ? `✓ Auto-extracted: Latitude ${extractedCoords.lat}, Longitude ${extractedCoords.lng}` : "Paste any Google Maps URL to automatically set Latitude and Longitude"}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Latitude" type="number" inputProps={{ step: "any" }} name="latitude" value={formData.latitude} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Longitude" type="number" inputProps={{ step: "any" }} name="longitude" value={formData.longitude} onChange={handleChange} />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button type="submit" variant="contained" color="primary" size="large" disabled={loading} sx={{ px: 5 }}>
                {loading ? <CircularProgress size={24} /> : (projectId ? 'Update Project' : 'Create Project & Open Map Editor')}
              </Button>
              {projectId && (
                <Button variant="outlined" size="large" href={`/admin/projects/${projectId}/map-editor`} sx={{ borderColor: '#1B4FD8', color: '#1B4FD8' }}>
                  🗺 Open Map Editor
                </Button>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
