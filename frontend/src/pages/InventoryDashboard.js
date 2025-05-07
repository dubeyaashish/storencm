// client/src/pages/InventoryDashboard.js
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
  Tooltip,
  useTheme,
  alpha,
  Pagination,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  Delete as DeleteIcon
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
  'Rejected': 'error',
  'Send to Manufacture': 'warning',
  'Send to Environment': 'success'
};

export default function InventoryDashboard() {
  const theme = useTheme();
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [stats, setStats] = useState({ total:0, created:0, accepted:0, completed:0, rejected:0 });

  // Pagination states
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(9); // 9 for grid (3x3), 10 for table

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
    const completed = docs.filter(d => d.status === 'Completed' || 
                                      d.status === 'Send to Manufacture' || 
                                      d.status === 'Send to Environment').length;
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
      fd = fd.filter(d => ['Completed', 'Rejected', 'Send to Manufacture', 'Send to Environment'].includes(d.status));
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
    setPage(1); // Reset to first page when filters change
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

  // Handle document deletion
  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/documents/${docId}`);
      
      // Remove document from state
      const updatedDocs = docs.filter(doc => doc.id !== docId);
      setDocs(updatedDocs);
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Document deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting document:', err);
      // Show error notification
      setNotification({
        open: true,
        message: err.response?.data?.message || 'Error deleting document',
        severity: 'error'
      });
    }
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Calculate current documents to display
  const currentDocs = filteredDocs.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ p:3, textAlign:'center' }}>
        <Typography variant="h4">Inventory Dashboard</Typography>
        <CircularProgress sx={{ mt:2 }} />
      </Box>
    );
  }

  return (
    <>
        <Helmet>
              <title>Inventory</title>
        </Helmet>

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
          
          {/* Add Create Document Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/inventory/create"
          >
            New Document
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          ['Total', stats.total, '#2196f3', '#e3f2fd'],
          ['Created', stats.created, '#ff9800', '#fff3e0'],
          ['Accepted', stats.accepted, '#9c27b0', '#f3e5f5'],
          ['Completed', stats.completed, '#4caf50', '#e8f5e9'],
          ['Rejected', stats.rejected, '#f44336', '#ffebee']
        ].map(([label, value, textColor, bgColor]) => (
          <Grid item xs={6} md={2.4} key={label}>
            <Card
              elevation={3}
              sx={{
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(textColor, 0.2)  // Darker theme: use semi-transparent color
                  : bgColor,               // Light theme: use light background
                border: `1px solid ${textColor}`,
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`,
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                overflow: 'hidden',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  backgroundColor: textColor,
                }
              }}
            >
              <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: textColor,
                    textShadow: theme.palette.mode === 'dark' 
                      ? '0 0 10px rgba(0,0,0,0.5)' 
                      : 'none'
                  }}
                >
                  {value}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: textColor,
                    opacity: 0.8,
                    fontWeight: 500
                  }}
                >
                  {label}
                </Typography>
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
      {viewMode === 'table' && currentDocs.length > 0 && (
        <TableContainer component={Paper} sx={{ mt:2 }}>
          <Table>
            <TableHead>
              <TableRow>
              <TableCell>Product ID</TableCell>
                <TableCell>Lot No</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Issue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentDocs.map(doc => (
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
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View details">
                        <IconButton component={RouterLink} to={`/view/${doc.Document_id}`} size="small">
                          <VisibilityIcon fontSize="small"/>
                        </IconButton>
                      </Tooltip>
                      
                      {doc.status === 'Created' && (
                        <>
                          <Tooltip title="Accept document">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleAccept(doc)}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete document">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(doc.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && currentDocs.length > 0 && (
        <Grid container spacing={2}>
          {currentDocs.map(doc => (
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
                    <InventoryIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
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
                  
                  <Tooltip title={doc.Issue_Description || 'No description'}>
                    <Typography variant="body2" gutterBottom sx={{ cursor: 'help' }}>
                      <strong>Issue Description:</strong> {truncateText(doc.Issue_Description, 70) || 'N/A'}
                    </Typography>
                  </Tooltip>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Foundee:</strong> {doc.Foundee || 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Department:</strong> {doc.Department || 'N/A'}
                  </Typography>
                  
                  {/* QA info if available */}
                  {doc.QAName && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>QA Accepted:</strong> {doc.QAName} 
                      {doc.QATimeStamp && ` (${formatDate(doc.QATimeStamp)})`}
                    </Typography>
                  )}
                  
                  {/* Inventory info if available */}
                  {doc.InventoryName && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Inventory Accepted:</strong> {doc.InventoryName}
                      {doc.InventoryTimeStamp && ` (${formatDate(doc.InventoryTimeStamp)})`}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent:'space-between', p:1 }}>
                  <IconButton component={RouterLink} to={`/view/${doc.Document_id}`}>
                    <VisibilityIcon/>
                  </IconButton>
                  
                  {doc.status === 'Created' && (
                    <>
                      <Button
                        variant="contained" 
                        color="primary"
                        size="small"
                        startIcon={<CheckCircleIcon/>}
                        onClick={() => handleAccept(doc)}
                      >
                        Accept
                      </Button>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(doc.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {filteredDocs.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={Math.ceil(filteredDocs.length / rowsPerPage)} 
            page={page} 
            onChange={handlePageChange}
            color="primary"
            showFirstButton 
            showLastButton
          />
        </Box>
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