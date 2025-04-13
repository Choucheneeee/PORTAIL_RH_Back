// User modelconst mongoose = require("mongoose");

// User model
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false }, 
    verificationCode: { type: String },
    role: { type: String, enum: ["admin", "collaborateur","rh"], required: true },
    resetToken: String,
    resetTokenExpiration: Date,
    personalInfo: {
      phone: String,
      countryCode: String,
      address: String,
      birthDate: Date,
    },
    professionalInfo: {
      position: String,
      department: String,
      hiringDate: Date,
      salary: Number,
    },
    socialInfo: {
      maritalStatus: String,
      children: Number,
    },
    timeOffBalance: { type: Number, default: 28 },
    createdAt: { type: Date, default: Date.now },
  });
  
  module.exports = mongoose.model("User", UserSchema);
  
  // msg