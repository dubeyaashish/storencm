// src/components/Navigation.js
import React, { useState, useEffect } from 'react';
import logo from './logo.png';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Drawer, 
  List, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  Collapse,
  ListItemButton,
  styled,
  alpha,
  Tooltip,
  Container,
  Button
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Inventory as InventoryIcon, 
  Article as ArticleIcon, 
  Logout as LogoutIcon, 
  Tune as TuneIcon, 
  NotificationsOutlined as NotificationsIcon, 
  Search as SearchIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Add as AddIcon,
  NoteAdd as NoteAddIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  SpeedOutlined as SpeedIcon,
  Factory,
  Nature
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Styling
const drawerWidth = 280;

// Styled components for premium UI
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  backdropFilter: 'blur(8px)',
  boxShadow: 'none',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  color: theme.palette.text.primary,
  zIndex: theme.zIndex.drawer + 1,
  height: 64,
}));

const StyledLogo = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  backgroundClip: 'text',
  textFillColor: 'transparent',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: '-0.5px',
  marginRight: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
    backdropFilter: 'blur(8px)',
    borderRight: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.03)',
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.main,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      border: '1px solid currentColor',
      content: '""',
    },
  }
}));

const StyledListItemButton = styled(ListItemButton)(({ theme, active }) => ({
  margin: '4px 12px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
  '&:hover': {
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.04),
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  fontWeight: 600,
  width: 40,
  height: 40,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const SubListItemButton = styled(ListItemButton)(({ theme, active }) => ({
  margin: '4px 12px 4px 24px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
  '&:hover': {
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.04),
  },
}));

const RoleChip = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.primary.main, 0.15)
    : alpha(theme.palette.primary.main, 0.08),
  borderRadius: '8px',
  padding: '4px 12px',
  fontSize: '0.75rem',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
  color: theme.palette.primary.main
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: '8px 16px',
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.07)'
  }
}));

const HeaderIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.action.hover, 0.04),
  borderRadius: '8px',
  padding: '8px',
  marginRight: '8px',
  '&:hover': {
    backgroundColor: alpha(theme.palette.action.hover, 0.1),
  },
}));

const LogoImage = styled('img')(({ theme }) => ({
  height: 48,
  width: 48,
  borderRadius: '50%',
  objectFit: 'cover',
  marginRight: theme.spacing(2),
  cursor: 'pointer',
}));

