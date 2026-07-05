/**
 * Geofence helper utility for project coordinates mapping.
 */

export interface GeofenceConfig {
  lat: number;
  lng: number;
  radius: number; // in meters
}

export interface ParsedLocation {
  name: string;
  geofence: GeofenceConfig | null;
}

/**
 * Parses a project location string to extract its display name and geofence config.
 * Format: "Location Name|geofence:latitude,longitude,radius"
 */
export function parseLocationGeofence(locationStr: string | null): ParsedLocation {
  if (!locationStr) {
    return { name: '', geofence: null };
  }

  const parts = locationStr.split('|geofence:');
  if (parts.length < 2) {
    return { name: locationStr, geofence: null };
  }

  const name = parts[0];
  const geoParts = parts[1].split(',');

  if (geoParts.length >= 2) {
    const lat = parseFloat(geoParts[0]);
    const lng = parseFloat(geoParts[1]);
    const radius = parseFloat(geoParts[2] || '100');

    if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
      return {
        name,
        geofence: { lat, lng, radius }
      };
    }
  }

  return { name: locationStr, geofence: null };
}

/**
 * Formats a project location and geofence configuration into the DB representation.
 */
export function formatLocationGeofence(
  name: string,
  lat: number | null,
  lng: number | null,
  radius: number | null
): string {
  const cleanName = (name || '').trim();
  if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
    const r = radius !== null && !isNaN(radius) ? radius : 100;
    return `${cleanName}|geofence:${lat},${lng},${r}`;
  }
  return cleanName;
}

/**
 * Calculates the distance in meters between two GPS coordinates using the Haversine formula.
 */
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
    Math.cos(phi2) *
    Math.sin(deltaLambda / 2) *
    Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

/**
 * Finds if coordinates fall within the geofence of any project.
 * Returns the matching project and the distance if found, or null otherwise.
 */
export function findProjectForCoordinates(
  lat: number,
  lng: number,
  projects: Array<{ project_code: string; project_name: string; project_location: string | null }>
): { project: typeof projects[0]; distance: number } | null {
  for (const project of projects) {
    const { geofence } = parseLocationGeofence(project.project_location);
    if (geofence) {
      const distance = getDistanceInMeters(lat, lng, geofence.lat, geofence.lng);
      if (distance <= geofence.radius) {
        return { project, distance };
      }
    }
  }
  return null;
}

/**
 * Parses a punch's mobile_location and device location to separate coordinates and display location name.
 */
export function parsePunchLocation(
  mobileLocation: string | null | undefined,
  deviceLocation: string | null | undefined
): { location: string; coordinates: string } {
  if (!mobileLocation) {
    return { location: deviceLocation ?? '—', coordinates: '' };
  }

  // Check new format first: "lat, lng @ Location Name"
  const newFormatParts = mobileLocation.split(' @ ');
  if (newFormatParts.length > 1) {
    return {
      coordinates: newFormatParts[0].trim(),
      location: newFormatParts[1].trim()
    };
  }

  // Check old format: "lat, lng (CODE - Location Name)"
  const oldFormatMatch = mobileLocation.match(/^\s*(-?\d+\.\d+\s*,\s*-?\d+\.\d+)\s*\((?:[A-Za-z0-9#_-]+\s*-\s*)?([^\)]+)\)/);
  if (oldFormatMatch) {
    return {
      coordinates: oldFormatMatch[1].trim(),
      location: oldFormatMatch[2].trim()
    };
  }

  // Check just coordinates: "lat, lng"
  const coordsMatch = mobileLocation.match(/^\s*(-?\d+\.\d+\s*,\s*-?\d+\.\d+)/);
  if (coordsMatch) {
    return {
      coordinates: coordsMatch[1].trim(),
      location: 'Un-Mapped'
    };
  }

  return { location: mobileLocation.trim(), coordinates: '' };
}

