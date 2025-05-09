// client/src/pages/DocumentForm.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Stack,
  MenuItem,
  useTheme,
  Autocomplete,
  Alert,
  debounce
} from '@mui/material';
import { PhotoCamera, CheckCircleOutline } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const steps = ['Product Info', 'Issue Details', 'Attachments', 'Confirm'];
const PRODUCT_TYPES = [
  'วัตถุดิบ',
  'ระหว่างกระบวนการผลิต',
  'ผลิตภัณฑ์สำเร็จรูป',
  'อื่นๆ'
];
const DEPARTMENTS = ['R&D', 'Production', 'Quality Control', 'Sales', 'Marketing', 'Logistics'];

export default function DocumentForm() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    productType: '',
    productId: '',
    snNumber: '',
    description: '',
    lotNo: '',
    size: '',
    quantity: '',
    issueFound: '',
    foundeeName: '',
    department: '',
    whatHappened: '',
    preventionMeasure: '',
    picture1: null,
    picture2: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
  
  // Preview states
  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);
  
  // Autocomplete states
  const [erpItems, setErpItems] = useState([]);
  const [erpLoading, setErpLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch ERP items based on search query
  const fetchERPItems = React.useMemo(
    () =>
      debounce(async (query) => {
        if (query.length < 2) {
          setErpItems([]);
          return;
        }
        
        setErpLoading(true);
        try {
          const response = await axios.get(`/api/erp/items?query=${query}`);
          setErpItems(response.data);
        } catch (error) {
          console.error('Error fetching ERP items:', error);
        } finally {
          setErpLoading(false);
        }
      }, 300),
    []
  );

  const handleChange = e => {
    const { name, value, files } = e.target;
    
    if (files) {
      // Handle file input
      setFormData(prev => ({ ...prev, [name]: files[0] }));
      
      // Create preview for images
      if (name === 'picture1' || name === 'picture2') {
        const file = files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (name === 'picture1') {
              setPreview1(reader.result);
            } else {
              setPreview2(reader.result);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    } else {
      // Handle text input
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAutocompleteChange = (event, newValue) => {
    setSelectedItem(newValue);
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        productId: newValue.itemId,
        description: newValue.description
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        productId: '',
        description: ''
      }));
    }
  };

  const validateStep = step => {
    const errs = {};
    if (step === 0) {
      ['productType','productId','lotNo','quantity'].forEach(f => {
        if (!formData[f]) errs[f] = 'Required';
      });
      if (formData.quantity && isNaN(Number(formData.quantity))) errs.quantity = 'Must be a number';
    }
    if (step === 1) {
      ['issueFound','foundeeName','department','whatHappened','preventionMeasure'].forEach(f => {
        if (!formData[f]) errs[f] = 'Required';
      });
    }
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      if (validateStep(activeStep)) setActiveStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  
const handleSubmit = async () => {
  setLoading(true);
  const payload = new FormData();
  
  // Add all text fields
  Object.entries(formData).forEach(([k, v]) => {
    if (k !== 'picture1' && k !== 'picture2' && v !== null && v !== '') {
      payload.append(k, v);
    }
  });
  
  // Add files if they exist
  if (formData.picture1) {
    payload.append('picture1', formData.picture1);
  }
  
  if (formData.picture2) {
    payload.append('picture2', formData.picture2);
  }

  // Debug payload
  console.log('Submitting form with the following data:');
  for (let pair of payload.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
  }

  try {
    const response = await axios.post('/api/documents/', payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    console.log('Submit response:', response.data);
    
    setFeedback({ 
      open: true, 
      message: 'Document submitted successfully!', 
      severity: 'success' 
    });
    
    // Get current role and redirect to appropriate dashboard
    const role = localStorage.getItem('role').toLowerCase();
    setTimeout(() => navigate(`/${role}`), 1500);
  } catch (err) {
    console.error('[DocumentForm] submit error:', err);
    setFeedback({
      open: true,
      message: err.response?.data?.message || 'Submit failed',
      severity: 'error'
    });
    setLoading(false);
  }
};
  const StepContent = () => {
    const common = { fullWidth: true, variant: 'outlined', size: 'medium' };
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Product Type / ประเภทสินค้า"
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                error={!!errors.productType}
                helperText={errors.productType}
                {...common}
              >
                {PRODUCT_TYPES.map(pt => (
                  <MenuItem key={pt} value={pt}>{pt}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                options={erpItems}
                getOptionLabel={(option) => option ? option.itemId : ''}
                loading={erpLoading}
                value={selectedItem}
                onChange={handleAutocompleteChange}
                onInputChange={(event, newInputValue) => {
                  fetchERPItems(newInputValue);
                }}
                isOptionEqualToValue={(option, value) => option && value && option.itemId === value.itemId}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Product ID / รหัสสินค้า"
                    error={!!errors.productId}
                    helperText={errors.productId || "Type to search Product ID or Description"}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {erpLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <div>
                      <strong>{option.itemId}</strong>
                      <br />
                      <span style={{ fontSize: '0.85em', color: 'gray' }}>{option.description}</span>
                    </div>
                  </li>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Serial Number"
                name="snNumber"
                value={formData.snNumber}
                onChange={handleChange}
                {...common}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Description / รายละเอียด"
                name="description"
                value={formData.description}
                InputProps={{ readOnly: true }}
                {...common}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Lot Number"
                name="lotNo"
                value={formData.lotNo}
                onChange={handleChange}
                error={!!errors.lotNo}
                helperText={errors.lotNo}
                {...common}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Size"
                name="size"
                value={formData.size}
                onChange={handleChange}
                {...common}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                error={!!errors.quantity}
                helperText={errors.quantity}
                InputProps={{ inputProps: { min: 1 } }}
                {...common}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Issue Found"
                name="issueFound"
                multiline
                rows={2}
                value={formData.issueFound}
                onChange={handleChange}
                error={!!errors.issueFound}
                helperText={errors.issueFound}
                {...common}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Foundee Name"
                name="foundeeName"
                value={formData.foundeeName}
                onChange={handleChange}
                error={!!errors.foundeeName}
                helperText={errors.foundeeName}
                {...common}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                error={!!errors.department}
                helperText={errors.department}
                {...common}
              >
                {DEPARTMENTS.map(d => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="What Happened"
                name="whatHappened"
                multiline
                rows={3}
                value={formData.whatHappened}
                onChange={handleChange}
                error={!!errors.whatHappened}
                helperText={errors.whatHappened}
                {...common}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Prevention Measure"
                name="preventionMeasure"
                multiline
                rows={3}
                value={formData.preventionMeasure}
                onChange={handleChange}
                error={!!errors.preventionMeasure}
                helperText={errors.preventionMeasure}
                {...common}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            {/* Upload Picture 1 */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                  sx={{ height: '56px', borderColor: theme.palette.primary.main }}
                >
                  {formData.picture1?.name || "Upload Picture 1"}
                  <input
                    type="file"
                    hidden
                    name="picture1"
                    accept="image/*"
                    onChange={handleChange}
                  />
                </Button>
                
                {preview1 && (
                  <Box sx={{ 
                    mt: 2, 
                    border: '1px solid #ccc', 
                    borderRadius: 1,
                    overflow: 'hidden',
                    height: 200,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: 'background.paper'
                  }}>
                    <img 
                      src={preview1} 
                      alt="Preview 1" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        objectFit: 'contain' 
                      }} 
                    />
                  </Box>
                )}
              </Box>
            </Grid>
            
            {/* Upload Picture 2 */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                  sx={{ height: '56px', borderColor: theme.palette.primary.main }}
                >
                  {formData.picture2?.name || "Upload Picture 2"}
                  <input
                    type="file"
                    hidden
                    name="picture2"
                    accept="image/*"
                    onChange={handleChange}
                  />
                </Button>
                
                {preview2 && (
                  <Box sx={{ 
                    mt: 2, 
                    border: '1px solid #ccc', 
                    borderRadius: 1,
                    overflow: 'hidden',
                    height: 200,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: 'background.paper'
                  }}>
                    <img 
                      src={preview2} 
                      alt="Preview 2" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        objectFit: 'contain' 
                      }} 
                    />
                  </Box>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                Please upload images in JPG, PNG, or GIF format. Maximum file size is 5MB.
              </Alert>
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Box>
            <Typography variant="subtitle1" mb={1}>
              Review your entries:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2"><strong>Product Type:</strong> {formData.productType}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Product ID:</strong> {formData.productId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Serial #:</strong> {formData.snNumber}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2"><strong>Description:</strong> {formData.description}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Lot No:</strong> {formData.lotNo}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Quantity:</strong> {formData.quantity}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2"><strong>Issue Found:</strong> {formData.issueFound}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2"><strong>What Happened:</strong> {formData.whatHappened}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2"><strong>Prevention Measure:</strong> {formData.preventionMeasure}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Files Attached:</strong> {formData.picture1 || formData.picture2 ? 'Yes' : 'No'}
                    {formData.picture1 && ` (${formData.picture1.name})`}
                    {formData.picture2 && `, (${formData.picture2.name})`}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 5 }}>
      <Typography variant="h4" align="center" gutterBottom color="primary">
        Non‑Conformance Report
      </Typography>
      <Paper elevation={4} sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((label, idx) => (
            <Step key={label}>
              <StepLabel
                StepIconComponent={idx === activeStep ? CheckCircleOutline : undefined}
                sx={{
                  '& .MuiStepIcon-root.Mui-active': { color: theme.palette.primary.main },
                  '& .MuiStepLabel-label.Mui-active': { fontWeight: 'bold' }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box>{StepContent()}</Box>

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
          <Button onClick={handleBack} disabled={activeStep === 0 || loading}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            sx={{ px: 3 }}
          >
            {activeStep === steps.length - 1
              ? (loading ? <CircularProgress size={20} /> : 'Submit')
              : 'Next'}
          </Button>
        </Stack>
      </Paper>

      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback(f => ({ ...f, open: false }))}
      >
        <Alert 
          onClose={() => setFeedback(f => ({ ...f, open: false }))} 
          severity={feedback.severity}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}