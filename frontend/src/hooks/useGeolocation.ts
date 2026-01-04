import { useState, useEffect } from 'react';
import { getUserLocation, Coordinates, LocationError } from '@/utils/location';

interface UseGeolocationReturn {
  location: Coordinates | null;
  error: LocationError | null;
  loading: boolean;
  getLocation: () => void;
  requestLocation: () => void; // Alias for compatibility
  clearLocation: () => void;
}

/**
 * Reusable hook for geolocation
 * @param autoFetch - Automatically fetch location on mount
 */
export const useGeolocation = (autoFetch = false): UseGeolocationReturn => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const coords = await getUserLocation();
      setLocation(coords);
      
      // Save to localStorage for later use
      localStorage.setItem('userLocation', JSON.stringify(coords));
    } catch (err) {
      setError(err as LocationError);
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setError(null);
    localStorage.removeItem('userLocation');
  };

  useEffect(() => {
    if (autoFetch) {
      // Try to load from localStorage first
      const saved = localStorage.getItem('userLocation');
      if (saved) {
        try {
          setLocation(JSON.parse(saved));
        } catch (e) {
          console.warn('Failed to parse saved location', e);
          getLocation();
        }
      } else {
        getLocation();
      }
    }
  }, [autoFetch]);

  return { 
    location, 
    error, 
    loading, 
    getLocation, 
    requestLocation: getLocation, // Alias for backward compatibility
    clearLocation 
  };
};

