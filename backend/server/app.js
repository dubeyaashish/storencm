// server/app.js
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env')
});

const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const fs         = require('fs');
const authRoutes     = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const erpRoutes      = require('./routes/erpRoutes'); // Add this line

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth',      authRoutes);
app.use('/uploads', express.static(uploadsDir));
app.use('/api/documents', documentRoutes);
app.use('/api/erp',       erpRoutes); // Add this line

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));