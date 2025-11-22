const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');

// @route   GET /api/chat/history/:user1Id/:user2Id
// @desc    Get chat history between two users
// @access  Public (or add auth middleware if needed)
router.get('/history/:user1Id/:user2Id', async (req, res) => {
    try {
        const { user1Id, user2Id } = req.params;

        // Fetch messages where sender/receiver match either combination
        const messages = await Chat.find({
            $or: [
                { senderId: user1Id, receiverId: user2Id },
                { senderId: user2Id, receiverId: user1Id }
            ]
        }).sort({ timestamp: 1 }); // 1 for Ascending (Oldest first), -1 for Newest first

        res.json(messages);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ message: "Server Error fetching chat history" });
    }
});

module.exports = router;