import { Team } from '../types/database.types';

export interface TeamLocation {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

/**
 * Format distance for display
 * Returns "500 m" for distances < 1km, otherwise "2.5 km"
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

/**
 * Generate mock location data for teams
 * Stores in sessionStorage to persist during session
 * Default center is Lahore, Pakistan (can be changed)
 */
export const generateMockTeamLocations = (teams: Team[]): Record<string, TeamLocation> => {
  const storageKey = 'mock_team_locations';
  const stored = sessionStorage.getItem(storageKey);
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Verify all teams have locations
      const allTeamsHaveLocations = teams.every(team => parsed[team.id]);
      if (allTeamsHaveLocations) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored team locations', e);
    }
  }

  // Default center (Lahore, Pakistan)
  // Can be changed to any city coordinates
  const centerLat = 31.5204;
  const centerLng = 74.3587;

  // Generate random locations within ~50km radius
  const mockLocations = teams.reduce((acc, team) => {
    // Random location within ~50km radius (approximately 0.45 degrees)
    const randomLat = centerLat + (Math.random() - 0.5) * 0.9;
    const randomLng = centerLng + (Math.random() - 0.5) * 0.9;
    
    acc[team.id] = {
      latitude: randomLat,
      longitude: randomLng
    };
    return acc;
  }, {} as Record<string, TeamLocation>);

  sessionStorage.setItem(storageKey, JSON.stringify(mockLocations));
  return mockLocations;
};

/**
 * Clear mock team locations (useful for testing)
 */
export const clearMockTeamLocations = () => {
  sessionStorage.removeItem('mock_team_locations');
};

