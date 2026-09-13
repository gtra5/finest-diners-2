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

// Auth endpoints return 401 for wrong credentials/OTP — those must NOT bounce
// the user to the login page (the form itself shows the error).
const isAuthAttempt = (url = '') =>
  /\/auth\/login(\/|$)|\/auth\/register(\/|$)|\/auth\/otp\//.test(url);

// Global response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthAttempt(error.config?.url)) {
      // Session expired or token became invalid. Clear the stored session and
      // dispatch a signal so the app can navigate to /login as a single-page
      // update (with state preserved) instead of a hard window reload.
      localStorage.removeItem('token');
      localStorage.removeItem('finest-auth');
      window.dispatchEvent(new Event('finest:unauthorized'));
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
export const initializePayment = async (orderId, _amount, email) => {
  // Amount is intentionally NOT sent — the server reads the authoritative
  // order total from the database to prevent price tampering.
  const { data } = await api.post('/payments/initialize', {
    orderId,
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

// Customer confirms they've received a delivered order
export const confirmReceipt = async (orderId) => {
  const { data } = await api.put(`/orders/${orderId}/receive`);
  return data;
};

// Customer submits a complaint for a delivered/received order
export const submitComplaint = async (orderId, complaint) => {
  const { data } = await api.post('/complaints', { orderId, complaint });
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

// Calculate ETA and distance between two coordinates using OSRM
export const calculateRoute = async (fromLat, fromLng, toLat, toLng) => {
  const { data } = await api.get('/location/route', {
    params: { fromLat, fromLng, toLat, toLng },
  });
  return data;
};

export default api;