import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { getAllTrades, getPlayers } from '../services/sleeper';

function TradeHistory() {
  const { league, myRosterId } = useApp();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState({});

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

  const getPlayerName = (playerId) => {
    const p = players[playerId];
    return p ? `${p.first_name} ${p.last_name}` : `Player ${playerId}`;
  };

  const formatPick = (pick) => {
    return `${pick.season} Round ${pick.round}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isMyTrade = (trade) => {
    return trade.roster_ids?.includes(myRosterId);
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
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>Trade History</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Recent trades in {league.league.name}
        </p>
      </div>

      {loading ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
            Loading trades...
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trades.map((trade, idx) => {
            const rosterIds = trade.roster_ids || [];
            const isMine = isMyTrade(trade);

            return (
              <div
                key={trade.transaction_id || idx}
                className="card"
                style={{
                  border: isMine ? '1px solid var(--accent)' : undefined,
                  background: isMine ? 'rgba(99, 102, 241, 0.05)' : undefined
                }}
              >
                <div className="card-body" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {formatDate(trade.created)}
                    </span>
                    {isMine && (
                      <span style={{
                        fontSize: '0.6875rem',
                        padding: '2px 8px',
                        background: 'var(--accent-muted)',
                        color: 'var(--accent)',
                        borderRadius: 4
                      }}>
                        YOUR TRADE
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {rosterIds.map(rosterId => {
                      const adds = trade.adds ? Object.entries(trade.adds).filter(([pid, rid]) => rid === rosterId).map(([pid]) => pid) : [];
                      const draftPicks = trade.draft_picks?.filter(p => p.owner_id === rosterId) || [];

                      return (
                        <div key={rosterId}>
                          <div style={{
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: rosterId === myRosterId ? 'var(--accent)' : 'var(--text-primary)'
                          }}>
                            {getRosterName(rosterId)} receives:
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {adds.map(pid => (
                              <div key={pid} style={{ padding: '4px 0' }}>
                                {getPlayerName(pid)}
                              </div>
                            ))}
                            {draftPicks.map((pick, i) => (
                              <div key={i} style={{ padding: '4px 0', color: 'var(--text-muted)' }}>
                                📝 {formatPick(pick)}
                              </div>
                            ))}
                            {adds.length === 0 && draftPicks.length === 0 && (
                              <div style={{ color: 'var(--text-muted)' }}>Nothing</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TradeHistory;
