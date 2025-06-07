// sendMail.js
const createGmailTransporter = require("./mailers");
const nodemailer = require("nodemailer");

async function sendEmail(
  userEmail,
  appPassword,
  to,
  subject,
  bodyText,
  attachments = []
) {
  const transporter = createGmailTransporter(userEmail, appPassword);

  const mailOptions = {
    from: userEmail,
    to,
    subject,
    // text: bodyText,
    html: `
      <div>
        <p>Hello,</p>
        <p>Please find my resume attached.</p>
        <img src="http://localhost:3000/track/${encodeURIComponent(
          to
        )}" alt="" width="1" height="1" style="display:none;" />
      </div>
    `,
    attachments,
  };

  try {
      const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Failed to send email:", err);
    throw err;
  }
}

module.exports = sendEmail;
