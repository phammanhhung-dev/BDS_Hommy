/**
 * @fileoverview Test script cho Chat REST API & Socket.IO
 * @description Script kiểm tra toàn bộ tính năng chat (REST + Socket.IO)
 * @run node server/tests/test-chat-api.js
 * @author Development Team
 * @date 2025-11-04
 */

const axios = require('axios');
const io = require('socket.io-client');

// =====================================================
// CONFIGURATION
// =====================================================
const API_BASE = 'http://localhost:5000';
const SOCKET_URL = 'http://localhost:5000';

// Test credentials (cần cập nhật với user thật trong database)
const USER_1 = {
  email: 'khachhang1@example.com',
  password: 'password123',
  name: 'Khách hàng Test 1'
};

const USER_2 = {
  email: 'chuduan1@example.com',
  password: 'password123',
  name: 'Chủ dự án Test 1'
};

let token1 = null;
let token2 = null;
let conversationId = null;
let messageId = null;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Login user và lấy JWT token
 */
async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/api/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    throw new Error(`Login failed for ${email}: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Tạo headers với JWT token
 */
function getHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Delay function
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Log test result
 */
function logTest(testName, status, message = '') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  console.log(`${emoji} ${testName}: ${status}${message ? ' - ' + message : ''}`);
}

// =====================================================
// REST API TESTS
// =====================================================

/**
 * TEST 1: Login users
 */
async function testLogin() {
  console.log('\n=== TEST 1: LOGIN USERS ===');
  
  try {
    token1 = await login(USER_1.email, USER_1.password);
    logTest('Login User 1', 'PASS', USER_1.name);
    
    token2 = await login(USER_2.email, USER_2.password);
    logTest('Login User 2', 'PASS', USER_2.name);
    
    return true;
  } catch (error) {
    logTest('Login', 'FAIL', error.message);
    return false;
  }
}

/**
 * TEST 2: Tạo cuộc hội thoại mới
 */
async function testCreateConversation() {
  console.log('\n=== TEST 2: TẠO CUỘC HỘI THOẠI ===');
  
  try {
    const response = await axios.post(
      `${API_BASE}/api/chat/conversations`,
      {
        NguCanhID: 1, // TinDangID = 1 (giả sử)
        NguCanhLoai: 'TinDang',
        ThanhVienIDs: [2], // User 2 ID (giả sử)
        TieuDe: 'Test conversation - Trao đổi về Tin đăng #1'
      },
      { headers: getHeaders(token1) }
    );
    
    conversationId = response.data.data.CuocHoiThoaiID;
    logTest('Tạo cuộc hội thoại', 'PASS', `ID: ${conversationId}`);
    return true;
  } catch (error) {
    logTest('Tạo cuộc hội thoại', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * TEST 3: Lấy danh sách cuộc hội thoại
 */
async function testGetConversations() {
  console.log('\n=== TEST 3: LẤY DANH SÁCH CUỘC HỘI THOẠI ===');
  
  try {
    const response = await axios.get(
      `${API_BASE}/api/chat/conversations`,
      { headers: getHeaders(token1) }
    );
    
    const conversations = response.data.data;
    logTest('Lấy danh sách cuộc hội thoại', 'PASS', `Tìm thấy ${conversations.length} cuộc hội thoại`);
    
    if (conversations.length > 0) {
      console.log('   📋 Cuộc hội thoại đầu tiên:');
      console.log(`      - ID: ${conversations[0].CuocHoiThoaiID}`);
      console.log(`      - Tiêu đề: ${conversations[0].TieuDe}`);
      console.log(`      - Tin nhắn cuối: ${conversations[0].TinNhanCuoi || '(chưa có)'}`);
      console.log(`      - Chưa đọc: ${conversations[0].SoTinNhanChuaDoc || 0}`);
    }
    
    return true;
  } catch (error) {
    logTest('Lấy danh sách cuộc hội thoại', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * TEST 4: Gửi tin nhắn (REST API)
 */
async function testSendMessage() {
  console.log('\n=== TEST 4: GỬI TIN NHẮN (REST API) ===');
  
  if (!conversationId) {
    logTest('Gửi tin nhắn', 'FAIL', 'Không có conversationId');
    return false;
  }
  
  try {
    // User 1 gửi tin nhắn
    const response1 = await axios.post(
      `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
      { NoiDung: 'Xin chào! Tôi quan tâm đến tin đăng này.' },
      { headers: getHeaders(token1) }
    );
    
    messageId = response1.data.data.TinNhanID;
    logTest('User 1 gửi tin nhắn', 'PASS', `Message ID: ${messageId}`);
    
    await delay(500);
    
    // User 2 trả lời
    const response2 = await axios.post(
      `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
      { NoiDung: 'Chào bạn! Phòng vẫn còn trống. Bạn muốn xem phòng khi nào?' },
      { headers: getHeaders(token2) }
    );
    
    logTest('User 2 trả lời tin nhắn', 'PASS', `Message ID: ${response2.data.data.TinNhanID}`);
    
    return true;
  } catch (error) {
    logTest('Gửi tin nhắn', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * TEST 5: Lấy danh sách tin nhắn
 */
async function testGetMessages() {
  console.log('\n=== TEST 5: LẤY DANH SÁCH TIN NHẮN ===');
  
  if (!conversationId) {
    logTest('Lấy danh sách tin nhắn', 'FAIL', 'Không có conversationId');
    return false;
  }
  
  try {
    const response = await axios.get(
      `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
      {
        params: { limit: 50, offset: 0 },
        headers: getHeaders(token1)
      }
    );
    
    const messages = response.data.data;
    logTest('Lấy danh sách tin nhắn', 'PASS', `Tìm thấy ${messages.length} tin nhắn`);
    
    console.log('\n   📨 Danh sách tin nhắn:');
    messages.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.ThoiGian}] ${msg.NguoiGui_TenDayDu}: ${msg.NoiDung}`);
    });
    
    return true;
  } catch (error) {
    logTest('Lấy danh sách tin nhắn', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * TEST 6: Đánh dấu đã đọc
 */
async function testMarkAsRead() {
  console.log('\n=== TEST 6: ĐÁNH DẤU ĐÃ ĐỌC ===');
  
  if (!conversationId) {
    logTest('Đánh dấu đã đọc', 'FAIL', 'Không có conversationId');
    return false;
  }
  
  try {
    await axios.put(
      `${API_BASE}/api/chat/conversations/${conversationId}/read`,
      {},
      { headers: getHeaders(token1) }
    );
    
    logTest('Đánh dấu đã đọc', 'PASS');
    return true;
  } catch (error) {
    logTest('Đánh dấu đã đọc', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * TEST 7: Đếm tin nhắn chưa đọc
 */
async function testUnreadCount() {
  console.log('\n=== TEST 7: ĐẾM TIN NHẮN CHƯA ĐỌC ===');
  
  try {
    const response = await axios.get(
      `${API_BASE}/api/chat/unread-count`,
      { headers: getHeaders(token2) }
    );
    
    const count = response.data.data.count;
    logTest('Đếm tin nhắn chưa đọc', 'PASS', `User 2 có ${count} tin nhắn chưa đọc`);
    return true;
  } catch (error) {
    logTest('Đếm tin nhắn chưa đọc', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * TEST 8: Xóa tin nhắn
 */
async function testDeleteMessage() {
  console.log('\n=== TEST 8: XÓA TIN NHẮN ===');
  
  if (!messageId) {
    logTest('Xóa tin nhắn', 'FAIL', 'Không có messageId');
    return false;
  }
  
  try {
    await axios.delete(
      `${API_BASE}/api/chat/messages/${messageId}`,
      { headers: getHeaders(token1) }
    );
    
    logTest('Xóa tin nhắn', 'PASS', `Đã xóa message ID: ${messageId}`);
    return true;
  } catch (error) {
    logTest('Xóa tin nhắn', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * TEST 9: Rate limiting (gửi 21 tin nhắn liên tục)
 */
async function testRateLimiting() {
  console.log('\n=== TEST 9: RATE LIMITING (20 messages/minute) ===');
  
  if (!conversationId) {
    logTest('Rate limiting', 'FAIL', 'Không có conversationId');
    return false;
  }
  
  try {
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 1; i <= 21; i++) {
      try {
        await axios.post(
          `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
          { NoiDung: `Test rate limit - Message ${i}` },
          { headers: getHeaders(token1) }
        );
        successCount++;
      } catch (error) {
        failCount++;
      }
      await delay(100); // 100ms delay between messages
    }
    
    if (failCount > 0) {
      logTest('Rate limiting', 'PASS', `${successCount} thành công, ${failCount} bị chặn`);
      return true;
    } else {
      logTest('Rate limiting', 'FAIL', 'Không có tin nhắn nào bị chặn (rate limiting không hoạt động)');
      return false;
    }
  } catch (error) {
    logTest('Rate limiting', 'FAIL', error.message);
    return false;
  }
}

