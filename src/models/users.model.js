const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { encrypt, decrypt } = require("../utils/encryptUtil");

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Please fill a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    refresh_token: {
      type: String,
      select: false, // prevent by default when querying
    },
    gmail_app_password: {
      type: String,
      select: false, // optional, to prevent it from being queried accidentally
    },
    is_email_verified: { type: Boolean, default: false },
    email_verification_token: { type: String },
    smtp_auth_verified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false, // disable __v
  }
);

// Indexing for performance
// userSchema.index({ email: 1 });
// userSchema.index({ username: 1 });

// Password hashing
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    return next(err);
  }
});

// Password comparison
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Encrypt Gmail App Password before saving
userSchema.pre("save", function (next) {
  if (!this.isModified("gmail_app_password")) return next();

  try {
    this.gmail_app_password = encrypt(this.gmail_app_password);
    next();
  } catch (err) {
    next(err);
  }
});

// Decryption method
userSchema.methods.getDecryptedAppPassword = function () {
  return decrypt(this.gmail_app_password);
};

// Remove sensitive data from output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refresh_token;
  return userObject;
};

module.exports = mongoose.model("User", userSchema);
