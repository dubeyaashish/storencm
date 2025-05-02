const { PDFDocument } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs-extra');
const path = require('path');
const url = require('url');

// Define paths
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const PDF_OUTPUT_DIR = path.join(__dirname, '..', 'pdf');
const FONT_DIR = path.join(__dirname, '..', 'fonts');

// Ensure directories exist
fs.ensureDirSync(TEMPLATES_DIR);
fs.ensureDirSync(PDF_OUTPUT_DIR);
fs.ensureDirSync(FONT_DIR);

/**
 * Split text to fit into multiple form fields
 * @param {string} text - The text to split
 * @param {number} maxLength - Maximum length per field
 * @returns {Array<string>} Array of text chunks
 */
function splitTextForFields(text, maxLength = 100) {
  if (!text) return [''];
  if (text.length <= maxLength) return [text];
  
  // Split into chunks
  const part1 = text.substring(0, maxLength);
  const part2 = text.substring(maxLength);
  
  return [part1, part2];
}

/**
 * Generate a PDF file from template and form data
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
    const templatePath = path.join(TEMPLATES_DIR, 'nc_form_template.pdf');
    const outputFilename = `${document.Document_id.replace(/\//g, '-')}.pdf`;
    const outputPath = path.join(PDF_OUTPUT_DIR, outputFilename);
    const thaiFontPath = path.join(FONT_DIR, 'NotoSansThai-Regular.ttf');

    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at ${templatePath}`);
    }

    // Check if Thai font exists
    if (!fs.existsSync(thaiFontPath)) {
      throw new Error(`Thai font not found at ${thaiFontPath}`);
    }

    // Load the PDF template
    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Register fontkit with the document
    pdfDoc.registerFontkit(fontkit);
    
    // Embed Thai font
    let thaiFont;
    try {
      const fontBytes = await fs.readFile(thaiFontPath);
      thaiFont = await pdfDoc.embedFont(fontBytes);
      console.log('Thai font embedded successfully');
    } catch (fontError) {
      console.error('Error embedding Thai font:', fontError);
      throw new Error('Failed to embed Thai font');
    }
    
    // Get the form from the PDF
    const form = pdfDoc.getForm();
    
    // Get all available form fields for debugging
    const fields = form.getFields();
    console.log('Available form fields:');
    fields.forEach((field) => {
      console.log(`- ${field.getName()} (${field.constructor.name})`);
    });

    // Split long text fields
    const [reason1, reason2] = splitTextForFields(document.Issue_Description);
    const [prevention1, prevention2] = splitTextForFields(document.Prevention);
    const [comment1, comment2] = splitTextForFields(document.QASolutionDescription);

    // Determine the right checkboxes to tick based on QASolution
    let reject = false;
    let leaveit = false;
    let repack = false;
    let rework = false;
    let code0 = false;
    let destroy = false;
    let recall = false;
    let par = false;
    let other = false;

    if (document.QASolution) {
      const solution = document.QASolution ? document.QASolution.toLowerCase() : '';
      reject = solution.includes('reject');
      leaveit = solution.includes('ปล่อยผ่าน') || solution.includes('leave');
      repack = solution.includes('repack');
      rework = solution.includes('rework');
      code0 = solution.includes('code 0') || solution.includes('code0');
      destroy = solution.includes('destroy') || solution.includes('ทำลาย');
      recall = solution.includes('recall');
      par = solution.includes('car') || solution.includes('par');
      other = !reject && !leaveit && !repack && !rework && !code0 && !destroy && !recall && !par && solution !== '';
    }

    // Use a more generic approach to fill fields
    try {
      // Fill text fields - adapt field names based on what's in your actual PDF
      const fields = {
        'date': new Date(document.date).toLocaleDateString('en-GB'),
        'Date': new Date(document.date).toLocaleDateString('en-GB'),
        
        'documentnumber': document.Document_id,
        'DocumentNumber': document.Document_id,
        'document_number': document.Document_id,
        
        'productid1': document.Product_id,
        'ProductID': document.Product_id,
        'product_id': document.Product_id,
        
        'description': document.Description,
        'Description': document.Description,
        
        'LotNoRow': document.Lot_No,
        'LotNo': document.Lot_No,
        'lot_no': document.Lot_No,
        
        'size1': document.Product_size,
        'Size': document.Product_size,
        'size': document.Product_size,
        
        'qty1': document.Quantity?.toString(),
        'Quantity': document.Quantity?.toString(),
        'quantity': document.Quantity?.toString(),
        
        'issuefound1': document.Issue_Found,
        'IssueFound': document.Issue_Found,
        'issue_found': document.Issue_Found,
        
        'foundeename': document.Foundee,
        'Foundee': document.Foundee,
        'foundee': document.Foundee,
        
        'fill_5': new Date(document.date).toLocaleDateString('en-GB'),
        
        'reason1': reason1,
        'Reason1': reason1,
        'issue_description': reason1,
        
        'reason2': reason2,
        'Reason2': reason2,
        
        'prevention1': prevention1,
        'Prevention1': prevention1,
        'prevention': prevention1,
        
        'prevention2': prevention2,
        'Prevention2': prevention2,
        
        // QA fields
        'comment1': comment1,
        'Comment1': comment1,
        'qa_solution_description': comment1,
        
        'comment2': comment2,
        'Comment2': comment2,
        
        'email': document.Person1,
        'Email': document.Person1,
        'person1': document.Person1,
        
        'email2': document.Person2,
        'Email2': document.Person2,
        'person2': document.Person2,
        
        'name3': document.QAName,
        'QAName': document.QAName,
        'qa_name': document.QAName,
        
        'price': document.DamageCost?.toString(),
        'Price': document.DamageCost?.toString(),
        'damage_cost': document.DamageCost?.toString()
      };

      // Try to fill all possible field variations
      Object.entries(fields).forEach(([fieldName, value]) => {
        if (!value) return;
        
        try {
          const field = form.getTextField(fieldName);
          if (field) {
            field.setText(value);
            console.log(`Set field ${fieldName} to "${value}"`);
            
            // Set font and font size for all text fields
            try {
              field.updateAppearances(thaiFont, (appearance) => ({
                ...appearance,
                fontSize: 6
              }));
            } catch (fontError) {
              console.warn(`Could not apply font to field ${fieldName}:`, fontError.message);
            }
          }
        } catch (fieldError) {
          // Field doesn't exist, just continue
        }
      });

      // Handle checkboxes
      const checkboxes = {
        'reject': reject,
        'Reject': reject,
        
        'leaveit': leaveit,
        'LeaveIt': leaveit,
        
        'repack': repack,
        'Repack': repack,
        
        'rework': rework,
        'Rework': rework,
        
        'code0': code0,
        'Code0': code0,
        
        'destroy': destroy,
        'Destroy': destroy,
        
        'recall': recall,
        'Recall': recall,
        
        'par': par,
        'Par': par,
        'PAR': par,
        
        'other': other,
        'Other': other
      };

      // Try to check all possible checkbox variations
      Object.entries(checkboxes).forEach(([fieldName, checked]) => {
        try {
          const checkbox = form.getCheckBox(fieldName);
          if (checkbox) {
            if (checked) {
              checkbox.check();
              console.log(`Checked checkbox ${fieldName}`);
            } else {
              checkbox.uncheck();
            }
          }
        } catch (checkboxError) {
          // Checkbox doesn't exist, just continue
        }
      });
      
    } catch (formError) {
      console.error('Error filling form:', formError);
    }

    // Save the filled PDF
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);

    console.log(`PDF form saved to: ${outputPath}`);
    
    // Return the relative path that can be used in URLs
    return `/pdf/${outputFilename}`;
  } catch (error) {
    console.error('Error generating PDF form:', error);
    throw error;
  }
}

/**
 * Helper function to determine the server URL
 * @returns {String} The server URL
 */
function getServerUrl() {
  // Try to get URL from headers if available (not available here but useful pattern)
  
  // Order of preference for base URL:
  // 1. DOMAIN_URL from environment variable (explicit setting)
  // 2. BASE_URL from environment variable (backward compatibility)
  // 3. Host from headers if available
  // 4. Default based on environment
  
  if (process.env.DOMAIN_URL) {
    return process.env.DOMAIN_URL;
  }
  
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // Default to relative URL in production (works with any domain)
  // Or localhost:5000 in development
  return process.env.NODE_ENV === 'production' 
    ? '' // Empty string will make paths relative, which works for most setups
    : 'http://localhost:5000';
}

/**
 * Get the URL to access a generated PDF
 * @param {String} documentId - The document ID
 * @returns {String} URL to access the PDF
 */
function getPdfUrl(documentId) {
    const filename = `${documentId.replace(/\//g, '-')}.pdf`;
    // Get the server's hostname from the environment or use a default
    const host = process.env.HOST_URL;
    // Create a full URL
    const pdfUrl = `${host}/pdf/${filename}`;
    console.log(`Generated PDF URL: ${pdfUrl}`);
    return pdfUrl;
  }

module.exports = {
  generateFormPDF,
  getPdfUrl
};