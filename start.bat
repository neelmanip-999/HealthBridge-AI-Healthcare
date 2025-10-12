@echo off
REM Doctor-Patient Chat Application Startup Script for Windows

echo 🏥 Starting Doctor-Patient Chat Application...
echo ==============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo.
echo 📦 Installing backend dependencies...
cd backend
if not exist "node_modules" (
    npm install
) else (
    echo ✅ Backend dependencies already installed
)

echo.
echo 📦 Installing frontend dependencies...
cd ..\frontend
if not exist "node_modules" (
    npm install
) else (
    echo ✅ Frontend dependencies already installed
)

echo.
echo 🚀 Starting the application...
echo.
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start backend in new window
start "Backend Server" cmd /k "cd ..\backend && npm run dev"

REM Start frontend in new window
start "Frontend Server" cmd /k "npm start"

echo ✅ Both servers are starting in separate windows
echo You can close this window once the servers are running
pause

