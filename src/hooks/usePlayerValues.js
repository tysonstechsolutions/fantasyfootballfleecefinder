import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAllPlayerValues, getCacheInfo } from '../services/ktc.js';
import { mergePlayerValues, adjustValuesForLeague } from '../services/values.js';

const REFRESH_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

/**
 * Custom hook for managing player values with KTC integration
 * Auto-refreshes from KTC every 4 hours
 * Returns loading/error states
 * Accepts leagueSettings parameter for adjustments
 *
 * @param {Object} leagueSettings - Optional league settings for value adjustments
 * @param {boolean} leagueSettings.superflex - Is superflex league
 * @param {boolean} leagueSettings.tePremium - Is TE premium league
 * @param {number} leagueSettings.ppr - PPR scoring (1.0 = full, 0.5 = half, 0 = standard)
 * @param {number} leagueSettings.leagueSize - Number of teams (10, 12, 14, etc.)
 * @param {boolean} autoRefresh - Whether to auto-refresh values (default: true)
 *
 * @returns {Object} {
 *   playerValues: Object - Current player values (adjusted for league settings if provided)
 *   rawValues: Object - Unadjusted values from KTC/static
 *   loading: boolean - Whether values are currently being fetched
 *   error: string|null - Error message if fetch failed
 *   lastUpdated: Date|null - When values were last updated
 *   refresh: Function - Manually trigger a refresh
 *   cacheInfo: Object - Information about the cache state
 * }
 */
export function usePlayerValues(leagueSettings = null, autoRefresh = true) {
  const [rawValues, setRawValues] = useState({});
  const [playerValues, setPlayerValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [cacheInfo, setCacheInfo] = useState(null);

  const refreshIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch and process player values
   */
  const fetchValues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch raw values from KTC (or cache/fallback)
      const ktcValues = await fetchAllPlayerValues();

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      setRawValues(ktcValues);

      // Apply league adjustments if settings provided
      let adjusted = ktcValues;
      if (leagueSettings && Object.keys(leagueSettings).length > 0) {
        const merged = mergePlayerValues(ktcValues);
        adjusted = adjustValuesForLeague(merged, leagueSettings);
      }

      setPlayerValues(adjusted);
      setLastUpdated(new Date());

      // Update cache info
      const info = getCacheInfo();
      setCacheInfo(info);
    } catch (err) {
      console.error('Error fetching player values:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch player values');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [leagueSettings]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    fetchValues();
  }, [fetchValues]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    isMountedRef.current = true;
    fetchValues();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchValues]);

  /**
   * Set up auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh) return;

    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up new interval
    refreshIntervalRef.current = setInterval(() => {
      console.log('Auto-refreshing player values...');
      fetchValues();
    }, REFRESH_INTERVAL);

    // Cleanup on unmount or when autoRefresh changes
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchValues]);

  /**
   * Reprocess values when league settings change
   */
  useEffect(() => {
    if (Object.keys(rawValues).length === 0) return;

    let adjusted = rawValues;
    if (leagueSettings && Object.keys(leagueSettings).length > 0) {
      const merged = mergePlayerValues(rawValues);
      adjusted = adjustValuesForLeague(merged, leagueSettings);
    }

    setPlayerValues(adjusted);
  }, [leagueSettings, rawValues]);

  return {
    playerValues,
    rawValues,
    loading,
    error,
    lastUpdated,
    refresh,
    cacheInfo
  };
}

/**
 * Simplified hook that just returns current player values without auto-refresh
 * Useful for components that don't need the full feature set
 *
 * @param {Object} leagueSettings - Optional league settings
 * @returns {Object} Player values
 */
export function usePlayerValuesSimple(leagueSettings = null) {
  const { playerValues, loading } = usePlayerValues(leagueSettings, false);

  if (loading) {
    return {};
  }

  return playerValues;
}

/**
 * Hook for getting a single player's value
 * @param {string} playerName - Name of the player
 * @param {Object} leagueSettings - Optional league settings
 * @returns {Object} { value: number, loading: boolean, error: string|null }
 */
export function usePlayerValue(playerName, leagueSettings = null) {
  const { playerValues, loading, error } = usePlayerValues(leagueSettings, false);

  const value = playerValues[playerName] || 0;

  return {
    value,
    loading,
    error
  };
}

export default usePlayerValues;
