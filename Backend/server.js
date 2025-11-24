const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const Chat = require('./models/Chat'); // Ensure this path is correct

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Your React app's URL
        methods: ["GET", "POST", "PUT", "DELETE"],
    }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// --- Route Imports ---
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const chatRoutes = require('./routes/chat');
const aiAssistantRoutes = require('./routes/aiAssistant');
const appointmentRoutes = require('./routes/appointment');
const reportAnalysisRoutes = require('./routes/reportAnalysis');
const pharmacyRoutes = require('./routes/pharmacy');

// --- API Endpoints ---
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiAssistantRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reports', reportAnalysisRoutes);
app.use('/api/pharmacy', pharmacyRoutes);

const userSocketMap = {}; // { userId: socketId }

io.on('connection', (socket) => {
    // NOTE: This part is crucial for mapping user IDs to socket IDs
    // Ensure your frontend passes { auth: { userId: '...' } }
    const userId = socket.handshake.auth.userId;
    
    if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    }

    // --- ROOM LOGIC ---
    // The client calls this when they open a chat window
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
            const newMessage = new Chat({
                senderId: data.senderId,
                receiverId: data.receiverId,
                senderRole: data.senderRole,
                message: data.message,
                timestamp: data.timestamp || Date.now() 
            });

            // Save to Database (Persistence)
            const savedMessage = await newMessage.save();
            console.log('Message saved to DB:', savedMessage._id);

            // Use the roomId passed from the client
            const roomId = data.roomId; 
            
            if (roomId) {
                // Emit to ALL sockets in the specified room (sender AND receiver)
                io.to(roomId).emit('receiveMessage', savedMessage);
            } else {
                console.warn(`Message ${savedMessage._id} sent without a room ID. Using fallback.`);
                // Fallback (for older clients or error)
                socket.emit('receiveMessage', savedMessage); // Echo to sender
                const receiverSocketId = userSocketMap[data.receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receiveMessage', savedMessage);
                }
            }

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