# Setup Guide - Doctor-Patient Chat Application

This guide will help you set up and run the Doctor-Patient Chat application on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

### Required Software
1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **MongoDB** (v4.4 or higher)
   - **Option A: Local MongoDB**
     - Download from: https://www.mongodb.com/try/download/community
     - Start MongoDB service
   - **Option B: MongoDB Atlas (Cloud)**
     - Sign up at: https://www.mongodb.com/atlas
     - Create a free cluster

3. **Git** (optional, for cloning the repository)

## Quick Start

### Method 1: Using Startup Scripts (Recommended)

#### For Windows:
```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd doctor-patient-chat

# Run the startup script
start.bat
```

#### For macOS/Linux:
```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd doctor-patient-chat

# Make the script executable
chmod +x start.sh

# Run the startup script
./start.sh
```

### Method 2: Manual Setup

#### Step 1: Backend Setup

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
# Copy the config file
cp config.env .env
```

4. Edit the `.env` file with your MongoDB connection:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/doctor-patient-chat
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NODE_ENV=development
```

**For MongoDB Atlas users:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/doctor-patient-chat?retryWrites=true&w=majority
```

5. Start the backend server:
```bash
npm run dev
```

The backend will be running on `http://localhost:5000`

#### Step 2: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd doctor-patient-chat/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (optional):
```bash
# Copy the example file
cp env.example .env
```

4. Edit the `.env` file:
```env
REACT_APP_SERVER_URL=http://localhost:5000
GENERATE_SOURCEMAP=false
```

5. Start the frontend development server:
```bash
npm start
```

The frontend will be running on `http://localhost:3000`

## Database Setup

### Option A: Local MongoDB

1. **Install MongoDB:**
   - Windows: Download from MongoDB website
   - macOS: `brew install mongodb-community`
   - Ubuntu: `sudo apt-get install mongodb`

2. **Start MongoDB service:**
   - Windows: MongoDB Compass or start service
   - macOS: `brew services start mongodb-community`
   - Ubuntu: `sudo systemctl start mongod`

3. **Verify MongoDB is running:**
```bash
mongosh --version
```

### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (choose the free tier)
4. Create a database user
5. Whitelist your IP address (or use 0.0.0.0/0 for development)
6. Get your connection string and update the `MONGODB_URI` in your `.env` file

## Testing the Application

1. **Open your browser** and go to `http://localhost:3000`

2. **Register as a Doctor:**
   - Click "create a new account"
   - Select "Doctor"
   - Fill in: Name, Email, Specialization, Password
   - Click "Create account"

3. **Register as a Patient:**
   - Open a new incognito/private browser window
   - Go to `http://localhost:3000`
   - Click "create a new account"
   - Select "Patient"
   - Fill in: Name, Email, Age, Password
   - Click "Create account"

4. **Start Chatting:**
   - In the doctor dashboard, you should see the patient in the list
   - Click on the patient to start chatting
   - In the patient dashboard, click on the doctor to start chatting
   - Send messages and see real-time updates!

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to MongoDB"
- **Solution:** Make sure MongoDB is running
- Check your `MONGODB_URI` in the `.env` file
- For Atlas users, check your IP whitelist and credentials

#### 2. "Port already in use"
- **Solution:** Kill the process using the port
- Windows: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`
- macOS/Linux: `lsof -ti:5000 | xargs kill -9`

#### 3. "Module not found" errors
- **Solution:** Delete `node_modules` and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 4. Frontend not connecting to backend
- **Solution:** Check the `REACT_APP_SERVER_URL` in frontend `.env`
- Make sure backend is running on the correct port

#### 5. CORS errors
- **Solution:** Check backend CORS configuration in `server.js`
- Make sure frontend URL is whitelisted

### Getting Help

1. **Check the console logs** in both browser (F12) and terminal
2. **Verify all services are running:**
   - MongoDB: Check if mongod process is running
   - Backend: Check `http://localhost:5000/api/health`
   - Frontend: Check `http://localhost:3000`

3. **Check network connectivity:**
   - Backend API: `curl http://localhost:5000/api/health`
   - Socket.IO: Check browser network tab for WebSocket connection

## Production Deployment

### Environment Variables for Production

#### Backend (.env):
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/doctor-patient-chat?retryWrites=true&w=majority
JWT_SECRET=your-production-secret-key-make-it-very-long-and-random
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

#### Frontend (.env):
```env
REACT_APP_SERVER_URL=https://your-backend-domain.com
GENERATE_SOURCEMAP=false
```

### Deployment Platforms

#### Backend:
- **Heroku:** Easy deployment with MongoDB Atlas
- **Railway:** Simple Node.js deployment
- **DigitalOcean App Platform:** Full-stack deployment
- **AWS/GCP/Azure:** Container-based deployment

#### Frontend:
- **Vercel:** Excellent for React apps
- **Netlify:** Easy deployment with environment variables
- **GitHub Pages:** Free static hosting
- **AWS S3 + CloudFront:** Scalable hosting

### Security Considerations

1. **Use strong JWT secrets** (32+ characters)
2. **Enable HTTPS** in production
3. **Set up proper CORS** origins
4. **Use MongoDB Atlas** with proper security settings
5. **Implement rate limiting** for API endpoints
6. **Add input validation** and sanitization
7. **Use environment variables** for all secrets

## Next Steps

Once you have the application running:

1. **Explore the features:**
   - Real-time messaging
   - Typing indicators
   - Online/offline status
   - Message timestamps

2. **Customize the application:**
   - Modify the UI/UX
   - Add new features
   - Implement file sharing
   - Add video/audio calls

3. **Scale the application:**
   - Add more user types
   - Implement group chats
   - Add message search
   - Implement push notifications

## Support

If you encounter any issues:

1. Check this setup guide
2. Review the main README.md
3. Check the GitHub issues (if applicable)
4. Create a new issue with detailed error information

Happy coding! 🚀

