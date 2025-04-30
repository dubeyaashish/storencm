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
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format date for display
 * @param {Date|string} date - Date object or string to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return 'N/A';
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
    console.log('Preparing to send Telegram message:', message);
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
    if (!result.ok) {
      console.error('Telegram API error:', result);
      return null;
    }
    console.log('Telegram notification sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return null;
  }
}

/**
 * Resolve image path to absolute path
 * @param {string} imagePath - Path to the image file
 * @returns {string} Absolute path to the image
 */
function resolveImagePath(imagePath) {
  if (!imagePath) return null;
  
  if (!imagePath.startsWith('/') && !imagePath.includes('://')) {
    return path.join(__dirname, '..', 'Uploads', imagePath);
  } else if (imagePath.startsWith('/Uploads/') || imagePath.startsWith('/uploads/')) {
    return path.join(__dirname, '..', imagePath.substring(1));
  }
  
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
    const absoluteImagePath = resolveImagePath(imagePath);
    
    if (!absoluteImagePath || !fs.existsSync(absoluteImagePath)) {
      console.error(`Image file not found: ${absoluteImagePath}`);
      return null;
    }
    
    console.log(`Sending image from path: ${absoluteImagePath} with caption:`, caption);
    
    const form = new FormData();
    form.append('chat_id', TELEGRAM_CONFIG.chatId);
    form.append('photo', fs.createReadStream(absoluteImagePath));
    
    if (caption) {
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
    if (!result.ok) {
      console.error('Telegram API error for photo:', result);
      return null;
    }
    console.log('Telegram photo sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending Telegram photo:', error);
    return null;
  }
}

/**
 * Notification for document creation - send first image with initial message
 * @param {Object} document - The document object
 */
async function notifyDocumentCreated(document) {
  console.log('notifyDocumentCreated called with document:', document);
  console.log('PdfUrl present?', !!document.PdfUrl, 'Value:', document.PdfUrl);
  
  // Construct message without PDF link for caption
  const message = `
<b> New NC Document Created</b>

<b>📝หมายเลขเอกสาร:</b> ${document.Document_id || 'N/A'}
<b>รหัสสินค้า:</b> ${document.Product_id || 'N/A'}
<b>รายละเอียดสินค้า:</b> ${document.Description || 'N/A'}
<b>Lot No:</b> ${document.Lot_No || 'N/A'}
<b>จำนวน:</b> ${document.Quantity || 'N/A'}
<b>ปัญหาที่พบ:</b> ${document.Issue_Found || 'N/A'}
<b>อธิบายปํญหา:</b> ${document.Issue_Description || 'N/A'}
<b>สร้างโดย:</b> ${document.Foundee || 'N/A'}
<b>แผนก:</b> ${document.Department || 'N/A'}
<b>วันที่:</b> ${formatDate(document.date)}
`.trim();

  console.log('Message for caption:', message);

  // Construct PDF link as plain text for separate message
  const pdfLinkMessage = document.PdfUrl && typeof document.PdfUrl === 'string' && document.PdfUrl.trim() !== '' && isValidUrl(document.PdfUrl)
    ? `📄 เอกสาร PDF: ${document.PdfUrl}`
    : '';
  console.log('PDF link message:', pdfLinkMessage);

  if (document.Img1) {
    try {
      // Send image with caption
      const result = await sendTelegramPhotoWithCaption(document.Img1, message);
      if (!result) {
        console.log('Image send failed, falling back to text message');
        await sendTelegramMessage(message);
      }
      // Send PDF link as separate message
      if (pdfLinkMessage) {
        await sendTelegramMessage(pdfLinkMessage);
      }
    } catch (imgError) {
      console.error('Error sending image with notification:', imgError);
      await sendTelegramMessage(message);
      if (pdfLinkMessage) {
        await sendTelegramMessage(pdfLinkMessage);
      }
    }
  } else {
    await sendTelegramMessage(message);
    if (pdfLinkMessage) {
      await sendTelegramMessage(pdfLinkMessage);
    }
  }
}

/**
 * Notification for document status changes
 * @param {Object} document - The document object
 * @param {string} action - Description of the action
 * @param {string} actor - Name of the person who performed the action
 */
async function notifyStatusChange(document, action, actor) {
  console.log('notifyStatusChange called with document:', document);
  console.log('PdfUrl present?', !!document.PdfUrl, 'Value:', document.PdfUrl);
  
  const message = `
<b>📝 เอกสารมีการเปลี่ยนสถานะ: ${action}</b>

<b>หมายเลขเอกสาร:</b> ${document.Document_id || 'N/A'}
<b>รหัสสินค้า:</b> ${document.Product_id || 'N/A'}
<b>รายละเอียดสินค้า:</b> ${document.Description || 'N/A'}
<b>Lot No:</b> ${document.Lot_No || 'N/A'}
<b>จำนวน:</b> ${document.Quantity || 'N/A'}
<b>ปัญหาที่พบ:</b> ${document.Issue_Found || 'N/A'}
<b>สถานะเปลี่ยนโดย:</b> ${actor || 'N/A'}
<b>วันที่:</b> ${formatDate(new Date())}
`.trim();

  let additionalInfo = '';
  
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

  const fullMessage = `
${message}
${additionalInfo}
`.trim();

  console.log('Message for status change:', fullMessage);

  // Construct PDF link as plain text for separate message
  const pdfLinkMessage = document.PdfUrl && typeof document.PdfUrl === 'string' && document.PdfUrl.trim() !== '' && isValidUrl(document.PdfUrl)
    ? `📄 เอกสาร PDF: ${document.PdfUrl}`
    : '';
  console.log('PDF link message:', pdfLinkMessage);

  await sendTelegramMessage(fullMessage);
  if (pdfLinkMessage) {
    await sendTelegramMessage(pdfLinkMessage);
  }
}

module.exports = {
  notifyDocumentCreated,
  notifyStatusChange
};