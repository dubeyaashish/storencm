const db = require('../config/db');

/**
 * Create a new document
 * @param {Object} documentData - Document data from controller (includes Document_id, status, createdBy, etc)
 * @param {Function} callback - Callback function(err, result)
 */
const createDocument = (documentData, callback) => {
  const sql = `INSERT INTO documents_nc SET ?`;
  db.pool.query(sql, documentData, callback);
};

/**
 * Get documents based on user role
 */
const getDocumentsByUserRole = (role, userId, callback) => {
  let sql = '';
  let params = [];

  switch (role) {
    case 'SaleCo':
      sql = `
        SELECT d.*, u.name AS creatorName 
        FROM documents_nc d
        JOIN NC_Login u ON d.createdBy = u.id
        WHERE d.createdBy = ?
        ORDER BY d.created_at DESC
      `;
      params = [userId];
      break;

    case 'QA':
    case 'Inventory':
      sql = `
        SELECT d.*, u.name AS creatorName 
        FROM documents_nc d
        JOIN NC_Login u ON d.createdBy = u.id
        ORDER BY d.created_at DESC
      `;
      break;

    default:
      return callback(new Error('Invalid role'));
  }

  db.pool.query(sql, params, (err, results) => {
    if (err) return callback(err);

    // strip out any Buffer fields
    const documents = results.map(doc => ({ ...doc }));
    callback(null, documents);
  });
};

/**
 * Get a single document by its internal id
 */
const getDocumentById = (id, callback) => {
  const sql = `
    SELECT d.*, u.name AS creatorName
    FROM documents_nc d
    JOIN NC_Login u ON d.createdBy = u.id
    WHERE d.id = ?
  `;
  db.pool.query(sql, [id], (err, results) => {
    if (err) return callback(err);
    if (!results.length) return callback(null, null);
    callback(null, results[0]);
  });
};

/**
 * Update arbitrary columns for a document
 */
const updateDocument = (id, updateData, callback) => {
  const sql = `UPDATE documents_nc SET ? WHERE id = ?`;
  db.pool.query(sql, [updateData, id], callback);
};

/**
 * Delete a document
 */
const deleteDocument = (id, callback) => {
  const sql = `DELETE FROM documents_nc WHERE id = ?`;
  db.pool.query(sql, [id], callback);
};

/**
 * Inventory “accept” — flips status to
 *  • “Accepted by Inventory”
 *  • or “Accepted by Both” if QA already accepted
 */
const acceptByInventory = (id, inventoryName, callback) => {
  const sql = `
    UPDATE documents_nc
    SET
      status = CASE
        WHEN status = 'Accepted by QA' THEN 'Accepted by Both'
        ELSE 'Accepted by Inventory'
      END,
      InventoryName      = ?,
      InventoryTimeStamp = NOW()
    WHERE id = ?
  `;
  db.pool.query(sql, [inventoryName, id], callback);
};

/**
 * QA “accept” stamp — flips status to
 *  • “Accepted by QA”
 *  • or “Accepted by Both” if Inventory already accepted
 */
const acceptByQA = (id, qaName, callback) => {
  const sql = `
    UPDATE documents_nc
    SET
      status = CASE
        WHEN status = 'Accepted by Inventory' THEN 'Accepted by Both'
        ELSE 'Accepted by QA'
      END,
      QAName      = ?,
      QATimeStamp = NOW()
    WHERE id = ?
  `;
  db.pool.query(sql, [qaName, id], callback);
};

module.exports = {
  createDocument,
  getDocumentsByUserRole,
  getDocumentById,
  updateDocument,
  deleteDocument,
  acceptByInventory,
  acceptByQA
};
