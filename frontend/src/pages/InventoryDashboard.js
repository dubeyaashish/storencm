// client/src/pages/InventoryDashboard.js
import React, { useEffect, useState } from 'react';
import {
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
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
  ToggleButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

// Status chip color mapping
const statusColors = {
  'Inform NC': 'warning',
  'Accepted': 'info',
  'In Progress': 'primary',
  'Completed': 'success',
  'Rejected': 'error'
};

const InventoryDashboard = () => {
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Stats for summary cards
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    rejected: 0
  });

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Calculate stats when docs change
  useEffect(() => {
    if (docs.length) {
      const newStats = {
        total: docs.length,
        pending: docs.filter(doc => doc.status === 'Inform NC').length,
        accepted: docs.filter(doc => doc.status === 'Accepted').length,
        completed: docs.filter(doc => doc.status === 'Completed').length,
        rejected: docs.filter(doc => doc.status === 'Rejected').length
      };
      setStats(newStats);
    }
  }, [docs]);

  // Filter documents when search term or tab changes
  useEffect(() => {
    if (!docs.length) {
      setFilteredDocs([]);
      return;
    }
    
    let filtered = [...docs];
    
    // Filter by tab value (status)
    if (tabValue === 0) {
      // All documents
    } else if (tabValue === 1) {
      // Pending (Inform NC)
      filtered = filtered.filter(doc => doc.status === 'Inform NC');
    } else if (tabValue === 2) {
      // Accepted
      filtered = filtered.filter(doc => doc.status === 'Accepted');
    } else if (tabValue === 3) {
      // Completed
      filtered = filtered.filter(doc => 
        doc.status === 'Completed' || doc.status === 'Rejected'
      );
    }
    
    // Then filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.documentNumber?.toLowerCase().includes(term) ||
        doc.productType?.toLowerCase().includes(term) ||
        doc.issueFound?.toLowerCase().includes(term) ||
        doc.lotNo?.toLowerCase().includes(term)
      );
    }
    
    setFilteredDocs(filtered);
  }, [searchTerm, tabValue, docs]);

  // Fetch documents from API
  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/documents/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDocs(response.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
        } else {
          setError(err.response.data.message || 'Error fetching documents');
        }
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError('Error fetching documents. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle view mode change
  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>Inventory Dashboard</Typography>
        <CircularProgress sx={{ mt: 4 }} />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading documents...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with search and view toggle */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={2}
      >
        <Typography variant="h4">Inventory Dashboard</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search documents..."
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ minWidth: 200 }}
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
            onChange={handleViewModeChange}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="grid" aria-label="grid view">
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Stats cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ bgcolor: '#f5f5f5' }}>
            <CardContent sx={{ py: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="text.primary">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ bgcolor: statusColors['Inform NC'] + '22' }}>
            <CardContent sx={{ py: 1, textAlign: 'center' }}>
              <Typography variant="h4" color={statusColors['Inform NC']}>{stats.pending}</Typography>
              <Typography variant="body2" color="text.secondary">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ bgcolor: statusColors['Accepted'] + '22' }}>
            <CardContent sx={{ py: 1, textAlign: 'center' }}>
              <Typography variant="h4" color={statusColors['Accepted']}>{stats.accepted}</Typography>
              <Typography variant="body2" color="text.secondary">Accepted</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ bgcolor: statusColors['Completed'] + '22' }}>
            <CardContent sx={{ py: 1, textAlign: 'center' }}>
              <Typography variant="h4" color={statusColors['Completed']}>{stats.completed}</Typography>
              <Typography variant="body2" color="text.secondary">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ bgcolor: statusColors['Rejected'] + '22' }}>
            <CardContent sx={{ py: 1, textAlign: 'center' }}>
              <Typography variant="h4" color={statusColors['Rejected']}>{stats.rejected}</Typography>
              <Typography variant="body2" color="text.secondary">Rejected</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status tabs */}
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="All Documents" />
        <Tab label="Pending" />
        <Tab label="Accepted" />
        <Tab label="Completed" />
      </Tabs>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* No documents message */}
      {!error && filteredDocs.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {searchTerm ? 'No documents match your search.' : 'No documents found in this category.'}
        </Alert>
      )}

      {/* Table view */}
      {viewMode === 'table' && filteredDocs.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table sx={{ minWidth: 650 }} aria-label="documents table">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Document #</TableCell>
                <TableCell>Product Type</TableCell>
                <TableCell>Lot Number</TableCell>
                <TableCell>Issue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>QA Name</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocs.map((doc) => (
                <TableRow key={doc.id} sx={{ '&:hover': { bgcolor: '#f9f9f9' } }}>
                  <TableCell>{doc.documentNumber || `Doc #${doc.id}`}</TableCell>
                  <TableCell>{doc.productType}</TableCell>
                  <TableCell>{doc.lotNo}</TableCell>
                  <TableCell>{doc.issueFound}</TableCell>
                  <TableCell>
                    <Chip 
                      label={doc.status} 
                      color={statusColors[doc.status] || 'default'} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{doc.qaName || '—'}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      component={RouterLink} 
                      to={`/inventory/view/${doc.id}`}
                      title="View details"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {filteredDocs.map((doc) => (
            <Grid item xs={12} md={6} lg={4} key={doc.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" gutterBottom>{doc.documentNumber || `Document #${doc.id}`}</Typography>
                    <Chip 
                      label={doc.status} 
                      color={statusColors[doc.status] || 'default'} 
                      size="small"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Product:</strong> {doc.productType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Lot No:</strong> {doc.lotNo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Issue:</strong> {doc.issueFound}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>QA:</strong> {doc.qaName || '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {new Date(doc.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                  <IconButton 
                    size="small" 
                    component={RouterLink} 
                    to={`/inventory/view/${doc.id}`}
                    title="View details"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryDashboard;