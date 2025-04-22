// server/controllers/documentController.js
const db = require('../config/db');

exports.createNewDocument = async (req, res) => {
  console.log('💾 createNewDocument req.body:', req.body);
  console.log('💾 createNewDocument req.files:', req.files);

  try {
    // 1) Build Document_id prefix WNCMMYY
    const now = new Date();
    const mm  = String(now.getMonth() + 1).padStart(2, '0');
    const yy  = String(now.getFullYear()).slice(-2);
    const prefix = `WNC${yy}${mm}`;

    // 2) Find last sequence this month
    const [[{ last }]] = await db.pool
      .promise()
      .query(
        `SELECT MAX(Document_id) AS last
         FROM documents_nc
         WHERE Document_id LIKE ?`,
        [`${prefix}%`]
      );
    const seq = last
      ? String(parseInt(last.slice(-4), 10) + 1).padStart(4, '0')
      : '0001';

    // 3) Assemble data from text fields & uploaded files
    const doc = {
      Document_id: prefix + seq,
      status:      'Created',
      createdBy:   req.user.userId,

      // Don't parse Product_id as integer if it's meant to be a string
      Product_id:        req.body.productId, // Keep as string if that's what your DB expects
      Sn_number:         req.body.snNumber,
      Description:       req.body.description,
      date:              new Date(),
      Lot_No:            req.body.lotNo,
      Product_size:      req.body.size,
      Quantity:          parseInt(req.body.quantity, 10),
      Issue_Found:       req.body.issueFound,
      Foundee:           req.body.foundeeName,
      Department:        req.body.department,
      Issue_Description: req.body.whatHappened,
      Prevention:        req.body.preventionMeasure,

      // Store full URL path instead of just filename
      Img1: req.files && req.files.picture1
        ? `/uploads/${req.files.picture1[0].filename}`
        : null,
      Img2: req.files && req.files.picture2
        ? `/uploads/${req.files.picture2[0].filename}`
        : null
    };

    // 4) Insert into DB
    db.pool.query(
      `INSERT INTO documents_nc SET ?`,
      doc,
      (err, result) => {
        if (err) {
          console.error('[createNewDocument] DB error:', err);
          return res.status(500).json({ message: err.message });
        }
        res.status(201).json({ message: 'Document created', id: result.insertId });
      }
    );

  } catch (ex) {
    console.error('[createNewDocument] Unexpected:', ex);
    res.status(500).json({ message: ex.message });
  }
};

exports.getDocumentsByRole = (req, res) => {
  const { role, userId } = req.user;
  let sql, params = [];

  if (role === 'SaleCo') {
    sql = `
      SELECT d.*, u.name AS creatorName
      FROM documents_nc d
      JOIN NC_Login u ON d.createdBy = u.id
      WHERE d.createdBy = ?
      ORDER BY d.created_at DESC
    `;
    params.push(userId);
  } else {
    sql = `
      SELECT d.*, u.name AS creatorName
      FROM documents_nc d
      JOIN NC_Login u ON d.createdBy = u.id
      ORDER BY d.created_at DESC
    `;
  }

  db.pool.query(sql, params, (err, docs) => {
    if (err) {
      console.error('[getDocumentsByRole] DB error:', err);
      return res.status(500).json({ message: err.message });
    }
    res.json(docs);
  });
};

exports.getDocument = (req, res) => {
  const id = +req.params.id;
  db.pool.query(
    `SELECT d.*, u.name AS creatorName
     FROM documents_nc d
     JOIN NC_Login u ON d.createdBy = u.id
     WHERE d.id = ?`,
    [id],
    (err, results) => {
      if (err) {
        console.error('[getDocument] DB error:', err);
        return res.status(500).json({ message: err.message });
      }
      if (!results.length) return res.status(404).json({ message: 'Not found' });
      res.json(results[0]);
    }
  );
};

exports.deleteDocument = (req, res) => {
  const id = +req.params.id;
  db.pool.query(
    `DELETE FROM documents_nc WHERE id = ?`,
    [id],
    (err) => {
      if (err) {
        console.error('[deleteDocument] DB error:', err);
        return res.status(500).json({ message: err.message });
      }
      res.json({ message: 'Deleted' });
    }
  );
};

exports.acceptInventory = (req, res) => {
  const id   = +req.params.id;
  const name = req.user.name;
  db.pool.query(
    `
    UPDATE documents_nc
    SET
      status = CASE
        WHEN status = 'Accepted by QA' THEN 'Accepted by Both'
        ELSE 'Accepted by Inventory'
      END,
      InventoryName      = ?,
      InventoryTimeStamp = NOW()
    WHERE id = ?
    `,
    [name, id],
    (err) => {
      if (err) {
        console.error('[acceptInventory] DB error:', err);
        return res.status(500).json({ message: err.message });
      }
      res.json({ message: 'Accepted by Inventory' });
    }
  );
};

exports.acceptQA = (req, res) => {
  const id   = +req.params.id;
  const name = req.user.name;
  db.pool.query(
    `
    UPDATE documents_nc
    SET
      status = CASE
        WHEN status = 'Accepted by Inventory' THEN 'Accepted by Both'
        ELSE 'Accepted by QA'
      END,
      QAName      = ?,
      QATimeStamp = NOW()
    WHERE id = ?
    `,
    [name, id],
    (err) => {
      if (err) {
        console.error('[acceptQA] DB error:', err);
        return res.status(500).json({ message: err.message });
      }
      res.json({ message: 'Accepted by QA' });
    }
  );
};

exports.updateQADetails = (req, res) => {
  const id = +req.params.id;
  db.pool.query(
    `UPDATE documents_nc SET ? WHERE id = ?`,
    [req.body, id],
    (err) => {
      if (err) {
        console.error('[updateQADetails] DB error:', err);
        return res.status(500).json({ message: err.message });
      }
      res.json({ message: 'QA details saved' });
    }
  );
};


// server/controllers/documentController.js
exports.getByDocumentId = (req, res) => {
  const docId = req.params.documentId;
  db.pool.query(
    `SELECT d.*, u.name AS creatorName
     FROM documents_nc d
     JOIN NC_Login u ON d.createdBy = u.id
     WHERE d.Document_id = ?`,
    [docId],
    (err, rows) => {
      if (err) {
        console.error('[getByDocumentId] DB error:', err);
        return res.status(500).json({ message: err.message });
      }
      if (!rows.length) {
        return res.status(404).json({ message: 'Document not found' });
      }
      res.json(rows[0]);
    }
  );
};

exports.acceptManufacturing = (req, res) => {
  const id   = +req.params.id;
  const name = req.user.name;
  db.pool.query(
    `
    UPDATE documents_nc
    SET
      status = 'Accepted by Manufacture',
      ManufacturingName = ?,
      ManufacturingTimeStamp = NOW()
    WHERE id = ?
    `,
    [name, id],
    (err) => {
      if (err) {
        console.error('[acceptManufacturing] DB error:', err);
        return res.status(500).json({ message: err.message });
      }
      res.json({ message: 'Accepted by Manufacturing' });
    }
  );
};

exports.acceptEnvironment = (req, res) => {
  const id   = +req.params.id;
  const name = req.user.name;
  db.pool.query(
    `
    UPDATE documents_nc
    SET
      status = 'Accepted by Environment',
      EnvironmentName = ?,
      EnvironmentTimeStamp = NOW()
    WHERE id = ?
    `,
    [name, id],
    (err) => {
      if (err) {
        console.error('[acceptEnvironment] DB error:', err);
        return res.status(500).json({ message: err.message });
      }
      res.json({ message: 'Accepted by Environment' });
    }
  );
};