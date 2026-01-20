import React, { useState, useEffect } from 'react';
import { useApp } from '../../App';
import CompareChart from '../charts/CompareChart';
import { getPlayerValue } from '../../services/values';
import { comparePlayerHistory, getTrendBadge } from '../../services/valueHistory';
import { analyzeTradeAI } from '../../services/claude';

/**
 * PlayerCompare - Select and compare two players with value trends and AI verdict
 */
function PlayerCompare() {
  const { league, myRoster, apiKey } = useApp();
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [aiVerdict, setAiVerdict] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');

  // Get all players from league
  const allPlayers = React.useMemo(() => {
    if (!league?.rosters) return [];

    const players = [];
    league.rosters.forEach(roster => {
      roster.players.forEach(player => {
        const value = getPlayerValue(player);
        players.push({
          ...player,
          value,
          rosterName: roster.name
        });
      });
    });

    // Sort by value (highest first)
    return players.sort((a, b) => b.value - a.value);
  }, [league]);

  // Filter players for search
  const filteredPlayers1 = React.useMemo(() => {
    if (!searchTerm1) return allPlayers.slice(0, 50); // Show top 50 by default

    const term = searchTerm1.toLowerCase();
    return allPlayers.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.position.toLowerCase().includes(term) ||
      p.team?.toLowerCase().includes(term)
    ).slice(0, 20);
  }, [allPlayers, searchTerm1]);

  const filteredPlayers2 = React.useMemo(() => {
    if (!searchTerm2) return allPlayers.slice(0, 50);

    const term = searchTerm2.toLowerCase();
    return allPlayers.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.position.toLowerCase().includes(term) ||
      p.team?.toLowerCase().includes(term)
    ).slice(0, 20);
  }, [allPlayers, searchTerm2]);

  // Update comparison data when players change
  useEffect(() => {
    if (player1 && player2) {
      const comparison = comparePlayerHistory(player1.name, player2.name, 90);
      setComparisonData(comparison);
    } else {
      setComparisonData(null);
    }
  }, [player1, player2]);

  // Get AI verdict
  const getAIVerdict = async () => {
    if (!player1 || !player2 || !apiKey) return;

    setLoadingAI(true);
    try {
      // Create a simple trade analysis request
      const analysis = await analyzeTradeAI(apiKey, {
        myRoster: myRoster || { players: [], picks: [] },
        theirRoster: null,
        iGive: [player2],
        iGet: [player1]
      });

      setAiVerdict(analysis);
    } catch (error) {
      console.error('Failed to get AI verdict:', error);
      setAiVerdict('Failed to get AI analysis. Please check your API key.');
    } finally {
      setLoadingAI(false);
    }
  };

  if (!league) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📊</div>
        <h2>Import League First</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Import your league to compare player values and trends
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
          Compare Players
        </h1>
        <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)' }}>
          Analyze value trends and get AI insights on player comparisons
        </p>
      </div>

      {/* Player Selection */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Player 1 Selector */}
        <PlayerSelector
          label="Player 1"
          selectedPlayer={player1}
          onSelect={setPlayer1}
          searchTerm={searchTerm1}
          onSearchChange={setSearchTerm1}
          filteredPlayers={filteredPlayers1}
          color="#3b82f6"
          excludePlayer={player2}
        />

        {/* Player 2 Selector */}
        <PlayerSelector
          label="Player 2"
          selectedPlayer={player2}
          onSelect={setPlayer2}
          searchTerm={searchTerm2}
          onSearchChange={setSearchTerm2}
          filteredPlayers={filteredPlayers2}
          color="#ef4444"
          excludePlayer={player1}
        />
      </div>

      {/* Comparison View */}
      {player1 && player2 && (
        <>
          {/* Stats Comparison Table */}
          <div style={{ marginBottom: '24px' }}>
            <StatsComparisonTable player1={player1} player2={player2} />
          </div>

          {/* Value Trend Chart */}
          <div style={{ marginBottom: '24px' }}>
            <CompareChart
              player1Name={player1.name}
              player2Name={player2.name}
              comparisonData={comparisonData}
            />
          </div>

          {/* AI Verdict Section */}
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                  AI Verdict for Your Team
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Get personalized insights based on your roster
                </p>
              </div>
              <button
                onClick={getAIVerdict}
                disabled={loadingAI || !apiKey}
                style={{
                  padding: '10px 20px',
                  background: apiKey ? 'var(--primary)' : 'var(--border)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: apiKey ? 'pointer' : 'not-allowed',
                  opacity: loadingAI ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {loadingAI ? 'Analyzing...' : 'Get AI Verdict'}
              </button>
            </div>

            {!apiKey && (
              <div style={{
                padding: '16px',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: 'var(--text)'
              }}>
                <strong>API Key Required:</strong> Add your Claude API key in Settings to get AI analysis
              </div>
            )}

            {aiVerdict && (
              <div style={{
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {aiVerdict}
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {(!player1 || !player2) && (
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤔</div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
            Select Two Players to Compare
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Choose players from the dropdowns above to see their value trends and stats side-by-side
          </p>
        </div>
      )}
    </div>
  );
}

// Player Selector Component
function PlayerSelector({ label, selectedPlayer, onSelect, searchTerm, onSearchChange, filteredPlayers, color, excludePlayer }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (player) => {
    onSelect(player);
    setIsOpen(false);
    onSearchChange('');
  };

  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 600,
        marginBottom: '8px',
        color: color
      }}>
        {label}
      </label>

      {selectedPlayer ? (
        <div style={{
          background: 'var(--card-bg)',
          border: `2px solid ${color}`,
          borderRadius: '8px',
          padding: '16px',
          position: 'relative'
        }}>
          <button
            onClick={() => onSelect(null)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Change
          </button>

          <PlayerCard player={selectedPlayer} color={color} />
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search for a player..."
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            style={{
              width: '100%',
              padding: '12px',
              border: `2px solid ${color}`,
              borderRadius: '8px',
              fontSize: '0.9375rem',
              background: 'var(--card-bg)',
              color: 'var(--text)'
            }}
          />

          {isOpen && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 10
                }}
                onClick={() => setIsOpen(false)}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 20,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {filteredPlayers.filter(p => p.id !== excludePlayer?.id).map(player => (
                  <div
                    key={player.id}
                    onClick={() => handleSelect(player)}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{player.name}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {player.position} - {player.team} - {player.rosterName}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {player.value.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredPlayers.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No players found
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Player Card Component
function PlayerCard({ player, color }) {
  const trend = getTrendBadge(player.name);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{player.name}</h3>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {player.position} - {player.team}
          </div>
        </div>
        <div style={{
          padding: '6px 12px',
          background: color,
          color: 'white',
          borderRadius: '6px',
          fontSize: '1rem',
          fontWeight: 700
        }}>
          {player.value.toLocaleString()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8125rem' }}>
        <div>
          <div style={{ color: 'var(--text-muted)' }}>Age</div>
          <div style={{ fontWeight: 600 }}>{player.age || 'N/A'}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)' }}>Owner</div>
          <div style={{ fontWeight: 600 }}>{player.rosterName}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)' }}>Trend</div>
          <div style={{ fontWeight: 600, color: trend.color }}>
            {trend.icon} {trend.label}
          </div>
        </div>
        {player.injuryStatus && (
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Status</div>
            <div style={{ fontWeight: 600, color: '#ef4444' }}>{player.injuryStatus}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stats Comparison Table
function StatsComparisonTable({ player1, player2 }) {
  const trend1 = getTrendBadge(player1.name);
  const trend2 = getTrendBadge(player2.name);

  const rows = [
    { label: 'Dynasty Value', p1: player1.value.toLocaleString(), p2: player2.value.toLocaleString(), winner: player1.value > player2.value ? 1 : player1.value < player2.value ? 2 : 0 },
    { label: 'Position', p1: player1.position, p2: player2.position, winner: 0 },
    { label: 'Team', p1: player1.team, p2: player2.team, winner: 0 },
    { label: 'Age', p1: player1.age || 'N/A', p2: player2.age || 'N/A', winner: (player1.age && player2.age) ? (player1.age < player2.age ? 1 : player1.age > player2.age ? 2 : 0) : 0 },
    { label: '30D Trend', p1: `${trend1.icon} ${trend1.label}`, p2: `${trend2.icon} ${trend2.label}`, winner: 0 },
    { label: 'Current Owner', p1: player1.rosterName, p2: player2.rosterName, winner: 0 },
  ];

  if (player1.injuryStatus || player2.injuryStatus) {
    rows.push({
      label: 'Injury Status',
      p1: player1.injuryStatus || 'Healthy',
      p2: player2.injuryStatus || 'Healthy',
      winner: 0
    });
  }

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg)' }}>
            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Stat</th>
            <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#3b82f6' }}>
              {player1.name}
            </th>
            <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#ef4444' }}>
              {player2.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 500 }}>{row.label}</td>
              <td style={{
                padding: '12px 16px',
                textAlign: 'center',
                background: row.winner === 1 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                fontWeight: row.winner === 1 ? 600 : 400
              }}>
                {row.p1}
              </td>
              <td style={{
                padding: '12px 16px',
                textAlign: 'center',
                background: row.winner === 2 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                fontWeight: row.winner === 2 ? 600 : 400
              }}>
                {row.p2}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PlayerCompare;
