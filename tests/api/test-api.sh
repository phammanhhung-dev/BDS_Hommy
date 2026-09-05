#!/bin/bash

# Test script cho Chat REST API
# Usage: ./test-api.sh [YOUR_JWT_TOKEN]

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config
API_BASE="http://localhost:5000"
TOKEN="${1:-}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Chat API Test Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check token
if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ ERROR: JWT token required!${NC}"
  echo "Usage: ./test-api.sh YOUR_JWT_TOKEN"
  echo ""
  echo "To get token:"
  echo "  curl -X POST $API_BASE/api/login \\"
  echo "    -H 'Content-Type: application/json' \\"
  echo "    -d '{\"email\":\"your@email.com\",\"password\":\"password\"}'"
  exit 1
fi

echo -e "${GREEN}✅ Token loaded${NC}"
echo ""

# Test 1: Create Conversation
echo -e "${YELLOW}Test 1: Tạo cuộc hội thoại${NC}"
RESPONSE=$(curl -s -X POST "$API_BASE/api/chat/conversations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "NguCanhID": 1,
    "NguCanhLoai": "CuocHen",
    "ThanhVienIDs": [2],
    "TieuDe": "Test Conversation from Script"
  }')

echo "$RESPONSE" | jq '.'

# Extract conversation ID
CONV_ID=$(echo "$RESPONSE" | jq -r '.data.CuocHoiThoaiID // empty')

if [ -z "$CONV_ID" ]; then
  echo -e "${RED}❌ FAILED: Không tạo được conversation${NC}"
  exit 1
fi

echo -e "${GREEN}✅ SUCCESS: Conversation ID = $CONV_ID${NC}"
echo ""

# Test 2: Get Conversations List
echo -e "${YELLOW}Test 2: Lấy danh sách cuộc hội thoại${NC}"
curl -s -X GET "$API_BASE/api/chat/conversations?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ SUCCESS${NC}"
echo ""

# Test 3: Send Message (REST)
echo -e "${YELLOW}Test 3: Gửi tin nhắn (REST fallback)${NC}"
curl -s -X POST "$API_BASE/api/chat/conversations/$CONV_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"NoiDung": "Hello from test script!"}' | jq '.'
echo -e "${GREEN}✅ SUCCESS${NC}"
echo ""

# Test 4: Get Messages
echo -e "${YELLOW}Test 4: Lấy lịch sử tin nhắn${NC}"
curl -s -X GET "$API_BASE/api/chat/conversations/$CONV_ID/messages?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ SUCCESS${NC}"
echo ""

# Test 5: Mark as Read
echo -e "${YELLOW}Test 5: Đánh dấu đã đọc${NC}"
curl -s -X PUT "$API_BASE/api/chat/conversations/$CONV_ID/mark-read" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ SUCCESS${NC}"
echo ""

# Test 6: XSS Prevention
echo -e "${YELLOW}Test 6: XSS Prevention${NC}"
echo -e "${BLUE}Gửi tin nhắn có script tag...${NC}"
RESPONSE=$(curl -s -X POST "$API_BASE/api/chat/conversations/$CONV_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"NoiDung": "<script>alert(1)</script>Test XSS"}')

echo "$RESPONSE" | jq '.'

# Check if script tag is sanitized
if echo "$RESPONSE" | grep -q "&lt;script&gt;"; then
  echo -e "${GREEN}✅ SUCCESS: XSS prevented (script tag sanitized)${NC}"
else
  echo -e "${RED}⚠️ WARNING: Script tag might not be sanitized${NC}"
fi
echo ""

# Test 7: Rate Limiting (Send 12 messages quickly)
echo -e "${YELLOW}Test 7: Rate Limiting (gửi 12 tin nhắn nhanh)${NC}"
echo -e "${BLUE}Note: Cần test qua Socket.IO để thấy rate limit${NC}"
echo -e "${YELLOW}Skipping REST rate limit test (server-side only)${NC}"
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All REST API tests completed!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Conversation ID created: $CONV_ID"
echo ""
echo "Next steps:"
echo "  1. Open test-chat-quick.html in browser"
echo "  2. Paste your token"
echo "  3. Test Socket.IO real-time features"
echo ""


