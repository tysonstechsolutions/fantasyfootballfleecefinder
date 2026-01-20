import React, { useState } from 'react';
import { getUser, getUserLeagues, getFullLeagueData } from '../services/sleeper';

function ImportLeague({ onImport }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [leagueData, setLeagueData] = useState(null);
  const [selectedRoster, setSelectedRoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFindLeagues = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    setError('');

    try {
      const user = await getUser(username.trim());
      const userLeagues = await getUserLeagues(user.user_id, '2025');
      
      // Filter to dynasty
      const dynastyLeagues = userLeagues.filter(l => l.settings?.type === 2);
      
      if (dynastyLeagues.length === 0) {
        setError('No dynasty leagues found. Try a different username or check if you have dynasty leagues in 2025.');
        setLoading(false);
        return;
      }

      setLeagues(dynastyLeagues);
      setStep(2);
    } catch (err) {
      setError('User not found. Check the username and try again.');
    }

    setLoading(false);
  };

  const handleSelectLeague = async (league) => {
    setLoading(true);
    setError('');
    setSelectedLeague(league);

    try {
      const data = await getFullLeagueData(league.league_id);
      setLeagueData(data);
      setStep(3);
    } catch (err) {
      setError('Failed to load league data. Try again.');
    }

    setLoading(false);
  };

  const handleConfirm = () => {
    if (selectedRoster && leagueData) {
      onImport(leagueData, selectedRoster.rosterId);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Import League</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Connect your Sleeper dynasty league
      </p>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <Step num={1} active={step >= 1} done={step > 1} label="Username" />
        <div style={{ flex: 1, height: 2, background: step > 1 ? 'var(--accent)' : 'var(--border)' }} />
        <Step num={2} active={step >= 2} done={step > 2} label="League" />
        <div style={{ flex: 1, height: 2, background: step > 2 ? 'var(--accent)' : 'var(--border)' }} />
        <Step num={3} active={step >= 3} done={false} label="Team" />
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)', color: 'var(--red)', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
          <div className="spinner" />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      )}

      {/* Step 1: Username */}
      {!loading && step === 1 && (
        <form onSubmit={handleFindLeagues}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Sleeper Username
          </label>
          <input
            type="text"
            className="input"
            placeholder="Enter your Sleeper username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            style={{ marginBottom: '16px' }}
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Find My Leagues
          </button>
        </form>
      )}

      {/* Step 2: Select League */}
      {!loading && step === 2 && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>Select Dynasty League</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {leagues.map(league => (
              <button
                key={league.league_id}
                className="player-row"
                onClick={() => handleSelectLeague(league)}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
              >
                <span style={{ fontSize: '1.5rem' }}>🏈</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 500 }}>{league.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {league.total_rosters} teams • Dynasty
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
        </div>
      )}

      {/* Step 3: Select Team */}
      {!loading && step === 3 && leagueData && (
        <div>
          <h3 style={{ marginBottom: '8px' }}>Which team is yours?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.875rem' }}>
            {selectedLeague?.name}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {leagueData.rosters.map(roster => (
              <button
                key={roster.rosterId}
                className={`player-row ${selectedRoster?.rosterId === roster.rosterId ? 'selected' : ''}`}
                onClick={() => setSelectedRoster(roster)}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                  {roster.name?.[0] || '?'}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 500 }}>{roster.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{roster.players?.length} players</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <button 
              className="btn btn-primary" 
              onClick={handleConfirm}
              disabled={!selectedRoster}
              style={{ flex: 1 }}
            >
              Confirm & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ num, active, done, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: active ? 1 : 0.4 }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: done ? 'var(--accent)' : active ? 'var(--accent)' : 'var(--bg-elevated)',
        color: done || active ? '#fff' : 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8125rem',
        fontWeight: 600
      }}>
        {done ? '✓' : num}
      </div>
      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export default ImportLeague;
