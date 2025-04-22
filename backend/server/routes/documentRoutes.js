// server/routes/documentRoutes.js
const express        = require('express');
const path           = require('path');
const multer         = require('multer');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');
const dc             = require('../controllers/documentController');

const router = express.Router();

// Multer setup: store files in /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ─── Create New Document ───────────────────────────────────────────────────────
// (SaleCo only, handles picture1 & picture2 uploads)
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(['SaleCo']),
  upload.fields([
    { name: 'picture1', maxCount: 1 },
    { name: 'picture2', maxCount: 1 }
  ]),
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

module.exports = router;
