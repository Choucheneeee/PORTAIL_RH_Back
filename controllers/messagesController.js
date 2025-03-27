const Message = require('../models/messagesModel');
const User = require('../models/User.model'); // Assuming you have a User model

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text,senderId,timestamp} = req.body;

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content:text,
      timestamp: timestamp,
    });

    await message.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get messages between two users
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('sender', 'username avatar') // Adjust fields as needed
    .populate('receiver', 'username avatar');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a message (soft delete or hard delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findOne({ _id: messageId, sender: currentUserId });
    if (!message) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    await message.remove();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};