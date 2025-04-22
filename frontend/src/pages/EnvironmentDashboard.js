// client/src/pages/EnvironmentDashboard.js
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
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
  Button,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  Nature as EnvironmentIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

// Status chip color mapping
const statusColors = {
  'Created': 'warning',
  'Accepted by Inventory': 'info',
  'Accepted by QA': 'info',
  'Accepted by Both': 'success',
  'Send to Manufacture': 'warning',
  'Send to Environment': 'success',
  'Accepted by Environment': 'success',
  'Completed': 'success',
  'Rejected': 'error'
};

export default function EnvironmentDashboard() {
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [stats, setStats] = useState({ 
    total: 0, 
    waiting: 0, 
    accepted: 0, 
    completed: 0
  });

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
    const total = docs.length;
    const waiting = docs.filter(d => d.status === 'Send to Environment').length;
    const accepted = docs.filter(d => d.status === 'Accepted by Environment').length;
    const completed = docs.filter(d => d.status === 'Completed').length;
    
    setStats({ total, waiting, accepted, completed });
  }, [docs]);

  // Filter documents on search or tab change
  useEffect(() => {
    let fd = [...docs];
    // Only show documents sent to environment
    fd = fd.filter(d => 
      d.status === 'Send to Environment' || 
      d.status === 'Accepted by Environment' || 
      d.status === 'Completed'
    );
    
    if (tabValue === 1) {
      fd = fd.filter(d => d.status === 'Send to Environment');
    } else if (tabValue === 2) {
      fd = fd.filter(d => d.status === 'Accepted by Environment');
    } else if (tabValue === 3) {
      fd = fd.filter(d => d.status === 'Completed');
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      fd = fd.filter(d =>
        (d.Document_id && d.Document_id.toLowerCase().includes(term)) ||
        (d.Product_id && d.Product_id.toString().includes(term)) ||
        (d.Issue_Found && d.Issue_Found.toLowerCase().includes(term)) ||
        (d.Lot_No && d.Lot_No.toLowerCase().includes(term)) ||
        (d.Description && d.Description.toLowerCase().includes(term))
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

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Truncate text for display
  const truncateText = (text, maxLength = 100) => {
    if (!text) return "N/A";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Handle Environment accept
  const handleAccept = async (doc) => {
    if (!window.confirm('Accept this document for environmental assessment?')) return;
    try {
      // The endpoint would need to be created on the backend
      await axios.post(`/api/documents/${doc.id}/accept-environment`);
      
      // Update state locally until backend endpoint is available
      setDocs(docs.map(d => {
        if (d.id !== doc.id) return d;
        return {
          ...d,
          status: 'Accepted by Environment',
          EnvironmentName: localStorage.getItem('userName') || 'Environment',
          EnvironmentTimeStamp: new Date().toISOString()
        };
      }));
      
      setNotification({ 
        open: true, 
        message: 'Document accepted for environmental assessment', 
        severity: 'success' 
      });
    } catch (err) {
      console.error('Error accepting for environment:', err);
      setNotification({ 
        open: true, 
        message: err.response?.data?.message || 'Accept failed', 
        severity: 'error' 
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ p:3, textAlign:'center' }}>
        <Typography variant="h4">Environment Dashboard</Typography>
        <CircularProgress sx={{ mt:2 }} />
      </Box>
    );
  }

  return (
    <>
        <Helmet>
              <title>Environment</title>
        </Helmet>
    <Box sx={{ p:3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Typography variant="h4">Environment Dashboard</Typography>
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
          ['Waiting', stats.waiting],
          ['Accepted', stats.accepted],
          ['Completed', stats.completed]
        ].map(([label, value]) => (
          <Grid item xs={6} md={3} key={label}>
            <Card sx={{ 
              bgcolor: theme => theme.palette.mode === 'dark' ? '#1e2a3a' : '#f5f5f5',
              boxShadow: 2,
              border: theme => `1px solid ${theme.palette.divider}`
            }}>
              <CardContent sx={{ py:2, textAlign:'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">{value}</Typography>
                <Typography variant="body1" color="text.primary" fontWeight="medium">{label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb:2 }}>
        <Tab label="All" />
        <Tab label="Waiting" />
        <Tab label="Accepted" />
        <Tab label="Completed" />
      </Tabs>

      {error && <Alert severity="error" sx={{ my:2 }}>{error}</Alert>}
      {!error && !filteredDocs.length && (
        <Alert severity="info">
          No documents found. Environment dashboards will only show documents that have been sent to environment.
        </Alert>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredDocs.length > 0 && (
        <TableContainer component={Paper} sx={{ mt:2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Doc #</TableCell>
                <TableCell>Product ID</TableCell>
                <TableCell>Lot No</TableCell>
                <TableCell>Quantity</TableCell>
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
                  <TableCell>{doc.Quantity}</TableCell>
                  <TableCell>{truncateText(doc.Issue_Found, 40)}</TableCell>
                  <TableCell>
                    <Chip label={doc.status} color={statusColors[doc.status]} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View details">
                      <IconButton component={RouterLink} to={`/view/${doc.Document_id}`}>
                        <VisibilityIcon/>
                      </IconButton>
                    </Tooltip>
                    {doc.status === 'Send to Environment' && (
                      <Tooltip title="Accept document">
                        <Button
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleAccept(doc)}
                          color="success"
                        >
                          Accept
                        </Button>
                      </Tooltip>
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
                  transition: 'transform .2s, box-shadow .2s',
                  '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 }
                }}
              >
                <CardContent sx={{ flexGrow:1 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="h6">{doc.Document_id}</Typography>
                    <Chip label={doc.status} color={statusColors[doc.status]} size="small"/>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(doc.date)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my:1 }}/>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Product ID:</strong> {doc.Product_id || 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Serial #:</strong> {doc.Sn_number || 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Description:</strong> {truncateText(doc.Description, 50) || 'N/A'}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" mt={1}>
                    <EnvironmentIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" gutterBottom>
                      <strong>Lot No:</strong> {doc.Lot_No || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Size:</strong> {doc.Product_size || 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Quantity:</strong> {doc.Quantity || 'N/A'}
                  </Typography>
                  
                  <Divider sx={{ my:1 }}/>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Issue Found:</strong> {truncateText(doc.Issue_Found, 50) || 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>QA Solution:</strong> {truncateText(doc.QASolution, 50) || 'N/A'}
                  </Typography>
                  
                  {/* QA info if available */}
                  {doc.QAName && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>QA Review By:</strong> {doc.QAName} 
                      {doc.QATimeStamp && ` (${formatDate(doc.QATimeStamp)})`}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent:'space-between', p:1 }}>
                  <IconButton component={RouterLink} to={`/view/${doc.Document_id}`}>
                    <VisibilityIcon/>
                  </IconButton>
                  {doc.status === 'Send to Environment' && (
                    <Button
                      variant="contained" 
                      color="success"
                      size="small"
                      startIcon={<CheckCircleIcon/>}
                      onClick={() => handleAccept(doc)}
                    >
                      Accept
                    </Button>
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
    </>
  );
}