// =====================================================
// SOCKET.IO TESTS
// =====================================================

/**
 * TEST 10: Socket.IO Connection
 */
async function testSocketConnection() {
  console.log('\n=== TEST 10: SOCKET.IO CONNECTION ===');
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      auth: { token: token1 },
      autoConnect: true
    });
    
    socket.on('connect', () => {
      logTest('Socket.IO kết nối', 'PASS', `Socket ID: ${socket.id}`);
      socket.disconnect();
      resolve(true);
    });
    
    socket.on('connect_error', (error) => {
      logTest('Socket.IO kết nối', 'FAIL', error.message);
      resolve(false);
    });
    
    setTimeout(() => {
      logTest('Socket.IO kết nối', 'FAIL', 'Timeout');
      socket.disconnect();
      resolve(false);
    }, 5000);
  });
}

/**
 * TEST 11: Real-time messaging (Socket.IO)
 */
async function testRealtimeMessaging() {
  console.log('\n=== TEST 11: REAL-TIME MESSAGING (SOCKET.IO) ===');
  
  if (!conversationId) {
    logTest('Real-time messaging', 'FAIL', 'Không có conversationId');
    return false;
  }
  
  return new Promise((resolve) => {
    let messagesReceived = 0;
    
    // User 1 socket
    const socket1 = io(SOCKET_URL, {
      auth: { token: token1 },
      autoConnect: true
    });
    
    // User 2 socket
    const socket2 = io(SOCKET_URL, {
      auth: { token: token2 },
      autoConnect: true
    });
    
    socket1.on('connect', () => {
      console.log('   ℹ️  User 1 socket connected:', socket1.id);
      socket1.emit('join-conversation', { conversationId });
    });
    
    socket2.on('connect', () => {
      console.log('   ℹ️  User 2 socket connected:', socket2.id);
      socket2.emit('join-conversation', { conversationId });
    });
    
    // User 2 lắng nghe tin nhắn mới
    socket2.on('new-message', (message) => {
      messagesReceived++;
      console.log('   📨 User 2 nhận tin nhắn:', message.NoiDung);
      
      if (messagesReceived === 2) {
        logTest('Real-time messaging', 'PASS', 'Cả 2 tin nhắn đều được gửi real-time');
        socket1.disconnect();
        socket2.disconnect();
        resolve(true);
      }
    });
    
    // Sau 1 giây, User 1 gửi tin nhắn
    setTimeout(() => {
      socket1.emit('send-message', {
        conversationId,
        noiDung: 'Test real-time message 1 (via Socket.IO)'
      });
      
      setTimeout(() => {
        socket1.emit('send-message', {
          conversationId,
          noiDung: 'Test real-time message 2 (via Socket.IO)'
        });
      }, 500);
    }, 1000);
    
    // Timeout 10s
    setTimeout(() => {
      if (messagesReceived < 2) {
        logTest('Real-time messaging', 'FAIL', `Chỉ nhận được ${messagesReceived}/2 tin nhắn`);
        socket1.disconnect();
        socket2.disconnect();
        resolve(false);
      }
    }, 10000);
  });
}

