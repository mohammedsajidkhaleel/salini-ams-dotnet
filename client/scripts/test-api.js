/**
 * API Connectivity Test Script
 * Tests basic connectivity to the backend API
 */

const API_BASE_URL = 'http://localhost:5000';

async function testApiConnectivity() {
  console.log('🧪 Testing API Connectivity...\n');

  const tests = [
    {
      name: 'Health Check',
      url: `${API_BASE_URL}/health`,
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Swagger Documentation',
      url: `${API_BASE_URL}/swagger/v1/swagger.json`,
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Test Endpoint (Public)',
      url: `${API_BASE_URL}/api/test`,
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Test Endpoint (Auth Required)',
      url: `${API_BASE_URL}/api/test/auth`,
      method: 'GET',
      expectedStatus: 401 // Should return 401 without auth
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`URL: ${test.url}`);
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ PASS - Expected status ${test.expectedStatus}`);
        passedTests++;
      } else {
        console.log(`❌ FAIL - Expected status ${test.expectedStatus}, got ${response.status}`);
      }

      // Try to get response body for additional info
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`Response: ${JSON.stringify(data, null, 2)}`);
        } else {
          const text = await response.text();
          console.log(`Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
        }
      } catch (e) {
        console.log('Could not parse response body');
      }

    } catch (error) {
      console.log(`❌ FAIL - Network error: ${error.message}`);
    }

    console.log('---\n');
  }

  // Test authentication flow
  console.log('🔐 Testing Authentication Flow...\n');
  
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/api/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@salini.com',
        password: 'Admin@123'
      })
    });

    console.log(`Login Status: ${loginResponse.status} ${loginResponse.statusText}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      console.log(`Token received: ${loginData.token ? 'Yes' : 'No'}`);
      
      // Test authenticated endpoint
      if (loginData.token) {
        const authTestResponse = await fetch(`${API_BASE_URL}/api/test/auth`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log(`Authenticated Test Status: ${authTestResponse.status} ${authTestResponse.statusText}`);
        
        if (authTestResponse.ok) {
          console.log('✅ Authenticated endpoint accessible');
          passedTests++;
        } else {
          console.log('❌ Authenticated endpoint failed');
        }
      }
    } else {
      console.log('❌ Login failed');
      const errorData = await loginResponse.json();
      console.log(`Error: ${JSON.stringify(errorData, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Authentication test failed: ${error.message}`);
  }

  console.log('\n📊 Test Results:');
  console.log(`Passed: ${passedTests}/${totalTests + 1}`);
  console.log(`Success Rate: ${((passedTests / (totalTests + 1)) * 100).toFixed(1)}%`);

  if (passedTests === totalTests + 1) {
    console.log('🎉 All tests passed! API is ready for frontend integration.');
  } else {
    console.log('⚠️  Some tests failed. Please check the backend API.');
  }
}

// Run the tests
testApiConnectivity().catch(console.error);
