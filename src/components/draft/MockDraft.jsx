import React, { useState, useMemo } from 'react';
import MockDraftService from '../../services/mockDraft';
import DraftBoard from './DraftBoard';
import DraftResults from './DraftResults';

function MockDraft() {
  const [draft, setDraft] = useState(null);
  const [settings, setSettings] = useState({
    numTeams: 12,
    rounds: 4,
    userPick: 1
  });
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState('ALL');
  const [sortBy, setSortBy] = useState('adp'); // adp, value, name

  const handleStartDraft = () => {
    const newDraft = new MockDraftService(settings);
    // Simulate to user's pick if not pick 1
    if (settings.userPick > 1) {
      newDraft.simToUserPick();
    }
    setDraft(newDraft);
  };

  const handleMakePick = (playerId) => {
    if (!draft) return;

    try {
      draft.userMakePick(playerId);
      // Force re-render
      setDraft({ ...draft });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSimToMyPick = () => {
    if (!draft) return;
    draft.simToUserPick();
    setDraft({ ...draft });
  };

  const handleStartOver = () => {
    setDraft(null);
    setSearch('');
    setFilterPos('ALL');
    setSortBy('adp');
  };

  // Setup screen
  if (!draft) {
    return <DraftSetup settings={settings} setSettings={setSettings} onStart={handleStartDraft} />;
  }

  // Results screen
  if (draft.isDraftComplete()) {
    return <DraftResults draft={draft} onStartOver={handleStartOver} />;
  }

  // Active draft screen
  const currentPick = draft.getCurrentPick();
  const available = draft.getAvailablePlayers();
  const recommendations = currentPick.isUserPick ? draft.getRecommendations() : [];
  const userPicks = draft.getUserPicks();

  // Filter and sort available players
  const filteredPlayers = useMemo(() => {
    let players = [...available];

    // Filter by position
    if (filterPos !== 'ALL') {
      players = players.filter(p => p.position === filterPos);
    }

    // Filter by search
    if (search.trim()) {
      const term = search.toLowerCase();
      players = players.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.college.toLowerCase().includes(term)
      );
    }

    // Sort
    if (sortBy === 'adp') {
      players.sort((a, b) => a.adp - b.adp);
    } else if (sortBy === 'value') {
      players.sort((a, b) => b.projectedValue - a.projectedValue);
    } else if (sortBy === 'name') {
      players.sort((a, b) => a.name.localeCompare(b.name));
    }

    return players;
  }, [available, filterPos, search, sortBy]);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h1 style={{ marginBottom: '4px' }}>Mock Draft Simulator</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              2026 Rookie Draft - {draft.numTeams} Teams - {draft.rounds} Rounds
            </p>
          </div>
          <button className="btn btn-secondary" onClick={handleStartOver}>
            Start Over
          </button>
        </div>

        {/* Status Bar */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {currentPick.isUserPick ? 'YOUR PICK' : 'WAITING'}
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                Round {currentPick.round}, Pick {currentPick.pickInRound} ({currentPick.team.teamName})
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your Picks</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {userPicks.length}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Remaining</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {available.length}
                </div>
              </div>
            </div>
            {!currentPick.isUserPick && (
              <button className="btn btn-primary" onClick={handleSimToMyPick}>
                Sim to My Pick
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '20px', alignItems: 'start' }}>
        {/* Left Side - Draft Board */}
        <div>
          <DraftBoard draft={draft} />

          {/* Your Picks */}
          {userPicks.length > 0 && (
            <div className="card" style={{ marginTop: '20px' }}>
              <div className="card-header">
                <h3>Your Picks</h3>
              </div>
              <div className="card-body" style={{ padding: '8px' }}>
                {userPicks.map((pick, idx) => (
                  <div key={idx} className="player-row" style={{ cursor: 'default' }}>
                    <span style={{ width: 60, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {pick.round}.{String(pick.pickInRound).padStart(2, '0')}
                    </span>
                    <span className={`pos-badge pos-${pick.player.position.toLowerCase()}`}>
                      {pick.player.position}
                    </span>
                    <span className="player-name">{pick.player.name}</span>
                    <span className="player-meta">{pick.player.college}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Available Players */}
        <div>
          {/* Recommendations */}
          {currentPick.isUserPick && recommendations.length > 0 && (
            <div className="card" style={{ marginBottom: '16px', background: 'var(--accent-muted)', borderColor: 'var(--accent)' }}>
              <div className="card-header" style={{ background: 'transparent' }}>
                <h3 style={{ color: 'var(--accent)' }}>Recommended</h3>
              </div>
              <div className="card-body" style={{ padding: '8px' }}>
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="player-row"
                    onClick={() => handleMakePick(rec.player.id)}
                    style={{ background: 'var(--bg-surface)' }}
                  >
                    <span className={`pos-badge pos-${rec.player.position.toLowerCase()}`}>
                      {rec.player.position}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className="player-name">{rec.player.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {rec.reason}
                      </div>
                    </div>
                    <span className="player-value">{rec.player.projectedValue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Players List */}
          <div className="card">
            <div className="card-header">
              <h3>Available Players</h3>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {filteredPlayers.length} shown
              </span>
            </div>

            {/* Filters */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Search players..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ fontSize: '0.875rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div className="tabs" style={{ flex: 1 }}>
                  {['ALL', 'QB', 'RB', 'WR', 'TE'].map(pos => (
                    <button
                      key={pos}
                      className={`tab ${filterPos === pos ? 'active' : ''}`}
                      onClick={() => setFilterPos(pos)}
                      style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
                <select
                  className="input"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8125rem' }}
                >
                  <option value="adp">Sort: ADP</option>
                  <option value="value">Sort: Value</option>
                  <option value="name">Sort: Name</option>
                </select>
              </div>
            </div>

            {/* Players List */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className={`player-row ${!currentPick.isUserPick ? 'disabled' : ''}`}
                    onClick={() => currentPick.isUserPick && handleMakePick(player.id)}
                    style={{ padding: '12px 16px' }}
                  >
                    <span className={`pos-badge pos-${player.position.toLowerCase()}`}>
                      {player.position}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="player-name">{player.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {player.college}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="player-value" style={{ marginBottom: '2px' }}>
                        {player.projectedValue.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ADP: {player.adp.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No players found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraftSetup({ settings, setSettings, onStart }) {
  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
        <h1 style={{ marginBottom: '12px' }}>Mock Draft Simulator</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Practice your 2026 rookie draft strategy. The simulator uses ADP-based AI picks with realistic variance.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Draft Settings</h3>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Number of Teams */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
              Number of Teams
            </label>
            <select
              className="input"
              value={settings.numTeams}
              onChange={(e) => handleChange('numTeams', parseInt(e.target.value))}
            >
              {[8, 10, 12, 14, 16].map(n => (
                <option key={n} value={n}>{n} Teams</option>
              ))}
            </select>
          </div>

          {/* Rounds */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
              Number of Rounds
            </label>
            <select
              className="input"
              value={settings.rounds}
              onChange={(e) => handleChange('rounds', parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n} Round{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          {/* User Pick Position */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
              Your Draft Position
            </label>
            <select
              className="input"
              value={settings.userPick}
              onChange={(e) => handleChange('userPick', parseInt(e.target.value))}
            >
              {Array.from({ length: settings.numTeams }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>Pick {n}</option>
              ))}
            </select>
            <div style={{ marginTop: '8px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Snake draft format - your pick position alternates each round
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button className="btn btn-primary btn-lg" onClick={onStart}>
          Start Draft
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid-2" style={{ marginTop: '40px', gap: '16px' }}>
        <InfoCard
          icon="🎯"
          title="Smart Recommendations"
          desc="Get AI-powered pick suggestions based on value and team needs"
        />
        <InfoCard
          icon="📊"
          title="Post-Draft Grades"
          desc="See how your picks compare to ADP and get a draft grade"
        />
      </div>
    </div>
  );
}

function InfoCard({ icon, title, desc }) {
  return (
    <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</div>
      <h3 style={{ marginBottom: '6px', fontSize: '0.9375rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{desc}</p>
    </div>
  );
}

export default MockDraft;
