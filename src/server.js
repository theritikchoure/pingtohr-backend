require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");

const session = require("express-session");
const passport = require("passport");

const mongodb = require("./config/database.js");
const apiRoutes = require("./routes/index.route.js");


require("./config/oauth.js");

const app = express();
const PORT = process.env.PORT || 3000;


app.use(
  session({
    secret: "hello-pingtohr",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      sameSite: "none",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(morgan("dev"));

app.use(express.json());

app.use(cors());

app.use("/uploads", express.static("uploads")); // to serve resume files

app.use("/api", apiRoutes);


// Start OAuth flow
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback URL
app.get('/api/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: true
  }),
  (req, res) => {
    // On success, redirect to React app
    res.redirect('/dashboard');
  }
);

// Get logged-in user
app.get('/api/auth/me', (req, res) => {
  res.json(req.user || null);
});

app.listen(PORT, () => {
  console.log(`Email tracking server running at http://localhost:${PORT}`);
});
