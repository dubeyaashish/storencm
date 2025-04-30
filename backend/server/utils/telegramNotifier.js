// server/utils/telegramNotifier.js
const fetch = require('node-fetch');

// Configuration for Telegram
const TELEGRAM_CONFIG = {
  chatId: "-4627377279",
  botToken: "7646625188:AAGS-NqBl3rUU9AlC9a01wzlbaqs6spBf7M"
};

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
 * Notification for document creation
 * @param {Object} document - The document object
 */
async function notifyDocumentCreated(document) {
  const message = `
<b>🚨 New Non-Conformance Document Created</b>

<b>Document Number:</b> ${document.Document_id}
<b>Product ID:</b> ${document.Product_id || 'N/A'}
<b>Description:</b> ${document.Description || 'N/A'}
<b>Issue:</b> ${document.Issue_Description || 'N/A'}
<b>Created By:</b> ${document.Foundee || 'N/A'}
<b>Date:</b> ${new Date().toLocaleString()}
`;

  return await sendTelegramMessage(message);
}

/**
 * Notification for document status changes
 * @param {Object} document - The document object
 * @param {string} action - Description of the action
 * @param {string} actor - Name of the person who performed the action
 */
async function notifyStatusChange(document, action, actor) {
  const message = `
<b>📝 Document Status Changed</b>

<b>Document Number:</b> ${document.Document_id}
<b>Action:</b> ${action}
<b>Updated By:</b> ${actor}
<b>Product ID:</b> ${document.Product_id || 'N/A'}
<b>Description:</b> ${document.Description || 'N/A'}
<b>Date:</b> ${new Date().toLocaleString()}
`;

  return await sendTelegramMessage(message);
}

module.exports = {
  notifyDocumentCreated,
  notifyStatusChange
};