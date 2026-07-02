import axios from 'axios';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = join(__dirname, 'geocoding-cache.json');

const GEOCODE_API = 'https://mmapi.etch.app/geocode';
const ORGANIZATION_ID = '3738f2ea-ddc0-4d86-9a8a-4f2ed531a486';

// Load cache from file
let geocodeCache = {};
if (existsSync(CACHE_FILE)) {
  try {
    const cacheContent = readFileSync(CACHE_FILE, 'utf8');
    geocodeCache = JSON.parse(cacheContent);
    console.log(`📍 Loaded ${Object.keys(geocodeCache).length} cached geocoding results`);
  } catch (error) {
    console.warn('⚠️  Failed to load geocoding cache, starting fresh');
    geocodeCache = {};
  }
}

// Save cache to file
function saveCache() {
  try {
    writeFileSync(CACHE_FILE, JSON.stringify(geocodeCache, null, 2));
  } catch (error) {
    console.warn('⚠️  Failed to save geocoding cache:', error.message);
  }
}

/**
 * Forward geocode an address or place name to coordinates
 * @param {string} query - The address or place name to geocode
 * @param {Object} options - Optional parameters
 * @param {number} options.limit - Number of results to return (default: 1)
 * @param {Object} options.center - Center point for proximity ranking {lat, lon}
 * @returns {Promise<Object>} - First geocoding result with {lat, lon}
 */
export async function geocode(query, options = {}) {
  // Create cache key from query and options
  const cacheKey = JSON.stringify({ query, center: options.center });

  // Check cache first
  if (geocodeCache[cacheKey]) {
    console.log(`  💾 Using cached result for: ${query}`);
    return geocodeCache[cacheKey];
  }

  try {
    const params = new URLSearchParams({
      query: query,
      limit: options.limit || 1,
      org: ORGANIZATION_ID
    });

    // Add center if provided
    if (options.center) {
      params.append('center', `${options.center.lon},${options.center.lat}`);
    }

    console.log(`  🔍 Geocoding: ${query}`);
    const response = await axios.get(`${GEOCODE_API}?${params.toString()}`);

    if (!response.data || response.data.length === 0) {
      throw new Error(`No results found for: ${query}`);
    }

    // Return first result with lat/lon format
    const result = response.data[0];
    const geocodeResult = {
      lat: result.point.lat,
      lon: result.point.lng,
      title: result.title,
      description: result.description || result.address
    };

    // Cache the result
    geocodeCache[cacheKey] = geocodeResult;
    saveCache();

    return geocodeResult;
  } catch (error) {
    if (error.response) {
      throw new Error(`Geocoding failed: ${error.response.status} ${error.response.statusText}`);
    }
    throw error;
  }
}

/**
 * Reverse geocode coordinates to an address
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Geocoding result with address info
 */
export async function reverseGeocode(lat, lon) {
  try {
    const params = new URLSearchParams({
      query: `${lon},${lat}`,
      limit: 1
    });

    const response = await axios.get(`${GEOCODE_API}?${params.toString()}`);

    if (!response.data || response.data.length === 0) {
      return {
        lat: lat,
        lon: lon,
        title: 'Unknown location',
        description: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
      };
    }

    const result = response.data[0];
    return {
      lat: result.point.lat,
      lon: result.point.lng,
      title: result.title,
      description: result.description || result.address
    };
  } catch (error) {
    // Return coordinates if reverse geocoding fails
    return {
      lat: lat,
      lon: lon,
      title: 'Unknown location',
      description: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
    };
  }
}

/**
 * Process a location that can be either coordinates or a place name
 * @param {Object|string} location - Either {lat, lon} or a place name string
 * @param {Object} options - Geocoding options
 * @returns {Promise<Object>} - Resolved location with {lat, lon, title, description}
 */
export async function resolveLocation(location, options = {}) {
  // If it's already coordinates, optionally reverse geocode for name
  if (typeof location === 'object' && location.lat && location.lon) {
    if (options.reverseGeocode) {
      return await reverseGeocode(location.lat, location.lon);
    }
    return {
      ...location,
      title: location.title || 'Custom location',
      description: location.description || `${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}`
    };
  }

  // If it's a string, forward geocode it
  if (typeof location === 'string') {
    return await geocode(location, options);
  }

  throw new Error('Location must be either coordinates {lat, lon} or a place name string');
}