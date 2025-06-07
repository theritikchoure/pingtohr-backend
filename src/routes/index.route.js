const express = require("express");
const authRoutes = require("./auth.route");
const emailsRoutes = require("./emails.route");
const trackRoutes = require("./track.route");
const resumeRoutes = require("./resume.route.js");

const router = express.Router();


router.use("/auth", authRoutes);
router.use("/emails", emailsRoutes);
router.use("/track", trackRoutes);
router.use("/resume", resumeRoutes);

module.exports = router;
