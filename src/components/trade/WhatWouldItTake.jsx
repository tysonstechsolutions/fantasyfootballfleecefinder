import React, { useState, useMemo } from 'react';
import { whatWouldItTake } from '../../services/claude';
import { getPlayerValue } from '../../services/values';

function WhatWouldItTake({ myRoster, opponents, apiKey }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [packages, setPackages] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get all players from opponents
  const allOpponentPlayers = useMemo(() => {
    if (!opponents) return [];

    const players = [];
    opponents.forEach(roster => {
      roster.players.forEach(player => {
        players.push({
          ...player,
          value: getPlayerValue(player),
          ownerName: roster.name,
          ownerId: roster.rosterId
        });
      });
    });

    // Sort by value descending
    return players.sort((a, b) => b.value - a.value);
  }, [opponents]);

  // Filter players by search query
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return allOpponentPlayers.slice(0, 50); // Show top 50 by default

    const query = searchQuery.toLowerCase();
    return allOpponentPlayers.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.position?.toLowerCase().includes(query) ||
      p.team?.toLowerCase().includes(query)
    ).slice(0, 50);
  }, [searchQuery, allOpponentPlayers]);

  const handleAnalyze = async () => {
    if (!apiKey) {
      alert('Add your Claude API key in Settings');
      return;
    }

    if (!selectedPlayer) {
      alert('Please select a player first');
      return;
    }

    setLoading(true);
    setPackages('');

    try {
      // Find the roster that owns this player
      const theirRoster = opponents.find(r => r.rosterId === selectedPlayer.ownerId);

      const result = await whatWouldItTake(apiKey, {
        targetPlayer: selectedPlayer,
        myRoster,
        theirRoster
      });

      setPackages(result);
    } catch (err) {
      setPackages(`Error: ${err.message}`);
    }

    setLoading(false);
  };

  if (!myRoster || !opponents) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📥</div>
        <p>Import a league first</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>What Would It Take?</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Select any player you want to acquire, and AI will suggest multiple package options
        </p>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3>Select Target Player</h3>
        </div>
        <div className="card-body">
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search by player name, position, or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9375rem'
              }}
            />
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredPlayers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No players found
              </div>
            ) : (
              filteredPlayers.map(player => (
                <div
                  key={`${player.id}-${player.ownerId}`}
                  className={`player-row ${selectedPlayer?.id === player.id && selectedPlayer?.ownerId === player.ownerId ? 'selected' : ''}`}
                  onClick={() => setSelectedPlayer(player)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={`pos-badge pos-${player.position?.toLowerCase()}`}>
                    {player.position}
                  </span>
                  <span className="player-name">{player.name}</span>
                  <span className="player-meta">{player.team}</span>
                  <span className="player-meta" style={{ fontSize: '0.75rem' }}>
                    ({player.ownerName})
                  </span>
                  <span className="player-value">{player.value.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>

          {selectedPlayer && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Selected: <strong style={{ color: 'var(--text-primary)' }}>{selectedPlayer.name}</strong> from{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{selectedPlayer.ownerName}</strong>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={loading || !selectedPlayer}
            style={{ width: '100%', marginTop: '16px' }}
          >
            {loading ? 'Analyzing...' : 'Find Package Options'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Calculating what it would take to acquire {selectedPlayer?.name}...
          </div>
        </div>
      )}

      {packages && !loading && (
        <div className="card">
          <div className="card-header">
            <h3>Package Options for {selectedPlayer?.name}</h3>
          </div>
          <div className="card-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {packages}
          </div>
        </div>
      )}
    </div>
  );
}

export default WhatWouldItTake;
