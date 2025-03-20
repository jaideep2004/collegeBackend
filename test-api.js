const axios = require('axios');
require('dotenv').config();

const API_URL = `http://localhost:${process.env.PORT || 5000}/api`;
let authToken = '';

// Test functions
async function testPublicEndpoints() {
  console.log('\n--- Testing Public Endpoints ---');
  
  try {
    // Test departments endpoint
    try {
      const departmentsResponse = await axios.get(`${API_URL}/public/departments`);
      console.log('GET /public/departments:', departmentsResponse.status, departmentsResponse.data.success ? 'Success' : 'Failed');
    } catch (error) {
      console.log('GET /public/departments: Failed -', error.message);
      if (error.response) {
        console.log('Response data:', error.response.data);
        console.log('Response status:', error.response.status);
      }
    }
    
    // Test courses endpoint
    try {
      const coursesResponse = await axios.get(`${API_URL}/public/courses`);
      console.log('GET /public/courses:', coursesResponse.status, coursesResponse.data.success ? 'Success' : 'Failed');
    } catch (error) {
      console.log('GET /public/courses: Failed -', error.message);
      if (error.response) {
        console.log('Response data:', error.response.data);
        console.log('Response status:', error.response.status);
      }
    }
    
    // Test announcements endpoint
    try {
      const announcementsResponse = await axios.get(`${API_URL}/public/announcements`);
      console.log('GET /public/announcements:', announcementsResponse.status, announcementsResponse.data.success ? 'Success' : 'Failed');
    } catch (error) {
      console.log('GET /public/announcements: Failed -', error.message);
      if (error.response) {
        console.log('Response data:', error.response.data);
        console.log('Response status:', error.response.status);
      }
    }
    
    // Test gallery endpoint
    try {
      const galleryResponse = await axios.get(`${API_URL}/public/gallery`);
      console.log('GET /public/gallery:', galleryResponse.status, galleryResponse.data.success ? 'Success' : 'Failed');
    } catch (error) {
      console.log('GET /public/gallery: Failed -', error.message);
      if (error.response) {
        console.log('Response data:', error.response.data);
        console.log('Response status:', error.response.status);
      }
    }
    
  } catch (error) {
    console.error('Error testing public endpoints:', error.message);
  }
}

async function testAuthEndpoints() {
  console.log('\n--- Testing Auth Endpoints ---');
  
  try {
    // Test register endpoint
    const registerData = {
      rollNumber: `TEST${Date.now()}`,
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      mobile: `9${Math.floor(Math.random() * 1000000000)}`,
      password: 'password123',
      fatherName: 'Test Father',
      motherName: 'Test Mother',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      pinCode: '123456',
      dob: '2000-01-01',
      gender: 'Male',
      category: 'General'
    };
    
    console.log('Register data:', JSON.stringify(registerData));
    
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, registerData);
      console.log('POST /auth/register:', registerResponse.status, registerResponse.data.success ? 'Success' : 'Failed');
      
      // Save the token for future requests
      if (registerResponse.data.token) {
        authToken = registerResponse.data.token;
        console.log('Authentication token received');
      }
    } catch (error) {
      console.log('POST /auth/register: Failed -', error.message);
      if (error.response) {
        console.log('Response data:', error.response.data);
        console.log('Response status:', error.response.status);
      }
      
      // If registration fails, try login
      try {
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: registerData.email,
          password: registerData.password
        });
        console.log('POST /auth/login:', loginResponse.status, loginResponse.data.success ? 'Success' : 'Failed');
        
        // Save the token for future requests
        if (loginResponse.data.token) {
          authToken = loginResponse.data.token;
          console.log('Authentication token received');
        }
      } catch (loginError) {
        console.log('POST /auth/login: Failed -', loginError.message);
        if (loginError.response) {
          console.log('Response data:', loginError.response.data);
          console.log('Response status:', loginError.response.status);
        }
      }
    }
    
  } catch (error) {
    console.error('Error testing auth endpoints:', error.message);
  }
}

async function testStudentEndpoints() {
  if (!authToken) {
    console.log('\n--- Skipping Student Endpoints (No Auth Token) ---');
    return;
  }
  
  console.log('\n--- Testing Student Endpoints ---');
  
  try {
    // Test profile endpoint
    try {
      const profileResponse = await axios.get(`${API_URL}/student/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('GET /student/profile:', profileResponse.status, profileResponse.data.success ? 'Success' : 'Failed');
    } catch (error) {
      console.log('GET /student/profile: Failed -', error.message);
      if (error.response) {
        console.log('Response data:', error.response.data);
        console.log('Response status:', error.response.status);
      }
    }
    
    // Test documents endpoint
    try {
      const documentsResponse = await axios.get(`${API_URL}/student/documents/syllabus`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('GET /student/documents/syllabus:', documentsResponse.status, documentsResponse.data.success ? 'Success' : 'Failed');
    } catch (error) {
      console.log('GET /student/documents/syllabus: Failed -', error.message);
      if (error.response) {
        console.log('Response data:', error.response.data);
        console.log('Response status:', error.response.status);
      }
    }
    
    // Test courses endpoint
    try {
      const coursesResponse = await axios.get(`${API_URL}/student/courses`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('GET /student/courses:', coursesResponse.status, coursesResponse.data.success ? 'Success' : 'Failed');
    } catch (error) {
      console.log('GET /student/courses: Failed -', error.message);
      if (error.response) {
        console.log('Response data:', error.response.data);
        console.log('Response status:', error.response.status);
      }
    }
    
  } catch (error) {
    console.error('Error testing student endpoints:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('Starting API Tests...');
  console.log('API URL:', API_URL);
  
  await testPublicEndpoints();
  await testAuthEndpoints();
  await testStudentEndpoints();
  
  console.log('\nAPI Tests Completed');
}

runTests(); 