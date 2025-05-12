const Demande = require("../models/document.model");
const nodemailer = require("nodemailer");
const User = require("../models/User.model");
const { generateFichePaiMensuel,generateFichePaiAnnuel } = require("../utils/pdfGenerator");

const Notification = require('../models/notifications.model');

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
      status: 'En attente',
      requestDetails: description
    };

   
    
    const newRequest = new Demande(requestData);
    await newRequest.save();

    const rhs = await User.find({ role: "rh" });
    if (rhs.length > 0) {
      const rhsEmails = rhs.map(rh => rh.email);

      await sendNotification(
        rhsEmails,
        user.firstName,
        user.lastName,
        userId, 
        documentType,
        user.email)
          }

    res.status(201).json({ message: "Request submitted successfully", data: newRequest });

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

    const request = await Demande.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    const user = await User.findById(request.user);
      console.log("request",request)
      if (status === 'Approuvé') {

        switch(request.type=='fiche_paie') {
          case (request.periode=="mensuel"):
            docData = await generateFichePaiMensuel(user, request);
            break;
            case (request.periode=="annuel"):
              docData = await generateFichePaiAnnuel(user, request,request.annee);
              break;
          default:
        throw new Error(`Document generation not supported for request periode : ${request.type} ${request.periode}`);

        }

      }

    
    const updatedRequest = await Demande.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    // Notification logic
    if (user) {
      await sendNotificationUpdateDemande(
        user.email,
        request.type,
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

async function sendNotificationUpdateDemande(emails, type,status) { // Added 'io' as parameter
  try {
    console.log("emails",emails)
    const io = require('../server').io;

    console.log("io",io)

    const users = await User.find({ email: { $in: emails } });
    if (users.length === 0) {
      console.log('No users found for notification');
      return;
    } 
    console.log("users",users)
    console.log("emails",emails)
    
    const message = `📥 Votre demande ${type} a ete modifier ${status}
🗓 ${new Date().toLocaleDateString('fr-FR', { 
  day: '2-digit', 
  month: 'short', 
  year: 'numeric' 
})} ⏰ ${new Date().toLocaleTimeString('fr-FR', { 
  hour: '2-digit', 
  minute: '2-digit' 
})}
📧 ${emails}}`;

    const notifications = users.map(user => ({
      sender: id,
      recipient: user._id,
      message: message
    }));

    await Notification.insertMany(notifications);

    users.forEach(user => {
      const userRoom = `user_${user._id}`;
      console.log("userRoom", userRoom);
      io.to(userRoom).emit('notif', { 
        type: 'new_request',
        message: message,
        timestamp: new Date().toISOString()
      });
    });

    console.log(`Notifications sent to ${users.length} users for new ${type} approval`); // Fixed 'role' to 'type'
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
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
async function sendNotification(emails, firstName, lastName, id, type, email) { // Added 'io' as parameter
  try {
    console.log("emails",emails)
    const io = require('../server').io;

    console.log("io",io)

    const users = await User.find({ email: { $in: emails } });
    console.log("users",users)
    if (users.length === 0) {
      console.log('No users found for notification');
      return;
    }
    
    const message = `📥 Nouvelle demande ${type} de ${firstName} ${lastName}
🗓 ${new Date().toLocaleDateString('fr-FR', { 
  day: '2-digit', 
  month: 'short', 
  year: 'numeric' 
})} ⏰ ${new Date().toLocaleTimeString('fr-FR', { 
  hour: '2-digit', 
  minute: '2-digit' 
})}
📧 ${email} | 🆔 ${id.slice(-6)}`;

    const notifications = users.map(user => ({
      sender: id,
      recipient: user._id,
      message: message
    }));

    await Notification.insertMany(notifications);

    users.forEach(user => {
      const userRoom = `user_${user._id}`;
      console.log("userRoom", userRoom);
      io.to(userRoom).emit('notif', { 
        type: 'new_request',
        message: message,
        timestamp: new Date().toISOString()
      });
    });

    console.log(`Notifications sent to ${users.length} users for new ${type} approval`); // Fixed 'role' to 'type'
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}


