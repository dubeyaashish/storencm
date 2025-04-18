// client/src/pages/DocumentForm.js
import React, { useState } from 'react';
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
  useTheme
} from '@mui/material';
import { PhotoCamera, CheckCircleOutline } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const steps = ['Product Info', 'Issue Details', 'Attachments', 'Confirm'];
const PRODUCT_TYPES = ['Type A', 'Type B', 'Type C', 'Type D', 'Type E'];
const DEPARTMENTS = ['R&D', 'Production', 'Quality Control', 'Sales', 'Marketing', 'Logistics'];

export default function DocumentForm() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    productType: '', productId: '', lotNo: '', size: '', quantity: '',
    issueFound: '', foundeeName: '', department: '', subsidiary: '',
    whatHappened: '', preventionMeasure: '', picture1: null, picture2: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  const handleChange = e => {
    const { name, value, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files ? files[0] : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
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
    } else handleSubmit();
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    const payload = new FormData();
    Object.entries(formData).forEach(([k,v]) => v && payload.append(k,v));
    try {
      await axios.post('/api/documents/', payload, { headers: {'Content-Type':'multipart/form-data'} });
      setFeedback({ open: true, message: 'Submitted successfully!', severity: 'success' });
      setTimeout(() => navigate('/saleco'), 1500);
    } catch (err) {
      setFeedback({ open: true, message: err.response?.data?.message || 'Submit failed', severity: 'error' });
      setLoading(false);
    }
  };

  const StepContent = () => {
    const commonProps = { fullWidth: true, variant: 'outlined', size: 'medium', sx: { background: '#fafafa' } };
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Product Type"
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                error={!!errors.productType}
                helperText={errors.productType}
                {...commonProps}
              >
                {PRODUCT_TYPES.map(pt => <MenuItem key={pt} value={pt}>{pt}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Product ID"
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                error={!!errors.productId}
                helperText={errors.productId}
                {...commonProps}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Lot Number"
                name="lotNo"
                value={formData.lotNo}
                onChange={handleChange}
                error={!!errors.lotNo}
                helperText={errors.lotNo}
                {...commonProps}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Size"
                name="size"
                value={formData.size}
                onChange={handleChange}
                {...commonProps}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                error={!!errors.quantity}
                helperText={errors.quantity}
                InputProps={{ inputProps: { min: 1 } }}
                {...commonProps}
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
                {...commonProps}
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
                {...commonProps}
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
                {...commonProps}
              >
                {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
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
                {...commonProps}
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
                {...commonProps}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            {['picture1', 'picture2'].map((name, i) => (
              <Grid item xs={12} md={6} key={name}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<PhotoCamera />}
                  sx={{ height: '56px', borderColor: theme.palette.primary.main }}
                >
                  {formData[name]?.name || `Upload Picture ${i+1}`}
                  <input type="file" hidden name={name} accept="image/*" onChange={handleChange} />
                </Button>
              </Grid>
            ))}
          </Grid>
        );
      case 3:
        return (
          <Box>
            <Typography variant="subtitle1" mb={1}>Review your entries:</Typography>
            <Paper variant="outlined" sx={{ background: '#f7f7f7', p: 2 }}>
              <pre style={{ margin: 0, fontFamily: 'inherit' }}>{JSON.stringify(formData, null, 2)}</pre>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 5 }}>
      <Typography variant="h4" align="center" gutterBottom color="primary">Non-Conformance Report</Typography>
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
              >{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box>{StepContent()}</Box>
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button onClick={handleBack} disabled={activeStep===0 || loading}>Back</Button>
          <Button variant="contained" onClick={handleNext} disabled={loading} sx={{ px: 3 }}>
            {activeStep === steps.length -1 ? (loading ? <CircularProgress size={20}/> : 'Submit') : 'Next'}
          </Button>
        </Stack>
      </Paper>
      <Snackbar open={feedback.open} autoHideDuration={6000} onClose={() => setFeedback(f => ({ ...f, open: false }))}
        message={feedback.message} />
    </Box>
  );
}
