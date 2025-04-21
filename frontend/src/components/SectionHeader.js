// src/components/SectionHeader.js
import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  styled,
  Breadcrumbs,
  Link as MuiLink,
  Card,
  Button
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import {
  Article as ArticleIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  NoteAdd as NoteAddIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  FormatListBulleted as ListIcon,
  Home as HomeIcon,
  BarChart as BarChartIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';

// Styled components
const StyledHeaderCard = styled(Card)(({ theme }) => ({
  // lift header closer to AppBar
  marginTop: theme.spacing(-10),
  marginLeft: theme.spacing(5),
  marginBottom: theme.spacing(3),
  borderRadius: 12,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  position: 'relative',
  overflow: 'hidden',
}));

const HeaderContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  position: 'relative',
  zIndex: 2,
}));

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  '& .MuiBreadcrumbs-separator': {
    margin: '0 8px',
  },
}));

const StyledIconWrapper = styled(Box)(({ theme, color }) => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: alpha(color, 0.1),
  color: color,
  marginRight: theme.spacing(2),
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  padding: '8px 16px',
  fontWeight: 600,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.07)',
  },
}));

const SequenceButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.85rem',
  color: alpha(theme.palette.text.primary, 0.7),
  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor: 'transparent',
  },
}));

const GradientBackground = styled(Box)(({ theme, color }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  height: '100%',
  width: '40%',
  background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${alpha(color, 0.05)} 100%)`,
  zIndex: 1,
}));

const AccentLine = styled(Box)(({ theme, color }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '4px',
  width: '100%',
  background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.4)} 100%)`,
  zIndex: 3,
}));

const SectionHeader = () => {
  const location = useLocation();
  const theme = useTheme();
  const path = location.pathname;
  if (path === '/login') return null;

  let section = '';
  let description = '';
  let color = theme.palette.primary.main;
  let icon = <HomeIcon />;
  let action = null;

  const breadcrumbs = [
    { name: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
  ];

  if (path.startsWith('/saleco')) {
    section = 'Document Management';
    color = theme.palette.primary.main;
    icon = <ArticleIcon />;
    breadcrumbs.push({ name: 'Documents', path: '/saleco', icon: <ArticleIcon fontSize="small" /> });
    if (path.includes('/create')) {
      description = 'Create and manage new documentation for review process';
      breadcrumbs.push({ name: 'Create', path: path, icon: <NoteAddIcon fontSize="small" /> });
    } else if (path.includes('/view')) {
      description = 'View detailed document information and current status';
      breadcrumbs.push({ name: 'Details', path: path, icon: <ArticleIcon fontSize="small" /> });
    } else {
      description = 'Manage documents and track approval workflows';
      action = { text: 'Create Document', icon: <AddIcon />, path: '/saleco/create' };
    }
  } else if (path.startsWith('/qa')) {
    section = 'Quality Assurance';
    color = theme.palette.info.main;
    icon = <CheckCircleOutlineIcon />;
    breadcrumbs.push({ name: 'QA', path: '/qa', icon: <CheckCircleOutlineIcon fontSize="small" /> });
    if (path.includes('/review')) {
      description = 'Review and assess submitted documents';
      breadcrumbs.push({ name: 'Review', path: path, icon: <ArticleIcon fontSize="small" /> });
    } else if (path.includes('/view')) {
      description = 'Evaluate document details and provide assessment';
      breadcrumbs.push({ name: 'Assessment', path: path, icon: <ArticleIcon fontSize="small" /> });
    } else {
      description = 'Review and validate documentation quality';
      action = { text: 'Review Documents', icon: <ArticleIcon />, path: '/qa/review' };
    }
  } else if (path.startsWith('/inventory')) {
    section = 'Inventory Management';
    color = theme.palette.success.main;
    icon = <InventoryIcon />;
    breadcrumbs.push({ name: 'Inventory', path: '/inventory', icon: <InventoryIcon fontSize="small" /> });
    if (path.includes('/list')) {
      description = 'View and manage inventory items';
      breadcrumbs.push({ name: 'List', path: path, icon: <ListIcon fontSize="small" /> });
    } else if (path.includes('/view')) {
      description = 'View item details and stock status';
      breadcrumbs.push({ name: 'Details', path: path, icon: <InventoryIcon fontSize="small" /> });
    } else {
      description = 'Manage product inventory and tracking';
      action = { text: 'New Inventory', icon: <AddIcon />, path: '/inventory/create' };
    }
  }

  return (
    <StyledHeaderCard>
      <AccentLine color={color} />
      <GradientBackground color={color} />
      <HeaderContent>
        <StyledBreadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          {breadcrumbs.map((bc, idx) => (
            idx < breadcrumbs.length - 1 ? (
              <SequenceButton key={bc.path} component={Link} to={bc.path}>
                {bc.icon}
                <Typography variant="body2" sx={{ ml: 0.5 }}>{bc.name}</Typography>
              </SequenceButton>
            ) : (
              <Box key={bc.path} display="flex" alignItems="center">
                {bc.icon}
                <Typography variant="body2" sx={{ ml: 0.5, color: theme.palette.text.primary }}>{bc.name}</Typography>
              </Box>
            )
          ))}
        </StyledBreadcrumbs>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Box display="flex" alignItems="center" flexGrow={1}>
            <StyledIconWrapper color={color}>{icon}</StyledIconWrapper>
            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>{section}</Typography>
              <Typography variant="body2" color="text.secondary">{description}</Typography>
            </Box>
          </Box>
          {action && (
            <ActionButton component={Link} to={action.path} variant="contained" startIcon={action.icon}>
              {action.text}
            </ActionButton>
          )}
        </Box>
      </HeaderContent>
    </StyledHeaderCard>
  );
};

export default SectionHeader;
