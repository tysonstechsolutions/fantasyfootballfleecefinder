import React, { useState, useEffect, createContext, useContext } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import ImportLeague from './components/ImportLeague';
import TradeBuilder from './components/TradeBuilder';
import FleeceFinder from './components/FleeceFinder';
import FreeAgents from './components/FreeAgents';
import TradeHistory from './components/TradeHistory';
import Settings from './components/Settings';

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
  HISTORY: 'history',
  FREEAGENTS: 'freeagents',
  SETTINGS: 'settings'
};

function App() {
  const [page, setPage] = useState(PAGES.DASHBOARD);
  const [league, setLeague] = useState(null);
  const [myRosterId, setMyRosterId] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [selectedOpponentId, setSelectedOpponentId] = useState(null);

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
      case PAGES.HISTORY:
        return <TradeHistory />;
      case PAGES.FREEAGENTS:
        return <FreeAgents />;
      case PAGES.SETTINGS:
        return <Settings onClearData={handleClearData} />;
      default:
        return <Dashboard onImportClick={() => setPage(PAGES.IMPORT)} />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          {renderPage()}
        </main>
        <MobileNav />
      </div>
    </AppContext.Provider>
  );
}

export default App;
