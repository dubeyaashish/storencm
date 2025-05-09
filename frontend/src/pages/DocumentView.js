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
  Report as ReportIcon,
  Description as DescriptionIcon,
  AttachFile as AttachFileIcon,
  PictureAsPdf as PictureAsPdfIcon
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

  // Improved date formatting function with en-GB locale
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    // Parse the date string
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return "N/A";
    
    // Check for dates close to epoch (1899-12-30, 1900-01-01, etc.)
    const year = date.getFullYear();
    if (year < 1950) return "N/A";
    
    // Format the date using en-GB locale (DD/MM/YYYY format)
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Created': 'warning',
      'Accepted by Inventory': 'info',
      'Accepted by QA': 'info',
      'Accepted by Both': 'success',
      'Send to Manufacture': 'warning',
      'Send to Environment': 'success',
      'Send to SaleCo': 'primary',
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
            doc.status.includes('SaleCo') ? <DescriptionIcon /> :
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
            <Typography><strong>รหัสสินค้า:</strong> {doc.Product_id || 'N/A'}</Typography>
            <Typography><strong>Serial #:</strong> {doc.Sn_number || 'N/A'}</Typography>
            <Typography><strong>รายละเอียดสินค้า:</strong> {doc.Description || 'N/A'}</Typography>
            <Typography><strong>Lot No:</strong> {doc.Lot_No || 'N/A'}</Typography>
            <Typography><strong>ขนาด:</strong> {doc.Product_size || 'N/A'}</Typography>
            <Typography><strong>จำนวน:</strong> {doc.Quantity || 'N/A'}</Typography>
            <Typography><strong>วันที่สร้างเอกสาร:</strong> {formatDate(doc.date)}</Typography>
          </Paper>
        </Grid>

        {/* Issue Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Issue Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography><strong>ปัญหาที่พบ:</strong> {doc.Issue_Found || 'N/A'}</Typography>
            <Typography><strong>รายละเอียดปํญหา:</strong> {doc.Issue_Description || 'N/A'}</Typography>
            <Typography><strong>ผู้ที่พบเจอปํญหา:</strong> {doc.Foundee || 'N/A'}</Typography>
            <Typography><strong>แผนก:</strong> {doc.Department || 'N/A'}</Typography>
            <Typography><strong>วิธีแก้ไขปํญหา:</strong> {doc.Prevention || 'N/A'}</Typography>
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
          doc.status.includes('SaleCo') || doc.status === 'Completed') && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                QA Assessment
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography><strong>QA ที่รับเรื่อง:</strong> {doc.QAName}</Typography>
                  <Typography><strong>QA Timestamp:</strong> {formatDate(doc.QATimeStamp)}</Typography>
                  <Typography><strong>วิธีแก้ไขปํญหา:</strong> {doc.QASolution}</Typography>
                  <Typography><strong>รายละเอียดปํญหา:</strong> {doc.QASolutionDescription}</Typography>
                  <Typography><strong>Remark:</strong> {doc.QARemarks}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Person 1:</strong> {doc.Person1 || 'N/A'}</Typography>
                  <Typography><strong>Person 2:</strong> {doc.Person2 || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Inventory Assessment - Show if Inventory has accepted */}
        {(doc.status === 'Accepted by Inventory' || doc.status === 'Accepted by Both' || 
          doc.status.includes('Manufacture') || doc.status.includes('Environment') || 
          doc.status.includes('SaleCo') || doc.status === 'Completed') && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Inventory Assessment
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography><strong>คลังที่รับเรื่อง:</strong> {doc.InventoryName || 'N/A'}</Typography>
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
                  <Typography><strong>ผู้ผลิตที่รับเรื่อง:</strong> {doc.ManufacturingName || 'N/A'}</Typography>
                  <Typography><strong>Manufacturing Timestamp:</strong> {formatDate(doc.ManufacturingTimeStamp)}</Typography>
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
                  <Typography><strong>สิ่งแวดล้อมที่รับเรื่อง:</strong> {doc.EnvironmentName || 'N/A'}</Typography>
                  <Typography><strong>Environment Timestamp:</strong> {formatDate(doc.EnvironmentTimeStamp)}</Typography>
                  <Typography><strong>Environmental Impact:</strong> {doc.EnvironmentalImpact || 'N/A'}</Typography>
                  <Typography><strong>Mitigation Measures:</strong> {doc.MitigationMeasures || 'N/A'}</Typography>
                </>
              )}
            </Paper>
          </Grid>
        )}
        
{/* SaleCo Review Section with Attachment */}
{(doc.SaleCoReviewName || doc.SaleCoReviewTimeStamp || doc.status === 'Completed') && (
  <Grid item xs={12}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom color="primary">
        SaleCo Review
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography><strong>Reviewed By:</strong> {doc.SaleCoReviewName || 'N/A'}</Typography>
      <Typography><strong>Review Timestamp:</strong> {formatDate(doc.SaleCoReviewTimeStamp)}</Typography>
      <Typography><strong>ต้นทุน:</strong> {doc.DamageCost || 'N/A'}</Typography>
      <Typography><strong>ค่าใช้จ่ายแผนก:</strong> {doc.DepartmentExpense || 'N/A'}</Typography>
      
      {/* Display attachment if available */}
      {doc.SaleCoAttachment && (
        <Box mt={2}>
          <Typography><strong>Supporting Document:</strong></Typography>
          {doc.SaleCoAttachmentType && doc.SaleCoAttachmentType.startsWith('image/') ? (
            // Display image
            <Box
              component="img"
              sx={{
                maxWidth: '100%',
                maxHeight: '400px',
                mt: 1,
                border: '1px solid #eee',
                borderRadius: 1
              }}
              src={doc.SaleCoAttachment}
              alt="SaleCo supporting document"
              onError={(e) => {
                console.error('Error loading image:', doc.SaleCoAttachment);
                e.target.src = '/placeholder-image.png';
                e.target.alt = 'Image not available';
              }}
            />
          ) : (
            // Display PDF or other file type as link
            <Button
              variant="outlined"
              startIcon={<AttachFileIcon />}
              component="a"
              href={doc.SaleCoAttachment}
              target="_blank"
              sx={{ mt: 1 }}
            >
              Open Attachment
            </Button>
          )}
        </Box>
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
            <Typography><strong>วันที่สร้างเอกสาร:</strong> {formatDate(doc.created_at)}</Typography>
            {doc.InventoryTimeStamp && (
              <Typography>
                <strong>คลังรับเรื่องวันที่:</strong> {formatDate(doc.InventoryTimeStamp)}
              </Typography>
            )}
            {doc.QATimeStamp && (
              <Typography>
                <strong>QAรับเรื่องวันที่:</strong> {formatDate(doc.QATimeStamp)}
              </Typography>
            )}
            {doc.ManufacturingTimeStamp && (
              <Typography>
                <strong>ผู้ผลิตรับเรื่องวันที่:</strong> {formatDate(doc.ManufacturingTimeStamp)}
              </Typography>
            )}
            {doc.EnvironmentTimeStamp && (
              <Typography>
                <strong>สิงแวดล้อมรับเรื่องวันที่:</strong> {formatDate(doc.EnvironmentTimeStamp)}
              </Typography>
            )}
            {doc.SaleCoReviewTimeStamp && (
              <Typography>
                <strong>Reviewed ประสานงานขาย:</strong> {formatDate(doc.SaleCoReviewTimeStamp)}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}