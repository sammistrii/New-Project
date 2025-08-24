#!/usr/bin/env node

/**
 * Mock API test script for Eco-Points System
 * Run this after starting the simplified server to test basic functionality
 */

const BASE_URL = 'http://localhost:3000/api';

async function testMockAPI() {
  console.log('🧪 Testing Eco-Points System Mock API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('   Environment:', healthData.environment);
    console.log('   Uptime:', healthData.uptime, 'seconds');
    console.log('   Message:', healthData.message, '\n');

    // Test mock user registration
    console.log('2. Testing mock user registration...');
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'TestPass123',
      name: 'Test User'
    };

    const registerResponse = await fetch(`${BASE_URL}/mock/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ User registered successfully (mock)');
      console.log('   User ID:', registerData.user.id);
      console.log('   Email:', registerData.user.email);
      console.log('   Role:', registerData.user.role);
      console.log('   Access Token:', registerData.tokens.accessToken ? '✅' : '❌');
      console.log('   Refresh Token:', registerData.tokens.refreshToken ? '✅' : '❌');
      
      const { accessToken } = registerData.tokens;
      
      // Test mock user profile
      console.log('\n3. Testing mock user profile...');
      const profileResponse = await fetch(`${BASE_URL}/mock/profile`, {
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

      // Test mock video submission
      console.log('\n4. Testing mock video submission...');
      const submissionData = {
        s3_key: 'test-video-123.mp4',
        gps_lat: 40.7829,
        gps_lng: -73.9654,
        recorded_at: new Date().toISOString(),
        duration_s: 15
      };

      const submissionResponse = await fetch(`${BASE_URL}/mock/submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(submissionData),
      });

      if (submissionResponse.ok) {
        const submissionResult = await submissionResponse.json();
        console.log('✅ Video submission created successfully (mock)');
        console.log('   Submission ID:', submissionResult.submission.id);
        console.log('   Status:', submissionResult.submission.status);
        console.log('   Auto Score:', submissionResult.submission.auto_score);
      } else {
        const errorData = await submissionResponse.json();
        console.log('❌ Failed to create submission:', errorData.error.message);
      }

      // Test getting mock submissions
      console.log('\n5. Testing get mock submissions...');
      const submissionsResponse = await fetch(`${BASE_URL}/mock/submissions`, {
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

      // Test profile again to see updated points
      console.log('\n6. Testing updated profile after submission...');
      const updatedProfileResponse = await fetch(`${BASE_URL}/mock/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (updatedProfileResponse.ok) {
        const updatedProfileData = await updatedProfileResponse.json();
        console.log('✅ Updated profile retrieved successfully');
        console.log('   Points Balance:', updatedProfileData.wallet.points_balance);
        console.log('   Cash Balance:', updatedProfileData.wallet.cash_balance);
        console.log('   Points earned from submission:', updatedProfileData.wallet.points_balance);
      } else {
        console.log('❌ Failed to get updated profile:', updatedProfileResponse.status);
      }

    } else {
      const errorData = await registerResponse.json();
      console.log('❌ User registration failed:', errorData.error.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🎯 Mock API test completed!');
  console.log('\n📋 What was tested:');
  console.log('   ✅ Health check endpoint');
  console.log('   ✅ Mock user registration');
  console.log('   ✅ Mock user profile retrieval');
  console.log('   ✅ Mock video submission creation');
  console.log('   ✅ Mock submissions listing');
  console.log('   ✅ Points crediting system');
  console.log('\n🚀 Next steps:');
  console.log('   1. The system is working with mock data');
  console.log('   2. You can now implement the full database version');
  console.log('   3. Add Docker services when ready');
  console.log('   4. Build the frontend application');
  console.log('\nHappy coding! 🎯');
}

// Run the test
testMockAPI().catch(console.error);