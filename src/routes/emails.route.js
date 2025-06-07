const express = require("express");
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const validator = require("validator");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const sendEmail = require("../config/sendMail");
const { validateEmail } = require("../services/emailValidationService");
const authMiddleware = require("../middlwares/authMiddleware");
const User = require("../models/users.model");
const { generateEmailPermutations } = require("../services/emailPermutationsService");

const router = express.Router();

const upload = multer({ dest: "uploads/" }); // temp upload folder

// Helper: parse CSV file buffer to array of objects
function parseCSV(buffer) {
  const records = parse(buffer, {
    columns: true, // first line as keys
    skip_empty_lines: true,
  });
  return records;
}

// Helper: parse JSON file buffer to array of objects
function parseJSON(buffer) {
  try {
    const json = JSON.parse(buffer.toString());
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

// Validate emails, remove duplicates and invalid
function extractValidEmails(records) {
  const emailsMap = new Map();
  for (const record of records) {
    // Assume record may have 'email', 'name', 'company' fields (adjust as needed)
    const email = (record.email || "").trim().toLowerCase();
    if (validator.isEmail(email) && !emailsMap.has(email)) {
      emailsMap.set(email, {
        email,
        name: record.name || "",
        company: record.company || "",
      });
    }
  }
  return Array.from(emailsMap.values());
}

// Upload file to Wasabi S3
async function uploadToWasabi(filePath, fileName) {
  const fileStream = fs.createReadStream(filePath);
  const params = {
    Bucket: process.env.WASABI_BUCKET_NAME,
    Key: `uploads/${fileName}`,
    Body: fileStream,
    ACL: "private",
  };
  await s3.upload(params).promise();
  return `uploads/${fileName}`;
}

router.post("/upload-emails", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File is required" });

  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const buffer = fs.readFileSync(req.file.path);
    let records = [];

    if (ext === ".csv") {
      records = parseCSV(buffer);
    } else if (ext === ".json") {
      records = parseJSON(buffer);
    } else {
      return res
        .status(400)
        .json({ error: "Only CSV or JSON files are allowed" });
    }
    console.log("records", records);
    const validEmails = extractValidEmails(records);

    // Optional: Save emails to DB, linking to user (assuming req.user._id)
    // await Email.insertMany(validEmails.map(e => ({ ...e, uploadedBy: req.user._id })), { ordered: false });

    // Upload original file to Wasabi
    // const remotePath = await uploadToWasabi(
    //   req.file.path,
    //   req.file.originalname
    // );

    // Cleanup local file
    fs.unlinkSync(req.file.path);

    res.json({
      message: "File uploaded and processed",
      totalEmails: validEmails.length,
      //   s3Path: remotePath,
      emails: validEmails, // optionally return email list (careful if large)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process file" });
  }
});


function filterEmails(campaignEmails, unsubscribedEmails) {
  const unsubSet = new Set(unsubscribedEmails.map((e) => e.toLowerCase()));
  return campaignEmails.filter((email) => !unsubSet.has(email));
}

router.post("/send-emails", async (req, res) => {
  try {
    const userEmail = "sweritikchourasiya@gmail.com";
    const appPassword = "vplc sdjr ezbk pwaw"; // Use real App Password (not your Gmail login password)

    // const emailList = [
    //   "softwareeng.ritik@gmail.com",
    //   "rahulk@docfliq.com", "krahul@docfliq.com", "rk@docfliq.com", "rahul@docfliq.com", "k@docfliq.com",
    //   "rahul.k@docfliq.com", "k.rahul@docfliq.com", "r.k@docfliq.com", "rahul_k@docfliq.com",
    //   "k_rahul@docfliq.com", "r_k@docfliq.com", "rahul-k@docfliq.com", " k-rahul@docfliq.com", "r-k@docfliq.com",
    // ];
    const emailList = ["softwareeng.ritik@gmail.com"];

    const excludeEmails = ["softwareeng.ritik@gmail.com", "rahulk@docfliq.com"];

    const subject = "Your Job Application";
    const bodyText = "Hello, please find my resume attached.";
    const attachments = [{ filename: "ritik-chourasiya-resume.pdf", path: "./uploads/resumes/resume.pdf" }];


    const finalRecipients = filterEmails(emailList, excludeEmails);

    console.log(emailList.length)
    console.log(excludeEmails.length)
    console.log(`📤 Sending to ${finalRecipients.length} recipients...`);

    sendEmail(
      userEmail,
      appPassword,
      emailList.join(","),
      subject,
      bodyText,
      attachments
    )
      .then(() => console.log("All done"))
      .catch(console.error);

    res.json({
      message: "File uploaded and processed",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process file" });
  }
});

router.post("/email-validate-bulk", async (req, res) => {
  try {
    const emails = req.body.emails;

    if (!Array.isArray(emails)) {
      return res.status(400).json({ error: "emails must be an array" });
    }

    const results = await Promise.all(
      emails.map(async (email) => await validateEmail(email))
    );

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process file" });
  }
});

router.post("/smtp-auth", authMiddleware, async (req, res) => {

  try {

    const userId = req.user.id;

    // Find user and check if token matches
    const user = await User.findById(userId);
    if (!user)
      return res.status(403).json({ message: "Invalid refresh token" });


    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: password,
      },
    });

    await transporter.verify();

    user.smtp_auth_verified = true;
    await user.save();

    res.json({ success: true, message: "SMTP authentication successful." });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "SMTP authentication failed.",
      error: "Invalid login: 535-5.7.8 Username and Password not accepted.",
    });
  }
});

router.get("/check-smtp-auth", authMiddleware, async (req, res) => {
  

  try {
    const userId = req.user.id;

    // Find user and check if token matches
    const user = await User.findById(userId);
    if (!user)
      return res.status(403).json({ message: "Invalid refresh token" });


    res.json({ success: true, message: "SMTP authentication successful.", data: {smtp_auth_verified: user.smtp_auth_verified} });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "SMTP authentication failed.",
      error: "Invalid login: 535-5.7.8 Username and Password not accepted.",
    });
  }
});



router.post("/generate-permutations", authMiddleware, async (req, res) => {
  try {
    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    const domain = req.body.domain;

    if (!firstName || !lastName || !domain) {
      return res.status(403).json({ message: "first_name, last_name and domain are required" });
    }

    let emails = generateEmailPermutations({ firstName, lastName, domain });

    res.json({
      success: true,
      message: "SMTP authentication successful.",
      data: emails,
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "SMTP authentication failed.",
      error: "Invalid login: 535-5.7.8 Username and Password not accepted.",
    });
  }
});

module.exports = router;
