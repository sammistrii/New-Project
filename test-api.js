#!/usr/bin/env node

/**
 * Simple API test script for Eco-Points System
 * Run this after starting the server to test basic functionality
 */

const BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🧪 Testing Eco-Points System API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('   Environment:', healthData.environment);
    console.log('   Uptime:', healthData.uptime, 'seconds\n');

    // Test user registration
    console.log('2. Testing user registration...');
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'TestPass123',
      name: 'Test User',
      phone: '+1234567890'
    };

    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ User registered successfully');
      console.log('   User ID:', registerData.user.id);
      console.log('   Email:', registerData.user.email);
      console.log('   Role:', registerData.user.role);
      console.log('   Access Token:', registerData.tokens.accessToken ? '✅' : '❌');
      console.log('   Refresh Token:', registerData.tokens.refreshToken ? '✅' : '❌');
      
      const { accessToken } = registerData.tokens;
      
      // Test user profile
      console.log('\n3. Testing user profile...');
      const profileResponse = await fetch(`${BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Profile retrieved successfully');
        console.log('   Name:', profileData.user.name);
        console.log('   Points Balance:', profileData.wallet.points_balance);
        console.log('   Cash Balance:', profileData.wallet.cash_balance);
      } else {
        console.log('❌ Failed to get profile:', profileResponse.status);
      }

      // Test video submission
      console.log('\n4. Testing video submission...');
      const submissionData = {
        s3_key: 'test-video-123.mp4',
        gps_lat: 40.7829,
        gps_lng: -73.9654,
        recorded_at: new Date().toISOString(),
        device_hash: 'test-device-123',
        duration_s: 15,
        size_bytes: 1024000
      };

      const submissionResponse = await fetch(`${BASE_URL}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(submissionData),
      });

      if (submissionResponse.ok) {
        const submissionResult = await submissionResponse.json();
        console.log('✅ Video submission created successfully');
        console.log('   Submission ID:', submissionResult.submission.id);
        console.log('   Status:', submissionResult.submission.status);
        console.log('   Auto Score:', submissionResult.submission.auto_score);
      } else {
        const errorData = await submissionResponse.json();
        console.log('❌ Failed to create submission:', errorData.error.message);
      }

      // Test getting submissions
      console.log('\n5. Testing get submissions...');
      const submissionsResponse = await fetch(`${BASE_URL}/submissions`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        console.log('✅ Submissions retrieved successfully');
        console.log('   Total submissions:', submissionsData.pagination.total);
        console.log('   Current page:', submissionsData.pagination.page);
        console.log('   Submissions on page:', submissionsData.submissions.length);
      } else {
        console.log('❌ Failed to get submissions:', submissionsResponse.status);
      }

    } else {
      const errorData = await registerResponse.json();
      console.log('❌ User registration failed:', errorData.error.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🎯 API test completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Check the logs for detailed information');
  console.log('   2. Visit http://localhost:8080 for database management');
  console.log('   3. Visit http://localhost:8081 for Redis management');
  console.log('   4. Review the README.md for more information');
}

// Run the test
testAPI().catch(console.error);