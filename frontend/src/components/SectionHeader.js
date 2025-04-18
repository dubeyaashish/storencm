// src/components/SectionHeader.js
import React from 'react';
import { Box, Typography, Chip, Paper, useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';
import {
  Assignment as AssignmentIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

const SectionHeader = () => {
  const location = useLocation();
  const theme = useTheme();
  const path = location.pathname;
  
  // Don't show header on login page
  if (path === '/login') {
    return null;
  }
  
  // Determine which section we're in based on the URL path
  let section = '';
  let description = '';
  let color = '';
  let icon = null;
  let gradient = '';
  
  if (path.startsWith('/saleco')) {
    section = 'SaleCo';
    description = path.includes('/create') 
      ? 'Create and submit new documents' 
      : 'Document creation and sales tracking';
    color = theme.palette.primary.main; // Orange
    icon = <AssignmentIcon />;
    gradient = 'linear-gradient(135deg, rgba(255,87,0,0.15) 0%, rgba(255,87,0,0.05) 100%)';
  } else if (path.startsWith('/qa')) {
    section = 'Quality Assurance';
    description = 'Review and process quality documents';
    color = theme.palette.secondary.main; // Blue
    icon = <DashboardIcon />;
    gradient = 'linear-gradient(135deg, rgba(0,121,211,0.15) 0%, rgba(0,121,211,0.05) 100%)';
  } else if (path.startsWith('/inventory')) {
    section = 'Inventory';
    description = 'Track and manage product inventory';
    color = '#46D160'; // Green
    icon = <InventoryIcon />;
    gradient = 'linear-gradient(135deg, rgba(70,209,96,0.15) 0%, rgba(70,209,96,0.05) 100%)';
  }
  
  // If no section detected, don't render anything
  if (!section) return null;

  // Add a subtitle based on the path
  let subtitle = '';
  if (path.includes('/create')) {
    subtitle = 'Create New Document';
  } else if (path.includes('/view')) {
    subtitle = 'Document Details';
  } else if (path.includes('/review')) {
    subtitle = 'Review Documents';
  } else if (path.includes('/list')) {
    subtitle = 'Inventory List';
  } else if (path.endsWith('/saleco') || path.endsWith('/qa') || path.endsWith('/inventory')) {
    subtitle = 'Dashboard';
  }
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mb: 3, 
        p: 0,
        borderRadius: 2,
        backgroundImage: gradient,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Color accent line */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          backgroundColor: color,
        }} 
      />
      
      <Box sx={{ p: 2, pt: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Box display="flex" alignItems="center">
            <Box 
              sx={{ 
                bgcolor: `${color}22`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                mr: 2
              }}
            >
              {icon}
            </Box>
            
            <Box>
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                color="text.primary"
                sx={{ mb: 0.5 }}
              >
                {subtitle}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
          </Box>
          
          <Chip 
            label={section} 
            sx={{ 
              backgroundColor: color,
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '16px',
              px: 1,
              '& .MuiChip-label': {
                px: 1
              }
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default SectionHeader;