import React, { useState, useEffect } from 'react';
import { useApp } from '../../App';
import {
  syncLeagueTrades,
  searchTrades,
  calculateAverageReturn,
  addTradeToDatabase,
  getDatabaseStats
} from '../../services/tradeDatabase';
import { getPlayerValue } from '../../services/values';

function TradeDatabase() {
  const { league } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [avgReturn, setAvgReturn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dbStats, setDbStats] = useState(null);
  const [showAddTrade, setShowAddTrade] = useState(false);

  // Filters
  const [filterLeagueType, setFilterLeagueType] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterMinValue, setFilterMinValue] = useState('');
  const [filterMaxValue, setFilterMaxValue] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const stats = getDatabaseStats();
    setDbStats(stats);
  };

  const handleSync = async () => {
    if (!league?.league?.id) return;

    setSyncing(true);
    try {
      const result = await syncLeagueTrades(league.league.id, league.league);
      if (result.success) {
        loadStats();
        alert(`Successfully synced ${result.tradesAdded} trades to database!`);
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    }
    setSyncing(false);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    const results = searchTrades(searchQuery);

    // Apply filters
    let filtered = results;

    // League type filter
    if (filterLeagueType !== 'all') {
      filtered = filtered.filter(t => t.leagueType === filterLeagueType);
    }

    // Date range filter
    if (filterDateRange !== 'all') {
      const now = Date.now();
      const ranges = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };
      const range = ranges[filterDateRange];
      if (range) {
        filtered = filtered.filter(t => now - t.date < range);
      }
    }

    // Value range filter
    if (filterMinValue) {
      const min = parseInt(filterMinValue);
      filtered = filtered.filter(t => t.receivedValue >= min);
    }
    if (filterMaxValue) {
      const max = parseInt(filterMaxValue);
      filtered = filtered.filter(t => t.receivedValue <= max);
    }

    setSearchResults(filtered);

    // Calculate average return
    const avg = calculateAverageReturn(searchQuery, filtered);
    setAvgReturn(avg);

    setLoading(false);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatValue = (value) => {
    return value.toLocaleString();
  };

  const renderTradeItem = (item) => {
    if (item.type === 'player') {
      return (
        <div key={item.player.id} style={{
          padding: '6px 10px',
          background: 'var(--bg-secondary)',
          borderRadius: 6,
          fontSize: '0.875rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            <strong>{item.player.name}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
              {item.player.position} {item.player.team && `- ${item.player.team}`}
            </span>
          </span>
          <span style={{ color: 'var(--success)', fontWeight: 500 }}>
            {formatValue(item.value)}
          </span>
        </div>
      );
    } else if (item.type === 'pick') {
      return (
        <div key={`${item.pick.year}-${item.pick.round}`} style={{
          padding: '6px 10px',
          background: 'var(--bg-secondary)',
          borderRadius: 6,
          fontSize: '0.875rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            <span style={{ marginRight: 6 }}>📝</span>
            {item.pick.year} Round {item.pick.round}
          </span>
          <span style={{ color: 'var(--success)', fontWeight: 500 }}>
            {formatValue(item.value)}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Trade Database</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Search real trades to find market value for any player
        </p>

        {/* Database Stats */}
        {dbStats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div className="card" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Total Trades
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {dbStats.totalTrades}
              </div>
            </div>
            <div className="card" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                1QB Leagues
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {dbStats.leagueTypes['1QB']}
              </div>
            </div>
            <div className="card" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                SF Leagues
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {dbStats.leagueTypes.SF}
              </div>
            </div>
            <div className="card" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Last Sync
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {dbStats.lastSync ? formatDate(dbStats.lastSync) : 'Never'}
              </div>
            </div>
          </div>
        )}

        {/* Sync Button */}
        {league && (
          <button
            className="btn btn-secondary"
            onClick={handleSync}
            disabled={syncing}
            style={{ marginBottom: '16px' }}
          >
            {syncing ? 'Syncing...' : 'Sync League Trades'}
          </button>
        )}
      </div>

      {/* Search Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body">
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Search for a player
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input"
                placeholder="Enter player name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
              >
                Search
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>
                League Type
              </label>
              <select
                className="input"
                value={filterLeagueType}
                onChange={(e) => setFilterLeagueType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="1QB">1QB</option>
                <option value="SF">Superflex</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>
                Date Range
              </label>
              <select
                className="input"
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>
                Min Value
              </label>
              <input
                type="number"
                className="input"
                placeholder="0"
                value={filterMinValue}
                onChange={(e) => setFilterMinValue(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>
                Max Value
              </label>
              <input
                type="number"
                className="input"
                placeholder="10000"
                value={filterMaxValue}
                onChange={(e) => setFilterMaxValue(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Average Return Summary */}
      {avgReturn && avgReturn.tradeCount > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '16px' }}>Market Value Summary</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Trades Found
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  {avgReturn.tradeCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Average Return
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
                  {formatValue(avgReturn.avgValue)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Low Value
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  {formatValue(avgReturn.lowValue)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  High Value
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  {formatValue(avgReturn.highValue)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <div>
          <h3 style={{ marginBottom: '16px' }}>
            Recent Trades ({searchResults.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {searchResults.map((trade, idx) => (
              <div key={idx} className="card">
                <div className="card-body" style={{ padding: '16px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {formatDate(trade.date)}
                      </span>
                      <span style={{
                        fontSize: '0.6875rem',
                        padding: '2px 8px',
                        background: trade.leagueType === 'SF' ? 'var(--accent-muted)' : 'var(--bg-secondary)',
                        color: trade.leagueType === 'SF' ? 'var(--accent)' : 'var(--text-secondary)',
                        borderRadius: 4
                      }}>
                        {trade.leagueType}
                      </span>
                      <span style={{
                        fontSize: '0.6875rem',
                        padding: '2px 8px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        borderRadius: 4
                      }}>
                        {trade.totalRosters}-team
                      </span>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '20px',
                    alignItems: 'center'
                  }}>
                    {/* Gave */}
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Gave:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{
                          padding: '6px 10px',
                          background: 'var(--bg-secondary)',
                          borderRadius: 6,
                          fontSize: '0.875rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '2px solid var(--accent)'
                        }}>
                          <span>
                            <strong>{trade.player.name}</strong>
                            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                              {trade.player.position} {trade.player.team && `- ${trade.player.team}`}
                            </span>
                          </span>
                          <span style={{ color: 'var(--error)', fontWeight: 500 }}>
                            {formatValue(trade.playerValue)}
                          </span>
                        </div>
                        {trade.given.map(renderTradeItem)}
                      </div>
                      <div style={{
                        marginTop: '8px',
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600
                      }}>
                        Total: {formatValue(trade.playerValue + trade.givenValue)}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>
                      →
                    </div>

                    {/* Received */}
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--success)' }}>
                        Received:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {trade.received.length > 0 ? (
                          trade.received.map(renderTradeItem)
                        ) : (
                          <div style={{
                            padding: '6px 10px',
                            fontSize: '0.875rem',
                            color: 'var(--text-muted)'
                          }}>
                            Nothing
                          </div>
                        )}
                      </div>
                      <div style={{
                        marginTop: '8px',
                        fontSize: '0.875rem',
                        color: 'var(--success)',
                        fontWeight: 600
                      }}>
                        Total: {formatValue(trade.receivedValue)}
                      </div>
                    </div>
                  </div>

                  {/* Trade Analysis */}
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 6,
                    fontSize: '0.875rem',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Value Difference:</span>
                    <span style={{
                      fontWeight: 600,
                      color: trade.receivedValue > (trade.playerValue + trade.givenValue)
                        ? 'var(--success)'
                        : trade.receivedValue < (trade.playerValue + trade.givenValue)
                        ? 'var(--error)'
                        : 'var(--text-primary)'
                    }}>
                      {trade.receivedValue > (trade.playerValue + trade.givenValue) ? '+' : ''}
                      {formatValue(trade.receivedValue - (trade.playerValue + trade.givenValue))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : searchQuery && !loading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No Trades Found</h3>
            <p>No trades found for "{searchQuery}" with current filters</p>
          </div>
        </div>
      )}

      {!searchQuery && !loading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Search for a Player</h3>
            <p>Enter a player name to see their recent trade history</p>
            {dbStats && dbStats.totalTrades === 0 && league && (
              <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>
                Sync your league trades first to build the database
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TradeDatabase;