/**
 * TEST 12: Typing indicator
 */
async function testTypingIndicator() {
  console.log('\n=== TEST 12: TYPING INDICATOR ===');
  
  if (!conversationId) {
    logTest('Typing indicator', 'FAIL', 'Không có conversationId');
    return false;
  }
  
  return new Promise((resolve) => {
    const socket1 = io(SOCKET_URL, { auth: { token: token1 }, autoConnect: true });
    const socket2 = io(SOCKET_URL, { auth: { token: token2 }, autoConnect: true });
    
    let typingReceived = false;
    let stopTypingReceived = false;
    
    socket1.on('connect', () => {
      socket1.emit('join-conversation', { conversationId });
    });
    
    socket2.on('connect', () => {
      socket2.emit('join-conversation', { conversationId });
    });
    
    // User 1 lắng nghe typing
    socket1.on('user-typing', ({ userId, userName }) => {
      console.log(`   ⌨️  ${userName} đang nhập...`);
      typingReceived = true;
    });
    
    socket1.on('user-stop-typing', ({ userId }) => {
      console.log('   ✋ User dừng nhập');
      stopTypingReceived = true;
      
      if (typingReceived && stopTypingReceived) {
        logTest('Typing indicator', 'PASS');
        socket1.disconnect();
        socket2.disconnect();
        resolve(true);
      }
    });
    
    // User 2 typing
    setTimeout(() => {
      socket2.emit('typing', { conversationId });
      
      setTimeout(() => {
        socket2.emit('stop-typing', { conversationId });
      }, 2000);
    }, 1000);
    
    setTimeout(() => {
      if (!typingReceived || !stopTypingReceived) {
        logTest('Typing indicator', 'FAIL', 'Không nhận được event typing/stop-typing');
        socket1.disconnect();
        socket2.disconnect();
        resolve(false);
      }
    }, 6000);
  });
}

