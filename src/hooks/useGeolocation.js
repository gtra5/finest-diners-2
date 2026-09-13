import { useState, useCallback } from 'react';
import { locateBest, getCachedCoords, cacheCoords } from '../utils/geo';

// Location hook built on the fast/resilient locator in utils/geo.
//
// getCurrentLocation()  -> best fix available (cache > GPS > IP). Resolves null
//                          with a human-friendly `error` only when nothing at all
//                          is reachable — it never throws and never fails silently.
// getCachedLocation()   -> the last known fix, instantly (no network/GPS wait).
export const useGeolocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await locateBest();
      cacheCoords(loc);
      return loc;
    } catch (err) {
      setError(
        err?.code === 'LOCATION_UNAVAILABLE'
          ? 'Could not get your location. Turn on Wi-Fi/GPS or allow browser location, then press Refresh.'
          : 'Could not get your location. Please try again.'
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCachedLocation = useCallback(() => {
    const loc = getCachedCoords();
    setError(null);
    return loc;
  }, []);

  return { getCurrentLocation, getCachedLocation, loading, error };
};