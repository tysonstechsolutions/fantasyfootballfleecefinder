import React from 'react';
import { useApp } from '../App';

function MobileNav() {
  const { page, setPage, league, PAGES } = useApp();

  const items = [
    { id: PAGES.DASHBOARD, icon: '📊', label: 'Home' },
    { id: PAGES.TRADE, icon: '🔄', label: 'Trade' },
    { id: PAGES.TRADEFINDER, icon: '🔍', label: 'Find' },
    { id: PAGES.MOCKDRAFT, icon: '🎓', label: 'Draft' },
    { id: PAGES.SETTINGS, icon: '⚙️', label: 'Settings' },
  ];

  return (
    <nav className="mobile-nav">
      {items.map(item => {
        const disabled = (item.id === PAGES.TRADE || item.id === PAGES.FLEECE || item.id === PAGES.TRADEFINDER || item.id === PAGES.PLAYERCOMPARE || item.id === PAGES.POWERRANKINGS || item.id === PAGES.SEASONSIM || item.id === PAGES.HISTORY || item.id === PAGES.FREEAGENTS) && !league;
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
