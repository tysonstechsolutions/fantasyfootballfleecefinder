import React, { useState } from 'react';
import { useApp } from '../App';

function Settings({ onClearData }) {
  const { apiKey, setApiKey, league } = useApp();
  const [tempKey, setTempKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(tempKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Clear all league data? This cannot be undone.')) {
      onClearData();
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>Settings</h1>

      {/* API Key */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header"><h3>🤖 Claude API Key</h3></div>
        <div className="card-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Required for AI-powered trade analysis. Get your key from{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              console.anthropic.com
            </a>
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type={showKey ? 'text' : 'password'}
              className="input"
              placeholder="sk-ant-api..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary" onClick={() => setShowKey(!showKey)}>
              {showKey ? '🙈' : '👁️'}
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
          <div style={{ fontSize: '0.8125rem' }}>
            {apiKey ? (
              <span style={{ color: 'var(--accent)' }}>✓ API key configured</span>
            ) : (
              <span style={{ color: 'var(--orange)' }}>⚠️ No API key set</span>
            )}
          </div>
        </div>
      </div>

      {/* League Data */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header"><h3>📊 League Data</h3></div>
        <div className="card-body">
          {league ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <InfoRow label="League" value={league.league.name} />
                <InfoRow label="Teams" value={league.rosters.length} />
                <InfoRow label="Platform" value="Sleeper" />
                <InfoRow label="Season" value={league.league.season} />
              </div>
              <button className="btn btn-secondary" onClick={handleClear} style={{ color: 'var(--red)' }}>
                Clear League Data
              </button>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No league imported yet.</p>
          )}
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="card-header"><h3>ℹ️ About</h3></div>
        <div className="card-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            <strong>Fantasy Fleece Finder</strong> is an AI-powered dynasty fantasy football trade analyzer.
            Find unfair trades, analyze your roster, and dominate your league.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FeatureItem icon="📥" title="Sleeper Import" desc="Connect your league directly" />
            <FeatureItem icon="🔄" title="Trade Builder" desc="Click players to build trades instantly" />
            <FeatureItem icon="🎯" title="Fleece Finder" desc="AI finds unfair trades against opponents" />
            <FeatureItem icon="📋" title="Free Agents" desc="See available waiver players" />
          </div>

          <div style={{ marginTop: '24px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Version 2.0.0
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function FeatureItem({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 500, marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{desc}</div>
      </div>
    </div>
  );
}

export default Settings;
