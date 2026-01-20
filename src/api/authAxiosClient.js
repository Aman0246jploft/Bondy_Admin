// src/api/authAxiosClient.js
import axios from 'axios';
import { baseURL } from './baseUrl';
import { useAuth } from '../auth/useAuth';

const authAxiosClient = axios.create({
  baseURL: baseURL,
  timeout: 10000,
});

authAxiosClient.interceptors.request.use((config) => {
  const token = useAuth().user
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
authAxiosClient.interceptors.response.use(
  (response) => {
    const { data } = response;

    // Handle application-level errors where HTTP status is 200 but status is false
    if (data?.status === false) {
      if (data.message === 'Invalid or expired token') {
        localStorage.removeItem('kadSunInfo');
        window.location.href = '/login';
      }
      const customError = new Error(data.message || 'Something went wrong');
      customError.responseCode = data.responseCode || 400;
      customError.isHandled = true;
      throw customError;
    }

    return response;
  },
  (error) => {
    // Check if the error response contains "Invalid or expired token"
    if (error.response?.data?.message === 'Invalid or expired token') {
      localStorage.removeItem('kadSunInfo');
      window.location.href = '/login';
    }

    // Allow axios to throw HTTP errors as usual, but with our structure
    const customError = new Error(
      error.response?.data?.message || error.message || 'Network error'
    );
    customError.responseCode =
      error.response?.data?.responseCode || error.response?.status || 500;
    customError.isHandled = true;
    throw customError;
  }
);

export default authAxiosClient;
