const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const Chat = require('./models/Chat'); 
const path = require('path'); 

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // React Frontend URL
        methods: ["GET", "POST", "PUT", "DELETE"],
    }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve Uploads Folder Statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// --- Route Imports ---
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const chatRoutes = require('./routes/chat');
const appointmentRoutes = require('./routes/appointment');
const pharmacyRoutes = require('./routes/pharmacy');
const hospitalRoutes = require('./routes/hospital');
const hospitalAuthRoutes = require('./routes/hospitalAuth');

// --- FIXED IMPORTS ---
// 1. Report Analysis Route
const reportAnalysisRoutes = require('./routes/reportAnalysis'); 

// 2. FIXED: Pointing to your existing 'aiAssistant.js' file
const aiRoutes = require('./routes/aiAssistant'); 

// --- API Endpoints ---
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/hospital-auth', hospitalAuthRoutes);

// --- FIXED ENDPOINTS ---
app.use('/api/reports', reportAnalysisRoutes); 
app.use('/api/ai', aiRoutes);                  

// --- SOCKET.IO LOGIC ---
const userSocketMap = {}; // { userId: socketId }

io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    
    if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
        socket.join(userId); 
    }

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on('join_user_room', (id) => {
        socket.join(id);
    });

    socket.on('disconnect', () => {
        const disconnectedUserId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
        if (disconnectedUserId) {
            delete userSocketMap[disconnectedUserId];
            console.log(`User disconnected: ${disconnectedUserId}`);
        }
    });

    // 1. APPOINTMENT NOTIFICATIONS
    socket.on('new_appointment_booked', (data) => {
        io.to(data.doctorId).emit('appointment_notification', {
             message: `New Appointment Request from ${data.patientName}`,
             appointmentId: data.appointmentId
        });
    });

    // 2. LIVE SESSION ALERTS
    socket.on('start_session', (data) => {
        const { patientId, doctorId, doctorName } = data;
        io.to(patientId).emit('session_request', {
            doctorId: doctorId,
            doctorName: doctorName,
            sessionId: `${patientId}-${doctorId}`
        });
    });

    // 3. PHARMACY ORDER UPDATES
    socket.on('pharmacy_order_update', (data) => {
        const { patientId, status, medicineName } = data;
        io.to(patientId).emit('receive_order_update', {
            status: status,
            medicineName: medicineName,
            message: `Your order for ${medicineName} is now ${status}!`
        });
    });

    // 4. CHAT MESSAGING LOGIC
    socket.on('sendMessage', async (data) => {
        try {
            const newMessage = new Chat({
                senderId: data.senderId,
                receiverId: data.receiverId,
                senderRole: data.senderRole,
                message: data.message || '', 
                attachmentUrl: data.attachmentUrl || null, 
                attachmentType: data.attachmentType || 'none', 
                timestamp: data.timestamp || Date.now() 
            });

            const savedMessage = await newMessage.save();
            const roomId = data.roomId; 
            
            if (roomId) {
                io.to(roomId).emit('receiveMessage', savedMessage);
            } else {
                socket.emit('receiveMessage', savedMessage); 
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