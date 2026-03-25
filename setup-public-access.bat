@echo off
echo 🌐 Setting up Public Webhook Access
echo ==================================

REM Check if ngrok is installed
ngrok version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing ngrok...
    npm install -g ngrok
)

REM Start backend server
echo 🚀 Starting backend server...
cd backend
start /B npm start

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Start ngrok
echo 🌍 Starting ngrok tunnel...
start /B ngrok http 5001

REM Wait for ngrok to start
timeout /t 5 /nobreak >nul

REM Get ngrok URL (this is a simplified approach)
echo.
echo ✅ Ngrok tunnel started!
echo.
echo 📋 To get your public URL:
echo 1. Open http://localhost:4040 in your browser
echo 2. Copy the HTTPS URL from the ngrok interface
echo 3. Update backend/.env file:
echo    PUBLIC_WEBHOOK_URL=https://your-ngrok-url.ngrok.io
echo.
echo 🎯 Your webhook URLs will be:
echo    https://your-ngrok-url.ngrok.io/hooks/{token}
echo.
echo 📋 Next steps:
echo 1. Use this URL in GitHub, Razorpay, Stripe, etc.
echo 2. Webhooks will appear in your dashboard
echo 3. AI analysis will process incoming requests
echo.
echo ⏹️  Press any key to stop...
pause >nul

REM Stop processes
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im ngrok.exe >nul 2>&1
