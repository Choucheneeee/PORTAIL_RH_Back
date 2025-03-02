// Notifications logic


const Notification = require('../models/notifications.model');
const User = require('../models/User.model'); // Assuming you have a User model

// Create a notification for a user
exports.createNotification = async (req, res) => {
  try {
    const message = req.body.message;
    const userId=req.body.userId
    console.log("req",req.body)
    console.log(`Sending notification to ${userId}: ${message}`);

    
    // Create a new notification
    const notification = new Notification({
      user: userId,
      message: message
    });

    await notification.save();

    // Emit the notification to the user via socket
    req.io.emit('newNotification', { userId, message });


    return res.status(201).json({ success: true, notification });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error creating notification' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ user: userId, read: false }).sort({ createdAt: -1 });
    console.log("notif",notifications)
    return res.status(200).json({ success: true, notifications });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
};

// Mark notifications as read
exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    // Mark notifications as read
    const notifications = await Notification.updateMany({ user: userId, read: false }, { read: true });

    return res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error marking notifications as read' });
  }
};
