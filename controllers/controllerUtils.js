const activityModel = require("../models/activityModel");

// Activity Logger
const logActivity = async (action, ip, user, additionalData) => {
    try {
        const activity = new activityModel({
            action,
            ip,
            user,
            additionalData,
        });
        await activity.save();
    } catch (error) {
        console.error("Failed to log activity:", error.message);
    }
};

module.exports = { logActivity };