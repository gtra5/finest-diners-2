// Fast, resilient geolocation helpers.
//
// Priority when asking for a location:
//   1. cache         -> instant (≤10 min old coords keep the UI from sitting empty)
//   2. native GPS    -> browser geolocation with a SHORT timeout (usually <2s)
//   3. IP estimate   -> backend /location/ip (works even with location blocked)
//   4. throw         -> only if both native and IP fail; the UI turns that into a
//                       plain, specific message. No silent failures, no crashes.

const API_BASE = import.meta.env.VITE_API_URL || '';

const CACHE_KEY = 'fd:last-loc';
const ADDR_KEY = 'fd:addr-cache';
const COORDS_FRESH_MS = 10 * 60 * 1000; // reuse cached coords under this age
const ADDR_TTL_MS = 24 * 60 * 60 * 1000; // cached reverse-geocode lifetime
const NATIVE_TIMEOUT_MS = 6000;
const IP_TIMEOUT_MS = 3500;

const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return null; }
};

// ── Coordinates cache ────────────────────────────────────────────────────
export const getCachedCoords = () => {
  const c = safeParse(localStorage.getItem(CACHE_KEY));
  if (!c || !Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) return null;
  if (Date.now() - c.timestamp > COORDS_FRESH_MS) return null;
  return { latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy ?? null, source: c.source ?? 'cache' };
};

export const cacheCoords = ({ latitude, longitude, accuracy, source }) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ latitude, longitude, accuracy: accuracy ?? null, source: source ?? 'gps', timestamp: Date.now() }));
  } catch { /* storage full/blocked — non-fatal */ }
};

// ── Reverse-geocoded address cache ───────────────────────────────────────
const addrKey = (lat, lng) => `${lat.toFixed(4)},${lng.toFixed(4)}`;

export const getCachedAddress = (latitude, longitude) => {
  const all = safeParse(localStorage.getItem(ADDR_KEY));
  const hit = all?.[addrKey(latitude, longitude)];
  if (hit?.address && Date.now() - hit.timestamp < ADDR_TTL_MS) return hit.address;
  return null;
};

export const cacheAddress = (latitude, longitude, address) => {
  try {
    const all = safeParse(localStorage.getItem(ADDR_KEY)) || {};
    all[addrKey(latitude, longitude)] = { address, timestamp: Date.now() };
    // Bound the map so it can't grow forever (keep the 10 most recent).
    const entries = Object.entries(all).sort((a, b) => b[1].timestamp - a[1].timestamp).slice(0, 10);
    localStorage.setItem(ADDR_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch { /* non-fatal */ }
};

// ── Sources ──────────────────────────────────────────────────────────────
const nativePosition = (timeout = NATIVE_TIMEOUT_MS) =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation unsupported'));
      return;
    }
    const onSuccess = (pos) => resolve(pos.coords);
    const onError = (err) => reject(err);
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true, // Use GPS for precise location needed for delivery addresses
      timeout,
      maximumAge: 0, // Force fresh location, not cached
    });
  });

const ipPosition = async () => {
  const controller = new AbortController();
  const kill = setTimeout(() => controller.abort(), IP_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/location/ip`, { signal: controller.signal });
    if (!res.ok) throw new Error('ip lookup failed');
    const data = await res.json();
    if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) throw new Error('ip lookup empty');
    return { latitude: data.latitude, longitude: data.longitude, city: data.city, source: 'ip' };
  } finally {
    clearTimeout(kill);
  }
};

// Resolve the best location we can, fastest-first. Throws ONLY when nothing
// can be determined (native + IP both failed) so the caller can show a real
// message instead of failing silently.
export const locateBest = async () => {
  const cached = getCachedCoords();
  if (cached) return { ...cached, source: 'cache' };

  try {
    const coords = await nativePosition();
    return { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy ?? null, source: 'gps' };
  } catch (err) {
    if (err?.code === 1 /* PERMISSION_DENIED */) {
      // GPS blocked — IP estimate is better than nothing; UI says it's approximate.
      try {
        const ip = await ipPosition();
        return { ...ip, accuracy: 4000 };
      } catch { /* fall through */ }
    }
    // Other failures (timeout/unavailable): still try IP before giving up.
    if (!(err?.code === 1)) {
      try {
        const ip = await ipPosition();
        return { ...ip, accuracy: 4000 };
      } catch { /* fall through */ }
    }
  }

  const error = new Error('Location is unavailable on this device/network right now.');
  error.code = 'LOCATION_UNAVAILABLE';
  throw error;
};