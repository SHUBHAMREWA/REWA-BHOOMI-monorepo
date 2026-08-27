'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, CircularProgress, TextField, InputAdornment, Select, MenuItem,
  FormControl, Snackbar, Alert, Avatar, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import Link from 'next/link';
import { apiGet, apiPatch } from '@/lib/api';

type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'BLOCKED' | 'DEACTIVATED';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  status: UserStatus;
  is_email_verified: boolean;
  created_at: string;
  total_properties: number;
  published_properties: number;
  pending_properties: number;
  avatar_url: string | null;
  username: string | null;
  last_login_at?: string | null;
  roles?: string[];
}

const STATUS_CONFIG: Record<UserStatus, { label: string; icon: string; bg: string; color: string }> = {
  ACTIVE: { label: 'Active', icon: '🟢', bg: '#DCFCE7', color: '#15803D' },
  PENDING: { label: 'Pending', icon: '🟡', bg: '#FEF9C3', color: '#A16207' },
  SUSPENDED: { label: 'Suspended', icon: '🔴', bg: '#FEE2E2', color: '#B91C1C' },
  BLOCKED: { label: 'Blocked', icon: '⚫', bg: '#1E293B', color: '#F8FAFC' },
  DEACTIVATED: { label: 'Deactivated', icon: '⚪', bg: '#E2E8F0', color: '#475569' },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiGet<User[]>(`/admin/users?search=${search}`);
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(fetchUsers, 400); // Debounce
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      setUpdatingId(userId);
      await apiPatch(`/admin/users/${userId}/status`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      setToast({
        open: true,
        message: `User status updated to ${STATUS_CONFIG[newStatus].label}`,
        severity: 'success',
      });
    } catch (error: any) {
      setToast({
        open: true,
        message: error.response?.data?.error?.message || 'Failed to update user status',
        severity: 'error',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingId(userId);
      await apiPatch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, roles: [newRole] } : u))
      );
      setToast({
        open: true,
        message: `User role updated to ${newRole}`,
        severity: 'success',
      });
    } catch (error: any) {
      setToast({
        open: true,
        message: error.response?.data?.error?.message || 'Failed to update user role',
        severity: 'error',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Users Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage platform users, roles, and status access permissions.
          </Typography>
        </Box>
        <TextField
          placeholder="Search users by name, email, or phone..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          sx={{ maxWidth: { xs: '100%', md: 360 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            sx: { bgcolor: 'white', borderRadius: 2 }
          }}
        />
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #E2E8F0' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Email / Phone</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Properties</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Joined Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const cfg = STATUS_CONFIG[user.status || 'ACTIVE'];
                const isUpdating = updatingId === user.id;
                let primaryRole = 'USER';
                if (Array.isArray(user.roles) && user.roles.length > 0) {
                  primaryRole = user.roles[0];
                } else if (typeof user.roles === 'string') {
                  const cleaned = (user.roles as string).replace(/[{}]/g, '').split(',');
                  if (cleaned[0] && cleaned[0].trim()) primaryRole = cleaned[0].trim();
                }

                return (
                  <TableRow key={user.id} hover>
                    <TableCell sx={{ py: 1 }}>
                      <Box 
                        component={user.email ? Link : 'div'} 
                        href={user.email ? `/profile/${user.email}` : '#'}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1.5,
                          textDecoration: 'none',
                          ...(user.email ? { '&:hover': { opacity: 0.8 } } : {})
                        }}
                      >
                        <Avatar src={user.avatar_url || undefined} alt={user.name} sx={{ width: 32, height: 32, bgcolor: '#1B4FD8', fontSize: '0.9rem' }} />
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1E293B' }}>{user.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                            {user.username ? `@${user.username}` : 'No username'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: '#1E293B' }}>{user.email}</Typography>
                      {user.phone && <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>{user.phone}</Typography>}
                      {user.is_email_verified && <Chip size="small" label="Verified" color="success" sx={{ height: 16, fontSize: '0.6rem', mt: 0.5 }} />}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 120 }}>
                        <Chip size="small" label={`Tot: ${user.total_properties || 0}`} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F1F5F9' }} />
                        <Chip size="small" label={`Live: ${user.published_properties || 0}`} color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                        <Chip size="small" label={`Pend: ${user.pending_properties || 0}`} color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <FormControl size="small" disabled={isUpdating}>
                        <Select
                          value={primaryRole}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          sx={{
                            borderRadius: 1.5,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            height: 28,
                            '.MuiSelect-select': { py: 0, px: 1, display: 'flex', alignItems: 'center' },
                          }}
                        >
                          <MenuItem value="USER" sx={{ fontSize: '0.75rem' }}>USER</MenuItem>
                          <MenuItem value="ADMIN" sx={{ fontSize: '0.75rem' }}>ADMIN</MenuItem>
                          <MenuItem value="SUPER_ADMIN" sx={{ fontSize: '0.75rem' }}>SUPER_ADMIN</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <FormControl size="small" disabled={isUpdating}>
                        <Select
                          value={user.status || 'ACTIVE'}
                          onChange={(e) => handleStatusChange(user.id, e.target.value as UserStatus)}
                          sx={{
                            borderRadius: 1.5,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            height: 28,
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            '.MuiSelect-select': { py: 0, px: 1, display: 'flex', alignItems: 'center', gap: 0.5 },
                            '& fieldset': { border: 'none' },
                          }}
                        >
                          {(Object.keys(STATUS_CONFIG) as UserStatus[]).map((st) => {
                            const conf = STATUS_CONFIG[st];
                            return (
                              <MenuItem key={st} value={st} sx={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', gap: 1 }}>
                                <span>{conf.icon}</span>
                                <span>{conf.label}</span>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem', py: 1 }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <IconButton size="small" component={Link} href={`/admin/chat?userId=${user.id}`} color="primary">
                        <ChatIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} sx={{ borderRadius: 3, fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
