// Value History Service - Tracks player value trends over time

const STORAGE_KEY = 'fff_value_history';
const MAX_HISTORY_DAYS = 365; // Keep 1 year of history

/**
 * Store a snapshot of current player values with timestamp
 * @param {Object} playerValues - Object mapping player names to their values
 */
export function storeValueSnapshot(playerValues) {
  try {
    const history = getFullHistory();
    const timestamp = Date.now();
    const dateStr = new Date(timestamp).toISOString().split('T')[0];

    // Check if we already have a snapshot for today
    if (history[dateStr]) {
      console.log('Value snapshot already exists for today');
      return;
    }

    // Store the snapshot
    history[dateStr] = {
      timestamp,
      date: dateStr,
      values: playerValues
    };

    // Clean old entries (keep last 365 days)
    cleanOldHistory(history);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    console.log(`Stored value snapshot for ${dateStr} with ${Object.keys(playerValues).length} players`);
  } catch (error) {
    console.error('Failed to store value snapshot:', error);
  }
}

/**
 * Get value history for a specific player
 * @param {string} playerName - Player's full name
 * @param {number} days - Number of days to look back (30, 60, or 90)
 * @returns {Array} Array of {date, value} objects
 */
export function getValueHistory(playerName, days = 30) {
  try {
    const history = getFullHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const playerHistory = [];

    Object.keys(history)
      .sort() // Sort by date string (YYYY-MM-DD format sorts chronologically)
      .forEach(dateStr => {
        const snapshot = history[dateStr];
        const snapshotDate = new Date(snapshot.timestamp);

        if (snapshotDate >= cutoffDate && snapshot.values[playerName]) {
          playerHistory.push({
            date: dateStr,
            timestamp: snapshot.timestamp,
            value: snapshot.values[playerName]
          });
        }
      });

    return playerHistory;
  } catch (error) {
    console.error('Failed to get value history:', error);
    return [];
  }
}

/**
 * Calculate the trend for a player (Rising/Falling/Stable)
 * @param {string} playerName - Player's full name
 * @returns {Object} {trend: 'rising'|'falling'|'stable', change: number, changePercent: number}
 */
export function calculateTrend(playerName) {
  try {
    const history = getValueHistory(playerName, 30); // Last 30 days

    if (history.length < 2) {
      return { trend: 'stable', change: 0, changePercent: 0, insufficient: true };
    }

    const oldest = history[0].value;
    const newest = history[history.length - 1].value;
    const change = newest - oldest;
    const changePercent = oldest > 0 ? (change / oldest) * 100 : 0;

    let trend = 'stable';
    if (changePercent > 5) trend = 'rising';
    else if (changePercent < -5) trend = 'falling';

    return {
      trend,
      change: Math.round(change),
      changePercent: Math.round(changePercent * 10) / 10,
      dataPoints: history.length,
      oldestValue: oldest,
      newestValue: newest,
      period: '30d'
    };
  } catch (error) {
    console.error('Failed to calculate trend:', error);
    return { trend: 'stable', change: 0, changePercent: 0, error: true };
  }
}

/**
 * Get trend badge info for UI display
 * @param {string} playerName - Player's full name
 * @returns {Object} {icon, color, label, tooltip}
 */
export function getTrendBadge(playerName) {
  const trendData = calculateTrend(playerName);

  if (trendData.insufficient) {
    return {
      icon: '📊',
      color: '#6b7280',
      label: 'New',
      tooltip: 'Insufficient data'
    };
  }

  if (trendData.trend === 'rising') {
    return {
      icon: '📈',
      color: '#10b981',
      label: `+${trendData.changePercent}%`,
      tooltip: `Up ${trendData.change} in last 30 days`
    };
  }

  if (trendData.trend === 'falling') {
    return {
      icon: '📉',
      color: '#ef4444',
      label: `${trendData.changePercent}%`,
      tooltip: `Down ${Math.abs(trendData.change)} in last 30 days`
    };
  }

  return {
    icon: '➡️',
    color: '#6b7280',
    label: 'Stable',
    tooltip: `${trendData.changePercent >= 0 ? '+' : ''}${trendData.changePercent}% in last 30 days`
  };
}

/**
 * Compare value history of two players
 * @param {string} player1Name
 * @param {string} player2Name
 * @param {number} days
 * @returns {Object} Combined history data for comparison
 */
