// server/utils/telegramNotifier.js
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuration for Telegram
const TELEGRAM_CONFIG = {
  chatId: "-4627377279",
  botToken: "7646625188:AAGS-NqBl3rUU9AlC9a01wzlbaqs6spBf7M"
};

/**
 * Format date for display
 * @param {Date|string} date - Date object or string to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  // Handle both Date objects and date strings
  const dateObj = date instanceof Date ? date : new Date(date);
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'N/A';
  // Format using en-GB locale (DD/MM/YYYY)
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

/**
 * Send a notification to Telegram
 * @param {string} message - The formatted HTML message to send
 * @returns {Promise} Result of the Telegram API call
 */
async function sendTelegramMessage(message) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CONFIG.chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const result = await response.json();
    console.log('Telegram notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    // Don't throw, just log the error
  }
}

/**
 * Resolve image path to absolute path
 * @param {string} imagePath - Path to the image file
 * @returns {string} Absolute path to the image
 */
function resolveImagePath(imagePath) {
  if (!imagePath) return null;
  
  // Handle different path formats
  if (!imagePath.startsWith('/') && !imagePath.includes('://')) {
    // If it's a relative path without leading slash
    return path.join(__dirname, '..', 'uploads', imagePath);
  } else if (imagePath.startsWith('/uploads/')) {
    // If it's a web path starting with /uploads/
    return path.join(__dirname, '..', imagePath.substring(1));
  }
  
  // Already an absolute path or other format
  return imagePath;
}

/**
 * Send an image with caption to Telegram
 * @param {string} imagePath - Path to the image file
 * @param {string} caption - Caption text for the image
 * @returns {Promise} Result of the Telegram API call
 */
