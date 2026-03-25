# Quick Real-Time Testing Script

## Simple Node.js Real-Time Event Generator

### Install Dependencies
```bash
npm install express axios
```

### Create real-time-test.js
```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Your webhook URL (update this)
const WEBHOOK_URL = 'http://localhost:5001/hooks/YOUR_TOKEN';

// Real-time event types
const eventTypes = [
  'user_signup',
  'payment_received', 
  'order_created',
  'message_received',
  'system_alert',
  'data_sync',
  'api_call',
  'error_occurred'
];

// Generate random events
function generateRandomEvent() {
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const timestamp = new Date().toISOString();
  
  return {
    type,
    timestamp,
    id: Math.random().toString(36).substr(2, 9),
    data: {
      userId: Math.floor(Math.random() * 1000),
      amount: Math.floor(Math.random() * 1000) / 100,
      status: Math.random() > 0.5 ? 'success' : 'pending',
      metadata: {
        source: 'real-time-tester',
        version: '1.0.0'
      }
    }
  };
}

// Send webhook event
async function sendWebhookEvent() {
  try {
    const event = generateRandomEvent();
    console.log(`📤 Sending ${event.type} event...`);
    
    await axios.post(WEBHOOK_URL, event, {
      headers: {
        'Content-Type': 'application/json',
        'X-Event-Type': event.type,
        'X-Source': 'real-time-tester'
      }
    });
    
    console.log(`✅ ${event.type} sent successfully`);
  } catch (error) {
    console.error(`❌ Error sending event:`, error.message);
  }
}

// API endpoint to trigger events manually
app.post('/trigger', async (req, res) => {
  await sendWebhookEvent();
  res.json({ status: 'event sent' });
});

// API endpoint to send custom events
app.post('/custom', async (req, res) => {
  try {
    await axios.post(WEBHOOK_URL, {
      type: 'custom_event',
      timestamp: new Date().toISOString(),
      data: req.body
    });
    res.json({ status: 'custom event sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start automatic events every 3 seconds
setInterval(sendWebhookEvent, 3000);

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Real-time webhook tester running on port ${PORT}`);
  console.log(`📡 Sending events to: ${WEBHOOK_URL}`);
  console.log(`⚡ Events will be sent every 3 seconds`);
  console.log(`🎯 Test manually: curl -X POST http://localhost:${PORT}/trigger`);
  console.log(`🔧 Custom events: curl -X POST http://localhost:${PORT}/custom -d '{"test": "data"}'`);
});
```

### Run the Real-Time Tester
```bash
# Start the real-time event generator
node real-time-test.js

# In another terminal, trigger manual events
curl -X POST http://localhost:3001/trigger

# Send custom events
curl -X POST http://localhost:3001/custom \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from custom test!"}'
```

## Browser JavaScript Real-Time Tester

### Create browser-test.html
```html
<!DOCTYPE html>
<html>
<head>
    <title>Real-Time Webhook Tester</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
        .log { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>🚀 Real-Time Webhook Tester</h1>
    
    <div>
        <button onclick="sendEvent('github_push')">📝 GitHub Push</button>
        <button onclick="sendEvent('stripe_payment')">💳 Stripe Payment</button>
        <button onclick="sendEvent('slack_message')">💬 Slack Message</button>
        <button onclick="sendEvent('user_signup')">👤 User Signup</button>
        <button onclick="sendEvent('error_log')">❌ Error Log</button>
        <button onclick="startAutoSend()">⚡ Auto Send (Every 2s)</button>
        <button onclick="stopAutoSend()">⏹️ Stop Auto</button>
    </div>

    <div>
        <input type="text" id="webhookUrl" placeholder="http://localhost:5001/hooks/YOUR_TOKEN" style="width: 400px;">
        <button onclick="updateUrl()">Update URL</button>
    </div>

    <div id="logs"></div>

    <script>
        let webhookUrl = 'http://localhost:5001/hooks/YOUR_TOKEN';
        let autoInterval = null;

        function log(message, type = 'info') {
            const logs = document.getElementById('logs');
            const div = document.createElement('div');
            div.className = `log ${type}`;
            div.innerHTML = `<strong>${new Date().toLocaleTimeString()}</strong>: ${message}`;
            logs.appendChild(div);
            logs.scrollTop = logs.scrollHeight;
        }

        function updateUrl() {
            webhookUrl = document.getElementById('webhookUrl').value;
            log(`Webhook URL updated: ${webhookUrl}`, 'success');
        }

        async function sendEvent(eventType) {
            try {
                const events = {
                    github_push: {
                        type: 'push',
                        ref: 'refs/heads/main',
                        commits: [{ message: 'Test commit', author: { name: 'Test User' } }]
                    },
                    stripe_payment: {
                        type: 'payment_intent.succeeded',
                        amount: 2000,
                        currency: 'usd',
                        status: 'succeeded'
                    },
                    slack_message: {
                        type: 'message',
                        user: 'U123456',
                        text: 'Hello from webhook tester!',
                        channel: 'C123456'
                    },
                    user_signup: {
                        type: 'user.created',
                        email: 'test@example.com',
                        name: 'Test User',
                        id: 12345
                    },
                    error_log: {
                        type: 'error',
                        message: 'Something went wrong!',
                        stack: 'Error: Test error\n    at test.js:1:1',
                        level: 'critical'
                    }
                };

                const event = events[eventType];
                log(`📤 Sending ${eventType} event...`);

                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Event-Type': eventType
                    },
                    body: JSON.stringify(event)
                });

                if (response.ok) {
                    log(`✅ ${eventType} sent successfully (${response.status})`, 'success');
                } else {
                    log(`❌ ${eventType} failed (${response.status})`, 'error');
                }
            } catch (error) {
                log(`❌ Error sending ${eventType}: ${error.message}`, 'error');
            }
        }

        function startAutoSend() {
            if (autoInterval) return;
            
            autoInterval = setInterval(() => {
                const eventTypes = ['github_push', 'stripe_payment', 'slack_message', 'user_signup'];
                const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                sendEvent(randomType);
            }, 2000);
            
            log('⚡ Auto sending started (every 2 seconds)', 'success');
        }

        function stopAutoSend() {
            if (autoInterval) {
                clearInterval(autoInterval);
                autoInterval = null;
                log('⏹️ Auto sending stopped', 'success');
            }
        }

        // Initialize
        document.getElementById('webhookUrl').value = webhookUrl;
        log('🚀 Real-time webhook tester ready!', 'success');
    </script>
</body>
</html>
```

### Use the Browser Tester
1. Save as `browser-test.html`
2. Open in your browser
3. Update the webhook URL to your endpoint
4. Click buttons to send different event types
5. Watch real-time updates in your webhook tester

## 🎯 **Instant Testing Checklist**

### 1. Quick Setup (5 minutes)
```bash
# 1. Start your webhook server
cd backend && npm start

# 2. Start your frontend
cd frontend && npm start

# 3. Start real-time tester
node real-time-test.js
```

### 2. Test Multiple Sources
- ✅ **GitHub**: Push code to see instant webhooks
- ✅ **Custom App**: Use the Node.js tester
- ✅ **Browser**: Use the HTML tester
- ✅ **Manual**: Use curl commands

### 3. Verify Real-Time Updates
- Events should appear instantly in your webhook tester
- Check timestamps for real-time accuracy
- Verify all data is captured correctly
- Test different response configurations

Your webhook tester is now ready for **real-time integration testing** with multiple sources! 🚀
