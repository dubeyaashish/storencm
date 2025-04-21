// server/controllers/authController.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jwt-simple');
const nodemailer = require('nodemailer');
const {
  findUserByEmail,
  findUserById,
  findPendingByEmail,
  createPending,
  deletePending,
  createUser
} = require('../models/userModel');
const { generateToken } = require('../middleware/authMiddleware');

// SMTP transporter for OTP emails
const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.FROM_EMAIL,
    pass: process.env.OUTLOOK_PASS
  }
});

/**
 * Generate a 6-digit OTP code
 * @returns {String} 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Get expiry time for OTP (5 minutes from now)
 * @returns {Date} Expiry time
 */
function getExpiryTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  return now;
}

/**
 * Get HTML template for OTP email
 * @param {String} otp - OTP code
 * @returns {String} HTML email template
 */
function getOTPTemplate(otp) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #FF5700; text-align: center;">Your OTP Code</h2>
      <p style="font-size: 16px; line-height: 1.5;">Please use the following one-time password to complete your registration:</p>
      <div style="text-align: center; padding: 15px; background-color: #f5f5f5; border-radius: 4px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #777; margin-top: 20px;">This code will expire in 5 minutes.</p>
      <p style="font-size: 14px; color: #777;">If you didn't request this code, please ignore this email.</p>
    </div>
  `;
}

/**
 * Registration (Step 1): Create pending registration and send OTP
 * POST /api/auth/register
 */
exports.register = (req, res) => {
  try {
    const { name, surname, employeeId, email, role, department, password, confirmPassword } = req.body;
    console.log('[REGISTER] payload:', { ...req.body, password: '***', confirmPassword: '***' });

    // Validate
    if (!name || !surname || !employeeId || !email || !role || !department || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Check existing user
    findUserByEmail(email, (err, user) => {
      if (err) {
        console.error('[REGISTER] DB error on findUserByEmail:', err);
        return res.status(500).json({ message: 'Server error checking user.' });
      }
      if (user) {
        console.warn('[REGISTER] Email in use:', email);
        return res.status(400).json({ message: 'Email already in use.' });
      }

      // Hash + save pending + send OTP
      const otp = generateOTP();
      const otp_expiry = getExpiryTime();

      bcrypt.hash(password, 10, (hashErr, passwordHash) => {
        if (hashErr) {
          console.error('[REGISTER] bcrypt.hash error:', hashErr);
          return res.status(500).json({ message: 'Server error hashing password.' });
        }

        createPending({ 
          name, 
          surname, 
          employeeId, 
          email, 
          role, 
          department, 
          passwordHash, 
          otp, 
          otp_expiry 
        }, (insertErr) => {
          if (insertErr) {
            console.error('[REGISTER] DB error on createPending:', insertErr);
            return res.status(500).json({ message: 'Server error saving registration.' });
          }

          transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: email,
            subject: 'Your OTP Code',
            html: getOTPTemplate(otp)
          }, (mailErr) => {
            if (mailErr) {
              console.error('[REGISTER] nodemailer error:', mailErr);
              return res.status(500).json({ message: 'Server error sending OTP email.' });
            }
            console.log('[REGISTER] OTP sent to', email, 'OTP:', otp);
            res.json({ message: 'OTP sent; please check your email.' });
          });
        });
      });
    });
  } catch (ex) {
    console.error('[REGISTER] Unexpected error:', ex);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * OTP Verification (Step 2): Verify OTP and create user
 * POST /api/auth/verify-otp
 */
exports.verifyOtp = (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('[VERIFY OTP] payload:', req.body);

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email & OTP required.' });
    }

    findPendingByEmail(email, (err, pending) => {
      if (err) {
        console.error('[VERIFY OTP] DB error on findPendingByEmail:', err);
        return res.status(500).json({ message: 'Server error fetching pending.' });
      }
      if (!pending) {
        console.warn('[VERIFY OTP] No pending record for:', email);
        return res.status(400).json({ message: 'No pending registration found.' });
      }
      if (pending.otp !== otp) {
        console.warn('[VERIFY OTP] Invalid OTP for:', email);
        return res.status(400).json({ message: 'Invalid OTP.' });
      }
      if (new Date() > new Date(pending.otp_expiry)) {
        console.warn('[VERIFY OTP] OTP expired for:', email);
        return res.status(400).json({ message: 'OTP has expired.' });
      }

      // Insert real user
      createUser({
        name: pending.name,
        surname: pending.surname,
        employeeId: pending.employeeId,
        email: pending.email,
        role: pending.role,
        department: pending.department,
        passwordHash: pending.password
      }, (createErr) => {
        if (createErr) {
          console.error('[VERIFY OTP] DB error on createUser:', createErr);
          return res.status(500).json({ message: 'Server error creating user.' });
        }
        deletePending(email, (delErr) => {
          if (delErr) console.error('[VERIFY OTP] warning: deletePending error:', delErr);
          console.log('[VERIFY OTP] Registration complete for:', email);
          res.json({ message: 'Registration successful. You may now log in.' });
        });
      });
    });
  } catch (ex) {
    console.error('[VERIFY OTP] Unexpected error:', ex);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Login: Authenticate user and issue JWT
 * POST /api/auth/login
 */
// Updated login function in authController.js to ensure user data is properly returned
exports.login = (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[LOGIN] payload:', { email, password: '***' });

    if (!email || !password) {
      return res.status(400).json({ message: 'Email & password required.' });
    }

    findUserByEmail(email, (err, user) => {
      if (err) {
        console.error('[LOGIN] DB error on findUserByEmail:', err);
        return res.status(500).json({ message: 'Server error during login.' });
      }
      if (!user) {
        console.warn('[LOGIN] No user found for:', email);
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      bcrypt.compare(password, user.password, (cmpErr, match) => {
        if (cmpErr) {
          console.error('[LOGIN] bcrypt.compare error:', cmpErr);
          return res.status(500).json({ message: 'Server error during login.' });
        }
        if (!match) {
          console.warn('[LOGIN] Password mismatch for:', email);
          return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Generate JWT token
        const token = generateToken({ id: user.id, role: user.role });
        
        console.log('[LOGIN] success for:', email);
        res.json({ 
          token, 
          role: user.role,
          user: {
            id: user.id,
            name: user.name,
            surname: user.surname, // Include surname
            email: user.email,
            // Include any other needed user fields
            employeeId: user.employeeId,
            department: user.department
          }
        });
      });
    });
  } catch (ex) {
    console.error('[LOGIN] Unexpected error:', ex);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
exports.getProfile = (req, res) => {
  const userId = req.user.id;  // Changed from userId to id to match the token payload
  
  findUserById(userId, (err, user) => {
    if (err) {
      console.error('[PROFILE] DB error:', err);
      return res.status(500).json({ message: 'Server error fetching profile.' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Don't send password
    delete user.password;
    
    res.json(user);
  });
};