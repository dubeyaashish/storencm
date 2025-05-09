// server/routes/documentRoutes.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const dc = require('../controllers/documentController');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../Uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.chmodSync(UploadsDir, 0o755);
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
    fs.chmodSync(pdfDir, 0o755);
    console.log('Created pdf directory from routes:', pdfDir);
  } catch (error) {
    console.error('Error creating pdf directory from routes:', error);
  }
}

// Multer setup: store files in /Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(UploadsDir, { recursive: true });
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
    const ext = path.extname(file.originalname);
    cb(null, uniquePrefix + ext);
  }
});

// File filter for images and PDFs
const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf)$/)) {
    return cb(new Error('Only image files and PDFs are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// ─── Routes ───────────────────────────────────────────────────────────
// Create New Document
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(['SaleCo', 'Reporter', 'QA', 'Inventory', 'Manufacturing', 'Environment']),
  (req, res, next) => {
    console.log('About to process file upload. Request body:', req.body);
    console.log('Upload directory:', uploadsDir);
    next();
  },
  upload.fields([
    { name: 'picture1', maxCount: 1 },
    { name: 'picture2', maxCount: 1 },
  ]),
  (req, res, next) => {
    console.log('Files processed:', req.files);
    next();
  },
  dc.createNewDocument
);

// List Documents
router.get('/list', authenticateJWT, dc.getDocumentsByRole);

// Get Single Document
router.get('/:id', authenticateJWT, dc.getDocument);

// Delete Document
router.delete('/:id', authenticateJWT, authorizeRoles(['SaleCo', 'Reporter']), dc.deleteDocument);

// Inventory Accept
router.post('/:id/accept-inventory', authenticateJWT, authorizeRoles(['Inventory']), dc.acceptInventory);

// QA Accept
router.post('/:id/accept-qa', authenticateJWT, authorizeRoles(['QA']), dc.acceptQA);

// QA Detail Update
router.put('/:id/qa-details', authenticateJWT, authorizeRoles(['QA', 'SaleCo']), dc.updateQADetails);

// Get Document by Document_id
router.get('/view/:documentId', authenticateJWT, dc.getByDocumentId);

// Manufacturing Accept
router.post('/:id/accept-manufacturing', authenticateJWT, authorizeRoles(['Manufacturing']), dc.acceptManufacturing);

// Environment Accept
router.post('/:id/accept-environment', authenticateJWT, authorizeRoles(['Environment']), dc.acceptEnvironment);

// Complete SaleCo Review
router.post(
  '/:id/complete-saleco-review',
  authenticateJWT,
  authorizeRoles(['SaleCo']),
  upload.single('attachment'),
  (req, res, next) => {
    console.log('SaleCo review completion request:');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers['content-type']);
    next();
  },
  dc.completeSaleCoReview
);

// Get PDF by filename
router.get('/pdf/:filename', authenticateJWT, dc.getPdf);

// Regenerate PDF
router.post('/:id/regenerate-pdf', authenticateJWT, dc.regeneratePdf);

module.exports = router;