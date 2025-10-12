const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deactivateUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.put('/:id/deactivate', protect, deactivateUser);

module.exports = router;
