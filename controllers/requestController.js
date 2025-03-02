// Handles user requests
const Request = require("../models/requests.model");  // ✅ Import the Request model


exports.addRequest = async (req, res) => {
    try {
      const { user,firstName,lastName, requestType, documentType, requestDetails, startDate, endDate } = req.body;
  
      // Validate required fields
      if (! user || ! requestType || !documentType) {
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
  
      if (!validDocumentTypes[requestType]?.includes(documentType)) {
        return res.status(400).json({
          error: `"${documentType}" is not a valid document type for "${requestType}".`
        });
      }
  
      // Create new request
      const newRequest = new Request({
        user,
        requestType,
        documentType,
        firstName,
        lastName,
        requestDetails,
        startDate: startDate || null,
        endDate: endDate || null
      });
  
      await newRequest.save();
      res.status(201).json({ message: "Request submitted successfully", data: newRequest });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.getAllRequest =async(req,res)=>{
  try {
    const requests = await Request.find();
      res.status(200).json(requests );
      } catch (error) {
        res.status(500).json({ error: error.message });
        }

}

exports.updatedRequest = async (req, res) => {
  const { id } = req.params; // Getting the request ID from the route parameter
  const { status } = req.body; // Getting the new status from the body

  try {
    // Find the request by its ID and update its status
    const request = await Request.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true, runValidators: true } // `new: true` returns the updated document
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Return the updated request
    res.status(200).json(request);
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.deleteRequest =async(req,res)=>{
  try {
    const requestId = req.params.id;
    const request = await Request.findByIdAndDelete(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
      }
      res.status(200).json({ message: "Request deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
        }
}