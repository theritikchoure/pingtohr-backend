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
    name: "pingtohr.sid",
    secret: "hello-pingtohr",
    resave: false,
    saveUninitialized: false, // ❗ MUST be false
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true, // for extra security
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.set('trust proxy', 1); // ✅ Trust NGINX to detect https

app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(morgan("dev"));

app.use(express.json());

app.use(
  cors({
    origin: "https://pingtohr.ritikprojects.tech",
    credentials: true,
  })
);

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
    console.log("Authenticated user:", req.user); // ✅ should not be null
    // On success, redirect to React app
    res.redirect("/dashboard");
  }
);

app.use((req, res, next) => {
  console.log("SESSION ID:", req.sessionID);
  console.log("SESSION:", req.session);
  console.log("USER:", req.user);
  next();
});

// Get logged-in user
app.get('/api/auth/me', (req, res) => {
  res.json(req.user || null);
});

app.listen(PORT, () => {
  console.log(`Email tracking server running at http://localhost:${PORT}`);
});
