const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Configure multer for resume upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/resumes/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|rtf/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format"));
  }
};


const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit
  fileFilter: fileFilter,
});
  

router.post("/upload", upload.single("resume"), async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded or unsupported format." });
    }

    res.status(200).json({
      message: "Resume uploaded successfully",
      fileUrl: `/uploads/resumes/${req.file.filename}`,
      filename: req.file.originalname,
      uploadedAt: new Date(),
    });
});

module.exports = router;
