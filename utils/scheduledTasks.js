const cron = require('node-cron');
const User = require('../models/User.model');

// Function to delete unverified users older than 24 hours
const deleteUnverifiedUsers = async () => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const result = await User.deleteMany({
            isVerified: false,
            createdAt: { $lt: twentyFourHoursAgo }
        });

    } catch (error) {
        console.error('Error in deleteUnverifiedUsers task:', error);
    }
};

const startScheduledTasks = () => {
    cron.schedule('0 * * * *', () => {
        deleteUnverifiedUsers();
    });

    deleteUnverifiedUsers();
};

module.exports = startScheduledTasks; 