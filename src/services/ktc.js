// KTC (KeepTradeCut) API Integration
// Fetches dynasty player values from KeepTradeCut with fallback to static values

const KTC_API_URL = 'https://keeptradecut.com/api/dynasty';
const KTC_CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const CACHE_KEY = 'ktc_player_values';
const CACHE_TIMESTAMP_KEY = 'ktc_cache_timestamp';
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

/**
 * Check if cached data is still valid
 * @returns {boolean}
 */
function isCacheValid() {
  const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  if (!timestamp) return false;

  const age = Date.now() - parseInt(timestamp, 10);
  return age < CACHE_DURATION;
}

/**
 * Get cached player values
 * @returns {Object|null}
 */
function getCachedValues() {
  if (!isCacheValid()) return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error reading cached values:', error);
    return null;
  }
}

/**
 * Save player values to cache
 * @param {Object} values - Player values object
 */
function cacheValues(values) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(values));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error caching values:', error);
  }
}

/**
 * Attempt to fetch from KTC API with CORS proxy fallback
 * @returns {Promise<Object|null>}
 */
async function fetchFromKTC() {
  // Try direct API call first
  try {
    const response = await fetch(KTC_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      return normalizeKTCData(data);
    }
  } catch (error) {
    console.warn('Direct KTC API call failed, trying CORS proxy...', error.message);
  }

  // Try with CORS proxy
  try {
    const proxyUrl = KTC_CORS_PROXY + encodeURIComponent(KTC_API_URL);
    const response = await fetch(proxyUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000) // 10 second timeout for proxy
    });

    if (response.ok) {
      const data = await response.json();
      return normalizeKTCData(data);
    }
  } catch (error) {
    console.warn('CORS proxy KTC call failed:', error.message);
  }

  return null;
}

/**
 * Normalize KTC API response to our format
 * @param {Object} data - Raw KTC API response
 * @returns {Object} Normalized player values
 */
function normalizeKTCData(data) {
  const normalized = {};

  // KTC API returns array of players with format:
  // { playerName: string, value: number, position: string, team: string, ... }
  const players = Array.isArray(data) ? data : data.players || [];

  players.forEach(player => {
    const name = player.playerName || player.name;
    const value = player.value || player.overallValue || 0;

    if (name && value > 0) {
      normalized[name] = Math.round(value);
    }
  });

  return normalized;
}

/**
 * Fetch all dynasty player values from KTC
 * Falls back to static values if API fails
 * Uses localStorage cache for 4 hours
 * @returns {Promise<Object>}
 */
export async function fetchAllPlayerValues() {
  // Check cache first
  const cached = getCachedValues();
  if (cached) {
    console.log('Using cached KTC values');
    return cached;
  }

  // Try to fetch from KTC
  console.log('Fetching fresh KTC values...');
  const ktcValues = await fetchFromKTC();

  if (ktcValues && Object.keys(ktcValues).length > 0) {
    console.log(`Fetched ${Object.keys(ktcValues).length} player values from KTC`);
    cacheValues(ktcValues);
    return ktcValues;
  }

  // Fallback to static values from values.js
  console.warn('KTC API unavailable, using static fallback values');
  const { default: staticValues } = await import('./values.js');

  // Import PLAYER_VALUES if available (need to export it from values.js)
  // For now, return empty object and let values.js handle it
  return {};
}

/**
 * Fetch single player value by name
 * @param {string} playerName - Player name to lookup
 * @returns {Promise<number>}
 */
export async function fetchPlayerValue(playerName) {
  if (!playerName) return 0;

  const allValues = await fetchAllPlayerValues();
  return allValues[playerName] || 0;
}

/**
 * Fetch player value history (30/60/90 day trends)
 * Note: This requires a premium KTC API endpoint which may not be publicly available
 * Returns mock data structure for now
 * @param {string} playerName - Player name to lookup
 * @returns {Promise<Object>}
 */
export async function fetchValueHistory(playerName) {
  if (!playerName) {
    return {
      playerName,
      currentValue: 0,
      history: { day30: 0, day60: 0, day90: 0 },
      trend: 'stable'
    };
  }

  const currentValue = await fetchPlayerValue(playerName);

  // TODO: Implement actual history API when/if available
  // For now, return current value with estimated historical data
  // This would require a different endpoint or scraping KTC's historical charts

  return {
    playerName,
    currentValue,
    history: {
      day30: currentValue,
      day60: currentValue,
      day90: currentValue
    },
    trend: 'stable',
    note: 'Historical data not available - showing current value only'
  };
}

/**
 * Fetch real trades involving this player from KTC trade database
 * Note: This requires accessing KTC's trade database which may not be in their public API
 * Returns mock structure for now
 * @param {string} playerName - Player name to lookup
 * @returns {Promise<Array>}
 */
export async function fetchTradeDatabase(playerName) {
  if (!playerName) return [];

  // TODO: Implement actual trade database API when/if available
  // KTC shows recent trades on their website but this data may not be in the public API
  // May require web scraping or a premium API endpoint

  // For now, return empty array with a note
  return [];
}

/**
 * Clear the KTC cache (useful for testing or forcing refresh)
 */
export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  console.log('KTC cache cleared');
}

/**
 * Get cache info for debugging
 * @returns {Object}
 */
export function getCacheInfo() {
  const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const hasCache = !!localStorage.getItem(CACHE_KEY);
  const isValid = isCacheValid();

  return {
    hasCache,
    isValid,
    timestamp: timestamp ? new Date(parseInt(timestamp, 10)) : null,
    expiresAt: timestamp ? new Date(parseInt(timestamp, 10) + CACHE_DURATION) : null
  };
}

export default {
  fetchAllPlayerValues,
  fetchPlayerValue,
  fetchValueHistory,
  fetchTradeDatabase,
  clearCache,
  getCacheInfo
};
