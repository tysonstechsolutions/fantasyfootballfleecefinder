import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { getPlayerValue, getPickValue, analyzeTrade, estimatePickTier } from '../services/values';
import { analyzeTradeAI, suggestBestTrades } from '../services/claude';
import useDebounce from '../hooks/useDebounce';

function TradeBuilder() {
  const { league, myRoster, opponents, apiKey } = useApp();
  const [partnerId, setPartnerId] = useState(opponents[0]?.rosterId || null);
  const [iGive, setIGive] = useState([]);
  const [iGet, setIGet] = useState([]);
  const [aiResult, setAiResult] = useState('');
  const [suggestedTrades, setSuggestedTrades] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState('');
  const [tab, setTab] = useState('players');
  const hasFetchedRef = useRef({});

  const partner = opponents.find(r => r.rosterId === partnerId);

  // Debounce partner changes to prevent API spam
  const debouncedPartnerId = useDebounce(partnerId, 1000);

  // Auto-suggest trades when partner changes (debounced)
  useEffect(() => {
    if (debouncedPartnerId && partner && apiKey && !hasFetchedRef.current[debouncedPartnerId]) {
      hasFetchedRef.current[debouncedPartnerId] = true;
      handleSuggestTrades();
    }
  }, [debouncedPartnerId]);

  // Add values to players
  const myPlayersWithValue = useMemo(() => {
    return myRoster.players.map(p => ({ ...p, value: getPlayerValue(p) })).sort((a, b) => b.value - a.value);
  }, [myRoster]);

  const partnerPlayersWithValue = useMemo(() => {
    if (!partner) return [];
    return partner.players.map(p => ({ ...p, value: getPlayerValue(p) })).sort((a, b) => b.value - a.value);
  }, [partner]);

  // Add values to picks
  const myPicksWithValue = useMemo(() => {
    const totalRosters = league?.rosters?.length || 12;
    return myRoster.picks.map(p => {
      const tier = estimatePickTier(myRoster, totalRosters);
      return { ...p, value: getPickValue(p.year, p.round, tier), type: 'pick' };
    });
  }, [myRoster, league]);

  const partnerPicksWithValue = useMemo(() => {
    if (!partner) return [];
    const totalRosters = league?.rosters?.length || 12;
    return partner.picks.map(p => {
      const tier = estimatePickTier(partner, totalRosters);
      return { ...p, value: getPickValue(p.year, p.round, tier), type: 'pick' };
    });
  }, [partner, league]);

  const toggleGive = (item, isPick = false) => {
    const id = isPick ? `${item.year}-${item.round}-${item.originalOwnerRosterId}` : item.id;
    const exists = iGive.find(x => (isPick ? `${x.year}-${x.round}-${x.originalOwnerRosterId}` : x.id) === id);

    if (exists) {
      setIGive(iGive.filter(x => (isPick ? `${x.year}-${x.round}-${x.originalOwnerRosterId}` : x.id) !== id));
    } else {
      setIGive([...iGive, { ...item, type: isPick ? 'pick' : 'player' }]);
    }
  };

  const toggleGet = (item, isPick = false) => {
    const id = isPick ? `${item.year}-${item.round}-${item.originalOwnerRosterId}` : item.id;
    const exists = iGet.find(x => (isPick ? `${x.year}-${x.round}-${x.originalOwnerRosterId}` : x.id) === id);

    if (exists) {
      setIGet(iGet.filter(x => (isPick ? `${x.year}-${x.round}-${x.originalOwnerRosterId}` : x.id) !== id));
    } else {
      setIGet([...iGet, { ...item, type: isPick ? 'pick' : 'player' }]);
    }
  };

  const isInGive = (item, isPick = false) => {
    const id = isPick ? `${item.year}-${item.round}-${item.originalOwnerRosterId}` : item.id;
    return iGive.some(x => (isPick ? `${x.year}-${x.round}-${x.originalOwnerRosterId}` : x.id) === id);
  };

  const isInGet = (item, isPick = false) => {
    const id = isPick ? `${item.year}-${item.round}-${item.originalOwnerRosterId}` : item.id;
    return iGet.some(x => (isPick ? `${x.year}-${x.round}-${x.originalOwnerRosterId}` : x.id) === id);
  };

  const analysis = useMemo(() => {
    if (iGive.length === 0 && iGet.length === 0) return null;
    return analyzeTrade(iGive, iGet);
  }, [iGive, iGet]);

  const handleSuggestTrades = async () => {
    if (!apiKey) {
      return;
    }
    if (!partner) {
      return;
    }
    setLoading(true);
    setLoadingType('suggest');
    setSuggestedTrades('');
    try {
      const result = await suggestBestTrades(apiKey, { myRoster, theirRoster: partner });
      setSuggestedTrades(result);
    } catch (err) {
      setSuggestedTrades('Error: ' + err.message);
    }
    setLoading(false);
    setLoadingType('');
  };

  const handleAI = async () => {
    if (!apiKey) {
      alert('Add your Claude API key in Settings');
      return;
    }
    setLoading(true);
    setLoadingType('analyze');
    setAiResult('');
    try {
      const result = await analyzeTradeAI(apiKey, { myRoster, theirRoster: partner, iGive, iGet });
      setAiResult(result);
    } catch (err) {
      setAiResult('Error: ' + err.message);
    }
    setLoading(false);
    setLoadingType('');
  };

  const clearTrade = () => {
    setIGive([]);
    setIGet([]);
    setAiResult('');
  };

  const handlePartnerChange = (newPartnerId) => {
    setPartnerId(newPartnerId);
    setIGet([]);
    setAiResult('');
    setSuggestedTrades('');
  };

  if (!myRoster) {
    return <div className="empty-state"><div className="empty-state-icon">📥</div><p>Import a league first</p></div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h1>Trade Builder</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Trading with:</span>
          <select
            value={partnerId || ''}
            onChange={(e) => handlePartnerChange(parseInt(e.target.value))}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
          >
            {opponents.map(r => <option key={r.rosterId} value={r.rosterId}>{r.name}</option>)}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleSuggestTrades}
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            {loadingType === 'suggest' ? 'Finding...' : 'Find Best Trades'}
          </button>
        </div>
      </div>

      {/* AI Suggested Trades */}
      {suggestedTrades && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3>Best Trades with {partner?.name}</h3>
          </div>
          <div className="card-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {suggestedTrades}
          </div>
        </div>
      )}

      {loadingType === 'suggest' && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Finding the best trades with {partner?.name}...
          </div>
        </div>
      )}

      {/* Trade Summary */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', padding: '20px' }}>
          {/* I Give */}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span>You Give</span>
              <span style={{ color: 'var(--red)' }}>{iGive.reduce((s, x) => s + x.value, 0).toLocaleString()}</span>
            </div>
            <div style={{ minHeight: 80, background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
              {iGive.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', padding: '20px' }}>
                  Click players below to add
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {iGive.map((item, i) => (
                    <TradeAsset key={i} item={item} onRemove={() => item.type === 'pick' ? toggleGive(item, true) : toggleGive(item)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Middle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ fontSize: '1.5rem' }}>⇄</div>
            {analysis && (
              <div className={`verdict ${analysis.level}`}>{analysis.verdict}</div>
            )}
            {analysis && (
              <div style={{ fontSize: '0.8125rem', color: analysis.level === 'win' ? 'var(--accent)' : analysis.level === 'lose' ? 'var(--red)' : 'var(--text-secondary)' }}>
                {analysis.diff > 0 ? '+' : ''}{analysis.diff.toLocaleString()} ({analysis.pct > 0 ? '+' : ''}{analysis.pct.toFixed(1)}%)
              </div>
            )}
          </div>

          {/* I Get */}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span>You Receive</span>
              <span style={{ color: 'var(--accent)' }}>{iGet.reduce((s, x) => s + x.value, 0).toLocaleString()}</span>
            </div>
            <div style={{ minHeight: 80, background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
              {iGet.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', padding: '20px' }}>
                  Click players below to add
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {iGet.map((item, i) => (
                    <TradeAsset key={i} item={item} onRemove={() => item.type === 'pick' ? toggleGet(item, true) : toggleGet(item)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 20px', display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={handleAI} disabled={loading || (iGive.length === 0 && iGet.length === 0)}>
            {loadingType === 'analyze' ? 'Analyzing...' : 'Analyze This Trade'}
          </button>
          <button className="btn btn-ghost" onClick={clearTrade}>Clear</button>
        </div>
      </div>

      {/* AI Result */}
      {aiResult && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header"><h3>Trade Analysis</h3></div>
          <div className="card-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {aiResult}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '16px', maxWidth: 300 }}>
        <button className={`tab ${tab === 'players' ? 'active' : ''}`} onClick={() => setTab('players')}>Players</button>
        <button className={`tab ${tab === 'picks' ? 'active' : ''}`} onClick={() => setTab('picks')}>Draft Picks</button>
      </div>

      {/* Rosters */}
      <div className="grid-2">
        {/* My Roster */}
        <div className="card">
          <div className="card-header">
            <h3>Your Roster</h3>
          </div>
          <div className="card-body" style={{ padding: '8px', maxHeight: 400, overflowY: 'auto' }}>
            {tab === 'players' ? (
              myPlayersWithValue.map(p => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  selected={isInGive(p)}
                  onClick={() => toggleGive(p)}
                />
              ))
            ) : (
              myPicksWithValue.length > 0 ? myPicksWithValue.map((pick, i) => (
                <PickRow
                  key={i}
                  pick={pick}
                  selected={isInGive(pick, true)}
                  onClick={() => toggleGive(pick, true)}
                />
              )) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No picks owned</div>
            )}
          </div>
        </div>

        {/* Partner Roster */}
        <div className="card">
          <div className="card-header">
            <h3>{partner?.name || 'Opponent'}'s Roster</h3>
          </div>
          <div className="card-body" style={{ padding: '8px', maxHeight: 400, overflowY: 'auto' }}>
            {tab === 'players' ? (
              partnerPlayersWithValue.map(p => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  selected={isInGet(p)}
                  onClick={() => toggleGet(p)}
                />
              ))
            ) : (
              partnerPicksWithValue.length > 0 ? partnerPicksWithValue.map((pick, i) => (
                <PickRow
                  key={i}
                  pick={pick}
                  selected={isInGet(pick, true)}
                  onClick={() => toggleGet(pick, true)}
                />
              )) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No picks owned</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ player, selected, onClick }) {
  return (
    <div className={`player-row ${selected ? 'selected' : ''}`} onClick={onClick}>
      <span className={`pos-badge pos-${player.position?.toLowerCase()}`}>{player.position}</span>
      <span className="player-name">{player.name}</span>
      <span className="player-meta">{player.team}</span>
      <span className="player-value">{player.value.toLocaleString()}</span>
    </div>
  );
}

function PickRow({ pick, selected, onClick }) {
  return (
    <div className={`player-row ${selected ? 'selected' : ''}`} onClick={onClick}>
      <span style={{ fontSize: '1rem' }}>📝</span>
      <span className="player-name">{pick.year} Round {pick.round}</span>
      {!pick.isOwnPick && <span className="player-meta">({pick.originalOwnerName})</span>}
      <span className="player-value">{pick.value.toLocaleString()}</span>
    </div>
  );
}

function TradeAsset({ item, onRemove }) {
  return (
    <div className="trade-asset">
      {item.type === 'pick' ? (
        <>
          <span style={{ fontSize: '0.875rem' }}>📝</span>
          <span style={{ flex: 1, fontSize: '0.8125rem' }}>{item.year} Rd {item.round}</span>
        </>
      ) : (
        <>
          <span className={`pos-badge pos-${item.position?.toLowerCase()}`} style={{ fontSize: '0.625rem', padding: '2px 6px' }}>{item.position}</span>
          <span style={{ flex: 1, fontSize: '0.8125rem' }}>{item.name}</span>
        </>
      )}
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.value.toLocaleString()}</span>
      <button className="remove-btn" onClick={onRemove}>×</button>
    </div>
  );
}

export default TradeBuilder;
