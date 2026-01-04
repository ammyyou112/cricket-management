/**
 * Location utilities for geolocation and distance calculations
 * No external API keys required - uses browser Geolocation API
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationError {
  code: number;
  message: string;
}

/**
 * Get user's current location using browser Geolocation API
 */
export const getUserLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        const errorMessages: Record<number, string> = {
          1: 'Location permission denied. Please enable location access in your browser settings.',
          2: 'Location information unavailable.',
          3: 'Location request timed out.',
        };
        reject({
          code: error.code,
          message: errorMessages[error.code] || 'Unknown error occurred',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert kilometers to miles
 */
export const kmToMiles = (km: number): number => {
  return km * 0.621371;
};

/**
 * Format distance for display
 */
export const formatDistance = (km: number, unit: 'km' | 'mi' = 'km'): string => {
  const distance = unit === 'mi' ? kmToMiles(km) : km;
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} ${unit}`;
};

/**
 * Get location name from coordinates using reverse geocoding (free service)
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
export const getLocationName = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'Cricket360-App/1.0', // Required by Nominatim
        },
      }
    );
    const data = await response.json();
    return data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Failed to get location name:', error);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

/**
 * Sort items by distance from user location
 */
export const sortByDistance = <T extends { locationLatitude?: number; locationLongitude?: number }>(
  items: T[],
  userLocation: Coordinates
): (T & { distance: number })[] => {
  return items
    .filter(item => item.locationLatitude && item.locationLongitude)
    .map(item => ({
      ...item,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.locationLatitude!,
        item.locationLongitude!
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Validate coordinates
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * Get distance category (for filtering)
 */
export const getDistanceCategory = (km: number): 'very-near' | 'near' | 'moderate' | 'far' => {
  if (km < 5) return 'very-near';
  if (km < 20) return 'near';
  if (km < 50) return 'moderate';
  return 'far';
};

