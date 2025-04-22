// client/src/pages/QADashboard.js
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
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
  TableCell,
  Tooltip,
  Stack,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  CheckCircle as CheckCircleIcon,
  PlaylistAddCheck as CompleteIcon,
  Factory as ManufactureIcon,
  Nature as EnvironmentIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon
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
  'Rejected': 'error',
  'Send to Manufacture': 'warning',
  'Send to Environment': 'success'
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
  const [stats, setStats] = useState({ total: 0, created: 0, accepted: 0, completed: 0, toManufacture: 0, toEnvironment: 0 });

  // Pagination states
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(9); // 9 for grid (3x3), 10 for table

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

  // Update stats when docs change
  useEffect(() => {
    const total = docs.length;
    const created = docs.filter(d => d.status === 'Created').length;
    const accepted = docs.filter(d => d.status.startsWith('Accepted')).length;
    const completed = docs.filter(d => d.status === 'Completed').length;
    const toManufacture = docs.filter(d => d.status === 'Send to Manufacture').length;
    const toEnvironment = docs.filter(d => d.status === 'Send to Environment').length;
    
    setStats({ total, created, accepted, completed, toManufacture, toEnvironment });
  }, [docs]);

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
      fd = fd.filter(d => ['Completed', 'Rejected', 'Send to Manufacture', 'Send to Environment'].includes(d.status));
    }
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      fd = fd.filter(d =>
        (d.Document_id && d.Document_id.toLowerCase().includes(t)) ||
        (d.Product_id && d.Product_id.toString().includes(t)) ||
        (d.Issue_Found && d.Issue_Found.toLowerCase().includes(t)) ||
        (d.Lot_No && d.Lot_No.toLowerCase().includes(t)) ||
        (d.Description && d.Description.toLowerCase().includes(t))
      );
    }
    setFilteredDocs(fd);
    setPage(1); // Reset to first page when filters change
  }, [docs, tabValue, searchTerm]);

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

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Calculate current documents to display
  const currentDocs = filteredDocs.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Handle immediate acceptance without showing dialog
  const handleAccept = async (doc) => {
    try {
      // 1) Accept QA
      await axios.post(`/api/documents/${doc.id}/accept-qa`);
      
      // 2) Update UI
      const newStatus = doc.status === 'Accepted by Inventory'
        ? 'Accepted by Both'
        : 'Accepted by QA';
      
      setDocs(docs.map(d => {
        if (d.id !== doc.id) return d;
        return {
          ...d,
          status: newStatus,
          QAName: localStorage.getItem('userName') || 'QA',
          QATimeStamp: new Date().toISOString()
        };
      }));
      
      setNotification({ 
        open: true, 
        message: 'Document accepted successfully', 
        severity: 'success' 
      });
    } catch (err) {
      console.error(err);
      setNotification({ 
        open: true, 
        message: err.response?.data?.message || 'Error accepting document', 
        severity: 'error' 
      });
    }
  };

  // Open completion dialog for already accepted documents
  const openCompletionDialog = doc => {
    setCurrentDoc(doc);
    setForm({
      QASolution: doc.QASolution || '',
      QASolutionDescription: doc.QASolutionDescription || '',
      Person1: doc.Person1 || '',
      Person2: doc.Person2 || '',
      DamageCost: doc.DamageCost || '',
      DepartmentExpense: doc.DepartmentExpense || ''
    });
    setDialogOpen(true);
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Handle sending to either Manufacture or Environment
  const handleSendTo = async (destination) => {
    if (!currentDoc) return;
    
    try {
      // New status based on destination
      const newStatus = destination === 'manufacture' 
        ? 'Send to Manufacture' 
        : 'Send to Environment';
      
      // Update details & status
      await axios.put(
        `/api/documents/${currentDoc.id}/qa-details`,
        { ...form, status: newStatus }
      );
      
      // Update UI
      setDocs(docs.map(d => {
        if (d.id !== currentDoc.id) return d;
        return {
          ...d,
          ...form,
          status: newStatus
        };
      }));
      
      setNotification({ 
        open: true, 
        message: `Document sent to ${destination}`, 
        severity: 'success' 
      });
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      setNotification({ 
        open: true, 
        message: err.response?.data?.message || 'Error updating document', 
        severity: 'error' 
      });
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
    <>
    {/* 1) Helmet goes here */}
    <Helmet>
      <title>QA</title>
    </Helmet>
    <Box sx={{ p:3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Typography variant="h4">QA Dashboard</Typography>
        <Box display="flex" alignItems="center" gap={2}>
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
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          ['Total', stats.total],
          ['Created', stats.created],
          ['Accepted', stats.accepted],
          ['To Manufacture', stats.toManufacture],
          ['To Environment', stats.toEnvironment]
        ].map(([label, value]) => (
          <Grid item xs={6} md={2.4} key={label}>
            <Card sx={{ 
              bgcolor: theme => theme.palette.mode === 'dark' ? '#1e2a3a' : '#f5f5f5',
              boxShadow: 2,
              border: theme => `1px solid ${theme.palette.divider}`
            }}>
              <CardContent sx={{ py:2, textAlign:'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">{value}</Typography>
                <Typography variant="body1" color="text.primary" fontWeight="medium">{label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
      {viewMode==='grid' && currentDocs.length > 0 && (
        <Grid container spacing={2}>
          {currentDocs.map(doc=>(
            <Grid item xs={12} md={6} lg={4} key={doc.id}>
              <Card 
                sx={{ 
                  display:'flex', 
                  flexDirection:'column', 
                  height:'100%',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ flexGrow:1 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">{doc.Document_id}</Typography>
                    <Chip label={doc.status} color={statusColors[doc.status] || 'default'} size="small"/>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(doc.date)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my:1 }}/>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Product ID:</strong> {doc.Product_id || 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Serial #:</strong> {doc.Sn_number || 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Description:</strong> {truncateText(doc.Description, 50) || 'N/A'}
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
                  
                  <Divider sx={{ my:1 }}/>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Issue Found:</strong> {truncateText(doc.Issue_Found, 50) || 'N/A'}
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
                  
                  {/* QA Solution if available */}
                  {doc.QASolution && (
                    <>
                      <Divider sx={{ my:1 }}/>
                      <Typography variant="body2" gutterBottom>
                        <strong>QA Solution:</strong> {truncateText(doc.QASolution, 50)}
                      </Typography>
                      
                      {doc.DamageCost && (
                        <Typography variant="body2" gutterBottom>
                          <strong>Damage Cost:</strong> ${doc.DamageCost}
                        </Typography>
                      )}
                    </>
                  )}
                  
                  {/* Accept info */}
                  {(doc.QAName || doc.InventoryName) && (
                    <>
                      <Divider sx={{ my:1 }}/>
                      {doc.QAName && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>QA:</strong> {doc.QAName} 
                          {doc.QATimeStamp && ` (${formatDate(doc.QATimeStamp)})`}
                        </Typography>
                      )}
                      
                      {doc.InventoryName && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Inventory:</strong> {doc.InventoryName}
                          {doc.InventoryTimeStamp && ` (${formatDate(doc.InventoryTimeStamp)})`}
                        </Typography>
                      )}
                    </>
                  )}
                </CardContent>
                
                <CardActions>
                  <IconButton component={RouterLink} to={`/view/${doc.Document_id}`}>
                    <VisibilityIcon/>
                  </IconButton>
                  
                  {/* Accept button for documents that need acceptance */}
                  {(doc.status==='Created' || doc.status==='Accepted by Inventory') && (
                    <Button
                      startIcon={<CheckCircleIcon/>}
                      onClick={()=>handleAccept(doc)}
                      variant="contained"
                      size="small"
                    >
                      Accept
                    </Button>
                  )}
                  
                  {/* Complete button for already accepted documents */}
                  {(doc.status==='Accepted by QA' || doc.status==='Accepted by Both') && (
                    <Button
                      startIcon={<CompleteIcon/>}
                      onClick={()=>openCompletionDialog(doc)}
                      color="success"
                      variant="contained"
                      size="small"
                    >
                      Complete
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Table View */}
      {viewMode === 'table' && currentDocs.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Doc #</TableCell>
                <TableCell>Product ID</TableCell>
                <TableCell>Lot No</TableCell>
                <TableCell>Issue Found</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentDocs.map(doc=>(
                <TableRow key={doc.id} hover>
                  <TableCell>{doc.Document_id}</TableCell>
                  <TableCell>{doc.Product_id}</TableCell>
                  <TableCell>{doc.Lot_No || 'N/A'}</TableCell>
                  <TableCell>{truncateText(doc.Issue_Found, 40) || 'N/A'}</TableCell>
                  <TableCell>{formatDate(doc.date)}</TableCell>
                  <TableCell><Chip label={doc.status} color={statusColors[doc.status] || 'default'}/></TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton component={RouterLink} to={`/view/${doc.Document_id}`} size="small">
                        <VisibilityIcon fontSize="small"/>
                      </IconButton>
                      
                      {/* Accept button for documents that need acceptance */}
                      {(doc.status==='Created' || doc.status==='Accepted by Inventory') && (
                        <IconButton onClick={()=>handleAccept(doc)} color="primary" size="small">
                          <CheckCircleIcon fontSize="small"/>
                        </IconButton>
                      )}
                      
                      {/* Complete button for already accepted documents */}
                      {(doc.status==='Accepted by QA' || doc.status==='Accepted by Both') && (
                        <IconButton onClick={()=>openCompletionDialog(doc)} color="success" size="small">
                          <CompleteIcon fontSize="small"/>
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {filteredDocs.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={Math.ceil(filteredDocs.length / rowsPerPage)} 
            page={page} 
            onChange={handlePageChange}
            color="primary"
            showFirstButton 
            showLastButton
          />
        </Box>
      )}

      {/* Dialog for completing documents */}
      <Dialog open={dialogOpen} onClose={()=>setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Complete QA Assessment</DialogTitle>
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
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={()=>handleSendTo('manufacture')} 
            variant="contained" 
            startIcon={<ManufactureIcon />}
            sx={{ 
              bgcolor: 'warning.main', 
              color: 'warning.contrastText',
              '&:hover': {
                bgcolor: 'warning.dark',
              }
            }}
          >
            Manufacture
          </Button>
          <Button 
            onClick={()=>handleSendTo('environment')} 
            variant="contained" 
            startIcon={<EnvironmentIcon />}
            sx={{ 
              bgcolor: 'success.main', 
              color: 'success.contrastText',
              '&:hover': {
                bgcolor: 'success.dark',
              }
            }}
          >
            Environment
          </Button>
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
    </>
  );
}