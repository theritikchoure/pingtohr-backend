// mailer.js
const nodemailer = require("nodemailer");

/**
 * Creates a Nodemailer transporter for a user's Gmail account.
 * @param {string} userEmail - The user's Gmail address
 * @param {string} appPassword - The user's Gmail App Password
 * @returns {nodemailer.Transporter}
 */
function createGmailTransporter(userEmail, appPassword) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: userEmail,
      pass: appPassword, // Must be Gmail App Password
    },
  });
}

module.exports = createGmailTransporter;
