const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  firstName: { type: String, required: true },  
  lastName: { type: String, required: true },
  requestType: { 
    type: String, 
    enum: [
      "Employment & Work Documents",
      "Payroll & Financial Documents",
      "Leave & Time-Off Requests",
      "HR & Administrative Requests"
    ], 
    required: true 
  },
  documentType: { 
    type: String, 
    required: true,
    validate: {
      validator: function(value) {
        const validDocumentTypes = {
          "Employment & Work Documents": [
            "Employment Certificate",
            "Job Description",
            "Work Transfer Request"
          ],
          "Payroll & Financial Documents": [
            "Payslip",
            "Salary Certificate",
            "Tax Certificate"
          ],
          "Leave & Time-Off Requests": [
            "Paid Leave Request",
            "Sick Leave Request",
            "Maternity/Paternity Leave"
          ],
          "HR & Administrative Requests": [
            "Reference Letter",
            "Resignation Request",
            "ID Badge Replacement"
          ]
        };
        return validDocumentTypes[this.type]?.includes(value);
      },
      message: props => `"${props.value}" is not a valid document type for ${props.instance.type}`
    }
  },
  status: { type: String, enum: ["Pending", "Accepted", "Declined"], default: "Pending" },
  requestDetails: String,
  startDate: { type: Date }, // Only for leave requests
  endDate: { type: Date },   // Only for leave requests
  document: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
  createdAt: { type: Date, default: Date.now },
  numberOfDays: { type: Number },
  updatedAt: Date
});

module.exports = mongoose.model("Request", requestSchema);
