// frontend/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // This is crucial for sending cookies
  // timeout: 10000, // Add timeout to prevent hanging requests
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting Request', request.url);
  return request;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.message);
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.';
    } else if (!error.response) {
      error.message = 'Network error. Please check if the server is running.';
    }
    return Promise.reject(error);
  }
);

export default api;