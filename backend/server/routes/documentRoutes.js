// server/routes/documentRoutes.js
const express        = require('express');
const path           = require('path');
const multer         = require('multer');
const fs             = require('fs');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const dc             = require('../controllers/documentController');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    // Ensure write permissions (0755 = owner: rwx, group: r-x, others: r-x)
    fs.chmodSync(uploadsDir, 0o755);
    console.log('Created uploads directory from routes:', uploadsDir);
  } catch (error) {
    console.error('Error creating uploads directory from routes:', error);
  }
}

// Ensure PDF directory exists
const pdfDir = path.join(__dirname, '../pdf');
if (!fs.existsSync(pdfDir)) {
  try {
    fs.mkdirSync(pdfDir, { recursive: true });
    // Ensure write permissions
    fs.chmodSync(pdfDir, 0o755);
    console.log('Created pdf directory from routes:', pdfDir);
  } catch (error) {
    console.error('Error creating pdf directory from routes:', error);
  }
}

// Multer setup: store files in /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before trying to write to it
    if (!fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('Created uploads directory on demand in multer:', uploadsDir);
      } catch (error) {
        console.error('Error creating uploads directory in multer:', error);
        return cb(error, null);
      }
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Keep the original file extension
    const ext = path.extname(file.originalname);
    cb(null, uniquePrefix + ext);
  }
});

// Add file filter to only allow images
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// ─── Create New Document ───────────────────────────────────────────────────────
// (SaleCo only, handles picture1 & picture2 uploads)
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(['SaleCo']),
  (req, res, next) => {
    // Log request just before handling the upload
    console.log('About to process file upload. Request body:', req.body);
    console.log('Upload directory:', uploadsDir);
    next();
  },
  upload.fields([
    { name: 'picture1', maxCount: 1 },
    { name: 'picture2', maxCount: 1 }
  ]),
  (req, res, next) => {
    // Log after file processing
    console.log('Files processed:', req.files);
    next();
  },
  dc.createNewDocument
);

// ─── List Documents ───────────────────────────────────────────────────────────
router.get(
  '/list',
  authenticateJWT,
  dc.getDocumentsByRole
);

// ─── Get Single Document ─────────────────────────────────────────────────────
router.get(
  '/:id',
  authenticateJWT,
  dc.getDocument
);

// ─── Delete (SaleCo only) ─────────────────────────────────────────────────────
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles(['SaleCo']),
  dc.deleteDocument
);

// ─── Inventory Accept ─────────────────────────────────────────────────────────
router.post(
  '/:id/accept-inventory',
  authenticateJWT,
  authorizeRoles(['Inventory']),
  dc.acceptInventory
);

// ─── QA Accept ─────────────────────────────────────────────────────────────────
router.post(
  '/:id/accept-qa',
  authenticateJWT,
  authorizeRoles(['QA']),
  dc.acceptQA
);

// ─── QA Detail Update ──────────────────────────────────────────────────────────
router.put(
  '/:id/qa-details',
  authenticateJWT,
  authorizeRoles(['QA']),
  dc.updateQADetails
);

router.get(
  '/view/:documentId',
  authenticateJWT,
  dc.getByDocumentId
);

router.post(
  '/:id/accept-manufacturing',
  authenticateJWT,
  authorizeRoles(['Manufacturing']),
  dc.acceptManufacturing
);

router.post(
  '/:id/accept-environment',
  authenticateJWT,
  authorizeRoles(['Environment']),
  dc.acceptEnvironment
);

// ─── PDF Routes ─────────────────────────────────────────────────────────────────
// Get PDF by filename
router.get(
  '/pdf/:filename',
  authenticateJWT,
  dc.getPdf
);

// Regenerate PDF
router.post(
  '/:id/regenerate-pdf',
  authenticateJWT,
  dc.regeneratePdf
);

module.exports = router;