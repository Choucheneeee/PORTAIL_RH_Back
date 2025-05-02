const Request = require("../models/requests.model");
const Document = require("../models/documents.model");
const nodemailer = require("nodemailer");
const User = require("../models/User.model");
const { generateEmploymentCertificate,generateJobDescriptionCertificate,generateWorkTransferRequest,generatePayslipRequest,generateSalaryCertificate,generateTaxCertificate } = require("../utils/pdfGenerator");


const Notification = require('../models/notifications.model');
const io = require('../server').io;

exports.createcertif=async(req,res)=>{

}
exports.createattestation=async(req,res)=>{
  
}
exports.createfiche = async (req, res) => {
  try {
    console.log("dataa",req.body)
    const { documentType, periodType, month,year,description} = req.body;
    const userId = req.user.id;
    if (!documentType || !periodType) {
      return res.status(400).json({ error: "Request type and document periode are required." });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const requestData = {
      user: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      type:documentType,
      periode:periodType,
      mois:month,
      annee:year,
      status: 'Pending',
      requestDetails: description
    };

   
    
    const newRequest = new Request(requestData);
    await newRequest.save();

    const rhs = await User.find({ role: "rh" });
    if (rhs.length > 0) {
      const rhsEmails = rhs.map(rh => rh.email);
      await sendNotification(rhsEmails, user.firstName, user.lastName,userId, documentType,user.email);
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
async function sendNotification(emails, firstName, lastName,id, type,email) {
  try {
    

    const users = await User.find({ email: { $in: emails } });
    
    if (users.length === 0) {
      console.log('No users found for notification');
      return;
    }
    
    const message = `New Request ${type} has been added:
    🗓 ${new Date().toDateString()}
    👤 ${firstName} ${lastName} (${email})
      `;

    const notifications = users.map(user => ({
      sender: id,
      recipient: user._id,
      message: message
    }));

    await Notification.insertMany(notifications);

    users.forEach(user => {
      const userRoom = `user_${user._id}`;
      io.to(userRoom).emit('notif', {
        type: 'new_request_added',
        message: message,
        timestamp: new Date().toISOString()
      });
    });

    console.log(`Notifications sent to ${users.length} users for new ${role} approval`);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}
