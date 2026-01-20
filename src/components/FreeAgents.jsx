import React, { useState, useMemo } from 'react';
import { useApp } from '../App';
import { getPlayerValue } from '../services/values';

function FreeAgents() {
  const { league } = useApp();
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState('ALL');

  const freeAgentsWithValue = useMemo(() => {
    if (!league?.freeAgents) return [];
    return league.freeAgents.map(p => ({
      ...p,
      value: getPlayerValue(p)
    })).sort((a, b) => b.value - a.value);
  }, [league]);

  const filtered = useMemo(() => {
    let list = freeAgentsWithValue;
    
    if (filterPos !== 'ALL') {
      list = list.filter(p => p.position === filterPos);
    }
    
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(term));
    }
    
    return list.slice(0, 100);
  }, [freeAgentsWithValue, filterPos, search]);

  const positions = ['ALL', 'QB', 'RB', 'WR', 'TE'];

  if (!league) {
    return <div className="empty-state"><div className="empty-state-icon">📥</div><p>Import a league first</p></div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>📋 Free Agents</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Players available on waivers ({freeAgentsWithValue.length} total)
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="input search-input"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="tabs">
          {positions.map(pos => (
            <button
              key={pos}
              className={`tab ${filterPos === pos ? 'active' : ''}`}
              onClick={() => setFilterPos(pos)}
              style={{ padding: '8px 14px' }}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="card">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '60px 1fr 80px 60px 80px', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          <span>Pos</span>
          <span>Player</span>
          <span>Team</span>
          <span>Age</span>
          <span style={{ textAlign: 'right' }}>Value</span>
        </div>
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {filtered.length > 0 ? filtered.map(p => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 60px 80px', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <span className={`pos-badge pos-${p.position?.toLowerCase()}`}>{p.position}</span>
              <span style={{ fontWeight: 500 }}>{p.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>{p.team}</span>
              <span style={{ color: 'var(--text-muted)' }}>{p.age || '—'}</span>
              <span className="player-value" style={{ textAlign: 'right' }}>{p.value.toLocaleString()}</span>
            </div>
          )) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No players found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FreeAgents;
