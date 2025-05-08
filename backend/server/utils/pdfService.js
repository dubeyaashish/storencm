// backend/server/utils/pdfService.js
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs-extra');
const path = require('path');

// Define paths
const PDF_OUTPUT_DIR = path.join(__dirname, '..', 'pdf');
const FONTS_DIR = path.join(__dirname, '..', 'fonts');

// Ensure directories exist
fs.ensureDirSync(PDF_OUTPUT_DIR);
fs.ensureDirSync(FONTS_DIR);

// Thai headers and labels
const thaiText = {
  title: 'Non-Conformance', // Non-Conformance Report
  document: 'Document Number', // Document #
  date: 'วันที่', // Date
  status: 'สถานะ', // Status
  productInfo: 'ข้อมูลสินค้า', // Product Information
  issueInfo: 'ข้อมูลปัญหา', // Issue Information
  issueDesc: 'รายละเอียดปัญหา', // Issue Description
  prevention: 'มาตรการป้องกัน', // Prevention Measure
  qaAssessment: 'การประเมินคุณภาพ', // Quality Assurance Assessment
  inventoryAssessment: 'การประเมินคลังสินค้า', // Inventory Assessment
  mfgAssessment: 'การประเมินการผลิต', // Manufacturing Assessment
  envAssessment: 'การประเมินสิ่งแวดล้อม', // Environmental Assessment
  salecoReview: 'การทบทวนโดย SaleCo', // SaleCo Final Review
  generated: 'สร้างเมื่อ', // Generated
  docId: 'รหัสเอกสาร', // Document ID
  comments: 'ความคิดเห็น', // Comments
  solutionDesc: 'รายละเอียดการแก้ไข', // Solution Description
  envImpact: 'ผลกระทบต่อสิ่งแวดล้อม', // Environmental Impact
  mitigation: 'มาตรการบรรเทาผลกระทบ', // Mitigation Measures
  
  // Field labels
  productId: 'รหัสสินค้า', // Product ID
  description: 'รายละเอียด', // Description
  serialNumber: 'หมายเลขซีเรียล', // Serial Number
  lotNumber: 'หมายเลขล็อต', // Lot Number
  size: 'ขนาด', // Size
  quantity: 'จำนวน', // Quantity
  issueFound: 'ปัญหาที่พบ', // Issue Found
  foundee: 'ผู้พบ', // Foundee
  department: 'แผนก', // Department
  qaOfficer: 'เจ้าหน้าที่ QA', // QA Officer
  timestamp: 'เวลา', // Timestamp
  solution: 'การแก้ไข', // Solution
  damageCost: 'ค่าเสียหาย', // Damage Cost
  deptExpense: 'ค่าใช้จ่ายแผนก', // Department Expense
  inventoryOfficer: 'เจ้าหน้าที่คลังสินค้า', // Inventory Officer
  mfgOfficer: 'เจ้าหน้าที่การผลิต', // Manufacturing Officer
  envOfficer: 'เจ้าหน้าที่สิ่งแวดล้อม', // Environment Officer
  reviewedBy: 'ทบทวนโดย' // Reviewed By
};

/**
 * Generate a PDF file from document data
 * @param {Object} document - The document object with all field data
 * @returns {Promise<String>} Path to the generated PDF
 */
