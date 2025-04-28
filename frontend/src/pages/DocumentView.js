import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Paper, 
  Button, 
  Grid, 
  Divider,
  Chip,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import axios from 'axios';
import {
  ArrowBack as ArrowBackIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckCircleIcon,
  Factory as ManufactureIcon,
  Nature as EnvironmentIcon,
  Report as ReportIcon
} from '@mui/icons-material';

export default function DocumentView() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get(`/api/documents/view/${documentId}`)
      .then(res => {
        console.log('Document data:', res.data);
        setDoc(res.data);
      })
      .catch(err => {
        console.error('Error fetching document:', err);
        setError(err.response?.data?.message || 'Failed to load document');
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    const colors = {
      'Created': 'warning',
      'Accepted by Inventory': 'info',
      'Accepted by QA': 'info',
      'Accepted by Both': 'success',
      'Send to Manufacture': 'warning',
      'Send to Environment': 'success',
      'Accepted by Manufacture': 'primary',
      'Accepted by Environment': 'secondary',
      'Completed': 'success',
      'Rejected': 'error'
    };
    return colors[status] || 'default';
  };

  // Helper function to handle image URLs correctly
  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    
    // If the path already starts with http(s), it's an absolute URL
    if (imgPath.startsWith('http')) return imgPath;
    
    // If the path starts with a slash, it's relative to the server root
    if (imgPath.startsWith('/')) return imgPath;
    
    // Otherwise, prepend with /uploads/ for relative paths
    return `/uploads/${imgPath}`;
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box p={3}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Document {doc.Document_id}
        </Typography>
        <Chip 
          label={doc.status} 
          color={getStatusColor(doc.status)} 
          size="medium"
          icon={
            doc.status.includes('Environment') ? <EnvironmentIcon /> :
            doc.status.includes('Manufacture') ? <ManufactureIcon /> :
            doc.status.includes('QA') ? <CheckCircleIcon /> :
            doc.status.includes('Inventory') ? <InventoryIcon /> :
            <ReportIcon />
          }
        />
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography><strong>Product ID:</strong> {doc.Product_id}</Typography>
            <Typography><strong>Serial #:</strong> {doc.Sn_number}</Typography>
            <Typography><strong>Description:</strong> {doc.Description}</Typography>
            <Typography><strong>Lot No:</strong> {doc.Lot_No}</Typography>
            <Typography><strong>Size:</strong> {doc.Product_size}</Typography>
            <Typography><strong>Quantity:</strong> {doc.Quantity}</Typography>
            <Typography><strong>Date Created:</strong> {formatDate(doc.date)}</Typography>
          </Paper>
        </Grid>

        {/* Issue Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Issue Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography><strong>Issue Found:</strong> {doc.Issue_Found}</Typography>
            <Typography><strong>Issue Description:</strong> {doc.Issue_Description}</Typography>
            <Typography><strong>Foundee:</strong> {doc.Foundee}</Typography>
            <Typography><strong>Department:</strong> {doc.Department}</Typography>
            <Typography><strong>Prevention Measure:</strong> {doc.Prevention}</Typography>
          </Paper>
        </Grid>

        {/* Images */}
        {(doc.Img1 || doc.Img2) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Attached Images
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {doc.Img1 && (
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="300"
                        image={getImageUrl(doc.Img1)}
                        alt="Picture 1"
                        sx={{ objectFit: 'contain', bgcolor: 'grey.100' }}
                        onError={(e) => {
                          console.error('Error loading image:', doc.Img1);
                          e.target.src = '/placeholder-image.png'; // Fallback image
                          e.target.alt = 'Image not available';
                        }}
                      />
                      <CardContent>
                        <Typography variant="subtitle2">Picture 1</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Image path: {doc.Img1}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {doc.Img2 && (
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="300"
                        image={getImageUrl(doc.Img2)}
                        alt="Picture 2"
                        sx={{ objectFit: 'contain', bgcolor: 'grey.100' }}
                        onError={(e) => {
                          console.error('Error loading image:', doc.Img2);
                          e.target.src = '/placeholder-image.png'; // Fallback image
                          e.target.alt = 'Image not available';
                        }}
                      />
                      <CardContent>
                        <Typography variant="subtitle2">Picture 2</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Image path: {doc.Img2}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* QA Assessment - Show if QA has accepted */}
        {(doc.status === 'Accepted by QA' || doc.status === 'Accepted by Both' || 
          doc.status.includes('Manufacture') || doc.status.includes('Environment') || 
          doc.status === 'Completed') && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                QA Assessment
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography><strong>QA Accepted By:</strong> {doc.QAName}</Typography>
                  <Typography><strong>QA Timestamp:</strong> {formatDate(doc.QATimeStamp)}</Typography>
                  <Typography><strong>QA Solution:</strong> {doc.QASolution || 'N/A'}</Typography>
                  <Typography><strong>Solution Description:</strong> {doc.QASolutionDescription || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Person 1:</strong> {doc.Person1 || 'N/A'}</Typography>
                  <Typography><strong>Person 2:</strong> {doc.Person2 || 'N/A'}</Typography>
                  <Typography><strong>Damage Cost:</strong> {doc.DamageCost ? `$${doc.DamageCost}` : 'N/A'}</Typography>
                  <Typography><strong>Department Expense:</strong> {doc.DepartmentExpense || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Inventory Assessment - Show if Inventory has accepted */}
        {(doc.status === 'Accepted by Inventory' || doc.status === 'Accepted by Both' || 
          doc.status.includes('Manufacture') || doc.status.includes('Environment') || 
          doc.status === 'Completed') && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Inventory Assessment
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography><strong>Inventory Accepted By:</strong> {doc.InventoryName}</Typography>
              <Typography><strong>Inventory Timestamp:</strong> {formatDate(doc.InventoryTimeStamp)}</Typography>
            </Paper>
          </Grid>
        )}

        {/* Manufacturing Assessment - Show if sent to/accepted by Manufacturing */}
        {(doc.status === 'Send to Manufacture' || doc.status === 'Accepted by Manufacture' || 
          doc.status === 'Completed') && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Manufacturing Assessment
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {doc.status === 'Send to Manufacture' ? (
                <Typography color="text.secondary">
                  Document is pending manufacturing review
                </Typography>
              ) : (
                <>
                  <Typography><strong>Manufacturing Accepted By:</strong> {doc.ManufacturingName || 'N/A'}</Typography>
                  <Typography><strong>Manufacturing Timestamp:</strong> {formatDate(doc.ManufacturingTimeStamp) || 'N/A'}</Typography>
                  <Typography><strong>Manufacturing Comments:</strong> {doc.ManufacturingComments || 'N/A'}</Typography>
                </>
              )}
            </Paper>
          </Grid>
        )}

        {/* Environmental Assessment - Show if sent to/accepted by Environment */}
        {(doc.status === 'Send to Environment' || doc.status === 'Accepted by Environment' || 
          doc.status === 'Completed') && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Environmental Assessment
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {doc.status === 'Send to Environment' ? (
                <Typography color="text.secondary">
                  Document is pending environmental review
                </Typography>
              ) : (
                <>
                  <Typography><strong>Environment Accepted By:</strong> {doc.EnvironmentName || 'N/A'}</Typography>
                  <Typography><strong>Environment Timestamp:</strong> {formatDate(doc.EnvironmentTimeStamp) || 'N/A'}</Typography>
                  <Typography><strong>Environmental Impact:</strong> {doc.EnvironmentalImpact || 'N/A'}</Typography>
                  <Typography><strong>Mitigation Measures:</strong> {doc.MitigationMeasures || 'N/A'}</Typography>
                </>
              )}
            </Paper>
          </Grid>
        )}

        {/* Status History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Status History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography><strong>Created:</strong> {formatDate(doc.created_at)}</Typography>
            {doc.InventoryTimeStamp && (
              <Typography>
                <strong>Accepted by Inventory:</strong> {formatDate(doc.InventoryTimeStamp)}
              </Typography>
            )}
            {doc.QATimeStamp && (
              <Typography>
                <strong>Accepted by QA:</strong> {formatDate(doc.QATimeStamp)}
              </Typography>
            )}
            {doc.ManufacturingTimeStamp && (
              <Typography>
                <strong>Accepted by Manufacturing:</strong> {formatDate(doc.ManufacturingTimeStamp)}
              </Typography>
            )}
            {doc.EnvironmentTimeStamp && (
              <Typography>
                <strong>Accepted by Environment:</strong> {formatDate(doc.EnvironmentTimeStamp)}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}