// Main component
const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [openSections, setOpenSections] = useState({
    saleco: false,
    qa: false,
    inventory: false,
    manufacturing: false,
    environment: false
  });
  
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Get user info from localStorage
    const role = localStorage.getItem('role') || '';
    setUserRole(role);
    
    // Get user name from localStorage - try multiple approaches
    let name = '';
    
    // Try to get from user object first
    try {
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      if (userObj && userObj.name) {
        name = userObj.name;
      }
    } catch (e) {
      console.error('Error parsing user data from localStorage:', e);
    }
    
    // If not found in user object, try direct userName key
    if (!name) {
      name = localStorage.getItem('userName');
    }
    
    // Default to role or 'User' if no name found
    setUserName(name || role || 'User');
    
    // Open the section of the current route
    const currentPath = location.pathname;
    
    if (currentPath.includes('/saleco')) {
      setOpenSections(prev => ({ ...prev, saleco: true }));
    } else if (currentPath.includes('/qa')) {
      setOpenSections(prev => ({ ...prev, qa: true }));
    } else if (currentPath.includes('/inventory')) {
      setOpenSections(prev => ({ ...prev, inventory: true }));
    } else if (currentPath.includes('/manufacturing')) {
      setOpenSections(prev => ({ ...prev, manufacturing: true }));
    } else if (currentPath.includes('/environment')) {
      setOpenSections(prev => ({ ...prev, environment: true }));
    }
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  const handleSectionToggle = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Define navigation structure with role-based access
  const navigationSections = [
    {
      id: 'saleco',
      title: 'Document Management',
      icon: <ArticleIcon />,
      items: [
        { text: 'Dashboard', path: '/saleco', icon: <SpeedIcon /> },
        { text: 'Create Document', path: '/saleco/create', icon: <NoteAddIcon /> },
      ],
      roles: ['SaleCo']
    },
    {
      id: 'qa',
      title: 'Quality Assurance',
      icon: <TuneIcon />,
      items: [
        { text: 'Dashboard', path: '/qa', icon: <SpeedIcon /> },
        { text: 'Review Documents', path: '/qa/review', icon: <ArticleIcon /> },
      ],
      roles: ['QA']
    },
    {
      id: 'inventory',
      title: 'Inventory',
      icon: <InventoryIcon />,
      items: [
        { text: 'Dashboard', path: '/inventory', icon: <SpeedIcon /> },
        { text: 'Inventory List', path: '/inventory/list', icon: <InventoryIcon /> },
      ],
      roles: ['Inventory']
    },
    {
      id: 'manufacturing',
      title: 'Manufacturing',
      icon: <Factory />,
      items: [
        { text: 'Dashboard', path: '/manufacturing', icon: <SpeedIcon /> },
        { text: 'Manufacturing List', path: '/manufacturing/list', icon: <Factory /> },
      ],
      roles: ['Manufacturing']
    },
    {
      id: 'environment',
      title: 'Environment',
      icon: <Nature />,
      items: [
        { text: 'Dashboard', path: '/environment', icon: <SpeedIcon /> },
        { text: 'Environment List', path: '/environment/list', icon: <Nature /> },
      ],
      roles: ['Environment']
    },
    // Add this section to navigationSections array in Navigation.js
  {
    id: 'reporter',
    title: 'Document Management',
    icon: <ArticleIcon />,
    items: [
      { text: 'Dashboard', path: '/reporter', icon: <SpeedIcon /> },
      { text: 'Create Document', path: '/reporter/create', icon: <NoteAddIcon /> },
    ],
    roles: ['Reporter']
  },
  ];

  const drawer = (
    <div>
      {/* Show close button only on mobile */}
      {isMobile && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center',
            p: 1 
          }}
        >
          <IconButton 
            onClick={handleDrawerToggle}
            color="primary"
            aria-label="close drawer"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: theme.spacing(3, 2) 
      }}>
        <Link to="/">
          <LogoImage src={logo} alt="Logo" />
        </Link>
      </Box>
      
      <Divider sx={{ opacity: 0.1, mx: 2, mb: 3 }} />      
      <List sx={{ px: 1 }}>
        {navigationSections
          .filter(section => section.roles.includes(userRole)) // Only show sections for the user's role
          .map((section) => (
          <React.Fragment key={section.id}>
            <StyledListItemButton 
              onClick={() => handleSectionToggle(section.id)}
              active={openSections[section.id]}
            >
              <ListItemIcon sx={{ 
                color: openSections[section.id] ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.6),
                minWidth: '40px'
              }}>
                {section.icon}
              </ListItemIcon>
              <ListItemText 
                primary={section.title} 
                primaryTypographyProps={{ 
                  fontWeight: openSections[section.id] ? 600 : 500,
                  color: openSections[section.id] ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.85),
                  fontSize: '0.95rem'
                }} 
              />
              {openSections[section.id] ? 
                <ExpandLessIcon fontSize="small" color={openSections[section.id] ? "primary" : "inherit"} /> : 
                <ExpandMoreIcon fontSize="small" />
              }
            </StyledListItemButton>
            
            <Collapse in={openSections[section.id]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <SubListItemButton
                      key={item.text}
                      component={Link}
                      to={item.path}
                      active={isActive}
                      onClick={isMobile ? handleDrawerToggle : undefined}
                    >
                      <ListItemIcon sx={{ 
                        color: isActive ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.6),
                        minWidth: '36px'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.7)
                        }}
                      />
                    </SubListItemButton>
                  );
                })}
              </List>
            </Collapse>
            
            <Divider sx={{ my: 2, opacity: 0.1 }} />
          </React.Fragment>
        ))}
      </List>
      
      <Box sx={{ 
        position: 'absolute', 
        bottom: 0, 
        width: '100%', 
        p: 2,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        backdropFilter: 'blur(8px)',
        backgroundColor: alpha(theme.palette.background.paper, 0.8)
      }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 1,
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: alpha(theme.palette.divider, 0.05)
            },
            cursor: 'pointer'
          }}
          onClick={handleMenu}
        >
          <StyledBadge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
          >
            <StyledAvatar>
              {userName.charAt(0)}
            </StyledAvatar>
          </StyledBadge>
          <Box sx={{ ml: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>{userName}</Typography>
            <Typography variant="caption" color="text.secondary">{userRole}</Typography>
          </Box>
        </Box>
      </Box>
    </div>
  );

  return (
    <>
      {/* Top AppBar */}
      <StyledAppBar position="fixed">
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ height: 64 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flexGrow: 1 }}>
              <Link to="/">
                <LogoImage src={logo} alt="Logo" />
              </Link>
              
              {/* Role indicator */}
              {userRole && (
                <RoleChip>
                  <Typography variant="body2" fontWeight="600">
                    {userRole}
                  </Typography>
                </RoleChip>
              )}
            </Box>
            
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <Link to="/">
                <LogoImage src={logo} alt="Logo" />
              </Link>
            </Box>
            
            {/* Right section: notifications, search, and user menu */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Search Button */}
              <Tooltip title="Search">
                <HeaderIconButton color="inherit" size="medium">
                  <SearchIcon fontSize="small" />
                </HeaderIconButton>
              </Tooltip>
              
              {/* Notification Icon */}
              <Tooltip title="Notifications">
                <HeaderIconButton color="inherit" size="medium">
                  <Badge color="error">
                    <NotificationsIcon fontSize="small" />
                  </Badge>
                </HeaderIconButton>
              </Tooltip>
              
              {/* Settings button */}
              <Tooltip title="Settings">
                <HeaderIconButton color="inherit" size="medium">
                  <SettingsIcon fontSize="small" />
                </HeaderIconButton>
              </Tooltip>
              
              {/* User Menu */}
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    minWidth: 200,
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight="600">{userName}</Typography>
                  <Typography variant="caption" color="text.secondary">{userRole}</Typography>
                </Box>
                <Divider sx={{ opacity: 0.1 }} />
                <MenuItem onClick={handleClose} component={Link} to="/profile"
                  sx={{ 
                    mx: 1, 
                    borderRadius: '8px', 
                    my: 0.5,
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
                  }}
                >
                  <ListItemIcon>
                    <AccountCircleIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Profile" primaryTypographyProps={{ fontSize: '0.9rem' }} />
                </MenuItem>
                <MenuItem onClick={handleClose} component={Link} to="/settings"
                  sx={{ 
                    mx: 1, 
                    borderRadius: '8px', 
                    my: 0.5,
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
                  }}
                >
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '0.9rem' }} />
                </MenuItem>
                <Divider sx={{ opacity: 0.1 }} />
                <MenuItem onClick={handleLogout}
                  sx={{ 
                    mx: 1, 
                    borderRadius: '8px', 
                    my: 0.5,
                    color: theme.palette.error.main,
                    '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.05) }
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Logout" 
                    primaryTypographyProps={{ 
                      fontSize: '0.9rem',
                      color: theme.palette.error.main  
                    }} 
                  />
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </StyledAppBar>
      
      {/* This is a container for the nav drawer and main content */}
      <Box sx={{ display: 'flex' }}>
        {/* Responsive sidebar / Drawer */}
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
            }}
          >
            {drawer}
          </Drawer>
          
          {/* Desktop drawer */}
          <StyledDrawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
            }}
            open
          >
            {drawer}
          </StyledDrawer>
        </Box>
        
        {/* Main content wrapper */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            mt: '64px', // Height of AppBar
          }}
        />
      </Box>
    </>
  );
};

export default Navigation;