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
import axios from 'axios';

// Pages & Components
import Login                from './pages/Login';
import SaleCoDashboard      from './pages/SaleCoDashboard';
import QADashboard          from './pages/QADashboard';
import InventoryDashboard   from './pages/InventoryDashboard';
import DocumentForm         from './pages/DocumentForm';
import DocumentView         from './pages/DocumentView';
import Navigation           from './components/Navigation';
import SectionHeader        from './components/SectionHeader';
import ManufacturingDashboard from './pages/ManufacturingDashboard';
import EnvironmentDashboard from './pages/EnvironmentDashboard';

// Error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e, info) { console.error(e, info); }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p:3, textAlign:'center' }}>
          <Typography variant="h4">Something went wrong</Typography>
          <Button variant="contained" onClick={()=>window.location.reload()} sx={{ mt:2 }}>
            Reload
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

// Dark theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#FF8C00', contrastText: '#fff' },
    secondary: { main: '#FFA500' },
    background: { default: '#001e3c', paper: '#0d1b2a' }
  },
  typography: { fontFamily: '"IBM Plex Sans", sans-serif' },
  components: {
    MuiCssBaseline: { styleOverrides: { body: { backgroundColor: '#001e3c' } } }
  }
});

// Auth guard
const ProtectedRoute = ({ element, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role?.toLowerCase()}`} replace />;
  }
  return element;
};

// Layout wrapper
const AppLayout = ({ children }) => {
  const location = useLocation();
  const token    = localStorage.getItem('token');
  const t        = useTheme();
  const isMobile = useMediaQuery(t.breakpoints.down('md'));
  const drawerWidth = 240;

  // hide nav/header on login
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
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml:    { md: `${drawerWidth}px` },
          mt:    '64px'
        }}
      >
        <SectionHeader />
        {children}
      </Box>
    </>
  );
};

function App() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuth(!!token);

    // Axios interceptors
    axios.interceptors.request.use(config => {
      const t = localStorage.getItem('token');
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* SaleCo */}
              <Route
                path="/saleco"
                element={
                  <ProtectedRoute
                    element={<SaleCoDashboard />}
                    allowedRoles={['SaleCo']}
                  />
                }
              />
              <Route
                path="/saleco/create"
                element={
                  <ProtectedRoute
                    element={<DocumentForm />}
                    allowedRoles={['SaleCo']}
                  />
                }
              />

              {/* QA dashboard */}
              <Route
                path="/qa"
                element={
                  <ProtectedRoute
                    element={<QADashboard />}
                    allowedRoles={['QA']}
                  />
                }
              />

              {/* Inventory dashboard */}
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute
                    element={<InventoryDashboard />}
                    allowedRoles={['Inventory']}
                  />
                }
              />

              {/* Manufacturing dashboard */}
              <Route
                path="/manufacturing"
                element={
                  <ProtectedRoute
                    element={<ManufacturingDashboard />}
                    allowedRoles={['Manufacturing']}
                  />
                }
              />

              {/* Environment dashboard */}
              <Route
                path="/environment"
                element={
                  <ProtectedRoute
                    element={<EnvironmentDashboard />}
                    allowedRoles={['Environment']}
                  />
                }
              />

              {/* Two "view" routes so both patterns work */}
              <Route
                path="/saleco/view/:documentId"
                element={
                  <ProtectedRoute
                    element={<DocumentView />}
                    allowedRoles={['SaleCo']}
                  />
                }
              />
              <Route
                path="/view/:documentId"
                element={
                  <ProtectedRoute
                    element={<DocumentView />}
                    allowedRoles={['SaleCo','QA','Inventory','Manufacturing','Environment']}
                  />
                }
              />

              {/* Root → redirect to role dashboard or login */}
              <Route
                path="/"
                element={
                  isAuth
                    ? <Navigate to={`/${localStorage.getItem('role')?.toLowerCase() || 'login'}`} replace />
                    : <Navigate to="/login" replace />
                }
              />

              {/* 404 */}
              <Route
                path="*"
                element={
                  <Box
                    sx={{
                      display:'flex',
                      flexDirection:'column',
                      alignItems:'center',
                      justifyContent:'center',
                      minHeight:'70vh'
                    }}
                  >
                    <Typography variant="h3" gutterBottom>Page Not Found</Typography>
                    <Button variant="contained" component={RouterLink} to="/">
                      Go Home
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