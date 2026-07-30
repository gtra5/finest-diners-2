import { useState, useCallback } from 'react';

export const useGeolocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const { latitude, longitude } = position.coords;
      return { latitude, longitude };
    } catch (err) {
      let errorMessage = 'Failed to get your location';
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Please enable location access in your browser settings';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable';
          break;
        case err.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
        default:
          errorMessage = 'An unknown error occurred getting your location';
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getCurrentLocation, loading, error };
};
