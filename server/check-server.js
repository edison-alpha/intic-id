/**
 * Test script to check if the server is running
 */
const http = require('http');

// Test server health endpoint
function testServer() {
  console.log('🧪 Testing server health endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/health',
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Server is running and responding to health check');
        console.log('📊 Health response:', data);
      } else {
        console.log('❌ Server responded with status:', res.statusCode);
        console.log('📤 Response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Error connecting to server:', e.message);
    console.log('💡 Make sure you started the server with: npm run dev');
  });

  req.end();
}

// Run test
testServer();