import { authService } from '@/services/auth.service';
import { teamService } from '@/services/team.service';
import { apiClient } from '@/lib/apiClient';

export const runDiagnostics = async () => {
  console.log('🔍 ===== CRICKET 360 DIAGNOSTICS =====');
  
  // Test 1: Check environment variables
  console.log('\n📋 Test 1: Environment Check');
  console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');
  console.log('Current Origin:', window.location.origin);
  
  // Test 2: Check backend health
  console.log('\n🏥 Test 2: Backend Health Check');
  try {
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    console.log('✅ Backend is running:', data);
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    console.error('🔴 BACKEND IS NOT RUNNING! Start it with: cd backend && npm run dev');
    return;
  }
  
  // Test 3: Check API connection
  console.log('\n🔌 Test 3: API Connection Test');
  try {
    const response = await apiClient.get('/');
    console.log('✅ API Client connected:', response);
  } catch (error: any) {
    console.error('❌ API Client connection failed:', error);
    console.error('Response:', error.response?.data);
  }
  
  // Test 4: Test Registration
  console.log('\n📝 Test 4: Registration Test');
  const testUser = {
    email: `test${Date.now()}@cricket360.com`,
    password: 'Test123456',
    full_name: 'Diagnostic Test User',
    role: 'player' as const,
    playerType: 'BATSMAN' as const,
  };
  
  console.log('Attempting to register:', testUser.email);
  
  try {
    const result = await authService.signUp(testUser);
    console.log('✅ Registration successful!', result);
    console.log('User created:', result);
    console.log('Token saved:', !!localStorage.getItem('cricket360_access_token'));
    
    // Cleanup - logout
    await authService.signOut();
    console.log('✅ Test user logged out');
    
  } catch (error: any) {
    console.error('❌ Registration failed!');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Response data:', error.response?.data);
    console.error('Status:', error.response?.status);
    
    // Log the exact request being sent
    console.log('\n🔍 Debug Info:');
    console.log('Error type:', typeof error);
    console.log('Error keys:', Object.keys(error));
  }
  
  // Test 5: Check existing users
  console.log('\n👥 Test 5: Try to login with existing user');
  try {
    const loginResult = await authService.signIn({
      email: 'player1@cricket360.com',
      password: 'password123'
    });
    console.log('✅ Login with seed user successful!', loginResult);
    
    // Get current user
    const currentUser = await authService.getCurrentUser();
    console.log('✅ getCurrentUser() works:', currentUser);
    
    // Logout
    await authService.signOut();
    console.log('✅ Logout successful');
    
  } catch (error: any) {
    console.error('❌ Login with seed user failed:', error);
    console.error('Error message:', error.message);
    console.error('Response data:', error.response?.data);
  }
  
  // Test 6: Check teams endpoint (requires auth)
  console.log('\n🏏 Test 6: Teams Endpoint Test');
  try {
    // First login to get token
    const loginResult = await authService.signIn({
      email: 'player1@cricket360.com',
      password: 'password123'
    });
    
    if (loginResult) {
      const teams = await teamService.getAll();
      console.log('✅ Teams endpoint works:', teams);
      await authService.signOut();
    }
  } catch (error: any) {
    console.error('❌ Teams endpoint failed:', error);
    console.error('Error message:', error.message);
    console.error('Response data:', error.response?.data);
  }
  
  console.log('\n🏁 ===== DIAGNOSTICS COMPLETE =====');
  console.log('\nNext steps:');
  console.log('1. Check the console above for ❌ errors');
  console.log('2. If backend health check failed → Start backend server');
  console.log('3. If registration failed → Check the error details');
  console.log('4. Check Network tab in DevTools for actual HTTP requests');
};

// Auto-export for easy console access
(window as any).runDiagnostics = runDiagnostics;

