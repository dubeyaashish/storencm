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
  Snackbar
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

// Status chip color mapping
const statusColors = {
  'Inform NC': 'warning',
  'Accepted': 'info',
  'In Progress': 'primary',
  'Completed': 'success',
  'Rejected': 'error'
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
        doc.documentNumber?.toLowerCase().includes(term) ||
        doc.productType?.toLowerCase().includes(term) ||
        doc.status?.toLowerCase().includes(term) ||
        doc.issueFound?.toLowerCase().includes(term)
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
      <Grid container spacing={2} sx={{ mt: 2 }}>
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
                {doc.qaName && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>QA:</strong> {doc.qaName}
                  </Typography>
                )}
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                <IconButton 
                  size="small" 
                  component={RouterLink} 
                  to={`/saleco/view/${doc.Document_id}`}
                  title="View details"
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => handleDelete(doc.id)}
                  title="Delete document"
                  color="error"
                  disabled={doc.status !== 'Inform NC'}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
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