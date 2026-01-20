import React, { useState, useEffect } from 'react';
import { useApp } from '../../App';
import { getAllTrades, getPlayers } from '../../services/sleeper';
import { getPlayerValue, getPickValue, estimatePickTier } from '../../services/values';
import { calculateTradeRegret } from '../../services/claude';

function TradeRegretCalculator() {
  const { league, apiKey } = useApp();
  const [trades, setTrades] = useState([]);
  const [players, setPlayers] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (league?.league?.id) {
      loadTrades();
    }
  }, [league?.league?.id]);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const [tradesData, playersData] = await Promise.all([
        getAllTrades(league.league.id),
        getPlayers()
      ]);
      setTrades(tradesData);
      setPlayers(playersData);
    } catch (err) {
      console.error('Failed to load trades:', err);
    }
    setLoading(false);
  };

  const getRosterName = (rosterId) => {
    const roster = league?.rosters?.find(r => r.rosterId === rosterId);
    return roster?.name || `Team ${rosterId}`;
  };

  const getPlayerInfo = (playerId) => {
    const p = players[playerId];
    if (!p) return null;

    const name = `${p.first_name} ${p.last_name}`;
    const player = {
      id: playerId,
      name,
      position: p.position,
      team: p.team,
      age: p.age,
      injuryStatus: p.injury_status
    };

    return {
      ...player,
      currentValue: getPlayerValue(player)
    };
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleAnalyzeTrade = async (trade) => {
    if (!apiKey) {
      alert('Add your Claude API key in Settings');
      return;
    }

    setSelectedTrade(trade);
    setAnalyzing(true);
    setAnalysis('');

    try {
      const rosterIds = trade.roster_ids || [];
      const roster1Id = rosterIds[0];
      const roster2Id = rosterIds[1];

      // Get what each roster received
      const roster1Adds = trade.adds ? Object.entries(trade.adds).filter(([pid, rid]) => rid === roster1Id).map(([pid]) => pid) : [];
      const roster2Adds = trade.adds ? Object.entries(trade.adds).filter(([pid, rid]) => rid === roster2Id).map(([pid]) => pid) : [];

      const roster1Picks = trade.draft_picks?.filter(p => p.owner_id === roster1Id) || [];
      const roster2Picks = trade.draft_picks?.filter(p => p.owner_id === roster2Id) || [];

      // Build side1 (what roster1 gave = what roster2 received)
      const side1 = [];
      roster2Adds.forEach(pid => {
        const info = getPlayerInfo(pid);
        if (info) {
          side1.push({
            name: info.name,
            position: info.position,
            originalValue: info.currentValue, // We don't have historical values, so use current as proxy
            type: 'player'
          });
        }
      });
      roster2Picks.forEach(pick => {
        const totalRosters = league?.rosters?.length || 12;
        const tier = 'mid'; // We don't have historical tier info
        side1.push({
          name: `${pick.season} Round ${pick.round}`,
          originalValue: getPickValue(pick.season, pick.round, tier),
          type: 'pick'
        });
      });

      // Build side2 (what roster1 received = what roster1 got)
      const side2 = [];
      roster1Adds.forEach(pid => {
        const info = getPlayerInfo(pid);
        if (info) {
          side2.push({
            name: info.name,
            position: info.position,
            originalValue: info.currentValue,
            type: 'player'
          });
        }
      });
      roster1Picks.forEach(pick => {
        const totalRosters = league?.rosters?.length || 12;
        const tier = 'mid';
        side2.push({
          name: `${pick.season} Round ${pick.round}`,
          originalValue: getPickValue(pick.season, pick.round, tier),
          type: 'pick'
        });
      });

      // For current values, use the same data (in a real scenario, we'd fetch historical data)
      const side1Current = side1.map(item => ({
        ...item,
        currentValue: item.originalValue // Simplified - would need historical comparison
      }));

      const side2Current = side2.map(item => ({
        ...item,
        currentValue: item.originalValue
      }));

      const result = await calculateTradeRegret(apiKey, {
        historicalTrade: {
          date: formatDate(trade.created),
          side1,
          side2,
          side1Owner: getRosterName(roster1Id),
          side2Owner: getRosterName(roster2Id)
        },
        currentValues: {
          side1Current,
          side2Current
        }
      });

      setAnalysis(result);
    } catch (err) {
      setAnalysis(`Error: ${err.message}`);
    }

    setAnalyzing(false);
  };

  if (!league) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📥</div>
        <p>Import a league first</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>Trade Regret Calculator</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Analyze past trades to see who won and by how much
        </p>
      </div>

      {loading ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
            Loading trade history...
          </div>
        </div>
      ) : trades.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🤝</div>
            <h3>No Trades Yet</h3>
            <p>No trades have been made this season</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3>Select a Trade to Analyze</h3>
            </div>
            <div className="card-body" style={{ padding: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              {trades.map((trade, idx) => {
                const rosterIds = trade.roster_ids || [];
                const roster1Id = rosterIds[0];
                const roster2Id = rosterIds[1];

                const roster1Adds = trade.adds ? Object.entries(trade.adds).filter(([pid, rid]) => rid === roster1Id).map(([pid]) => pid) : [];
                const roster2Adds = trade.adds ? Object.entries(trade.adds).filter(([pid, rid]) => rid === roster2Id).map(([pid]) => pid) : [];

                return (
                  <div
                    key={trade.transaction_id || idx}
                    className={`player-row ${selectedTrade?.transaction_id === trade.transaction_id ? 'selected' : ''}`}
                    onClick={() => setSelectedTrade(trade)}
                    style={{ cursor: 'pointer', display: 'block', padding: '12px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {getRosterName(roster1Id)} ⇄ {getRosterName(roster2Id)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatDate(trade.created)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {roster1Adds.length + (trade.draft_picks?.filter(p => p.owner_id === roster1Id).length || 0)} assets ⇄{' '}
                      {roster2Adds.length + (trade.draft_picks?.filter(p => p.owner_id === roster2Id).length || 0)} assets
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedTrade && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <h3>Trade Details</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                  {selectedTrade.roster_ids?.map(rosterId => {
                    const adds = selectedTrade.adds ? Object.entries(selectedTrade.adds).filter(([pid, rid]) => rid === rosterId).map(([pid]) => pid) : [];
                    const draftPicks = selectedTrade.draft_picks?.filter(p => p.owner_id === rosterId) || [];

                    return (
                      <div key={rosterId}>
                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                          {getRosterName(rosterId)} receives:
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {adds.map(pid => {
                            const info = getPlayerInfo(pid);
                            return info ? (
                              <div key={pid} style={{ padding: '4px 0' }}>
                                {info.name} ({info.currentValue.toLocaleString()})
                              </div>
                            ) : null;
                          })}
                          {draftPicks.map((pick, i) => (
                            <div key={i} style={{ padding: '4px 0' }}>
                              📝 {pick.season} Round {pick.round}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => handleAnalyzeTrade(selectedTrade)}
                  disabled={analyzing}
                  style={{ width: '100%' }}
                >
                  {analyzing ? 'Analyzing...' : 'Analyze This Trade'}
                </button>
              </div>
            </div>
          )}

          {analyzing && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Calculating trade regret...
              </div>
            </div>
          )}

          {analysis && !analyzing && (
            <div className="card">
              <div className="card-header">
                <h3>Trade Analysis</h3>
              </div>
              <div className="card-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                {analysis}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TradeRegretCalculator;
