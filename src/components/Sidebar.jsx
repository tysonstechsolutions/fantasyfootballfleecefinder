import React from 'react';
import { useApp } from '../App';

const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard', needsLeague: false },
  { id: 'import', icon: '📥', label: 'Import', needsLeague: false },
  { id: 'trade', icon: '🔄', label: 'Trade Builder', needsLeague: true },
  { id: 'fleece', icon: '🎯', label: 'Fleece Finder', needsLeague: true },
  { id: 'history', icon: '🤝', label: 'Trade History', needsLeague: true },
  { id: 'freeagents', icon: '📋', label: 'Free Agents', needsLeague: true },
  { id: 'settings', icon: '⚙️', label: 'Settings', needsLeague: false },
];

function Sidebar() {
  const { page, setPage, league } = useApp();

  return (
    <aside className="sidebar">
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>Fleece Finder</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dynasty Trade Analyzer</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '12px 0', flex: 1 }}>
        {NAV.map(item => {
          const disabled = item.needsLeague && !league;
          const active = page === item.id;

          return (
            <button
              key={item.id}
              className={`nav-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => !disabled && setPage(item.id)}
              disabled={disabled}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {league && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', fontSize: '0.8125rem' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>League</div>
          <div style={{ fontWeight: 500 }}>{league.league.name}</div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
