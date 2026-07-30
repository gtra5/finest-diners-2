// Shared math for the simulated-map pin — extracted from Checkout.jsx so
// the driver tracking screen renders the same local, brand-styled map
// instead of duplicating this logic.
export const BASE_LAT = 6.5244;
export const BASE_LNG = 3.3792;
export const COORD_RANGE = 0.012;

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export const pinToCoords = (xPct, yPct) => ({
  lat: (BASE_LAT + ((50 - yPct) / 50) * COORD_RANGE).toFixed(6),
  lng: (BASE_LNG + ((xPct - 50) / 50) * COORD_RANGE).toFixed(6),
});

export const coordsToPin = (lat, lng) => ({
  x: clamp(50 + ((lng - BASE_LNG) / COORD_RANGE) * 50, 4, 96),
  y: clamp(50 - ((lat - BASE_LAT) / COORD_RANGE) * 50, 4, 96),
});