// client/src/pages/InventoryDashboard.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  ToggleButtonGroup,
  ToggleButton,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

// Status chip color mapping
const statusColors = {
  'Created': 'warning',
  'Accepted by Inventory': 'info',
  'Accepted by QA': 'info',
  'Accepted by Both': 'success',
  'In Progress': 'primary',
  'Completed': 'success',
  'Rejected': 'error'
};

export default function InventoryDashboard() {
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [stats, setStats] = useState({ total:0, created:0, accepted:0, completed:0, rejected:0 });

  // Install axios interceptors once
  useEffect(() => {
    axios.interceptors.request.use(config => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Update stats when docs change
  useEffect(() => {
    const total    = docs.length;
    const created  = docs.filter(d => d.status === 'Created').length;
    const accepted = docs.filter(d => d.status.startsWith('Accepted')).length;
    const completed = docs.filter(d => d.status === 'Completed').length;
    const rejected = docs.filter(d => d.status === 'Rejected').length;
    setStats({ total, created, accepted, completed, rejected });
  }, [docs]);

  // Filter documents on search or tab change
  useEffect(() => {
    let fd = [...docs];
    if (tabValue === 1) {
      fd = fd.filter(d => d.status === 'Created');
    } else if (tabValue === 2) {
      fd = fd.filter(d => d.status.startsWith('Accepted'));
    } else if (tabValue === 3) {
      fd = fd.filter(d => d.status === 'Completed' || d.status === 'Rejected');
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      fd = fd.filter(d =>
        d.Document_id.toLowerCase().includes(term) ||
        d.Product_id.toString().includes(term) ||
        d.Issue_Found.toLowerCase().includes(term) ||
        d.Lot_No.toLowerCase().includes(term)
      );
    }
    setFilteredDocs(fd);
  }, [docs, tabValue, searchTerm]);

  // Async fetch function
  async function fetchDocuments() {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/api/documents/list');
      setDocs(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.response?.data?.message || 'Error fetching documents');
    } finally {
      setLoading(false);
    }
  }

  // Handle inventory accept
  const handleAccept = async (doc) => {
    if (!window.confirm('Accept this document?')) return;
    try {
      await axios.post(`/api/documents/${doc.id}/accept-inventory`);
      setDocs(docs.map(d => {
        if (d.id !== doc.id) return d;
        const newStatus = d.status === 'Accepted by QA'
          ? 'Accepted by Both'
          : 'Accepted by Inventory';
        return {
          ...d,
          status: newStatus,
          InventoryName: localStorage.getItem('userName') || 'Inventory',
          InventoryTimeStamp: new Date().toISOString()
        };
      }));
      setNotification({ open: true, message: 'Accepted successfully', severity: 'success' });
    } catch (err) {
      console.error('Error accepting:', err);
      setNotification({ open: true, message: err.response?.data?.message || 'Accept failed', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ p:3, textAlign:'center' }}>
        <Typography variant="h4">Inventory Dashboard</Typography>
        <CircularProgress sx={{ mt:2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p:3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Typography variant="h4">Inventory Dashboard</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            placeholder="Search..."
            size="small"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="grid"><GridViewIcon/></ToggleButton>
            <ToggleButton value="table"><ViewListIcon/></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          ['Total', stats.total],
          ['Created', stats.created],
          ['Accepted', stats.accepted],
          ['Completed', stats.completed],
          ['Rejected', stats.rejected]
        ].map(([label, value]) => (
          <Grid item xs={6} md={2.4} key={label}>
            <Card sx={{ bgcolor: '#f5f5f5' }}>
              <CardContent sx={{ py:1, textAlign:'center' }}>
                <Typography variant="h4" color="text.primary">{value}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb:2 }}>
        <Tab label="All" />
        <Tab label="Created" />
        <Tab label="Accepted" />
        <Tab label="Completed/Rejected" />
      </Tabs>

      {error && <Alert severity="error" sx={{ my:2 }}>{error}</Alert>}
      {!error && !filteredDocs.length && <Alert severity="info">No documents found.</Alert>}

      {/* Table View */}
      {viewMode === 'table' && filteredDocs.length > 0 && (
        <TableContainer component={Paper} sx={{ mt:2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Doc #</TableCell>
                <TableCell>Product ID</TableCell>
                <TableCell>Lot</TableCell>
                <TableCell>Issue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocs.map(doc => (
                <TableRow key={doc.id} hover>
                  <TableCell>{doc.Document_id}</TableCell>
                  <TableCell>{doc.Product_id}</TableCell>
                  <TableCell>{doc.Lot_No}</TableCell>
                  <TableCell>{doc.Issue_Found}</TableCell>
                  <TableCell>
                    <Chip label={doc.status} color={statusColors[doc.status]} />
                  </TableCell>
                  <TableCell>
                    <IconButton component={RouterLink} to={`/view/${doc.Document_id}`}>
                      <VisibilityIcon/>
                    </IconButton>
                    {doc.status === 'Created' && (
                      <Button
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleAccept(doc)}
                      >
                        Accept
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <Grid container spacing={2}>
          {filteredDocs.map(doc => (
            <Grid item xs={12} md={6} lg={4} key={doc.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform .2s',
                  '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 }
                }}
              >
                <CardContent sx={{ flexGrow:1 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">{doc.Document_id}</Typography>
                    <Chip label={doc.status} color={statusColors[doc.status]} size="small"/>
                  </Box>
                  <Divider sx={{ my:1 }}/>
                  <Typography><strong>Product:</strong> {doc.Product_id}</Typography>
                  <Typography><strong>Lot:</strong> {doc.Lot_No}</Typography>
                  <Typography><strong>Issue:</strong> {doc.Issue_Found}</Typography>
                </CardContent>
                <CardActions sx={{ justifyContent:'space-between', p:1 }}>
                  <IconButton component={RouterLink} to={`/view/${doc.Document_id}`}>
                    <VisibilityIcon/>
                  </IconButton>
                  {doc.status === 'Created' && (
                    <IconButton onClick={() => handleAccept(doc)} color="primary">
                      <CheckCircleIcon/>
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(n => ({ ...n, open: false }))}
      >
        <Alert severity={notification.severity}>{notification.message}</Alert>
      </Snackbar>
    </Box>
  );
}
