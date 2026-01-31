import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { getPendingTrades } from '../services/sleeper';
import { getPlayerValue, getPickValue } from '../services/values';

function PendingTrades() {
  const { league, myRoster, myRosterId } = useApp();
  const [pendingTrades, setPendingTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchPendingTrades = async () => {
    if (!league?.league?.id) return;

    setLoading(true);
    setError(null);

    try {
      const trades = await getPendingTrades(league.league.id);

      // Enrich trades with player/pick details
      const enrichedTrades = trades.map(trade => {
        const rosterIds = trade.roster_ids || [];
        const adds = trade.adds || {};
        const drops = trade.drops || {};
        const draftPicks = trade.draft_picks || [];

        // Determine which roster is offering (first roster is usually the initiator)
        const isIncoming = rosterIds.includes(myRosterId) && rosterIds[0] !== myRosterId;
        const isOutgoing = rosterIds[0] === myRosterId;
        const involvesMe = rosterIds.includes(myRosterId);

        // Parse what each side gets
        const sides = rosterIds.map(rosterId => {
          const roster = league.rosters.find(r => r.rosterId === rosterId);

          // Players this roster receives
          const playersReceiving = Object.entries(adds)
            .filter(([playerId, rId]) => rId === rosterId)
            .map(([playerId]) => {
              const player = league.allPlayers?.[playerId];
              if (!player) return null;
              return {
                id: playerId,
                name: `${player.first_name} ${player.last_name}`,
                position: player.position,
                team: player.team,
                value: getPlayerValue({
                  position: player.position,
                  age: player.age,
                  yearsExp: player.years_exp,
                  searchRank: player.search_rank
                })
              };
            })
            .filter(Boolean);

          // Picks this roster receives
          const picksReceiving = draftPicks
            .filter(pick => pick.owner_id === rosterId)
            .map(pick => ({
              year: parseInt(pick.season),
              round: pick.round,
              originalOwner: league.rosters.find(r => r.rosterId === pick.roster_id)?.name || `Team ${pick.roster_id}`,
              value: getPickValue(parseInt(pick.season), pick.round, 'mid')
            }));

          const totalValue = playersReceiving.reduce((sum, p) => sum + p.value, 0) +
            picksReceiving.reduce((sum, p) => sum + p.value, 0);

          return {
            rosterId,
            rosterName: roster?.name || `Team ${rosterId}`,
            playersReceiving,
            picksReceiving,
            totalValue
          };
        });

        // Find my side and their side
        const mySide = sides.find(s => s.rosterId === myRosterId);
        const theirSide = sides.find(s => s.rosterId !== myRosterId);

        return {
          ...trade,
          sides,
          mySide,
          theirSide,
          isIncoming,
          isOutgoing,
          involvesMe,
          createdAt: new Date(trade.created),
          valueDiff: mySide && theirSide ? mySide.totalValue - theirSide.totalValue : 0
        };
      });

      // Filter to only trades that involve me
      const myTrades = enrichedTrades.filter(t => t.involvesMe);
      setPendingTrades(myTrades);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch pending trades:', err);
      setError('Failed to fetch pending trades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTrades();
  }, [league?.league?.id, myRosterId]);

  if (!myRoster) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📥</div>
        <p>Import a league first</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Pending Trades</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Incoming trade offers from your Sleeper league
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastRefresh && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            className="btn btn-primary"
            onClick={fetchPendingTrades}
            disabled={loading}
          >
            {loading ? 'Checking...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card" style={{ marginBottom: '20px', borderColor: 'var(--red)' }}>
          <div className="card-body" style={{ color: 'var(--red)' }}>
            {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && pendingTrades.length === 0 && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📨</div>
            <h3 style={{ marginBottom: '8px' }}>Checking for Pending Trades...</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Fetching trade offers from Sleeper
            </p>
          </div>
        </div>
      )}

      {/* No Pending Trades */}
      {!loading && pendingTrades.length === 0 && (
        <div className="card">
          <div className="empty-state" style={{ minHeight: 300 }}>
            <div className="empty-state-icon">📭</div>
            <h3>No Pending Trades</h3>
            <p>You don't have any pending trade offers right now</p>
            <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              When someone sends you a trade offer on Sleeper, it will appear here for analysis.
            </p>
          </div>
        </div>
      )}

      {/* Pending Trades List */}
      {pendingTrades.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pendingTrades.map((trade, index) => (
            <PendingTradeCard key={trade.transaction_id || index} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
}

function PendingTradeCard({ trade }) {
  const { mySide, theirSide, valueDiff, isIncoming, createdAt } = trade;

  const recommendation = valueDiff > 500 ? 'accept' : valueDiff < -500 ? 'decline' : 'consider';
  const recommendationColor = recommendation === 'accept' ? 'var(--accent)' :
    recommendation === 'decline' ? 'var(--red)' : '#f59e0b';
  const recommendationText = recommendation === 'accept' ? 'Good Deal - Consider Accepting' :
    recommendation === 'decline' ? 'Bad Deal - Consider Declining' : 'Fair Trade - Your Call';

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: isIncoming ? 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)' : 'var(--bg-elevated)',
        color: isIncoming ? 'white' : 'var(--text-primary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>{isIncoming ? '📨' : '📤'}</span>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
              {isIncoming ? `Trade from ${theirSide?.rosterName}` : `Your offer to ${theirSide?.rosterName}`}
            </h3>
            <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.8 }}>
              {createdAt.toLocaleDateString()} at {createdAt.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: isIncoming ? 'rgba(255,255,255,0.2)' : 'var(--bg-base)',
          color: isIncoming ? 'white' : 'var(--text-muted)'
        }}>
          PENDING
        </span>
      </div>

      {/* Trade Details */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'stretch' }}>
          {/* You Give */}
          <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--red)', marginBottom: '12px', textTransform: 'uppercase' }}>
              YOU GIVE
            </div>
            {theirSide?.playersReceiving.map((player, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className={`pos-badge pos-${player.position?.toLowerCase()}`} style={{ fontSize: '0.625rem', padding: '2px 6px' }}>
                  {player.position}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>{player.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {player.value.toLocaleString()}
                </span>
              </div>
            ))}
            {theirSide?.picksReceiving.map((pick, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem' }}>📝</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>
                  {pick.year} Round {pick.round}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {pick.value.toLocaleString()}
                </span>
              </div>
            ))}
            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--red)' }}>
              Total: {theirSide?.totalValue.toLocaleString()}
            </div>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem', color: 'var(--text-muted)' }}>⇄</div>

          {/* You Get */}
          <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '12px', textTransform: 'uppercase' }}>
              YOU GET
            </div>
            {mySide?.playersReceiving.map((player, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className={`pos-badge pos-${player.position?.toLowerCase()}`} style={{ fontSize: '0.625rem', padding: '2px 6px' }}>
                  {player.position}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>{player.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {player.value.toLocaleString()}
                </span>
              </div>
            ))}
            {mySide?.picksReceiving.map((pick, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem' }}>📝</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>
                  {pick.year} Round {pick.round}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {pick.value.toLocaleString()}
                </span>
              </div>
            ))}
            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)' }}>
              Total: {mySide?.totalValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Analysis */}
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: recommendationColor + '15',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${recommendationColor}40`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>AI ANALYSIS</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: recommendationColor }}>
                {recommendationText}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>VALUE DIFFERENCE</div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: valueDiff > 0 ? 'var(--accent)' : valueDiff < 0 ? 'var(--red)' : 'var(--text-secondary)'
              }}>
                {valueDiff > 0 ? '+' : ''}{valueDiff.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Action Reminder */}
        <p style={{ marginTop: '12px', fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Open the Sleeper app to accept or decline this trade
        </p>
      </div>
    </div>
  );
}

export default PendingTrades;
