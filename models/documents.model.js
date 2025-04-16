const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "Employment Certificate",
            "Job Description",
            "Work Transfer Request",
            "Payslip",
            "Salary Certificate",
            "Tax Certificate",
            "Paid Leave Request",
            "Sick Leave Request",
            "Maternity/Paternity Leave",
            "Reference Letter",
            "Resignation Request",
            "ID Badge Replacement"

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