// Trade Database Service
// Manages a local database of trades for reference and analysis

import { getAllTrades, getPlayers } from './sleeper';
import { getPlayerValue, getPickValue } from './values';

const STORAGE_KEY = 'fff_trade_database';

// Initialize or get existing trade database from localStorage
function getDatabase() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { trades: [], lastSync: null };
  } catch (e) {
    console.error('Failed to load trade database:', e);
    return { trades: [], lastSync: null };
  }
}

// Save trade database to localStorage
function saveDatabase(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to save trade database:', e);
  }
}

// Sync trades from Sleeper league to local database
export async function syncLeagueTrades(leagueId, leagueSettings) {
  try {
    const [trades, players] = await Promise.all([
      getAllTrades(leagueId),
      getPlayers()
    ]);

    const db = getDatabase();
    const leagueType = leagueSettings?.settings?.type === 2 ? 'SF' : '1QB';
    const totalRosters = leagueSettings?.total_rosters || 12;

    // Convert Sleeper trades to our format
    const newTrades = trades.map(trade => {
      const sides = {};
      const rosterIds = trade.roster_ids || [];

      rosterIds.forEach(rosterId => {
        // Get players received by this roster
        const adds = trade.adds
          ? Object.entries(trade.adds)
              .filter(([pid, rid]) => rid === rosterId)
              .map(([pid]) => {
                const p = players[pid];
                if (!p) return null;
                const player = {
                  id: pid,
                  name: `${p.first_name} ${p.last_name}`,
                  position: p.position,
                  team: p.team,
                  age: p.age
                };
                return {
                  type: 'player',
                  player,
                  value: getPlayerValue(player)
                };
              })
              .filter(Boolean)
          : [];

        // Get picks received by this roster
        const picks = trade.draft_picks
          ? trade.draft_picks
              .filter(p => p.owner_id === rosterId)
              .map(pick => ({
                type: 'pick',
                pick: {
                  year: pick.season,
                  round: pick.round
                },
                value: getPickValue(pick.season, pick.round)
              }))
          : [];

        sides[rosterId] = [...adds, ...picks];
      });

      // Calculate total values for each side
      const values = {};
      Object.entries(sides).forEach(([rosterId, items]) => {
        values[rosterId] = items.reduce((sum, item) => sum + item.value, 0);
      });

      return {
        id: trade.transaction_id,
        date: trade.created,
        leagueId,
        leagueType,
        totalRosters,
        sides,
        values
      };
    });

    // Add new trades to database (avoid duplicates)
    const existingIds = new Set(db.trades.map(t => t.id));
    newTrades.forEach(trade => {
      if (!existingIds.has(trade.id)) {
        db.trades.push(trade);
      }
    });

    db.lastSync = Date.now();
    saveDatabase(db);

    return { success: true, tradesAdded: newTrades.length };
  } catch (err) {
    console.error('Failed to sync trades:', err);
    return { success: false, error: err.message };
  }
}

// Search for trades involving a specific player
export function searchTrades(playerName) {
  const db = getDatabase();
  const searchTerm = playerName.toLowerCase();

  const matchingTrades = db.trades.filter(trade => {
    // Check all sides for matching player
    return Object.values(trade.sides).some(items =>
      items.some(item =>
        item.type === 'player' &&
        item.player.name.toLowerCase().includes(searchTerm)
      )
    );
  });

  // Transform trades to show what the player was traded for
  const results = [];

  matchingTrades.forEach(trade => {
    Object.entries(trade.sides).forEach(([rosterId, items]) => {
      const playerItem = items.find(
        item => item.type === 'player' &&
        item.player.name.toLowerCase().includes(searchTerm)
      );

      if (playerItem) {
        // Find what they received for this player (other sides combined)
        const received = [];
        Object.entries(trade.sides).forEach(([otherId, otherItems]) => {
          if (otherId !== rosterId) {
            received.push(...otherItems);
          }
        });

        results.push({
          date: trade.date,
          player: playerItem.player,
          playerValue: playerItem.value,
          received,
          receivedValue: received.reduce((sum, item) => sum + item.value, 0),
          given: items.filter(i => i !== playerItem),
          givenValue: items.filter(i => i !== playerItem).reduce((sum, item) => sum + item.value, 0),
          leagueType: trade.leagueType,
          totalRosters: trade.totalRosters
        });
      }
    });
  });

  // Sort by date (most recent first)
  results.sort((a, b) => b.date - a.date);

  return results;
}

// Calculate average return for a player
export function calculateAverageReturn(playerName, trades = null) {
  const tradesToAnalyze = trades || searchTrades(playerName);

  if (tradesToAnalyze.length === 0) {
    return {
      avgValue: 0,
      lowValue: 0,
      highValue: 0,
      tradeCount: 0
    };
  }

  const values = tradesToAnalyze.map(t => t.receivedValue);
  const avgValue = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  const lowValue = Math.min(...values);
  const highValue = Math.max(...values);

  return {
    avgValue,
    lowValue,
    highValue,
    tradeCount: tradesToAnalyze.length
  };
}

// Add a manual trade to the database
export function addTradeToDatabase(trade) {
  const db = getDatabase();

  // Generate a unique ID
  const id = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newTrade = {
    id,
    date: trade.date || Date.now(),
    leagueId: 'manual',
    leagueType: trade.leagueType || '1QB',
    totalRosters: trade.totalRosters || 12,
    sides: trade.sides,
    values: {}
  };

  // Calculate values for each side
  Object.entries(newTrade.sides).forEach(([side, items]) => {
    newTrade.values[side] = items.reduce((sum, item) => sum + item.value, 0);
  });

  db.trades.push(newTrade);
  saveDatabase(db);

  return { success: true, tradeId: id };
}

// Get all trades from database
export function getAllDatabaseTrades() {
  const db = getDatabase();
  return db.trades;
}

// Get database statistics
export function getDatabaseStats() {
  const db = getDatabase();
  return {
    totalTrades: db.trades.length,
    lastSync: db.lastSync,
    leagueTypes: {
      '1QB': db.trades.filter(t => t.leagueType === '1QB').length,
      'SF': db.trades.filter(t => t.leagueType === 'SF').length
    }
  };
}

// Clear database
export function clearDatabase() {
  localStorage.removeItem(STORAGE_KEY);
  return { success: true };
}

export default {
  syncLeagueTrades,
  searchTrades,
  calculateAverageReturn,
  addTradeToDatabase,
  getAllDatabaseTrades,
  getDatabaseStats,
  clearDatabase
};