// =====================================================
// RUN ALL TESTS
// =====================================================

async function runAllTests() {
  console.log('\n');
  console.log('========================================');
  console.log('🧪 CHAT API & SOCKET.IO TEST SUITE');
  console.log('========================================');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Socket URL: ${SOCKET_URL}`);
  console.log('========================================\n');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  // REST API Tests
  const test1 = await testLogin();
  results.total++;
  test1 ? results.passed++ : results.failed++;
  
  if (!test1) {
    console.log('\n❌ Login failed. Dừng tests.');
    return;
  }
  
  const test2 = await testCreateConversation();
  results.total++;
  test2 ? results.passed++ : results.failed++;
  
  const test3 = await testGetConversations();
  results.total++;
  test3 ? results.passed++ : results.failed++;
  
  const test4 = await testSendMessage();
  results.total++;
  test4 ? results.passed++ : results.failed++;
  
  const test5 = await testGetMessages();
  results.total++;
  test5 ? results.passed++ : results.failed++;
  
  const test6 = await testMarkAsRead();
  results.total++;
  test6 ? results.passed++ : results.failed++;
  
  const test7 = await testUnreadCount();
  results.total++;
  test7 ? results.passed++ : results.failed++;
  
  const test8 = await testDeleteMessage();
  results.total++;
  test8 ? results.passed++ : results.failed++;
  
  const test9 = await testRateLimiting();
  results.total++;
  test9 ? results.passed++ : results.failed++;
  
  // Socket.IO Tests
  const test10 = await testSocketConnection();
  results.total++;
  test10 ? results.passed++ : results.failed++;
  
  const test11 = await testRealtimeMessaging();
  results.total++;
  test11 ? results.passed++ : results.failed++;
  
  const test12 = await testTypingIndicator();
  results.total++;
  test12 ? results.passed++ : results.failed++;
  
  // Summary
  console.log('\n========================================');
  console.log('📊 TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('========================================\n');
  
  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! 🎉\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please check the logs above.\n');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});


