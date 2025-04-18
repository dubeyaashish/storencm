// client/src/pages/QADashboard.js
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon
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

const QADashboard = () => {
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // QA Assessment dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState({
    solutions: '',
    comments: '',
    people1: '',
    people2: '',
    damageCost: '',
    dept: ''
  });

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

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
        doc.issueFound?.toLowerCase().includes(term)
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

  // Handle accepting a document
  const handleAccept = (doc) => {
    setCurrentDoc(doc);
    setDialogOpen(true);
  };

  // Handle assessment form change
  const handleAssessmentChange = (e) => {
    const { name, value } = e.target;
    setAssessmentForm({ ...assessmentForm, [name]: value });
  };

  // Handle assessment form submission
  const handleAssessmentSubmit = async () => {
    if (!currentDoc) return;
    
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const qaName = userData.name || 'QA User';
      
      // First, accept the document
      await axios.post('/api/documents/accept', 
        { id: currentDoc.id, qaName }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Then update with assessment details
      await axios.put(`/api/documents/${currentDoc.id}`,
        { 
          ...assessmentForm,
          status: 'Accepted' 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      const updatedDocs = docs.map(d => {
        if (d.id === currentDoc.id) {
          return { 
            ...d, 
            ...assessmentForm,
            status: 'Accepted',
            qaName
          };
        }
        return d;
      });
      
      setDocs(updatedDocs);
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Document accepted successfully',
        severity: 'success'
      });
      
      // Close dialog
      setDialogOpen(false);
      
      // Reset form
      setAssessmentForm({
        solutions: '',
        comments: '',
        people1: '',
        people2: '',
        damageCost: '',
        dept: ''
      });
      
    } catch (err) {
      console.error('Error accepting document:', err);
      
      // Show error notification
      setNotification({
        open: true,
        message: err.response?.data?.message || 'Error accepting document',
        severity: 'error'
      });
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>QA Dashboard</Typography>
        <CircularProgress sx={{ mt: 4 }} />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading documents...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with search */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={2}
      >
        <Typography variant="h4">QA Dashboard</Typography>
        
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

      {/* Documents grid */}
      <Grid container spacing={2}>
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
                  to={`/qa/view/${doc.id}`}
                  title="View details"
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                
                {doc.status === 'Inform NC' && (
                  <Button 
                    size="small" 
                    startIcon={<CheckCircleIcon />}
                    color="primary"
                    onClick={() => handleAccept(doc)}
                  >
                    Accept
                  </Button>
                )}
                
                {doc.status === 'Accepted' && (
                  <Button 
                    size="small" 
                    startIcon={<CheckCircleIcon />}
                    color="success"
                    onClick={() => {
                      // Implement complete functionality
                    }}
                  >
                    Complete
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* QA Assessment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>QA Assessment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Solutions"
                name="solutions"
                multiline
                rows={3}
                fullWidth
                value={assessmentForm.solutions}
                onChange={handleAssessmentChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Comments"
                name="comments"
                multiline
                rows={3}
                fullWidth
                value={assessmentForm.comments}
                onChange={handleAssessmentChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Person Responsible 1"
                name="people1"
                fullWidth
                value={assessmentForm.people1}
                onChange={handleAssessmentChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Person Responsible 2"
                name="people2"
                fullWidth
                value={assessmentForm.people2}
                onChange={handleAssessmentChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Damage Cost"
                name="damageCost"
                type="number"
                fullWidth
                value={assessmentForm.damageCost}
                onChange={handleAssessmentChange}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Department"
                name="dept"
                fullWidth
                value={assessmentForm.dept}
                onChange={handleAssessmentChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAssessmentSubmit} color="primary" variant="contained">
            Accept & Save
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default QADashboard;