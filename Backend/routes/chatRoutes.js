const express = require('express');
const router = express.Router();
const { getMessagesForAppointment, markAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/:appointmentId', protect, getMessagesForAppointment);
router.put('/:appointmentId/read', protect, markAsRead);

module.exports = router;
