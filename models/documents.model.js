const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "Employment Certificate",
      "Payslip",
      "Tax Certificate",
      "Reference Letter",
      "Other"
    ]
  },
  generatedFor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Request",
    required: true 
  },
  generatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  metadata: mongoose.Schema.Types.Mixed,
  expiresAt: Date,
  accessRoles: [{
    type: String,
    enum: ["employee", "hr", "finance", "manager"]
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("Document", documentSchema);