import React, { useState, useEffect, createContext, useContext } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import ImportLeague from './components/ImportLeague';
import TradeBuilder from './components/TradeBuilder';
import FleeceFinder from './components/FleeceFinder';
import TradeFinder from './components/analysis/TradeFinder';
import FreeAgents from './components/FreeAgents';
import TradeHistory from './components/TradeHistory';
import Settings from './components/Settings';
import LeaguePowerRankings from './components/analysis/LeaguePowerRankings';
import SeasonSimulator from './components/analysis/SeasonSimulator';
import TradeDatabase from './components/analysis/TradeDatabase';
import PlayerCompare from './components/analysis/PlayerCompare';
import MockDraft from './components/draft/MockDraft';
import OfflineIndicator from './components/common/OfflineIndicator';
import KeyboardShortcutsModal from './components/common/KeyboardShortcutsModal';
import ErrorBoundary from './components/common/ErrorBoundary';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

// App Context
const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

const PAGES = {
  DASHBOARD: 'dashboard',
  IMPORT: 'import',
  TRADE: 'trade',
  FLEECE: 'fleece',
  TRADEFINDER: 'tradefinder',
  PLAYERCOMPARE: 'playercompare',
  HISTORY: 'history',
  FREEAGENTS: 'freeagents',
  POWERRANKINGS: 'powerrankings',
  TRADEDATABASE: 'tradedatabase',
  SEASONSIM: 'seasonsim',
  MOCKDRAFT: 'mockdraft',
  SETTINGS: 'settings'
};

function AppContent() {
  const [page, setPage] = useState(PAGES.DASHBOARD);
  const [league, setLeague] = useState(null);
  const [myRosterId, setMyRosterId] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [selectedOpponentId, setSelectedOpponentId] = useState(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Load saved data
  useEffect(() => {
    const savedKey = localStorage.getItem('fff_api_key');
    if (savedKey) setApiKey(savedKey);

    const savedLeague = localStorage.getItem('fff_league');
    const savedRosterId = localStorage.getItem('fff_roster_id');

    if (savedLeague) {
      try {
        setLeague(JSON.parse(savedLeague));
        if (savedRosterId) setMyRosterId(parseInt(savedRosterId));
      } catch (e) {
        console.error('Failed to load saved league');
      }
    }
  }, []);

  // Save API key
  useEffect(() => {
    if (apiKey) localStorage.setItem('fff_api_key', apiKey);
  }, [apiKey]);

  const handleImport = (leagueData, rosterId) => {
    setLeague(leagueData);
    setMyRosterId(rosterId);
    localStorage.setItem('fff_league', JSON.stringify(leagueData));
    localStorage.setItem('fff_roster_id', rosterId.toString());
    setPage(PAGES.DASHBOARD);
  };

  const handleClearData = () => {
    setLeague(null);
    setMyRosterId(null);
    setSelectedOpponentId(null);
    localStorage.removeItem('fff_league');
    localStorage.removeItem('fff_roster_id');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    '/': (e) => {
      // Focus search input if it exists
      const searchInput = document.querySelector('input[type="text"], input[type="search"]');
      if (searchInput) {
        searchInput.focus();
      }
    },
    't': () => {
      if (league) {
        setPage(PAGES.TRADE);
      }
    },
    'Escape': () => {
      setShowShortcutsModal(false);
    },
    '?': () => {
      setShowShortcutsModal(true);
    }
  });

  const myRoster = league?.rosters?.find(r => r.rosterId === myRosterId);
  const opponents = league?.rosters?.filter(r => r.rosterId !== myRosterId) || [];
  const selectedOpponent = opponents.find(r => r.rosterId === selectedOpponentId);

  const contextValue = {
    league,
    myRoster,
    myRosterId,
    opponents,
    selectedOpponentId,
    setSelectedOpponentId,
    selectedOpponent,
    apiKey,
    setApiKey,
    page,
    setPage,
    PAGES
  };

  const renderPage = () => {
    switch (page) {
      case PAGES.IMPORT:
        return <ImportLeague onImport={handleImport} />;
      case PAGES.TRADE:
        return <TradeBuilder />;
      case PAGES.FLEECE:
        return <FleeceFinder />;
      case PAGES.TRADEFINDER:
        return <TradeFinder />;
      case PAGES.PLAYERCOMPARE:
        return <PlayerCompare />;
      case PAGES.HISTORY:
        return <TradeHistory />;
      case PAGES.FREEAGENTS:
        return <FreeAgents />;
      case PAGES.POWERRANKINGS:
        return <LeaguePowerRankings />;
      case PAGES.TRADEDATABASE:
        return <TradeDatabase />;
      case PAGES.SEASONSIM:
        return <SeasonSimulator />;
      case PAGES.MOCKDRAFT:
        return <MockDraft />;
      case PAGES.SETTINGS:
        return <Settings onClearData={handleClearData} onShowShortcuts={() => setShowShortcutsModal(true)} />;
      default:
        return <Dashboard onImportClick={() => setPage(PAGES.IMPORT)} />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <OfflineIndicator />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          {renderPage()}
        </main>
        <MobileNav />
      </div>
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </AppContext.Provider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
