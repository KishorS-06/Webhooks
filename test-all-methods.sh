#!/bin/bash

echo "🚀 Testing Webhook Inspector - All HTTP Methods & Status Codes"
echo "=============================================================="

# Your webhook URL
WEBHOOK_URL="https://petronila-unstuck-xavi.ngrok-free.dev/hooks/40e47b9c-c567-4614-851c-06c1399b3b40"

echo ""
echo "📡 Testing Invalid Webhook (404 Not Found)"
echo "----------------------------------------"

echo "1. Testing POST (404 Not Found):"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"test": "404_error", "method": "POST"}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "2. Testing GET (404 Not Found):"
curl -X GET "$WEBHOOK_URL" \
  -H "User-Agent: Test-Client/1.0" \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "3. Testing PUT (404 Not Found):"
curl -X PUT "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"test": "404_error", "method": "PUT"}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "4. Testing DELETE (404 Not Found):"
curl -X DELETE "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"test": "404_error", "method": "DELETE"}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "5. Testing PATCH (404 Not Found):"
curl -X PATCH "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"test": "404_error", "method": "PATCH"}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "6. Testing HEAD (404 Not Found):"
curl -X HEAD "$WEBHOOK_URL" \
  -H "User-Agent: Test-Client/1.0" \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "7. Testing OPTIONS (404 Not Found):"
curl -X OPTIONS "$WEBHOOK_URL" \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "📊 Testing Different Content Types"
echo "----------------------------------"

echo "8. Testing with XML Content Type:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><test><message>XML Test</message></test>' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "9. Testing with Form Data:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'name=test&value=data&method=form' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "10. Testing with No Content Type:"
curl -X POST "$WEBHOOK_URL" \
  -d 'plain text data without content type' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "🔧 Testing with Query Parameters"
echo "---------------------------------"

echo "11. Testing with Query String:"
curl -X GET "$WEBHOOK_URL?param1=value1&param2=value2&debug=true" \
  -H "User-Agent: Query-Test/1.0" \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "12. Testing with Auth Headers:"
curl -X POST "$WEBHOOK_URL" \
  -H "Authorization: Bearer test-token-123" \
  -H "X-API-Key: abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{"auth": "test", "headers": true}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "🌐 Testing Different User Agents"
echo "--------------------------------"

echo "13. Testing GitHub Webhook Headers:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: 12345678-1234-1234-1234-123456789012" \
  -H "X-Hub-Signature: sha1=test" \
  -H "User-Agent: GitHub-Hookshot/abc123" \
  -d '{"event": "push", "repository": {"name": "test"}}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "14. Testing Stripe Webhook Headers:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test_signature" \
  -H "User-Agent: Stripe/1.0 (+https://stripe.com)" \
  -d '{"type": "payment_intent.succeeded", "data": {"object": {"id": "pi_123"}}}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "15. Testing Slack Webhook Headers:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Slackbot 2.0 (+https://api.slack.com/robots)" \
  -d '{"type": "message", "user": "U123456", "text": "Hello from Slack"}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "⏱️ Testing Large Payloads"
echo "-------------------------"

echo "16. Testing Large JSON Payload:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "large": {
      "data": "This is a large payload test",
      "array": [1,2,3,4,5,6,7,8,9,10],
      "nested": {
        "level1": {
          "level2": {
            "level3": "deep nesting test"
          }
        }
      },
      "repeated": "test data repeated many times".repeat(10)
    }
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "🔥 Testing Error Scenarios"
echo "-------------------------"

echo "17. Testing Invalid JSON:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"invalid": json, "missing": quotes}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "18. Testing Empty Body:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "19. Testing Special Characters:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"special": "áéíóú ñ 中文 🚀 emoji test", "unicode": "✓ ✓"}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "20. Testing Binary Data:"
echo 'binary data test' | curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @- \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "✅ All Tests Completed!"
echo "======================"
echo ""
echo "📊 Check your webhook inspector dashboard:"
echo "   - You should see 20 requests with different methods"
echo "   - All should show status code 404 (red badges)"
echo "   - Each request should have different headers, bodies, and content types"
echo "   - Methods: POST, GET, PUT, DELETE, PATCH, HEAD, OPTIONS"
echo "   - Content Types: JSON, XML, Form Data, Binary"
echo "   - Headers: GitHub, Stripe, Slack, Auth tokens"
echo "   - Special cases: Large payloads, invalid data, special characters"
echo ""
echo "🎯 Your webhook inspector should now display ALL HTTP methods and 404 errors correctly!"
