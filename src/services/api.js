import axios from 'axios';

// Fail clearly if the env var is missing rather than silently hitting localhost
const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL) {
  throw new Error('VITE_API_URL is not set. Add it to your .env file.');
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Payment API functions
export const initializePayment = async (orderId, amount, email) => {
  const { data } = await api.post('/payments/initialize', {
    orderId,
    amount,
    email,
  });
  return data;
};

export const verifyPayment = async (reference) => {
  const { data } = await api.get(`/payments/verify/${reference}`);
  return data;
};

// Order API functions
export const createOrder = async (orderData) => {
  const { data } = await api.post('/orders', orderData);
  return data;
};

export const getOrder = async (orderId) => {
  const { data } = await api.get(`/orders/${orderId}`);
  return data;
};

// Location API function - IP-based geolocation
export const getLocationByIP = async () => {
  const { data } = await api.get('/location');
  return data;
};

export default api;