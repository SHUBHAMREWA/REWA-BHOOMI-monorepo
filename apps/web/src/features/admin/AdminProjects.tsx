'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, TextField, InputAdornment, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { apiGet, apiDelete } from '@/lib/api';
import toast from 'react-hot-toast';

interface ProjectAdmin {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  builder_name: string;
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<ProjectAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectAdmin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await apiGet<ProjectAdmin[]>(`/admin/projects?search=${search}`);
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(fetchProjects, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleDeleteClick = (project: ProjectAdmin) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await apiDelete(`/admin/projects/${projectToDelete.id}`);
      toast.success('Project and all related data deleted successfully');
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'COMPLETED': return 'info';
      case 'UPCOMING': return 'warning';
      case 'ON_HOLD': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
        <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>Projects Management</Typography>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          <TextField
            placeholder="Search projects..."
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
          <Button variant="contained" color="primary" href="/admin/projects/new" sx={{ whiteSpace: 'nowrap' }}>
            Add Project
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #E2E8F0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Project Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Developer</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Added On</TableCell>
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
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Typography variant="body2" fontWeight={600}>{project.name}</Typography>
                  </TableCell>
                  <TableCell>{project.builder_name || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={project.status.replace('_', ' ')} 
                      color={getStatusColor(project.status) as any} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button size="small" variant="outlined" href={`/admin/projects/${project.id}/edit`}>Edit</Button>
                      <Button size="small" variant="contained" sx={{ bgcolor: '#1B4FD8' }} href={`/admin/projects/${project.id}/map-editor`}>🗺 Map Editor</Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteClick(project)}>Delete</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={() => !isDeleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Project?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the project <strong>{projectToDelete?.name}</strong>? 
            This action will also permanently delete all related map data, phases, plots, and photos. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" disabled={isDeleting}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
