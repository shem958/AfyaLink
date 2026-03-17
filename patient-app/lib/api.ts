import axios from 'axios';
import { Platform } from 'react-native';

// When running on the Android Emulator, localhost is 10.0.2.2
// When running on iOS Simulator or Web, localhost is localhost
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api';
  }
  return 'http://localhost:8080/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let authToken: string | null = null;

export const setToken = (token: string) => {
  authToken = token;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
});

export const autoLoginMVP = async () => {
  try {
    const res = await api.post('/auth/login/patient', {
      phone: '0712345678',
      pin: '1234'
    });
    setToken(res.data.token);
    return true;
  } catch (err) {
    console.error('Auto login failed', err);
    return false;
  }
};

export default api;
