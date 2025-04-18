// src/components/Navigation.js
import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Drawer, 
  List, 
  ListItem, 
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
  ListItemButton
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Inventory as InventoryIcon, 
  Assignment as AssignmentIcon, 
  Logout as LogoutIcon, 
  Settings as SettingsIcon, 
  NotificationsOutlined as NotificationsIcon, 
  Search as SearchIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  Person as PersonIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// Styling
const drawerWidth = 240;

const LogoTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: 'inherit',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    textDecoration: 'none',
  }
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
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

// Main component
const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [openSections, setOpenSections] = useState({
    saleco: false,
    qa: false,
    inventory: false
  });
  
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Get user info from localStorage
    const role = localStorage.getItem('role') || '';
    setUserRole(role);
    
    // In a real app, you might want to fetch the user's name from an API
    setUserName('John Doe'); 
    
    // Open the section of the current route
    const currentPath = location.pathname;
    
    if (currentPath.includes('/saleco')) {
      setOpenSections(prev => ({ ...prev, saleco: true }));
    } else if (currentPath.includes('/qa')) {
      setOpenSections(prev => ({ ...prev, qa: true }));
    } else if (currentPath.includes('/inventory')) {
      setOpenSections(prev => ({ ...prev, inventory: true }));
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

  // Define navigation structure
  const navigationSections = [
    {
      id: 'saleco',
      title: 'SaleCo',
      icon: <AssignmentIcon />,
      items: [
        { text: 'Dashboard', path: '/saleco', icon: <DashboardIcon /> },
        { text: 'Create Document', path: '/saleco/create', icon: <AssignmentIcon /> },
      ],
      visible: true
    },
    {
      id: 'qa',
      title: 'Quality Assurance',
      icon: <SettingsIcon />,
      items: [
        { text: 'Dashboard', path: '/qa', icon: <DashboardIcon /> },
        { text: 'Review Documents', path: '/qa/review', icon: <AssignmentIcon /> },
      ],
      visible: true
    },
    {
      id: 'inventory',
      title: 'Inventory',
      icon: <InventoryIcon />,
      items: [
        { text: 'Dashboard', path: '/inventory', icon: <DashboardIcon /> },
        { text: 'Inventory List', path: '/inventory/list', icon: <InventoryIcon /> },
      ],
      visible: true
    }
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
      
      <Toolbar />
      <Divider />
      <List sx={{ p: 1 }}>
        {navigationSections.map((section) => (
          <React.Fragment key={section.id}>
            <ListItemButton 
              onClick={() => handleSectionToggle(section.id)}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                bgcolor: openSections[section.id] ? 'rgba(255, 87, 0, 0.08)' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ 
                color: openSections[section.id] ? theme.palette.primary.main : 'inherit'
              }}>
                {section.icon}
              </ListItemIcon>
              <ListItemText 
                primary={section.title} 
                primaryTypographyProps={{ 
                  fontWeight: openSections[section.id] ? 'bold' : 'normal',
                  color: openSections[section.id] ? theme.palette.primary.main : 'inherit'
                }} 
              />
              {openSections[section.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            
            <Collapse in={openSections[section.id]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {section.items.map((item) => (
                  <ListItemButton
                    key={item.text}
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    onClick={isMobile ? handleDrawerToggle : undefined}
                    sx={{
                      pl: 4,
                      borderRadius: 1,
                      mb: 0.5,
                      ml: 1,
                      '&.Mui-selected': {
                        bgcolor: 'rgba(255, 87, 0, 0.15)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 87, 0, 0.25)'
                        }
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255, 87, 0, 0.08)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                      minWidth: 36
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{
                        fontSize: '0.9rem',
                        fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                        color: location.pathname === item.path ? theme.palette.primary.main : 'inherit'
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
            
            <Divider sx={{ my: 1 }} />
          </React.Fragment>
        ))}
      </List>
    </div>
  );

  return (
    <>
      {/* Top AppBar */}
      <AppBar 
        position="fixed"
        elevation={0}
        sx={{ 
          zIndex: theme => theme.zIndex.drawer + 1,
          backgroundImage: 'linear-gradient(to right, #FF5700, #FF8033)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <LogoTypography 
              variant="h6" 
              noWrap 
              component={Link} 
              to="/"
              sx={{ 
                mr: 2,
                display: 'flex',
                fontWeight: 800,
                letterSpacing: '0.5px'
              }}
            >
              DocumentControl
            </LogoTypography>
            
            {/* Role indicator */}
            {userRole && (
              <Box 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {userRole}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Right section: notifications, search, and user menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Notification Icon */}
            <IconButton color="inherit" size="large" sx={{ mr: 1 }}>
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            {/* Search Icon */}
            <IconButton color="inherit" size="large" sx={{ mr: 1 }}>
              <SearchIcon />
            </IconButton>
            
            {/* User Avatar and Menu */}
            <IconButton
              onClick={handleMenu}
              color="inherit"
            >
              <StyledBadge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
              >
                <Avatar sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: 'white', 
                  color: theme.palette.primary.main,
                  fontWeight: 'bold'
                }}>
                  {userName.charAt(0)}
                </Avatar>
              </StyledBadge>
            </IconButton>
            
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
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">{userName}</Typography>
                <Typography variant="caption" color="text.secondary">{userRole}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleClose} component={Link} to="/profile">
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleClose} component={Link} to="/settings">
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
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
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          
          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                borderRight: '1px solid rgba(0,0,0,0.08)',
                boxShadow: 'rgba(0, 0, 0, 0.05) 2px 0px 20px'
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
      </Box>
    </>
  );
};

export default Navigation;