export function comparePlayerHistory(player1Name, player2Name, days = 30) {
  const history1 = getValueHistory(player1Name, days);
  const history2 = getValueHistory(player2Name, days);

  // Create a combined dataset with all dates
  const allDates = new Set([
    ...history1.map(h => h.date),
    ...history2.map(h => h.date)
  ]);

  const combined = Array.from(allDates).sort().map(date => {
    const p1Data = history1.find(h => h.date === date);
    const p2Data = history2.find(h => h.date === date);

    return {
      date,
      [player1Name]: p1Data?.value || null,
      [player2Name]: p2Data?.value || null
    };
  });

  // Calculate crossover points (where player values intersect)
  const crossovers = [];
  for (let i = 1; i < combined.length; i++) {
    const prev = combined[i - 1];
    const curr = combined[i];

    if (prev[player1Name] && prev[player2Name] && curr[player1Name] && curr[player2Name]) {
      const p1WasHigher = prev[player1Name] > prev[player2Name];
      const p1IsHigher = curr[player1Name] > curr[player2Name];

      if (p1WasHigher !== p1IsHigher) {
        crossovers.push({
          date: curr.date,
          value: Math.round((curr[player1Name] + curr[player2Name]) / 2)
        });
      }
    }
  }

  return {
    data: combined,
    crossovers,
    player1Trend: calculateTrend(player1Name),
    player2Trend: calculateTrend(player2Name)
  };
}

/**
 * Initialize value tracking - should be called on app load
 * @param {Array} allPlayers - Array of player objects with names and values
 */
export function initializeValueTracking(allPlayers) {
  try {
    // Check if we need to store a snapshot today
    const history = getFullHistory();
    const today = new Date().toISOString().split('T')[0];

    if (!history[today] && allPlayers && allPlayers.length > 0) {
      const playerValues = {};
      allPlayers.forEach(player => {
        const name = player.name || `${player.firstName} ${player.lastName}`;
        if (player.value && player.value > 0) {
          playerValues[name] = player.value;
        }
      });

      if (Object.keys(playerValues).length > 0) {
        storeValueSnapshot(playerValues);
      }
    }
  } catch (error) {
    console.error('Failed to initialize value tracking:', error);
  }
}

/**
 * Get all stored history (internal helper)
 */
function getFullHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to parse value history:', error);
    return {};
  }
}

/**
 * Clean old history entries (internal helper)
 */
function cleanOldHistory(history) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);

  Object.keys(history).forEach(dateStr => {
    const snapshot = history[dateStr];
    const snapshotDate = new Date(snapshot.timestamp);

    if (snapshotDate < cutoffDate) {
      delete history[dateStr];
    }
  });
}

/**
 * Generate mock historical data for testing (development only)
 */
export function generateMockHistory() {
  const players = [
    { name: 'Bijan Robinson', baseValue: 9500 },
    { name: 'Ja\'Marr Chase', baseValue: 9500 },
    { name: 'Justin Jefferson', baseValue: 9200 },
    { name: 'CeeDee Lamb', baseValue: 9000 },
    { name: 'Jahmyr Gibbs', baseValue: 9200 },
    { name: 'Breece Hall', baseValue: 7500 },
    { name: 'Amon-Ra St. Brown', baseValue: 8500 },
    { name: 'Travis Hunter', baseValue: 7500 },
    { name: 'Drake London', baseValue: 7200 },
    { name: 'Garrett Wilson', baseValue: 7000 }
  ];

  const history = {};

  // Generate 90 days of history
  for (let i = 90; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const values = {};
    players.forEach(player => {
      // Add some random variation and trends
      const dayFactor = (90 - i) / 90; // 0 to 1 over time
      const randomVariation = (Math.random() - 0.5) * 0.1; // +/- 5%
      const trend = Math.sin(i / 10) * 0.05; // Sine wave trend

      const value = player.baseValue * (1 + randomVariation + trend + (dayFactor * 0.1));
      values[player.name] = Math.round(value);
    });

    history[dateStr] = {
      timestamp: date.getTime(),
      date: dateStr,
      values
    };
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  console.log('Generated mock history for 90 days');
}

/**
 * Clear all value history (for testing or reset)
 */
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  console.log('Value history cleared');
}

export default {
  storeValueSnapshot,
  getValueHistory,
  calculateTrend,
  getTrendBadge,
  comparePlayerHistory,
  initializeValueTracking,
  generateMockHistory,
  clearHistory
};
