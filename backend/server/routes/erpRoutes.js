const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const { getERPItems } = require('../controllers/erpController');

// Get ERP items for autocomplete
router.get('/items', authenticateJWT, (req, res, next) => {
  console.log('ERP items route hit with query:', req.query);
  next();
}, getERPItems);

module.exports = router;