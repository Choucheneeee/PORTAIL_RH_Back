const Request = require("../models/requests.model");
const nodemailer = require("nodemailer");
const User = require("../models/User.model");

exports.addRequest = async (req, res) => {
  try {
    const { user, firstName, lastName, requestType, documentType, requestDetails, startDate, endDate } = req.body;

    // Validate required fields
    if (!user || !requestType || !documentType) {
      return res.status(400).json({ error: "User, type, and documentType are required." });
    }

    // Validate document type based on request type
    const validDocumentTypes = {
      "Employment & Work Documents": ["Employment Certificate", "Job Description", "Work Transfer Request"],
      "Payroll & Financial Documents": ["Payslip", "Salary Certificate", "Tax Certificate"],
      "Leave & Time-Off Requests": ["Paid Leave Request", "Sick Leave Request", "Maternity/Paternity Leave"],
      "HR & Administrative Requests": ["Reference Letter", "Resignation Request", "ID Badge Replacement"]
    };

    if (!validDocumentTypes[requestType]?.includes(documentType)) {
      return res.status(400).json({ error: `"${documentType}" is not a valid document type for "${requestType}".` });
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

    // Fetch all admin emails
    const admins = await User.find({ role: "admin" });
    const adminEmails = admins.map(admin => admin.email);

    if (adminEmails.length > 0) {
      await sendAdminNotification(adminEmails, firstName, lastName, requestType, documentType);
    }

    res.status(201).json({ message: "Request submitted successfully", data: newRequest });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function sendAdminNotification(emails, firstName, lastName, requestType, documentType) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emails.join(","), // Send to multiple admins
    subject: "New Request Submitted",
    text: `Hello Admin,

A new request has been submitted by ${firstName} ${lastName}.

Request Type: ${requestType}
Document Type: ${documentType}

Please review the request at your earliest convenience.

Best regards,
Your System`,
  };

  await transporter.sendMail(mailOptions);
}

exports.updatedRequest = async (req, res) => {
  const { id } = req.params; 
  const { status } = req.body;

  try {
    const request = await Request.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Fetch user email to notify them about the update
    const user = await User.findById(request.user);
    if (user) {
      await sendUserNotification(user.email, request.firstName, request.lastName, request.requestType, request.documentType, status);
    }

    res.status(200).json({ message: "Request updated successfully", data: request });

  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

async function sendUserNotification(email, firstName, lastName, requestType, documentType, status) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Request Status Updated",
    text: `Hello ${firstName} ${lastName},

Your request has been updated.

Request Type: ${requestType}
Document Type: ${documentType}
New Status: ${status}

Please check your account for more details.

Best regards,
Your System`,
  };

  await transporter.sendMail(mailOptions);
}

exports.getAllRequest = async (req, res) => {
  try {
    const requests = await Request.find();
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRequest = async (req, res) => {
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
};
