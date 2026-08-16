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

// ── Simple in-memory GET cache with request deduping ────────────────────────
// For data that doesn't change often (the menu), caching avoids re-fetching on
// every visit. Concurrent identical requests share one promise instead of
// firing N parallel network calls.
const cache = new Map(); // url -> { promise, expiresAt }

export const cachedGet = (url, { ttl = 5 * 60 * 1000 } = {}) => {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && hit.expiresAt > now) return hit.promise;

  const promise = api
    .get(url)
    .then((res) => res.data)
    .catch((err) => {
      // Never cache failures — a transient error shouldn't poison the cache.
      cache.delete(url);
      throw err;
    });
  cache.set(url, { promise, expiresAt: now + ttl });
  return promise;
};

export const invalidateCache = (url) => {
  if (url) cache.delete(url);
  else cache.clear();
};

// Payment API functions
export const initializePayment = async (orderId, amount, email) => {
  const { data } = await api.post('/payments/initialize', {
    orderId,
    amount,
    email,
  });
  return data;
};export const verifyPayment = async (reference) => {
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

// Get the customer's exact GPS coordinates from the browser.
// Wraps the callback-based Geolocation API in a promise so it can be awaited
// like the rest of this file.
export const getBrowserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true, // use GPS, not just wifi/cell towers
        timeout: 10000,
        maximumAge: 0, // don't reuse a cached position
      }
    );
  });
};

// Reverse-geocode GPS coordinates into a readable address via our backend
// (backend calls OpenCage — see locationController.js)
export const getAddressFromCoords = async (latitude, longitude) => {
  const { data } = await api.get('/location/reverse', {
    params: { lat: latitude, lng: longitude },
  });
  return data;
};

export default api;