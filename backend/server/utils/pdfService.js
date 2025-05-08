// backend/server/utils/pdfService.js
const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');
const QRCode = require('qrcode');

// Define paths
const PDF_OUTPUT_DIR = path.join(__dirname, '..', 'pdf');
const FONTS_DIR = path.join(__dirname, '..', 'fonts');

// Ensure directories exist
fs.ensureDirSync(PDF_OUTPUT_DIR);
fs.ensureDirSync(FONTS_DIR);

// Thai headers and labels - direct string literals without any spaces in Thai text
const thaiText = {
  title: 'Non-Conformance',
  document: 'Document Number',
  date: 'วันที่',
  status: 'สถานะ',
  productInfo: 'ข้อมูลสินค้า',
  issueInfo: 'ข้อมูลปัญหา',
  issueDesc: 'รายละเอียดปัญหา',
  prevention: 'มาตรการป้องกัน',
  qaAssessment: 'การประเมินคุณภาพ',
  inventoryAssessment: 'การประเมินคลังสินค้า',
  mfgAssessment: 'การประเมินการผลิต',
  envAssessment: 'การประเมินสิ่งแวดล้อม',
  salecoReview: 'การทบทวนโดย SaleCo',
  generated: 'สร้างเมื่อ',
  docId: 'รหัสเอกสาร',
  comments: 'ความคิดเห็น',
  solutionDesc: 'รายละเอียดการแก้ไข',
  envImpact: 'ผลกระทบต่อสิ่งแวดล้อม',
  mitigation: 'มาตรการบรรเทาผลกระทบ',
  
  // Field labels - no spaces in Thai text
  productId: 'รหัสสินค้า',
  description: 'รายละเอียด',
  serialNumber: 'หมายเลขซีเรียล',
  lotNumber: 'หมายเลขล็อต',
  size: 'ขนาด',
  quantity: 'จำนวน',
  issueFound: 'ปัญหาที่พบ',
  foundee: 'ผู้พบ',
  department: 'แผนก',
  qaOfficer: 'เจ้าหน้าที่QA',
  timestamp: 'เวลา',
  solution: 'การแก้ไข',
  damageCost: 'ค่าเสียหาย',
  deptExpense: 'ค่าใช้จ่ายแผนก',
  inventoryOfficer: 'เจ้าหน้าที่คลังสินค้า',
  mfgOfficer: 'เจ้าหน้าที่การผลิต',
  envOfficer: 'เจ้าหน้าที่สิ่งแวดล้อม',
  reviewedBy: 'ทบทวนโดย'
};

/**
 * Generate a QR code as a PNG file
 * @param {String} url - The URL to encode in the QR code
 * @param {String} outputPath - The path to save the QR code PNG
 * @returns {Promise<Boolean>} Success or failure
 */
