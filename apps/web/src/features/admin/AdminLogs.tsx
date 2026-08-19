'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { apiGet } from '@/lib/api';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await apiGet<AuditLog[]>('/admin/audit-logs');
        setLogs(data);
      } catch (error) {
        console.error('Failed to fetch audit logs', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Audit Logs</Typography>
        <Typography color="text.secondary">Recent administrative actions across the platform</Typography>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #E2E8F0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Admin User</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Entity</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{log.user_name || 'System'}</Typography>
                    <Typography variant="caption" color="text.secondary">{log.user_email || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary.main">{log.action}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{log.entity_type}</Typography>
                    <Typography variant="caption" color="text.secondary">{log.entity_id}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)) : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
