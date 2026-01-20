import React, { useState, useMemo } from 'react';
import { useApp } from '../../App';
import {
  findAllTrades,
  filterTrades,
  getAcceptanceLikelihood,
  getTradeReason
} from '../../services/tradeFinder';

function TradeFinder() {
  const { league, myRoster, setPage, PAGES } = useApp();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    positions: [],
    excludePlayers: [],
    minValue: null,
    maxValue: null,
    minAcceptance: null
  });

  const leagueSettings = useMemo(() => ({
    totalRosters: league?.rosters?.length || 12
  }), [league]);

  const handleFindTrades = () => {
    setLoading(true);
    setExpandedIndex(null);

    // Run the trade finder algorithm
    setTimeout(() => {
      const allTrades = findAllTrades(
        myRoster,
        league.rosters,
        leagueSettings
      );
      setTrades(allTrades);
      setLoading(false);
    }, 100);
  };

  const filteredTrades = useMemo(() => {
    return filterTrades(trades, filters);
  }, [trades, filters]);

  const handleTogglePosition = (position) => {
    setFilters(prev => ({
      ...prev,
      positions: prev.positions.includes(position)
        ? prev.positions.filter(p => p !== position)
        : [...prev.positions, position]
    }));
  };

  const handleBuildTrade = (trade) => {
    // TODO: Pre-fill trade builder with this trade
    // For now, just navigate to trade builder
    setPage(PAGES.TRADE);
  };

  if (!myRoster) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📥</div>
        <p>Import a league first</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1>Trade Finder</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Discover fair trade opportunities across your league
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleFindTrades}
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            {loading ? 'Finding Trades...' : '🔍 Find Trades'}
          </button>
        </div>
      </div>

      {/* Filters */}
      {trades.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Filters</h3>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.875rem', padding: '4px 12px' }}
              onClick={() => setFilters({ positions: [], excludePlayers: [], minValue: null, maxValue: null, minAcceptance: null })}
            >
              Clear All
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Position Targets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Target Positions
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['QB', 'RB', 'WR', 'TE'].map(pos => (
                    <button
                      key={pos}
                      className={`pos-badge pos-${pos.toLowerCase()}`}
                      onClick={() => handleTogglePosition(pos)}
                      style={{
                        cursor: 'pointer',
                        opacity: filters.positions.includes(pos) ? 1 : 0.4,
                        border: filters.positions.includes(pos) ? '2px solid currentColor' : '1px solid currentColor',
                        padding: '6px 12px',
                        fontSize: '0.8125rem'
                      }}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value Range */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Min Value Received
                  </label>
                  <input
                    type="number"
                    value={filters.minValue || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, minValue: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder="e.g. 5000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Max Value Given
                  </label>
                  <input
                    type="number"
                    value={filters.maxValue || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxValue: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder="e.g. 8000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Min Acceptance Likelihood
                  </label>
                  <select
                    value={filters.minAcceptance || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAcceptance: e.target.value || null }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)'
                    }}
                  >
                    <option value="">All</option>
                    <option value="low">Low+</option>
                    <option value="medium">Medium+</option>
                    <option value="high">High Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ marginBottom: '8px' }}>Scanning League for Trades...</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Analyzing rosters and finding opportunities
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && trades.length === 0 && (
        <div className="card">
          <div className="empty-state" style={{ minHeight: 300 }}>
            <div className="empty-state-icon">🔍</div>
            <h3>Find Trade Opportunities</h3>
            <p>Click "Find Trades" to scan your league for fair trade opportunities</p>
            <p style={{ marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 500 }}>
              The Trade Finder analyzes all teams in your league to discover realistic trades that:
              <br />• Address your roster needs
              <br />• Have fair value for both sides
              <br />• Are likely to be accepted
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && filteredTrades.length > 0 && (
        <div>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {filteredTrades.length} Trade Opportunit{filteredTrades.length === 1 ? 'y' : 'ies'}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTrades.map((opportunity, index) => (
              <TradeOpportunityCard
                key={index}
                opportunity={opportunity}
                isExpanded={expandedIndex === index}
                onToggleExpand={() => setExpandedIndex(expandedIndex === index ? null : index)}
                onBuildTrade={handleBuildTrade}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results After Filtering */}
      {!loading && trades.length > 0 && filteredTrades.length === 0 && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              No trades match your filters. Try adjusting your criteria.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TradeOpportunityCard({ opportunity, isExpanded, onToggleExpand, onBuildTrade }) {
  const { opponent, trade, score, myNeeds, theirNeeds } = opportunity;

  const iGiveValue = trade.iGive.reduce((sum, asset) => sum + asset.value, 0);
  const iGetValue = trade.iGet.reduce((sum, asset) => sum + asset.value, 0);
  const valueDiff = iGetValue - iGiveValue;
  const pctDiff = ((iGetValue / iGiveValue) - 1) * 100;

  const acceptanceLikelihood = getAcceptanceLikelihood(score);
  const tradeReason = getTradeReason(trade, myNeeds);

  const likelihoodColor = acceptanceLikelihood === 'High' ? 'var(--accent)' :
    acceptanceLikelihood === 'Medium' ? '#f59e0b' : 'var(--text-muted)';

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Main Trade Info */}
      <div style={{ padding: '16px', cursor: 'pointer' }} onClick={onToggleExpand}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>vs {opponent.name}</h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: likelihoodColor + '20',
                  color: likelihoodColor,
                  fontWeight: 600
                }}
              >
                {acceptanceLikelihood} Likelihood
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                Score: {score}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              {tradeReason}
            </p>
          </div>

          <div style={{ textAlign: 'right', minWidth: 100 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
              Value Diff
            </div>
            <div style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: valueDiff > 0 ? 'var(--accent)' : valueDiff < 0 ? 'var(--red)' : 'var(--text-secondary)'
            }}>
              {valueDiff > 0 ? '+' : ''}{valueDiff.toLocaleString()} ({pctDiff > 0 ? '+' : ''}{pctDiff.toFixed(1)}%)
            </div>
          </div>
        </div>

        {/* Trade Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
          {/* You Give */}
          <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              YOU GIVE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {trade.iGive.map((asset, i) => (
                <AssetChip key={i} asset={asset} />
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>
              {iGiveValue.toLocaleString()} value
            </div>
          </div>

          {/* Arrow */}
          <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>→</div>

          {/* You Get */}
          <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              YOU GET
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {trade.iGet.map((asset, i) => (
                <AssetChip key={i} asset={asset} />
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
              {iGetValue.toLocaleString()} value
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px', background: 'var(--bg-base)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Why This Helps You</h4>
              <ul style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, paddingLeft: '20px' }}>
                {myNeeds.needs.critical.length > 0 && (
                  <li>Critical needs: {myNeeds.needs.critical.map(n => n.position).join(', ')}</li>
                )}
                {myNeeds.needs.moderate.length > 0 && (
                  <li>Moderate needs: {myNeeds.needs.moderate.map(n => n.position).join(', ')}</li>
                )}
                {trade.addressesMyNeed && (
                  <li style={{ color: 'var(--accent)', fontWeight: 600 }}>This trade addresses your needs!</li>
                )}
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Why They Might Accept</h4>
              <ul style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, paddingLeft: '20px' }}>
                {theirNeeds.needs.critical.length > 0 && (
                  <li>Their critical needs: {theirNeeds.needs.critical.map(n => n.position).join(', ')}</li>
                )}
                {trade.addressesTheirNeed && (
                  <li style={{ color: 'var(--accent)', fontWeight: 600 }}>Addresses their roster needs</li>
                )}
                {!trade.addressesTheirNeed && valueDiff < 0 && (
                  <li>They get more value ({Math.abs(valueDiff).toLocaleString()})</li>
                )}
                {!trade.addressesTheirNeed && valueDiff >= 0 && (
                  <li>Fair value swap</li>
                )}
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                onBuildTrade(trade);
              }}
            >
              Build This Trade
            </button>
            <button
              className="btn btn-ghost"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              Collapse
            </button>
          </div>
        </div>
      )}

      {/* Expand/Collapse Indicator */}
      {!isExpanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Click to view details ▼
          </span>
        </div>
      )}
    </div>
  );
}

function AssetChip({ asset }) {
  if (asset.type === 'pick') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.875rem' }}>📝</span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
          {asset.year} Round {asset.round}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {asset.value.toLocaleString()}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span className={`pos-badge pos-${asset.position?.toLowerCase()}`} style={{ fontSize: '0.625rem', padding: '2px 6px' }}>
        {asset.position}
      </span>
      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
        {asset.name}
      </span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {asset.value.toLocaleString()}
      </span>
    </div>
  );
}

export default TradeFinder;
