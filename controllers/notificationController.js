// Notifications logic


const Notification = require('../models/notifications.model');
const User = require('../models/User.model'); // Assuming you have a User model


// Create a notification for a user
exports.createNotification = async (req, res) => {
    try {
        const { message, userId, senderRole } = req.body;
        console.log(`Sending notification to admins from user ${userId}: ${message}`);

        // Create a new notification
        const notification = new Notification({
            user: userId,
            message: message
        });

        await notification.save();

        // Send notification only to admins if the sender is a user
        if (senderRole === 'user') {
            req.app.get('io').emit('newNotification', { userId, message, senderRole });
        } else {
            // If the sender is an admin, send it only to users
            req.app.get('io').emit('newNotification', { userId, message, senderRole: 'admin' });
        }

        return res.status(201).json({ success: true, notification });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error creating notification' });
    }
};

// Create a notification for an admin (This would notify only users)
// Create a notification for an admin (this would notify only users)
exports.createNotificationAdmin = async (req, res) => {
  try {
      const { message, userId } = req.body;

      if (!userId || !message) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      console.log(`Notification from admin ${userId}: ${message}`);

      const notification = new Notification({
          user: userId,
          message: message
      });

      await notification.save();

      // Send the notification to all users (excluding admins)
      req.app.get('io').emit('newNotification', { userId, message, senderRole: 'admin' });

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
