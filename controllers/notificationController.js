const notification = require('../models/notifications.model');
const User = require("../models/User.model");

exports.createNotification = async (req, res) => {
    console.log("sent notification")
   try {
    const sender = req.user;
    const { message, recipientId } = req.body;

    if (sender.role === 'admin') {
      if (!recipientId) {
        return res.status(400).json({ message: 'Recipient ID is required' });
      }

      const recipient = await User.findById(recipientId);
      if (!recipient || recipient.role !== 'collaborateur') {
        return res.status(400).json({ message: 'Invalid collaborator ID' });
      }
      const notifications = new notification({
        sender: sender.id,
        recipient: recipientId,
        message
      });

      console.log("notification",notifications)
      await notifications.save();
      return res.status(201).json(notification);
    }
    else if (sender.role === 'collaborateur') {
        console.log("colaaborateur notification to all admins")

        const admins = await User.find({ role: 'admin' });

      if (admins.length === 0) {
        return res.status(404).json({ message: 'No admins found' });
      }
      console.log("admin",admins)
      console.log("sender id",sender.id)
      const notifications = admins.map(admin => ({
        sender: sender.id,
        recipient: admin._id,
        message
      }));
      console.log("notificationssss",notifications)

      await notification.insertMany(notifications);
      return res.status(201).json({ message: 'Notification sent to all admins' });
    }

    return res.status(403).json({ message: 'Unauthorized role' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
    
exports.getNotifications =async (req,res)=>{
  try {
    const userId=req.params.userId
    const notifications = await notification.find({ recipient: userId }).sort({ createdAt: -1 });
    if (!notifications) {
      return res.status(404).json({ message: 'No notifications found' });
    }
    return res.status(200).json(notifications);
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
} 