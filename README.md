# Doctor-Patient Chat Application

A real-time chat web application built with Socket.IO, Node.js, Express, MongoDB, and React. This application allows doctors and patients to communicate with each other in real-time.

## Features

### 🔐 Authentication
- JWT-based login and signup for both doctors and patients
- Secure password hashing with bcryptjs
- Role-based access control

### 💬 Real-time Messaging
- Real-time messaging using Socket.IO
- Message persistence in MongoDB
- Typing indicators
- Online/offline status
- Message timestamps and read receipts

### 👨‍⚕️ Doctor Features
- View list of assigned patients
- Real-time chat interface
- Availability status toggle
- Specialization management

### 👤 Patient Features
- View list of available doctors
- Real-time chat interface
- Easy doctor selection

### 🎨 Modern UI
- Built with React and TailwindCSS
- Responsive design
- Real-time status indicators
- Smooth animations and transitions

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **TailwindCSS** - Styling
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication

## Project Structure

```
doctor-patient-chat/
├── backend/
│   ├── models/
│   │   ├── Doctor.js
│   │   ├── Patient.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── message.js
│   ├── middleware/
│   │   └── auth.js
│   ├── socketManager.js
│   ├── server.js
│   ├── package.json
│   └── config.env
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── chat/
│   │   │   └── common/
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── utils/
│   │   │   └── socket.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd doctor-patient-chat/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the config.env file and update the values
cp config.env .env
```

Update the `.env` file with your MongoDB connection string and JWT secret:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/doctor-patient-chat
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
```

The backend will be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd doctor-patient-chat/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be running on `http://localhost:3000`

## Usage

### For Doctors
1. Register/Login as a Doctor
2. Set your specialization during registration
3. View your patient list in the dashboard
4. Start conversations with patients
5. Toggle your availability status

### For Patients
1. Register/Login as a Patient
2. Enter your age during registration
3. View available doctors in the dashboard
4. Start conversations with doctors

### Chat Features
- Real-time messaging
- Typing indicators
- Online/offline status
- Message timestamps
- Read receipts
- Responsive design

## API Endpoints

### Authentication
- `POST /api/auth/doctor/signup` - Doctor registration
- `POST /api/auth/patient/signup` - Patient registration
- `POST /api/auth/doctor/login` - Doctor login
- `POST /api/auth/patient/login` - Patient login
- `GET /api/auth/me` - Get current user

### Messages
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversation/:userId` - Get messages with specific user
- `PUT /api/messages/mark-read/:userId` - Mark messages as read

### Socket.IO Events

#### Client to Server
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `join_conversation` - Join conversation room
- `leave_conversation` - Leave conversation room

#### Server to Client
- `new_message` - New message received
- `user_typing` - User typing indicator
- `user_online` - User came online
- `user_offline` - User went offline
- `message_sent` - Message sent confirmation

## Database Schema

### Doctor Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  specialization: String,
  available: Boolean,
  socketId: String,
  createdAt: Date
}
```

### Patient Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  age: Number,
  socketId: String,
  createdAt: Date
}
```

### Message Schema
```javascript
{
  senderId: ObjectId,
  senderType: String (Doctor/Patient),
  receiverId: ObjectId,
  receiverType: String (Doctor/Patient),
  message: String,
  timestamp: Date,
  read: Boolean
}
```

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation with express-validator
- CORS configuration
- Environment variable protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please create an issue in the repository.

## Future Enhancements

- [ ] File/image sharing
- [ ] Video/audio calls
- [ ] Message search functionality
- [ ] Push notifications
- [ ] Message encryption
- [ ] Admin dashboard
- [ ] Appointment scheduling
- [ ] Medical history sharing

