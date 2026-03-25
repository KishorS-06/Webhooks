# Smart Webhook Inspector

An AI-powered webhook testing and debugging platform that helps developers capture, inspect, analyze, and test webhook integrations with external services like Stripe, Razorpay, GitHub, and more.

## 🚀 Features

### Core Functionality
- **Webhook Endpoint Creation**: Generate unique webhook URLs instantly
- **Real-time Request Capture**: Live webhook request monitoring via WebSocket
- **Request Inspection**: View headers, body, query parameters, and metadata
- **AI-Powered Analysis**: Automatic webhook payload analysis using Google Gemini AI
- **Security Scanning**: Comprehensive security assessment and vulnerability detection
- **Service Detection**: Automatic identification of webhook sources (Stripe, GitHub, etc.)

### Advanced Features
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **Real-time Updates**: Instant notifications when new webhooks arrive
- **Request History**: Complete timeline of all webhook events
- **Copy URLs**: One-click webhook URL copying
- **Multi-format Support**: JSON, form data, and custom content types
- **Security Scoring**: Automated security risk assessment (0-100 scale)

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **Google Gemini AI** for webhook analysis
- **bcryptjs** for authentication
- **UUID** for unique token generation

### Frontend
- **React 19** with modern hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time updates
- **Axios** for HTTP requests

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB database
- Google Gemini AI API key (optional, for AI features)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Srisakthi
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/webhooks

# Google Gemini AI (Optional - for AI analysis)
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=5001
NODE_ENV=development
```

### 4. Start the Application

#### Start Backend Server
```bash
cd backend
npm start
```

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

## 📖 Usage Guide

### 1. Create Account
1. Visit http://localhost:5173
2. Click "Create a new account"
3. Enter your email and password
4. Login with your credentials

### 2. Create Webhook Endpoint
1. From the dashboard, click "Create Webhook"
2. Enter a descriptive name (e.g., "Payment Webhook")
3. Copy the generated webhook URL

### 3. Test with External Services
1. Paste the webhook URL in your external service's webhook settings
2. Trigger an event (payment, GitHub push, etc.)
3. Watch the request appear in real-time on your dashboard

### 4. Analyze Webhook Requests
1. Click on any received request to view details
2. Use "AI Analysis" to get intelligent insights
3. Run "Security Scan" to check for vulnerabilities

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User authentication

### Webhooks
- `POST /api/webhooks/create` - Create new webhook endpoint
- `GET /api/webhooks/user/:userId` - Get user's webhooks

### Requests
- `GET /api/requests/:token` - Get requests for webhook
- `GET /api/requests/detail/:id` - Get specific request details
- `POST /api/requests/analyze/:id` - AI analysis of request
- `POST /api/requests/security-scan/:id` - Security scan of request

### Webhook Reception
- `POST /hooks/:token` - External services send webhooks here
- `GET /hooks/:token` - Test endpoint (returns info)

## 🤖 AI Analysis Features

The AI service provides:
- **Service Identification**: Detects Stripe, GitHub, Razorpay, etc.
- **Event Type Recognition**: Identifies payment events, pushes, etc.
- **Security Assessment**: Analyzes potential security issues
- **Data Structure Analysis**: Explains payload structure
- **Handling Recommendations**: Suggests best practices

## 🔒 Security Features

### Automated Security Scanning
- **Signature Verification**: Checks for webhook signatures
- **Header Validation**: Analyzes security headers
- **IP Tracking**: Monitors source IP addresses
- **Content Type Validation**: Ensures proper content types
- **Sensitive Data Detection**: Flags exposed sensitive information

### Security Scoring
- **0-100 Scale**: Higher scores indicate better security
- **Risk Levels**: Low, Medium, High risk categorization
- **Actionable Recommendations**: Specific security improvements

## 🎯 Supported Services

The system automatically detects and analyzes webhooks from:
- **Stripe** (payment events, invoices)
- **Razorpay** (payment captures, refunds)
- **GitHub** (pushes, pull requests, issues)
- **Slack** (events, commands, interactions)
- **PayPal** (payments, authorizations)
- **Custom Services** (generic webhook analysis)

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```bash
Error: MongooseServerSelectionError
```
**Solution**: Check your MongoDB URI in `.env` file

#### AI Analysis Not Working
```bash
Error: AI service unavailable
```
**Solution**: Add `GEMINI_API_KEY` to your `.env` file

#### WebSocket Connection Issues
**Symptoms**: Real-time updates not working
**Solution**: Ensure backend is running on port 5001

#### Frontend Build Errors
```bash
Error: Module not found
```
**Solution**: Run `npm install` in frontend directory

### Development Tips
1. Use browser DevTools to monitor WebSocket connections
2. Check Network tab for API request failures
3. Monitor backend console for error logs
4. Test with different webhook payloads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to branch: `git push origin feature-name`
6. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review API documentation
3. Create an issue in the repository
4. Contact the development team

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=production_mongodb_uri
GEMINI_API_KEY=production_api_key
```

### Build Commands
```bash
# Frontend production build
cd frontend
npm run build

# Backend production start
cd backend
npm start
```

### Recommended Hosting
- **Backend**: Heroku, AWS EC2, DigitalOcean
- **Database**: MongoDB Atlas
- **Frontend**: Vercel, Netlify, AWS S3

---

**Built with ❤️ for developers who need reliable webhook debugging tools.**