async function generateQRCode(url, outputPath) {
  try {
    await QRCode.toFile(outputPath, url, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return true;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return false;
  }
}

/**
 * Format a date for display
 * @param {Date|String} date - The date to format
 * @returns {String} Formatted date string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return dateObj.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (e) {
    return 'N/A';
  }
}

/**
 * Format a timestamp for display
 * @param {Date|String} timestamp - The timestamp to format
 * @returns {String} Formatted timestamp string
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  try {
    const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return dateObj.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'N/A';
  }
}

/**
 * Generate a PDF file from document data using PDFKit
 * @param {Object} document - The document object with all field data
 * @returns {Promise<String>} Path to the generated PDF
 */
async function generateFormPDF(document) {
  return new Promise(async (resolve, reject) => {
    try {
      // Make sure we have a document ID
      if (!document.Document_id) {
        throw new Error('Document ID is required');
      }

      // Paths
      const outputFilename = `${document.Document_id.replace(/\//g, '-')}.pdf`;
      const outputPath = path.join(PDF_OUTPUT_DIR, outputFilename);
      const thaiFontPath = path.join(FONTS_DIR, 'NotoSansThai-Regular.ttf');
      const thaiFont = fs.existsSync(thaiFontPath) ? thaiFontPath : null;

      // Create temp directory for QR code if needed
      const tempDir = path.join(__dirname, '..', 'temp');
      fs.ensureDirSync(tempDir);
      
      // Generate QR Code if we have a URL
      const pdfUrl = getPdfUrl(document.Document_id);
      const qrCodePath = path.join(tempDir, `qr-${document.Document_id.replace(/\//g, '-')}.png`);
      let hasQRCode = false;
      
      if (pdfUrl) {
        hasQRCode = await generateQRCode(pdfUrl, qrCodePath);
      }

      // Create a new PDF document with correct font settings
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Non-Conformance Report - ${document.Document_id}`,
          Author: 'Document Control System',
          Subject: 'Non-Conformance Report',
          Keywords: 'NC, report, quality',
          CreationDate: new Date()
        }
      });

      // Stream to file
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Register fonts
      if (thaiFont) {
        // Register Thai font
        doc.registerFont('ThaiFontRegular', thaiFontPath);
        doc.registerFont('ThaiFontBold', thaiFontPath); // We'll use the same font for bold
      } else {
        // Fallback to built-in fonts
        doc.registerFont('ThaiFontRegular', 'Helvetica');
        doc.registerFont('ThaiFontBold', 'Helvetica-Bold');
      }

      // Define common styles & colors
      const colors = {
        primary: '#1a66cc', // Deep blue
        secondary: '#cc5500', // Orange
        text: '#333333',
        lightGray: '#666666',
        green: '#33a852',
        purple: '#8031a7',
        red: '#b30000'
      };

      const fonts = {
        regular: 'ThaiFontRegular',
        bold: 'ThaiFontBold'
      };

      const fontSize = {
        title: 24,
        header: 16,
        subheader: 12,
        normal: 10,
        small: 8
      };

      // Drawing functions
      function drawHeader() {
        // Title
        doc.font(fonts.bold)
           .fontSize(fontSize.title)
           .fillColor(colors.primary)
           .text('Non-Conformance Report', { align: 'left' });

        doc.moveDown(0.5);

        // Document ID and Date with proper spacing for Thai characters
        const y = doc.y;
        doc.font(fonts.bold)
           .fontSize(fontSize.header)
           .fillColor(colors.primary)
           .text(`${thaiText.document}: ${document.Document_id}`, { continued: false });

        const dateStr = formatDate(document.date);
        doc.font(fonts.regular)
           .fontSize(fontSize.subheader)
           .fillColor(colors.text)
           .text(`${thaiText.date}: ${dateStr}`, { align: 'right' });

        doc.moveDown(0.5);

        // Status bar
        doc.rect(doc.x, doc.y, doc.page.width - doc.page.margins.left - doc.page.margins.right, 30)
           .fillOpacity(0.1)
           .fillAndStroke(colors.primary, colors.primary);

        doc.fillOpacity(1)
           .font(fonts.bold)
           .fontSize(fontSize.header)
           .fillColor(colors.primary)
           .text(`${thaiText.status}: ${document.status || 'Created'}`, doc.x + 10, doc.y + 8);

        doc.moveDown(1.5);
      }

      function drawSection(title, color = colors.primary) {
        doc.font(fonts.bold)
           .fontSize(fontSize.header)
           .fillColor(color)
           .text(title, { underline: false });

        doc.moveDown(0.5);
      }

      function drawField(label, value, options = {}) {
        const { indent = 0, color = colors.text } = options;
        
        doc.font(fonts.bold)
           .fontSize(fontSize.normal)
           .fillColor(color)
           .text(label, doc.x + indent, doc.y, { continued: true })
           .font(fonts.regular)
           .text(': ' + (value || 'N/A'));
      }

      function drawLongText(label, text, options = {}) {
        const { indent = 0, color = colors.text } = options;
        
        doc.font(fonts.bold)
           .fontSize(fontSize.normal)
           .fillColor(color)
           .text(label, doc.x + indent, doc.y);
           
        doc.moveDown(0.2);
        
        if (text) {
          doc.font(fonts.regular)
             .fontSize(fontSize.normal)
             .fillColor(color)
             .text(text, doc.x + indent + 10, doc.y);
        } else {
          doc.font(fonts.regular)
             .fontSize(fontSize.normal)
             .fillColor(colors.lightGray)
             .text('No information provided.', doc.x + indent + 10, doc.y);
        }
        
        doc.moveDown(0.5);
      }

      // Start drawing the document
      drawHeader();

      // Product Information Section
      drawSection(thaiText.productInfo);
      
      // Use field drawing helper
      drawField(thaiText.productId, document.Product_id);
      drawField(thaiText.description, document.Description);
      drawField(thaiText.serialNumber, document.Sn_number);
      drawField(thaiText.lotNumber, document.Lot_No);
      drawField(thaiText.size, document.Product_size);
      drawField(thaiText.quantity, document.Quantity);

      doc.moveDown(1);

      // Issue Information Section
      drawSection(thaiText.issueInfo, colors.secondary);
      
      drawField(thaiText.issueFound, document.Issue_Found);
      drawField(thaiText.foundee, document.Foundee);
      drawField(thaiText.department, document.Department);
      
      doc.moveDown(0.5);
      
      // Issue Description
      drawLongText(thaiText.issueDesc, document.Issue_Description);
      
      // Prevention Measure
      drawLongText(thaiText.prevention, document.Prevention);

      doc.moveDown(0.5);

      // Add QA Assessment Section if available
      if (document.QAName || document.status?.includes('QA') || document.QASolution) {
        drawSection(thaiText.qaAssessment, colors.green);
        
        drawField(thaiText.qaOfficer, document.QAName);
        drawField(thaiText.timestamp, formatTimestamp(document.QATimeStamp));
        drawField(thaiText.solution, document.QASolution);
        drawField(thaiText.damageCost, document.DamageCost ? `$${document.DamageCost}` : 'N/A');
        drawField(thaiText.deptExpense, document.DepartmentExpense);
        
        // QA Solution Description
        if (document.QASolutionDescription) {
          doc.moveDown(0.5);
          drawLongText(thaiText.solutionDesc, document.QASolutionDescription);
        }
        
        doc.moveDown(0.5);
      }

      // Add Inventory Section if available
      if (document.InventoryName || document.status?.includes('Inventory')) {
        drawSection(thaiText.inventoryAssessment, '#cc8800'); // Orange for Inventory
        
        drawField(thaiText.inventoryOfficer, document.InventoryName);
        drawField(thaiText.timestamp, formatTimestamp(document.InventoryTimeStamp));
        
        doc.moveDown(0.5);
      }

      // Add Manufacturing Section if available
      if (document.ManufacturingName || document.status?.includes('Manufacture')) {
        drawSection(thaiText.mfgAssessment, colors.purple);
        
        drawField(thaiText.mfgOfficer, document.ManufacturingName);
        drawField(thaiText.timestamp, formatTimestamp(document.ManufacturingTimeStamp));
        
        // Manufacturing Comments
        if (document.ManufacturingComments) {
          doc.moveDown(0.5);
          drawLongText(thaiText.comments, document.ManufacturingComments);
        }
        
        doc.moveDown(0.5);
      }

      // Add Environment Section if available
      if (document.EnvironmentName || document.status?.includes('Environment')) {
        drawSection(thaiText.envAssessment, colors.green);
        
        drawField(thaiText.envOfficer, document.EnvironmentName);
        drawField(thaiText.timestamp, formatTimestamp(document.EnvironmentTimeStamp));
        
        // Environmental Impact
        if (document.EnvironmentalImpact) {
          doc.moveDown(0.5);
          drawLongText(thaiText.envImpact, document.EnvironmentalImpact);
        }
        
        // Mitigation Measures
        if (document.MitigationMeasures) {
          doc.moveDown(0.5);
          drawLongText(thaiText.mitigation, document.MitigationMeasures);
        }
        
        doc.moveDown(0.5);
      }

      // Add SaleCo Review Section if available
      if (document.SaleCoReviewName || document.status === 'Completed') {
        drawSection(thaiText.salecoReview, colors.red);
        
        drawField(thaiText.reviewedBy, document.SaleCoReviewName);
        drawField(thaiText.timestamp, formatTimestamp(document.SaleCoReviewTimeStamp));
        drawField(thaiText.status, 'Completed');
        
        doc.moveDown(0.5);
      }

      // Add QR Code in the top-right corner
      if (hasQRCode) {
        try {
          doc.image(qrCodePath, doc.page.width - 130, 40, { width: 80 });
          doc.fontSize(fontSize.small)
             .font(fonts.regular)
             .fillColor(colors.lightGray)
             .text('Scan for PDF', doc.page.width - 130, 125, { width: 80, align: 'center' });
        } catch (qrError) {
          console.error('Error adding QR code to PDF:', qrError);
        }
      }

      // Add ISO number at the bottom right
      doc.fontSize(fontSize.small)
         .font(fonts.regular)
         .fillColor(colors.lightGray)
         .text('QMS-FM-36-012 (R00.,06/10/2014)', doc.page.width - 200, doc.page.height - 50, { align: 'right' });

      // Add footer with timestamp
      const generateTime = new Date().toLocaleString('en-GB');
      
      doc.fontSize(fontSize.small)
         .font(fonts.regular)
         .fillColor(colors.lightGray)
         .text(`${thaiText.generated}: ${generateTime}`, 50, doc.page.height - 50);
         
      doc.fontSize(fontSize.small)
         .font(fonts.regular)
         .fillColor(colors.lightGray)
         .text(`${thaiText.docId}: ${document.Document_id}`, doc.page.width - 200, doc.page.height - 35, { align: 'right' });

      // Finalize the PDF
      doc.end();

      // Wait for the stream to finish
      stream.on('finish', () => {
        console.log(`Generated PDF: ${outputPath}`);
        
        // Clean up temp QR code file if it exists
        if (hasQRCode && fs.existsSync(qrCodePath)) {
          fs.unlinkSync(qrCodePath);
        }
        
        resolve(`/pdf/${outputFilename}`);
      });

      stream.on('error', (err) => {
        console.error('Error writing PDF:', err);
        reject(err);
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}

/**
 * Get a URL to access the PDF
 * @param {String} documentId - The document ID
 * @returns {String} The URL to access the PDF
 */
function getPdfUrl(documentId) {
  if (!documentId) return null;
  
  const filename = `${documentId.replace(/\//g, '-')}.pdf`;
  const host = process.env.HOST_URL || '';
  return `${host}/pdf/${filename}`;
}

module.exports = {
  generateFormPDF,
  getPdfUrl
};