const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

// --- 1. App Setup ---
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:5173", // Replace with your React app's URL
    methods: ["GET", "POST", "PUT"],
  }
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Body parser

// --- 2. Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// --- 3. Routes ---
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const pharmacyRoutes = require('./routes/pharmacy');
const aiAssistantRoutes = require('./routes/aiAssistant');
const mapsRoutes = require('./routes/maps');

app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/maps', mapsRoutes);

// --- 4. Socket.io Logic ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Example: Handle doctor going online/offline
  socket.on('goOnline', (doctorId) => {
    // 1. Update DB (Doctor.findByIdAndUpdate({ status: 'online' }))
    // 2. Map doctorId to socket.id (for direct messaging)
    socket.join(doctorId); // Join a room specific to the doctor
    console.log(`Doctor ${doctorId} is now online.`);
    
    // Broadcast status change to all patients/clients
    io.emit('doctorStatusUpdate', { id: doctorId, status: 'online' });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Handle doctor going offline logic here
  });

  // --- Chat Logic ---
  socket.on('sendMessage', (data) => {
    // data: { senderId, receiverId, message, timestamp }
    // 1. Save message to Chat MongoDB collection
    // 2. Send message to the specific receiver
    io.to(data.receiverId).emit('receiveMessage', data);
    console.log(`Message from ${data.senderId} to ${data.receiverId}: ${data.message}`);
  });
});

// --- 5. Start Server ---
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));