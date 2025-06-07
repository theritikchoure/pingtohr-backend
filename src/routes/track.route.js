const express = require("express");
const fs = require("fs");
const path = require("path");


const router = express.Router();

router.get("/:emailId", async (req, res) => {
  const emailId = req.params.emailId;
  const userAgent = req.headers["user-agent"];
  const ip = req.ip;

  // Log open
  console.log(`Email opened - ID: ${emailId}, IP: ${ip}, UA: ${userAgent}`);

  // Set headers for gif response (transparent pixel)
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Send the tracking GIF file
  const filePath = path.join(__dirname, "../../tracking.gif");
  const img = fs.readFileSync(filePath);
  res.end(img, "binary");
});

module.exports = router;
