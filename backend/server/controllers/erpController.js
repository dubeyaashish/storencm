const db = require('../config/db');

/**
 * Get ERP items for autocomplete
 * Searches by Product ID (name) or Description (display_name)
 */
exports.getERPItems = (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.json([]); // Return empty array for short queries
  }
  
  const searchQuery = `
    SELECT name as id, name as itemId, display_name as description
    FROM misppg_lg.ERP_Item
    WHERE name LIKE ? OR display_name LIKE ?
    LIMIT 10
  `;
  
  const searchParam = `%${query}%`;
  
  db.pool.query(searchQuery, [searchParam, searchParam], (err, results) => {
    if (err) {
      console.error('[getERPItems] DB error:', err);
      return res.status(500).json({ message: 'Error fetching ERP items' });
    }
    console.log('ERP query results:', results); // Debug log
    res.json(results);
  });
};