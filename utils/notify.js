const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: { 
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  },
});

/**
 * Send an email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 * @param {string} html - Optional HTML email body
 * @returns {Promise} - Promise resolving to the sent message info
 */
exports.sendEmail = async (to, subject, text, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not found. Email will not be sent.');
      return { success: false, error: 'Email credentials not configured' };
    }
    
    const mailOptions = { 
      from: `College Portal <${process.env.EMAIL_USER}>`, 
      to, 
      subject, 
      text
    };
    
    if (html) {
      mailOptions.html = html;
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send a notification (email only)
 * @param {Object} options - Notification options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Notification message
 * @param {string} options.html - Optional HTML email body
 * @returns {Promise} - Promise resolving to the email sending result
 */
exports.sendNotification = async ({ email, subject, message, html }) => {
  if (email) {
    return await exports.sendEmail(email, subject, message, html);
  }
  
  return { success: false, error: 'No email provided' };   
};

