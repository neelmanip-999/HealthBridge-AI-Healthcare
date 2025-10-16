// HealthBridge/backend/routes/chat.js

const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
// Optional: If you have authentication middleware, you can import it here
// const auth = require('../middleware/auth'); 

/**
 * @route   GET /api/chat/history/:user1Id/:user2Id
 * @desc    Get the chat history between two specific users
 * @access  Private (should be protected by auth middleware)
 */
router.get('/history/:user1Id/:user2Id', /* auth, */ async (req, res) => {
    try {
        const { user1Id, user2Id } = req.params;

        // Find all messages where the sender and receiver IDs match the pair
        const messages = await Chat.find({
            $or: [
                { senderId: user1Id, receiverId: user2Id },
                { senderId: user2Id, receiverId: user1Id }
            ]
        }).sort({ timestamp: 'asc' }); // Sort messages by the oldest first

        res.json(messages);

    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).send("Server Error");
    }
});

module.exports = router;