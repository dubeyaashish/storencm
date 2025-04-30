const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { notifyDocumentCreated, notifyStatusChange } = require('../utils/telegramNotifier');
const { generateFormPDF, getPdfUrl } = require('../utils/pdfService');

exports.createNewDocument = async (req, res) => {
  console.log('💾 createNewDocument req.body:', req.body);
  console.log('💾 createNewDocument req.files:', req.files);

  try {
    // 1) Build Document_id prefix WNCMMYY
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
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
    const uploadsDir = path.join(__dirname, '..', 'Uploads');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory on demand:', uploadsDir);
    }

    // Construct image URLs with proper paths
    let Img1 = null;
    let Img2 = null;

    if (req.files?.picture1?.[0]?.filename) {
      const relativePath = `/Uploads/${req.files.picture1[0].filename}`;
      Img1 = relativePath;
      console.log('Img1 path:', Img1);
    }

    if (req.files?.picture2?.[0]?.filename) {
      const relativePath = `/Uploads/${req.files.picture2[0].filename}`;
      Img2 = relativePath;
      console.log('Img2 path:', Img2);
    }

    // 3) Assemble data from text fields & uploaded files
    const doc = {
      Document_id: prefix + seq,
      status: 'Created',
      createdBy: req.user.userId,
      Product_id: req.body.productId,
      Sn_number: req.body.snNumber,
      Description: req.body.description,
      date: new Date(),
      Lot_No: req.body.lotNo,
      Product_size: req.body.size,
      Quantity: parseInt(req.body.quantity, 10),
      Issue_Found: req.body.issueFound,
      Foundee: req.body.foundeeName,
      Department: req.body.department,
      Issue_Description: req.body.whatHappened,
      Prevention: req.body.preventionMeasure,
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
        
        // Generate PDF form from document data
        let PdfUrl = null;
        try {
          // Get full document data
          const [fullDoc] = await db.pool.promise().query(
            `SELECT d.*, u.name AS creatorName
             FROM documents_nc d 
             JOIN NC_Login u ON d.createdBy = u.id
             WHERE d.id = ?`,
            [result.insertId]
          );
          
          if (fullDoc && fullDoc.length > 0) {
            // Generate the PDF form
            const pdfPath = await generateFormPDF(fullDoc[0]);
            
            // Get full URL to the PDF
            PdfUrl = getPdfUrl(fullDoc[0].Document_id);
            
            // Add PDF URL to the document
            await db.pool.promise().query(
              `UPDATE documents_nc SET PdfUrl = ? WHERE id = ?`,
              [PdfUrl, result.insertId]
            );
            
            // Log document object before notification
            console.log('Document before notifyDocumentCreated:', { ...fullDoc[0], PdfUrl });
            
            // Send Telegram notification with PDF link
            await notifyDocumentCreated({
              ...fullDoc[0],
              PdfUrl
            });
          } else {
            // Fall back to basic document data
            const generatedPdfPath = await generateFormPDF(doc);
            PdfUrl = getPdfUrl(doc.Document_id);
            
            await db.pool.promise().query(
              `UPDATE documents_nc SET PdfUrl = ? WHERE id = ?`,
              [PdfUrl, result.insertId]
            );
            
            console.log('Fallback document before notifyDocumentCreated:', { ...doc, PdfUrl });
            
            await notifyDocumentCreated({
              ...doc,
              PdfUrl
            });
          }
        } catch (pdfError) {
          console.error('Failed to generate PDF form:', pdfError);
          
          // Send Telegram notification without PDF link
          try {
            const [fullDoc] = await db.pool.promise().query(
              `SELECT d.*, u.name AS creatorName
               FROM documents_nc d 
               JOIN NC_Login u ON d.createdBy = u.id
               WHERE d.id = ?`,
              [result.insertId]
            );
            
            if (fullDoc && fullDoc.length > 0) {
              console.log('Document before notifyDocumentCreated (no PDF):', fullDoc[0]);
              await notifyDocumentCreated(fullDoc[0]);
            } else {
              console.log('Fallback document before notifyDocumentCreated (no PDF):', doc);
              await notifyDocumentCreated(doc);
            }
          } catch (notifyError) {
            console.error('Failed to send Telegram notification:', notifyError);
          }
        }
        
        res.status(201).json({ 
          message: 'Document created', 
          id: result.insertId,
          documentId: doc.Document_id,
          PdfUrl
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
  const id = +req.params.id;
  const name = req.user.name;
  
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
        InventoryName = ?,
        InventoryTimeStamp = NOW()
      WHERE id = ?
      `,
      [name, id],
      async (err) => {
        if (err) {
          console.error('[acceptInventory] DB error:', err);
          return res.status(500).json({ message: err.message });
        }
        
        const [[updatedDoc]] = await db.pool.promise().query(
          `SELECT * FROM documents_nc WHERE id = ?`,
          [id]
        );
        
        updatedDoc.PdfUrl = updatedDoc.PdfUrl || getPdfUrl(updatedDoc.Document_id);
        console.log('Document before notifyStatusChange (acceptInventory):', updatedDoc);
        
        try {
          await notifyStatusChange(
            updatedDoc,
            updatedDoc.status === 'Accepted by Both' ? 'Accepted by Both' : 'Accepted by Inventory',
            name
          );
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
  const id = +req.params.id;
  const name = req.user.name;
  
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
        QAName = ?,
        QATimeStamp = NOW()
      WHERE id = ?
      `,
      [name, id],
      async (err) => {
        if (err) {
          console.error('[acceptQA] DB error:', err);
          return res.status(500).json({ message: err.message });
        }
        
        const [[updatedDoc]] = await db.pool.promise().query(
          `SELECT * FROM documents_nc WHERE id = ?`,
          [id]
        );
        
        updatedDoc.PdfUrl = updatedDoc.PdfUrl || getPdfUrl(updatedDoc.Document_id);
        console.log('Document before notifyStatusChange (acceptQA):', updatedDoc);
        
        try {
          await notifyStatusChange(
            updatedDoc,
            updatedDoc.status === 'Accepted by Both' ? 'Accepted by Both' : 'Accepted by QA',
            name
          );
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
        
        const [[updatedDoc]] = await db.pool.promise().query(
          `SELECT * FROM documents_nc WHERE id = ?`,
          [id]
        );
        
        updatedDoc.PdfUrl = updatedDoc.PdfUrl || getPdfUrl(updatedDoc.Document_id);
        console.log('Document before notifyStatusChange (updateQADetails):', updatedDoc);
        
        if (req.body.status === 'Send to Manufacture' || req.body.status === 'Send to Environment') {
          try {
            await notifyStatusChange(updatedDoc, req.body.status, req.user.name || 'QA');
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
  const id = +req.params.id;
  const name = req.user.name;
  
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
        
        const [[updatedDoc]] = await db.pool.promise().query(
          `SELECT * FROM documents_nc WHERE id = ?`,
          [id]
        );
        
        updatedDoc.PdfUrl = updatedDoc.PdfUrl || getPdfUrl(updatedDoc.Document_id);
        console.log('Document before notifyStatusChange (acceptManufacturing):', updatedDoc);
        
        try {
          await notifyStatusChange(updatedDoc, 'Accepted by Manufacturing', name);
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
  const id = +req.params.id;
  const name = req.user.name;
  
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
        
        const [[updatedDoc]] = await db.pool.promise().query(
          `SELECT * FROM documents_nc WHERE id = ?`,
          [id]
        );
        
        updatedDoc.PdfUrl = updatedDoc.PdfUrl || getPdfUrl(updatedDoc.Document_id);
        console.log('Document before notifyStatusChange (acceptEnvironment):', updatedDoc);
        
        try {
          await notifyStatusChange(updatedDoc, 'Accepted by Environment', name);
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

exports.getPdf = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'pdf', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'PDF not found' });
  }
  
  res.sendFile(filePath);
};

exports.regeneratePdf = async (req, res) => {
  try {
    const id = +req.params.id;
    
    const [doc] = await db.pool.promise().query(
      `SELECT * FROM documents_nc WHERE id = ?`,
      [id]
    );
    
    if (!doc.length) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    const pdfPath = await generateFormPDF(doc[0]);
    const PdfUrl = getPdfUrl(doc[0].Document_id);
    
    await db.pool.promise().query(
      `UPDATE documents_nc SET PdfUrl = ? WHERE id = ?`,
      [PdfUrl, id]
    );
    
    res.json({
      message: 'PDF regenerated successfully',
      PdfUrl
    });
  } catch (error) {
    console.error('Error regenerating PDF:', error);
    res.status(500).json({ message: 'Error regenerating PDF' });
  }
};