async function generateFormPDF(document) {
  try {
    // Make sure we have a document ID
    if (!document.Document_id) {
      throw new Error('Document ID is required');
    }

    // Paths
    const outputFilename = `${document.Document_id.replace(/\//g, '-')}.pdf`;
    const outputPath = path.join(PDF_OUTPUT_DIR, outputFilename);
    const thaiFontPath = path.join(FONTS_DIR, 'NotoSansThai-Regular.ttf');

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Register fontkit with the document
    pdfDoc.registerFontkit(fontkit);
    
    // Add a page to the document
    const page = pdfDoc.addPage([595, 842]); // A4 size
    
    // Get the standard font for fallback
    const stdFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const stdBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Try to embed the Thai font
    let font = stdFont;
    let boldFont = stdBoldFont;
    let hasThaiFontSupport = false;
    
    try {
      if (fs.existsSync(thaiFontPath)) {
        console.log('Thai font found at:', thaiFontPath);
        const fontBytes = await fs.readFile(thaiFontPath);
        const thaiFont = await pdfDoc.embedFont(fontBytes);
        font = thaiFont;
        boldFont = thaiFont; // Use the same Thai font for bold
        hasThaiFontSupport = true;
        console.log('Thai font embedded successfully');
      } else {
        console.warn('Thai font not found at:', thaiFontPath);
      }
    } catch (fontError) {
      console.error('Error embedding Thai font:', fontError);
      console.log('Falling back to standard font');
    }
    
    // Define colors
    const primaryColor = rgb(0.1, 0.4, 0.7); // Deep blue
    const secondaryColor = rgb(0.8, 0.3, 0.1); // Reddish for issues
    const textColor = rgb(0.1, 0.1, 0.1); // Near black
    
    // Set drawing parameters
    const { width, height } = page.getSize();
    const margin = 50;
    let currentY = height - margin;
    const lineHeight = 16;
    const titleSize = 24;
    const headerSize = 14;
    const normalSize = 10;
    const smallSize = 8;
    const contentIndent = 10;
    
    // Helper function for safe text drawing with Thai support
    const drawText = (text, options, fallbackText) => {
      try {
        if (hasThaiFontSupport) {
          // Try with Thai font
          page.drawText(String(text || ''), {
            ...options,
            font: options.font === stdBoldFont ? boldFont : font
          });
        } else {
          throw new Error('No Thai font support');
        }
      } catch (error) {
        // Fallback to standard font with ASCII text
        const finalText = fallbackText || text;
        const asciiText = String(finalText || '').replace(/[^\x00-\x7F]/g, '?');
        
        page.drawText(asciiText, {
          ...options,
          font: options.font === boldFont ? stdBoldFont : stdFont
        });
      }
    };
    
    // Document title
    drawText(thaiText.title, {
      x: margin,
      y: currentY,
      size: titleSize,
      font: boldFont,
      color: primaryColor
    }, 'Non-Conformance Report');
    
    currentY -= titleSize + 10;
    
    // Document ID and Date
    drawText(`${thaiText.document}: ${document.Document_id}`, {
      x: margin,
      y: currentY,
      size: headerSize,
      font: boldFont,
      color: primaryColor
    }, `Document #: ${document.Document_id}`);
    
    const dateStr = document.date ? new Date(document.date).toLocaleDateString('en-GB') : 'N/A';
    
    drawText(`${thaiText.date}: ${dateStr}`, {
      x: width - margin - 180,
      y: currentY,
      size: headerSize,
      font: font,
      color: textColor
    }, `Date: ${dateStr}`);
    
    currentY -= headerSize * 2;
    
    // Status Bar
    const statusBarWidth = width - (margin * 2);
    page.drawRectangle({
      x: margin,
      y: currentY - 5,
      width: statusBarWidth,
      height: 25,
      color: rgb(0.9, 0.9, 0.9),
      borderColor: primaryColor,
      borderWidth: 1,
      opacity: 0.5
    });
    
    // Status
    drawText(`${thaiText.status}: ${document.status || 'Created'}`, {
      x: margin + 10,
      y: currentY,
      size: headerSize,
      font: boldFont,
      color: primaryColor
    }, `Status: ${document.status || 'Created'}`);
    
    currentY -= headerSize + 15;
    
    // Product Information Section
    drawText(thaiText.productInfo, {
      x: margin,
      y: currentY,
      size: headerSize,
      font: boldFont,
      color: primaryColor
    }, 'Product Information');
    
    currentY -= headerSize + 5;
    
    // Product details
    const productInfo = [
      { thai: thaiText.productId, eng: 'Product ID:', value: String(document.Product_id || 'N/A') },
      { thai: thaiText.description, eng: 'Description:', value: String(document.Description || 'N/A') },
      { thai: thaiText.serialNumber, eng: 'Serial Number:', value: String(document.Sn_number || 'N/A') },
      { thai: thaiText.lotNumber, eng: 'Lot Number:', value: String(document.Lot_No || 'N/A') },
      { thai: thaiText.size, eng: 'Size:', value: String(document.Product_size || 'N/A') },
      { thai: thaiText.quantity, eng: 'Quantity:', value: String(document.Quantity || 'N/A') },
    ];
    
    for (const info of productInfo) {
      drawText(info.thai, {
        x: margin,
        y: currentY,
        size: normalSize,
        font: boldFont,
        color: textColor
      }, info.eng);
      
      drawText(info.value, {
        x: margin + 120,
        y: currentY,
        size: normalSize,
        font: font,
        color: textColor
      });
      
      currentY -= lineHeight;
    }
    
    currentY -= 10;
    
    // Issue Information Section
    drawText(thaiText.issueInfo, {
      x: margin,
      y: currentY,
      size: headerSize,
      font: boldFont,
      color: secondaryColor
    }, 'Issue Information');
    
    currentY -= headerSize + 5;
    
    // Issue details
    const issueInfo = [
      { thai: thaiText.issueFound, eng: 'Issue Found:', value: String(document.Issue_Found || 'N/A') },
      { thai: thaiText.foundee, eng: 'Foundee:', value: String(document.Foundee || 'N/A') },
      { thai: thaiText.department, eng: 'Department:', value: String(document.Department || 'N/A') },
    ];
    
    for (const info of issueInfo) {
      drawText(info.thai, {
        x: margin,
        y: currentY,
        size: normalSize,
        font: boldFont,
        color: textColor
      }, info.eng);
      
      drawText(info.value, {
        x: margin + 120,
        y: currentY,
        size: normalSize,
        font: font,
        color: textColor
      });
      
      currentY -= lineHeight;
    }
    
    currentY -= 10;
    
    // Issue Description
    drawText(thaiText.issueDesc, {
      x: margin,
      y: currentY,
      size: normalSize,
      font: boldFont,
      color: textColor
    }, 'Issue Description');
    
    currentY -= lineHeight;
    
    if (document.Issue_Description) {
      drawText(document.Issue_Description, {
        x: margin + contentIndent,
        y: currentY,
        size: normalSize,
        font: font,
        color: textColor
      });
    } else {
      drawText('No description provided.', {
        x: margin + contentIndent,
        y: currentY,
        size: normalSize,
        font: font,
        color: rgb(0.6, 0.6, 0.6)
      });
    }
    
    currentY -= lineHeight * 2;
    
    // Prevention Measure
    drawText(thaiText.prevention, {
      x: margin,
      y: currentY,
      size: normalSize,
      font: boldFont,
      color: textColor
    }, 'Prevention Measure');
    
    currentY -= lineHeight;
    
    if (document.Prevention) {
      drawText(document.Prevention, {
        x: margin + contentIndent,
        y: currentY,
        size: normalSize,
        font: font,
        color: textColor
      });
    } else {
      drawText('No prevention measure provided.', {
        x: margin + contentIndent,
        y: currentY,
        size: normalSize,
        font: font,
        color: rgb(0.6, 0.6, 0.6)
      });
    }
    
    currentY -= lineHeight * 2;
    
    // Add QA Section if available
    if (document.QAName || document.status?.includes('QA') || document.QASolution) {
      drawText(thaiText.qaAssessment, {
        x: margin,
        y: currentY,
        size: headerSize,
        font: boldFont,
        color: rgb(0.2, 0.6, 0.3) // Green for QA
      }, 'Quality Assurance Assessment');
      
      currentY -= headerSize + 5;
      
      // QA details
      const qaInfo = [
        { thai: thaiText.qaOfficer, eng: 'QA Officer:', value: String(document.QAName || 'N/A') },
        { thai: thaiText.timestamp, eng: 'Timestamp:', value: document.QATimeStamp ? new Date(document.QATimeStamp).toLocaleString('en-GB') : 'N/A' },
        { thai: thaiText.solution, eng: 'Solution:', value: String(document.QASolution || 'N/A') },
        { thai: thaiText.damageCost, eng: 'Damage Cost:', value: document.DamageCost ? `$${String(document.DamageCost)}` : 'N/A' },
        { thai: thaiText.deptExpense, eng: 'Dept Expense:', value: document.DepartmentExpense ? String(document.DepartmentExpense) : 'N/A' },
      ];
      
      for (const info of qaInfo) {
        drawText(info.thai, {
          x: margin,
          y: currentY,
          size: normalSize,
          font: boldFont,
          color: textColor
        }, info.eng);
        
        drawText(info.value, {
          x: margin + 120,
          y: currentY,
          size: normalSize,
          font: font,
          color: textColor
        });
        
        currentY -= lineHeight;
      }
      
      // QA Solution Description
      if (document.QASolutionDescription) {
        currentY -= 5;
        
        drawText(thaiText.solutionDesc, {
          x: margin,
          y: currentY,
          size: normalSize,
          font: boldFont,
          color: textColor
        }, 'Solution Description');
        
        currentY -= lineHeight;
        
        drawText(document.QASolutionDescription, {
          x: margin + contentIndent,
          y: currentY,
          size: normalSize,
          font: font,
          color: textColor
        });
        
        currentY -= lineHeight;
      }
      
      currentY -= 10;
    }
    
    // Add Inventory Section if available
    if (document.InventoryName || document.status?.includes('Inventory')) {
      drawText(thaiText.inventoryAssessment, {
        x: margin,
        y: currentY,
        size: headerSize,
        font: boldFont,
        color: rgb(0.6, 0.4, 0.1) // Orange for Inventory
      }, 'Inventory Assessment');
      
      currentY -= headerSize + 5;
      
      // Inventory details
      const inventoryInfo = [
        { thai: thaiText.inventoryOfficer, eng: 'Inventory Officer:', value: String(document.InventoryName || 'N/A') },
        { thai: thaiText.timestamp, eng: 'Timestamp:', value: document.InventoryTimeStamp ? new Date(document.InventoryTimeStamp).toLocaleString('en-GB') : 'N/A' },
      ];
      
      for (const info of inventoryInfo) {
        drawText(info.thai, {
          x: margin,
          y: currentY,
          size: normalSize,
          font: boldFont,
          color: textColor
        }, info.eng);
        
        drawText(info.value, {
          x: margin + 150,
          y: currentY,
          size: normalSize,
          font: font,
          color: textColor
        });
        
        currentY -= lineHeight;
      }
      
      currentY -= 10;
    }
    
    // Add Manufacturing Section if available
    if (document.ManufacturingName || document.status?.includes('Manufacture')) {
      drawText(thaiText.mfgAssessment, {
        x: margin,
        y: currentY,
        size: headerSize,
        font: boldFont,
        color: rgb(0.5, 0.2, 0.6) // Purple for Manufacturing
      }, 'Manufacturing Assessment');
      
      currentY -= headerSize + 5;
      
      // Manufacturing details
      const mfgInfo = [
        { thai: thaiText.mfgOfficer, eng: 'Manufacturing Officer:', value: String(document.ManufacturingName || 'N/A') },
        { thai: thaiText.timestamp, eng: 'Timestamp:', value: document.ManufacturingTimeStamp ? new Date(document.ManufacturingTimeStamp).toLocaleString('en-GB') : 'N/A' },
      ];
      
      for (const info of mfgInfo) {
        drawText(info.thai, {
          x: margin,
          y: currentY,
          size: normalSize,
          font: boldFont,
          color: textColor
        }, info.eng);
        
        drawText(info.value, {
          x: margin + 150,
          y: currentY,
          size: normalSize,
          font: font,
          color: textColor
        });
        
        currentY -= lineHeight;
      }
      
      // Manufacturing Comments
      if (document.ManufacturingComments) {
        currentY -= 5;
        
        drawText(thaiText.comments, {
          x: margin,
          y: currentY,
          size: normalSize,
          font: boldFont,
          color: textColor
        }, 'Comments');
        
        currentY -= lineHeight;
        
        drawText(document.ManufacturingComments, {
          x: margin + contentIndent,
          y: currentY,
          size: normalSize,
          font: font,
          color: textColor
        });
        
        currentY -= lineHeight;
      }
      
      currentY -= 10;
    }
    
    // Add Environment Section if available
    if (document.EnvironmentName || document.status?.includes('Environment')) {
      drawText(thaiText.envAssessment, {
        x: margin,
        y: currentY,
        size: headerSize,
        font: boldFont,
        color: rgb(0.1, 0.6, 0.3) // Green for Environment
      }, 'Environmental Assessment');
      
      currentY -= headerSize + 5;
      
      // Environment details
      const envInfo = [
        { thai: thaiText.envOfficer, eng: 'Environment Officer:', value: String(document.EnvironmentName || 'N/A') },
        { thai: thaiText.timestamp, eng: 'Timestamp:', value: document.EnvironmentTimeStamp ? new Date(document.EnvironmentTimeStamp).toLocaleString('en-GB') : 'N/A' },
      ];
      
      for (const info of envInfo) {
        drawText(info.thai, {
          x: margin,
          y: currentY,
          size: normalSize,
          font: boldFont,
          color: textColor
        }, info.eng);
        
        drawText(info.value, {
          x: margin + 150,
          y: currentY,
          size: normalSize,
          font: font,
          color: textColor
        });
        
        currentY -= lineHeight;
      }
      
      // Environmental Impact
      if (document.EnvironmentalImpact) {
        currentY -= 5;
        
        drawText(thaiText.envImpact, {
          x: margin,
          y: currentY,
          size: normalSize,
          font: boldFont,
          color: textColor
        }, 'Environmental Impact');
        
        currentY -= lineHeight;
        
        drawText(document.EnvironmentalImpact, {
          x: margin + contentIndent,
          y: currentY,
          size: normalSize,
          font: font,
          color: textColor
        });
        
        currentY -= lineHeight;
      }
      
      // Mitigation Measures
      if (document.MitigationMeasures) {
        currentY -= 5;
        
        drawText(thaiText.mitigation, {
          x: margin,
          y: currentY,
          size: normalSize,
          font: boldFont,
          color: textColor
        }, 'Mitigation Measures');
        
        currentY -= lineHeight;
        
        drawText(document.MitigationMeasures, {
          x: margin + contentIndent,
          y: currentY,
          size: normalSize,
          font: font,
          color: textColor
        });
        
        currentY -= lineHeight;
      }
      
      currentY -= 10;
    }
    
    // Add SaleCo Review Section if available
    if (document.SaleCoReviewName || document.status === 'Completed') {
      drawText(thaiText.salecoReview, {
        x: margin,
        y: currentY,
        size: headerSize,
        font: boldFont,
        color: rgb(0.7, 0.3, 0.3) // Red for SaleCo
      }, 'SaleCo Final Review');
      
      currentY -= headerSize + 5;
      
      // SaleCo details
      const salecoInfo = [
        { thai: thaiText.reviewedBy, eng: 'Reviewed By:', value: String(document.SaleCoReviewName || 'N/A') },
        { thai: thaiText.timestamp, eng: 'Timestamp:', value: document.SaleCoReviewTimeStamp ? new Date(document.SaleCoReviewTimeStamp).toLocaleString('en-GB') : 'N/A' },
        { thai: thaiText.status, eng: 'Status:', value: 'Completed' },
      ];
      
      for (const info of salecoInfo) {
        drawText(info.thai, {
          x: margin,
          y: currentY,
          size: normalSize,
          font: boldFont,
          color: textColor
        }, info.eng);
        
        drawText(info.value, {
          x: margin + 120,
          y: currentY,
          size: normalSize,
          font: font,
          color: textColor
        });
        
        currentY -= lineHeight;
      }
    }
    
    // Footer with timestamp
    const generateTime = new Date().toLocaleString('en-GB');
    
    drawText(`${thaiText.generated}: ${generateTime}`, {
      x: margin,
      y: margin / 2,
      size: smallSize,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    }, `Generated: ${generateTime}`);
    
    drawText(`${thaiText.docId}: ${document.Document_id}`, {
      x: width - margin - 200,
      y: margin / 2,
      size: smallSize,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    }, `Document ID: ${document.Document_id}`);
    
    // Save the PDF file
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);
    console.log(`Generated PDF: ${outputPath}`);
    
    return `/pdf/${outputFilename}`;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
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