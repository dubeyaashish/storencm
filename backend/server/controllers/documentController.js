// server/controllers/documentController.js
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { notifyDocumentCreated, notifyStatusChange } = require('../utils/telegramNotifier');

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

    // Get the absolute path to uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory on demand:', uploadsDir);
    }

    // Construct image URLs with proper paths
    let Img1 = null;
    let Img2 = null;

    if (req.files?.picture1?.[0]?.filename) {
      const relativePath = `/uploads/${req.files.picture1[0].filename}`;
      Img1 = relativePath;
      console.log('Img1 path:', Img1);
    }

    if (req.files?.picture2?.[0]?.filename) {
      const relativePath = `/uploads/${req.files.picture2[0].filename}`;
      Img2 = relativePath;
      console.log('Img2 path:', Img2);
    }

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
      Img1,
      Img2
    };

    // 4) Insert into DB
    db.pool.query(
      `INSERT INTO documents_nc SET ?`,
      doc,
      async (err, result) => {
        if (err) {
          console.error('[createNewDocument] DB error:', err);
          return res.status(500).json({ message: err.message });
        }
        
        // Send Telegram notification after successful document creation
        try {
          await notifyDocumentCreated(doc);
        } catch (notifyError) {
          console.error('Failed to send Telegram notification:', notifyError);
          // Continue with response, don't fail the request due to notification error
        }
        
        res.status(201).json({ 
          message: 'Document created', 
          id: result.insertId,
          documentId: doc.Document_id
        });
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

exports.acceptInventory = async (req, res) => {
  const id   = +req.params.id;
  const name = req.user.name;
  
  // First get the document to send in notification
  try {
    const [doc] = await db.pool.promise().query(
      `SELECT * FROM documents_nc WHERE id = ?`,
      [id]
    );
    
    if (!doc.length) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
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
      async (err) => {
        if (err) {
          console.error('[acceptInventory] DB error:', err);
          return res.status(500).json({ message: err.message });
        }
        
        // Send notification
        try {
          await notifyStatusChange(doc[0], 'Accepted by Inventory', name);
        } catch (notifyError) {
          console.error('Failed to send Telegram notification:', notifyError);
        }
        
        res.json({ message: 'Accepted by Inventory' });
      }
    );
  } catch (ex) {
    console.error('[acceptInventory] Unexpected:', ex);
    res.status(500).json({ message: ex.message });
  }
};

exports.acceptQA = async (req, res) => {
  const id   = +req.params.id;
  const name = req.user.name;
  
  // First get the document to send in notification
  try {
    const [doc] = await db.pool.promise().query(
      `SELECT * FROM documents_nc WHERE id = ?`,
      [id]
    );
    
    if (!doc.length) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
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
      async (err) => {
        if (err) {
          console.error('[acceptQA] DB error:', err);
          return res.status(500).json({ message: err.message });
        }
        
        // Send notification
        try {
          await notifyStatusChange(doc[0], 'Accepted by QA', name);
        } catch (notifyError) {
          console.error('Failed to send Telegram notification:', notifyError);
        }
        
        res.json({ message: 'Accepted by QA' });
      }
    );
  } catch (ex) {
    console.error('[acceptQA] Unexpected:', ex);
    res.status(500).json({ message: ex.message });
  }
};

exports.updateQADetails = async (req, res) => {
  const id = +req.params.id;
  
  // First get the document to send in notification
  try {
    const [doc] = await db.pool.promise().query(
      `SELECT * FROM documents_nc WHERE id = ?`,
      [id]
    );
    
    if (!doc.length) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    db.pool.query(
      `UPDATE documents_nc SET ? WHERE id = ?`,
      [req.body, id],
      async (err) => {
        if (err) {
          console.error('[updateQADetails] DB error:', err);
          return res.status(500).json({ message: err.message });
        }
        
        // Send notification if status is changing to send to manufacture or environment
        if (req.body.status === 'Send to Manufacture' || req.body.status === 'Send to Environment') {
          try {
            await notifyStatusChange(doc[0], req.body.status, req.user.name || 'QA');
          } catch (notifyError) {
            console.error('Failed to send Telegram notification:', notifyError);
          }
        }
        
        res.json({ message: 'QA details saved' });
      }
    );
  } catch (ex) {
    console.error('[updateQADetails] Unexpected:', ex);
    res.status(500).json({ message: ex.message });
  }
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

exports.acceptManufacturing = async (req, res) => {
  const id   = +req.params.id;
  const name = req.user.name;
  
  // First get the document to send in notification
  try {
    const [doc] = await db.pool.promise().query(
      `SELECT * FROM documents_nc WHERE id = ?`,
      [id]
    );
    
    if (!doc.length) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
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
      async (err) => {
        if (err) {
          console.error('[acceptManufacturing] DB error:', err);
          return res.status(500).json({ message: err.message });
        }
        
        // Send notification
        try {
          await notifyStatusChange(doc[0], 'Accepted by Manufacturing', name);
        } catch (notifyError) {
          console.error('Failed to send Telegram notification:', notifyError);
        }
        
        res.json({ message: 'Accepted by Manufacturing' });
      }
    );
  } catch (ex) {
    console.error('[acceptManufacturing] Unexpected:', ex);
    res.status(500).json({ message: ex.message });
  }
};

exports.acceptEnvironment = async (req, res) => {
  const id   = +req.params.id;
  const name = req.user.name;
  
  // First get the document to send in notification
  try {
    const [doc] = await db.pool.promise().query(
      `SELECT * FROM documents_nc WHERE id = ?`,
      [id]
    );
    
    if (!doc.length) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
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
      async (err) => {
        if (err) {
          console.error('[acceptEnvironment] DB error:', err);
          return res.status(500).json({ message: err.message });
        }
        
        // Send notification
        try {
          await notifyStatusChange(doc[0], 'Accepted by Environment', name);
        } catch (notifyError) {
          console.error('Failed to send Telegram notification:', notifyError);
        }
        
        res.json({ message: 'Accepted by Environment' });
      }
    );
  } catch (ex) {
    console.error('[acceptEnvironment] Unexpected:', ex);
    res.status(500).json({ message: ex.message });
  }
};