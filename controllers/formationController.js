const Formation = require("../models/formation.model");
const nodemailer = require("nodemailer");
const User = require("../models/User.model");
const Notification = require('../models/notifications.model');


exports.createformation=async(req,res)=>{
    try{
        const {title,type,date_Debut,date_Fin,description,organisme,cout}=req.body
        const userId = req.user.id;
        console.log("body",req.body)
        if(!title || !type) return res.status(400).json({ error: "Formation type and titre are required." });
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
          }
          const formationData = {
            user: userId,
            type:type,
            titre:title,
            date_Debut:date_Debut,
            date_Fin:date_Fin,
            description:description,
            status: 'Pending',
            organisme: organisme,
            cout:cout
          };
        const newFormation = new Formation(formationData);
        await newFormation.save();

        const rhs = await User.find({ role: "rh" });
              if (rhs.length > 0) {
                const rhsEmails = rhs.map(rh => rh.email);
          
                await sendNotification(
                  rhsEmails,
                  user.firstName,
                  user.lastName,
                  userId, 
                  type,
                  user.email)
                    }
          
              res.status(201).json({ message: "Request submitted successfully", data: newFormation });
    }
    catch(error){
        res.status(500).json({ message: "Server error", error: error.message });

        }
}

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
    
    const message = `📥 Nouvelle  Formation ${type} de ${firstName} ${lastName}
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
