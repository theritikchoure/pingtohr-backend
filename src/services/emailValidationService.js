const { EmailValidator } = require("email-smtp-validator");
const dns = require("dns").promises;

const emailValidator = new EmailValidator({
  sender: "sweritikchourasiya@gmail.com",
  validateRegex: true,
  validateMx: true,
  validateDisposable: true,
  validateSMTP: true,
  validateSMTPdeep: true,
  timeout: 10000,
  port: 25,
});

function isValidEmail(email) {
  const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return strictEmailRegex.test(email);
}

async function hasMX(domain) {
  try {
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
}

async function validateEmail(email) {
  const domain = email.split("@")[1];

  const report = {
    email,
    validFormat: false,
    isDisposable: false,
    hasMx: false,
    smtp: false,
    reason: "",
    canSend: false,
  };

  // 1. Regex
  if (!isValidEmail(email)) {
    report.reason = "Invalid email format.";
    return report;
  }
  report.validFormat = true;

  // 2. MX
  report.hasMx = await hasMX(domain);
  if (!report.hasMx) {
    report.reason = "No MX records found.";
    return report;
  }

  // 3. SMTP + Disposable
  try {
    const result = await emailValidator.verify(email);
    report.smtp = result.smtp.valid;

    if (!result.smtp.valid) {
      report.reason = result.smtp.info || "SMTP check failed.";
    } else {
      report.reason = "Valid email.";
    }

    if (!result?.disposable?.valid) {
      report.isDisposable = true;
      report.reason = "Disposable email detected.";
      return report;
    }
  } catch {
    report.reason = "SMTP check error or timeout.";
  }

  report.canSend =
    report.validFormat && report.hasMx && !report.isDisposable;
  return report;
}

module.exports = {
  validateEmail,
};
