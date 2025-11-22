const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const Chat = require('./models/Chat');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Your React app's URL
        methods: ["GET", "POST", "PUT", "DELETE"], // Added DELETE for completeness
    }
});
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// --- Route Imports ---
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const chatRoutes = require('./routes/chat');
const aiAssistantRoutes = require('./routes/aiAssistant');
const appointmentRoutes = require('./routes/appointment'); 

// --- API Endpoints ---
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiAssistantRoutes);
app.use('/api/appointments', appointmentRoutes); 

const userSocketMap = {}; // { userId: socketId }

io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    }

    // --- ROOM LOGIC ---
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        const disconnectedUserId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
        if (disconnectedUserId) {
            delete userSocketMap[disconnectedUserId];
            console.log(`User disconnected: ${disconnectedUserId}`);
        }
    });

    // --- APPOINTMENT NOTIFICATIONS ---
    socket.on('new_appointment_booked', (data) => {
        const doctorSocketId = userSocketMap[data.doctorId];
        if (doctorSocketId) {
            io.to(doctorSocketId).emit('appointment_notification', {
                message: `New Appointment Request from ${data.patientName}`,
                appointmentId: data.appointmentId
            });
        }
    });

    // --- CONSULTATION EVENTS ---
    socket.on('startConsultation', (data) => {
        const doctorSocketId = userSocketMap[data.doctorId];
        if (doctorSocketId) {
            console.log(`Notifying Doctor ${data.doctorId} of new chat from Patient ${data.patient._id}`);
            io.to(doctorSocketId).emit('consultationStarted', {
                partner: data.patient,
                sessionId: `${data.patient._id}-${data.doctorId}`
            });
        } else {
            console.log(`Doctor ${data.doctorId} is not online. Cannot start consultation.`);
        }
    });

    // --- CHAT MESSAGING LOGIC ---
    socket.on('sendMessage', async (data) => {
        try {
            // Create new message object
            // We let MongoDB handle the _id
            const newMessage = new Chat({
                senderId: data.senderId,
                receiverId: data.receiverId,
                senderRole: data.senderRole,
                message: data.message,
                timestamp: data.timestamp || Date.now() // Use client time or server time
            });

            // Save to Database (Persistence)
            const savedMessage = await newMessage.save();
            console.log('Message saved to DB:', savedMessage._id);

            // Emit to Receiver (if online)
            const receiverSocketId = userSocketMap[data.receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receiveMessage', savedMessage);
            }
            
            // Emit back to Sender (Confirmation/Echo)
            // This is crucial because we removed the optimistic update in the frontend
            socket.emit('receiveMessage', savedMessage);

        } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('messageError', { message: 'Failed to send message.' });
        }
    });

    socket.on('endConsultation', (data) => {
        const partnerSocketId = userSocketMap[data.partnerId];
        if (partnerSocketId) {
            io.to(partnerSocketId).emit('consultationEnded', { sessionId: data.sessionId });
        }
    });
});

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));