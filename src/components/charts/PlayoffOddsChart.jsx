import React from 'react';

/**
 * Horizontal bar chart displaying playoff odds for each team
 * Color coded: green (>75%), yellow (25-75%), red (<25%)
 */
function PlayoffOddsChart({ results, myRosterId }) {
  if (!results || results.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <p>No simulation results available</p>
      </div>
    );
  }

  // Sort by playoff odds descending
  const sortedResults = [...results].sort((a, b) => b.playoffOdds - a.playoffOdds);

  const getOddsColor = (odds) => {
    if (odds >= 75) return 'var(--accent)'; // Green
    if (odds >= 25) return 'var(--orange)'; // Yellow/Orange
    return 'var(--red)'; // Red
  };

  const getOddsLabel = (odds) => {
    if (odds >= 75) return 'Strong';
    if (odds >= 25) return 'Possible';
    return 'Unlikely';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sortedResults.map((team, index) => {
        const isMyTeam = team.rosterId === myRosterId;
        const oddsColor = getOddsColor(team.playoffOdds);
        const oddsLabel = getOddsLabel(team.playoffOdds);

        return (
          <div
            key={team.rosterId}
            style={{
              background: isMyTeam ? 'var(--accent-muted)' : 'var(--bg-elevated)',
              border: isMyTeam ? '2px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px',
              transition: 'all 0.2s'
            }}
          >
            {/* Team name and rank */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  background: 'var(--bg-base)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: index < 4 ? 'var(--accent)' : 'var(--text-muted)'
                }}>
                  {index + 1}
                </span>
                <span style={{
                  fontWeight: isMyTeam ? '700' : '500',
                  color: isMyTeam ? 'var(--accent)' : 'var(--text-primary)'
                }}>
                  {team.name}
                  {isMyTeam && ' (You)'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                }}>
                  {oddsLabel}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: oddsColor,
                  minWidth: '60px',
                  textAlign: 'right'
                }}>
                  {team.playoffOdds}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '8px',
              background: 'var(--bg-base)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${team.playoffOdds}%`,
                height: '100%',
                background: oddsColor,
                borderRadius: '4px',
                transition: 'width 0.5s ease',
                boxShadow: `0 0 8px ${oddsColor}33`
              }} />
            </div>

            {/* Additional stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '10px',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)'
            }}>
              <span>
                Proj: {team.avgWins}-{team.avgLosses}
              </span>
              <span>
                Championship: {team.championshipOdds}%
              </span>
              <span>
                Finish: {team.bestCase}-{team.worstCase}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PlayoffOddsChart;
