# Public Webhook Access Setup Guide

## 🌐 Making Your Webhooks Publicly Accessible

To receive webhooks from external services (GitHub, Razorpay, Stripe, etc.), you need to expose your local server to the internet.

## 🚀 Quick Setup Options

### Option 1: Ngrok (Recommended for Development)
```bash
# Install ngrok
npm install -g ngrok

# Start your backend server
cd backend
npm start

# In a new terminal, expose port 5001
ngrok http 5001
```

Your public webhook URL will be: `https://random-string.ngrok.io/hooks/YOUR_TOKEN`

### Option 2: Cloudflare Tunnel (Free)
```bash
# Install cloudflared
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Create tunnel
cloudflared tunnel --url http://localhost:5001
```

### Option 3: LocalTunnel
```bash
# Install localtunnel
npm install -g localtunnel

# Expose port 5001
lt --port 5001
```

## 🔧 Configuration Updates

### Update Backend CORS
Add this to your `server.js` or `app.js`:

```javascript
const cors = require('cors')

// Enable CORS for all origins (development only)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// For production, specify specific origins:
app.use(cors({
  origin: [
    'https://github.com',
    'https://api.razorpay.com',
    'https://api.stripe.com',
    'https://api.slack.com'
  ]
}))
```

### Update Webhook URL Generation
In your `webhookController.js`:

```javascript
exports.createWebhook = async (req, res) => {
  const { userId, name } = req.body
  const token = uuidv4()
  
  // Get public URL from environment or use ngrok
  const publicUrl = process.env.PUBLIC_WEBHOOK_URL || 'http://localhost:5001'
  
  const endpoint = await Endpoint.create({
    userId,
    name,
    token
  })
  
  res.json({
    webhook_url: `${publicUrl}/hooks/${token}`,
    public_url: `${publicUrl}/hooks/${token}`, // For external services
    local_url: `http://localhost:5001/hooks/${token}`, // For local testing
    token
  })
}
```

## 🛠️ Environment Setup

### Create `.env` file in backend:
```env
# Development
PUBLIC_WEBHOOK_URL=https://your-ngrok-url.ngrok.io

# Production (when deployed)
# PUBLIC_WEBHOOK_URL=https://your-domain.com
```

### Install required packages:
```bash
cd backend
npm install cors dotenv
```

## 🌍 Production Deployment Options

### Option 1: Vercel (Serverless)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: Heroku
```bash
# Install Heroku CLI
# Create app
heroku create your-webhook-app

# Set environment variables
heroku config:set PUBLIC_WEBHOOK_URL=https://your-app.herokuapp.com

# Deploy
git push heroku main
```

### Option 3: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## 🔗 Service-Specific Setup

### GitHub Webhooks
1. Go to Repository Settings → Webhooks
2. Payload URL: `https://your-public-url/hooks/YOUR_TOKEN`
3. Content type: `application/json`
4. Secret: (optional) Create a secret for security

### Razorpay Webhooks
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Webhook URL: `https://your-public-url/hooks/YOUR_TOKEN`
3. Secret: (recommended) Enable webhook signing

### Stripe Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Endpoint URL: `https://your-public-url/hooks/YOUR_TOKEN`
3. Events: Select events you want to receive

### Slack Webhooks
1. Go to Slack App Settings → Incoming Webhooks
2. Request URL: `https://your-public-url/hooks/YOUR_TOKEN`

## 🔒 Security Considerations

### 1. Webhook Signature Verification
```javascript
// Example for Stripe
const crypto = require('crypto')

const verifyStripeSignature = (payload, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

app.use('/hooks/', limiter)
```

### 3. IP Whitelisting
```javascript
const allowedIPs = [
  '185.199.108.0/22', // GitHub
  '34.74.90.128/26',   // Razorpay
  '54.187.203.0/24',   // Stripe
]

app.use('/hooks/', (req, res, next) => {
  const clientIP = req.ip
  // Add IP validation logic here
  next()
})
```

## 🚀 Quick Start with Ngrok

1. **Start your backend:**
```bash
cd backend
npm start
```

2. **Start ngrok:**
```bash
ngrok http 5001
```

3. **Copy the ngrok URL** and update your frontend:
```javascript
// In Dashboard.jsx, update the webhook URL display
const webhookUrl = `https://your-ngrok-url.ngrok.io/hooks/${webhook.token}`
```

4. **Test with external services:**
   - Use the ngrok URL in GitHub, Razorpay, etc.
   - Webhooks will now reach your local server!

## 📱 Testing Your Public Webhooks

### Test with curl:
```bash
curl -X POST https://your-ngrok-url.ngrok.io/hooks/YOUR_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": {"message": "Hello from external service!"}}'
```

### Test with GitHub:
1. Create a test repository
2. Add webhook URL with your ngrok URL
3. Push a change to test

## 🎯 Success Indicators

✅ **Working Setup:**
- Ngrok shows HTTP 200 responses
- Dashboard shows incoming webhooks
- AI analysis processes requests
- Charts update with new data

✅ **External Integration:**
- GitHub sends push events
- Razorpay sends payment notifications
- Stripe sends payment events
- All appear in your dashboard

Your webhook inspector is now ready for real-world usage! 🚀
