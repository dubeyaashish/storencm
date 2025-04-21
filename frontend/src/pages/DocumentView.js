import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Paper, Button } from '@mui/material';
import axios from 'axios';

export default function DocumentView() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get(`/api/documents/view/${documentId}`)
      .then(res => setDoc(res.data))
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load document');
      })
      .finally(() => setLoading(false));
  }, [documentId]);

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
      <Button onClick={() => navigate(-1)}>&larr; Back</Button>
      <Typography variant="h4" gutterBottom>
        Document {doc.Document_id}
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography><strong>Product ID:</strong> {doc.Product_id}</Typography>
        <Typography><strong>Serial #:</strong> {doc.Sn_number}</Typography>
        <Typography><strong>Description:</strong> {doc.Description}</Typography>
        <Typography><strong>Lot No:</strong> {doc.Lot_No}</Typography>
        <Typography><strong>Size:</strong> {doc.Product_size}</Typography>
        <Typography><strong>Quantity:</strong> {doc.Quantity}</Typography>
        <Typography><strong>Issue Found:</strong> {doc.Issue_Found}</Typography>
        <Typography><strong>Foundee:</strong> {doc.Foundee}</Typography>
        <Typography><strong>Department:</strong> {doc.Department}</Typography>
        <Typography><strong>Issue Desc:</strong> {doc.Issue_Description}</Typography>
        <Typography><strong>Prevention:</strong> {doc.Prevention}</Typography>
        {doc.Img1 && (
          <Box mt={2}>
            <img src={`/uploads/${doc.Img1}`} alt="Pic1" width={200} />
          </Box>
        )}
        {doc.Img2 && (
          <Box mt={2}>
            <img src={`/uploads/${doc.Img2}`} alt="Pic2" width={200} />
          </Box>
        )}
        <Box mt={2}>
          <Typography><strong>Status:</strong> {doc.status}</Typography>
          {doc.InventoryName && (
            <Typography>
              <strong>Inventory accepted:</strong> {doc.InventoryName} @ {new Date(doc.InventoryTimeStamp).toLocaleString()}
            </Typography>
          )}
          {doc.QAName && (
            <Typography>
              <strong>QA accepted:</strong> {doc.QAName} @ {new Date(doc.QATimeStamp).toLocaleString()}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
