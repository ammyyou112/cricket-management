/**
 * Test Supabase REST API Connectivity (HTTPS - Port 443)
 * This tests if your network can reach Supabase at all
 * 
 * Run: node test-supabase-api.js
 */

require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ywufxezickfiaejbvgwl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

// Extract hostname from URL
const url = new URL(SUPABASE_URL);
const hostname = url.hostname;

console.log('🔵 Testing Supabase REST API Connectivity (HTTPS - Port 443)');
console.log('=' .repeat(70));
console.log(`Hostname: ${hostname}`);
console.log(`URL: ${SUPABASE_URL}`);
console.log('');

const options = {
  hostname: hostname,
  port: 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 second timeout
};

console.log('📡 Attempting connection...\n');

const req = https.request(options, (res) => {
  console.log(`✅ Connection successful!`);
  console.log(`   Status Code: ${res.statusCode}`);
  console.log(`   Status Message: ${res.statusMessage}`);
  console.log('');
  
  if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 404) {
    console.log('✅ Supabase REST API is REACHABLE via HTTPS (Port 443)!');
    console.log('');
    console.log('🔍 ANALYSIS:');
    console.log('   ✅ Your network CAN reach Supabase servers');
    console.log('   ❌ But PostgreSQL port 5432 is likely BLOCKED');
    console.log('');
    console.log('💡 SOLUTIONS:');
    console.log('   1. Use connection pooler (port 6543) instead of direct (5432)');
    console.log('   2. Use Supabase REST API instead of direct PostgreSQL');
    console.log('   3. Add firewall exception for port 5432');
    console.log('   4. Contact network administrator');
  }
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (data) {
      console.log('\n📄 Response (first 200 chars):');
      console.log(data.substring(0, 200));
    }
    console.log('\n✅ Test complete!\n');
  });
});

req.on('error', (e) => {
  console.error('❌ Connection FAILED!');
  console.error(`   Error: ${e.message}`);
  console.error(`   Code: ${e.code}`);
  console.log('');
  console.log('🔍 ANALYSIS:');
  console.log('   ❌ Your network is blocking ALL Supabase connections');
  console.log('   ❌ This includes HTTPS (port 443) which is unusual');
  console.log('');
  console.log('💡 SOLUTIONS:');
  console.log('   1. Check Windows Firewall settings');
  console.log('   2. Check antivirus software');
  console.log('   3. Try mobile hotspot (to test if it\'s your network)');
  console.log('   4. Try different WiFi network');
  console.log('   5. Disable VPN if using one');
  console.log('   6. Contact network administrator');
  console.log('');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Connection TIMEOUT!');
  console.error('   Request took longer than 10 seconds');
  console.log('');
  console.log('💡 This usually means:');
  console.log('   - Network is very slow');
  console.log('   - Firewall is blocking silently');
  console.log('   - Proxy is interfering');
  req.destroy();
  process.exit(1);
});

req.end();

