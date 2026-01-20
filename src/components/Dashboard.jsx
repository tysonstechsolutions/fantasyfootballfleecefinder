import React from 'react';
import { useApp } from '../App';
import { getPlayerValue } from '../services/values';

function Dashboard({ onImportClick }) {
  const { league, myRoster, opponents, setSelectedOpponentId, setPage, PAGES } = useApp();

  if (!league || !myRoster) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏈</div>
        <h1 style={{ marginBottom: '12px' }}>Welcome to Fleece Finder</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Import your Sleeper dynasty league to start analyzing trades and finding fleece opportunities.
        </p>
        <button className="btn btn-primary btn-lg" onClick={onImportClick}>
          Import Your League
        </button>

        <div className="grid-3" style={{ marginTop: '60px', textAlign: 'left' }}>
          <Feature icon="🔄" title="Trade Builder" desc="Click players directly from rosters to build trades" />
          <Feature icon="🎯" title="Fleece Finder" desc="AI finds unfair trades against opponents" />
          <Feature icon="📋" title="Free Agents" desc="See who's available on waivers" />
        </div>
      </div>
    );
  }

  // Calculate values
  const playersWithValue = myRoster.players.map(p => ({ ...p, value: getPlayerValue(p) }));
  const totalValue = playersWithValue.reduce((sum, p) => sum + p.value, 0);
  const topPlayers = [...playersWithValue].sort((a, b) => b.value - a.value).slice(0, 5);

  const opponentsWithValue = opponents.map(r => ({
    ...r,
    totalValue: r.players.reduce((sum, p) => sum + getPlayerValue(p), 0)
  })).sort((a, b) => b.totalValue - a.totalValue);

  const handleOpponentClick = (id) => {
    setSelectedOpponentId(id);
    setPage(PAGES.FLEECE);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>{myRoster.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{league.league.name}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setPage(PAGES.TRADE)}>
          🔄 Build Trade
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <StatCard label="Roster Value" value={totalValue.toLocaleString()} highlight />
        <StatCard label="Players" value={myRoster.players.length} />
        <StatCard label="Draft Picks" value={myRoster.picks.length} />
        <StatCard label="Record" value={`${myRoster.wins}-${myRoster.losses}`} />
      </div>

      <div className="grid-2">
        {/* Top Assets */}
        <div className="card">
          <div className="card-header">
            <h3>🏆 Top Assets</h3>
          </div>
          <div className="card-body" style={{ padding: '8px' }}>
            {topPlayers.map((p, i) => (
              <div key={p.id} className="player-row">
                <span style={{ width: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{i + 1}</span>
                <span className={`pos-badge pos-${p.position?.toLowerCase()}`}>{p.position}</span>
                <span className="player-name">{p.name}</span>
                <span className="player-value">{p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Opponents */}
        <div className="card">
          <div className="card-header">
            <h3>🎯 Select Opponent to Fleece</h3>
          </div>
          <div className="card-body" style={{ padding: '8px' }}>
            {opponentsWithValue.slice(0, 6).map(r => (
              <div 
                key={r.rosterId} 
                className="player-row"
                onClick={() => handleOpponentClick(r.rosterId)}
              >
                <span className="player-name">{r.name}</span>
                <span className="player-meta">{r.totalValue.toLocaleString()} value</span>
                <span style={{ color: 'var(--accent)' }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Draft Picks */}
      {myRoster.picks.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-header">
            <h3>📝 Your Draft Picks</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {myRoster.picks.map((pick, i) => (
                <span key={i} className="pick-chip">
                  {pick.year} Rd {pick.round}
                  {!pick.isOwnPick && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({pick.originalOwnerName})</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
      <div className={`value-big ${highlight ? 'value-positive' : ''}`}>{value}</div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{desc}</p>
    </div>
  );
}

export default Dashboard;
