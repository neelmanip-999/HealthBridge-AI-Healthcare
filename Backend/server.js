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
        methods: ["GET", "POST", "PUT"],
    }
});
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log('MongoDB Connection Error:', err));

const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const chatRoutes = require('./routes/chat');

app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/chat', chatRoutes);

const userSocketMap = {}; // { userId: socketId }

io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    }

    socket.on('disconnect', () => {
        const disconnectedUserId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
        if (disconnectedUserId) {
            delete userSocketMap[disconnectedUserId];
            console.log(`User disconnected: ${disconnectedUserId}`);
        }
    });

    // --- THIS IS THE NEW LISTENER THAT NOTIFIES THE DOCTOR ---
    socket.on('startConsultation', (data) => {
        // data: { doctorId, patient: { _id, name } }
        const doctorSocketId = userSocketMap[data.doctorId];

        if (doctorSocketId) {
            console.log(`Notifying Doctor ${data.doctorId} of new chat from Patient ${data.patient._id}`);
            
            // This event is what DoctorDashboard.jsx is waiting for.
            io.to(doctorSocketId).emit('consultationStarted', {
                partner: data.patient, // The patient is the doctor's chat partner
                sessionId: `${data.patient._id}-${data.doctorId}` // A unique ID for this chat session
            });
        } else {
            console.log(`Doctor ${data.doctorId} is not online. Cannot start consultation.`);
            // Optional: You could emit an event back to the patient here.
            // socket.emit('doctorOffline', { message: 'The doctor is currently offline.' });
        }
    });

    socket.on('sendMessage', async (data) => {
        try {
            const newMessage = new Chat({
                senderId: data.senderId,
                receiverId: data.receiverId,
                senderRole: data.senderRole,
                message: data.message,
            });

            const savedMessage = await newMessage.save();
            console.log('Message saved to DB:', savedMessage);

            const receiverSocketId = userSocketMap[data.receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receiveMessage', savedMessage);
            }
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

