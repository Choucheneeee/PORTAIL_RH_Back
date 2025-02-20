// Handles user requests
const Request = require("../models/requests.model");  // ✅ Import the Request model


exports.addRequest = async (req, res) => {
    try {
      const { user, type, documentType, details, startDate, endDate } = req.body;
  
      // Validate required fields
      if (!user || !type || !documentType) {
        return res.status(400).json({ error: "User, type, and documentType are required." });
      }
  
      // Validate document type based on request type
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
  
      if (!validDocumentTypes[type]?.includes(documentType)) {
        return res.status(400).json({
          error: `"${documentType}" is not a valid document type for "${type}".`
        });
      }
  
      // Create new request
      const newRequest = new Request({
        user,
        type,
        documentType,
        details,
        startDate: startDate || null,
        endDate: endDate || null
      });
  
      await newRequest.save();
      res.status(201).json({ message: "Request submitted successfully", data: newRequest });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  