async function sendTelegramPhotoWithCaption(imagePath, caption) {
  try {
    // Resolve absolute path to image
    const absoluteImagePath = resolveImagePath(imagePath);
    
    // Check if file exists
    if (!absoluteImagePath || !fs.existsSync(absoluteImagePath)) {
      console.error(`Image file not found: ${absoluteImagePath}`);
      return null;
    }
    
    console.log(`Sending image from path: ${absoluteImagePath}`);
    
    // Create form data for multipart request
    const form = new FormData();
    form.append('chat_id', TELEGRAM_CONFIG.chatId);
    form.append('photo', fs.createReadStream(absoluteImagePath));
    
    if (caption) {
      // Limit caption to 1024 characters (Telegram API limit)
      form.append('caption', caption.substring(0, 1024));
      form.append('parse_mode', 'HTML');
    }
    
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendPhoto`,
      {
        method: 'POST',
        body: form,
      }
    );
    
    const result = await response.json();
    console.log('Telegram photo sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending Telegram photo:', error);
    // Don't throw, just log the error
  }
}

/**
 * Notification for document creation - send first image with initial message
 * @param {Object} document - The document object
 */
async function notifyDocumentCreated(document) {
  // Create the notification message with PDF link if available
  const pdfLink = document.pdfUrl 
    ? `\n\n<b>📄 เอกสาร PDF:</b> <a href="${document.pdfUrl}">ดาวน์โหลด PDF</a>` 
    : '';
    
  const message = `
<b> New NC Document Created</b>

<b>📝หมายเลขเอกสาร:</b> ${document.Document_id}
<b>รหัสสินค้า:</b> ${document.Product_id || 'N/A'}
<b>รายละเอียดสินค้า:</b> ${document.Description || 'N/A'}
<b>Lot No:</b> ${document.Lot_No || 'N/A'}
<b>จำนวน:</b> ${document.Quantity || 'N/A'}
<b>ปัญหาที่พบ:</b> ${document.Issue_Found || 'N/A'}
<b>อธิบายปํญหา:</b> ${document.Issue_Description || 'N/A'}
<b>สร้างโดย:</b> ${document.Foundee || 'N/A'}
<b>แผนก:</b> ${document.Department || 'N/A'}
<b>วันที่:</b> ${formatDate(document.date)}${pdfLink}
`;

  // If there's an image, send the photo with the caption
  if (document.Img1) {
    try {
      // Send the first image with the full message as caption
      await sendTelegramPhotoWithCaption(document.Img1, message);
    } catch (imgError) {
      console.error('Error sending image with notification:', imgError);
      // If image sending fails, fall back to text-only notification
      await sendTelegramMessage(message);
    }
  } else {
    // No image, just send text
    await sendTelegramMessage(message);
  }
}

/**
 * Notification for document status changes
 * @param {Object} document - The document object
 * @param {string} action - Description of the action
 * @param {string} actor - Name of the person who performed the action
 */
async function notifyStatusChange(document, action, actor) {
  // Add PDF link if available
  const pdfLink = document.PdfUrl || document.pdfUrl 
    ? `\n\n<b>📄 เอกสาร PDF:</b> <a href="${document.PdfUrl || document.pdfUrl}">ดาวน์โหลด PDF</a>` 
    : '';

  let additionalInfo = '';
  
  // Add specific details based on the action type
  if (action === 'Accepted by QA') {
    additionalInfo = `
<b>📝หมายเลขเอกสาร:</b> ${document.Document_id}
<b>ทางออกจาก QA:</b> ${document.QASolution || 'Not provided yet'}
<b>คำอธิบาย</b> ${document.QASolutionDescription || 'Not provided yet'}
<b>ชื่อ:</b> ${document.QAName || 'N/A'}
<b>ค่าเสียหาย:</b> ${document.DamageCost ? '$' + document.DamageCost : 'N/A'}
<b>ค่าใช้จ่ายแผนก:</b> ${document.DepartmentExpense || 'N/A'}`;
  } else if (action === 'Send to Manufacture') {
    additionalInfo = `
<b>📝หมายเลขเอกสาร:</b> ${document.Document_id}
<b>รหัสสินค้า:</b> ${document.Product_id || 'N/A'}
<b>รายละเอียดสินค้า:</b> ${document.Description || 'N/A'}
<b>ทางออกจาก QA:</b> ${document.QASolution || 'N/A'}
<b>QA Review By:</b> ${document.QAName || 'N/A'}`;
  } else if (action === 'Send to Environment') {
    additionalInfo = `
<b>📝หมายเลขเอกสาร:</b> ${document.Document_id}
<b>รหัสสินค้า:</b> ${document.Product_id || 'N/A'}
<b>รายละเอียดสินค้า:</b> ${document.Description || 'N/A'}
<b>QA Solution:</b> ${document.QASolution || 'N/A'}
<b>QA Review By:</b> ${document.QAName || 'N/A'}`;
  } else if (action === 'Accepted by Manufacturing') {
    additionalInfo = `
<b>📝หมายเลขเอกสาร:</b> ${document.Document_id}
<b>รหัสสินค้า:</b> ${document.Product_id || 'N/A'}
<b>รายละเอียดสินค้า:</b> ${document.Description || 'N/A'}
<b>Manufacturing Review By:</b> ${document.ManufacturingName || 'N/A'}
<b>Manufacturing Comments:</b> ${document.ManufacturingComments || 'N/A'}`;
  } else if (action === 'Accepted by Environment') {
    additionalInfo = `
<b>📝หมายเลขเอกสาร:</b> ${document.Document_id}
<b>รหัสสินค้า:</b> ${document.Product_id || 'N/A'}
<b>รายละเอียดสินค้า:</b> ${document.Description || 'N/A'}
<b>Environment Review By:</b> ${document.EnvironmentName || 'N/A'}
<b>Environmental Impact:</b> ${document.EnvironmentalImpact || 'N/A'}
<b>Mitigation Measures:</b> ${document.MitigationMeasures || 'N/A'}`;
  } else if (action === 'Accepted by Inventory') {
    additionalInfo = `
<b>📝หมายเลขเอกสาร:</b> ${document.Document_id}
<b>รหัสสินค้า:</b> ${document.Product_id || 'N/A'}
<b>รายละเอียดสินค้า:</b> ${document.Description || 'N/A'}`;
  } else if (action.includes('Accepted by Both')) {
    additionalInfo = `
<b>QA Review By:</b> ${document.QAName || 'N/A'}
<b>Inventory Review By:</b> ${document.InventoryName || 'N/A'}
<b>Both QA and Inventory have now accepted this document.</b>`;
  }

  const message = `
<b>📝 เอกสารมีการเปลี่ยนสถานะ: ${action}</b>

<b>หมายเลขเอกสาร:</b> ${document.Document_id}
<b>รหัสสินค้า:</b> ${document.Product_id || 'N/A'}
<b>รายละเอียดสินค้า:</b> ${document.Description || 'N/A'}
<b>Lot No:</b> ${document.Lot_No || 'N/A'}
<b>จำนวน:</b> ${document.Quantity || 'N/A'}
<b>ปัญหาที่พบ:</b> ${document.Issue_Found || 'N/A'}
<b>สถานะเปลี่ยนโดย:</b> ${actor}
<b>วันที่:</b> ${formatDate(new Date())}
${additionalInfo}
${pdfLink}

<i>This status change requires attention from the appropriate department.</i>
`;

  return await sendTelegramMessage(message);
}

module.exports = {
  notifyDocumentCreated,
  notifyStatusChange
};