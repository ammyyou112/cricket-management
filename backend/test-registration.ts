/**
 * Quick backend registration test
 * Run with: npx ts-node test-registration.ts
 */

import axios from 'axios';

const testBackend = async () => {
  console.log('🔍 Testing Backend Registration...\n');
  
  try {
    // Test 1: Health check
    console.log('Test 1: Health Check');
    const health = await axios.get('http://localhost:3000/health');
    console.log('✅ Backend running:', health.data);
    console.log('');
    
    // Test 2: Register new user
    console.log('Test 2: Register New User');
    const testUser = {
      email: `backendtest${Date.now()}@cricket360.com`,
      password: 'Test123456',
      fullName: 'Backend Test User',
      role: 'PLAYER',
      playerType: 'BATSMAN',
    };
    
    console.log('Attempting registration:', testUser.email);
    console.log('Request payload:', JSON.stringify(testUser, null, 2));
    
    const response = await axios.post(
      'http://localhost:3000/api/v1/auth/register',
      testUser,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ Registration successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data) {
      console.log('User ID:', response.data.data.user?.id);
      console.log('User Email:', response.data.data.user?.email);
      console.log('Access Token:', response.data.data.accessToken?.substring(0, 20) + '...');
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error: any) {
    console.error('\n❌ Backend test failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
      console.error('Make sure the backend server is running on http://localhost:3000');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
};

testBackend();

