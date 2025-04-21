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
  Snackbar,
  ToggleButtonGroup,
  ToggleButton,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

// Status chip color mapping
const statusColors = {
  'Created': 'warning',
  'Accepted by Inventory': 'info',
  'Accepted by QA': 'info',
  'Accepted by Both': 'success',
  'Completed': 'success',
  'Rejected': 'error'
};

export default function QADashboard() {
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Dialog & form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [form, setForm] = useState({
    QASolution: '',
    QASolutionDescription: '',
    Person1: '',
    Person2: '',
    DamageCost: '',
    DepartmentExpense: ''
  });

  // 1) Interceptors
  useEffect(() => {
    axios.interceptors.request.use(cfg => {
      const t = localStorage.getItem('token');
      if (t) cfg.headers.Authorization = `Bearer ${t}`;
      return cfg;
    });
    axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    );
  }, []);

  // 2) Fetch on mount
  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/api/documents/list');
      setDocs(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading documents');
    } finally {
      setLoading(false);
    }
  }

  // 3) Filter & tabs
  useEffect(() => {
    let fd = [...docs];
    if (tabValue === 1) {
      fd = fd.filter(d => d.status === 'Created');
    } else if (tabValue === 2) {
      fd = fd.filter(d => d.status.startsWith('Accepted'));
    } else if (tabValue === 3) {
      fd = fd.filter(d => d.status === 'Completed' || d.status === 'Rejected');
    }
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      fd = fd.filter(d =>
        d.Document_id.toLowerCase().includes(t) ||
        d.Product_id.toString().includes(t) ||
        d.Issue_Found.toLowerCase().includes(t)
      );
    }
    setFilteredDocs(fd);
  }, [docs, tabValue, searchTerm]);

  const openDialog = doc => {
    setCurrentDoc(doc);
    setForm({
      QASolution: '',
      QASolutionDescription: '',
      Person1: '',
      Person2: '',
      DamageCost: '',
      DepartmentExpense: ''
    });
    setDialogOpen(true);
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!currentDoc) return;
    try {
      // 1) accept QA
      await axios.post(`/api/documents/${currentDoc.id}/accept-qa`);
      // 2) update details & status
      const newStatus = currentDoc.status === 'Accepted by Inventory'
        ? 'Accepted by Both'
        : 'Accepted by QA';
      await axios.put(
        `/api/documents/${currentDoc.id}/qa-details`,
        { ...form, status: newStatus }
      );
      // 3) update UI
      setDocs(docs.map(d => {
        if (d.id !== currentDoc.id) return d;
        return {
          ...d,
          ...form,
          status: newStatus,
          QAName: localStorage.getItem('userName') || 'QA',
          QATimeStamp: new Date().toISOString()
        };
      }));
      setNotification({ open: true, message: 'QA saved', severity: 'success' });
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      setNotification({ open: true, message: err.response?.data?.message || 'Error', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ p:3, textAlign:'center' }}>
        <Typography variant="h4">QA Dashboard</Typography>
        <CircularProgress sx={{ mt:2 }}/>
      </Box>
    );
  }

  return (
    <Box sx={{ p:3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Typography variant="h4">QA Dashboard</Typography>
        <TextField
          placeholder="Search..."
          size="small"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon/></InputAdornment> }}
        />
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_,v)=>v&&setViewMode(v)}
          size="small"
        >
          <ToggleButton value="grid"><GridViewIcon/></ToggleButton>
          <ToggleButton value="table"><ViewListIcon/></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(_,v)=>setTabValue(v)} sx={{ mb:2 }}>
        <Tab label="All" />
        <Tab label="Created" />
        <Tab label="Accepted" />
        <Tab label="Completed" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
      {!error && !filteredDocs.length && <Alert severity="info">No documents.</Alert>}

      {/* Grid */}
      {viewMode==='grid' ? (
        <Grid container spacing={2}>
          {filteredDocs.map(doc=>(
            <Grid item xs={12} md={6} lg={4} key={doc.id}>
              <Card sx={{ display:'flex', flexDirection:'column', height:'100%' }}>
                <CardContent sx={{ flexGrow:1 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">{doc.Document_id}</Typography>
                    <Chip label={doc.status} color={statusColors[doc.status]}/>
                  </Box>
                  <Divider sx={{ my:1 }}/>
                  <Typography><strong>Product:</strong> {doc.Product_id}</Typography>
                  <Typography><strong>Issue:</strong> {doc.Issue_Found}</Typography>
                </CardContent>
                <CardActions>
                  <IconButton component={RouterLink} to={`/view/${doc.Document_id}`}>
                    <VisibilityIcon/>
                  </IconButton>
                  {(doc.status==='Created' || doc.status==='Accepted by Inventory') && (
                    <Button
                      startIcon={<CheckCircleIcon/>}
                      onClick={()=>openDialog(doc)}
                    >
                      Accept
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        // Table View
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Doc #</TableCell>
                <TableCell>Product ID</TableCell>
                <TableCell>Issue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocs.map(doc=>(
                <TableRow key={doc.id} hover>
                  <TableCell>{doc.Document_id}</TableCell>
                  <TableCell>{doc.Product_id}</TableCell>
                  <TableCell>{doc.Issue_Found}</TableCell>
                  <TableCell><Chip label={doc.status} color={statusColors[doc.status]}/></TableCell>
                  <TableCell>
                    <IconButton component={RouterLink} to={`/view/${doc.Document_id}`}>
                      <VisibilityIcon/>
                    </IconButton>
                    {(doc.status==='Created' || doc.status==='Accepted by Inventory') && (
                      <IconButton onClick={()=>openDialog(doc)} color="primary">
                        <CheckCircleIcon/>
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={()=>setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>QA Assessment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt:1 }}>
            <Grid item xs={12}>
              <TextField
                label="Solution Title"
                name="QASolution"
                fullWidth
                value={form.QASolution}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Solution Details"
                name="QASolutionDescription"
                multiline
                rows={3}
                fullWidth
                value={form.QASolutionDescription}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Person 1"
                name="Person1"
                fullWidth
                value={form.Person1}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Person 2"
                name="Person2"
                fullWidth
                value={form.Person2}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Damage Cost"
                name="DamageCost"
                type="number"
                fullWidth
                value={form.DamageCost}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Dept Expense"
                name="DepartmentExpense"
                type="number"
                fullWidth
                value={form.DepartmentExpense}
                onChange={handleFormChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Save & Accept</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={()=>setNotification(n=>({...n,open:false}))}
      >
        <Alert severity={notification.severity}>{notification.message}</Alert>
      </Snackbar>
    </Box>
  );
}
