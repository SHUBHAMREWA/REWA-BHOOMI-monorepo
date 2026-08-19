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
        <Table>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Properties</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Email Verified</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Account Status (Action)</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Joined Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Last Login</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Chat</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const cfg = STATUS_CONFIG[user.status || 'ACTIVE'];
                const isUpdating = updatingId === user.id;

                return (
                  <TableRow key={user.id} hover>
                    <TableCell>
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
                        <Avatar src={user.avatar_url || undefined} alt={user.name} sx={{ width: 40, height: 40, bgcolor: '#1B4FD8' }} />
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1E293B' }}>{user.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            {user.username ? `@${user.username}` : 'No username'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip size="small" label={`Total: ${user.total_properties || 0}`} sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: '#F1F5F9' }} />
                        <Chip size="small" label={`Live: ${user.published_properties || 0}`} color="success" variant="outlined" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                        <Chip size="small" label={`Pending: ${user.pending_properties || 0}`} color="warning" variant="outlined" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_email_verified ? 'Verified' : 'Unverified'}
                        color={user.is_email_verified ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" disabled={isUpdating}>
                        <Select
                          value={user.status || 'ACTIVE'}
                          onChange={(e) => handleStatusChange(user.id, e.target.value as UserStatus)}
                          sx={{
                            borderRadius: 2,
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            '.MuiSelect-select': { py: 0.75, px: 1.5, display: 'flex', alignItems: 'center', gap: 1 },
                            '& fieldset': { border: 'none' },
                          }}
                        >
                          {(Object.keys(STATUS_CONFIG) as UserStatus[]).map((st) => {
                            const conf = STATUS_CONFIG[st];
                            return (
                              <MenuItem key={st} value={st} sx={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', gap: 1 }}>
                                <span>{conf.icon}</span>
                                <span>{conf.label}</span>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <IconButton component={Link} href={`/admin/chat?userId=${user.id}`} color="primary">
                        <ChatIcon />
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
