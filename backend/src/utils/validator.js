const validator = require("validator");

// req.body validator used for register/login

const validate = (data) => {
  // Only require emailId and password; firstName is optional
  const mandatoryField = ["emailId", "password"];

  const hasAllFields = mandatoryField.every((k) => Object.keys(data).includes(k));

  if (!hasAllFields) throw new Error("Some Field Missing");

  if (!validator.isEmail(data.emailId)) throw new Error("Invalid Email");

  // Minimum length 8, aligned with frontend validation
  if (typeof data.password !== "string" || data.password.length < 8)
    throw new Error("Weak Password");
};

module.exports = validate;