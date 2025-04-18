// client/src/pages/DocumentForm.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const productTypes = ['Type A', 'Type B', 'Type C', 'Type D', 'Type E'];
const departments = ['R&D', 'Production', 'Quality Control', 'Sales', 'Marketing', 'Logistics'];

const DocumentForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productType: '',
    productId: '',
    lotNo: '',
    size: '',
    quantity: '',
    issueFound: '',
    foundeeName: '',
    department: '',
    subsidiary: '',
    whatHappened: '',
    preventionMeasure: '',
    picture1: null,
    picture2: null,
    status: 'Inform NC',
  });

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Handle text/select input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  // Handle file uploads
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
      
      // Clear error for this field
      if (formErrors[name]) {
        setFormErrors({ ...formErrors, [name]: '' });
      }
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      'productType', 'productId', 'lotNo', 'quantity', 
      'issueFound', 'foundeeName', 'department', 
      'whatHappened', 'preventionMeasure'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = 'This field is required';
      }
    });
    
    // Validate quantity is a number
    if (formData.quantity && isNaN(Number(formData.quantity))) {
      errors.quantity = 'Quantity must be a number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // For file uploads, we need to use FormData
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        // Only append if value is not null
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication error. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Send the request
      const response = await axios.post('/api/documents/create', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });
      
      console.log('Document created:', response.data);
      setSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        productType: '',
        productId: '',
        lotNo: '',
        size: '',
        quantity: '',
        issueFound: '',
        foundeeName: '',
        department: '',
        subsidiary: '',
        whatHappened: '',
        preventionMeasure: '',
        picture1: null,
        picture2: null,
        status: 'Inform NC',
      });
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/saleco');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating document:', err);
      
      // Handle different types of errors
      if (err.response) {
        // The server responded with an error status
        const message = err.response.data.message || 'Error creating document';
        setError(message);
        
        // Handle authentication errors
        if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
          // Optionally redirect to login
          // navigate('/login');
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your connection.');
      } else {
        // Something else happened while setting up the request
        setError('Error creating document. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate('/saleco');
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>Create New Document</Typography>
      
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Product Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!formErrors.productType}>
                  <InputLabel id="productType-label">Product Type *</InputLabel>
                  <Select
                    labelId="productType-label"
                    name="productType"
                    value={formData.productType}
                    label="Product Type *"
                    onChange={handleChange}
                    required
                  >
                    {productTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                  {formErrors.productType && (
                    <FormHelperText>{formErrors.productType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="productId"
                  label="Product ID *"
                  fullWidth
                  value={formData.productId}
                  onChange={handleChange}
                  required
                  error={!!formErrors.productId}
                  helperText={formErrors.productId}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="lotNo"
                  label="Lot Number *"
                  fullWidth
                  value={formData.lotNo}
                  onChange={handleChange}
                  required
                  error={!!formErrors.lotNo}
                  helperText={formErrors.lotNo}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  name="size"
                  label="Size"
                  fullWidth
                  value={formData.size}
                  onChange={handleChange}
                  error={!!formErrors.size}
                  helperText={formErrors.size}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="quantity"
                  label="Quantity *"
                  type="number"
                  fullWidth
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  error={!!formErrors.quantity}
                  helperText={formErrors.quantity}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" color="primary" gutterBottom>
                  Issue Details
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="issueFound"
                  label="Issue Found *"
                  fullWidth
                  value={formData.issueFound}
                  onChange={handleChange}
                  required
                  error={!!formErrors.issueFound}
                  helperText={formErrors.issueFound}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="foundeeName"
                  label="Foundee Name *"
                  fullWidth
                  value={formData.foundeeName}
                  onChange={handleChange}
                  required
                  error={!!formErrors.foundeeName}
                  helperText={formErrors.foundeeName}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.department}>
                  <InputLabel id="department-label">Department *</InputLabel>
                  <Select
                    labelId="department-label"
                    name="department"
                    value={formData.department}
                    label="Department *"
                    onChange={handleChange}
                    required
                  >
                    {departments.map(dept => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                  {formErrors.department && (
                    <FormHelperText>{formErrors.department}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="subsidiary"
                  label="Subsidiary"
                  fullWidth
                  value={formData.subsidiary}
                  onChange={handleChange}
                  error={!!formErrors.subsidiary}
                  helperText={formErrors.subsidiary}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="whatHappened"
                  label="What Happened *"
                  multiline
                  rows={4}
                  fullWidth
                  value={formData.whatHappened}
                  onChange={handleChange}
                  required
                  error={!!formErrors.whatHappened}
                  helperText={formErrors.whatHappened}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="preventionMeasure"
                  label="Prevention Measure *"
                  multiline
                  rows={4}
                  fullWidth
                  value={formData.preventionMeasure}
                  onChange={handleChange}
                  required
                  error={!!formErrors.preventionMeasure}
                  helperText={formErrors.preventionMeasure}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" color="primary" gutterBottom>
                  Attachments
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                  fullWidth
                  sx={{ height: '56px' }}
                  color={formErrors.picture1 ? "error" : "primary"}
                >
                  Upload Picture 1
                  <input
                    type="file"
                    name="picture1"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
                {formData.picture1 && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {formData.picture1.name}
                  </Typography>
                )}
                {formErrors.picture1 && (
                  <FormHelperText error>{formErrors.picture1}</FormHelperText>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                  fullWidth
                  sx={{ height: '56px' }}
                  color={formErrors.picture2 ? "error" : "primary"}
                >
                  Upload Picture 2
                  <input
                    type="file"
                    name="picture2"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
                {formData.picture2 && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {formData.picture2.name}
                  </Typography>
                )}
                {formErrors.picture2 && (
                  <FormHelperText error>{formErrors.picture2}</FormHelperText>
                )}
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Button 
                    variant="outlined" 
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Submitting...' : 'Submit Document'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Document created successfully! Redirecting to dashboard...
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentForm;