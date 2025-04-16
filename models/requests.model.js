const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  firstName: { 
    type: String, 
    required: true 
  },  
  lastName: { 
    type: String, 
    required: true 
  },
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
        // Fixed to use requestType instead of type
        return validDocumentTypes[this.requestType]?.includes(value);
      },
      message: props => `"${props.value}" is not a valid document type for ${props.instance.requestType}`
    }
  },
  paydetails: {
    type: {
      periodStart: { 
        type: Date,
        required: true 
      },
      periodEnd: { 
        type: Date,
        required: true,
        validate: {
          validator: function(v) {
            return v > this.periodStart;
          },
          message: 'End date must be after start date'
        }
      },
      basicSalary: {
        type: Number,
        required: true,
        min: 0
      },
      allowances: {
        type: Number,
        default: 0,
        min: 0
      },
      overtime: {
        type: Number,
        default: 0,
        min: 0
      },
      tax: {
        type: Number,
        required: true,
        min: 0
      },
      insurance: {
        type: Number,
        required: true,
        min: 0
      },
      otherDeductions: {
        type: Number,
        default: 0,
        min: 0
      },
      totalEarnings: {
        type: Number,
        default: function() {
          return this.basicSalary + this.allowances + this.overtime;
        }
      },
      totalDeductions: {
        type: Number,
        default: function() {
          return this.tax + this.insurance + this.otherDeductions;
        }
      },
      netPay: {
        type: Number,
        default: function() {
          return this.totalEarnings - this.totalDeductions;
        }
      }
    },
    required: function() {
      return ['Payslip', 'Salary Certificate', 'Tax Certificate'].includes(this.documentType);
    }
  },
  details: {
    type: {
      newDepartment: String,
      newPosition: String,
      effectiveDate: Date,
      reason: String
    },
    required: function() {
      return this.documentType === 'Work Transfer Request';
    }
  },
  status: { 
    type: String, 
    enum: ["Pending", "Accepted", "Declined"], 
    default: "Pending" 
  },
  startDate: Date,
  endDate: Date,
  document: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Document" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  numberOfDays: Number,
  updatedAt: Date
});

module.exports = mongoose.model("Request", requestSchema);