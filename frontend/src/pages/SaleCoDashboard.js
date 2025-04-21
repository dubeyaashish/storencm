// client/src/pages/SaleCoDashboard.js
import React, { useEffect, useState } from 'react';
import {
  Box, 
  Typography, 
  Button, 
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
  Snackbar,
  Tooltip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
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

const SaleCoDashboard = () => {
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter documents when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDocs(docs);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = docs.filter(doc => 
        (doc.Document_id?.toLowerCase().includes(term)) ||
        (doc.Product_id?.toString().includes(term)) ||
        (doc.status?.toLowerCase().includes(term)) ||
        (doc.Issue_Found?.toLowerCase().includes(term)) ||
        (doc.Description?.toLowerCase().includes(term)) ||
        (doc.Lot_No?.toLowerCase().includes(term))
      );
      setFilteredDocs(filtered);
    }
  }, [searchTerm, docs]);

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
      setFilteredDocs(response.data);
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

  // Handle document deletion
  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h6" gutterBottom>Documents</Typography>
        <CircularProgress sx={{ mt: 4 }} />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading documents...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with search and create button */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        <Typography variant="h5">Documents</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
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
        </Box>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* No documents message */}
      {!error && filteredDocs.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {searchTerm ? 'No documents match your search.' : 'No documents found. Create a new document to get started.'}
        </Alert>
      )}

      {/* Documents grid */}
      <Grid container spacing={2}>
        {filteredDocs.map((doc) => (
          <Grid item xs={12} md={6} lg={4} key={doc.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" component="div">
                    {doc.Document_id || `Document #${doc.id}`}
                  </Typography>
                  <Chip 
                    label={doc.status} 
                    color={statusColors[doc.status] || 'default'} 
                    size="small"
                  />
                </Box>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(doc.date)}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Typography variant="body2" gutterBottom>
                  <strong>Product ID:</strong> {doc.Product_id || 'N/A'}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>Lot No:</strong> {doc.Lot_No || 'N/A'}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>Size:</strong> {doc.Product_size || 'N/A'}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  <strong>Quantity:</strong> {doc.Quantity || 'N/A'}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Typography variant="body2" gutterBottom>
                  <strong>Issue:</strong> {truncateText(doc.Issue_Found, 50) || 'N/A'}
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
                
                {doc.QAName && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      <strong>QA Accepted By:</strong> {doc.QAName} 
                      {doc.QATimeStamp && ` (${formatDate(doc.QATimeStamp)})`}
                    </Typography>
                  </>
                )}
                
                {doc.InventoryName && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Inventory Accepted By:</strong> {doc.InventoryName}
                    {doc.InventoryTimeStamp && ` (${formatDate(doc.InventoryTimeStamp)})`}
                  </Typography>
                )}
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                <Tooltip title="View details">
                  <IconButton 
                    size="small" 
                    component={RouterLink} 
                    to={`/saleco/view/${doc.Document_id}`}
                    color="primary"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete document">
                  <span>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(doc.id)}
                      color="error"
                      disabled={doc.status !== 'Created'}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
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

export default SaleCoDashboard;