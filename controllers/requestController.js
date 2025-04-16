const Request = require("../models/requests.model");
const Document = require("../models/documents.model");
const nodemailer = require("nodemailer");
const User = require("../models/User.model");
const { generateEmploymentCertificate,generateJobDescriptionCertificate,generateWorkTransferRequest,generatePayslipRequest } = require("../utils/pdfGenerator");
// Helper function to calculate working days
function calculateWorkingDays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

exports.createRequest = async (req, res) => {
  try {
    const { requestType, documentType, requestDetails, startDate, endDate } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!requestType || !documentType) {
      return res.status(400).json({ error: "Request type and document type are required." });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate document type
    const validDocumentTypes = {
      "Employment & Work Documents": ["Employment Certificate", "Job Description", "Work Transfer Request"],
      "Payroll & Financial Documents": ["Payslip", "Salary Certificate", "Tax Certificate"],
      "Leave & Time-Off Requests": ["Paid Leave Request", "Sick Leave Request", "Maternity/Paternity Leave"],
      "HR & Administrative Requests": ["Reference Letter", "Resignation Request", "ID Badge Replacement"]
    };

    if (!validDocumentTypes[requestType]?.includes(documentType)) {
      return res.status(400).json({ error: `"${documentType}" is not a valid document type for "${requestType}".` });
    }

    // Base request data
    const requestData = {
      user: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      requestType,
      documentType,
      status: 'Pending',
      requestDetails: requestDetails
    };

    // Handle Work Transfer Request specifically
    if (documentType === 'Work Transfer Request') {
      const { newDepartment, newPosition, effectiveDate, transferReason } = req.body;
      
      if (!newDepartment || !newPosition || !effectiveDate || !transferReason) {
        return res.status(400).json({ error: "All work transfer fields are required" });
      }

      requestData.details = {
        newDepartment,
        newPosition,
        effectiveDate: new Date(effectiveDate),
        reason: transferReason
      };
    } 
    // Handle other document types
    if (documentType === 'Payslip') {
      console.log("req.body",req.body)
      const { allowances, basicSalary, insurance, otherDeductions,overtime,periodEnd,periodStart,tax } = req.body.paydetails;
      
      if (!allowances || !basicSalary || !insurance || !otherDeductions|| !overtime || !periodEnd|| ! periodStart || !tax) {
        return res.status(400).json({ error: "All work transfer fields are required" });
      }

      requestData.paydetails = {
        allowances,
        basicSalary,
        insurance,
        otherDeductions,
        overtime,
        periodEnd: new Date(periodEnd),
        periodStart: new Date(periodStart),
        tax
      };
    } 


    // Handle Leave & Time-Off Requests
    if (requestType === 'Leave & Time-Off Requests') {
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start and end dates are required for time-off requests" });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date().setHours(0,0,0,0);

      if (start < today) {
        return res.status(400).json({ error: "Start date cannot be in the past" });
      }

      if (start >= end) {
        return res.status(400).json({ error: "End date must be after start date" });
      }

      const numberOfDays = calculateWorkingDays(start, end);
      if (numberOfDays <= 0) {
        return res.status(400).json({ error: "No working days in selected period" });
      }

      if (user.timeOffBalance < numberOfDays) {
        return res.status(400).json({ error: "Insufficient time off balance" });
      }

      // Add leave-specific fields
      requestData.startDate = start;
      requestData.endDate = end;
      requestData.numberOfDays = numberOfDays;
    }

    // Handle Employment & Work Documents validation
    if (requestType === "Employment & Work Documents") {
      if (!user.professionalInfo?.position || !user.professionalInfo?.department) {
        return res.status(400).json({ 
          error: "User professional information is required for this request" 
        });
      }

      if (documentType === "Employment Certificate" && !user.professionalInfo.hiringDate) {
        return res.status(400).json({
          error: "Hiring date is required for employment certificate"
        });
      }

      if (documentType === "Job Description" && !user.professionalInfo.jobDescription) {
        return res.status(400).json({
          error: "Job description details not found"
        });
      }
    }
    
    const newRequest = new Request(requestData);
    await newRequest.save();

    // Notify admins
    const admins = await User.find({ role: "admin" });
    if (admins.length > 0) {
      const adminEmails = admins.map(admin => admin.email);
      await sendAdminNotification(adminEmails, user.firstName, user.lastName, requestType, documentType);
    }

    res.status(201).json({ message: "Request submitted successfully", data: newRequest });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find().populate('user', 'firstName lastName email');
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCollaboratorRequests = async (req, res) => {
  try {
    const requests = await Request.find({ user: req.user.id });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    const user = await User.findById(request.user);
    if (request.documentType === 'Payslip') {
      if (request.paydetails.tax > request.paydetails.totalEarnings * 0.4) {
        return res.status(404).json({ error: "Handle unreasonable tax rate" });
      }
    }

    if (request.requestType === 'Leave & Time-Off Requests') {
      
      // Original time-off balance logic
      if (status === 'Accepted' && request.status !== 'Accepted') {
        if (user.timeOffBalance < request.numberOfDays) {
          return res.status(400).json({ error: 'Insufficient time off balance' });
        }
        user.timeOffBalance -= request.numberOfDays;
        await user.save();
      }
      
      if (status === 'Declined' && request.status === 'Accepted') {
        user.timeOffBalance += request.numberOfDays;
        await user.save();
      }
    }
    else{
      if (status === 'Accepted') {
        switch(request.requestType) {
          case 'Employment & Work Documents':
            switch(request.documentType) {
              case 'Employment Certificate':
                docData = await generateEmploymentCertificate(user, request);
                break;
              case 'Job Description':
                docData = await generateJobDescriptionCertificate(user, request);
                break;
              case 'Work Transfer Request':
                docData = await generateWorkTransferRequest(user, request);
                break;
              default:
                throw new Error(`Invalid document type for Employment & Work Documents: ${request.documentType}`);
            }
            break;
  
          case 'Payroll & Financial Documents':
            switch(request.documentType) {
              case 'Payslip':
                docData = await generatePayslipRequest(user, request);
                break;
              case 'Salary Certificate':
                docData = await generateSalaryCertificate(user, request);
                break;
              case 'Tax Certificate':
                docData = await generateTaxCertificate(user, request);
                break;
              default:
                throw new Error(`Invalid document type for Payroll & Financial Documents: ${request.documentType}`);
            }
            break;
            case 'Leave & Time-Off Requests':
            switch(request.documentType) {
              case 'Paid Leave Request':
                // docData = await generatePayslipRequest(user, request);
                break;
              case 'Sick Leave Request':
                // docData = await generateSalaryCertificate(user, request);
                break;
              case 'Maternity/Paternity Leave':
                // docData = await generateTaxCertificate(user, request);
                break;
              default:
                throw new Error(`Invalid document type for Payroll & Financial Documents: ${request.documentType}`);
            }
            break;
  
          case 'HR & Administrative Requests':
            switch(request.documentType) {
              case 'Reference Letter':
                docData = await generateReferenceLetter(user, request);
                break;
              case 'Resignation Request':
                docData = await generateResignationDocument(user, request);
                break;
              case 'ID Badge Replacement':
                docData = await generateIDBadgeDocument(user, request);
                break;
              default:
                throw new Error(`Invalid document type for HR & Administrative Requests: ${request.documentType}`);
            }
            break;
  
          default:
            throw new Error(`Document generation not supported for request type: ${request.requestType}`);
        }
  
        if (docData) {
          const document = new Document({
            ...docData,
            type: request.documentType,
            generatedFor: request._id,
            generatedBy: req.user.id,
            accessRoles: ['employee', 'hr', 'manager']
          });
          await document.save();
          request.document = document._id;
        }
      }

    }
    
    


    


    const updatedRequest = await Request.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    // Notification logic
    if (user) {
      await sendUserNotification(
        user.email,
        request.firstName,
        request.lastName,
        request.requestType,
        request.documentType,
        status
      );
    }

    res.status(200).json({ 
      message: "Request updated successfully", 
      data: updatedRequest 
    });

  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Helper function for time-off requests
async function handleTimeOffRequest(request, status, session) {
  const user = await User.findById(request.user).session(session);
  
  if (status === 'Accepted' && request.status !== 'Accepted') {
    if (user.timeOffBalance < request.numberOfDays) {
      throw new Error('Insufficient time off balance');
    }
    user.timeOffBalance -= request.numberOfDays;
    await user.save({ session });
  }
  
  if (status === 'Declined' && request.status === 'Accepted') {
    user.timeOffBalance += request.numberOfDays;
    await user.save({ session });
  }
}

// Helper function for employment documents
async function handleEmploymentDocument(request, generatorId, session) {
  const user = await User.findById(request.user).session(session);
  
  // Validate professional info
  if (!user.professionalInfo?.position || !user.professionalInfo?.department) {
    throw new Error('Missing professional information for document generation update your account ');
  }

  // Generate PDF document
  const docData = await generateEmploymentCertificate(user, request);
  
  // Create document record
  const document = new Document({
    ...docData,
    generatedFor: request._id,
    generatedBy: generatorId,
    accessRoles: ['employee', 'hr']
  });

  await document.save({ session });
  
  // Link document to request
  request.document = document._id;
  await request.save({ session });
}

exports.deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Restore time-off balance if deleting accepted request
    if (request.requestType === 'Leave & Time-Off Requests' && request.status === 'Accepted') {
      const user = await User.findById(request.user);
      user.timeOffBalance += request.numberOfDays;
      await user.save();
    }

    await Request.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Request deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Email functions remain the same
async function sendAdminNotification(emails, firstName, lastName, requestType, documentType) {
  // ... existing implementation ...
}

async function sendUserNotification(email, firstName, lastName, requestType, documentType, status) {
  // ... existing implementation ...
}