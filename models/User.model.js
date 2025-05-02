const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  cin:{
    type:Number,
    unique:true,
    require:true
  },
  email: { 
    type: String, 
    unique: true, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  profileImage: { 
    type: String, 
  },
  isApproved: { 
    type: Boolean, 
    default: false 
  },
  verificationCode: String,
  role: { 
    type: String, 
    enum: ["admin", "collaborateur", "rh"], 
    required: true 
  },
  resetToken: String,
  resetTokenExpiration: Date,
  personalInfo: {
    phone: String,
    countryCode: String,
    address: String,
    birthDate: Date
  },
  financialInfo: {
    bankAccount: String,
    taxId: String
  },
  professionalInfo: {
    position: String,
    department: String,
    hiringDate: Date,
    salary: Number,
    jobDescription: {
      responsibilities: [String],
      qualifications: [String],
      effectiveDate: Date
    }
  },
  socialInfo: {
    maritalStatus: String,
    children: Number
  },
  timeOffBalance: { 
    type: Number, 
    default: 28 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("User", UserSchema);