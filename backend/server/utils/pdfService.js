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
      width: 150, // Reduced from 200 to make QR code smaller
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
 * Format a timestamp for display with both date and time
 * @param {Date|String} timestamp - The timestamp to format
 * @returns {String} Formatted timestamp string
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return "N/A";
  try {
    const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(dateObj.getTime())) return "N/A";
    
    return dateObj.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return "N/A";
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
        autoFirstPage: true, // Create the first page automatically
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

      function drawField(label, value, options = {}) {
        const { indent = 0, color = colors.text } = options;
        
        // Ensure there's no space between label and colon
        doc.font(fonts.bold)
           .fontSize(fontSize.normal)
           .fillColor(color)
           .text(label, doc.x + indent, doc.y, { continued: true })
           .font(fonts.regular)
           .text(': ' + (value || 'N/A'));
      }

      // Start drawing the document
      drawHeader();

      // Use a simpler approach for side-by-side layout
      // Start with two tables side by side
      const tableWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right - 10) / 2;
      
      // First table - Product Information
      const startY = doc.y;
      
      // Left table header
      doc.font(fonts.bold)
         .fontSize(fontSize.header)
         .fillColor(colors.primary)
         .text(thaiText.productInfo, doc.page.margins.left, startY);
      
      doc.y += 20; // Space after header
      
      // Product info fields - left column
      doc.font(fonts.regular).fontSize(fontSize.normal);
      const leftStartY = doc.y;
      drawField(thaiText.productId, document.Product_id);
      drawField(thaiText.serialNumber, document.Sn_number);
      drawField(thaiText.description, document.Description);
      drawField(thaiText.lotNumber, document.Lot_No);
      drawField(thaiText.size, document.Product_size);
      drawField(thaiText.quantity, document.Quantity);
      
      const leftEndY = doc.y;
      
      // Right table - Issue Information
      // Reset Y position but move X to right half
      doc.y = startY;
      doc.x = doc.page.margins.left + tableWidth + 10;
      
      // Right table header
      doc.font(fonts.bold)
         .fontSize(fontSize.header)
         .fillColor(colors.secondary)
         .text(thaiText.issueInfo, doc.x, startY);
         
      doc.y += 20; // Space after header
      
      // Issue info fields - right column
      doc.font(fonts.regular).fontSize(fontSize.normal);
      const rightStartY = doc.y;
      
      // Use drawField for consistent formatting across all fields
      drawField(thaiText.issueFound, document.Issue_Found);
      drawField(thaiText.foundee, document.Foundee);
      drawField(thaiText.department, document.Department);
      
      // Use drawField for Issue Description with the same formatting
      drawField(thaiText.issueDesc, document.Issue_Description || 'N/A');
      
      // Use drawField for Prevention Measure with the same formatting
      drawField(thaiText.prevention, document.Prevention || 'N/A');
      
      // Reset position for the next sections
      const rightEndY = doc.y;
      doc.x = doc.page.margins.left;
      doc.y = Math.max(leftEndY, rightEndY) + 20; // Use the lower of the two end positions

      // Use consistent checks for sections
      doc.moveDown(1);

      // Debug logging to help diagnose what sections should show
      console.log('Document status:', document.status);
      console.log('InventoryName exists:', !!document.InventoryName);
      console.log('InventoryTimeStamp exists:', !!document.InventoryTimeStamp);
      console.log('QAName exists:', !!document.QAName);
      console.log('ManufacturingName exists:', !!document.ManufacturingName);
      console.log('EnvironmentName exists:', !!document.EnvironmentName);

      // QA Assessment Section if available - improved condition check
      if (document.QAName || (document.status && document.status.includes('QA')) || document.QASolution) {
        doc.moveDown(0.5);
        doc.font(fonts.bold)
           .fontSize(fontSize.header)
           .fillColor(colors.green)
           .text(thaiText.qaAssessment, { continued: false });
        
        doc.moveDown(0.3);
        
        // Ensure we're displaying the QA timestamp properly
        let qaTimestamp = 'N/A';
        if (document.QATimeStamp) {
          try {
            qaTimestamp = formatTimestamp(document.QATimeStamp);
          } catch (err) {
            console.warn('Error formatting QA timestamp:', err);
            try {
              qaTimestamp = formatDate(document.QATimeStamp);
            } catch (err2) {
              console.warn('Error formatting QA timestamp as date:', err2);
            }
          }
        }
        
        drawField(thaiText.qaOfficer, document.QAName || 'N/A');
        drawField(thaiText.timestamp, qaTimestamp);
        drawField(thaiText.solution, document.QASolution);
        drawField(thaiText.damageCost, document.DamageCost ? `$${document.DamageCost}` : 'N/A');
        drawField(thaiText.deptExpense, document.DepartmentExpense);
        
        // QA Solution Description
        if (document.QASolutionDescription) {
          drawField(thaiText.solutionDesc, document.QASolutionDescription);
        }
      }

      // Fix potential issue with conditions for sections - checking both name and timestamp fields
      // Add Inventory Section if available
      if (document.InventoryName || document.InventoryTimeStamp || (document.status && document.status.includes('Inventory'))) {
        doc.moveDown(0.5);
        doc.font(fonts.bold)
           .fontSize(fontSize.header)
           .fillColor('#cc8800')
           .text(thaiText.inventoryAssessment, { continued: false });
        
        doc.moveDown(0.3);
        
        // Explicitly log the inventory timestamp value to debug
        console.log('InventoryTimeStamp value:', document.InventoryTimeStamp);
        
        // Ensure we're displaying the inventory timestamp properly
        let inventoryTimestamp = 'N/A';
        if (document.InventoryTimeStamp) {
          try {
            inventoryTimestamp = formatTimestamp(document.InventoryTimeStamp);
          } catch (err) {
            console.warn('Error formatting Inventory timestamp:', err);
            try {
              inventoryTimestamp = formatDate(document.InventoryTimeStamp);
            } catch (err2) {
              console.warn('Error formatting Inventory timestamp as date:', err2);
            }
          }
        }
        
        drawField(thaiText.inventoryOfficer, document.InventoryName || 'N/A');
        drawField(thaiText.timestamp, inventoryTimestamp);
      }

      // Add Manufacturing Section if available - checking both name and timestamp fields
      if (document.ManufacturingName || document.ManufacturingTimeStamp || (document.status && document.status.includes('Manufacture'))) {
        doc.moveDown(0.5);
        doc.font(fonts.bold)
           .fontSize(fontSize.header)
           .fillColor(colors.purple)
           .text(thaiText.mfgAssessment, { continued: false });
        
        doc.moveDown(0.3);
        
        // Handle the Manufacturing timestamp field which has a different type in the database (date instead of datetime)
        let mfgTimestamp = 'N/A';
        if (document.ManufacturingTimeStamp) {
          try {
            mfgTimestamp = formatTimestamp(document.ManufacturingTimeStamp);
          } catch (err) {
            console.warn('Error formatting Manufacturing timestamp:', err);
            // Try a different format if it's a date-only field
            try {
              mfgTimestamp = formatDate(document.ManufacturingTimeStamp);
            } catch (err2) {
              console.warn('Error formatting Manufacturing timestamp as date:', err2);
            }
          }
        }
        
        drawField(thaiText.mfgOfficer, document.ManufacturingName);
        drawField(thaiText.timestamp, mfgTimestamp);
        
        // Manufacturing Comments
        if (document.ManufacturingComments) {
          drawField(thaiText.comments, document.ManufacturingComments);
        }
      }

      // Add Environment Section if available - checking both name and timestamp fields
      if (document.EnvironmentName || document.EnvironmentTimeStamp || (document.status && document.status.includes('Environment'))) {
        doc.moveDown(0.5);
        doc.font(fonts.bold)
           .fontSize(fontSize.header)
           .fillColor(colors.green)
           .text(thaiText.envAssessment, { continued: false });
        
        doc.moveDown(0.3);
        
        // Ensure we're displaying the Environment timestamp properly
        let envTimestamp = 'N/A';
        if (document.EnvironmentTimeStamp) {
          try {
            envTimestamp = formatTimestamp(document.EnvironmentTimeStamp);
          } catch (err) {
            console.warn('Error formatting Environment timestamp:', err);
            try {
              envTimestamp = formatDate(document.EnvironmentTimeStamp);
            } catch (err2) {
              console.warn('Error formatting Environment timestamp as date:', err2);
            }
          }
        }
        
        drawField(thaiText.envOfficer, document.EnvironmentName || 'N/A');
        drawField(thaiText.timestamp, envTimestamp);
        
        // Environmental Impact
        if (document.EnvironmentalImpact) {
          drawField(thaiText.envImpact, document.EnvironmentalImpact);
        }
        
        // Mitigation Measures
        if (document.MitigationMeasures) {
          drawField(thaiText.mitigation, document.MitigationMeasures);
        }
      }

      // Add SaleCo Review Section if available
      if (document.SaleCoReviewName || document.SaleCoReviewTimeStamp || document.status === 'Completed') {
        doc.moveDown(0.5);
        doc.font(fonts.bold)
           .fontSize(fontSize.header)
           .fillColor(colors.red)
           .text(thaiText.salecoReview, { continued: false });
        
        doc.moveDown(0.3);
        
        // Ensure we're displaying the SaleCo timestamp properly
        let salecoTimestamp = 'N/A';
        if (document.SaleCoReviewTimeStamp) {
          try {
            salecoTimestamp = formatTimestamp(document.SaleCoReviewTimeStamp);
          } catch (err) {
            console.warn('Error formatting SaleCo timestamp:', err);
            try {
              salecoTimestamp = formatDate(document.SaleCoReviewTimeStamp);
            } catch (err2) {
              console.warn('Error formatting SaleCo timestamp as date:', err2);
            }
          }
        }
        
        drawField(thaiText.reviewedBy, document.SaleCoReviewName || 'N/A');
        drawField(thaiText.timestamp, salecoTimestamp);
        
        // Make sure to still display the completed status
        if (document.status === 'Completed') {
          drawField(thaiText.status, 'Completed');
        }
      }

      // Add QR Code in the top-right corner - make it even smaller
      if (hasQRCode) {
        try {
          // Make QR code smaller and position it well
          doc.image(qrCodePath, doc.page.width - 100, 40, { width: 50 });
          doc.fontSize(fontSize.small)
             .font(fonts.regular)
             .fillColor(colors.lightGray)
             .text('Scan for PDF', doc.page.width - 100, 95, { width: 50, align: 'center' });
        } catch (qrError) {
          console.error('Error adding QR code to PDF:', qrError);
        }
      }

      // Add a single footer with all information
      // Position at the bottom of the page, but only on the first page
      const footerY = doc.page.height - 50;
      
      // ISO number at the bottom right
      doc.fontSize(fontSize.small)
         .font(fonts.regular)
         .fillColor(colors.lightGray)
         .text('QMS-FM-36-012 (R00.,06/10/2014)', doc.page.width - 200, footerY, { align: 'right' });

      // Generation timestamp at the bottom left
      const generateTime = new Date().toLocaleString('en-GB');
      doc.fontSize(fontSize.small)
         .font(fonts.regular)
         .fillColor(colors.lightGray)
         .text(`${thaiText.generated}: ${generateTime}`, 50, footerY);
         
      // Document ID just below the ISO number
      doc.fontSize(fontSize.small)
         .font(fonts.regular)
         .fillColor(colors.lightGray)
         .text(`${thaiText.docId}: ${document.Document_id}`, doc.page.width - 200, footerY + 15, { align: 'right' });

      // Finalize the PDF - no need to call doc.end() twice
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