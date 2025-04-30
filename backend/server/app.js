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
const erpRoutes      = require('./routes/erpRoutes');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    // Ensure write permissions (0755 = owner: rwx, group: r-x, others: r-x)
    fs.chmodSync(uploadsDir, 0o755);
    console.log('Created uploads directory:', uploadsDir);
  } catch (error) {
    console.error('Error creating uploads directory:', error);
    // Try to create uploads in a different location if needed
    // const altUploadsDir = path.join(process.cwd(), 'uploads');
    // fs.mkdirSync(altUploadsDir, { recursive: true });
    // console.log('Created alternative uploads directory:', altUploadsDir);
  }
}

app.use(cors());
app.use(bodyParser.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));
app.use('/pdf', express.static(path.join(__dirname, 'pdf')));
// API routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/erp', erpRoutes);

// Serve the React frontend from the build directory
const buildPath = path.join(__dirname, 'build');
if (fs.existsSync(buildPath)) {
  console.log('Serving React build from:', buildPath);
  app.use(express.static(buildPath));
  
  // For any routes not matched by API or static files, serve the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));