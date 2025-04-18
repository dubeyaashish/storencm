// client/src/App.js
import React, { useEffect, useState } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate, 
  useLocation, 
  Link as RouterLink 
} from 'react-router-dom';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import axios from 'axios'; // Import axios properly at the top level

// Import components
import Login from './pages/Login'; // Use existing Login component instead of StyledLogin
import SaleCoDashboard from './pages/SaleCoDashboard';
import QADashboard from './pages/QADashboard';
import InventoryDashboard from './pages/InventoryDashboard';
import DocumentForm from './pages/DocumentForm';
import Navigation from './components/Navigation';
import SectionHeader from './components/SectionHeader';
// We'll use a simplified error boundary since the component is missing

// Simple Error Boundary component (inline since the file is missing)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h4">Something went wrong</Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }} 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

// Create a Reddit-inspired theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF5700', // Reddit orange
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0079D3', // Reddit blue
    },
    background: {
      default: '#DAE0E6', // Reddit light gray background
      paper: '#FFFFFF',
    }
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          borderRadius: 20,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

// Auth guard component
const ProtectedRoute = ({ element, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  // If allowedRoles is provided but the user's role isn't included,
  // redirect them to their own dashboard
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role.toLowerCase()}`} />;
  }
  
  return element;
};

// Layout component with React Router integration
const AppLayout = ({ children }) => {
  // We need to move this component inside BrowserRouter to use useLocation
  const LayoutContent = () => {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const drawerWidth = 240;
    
    // Don't show navigation on login page or if not authenticated
    if (!token || location.pathname === '/login') {
      return children;
    }
    
    return (
      <>
        <Navigation />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
            marginLeft: { xs: 0, md: `${drawerWidth}px` },
            marginTop: '64px', // Height of AppBar
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <SectionHeader />
          {children}
        </Box>
      </>
    );
  };
  
  return <LayoutContent />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    // Set up global axios interceptors for token handling
    const setupAxiosInterceptors = () => {
      // Use the imported axios, not required
      // Request interceptor
      axios.interceptors.request.use(
        config => {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        error => {
          return Promise.reject(error);
        }
      );
      
      // Response interceptor
      axios.interceptors.response.use(
        response => response,
        error => {
          if (error.response && error.response.status === 401) {
            // Unauthorized - token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );
    };
    
    setupAxiosInterceptors();
  }, []);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes with cross-role access */}
              {/* SaleCo routes - accessible by all roles */}
              <Route 
                path="/saleco" 
                element={
                  <ProtectedRoute 
                    element={<SaleCoDashboard />} 
                    allowedRoles={['SaleCo', 'QA', 'Inventory']} 
                  />
                } 
              />
              <Route 
                path="/saleco/create" 
                element={
                  <ProtectedRoute 
                    element={<DocumentForm />} 
                    allowedRoles={['SaleCo', 'QA', 'Inventory']} 
                  />
                } 
              />
              <Route 
                path="/saleco/view/:id" 
                element={
                  <ProtectedRoute 
                    element={<DocumentForm viewOnly={true} />} 
                    allowedRoles={['SaleCo', 'QA', 'Inventory']} 
                  />
                } 
              />
              
              {/* QA routes - accessible by QA and Inventory */}
              <Route 
                path="/qa" 
                element={
                  <ProtectedRoute 
                    element={<QADashboard />} 
                    allowedRoles={['QA', 'SaleCo', 'Inventory']} 
                  />
                } 
              />
              <Route 
                path="/qa/review" 
                element={
                  <ProtectedRoute 
                    element={<QADashboard />} 
                    allowedRoles={['QA', 'Inventory']} 
                  />
                } 
              />
              <Route 
                path="/qa/view/:id" 
                element={
                  <ProtectedRoute 
                    element={<DocumentForm viewOnly={true} qaView={true} />} 
                    allowedRoles={['QA', 'Inventory']} 
                  />
                } 
              />
              
              {/* Inventory routes - accessible by all roles */}
              <Route 
                path="/inventory" 
                element={
                  <ProtectedRoute 
                    element={<InventoryDashboard />} 
                    allowedRoles={['Inventory', 'SaleCo', 'QA']} 
                  />
                } 
              />
              <Route 
                path="/inventory/list" 
                element={
                  <ProtectedRoute 
                    element={<InventoryDashboard />} 
                    allowedRoles={['Inventory']} 
                  />
                } 
              />
              <Route 
                path="/inventory/view/:id" 
                element={
                  <ProtectedRoute 
                    element={<DocumentForm viewOnly={true} />} 
                    allowedRoles={['Inventory', 'SaleCo', 'QA']} 
                  />
                } 
              />
              
              {/* Default route */}
              <Route 
                path="/" 
                element={
                  isAuthenticated ? (
                    <Navigate to={`/${localStorage.getItem('role')?.toLowerCase() || 'login'}`} />
                  ) : (
                    <Navigate to="/login" />
                  )
                } 
              />
              
              {/* Catch-all route for 404 */}
              <Route 
                path="*" 
                element={
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '70vh'
                    }}
                  >
                    <Typography variant="h3" sx={{ mb: 2 }}>Page Not Found</Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      The page you are looking for does not exist.
                    </Typography>
                    <Button 
                      variant="contained" 
                      component={RouterLink} 
                      to="/"
                    >
                      Go to Home
                    </Button>
                  </Box>
                } 
              />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;