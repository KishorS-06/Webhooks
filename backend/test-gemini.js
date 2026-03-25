const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testGeminiAPI() {
  console.log('Testing Gemini API...');
  console.log('API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Analyze this webhook request and provide insights:

Request Details:
- Method: POST
- IP Address: 192.168.1.1
- Headers: {"content-type": "application/json", "stripe-signature": "test_signature"}
- Body: {"event": "payment_intent.succeeded", "amount": 2000, "currency": "usd"}

Please provide:
1. Service identification (if possible)
2. Event type analysis
3. Security assessment
4. Data structure analysis
5. Recommendations for handling

Format your response as JSON with the following structure:
{
  "service": "identified service or 'Unknown'",
  "eventType": "event type or 'Unknown'",
  "confidence": "high/medium/low",
  "security": {
    "riskLevel": "low/medium/high",
    "concerns": ["list of security concerns"],
    "recommendations": ["list of security recommendations"]
  },
  "analysis": {
    "summary": "brief summary of what this webhook represents",
    "dataStructure": "analysis of the payload structure",
    "keyFields": ["important fields in the payload"]
  },
  "recommendations": ["handling recommendations"]
}

Respond only with valid JSON, no additional text.`;

    console.log('Sending request to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API Response:');
    console.log(text);
    
    try {
      const parsed = JSON.parse(text);
      console.log('✅ Valid JSON response received');
      console.log('Service detected:', parsed.service);
      console.log('Event type:', parsed.eventType);
      console.log('Risk level:', parsed.security?.riskLevel);
      return parsed;
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError.message);
      console.log('Raw response:', text);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    return null;
  }
}

testGeminiAPI().then(result => {
  if (result) {
    console.log('\n🎉 Gemini API is working correctly!');
    console.log('Your webhook analysis will now be AI-powered.');
  } else {
    console.log('\n❌ Gemini API test failed.');
    console.log('Please check your API key and internet connection.');
  }
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
