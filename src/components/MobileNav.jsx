import React from 'react';
import { useApp } from '../App';

function MobileNav() {
  const { page, setPage, league, PAGES } = useApp();

  const items = [
    { id: PAGES.DASHBOARD, icon: '📊', label: 'Home' },
    { id: PAGES.TRADE, icon: '🔄', label: 'Trade' },
    { id: PAGES.FLEECE, icon: '🎯', label: 'Fleece' },
    { id: PAGES.HISTORY, icon: '🤝', label: 'History' },
    { id: PAGES.SETTINGS, icon: '⚙️', label: 'Settings' },
  ];

  return (
    <nav className="mobile-nav">
      {items.map(item => {
        const disabled = (item.id === PAGES.TRADE || item.id === PAGES.FLEECE || item.id === PAGES.HISTORY) && !league;
        return (
          <button
            key={item.id}
            className={`mobile-nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => !disabled && setPage(item.id)}
            disabled={disabled}
            style={{ opacity: disabled ? 0.4 : 1 }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default MobileNav;
