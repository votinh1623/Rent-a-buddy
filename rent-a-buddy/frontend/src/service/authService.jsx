// service/authService.jsx
import { postPublic } from '@/utils/publicRequest';

export const login = async (userData) => {
  try {
    const response = await postPublic('auth/login', userData);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await postPublic('auth/logout', {});
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const sendOtp = async (data) => {
  try {
    console.log('Sending OTP with data:', { 
      email: data.email, 
      name: data.name 
    });
    
    const response = await postPublic('auth/send-otp', data);
    console.log('OTP response:', response);
    return response;
  } catch (error) {
    console.error('Send OTP error details:', {
      status: error.status,
      message: error.message,
      data: error.data
    });
    throw error;
  }
};

export const verifyOtp = async (data) => {
  try {
    console.log('Verifying OTP for:', data.email);
    const response = await postPublic('auth/verify-otp', data);
    return response;
  } catch (error) {
    console.error('Verify OTP error:', error);
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const response = await postPublic('auth/refresh-token', {});
    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
};