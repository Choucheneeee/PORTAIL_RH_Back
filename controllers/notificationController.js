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


exports.createNotificationAdmin = async (req, res) => {
  console.log("I will send notification to admin");
  try {
    const { message, userId } = req.body;

    // Validate request data
    if (!userId || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    console.log("req", req.body);
    console.log(`Notification from ${userId}: ${message}`);

    // Create a new notification
    const notification = new Notification({
      user: userId,
      message: message
    });

    await notification.save();

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });

    // Emit the notification to each admin user (using socketId)
    adminUsers.forEach(admin => {
      // You should make sure that the socketId for each admin is correctly saved
      if (admin.socketId) {
        console.log("Sending notification to admin", admin._id);
        // Emit the notification to the admin socket using the socketId
        req.io.to(admin.socketId).emit('newNotification', message);
      } else {
        console.log(`Admin ${admin._id} is not connected (no socketId)`);
      }
    });

    return res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error("Error creating notification:", err);
    return res.status(500).json({ success: false, message: 'Error creating notification' });
  }
};



exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = (await Notification.find({ user: userId}).sort({ createdAt: -1 }))
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

    const notifications = await Notification.updateMany({ user: userId, read: false }, { read: true });

    return res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error marking notifications as read' });
  }
};
