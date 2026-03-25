#!/bin/bash

echo "🌐 Setting up Public Webhook Access"
echo "=================================="

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "📦 Installing ngrok..."
    npm install -g ngrok
fi

# Start backend server
echo "🚀 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!

# Wait for server to start
sleep 3

# Start ngrok
echo "🌍 Starting ngrok tunnel..."
ngrok http 5001 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 5

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok\.io' | head -1)

if [ -n "$NGROK_URL" ]; then
    echo "✅ Ngrok tunnel created: $NGROK_URL"
    
    # Update .env file
    echo "📝 Updating .env file..."
    sed -i.bak "s|PUBLIC_WEBHOOK_URL=.*|PUBLIC_WEBHOOK_URL=$NGROK_URL|" backend/.env
    
    echo "🎯 Your public webhook URL is: $NGROK_URL/hooks/{token}"
    echo ""
    echo "📋 Next steps:"
    echo "1. Use this URL in GitHub, Razorpay, Stripe, etc."
    echo "2. Webhooks will appear in your dashboard"
    echo "3. AI analysis will process incoming requests"
    echo ""
    echo "⏹️  Press Ctrl+C to stop"
    
    # Keep processes running
    wait $BACKEND_PID $NGROK_PID
else
    echo "❌ Failed to get ngrok URL"
    echo "Please check ngrok installation"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
