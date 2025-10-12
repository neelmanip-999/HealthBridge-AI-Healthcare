const express = require('express');
const Message = require('../models/Message');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

const router = express.Router();

// Get messages between current user and another user
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const currentUserType = req.userType;

    // Determine the other user's type
    let otherUserType = 'Doctor';
    if (currentUserType === 'Doctor') {
      otherUserType = 'Patient';
    }

    const messages = await Message.find({
      $or: [
        {
          senderId: currentUserId,
          senderType: currentUserType,
          receiverId: userId,
          receiverType: otherUserType
        },
        {
          senderId: userId,
          senderType: otherUserType,
          receiverId: currentUserId,
          receiverType: currentUserType
        }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUserType = req.userType;

    // Get all unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: currentUserId, senderType: currentUserType },
            { receiverId: currentUserId, receiverType: currentUserType }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', currentUserId] },
              { userId: '$receiverId', userType: '$receiverType' },
              { userId: '$senderId', userType: '$senderType' }
            ]
          },
          lastMessage: { $last: '$message' },
          lastTimestamp: { $last: '$timestamp' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', currentUserId] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastTimestamp: -1 }
      }
    ]);

    // Populate user details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const UserModel = conv._id.userType === 'Doctor' ? Doctor : Patient;
        const user = await UserModel.findById(conv._id.userId).select('name email socketId');
        
        return {
          userId: conv._id.userId,
          userType: conv._id.userType,
          name: user.name,
          email: user.email,
          isOnline: !!user.socketId,
          lastMessage: conv.lastMessage,
          lastTimestamp: conv.lastTimestamp,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json(populatedConversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark messages as read
router.put('/mark-read/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const currentUserType = req.userType;

    let otherUserType = 'Doctor';
    if (currentUserType === 'Doctor') {
      otherUserType = 'Patient';
    }

    await Message.updateMany(
      {
        senderId: userId,
        senderType: otherUserType,
        receiverId: currentUserId,
        receiverType: currentUserType,
        read: false
      },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

