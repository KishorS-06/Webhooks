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
