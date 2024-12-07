const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
    },
    ip: {
        type: String,
        required: true,
    },
    user: {
        type: Object,
        default: {},
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    additionalData: {
        type: Object,
        default: {},
    },
});

const Activity = mongoose.model("Activity", activitySchema);
module.exports = Activity;
