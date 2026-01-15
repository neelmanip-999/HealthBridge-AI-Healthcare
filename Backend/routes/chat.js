const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- 1. CONFIGURE FILE STORAGE (Multer) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        // Create folder if it doesn't exist
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename: "file-fieldname-timestamp.extension"
        // e.g. "image-123456789.png"
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init Upload Middleware
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5000000 }, // Limit: 5MB
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('file'); // 'file' is the key name for the POST request

// Check File Type (Images & PDFs only)
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Only Images and PDFs allowed!');
    }
}

// --- 2. UPLOAD ROUTE (NEW) ---
// @route   POST /api/chat/upload
// @desc    Upload an attachment image/pdf
router.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err });
        } else {
            if (req.file == undefined) {
                return res.status(400).json({ message: 'No file selected!' });
            } else {
                // Success! Return the URL path
                // Note: You must enable static folder serving in server.js for this to work
                res.json({
                    filePath: `/uploads/${req.file.filename}`,
                    fileName: req.file.originalname,
                    fileType: req.file.mimetype.startsWith('image') ? 'image' : 'pdf'
                });
            }
        }
    });
});

// --- 3. EXISTING CHAT HISTORY ROUTE ---
// @route   GET /api/chat/history/:user1Id/:user2Id
// @desc    Get chat history between two users
router.get('/history/:user1Id/:user2Id', async (req, res) => {
    try {
        const { user1Id, user2Id } = req.params;

        // Fetch messages where sender/receiver match either combination
        const messages = await Chat.find({
            $or: [
                { senderId: user1Id, receiverId: user2Id },
                { senderId: user2Id, receiverId: user1Id }
            ]
        }).sort({ timestamp: 1 }); // Oldest first

        res.json(messages);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ message: "Server Error fetching chat history" });
    }
});

module.exports = router;