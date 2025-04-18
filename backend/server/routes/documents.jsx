// backend/routes/documents.js
const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const db = require('../config/db');
const multer = require('multer');

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Helper: generate document number in format WNCMMYY + 4-digit running number
async function generateDocumentNumber() {
  const now = new Date();
  const monthYear = `WNC${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${now.getFullYear().toString().substr(-2)}`;
  const result = await db.query(
    'SELECT COUNT(*) as count FROM NC_documents WHERE document_number LIKE ?',
    [`${monthYear}%`]
  );
  // mysql2 returns [rows, fields] – adjust to get the count
  const count = result[0][0].count || 0;
  const runningNumber = (count + 1).toString().padStart(4, '0');
  return monthYear + runningNumber;
}

// SaleCo creates document
router.post(
  '/',
  verifyToken,
  authorizeRole(['SaleCo']),
  upload.fields([{ name: 'picture1' }, { name: 'picture2' }]),
  async (req, res) => {
    try {
      const documentNumber = await generateDocumentNumber();
      const {
        productType,
        productId,
        lotNo,
        size,
        quantity,
        issueFound,
        foundeeName,
        department,
        subsidiary,
        whatHappened,
        preventionMeasure
      } = req.body;
      const date = new Date();
      const picture1 = req.files['picture1'] ? req.files['picture1'][0].path : null;
      const picture2 = req.files['picture2'] ? req.files['picture2'][0].path : null;
      // Initial status (e.g., "Pending")
      const status = 'Pending';
      // Insert the new document into NC_documents
      const [result] = await db.query(
        `INSERT INTO NC_documents 
         (date, document_number, product_type, product_id, lot_no, size, quantity, issue_found, foundee_name, department, subsidiary, what_happened, prevention_measure, picture1, picture2, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          date,
          documentNumber,
          productType,
          productId,
          lotNo,
          size,
          quantity,
          issueFound,
          foundeeName,
          department,
          subsidiary,
          whatHappened,
          preventionMeasure,
          picture1,
          picture2,
          status,
          req.user.id
        ]
      );
      res.json({ message: 'Document created successfully', documentId: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error creating document' });
    }
  }
);

// SaleCo dashboard: view documents created by current user
router.get('/', verifyToken, authorizeRole(['SaleCo']), async (req, res) => {
  try {
    const [documents] = await db.query(
      'SELECT * FROM NC_documents WHERE created_by = ?',
      [req.user.id]
    );
    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Inventory and QA: view pending documents
router.get('/pending', verifyToken, authorizeRole(['Inventory', 'QA']), async (req, res) => {
  try {
    const [documents] = await db.query(
      'SELECT * FROM NC_documents WHERE status = ?',
      ['Pending']
    );
    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Get single document details
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      'SELECT * FROM NC_documents WHERE id = ?',
      [id]
    );
    if (result.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching document details' });
  }
});

// QA accepts a document & adds extra fields
router.put('/:id/accept', verifyToken, authorizeRole(['QA']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      solutions,
      comments,
      qaName, // Ideally, this may come from req.user.username in production
      peopleInvolved1,
      peopleInvolved2,
      damageCost,
      departmentResponsible
    } = req.body;
    await db.query(
      `UPDATE NC_documents 
       SET status = ?, solutions = ?, comments = ?, qa_name = ?, people_involved1 = ?, people_involved2 = ?, damage_cost = ?, department_responsible = ? 
       WHERE id = ?`,
      ['Accepted', solutions, comments, qaName, peopleInvolved1, peopleInvolved2, damageCost, departmentResponsible, id]
    );
    res.json({ message: 'Document accepted and updated by QA' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating document' });
  }
});

// Inventory verifies the document after physical check
router.put('/:id/verify', verifyToken, authorizeRole(['Inventory']), async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      'UPDATE NC_documents SET status = ? WHERE id = ?',
      ['Verified', id]
    );
    res.json({ message: 'Document verified by Inventory' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error verifying document' });
  }
});

module.exports = router;
