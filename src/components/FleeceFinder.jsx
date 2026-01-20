import React, { useState, useMemo } from 'react';
import { useApp } from '../App';
import { getPlayerValue, getPickValue, estimatePickTier } from '../services/values';
import { findFleeces, findLeagueFleeces, suggestImprovements } from '../services/claude';

function FleeceFinder() {
  const { league, myRoster, opponents, selectedOpponentId, setSelectedOpponentId, apiKey } = useApp();
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState('');
  const [viewTab, setViewTab] = useState('players');
  const [mode, setMode] = useState('single'); // 'single', 'league', 'improve'

  const selectedOpponent = opponents.find(r => r.rosterId === selectedOpponentId);

  const opponentsWithValue = useMemo(() => {
    return opponents.map(r => ({
      ...r,
      totalValue: r.players.reduce((sum, p) => sum + getPlayerValue(p), 0)
    })).sort((a, b) => b.totalValue - a.totalValue);
  }, [opponents]);

  const opponentPlayers = useMemo(() => {
    if (!selectedOpponent) return [];
    return selectedOpponent.players.map(p => ({
      ...p,
      value: getPlayerValue(p),
      buyLow: p.injuryStatus || (p.age && p.age >= 28)
    })).sort((a, b) => b.value - a.value);
  }, [selectedOpponent]);

  const opponentPicks = useMemo(() => {
    if (!selectedOpponent) return [];
    const total = league?.rosters?.length || 12;
    return selectedOpponent.picks.map(p => ({
      ...p,
      value: getPickValue(p.year, p.round, estimatePickTier(selectedOpponent, total))
    }));
  }, [selectedOpponent, league]);

  const handleFindFleeces = async () => {
    if (!apiKey) {
      alert('Add your Claude API key in Settings');
      return;
    }
    if (!selectedOpponent) {
      alert('Select an opponent first');
      return;
    }
    setLoading(true);
    setLoadingType('single');
    setAiResult('');
    setMode('single');
    try {
      const result = await findFleeces(apiKey, { myRoster, theirRoster: selectedOpponent });
      setAiResult(result);
    } catch (err) {
      setAiResult('Error: ' + err.message);
    }
    setLoading(false);
    setLoadingType('');
  };

  const handleLeagueFleece = async () => {
    if (!apiKey) {
      alert('Add your Claude API key in Settings');
      return;
    }
    setLoading(true);
    setLoadingType('league');
    setAiResult('');
    setMode('league');
    setSelectedOpponentId(null);
    try {
      const result = await findLeagueFleeces(apiKey, {
        myRoster,
        allRosters: league.rosters
      });
      setAiResult(result);
    } catch (err) {
      setAiResult('Error: ' + err.message);
    }
    setLoading(false);
    setLoadingType('');
  };

  const handleImproveTeam = async () => {
    if (!apiKey) {
      alert('Add your Claude API key in Settings');
      return;
    }
    setLoading(true);
    setLoadingType('improve');
    setAiResult('');
    setMode('improve');
    setSelectedOpponentId(null);
    try {
      const result = await suggestImprovements(apiKey, {
        myRoster,
        allRosters: league.rosters
      });
      setAiResult(result);
    } catch (err) {
      setAiResult('Error: ' + err.message);
    }
    setLoading(false);
    setLoadingType('');
  };

  if (!myRoster) {
    return <div className="empty-state"><div className="empty-state-icon">📥</div><p>Import a league first</p></div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Fleece Finder</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Find unfair trades to exploit</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleLeagueFleece}
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
          >
            {loadingType === 'league' ? 'Scanning League...' : 'Fleece Entire League'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleImproveTeam}
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            {loadingType === 'improve' ? 'Analyzing...' : 'Make My Team Better'}
          </button>
        </div>
      </div>

      {/* League-wide or Improvement results */}
      {(mode === 'league' || mode === 'improve') && aiResult && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3>
              {mode === 'league' ? 'League-Wide Fleece Opportunities' : 'Team Improvement Plan'}
            </h3>
          </div>
          <div className="card-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {aiResult}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        {/* Opponent List */}
        <div className="card">
          <div className="card-header"><h3>Select Target</h3></div>
          <div className="card-body" style={{ padding: '8px', maxHeight: 500, overflowY: 'auto' }}>
            {opponentsWithValue.map(r => (
              <div
                key={r.rosterId}
                className={`player-row ${selectedOpponentId === r.rosterId ? 'selected' : ''}`}
                onClick={() => { setSelectedOpponentId(r.rosterId); setAiResult(''); setMode('single'); }}
              >
                <span className="player-name">{r.name}</span>
                <span className="player-meta">{r.totalValue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div>
          {selectedOpponent ? (
            <>
              {/* Header */}
              <div className="card" style={{ marginBottom: '16px' }}>
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2>Targeting: {selectedOpponent.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {selectedOpponent.players.length} players • {selectedOpponent.picks.length} picks • {selectedOpponent.wins}-{selectedOpponent.losses} record
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={handleFindFleeces} disabled={loading}>
                    {loadingType === 'single' ? 'Finding Fleeces...' : 'Find Fleece Trades'}
                  </button>
                </div>
              </div>

              {/* AI Results for single opponent */}
              {mode === 'single' && aiResult && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <div className="card-header"><h3>Fleece Opportunities</h3></div>
                  <div className="card-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                    {aiResult}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="tabs" style={{ marginBottom: '12px', maxWidth: 280 }}>
                <button className={`tab ${viewTab === 'players' ? 'active' : ''}`} onClick={() => setViewTab('players')}>
                  Players ({opponentPlayers.length})
                </button>
                <button className={`tab ${viewTab === 'picks' ? 'active' : ''}`} onClick={() => setViewTab('picks')}>
                  Picks ({opponentPicks.length})
                </button>
              </div>

              {/* Content */}
              <div className="card">
                <div className="card-body" style={{ padding: '8px', maxHeight: 400, overflowY: 'auto' }}>
                  {viewTab === 'players' ? (
                    opponentPlayers.map(p => (
                      <div key={p.id} className="player-row" style={{ cursor: 'default' }}>
                        <span className={`pos-badge pos-${p.position?.toLowerCase()}`}>{p.position}</span>
                        <span className="player-name">{p.name}</span>
                        <span className="player-meta">{p.team}{p.age ? `, ${p.age}yo` : ''}</span>
                        {p.injuryStatus && <span style={{ fontSize: '0.6875rem', padding: '2px 6px', background: 'rgba(239,68,68,0.15)', color: 'var(--red)', borderRadius: 4 }}>{p.injuryStatus}</span>}
                        {p.buyLow && !p.injuryStatus && <span style={{ fontSize: '0.6875rem', padding: '2px 6px', background: 'var(--accent-muted)', color: 'var(--accent)', borderRadius: 4 }}>Buy Low?</span>}
                        <span className="player-value">{p.value.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    opponentPicks.length > 0 ? opponentPicks.map((pick, i) => (
                      <div key={i} className="player-row" style={{ cursor: 'default' }}>
                        <span style={{ fontSize: '1rem' }}>📝</span>
                        <span className="player-name">{pick.year} Round {pick.round}</span>
                        {!pick.isOwnPick && <span className="player-meta">from {pick.originalOwnerName}</span>}
                        <span className="player-value">{pick.value.toLocaleString()}</span>
                      </div>
                    )) : (
                      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                        No draft picks owned
                      </div>
                    )
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="empty-state" style={{ minHeight: 300 }}>
                <div className="empty-state-icon">👈</div>
                <h3>Select an Opponent</h3>
                <p>Choose a team to analyze for fleece opportunities</p>
                <p style={{ marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Or use the buttons above to scan the entire league
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FleeceFinder;
