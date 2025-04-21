// StyledLogin.js - Enhanced Reddit-style login page
import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  Avatar,
  Container
} from '@mui/material';
import { LockOutlined, PersonAdd } from '@mui/icons-material';
import axios from 'axios';

// Make sure all three roles appear here:
const roles = ['SaleCo', 'Inventory', 'QA', 'Manufacturing', 'Environment'];

export default function StyledLogin() {
  const [tab, setTab] = useState(0);
  const [message, setMessage] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form state
  const [regForm, setRegForm] = useState({
    name: '',
    surname: '',
    employeeId: '',
    email: '',
    role: 'SaleCo',
    department: '',
    password: '',
    confirmPassword: ''
  });
  const [regStep, setRegStep] = useState('form'); // 'form' → 'otp' → 'completed'
  const [otpForm, setOtpForm] = useState({ email: '', otp: '' });

  const handleTabChange = (e, newVal) => {
    setTab(newVal);
    setMessage('');
    setRegStep('form');
  };

  // LOGIN
  const handleLogin = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/auth/login', {
        email: loginEmail,
        password: loginPassword
      });
      
      // Store token and role
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      
      // Store user data
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userName', data.user.name); // Also store name directly for compatibility
      }
      
      window.location.href = `/${data.role.toLowerCase()}`;
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
    }
  };

  // REGISTER: submit form → send OTP
  const handleRegSubmit = async e => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
      return setMessage('Passwords do not match');
    }
    try {
      await axios.post('/api/auth/register', regForm);
      setOtpForm({ email: regForm.email, otp: '' });
      setRegStep('otp');
      setMessage('OTP sent to your email');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed');
    }
  };

  // VERIFY OTP
  const handleOtpSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/verify-otp', otpForm);
      setRegStep('completed');
      setMessage('Registration successful. Please login.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'OTP verification failed');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: 8
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
          {tab === 0 ? <LockOutlined /> : <PersonAdd />}
        </Avatar>
        
        <Typography component="h1" variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
          Document Control System
        </Typography>
        
        <Paper 
          sx={{ 
            width: '100%', 
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }} 
          elevation={2}
        >
          <Tabs 
            value={tab} 
            onChange={handleTabChange} 
            centered
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 3
              },
              mb: 3
            }}
          >
            <Tab 
              label="Login" 
              sx={{ 
                fontWeight: tab === 0 ? 'bold' : 'normal',
                fontSize: '1rem'
              }} 
            />
            <Tab 
              label="Register" 
              sx={{ 
                fontWeight: tab === 1 ? 'bold' : 'normal',
                fontSize: '1rem'
              }} 
            />
          </Tabs>

          {message && (
            <Alert 
              sx={{ 
                mb: 2,
                borderRadius: 1
              }} 
              severity={message.includes('successful') ? 'success' : 'error'}
            >
              {message}
            </Alert>
          )}

          {tab === 0 && (
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
                variant="outlined"
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                variant="outlined"
              />
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                sx={{ 
                  mt: 1, 
                  mb: 2, 
                  py: 1.5,
                  fontSize: '1rem'
                }}
              >
                Sign In
              </Button>
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ mt: 1 }}>
              {regStep === 'form' && (
                <Box component="form" onSubmit={handleRegSubmit}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="First Name"
                      name="name"
                      fullWidth
                      margin="normal"
                      value={regForm.name}
                      onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                      required
                    />
                    <TextField
                      label="Last Name"
                      name="surname"
                      fullWidth
                      margin="normal"
                      value={regForm.surname}
                      onChange={e => setRegForm({ ...regForm, surname: e.target.value })}
                      required
                    />
                  </Box>
                  
                  <TextField
                    label="Employee ID"
                    name="employeeId"
                    fullWidth
                    margin="normal"
                    value={regForm.employeeId}
                    onChange={e => setRegForm({ ...regForm, employeeId: e.target.value })}
                    required
                  />
                  
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    fullWidth
                    margin="normal"
                    value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    required
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      select
                      label="Role"
                      name="role"
                      fullWidth
                      margin="normal"
                      value={regForm.role}
                      onChange={e => setRegForm({ ...regForm, role: e.target.value })}
                    >
                      {roles.map(r => (
                        <MenuItem key={r} value={r}>{r}</MenuItem>
                      ))}
                    </TextField>
                    
                    <TextField
                      label="Department"
                      name="department"
                      fullWidth
                      margin="normal"
                      value={regForm.department}
                      onChange={e => setRegForm({ ...regForm, department: e.target.value })}
                      required
                    />
                  </Box>
                  
                  <TextField
                    label="Password"
                    name="password"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={regForm.password}
                    onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                    required
                  />
                  
                  <TextField
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={regForm.confirmPassword}
                    onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    required
                    sx={{ mb: 2 }}
                  />
                  
                  <Button 
                    type="submit" 
                    variant="contained" 
                    fullWidth 
                    sx={{ 
                      mt: 2, 
                      mb: 2,
                      py: 1.5,
                      fontSize: '1rem'
                    }}
                  >
                    Register
                  </Button>
                </Box>
              )}

              {regStep === 'otp' && (
                <Box component="form" onSubmit={handleOtpSubmit}>
                  <Typography align="center" sx={{ mb: 2 }}>
                    Enter the OTP sent to {otpForm.email}
                  </Typography>
                  <TextField
                    label="OTP Code"
                    name="otp"
                    fullWidth
                    margin="normal"
                    value={otpForm.otp}
                    onChange={e => setOtpForm({ ...otpForm, otp: e.target.value })}
                    required
                    sx={{ mb: 3 }}
                  />
                  <Button 
                    type="submit" 
                    variant="contained" 
                    fullWidth 
                    sx={{ 
                      mt: 1, 
                      mb: 2,
                      py: 1.5,
                      fontSize: '1rem'
                    }}
                  >
                    Verify OTP
                  </Button>
                </Box>
              )}

              {regStep === 'completed' && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                    Registration Complete!
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Your account has been created successfully.
                  </Typography>
                  <Button 
                    onClick={() => setTab(0)} 
                    variant="contained" 
                    sx={{ px: 4 }}
                  >
                    Go to Login
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Paper>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
          Store NC Document Control System © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Container>
  );
}