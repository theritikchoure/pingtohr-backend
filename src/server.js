require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");

const mongodb = require("./config/database.js");
const apiRoutes = require("./routes/index.route.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan("dev"));

app.use(express.json());

app.use(cors());

app.use("/uploads", express.static("uploads")); // to serve resume files

app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`Email tracking server running at http://localhost:${PORT}`);
});
