import React, { useState, useEffect } from 'react';
import { useApp } from '../../App';
import { detectLeagueSettings } from '../../services/sleeper';
import { calculatePowerRankings } from '../../services/leagueIntelligence';

function LeaguePowerRankings() {
  const { league, myRoster } = useApp();
  const [rankings, setRankings] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [leagueSettings, setLeagueSettings] = useState(null);

  useEffect(() => {
    if (league && league.league && league.rosters) {
      const settings = detectLeagueSettings(league.league);
      setLeagueSettings(settings);

      const powerRankings = calculatePowerRankings(league.rosters, settings);
      setRankings(powerRankings);
    }
  }, [league]);

  if (!league || !leagueSettings) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
        <h2>No league data available</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Import a league to see power rankings.</p>
      </div>
    );
  }

  const myRanking = rankings.find(r => r.rosterId === myRoster?.rosterId);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>League Power Rankings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {league.league.name} - {leagueSettings.scoringType.toUpperCase()}
          {leagueSettings.isSuperFlex && ' SuperFlex'}
          {leagueSettings.isTEPremium && ' TE Premium'}
        </p>
      </div>

      {myRanking && (
        <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--accent-dim) 100%)', border: '2px solid var(--accent)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>YOUR TEAM</div>
                <h2 style={{ margin: '0 0 8px 0' }}>{myRanking.name}</h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span className={`status-badge status-${myRanking.status.toLowerCase()}`}>
                    {formatStatus(myRanking.status)}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Window: {myRanking.competitiveWindow}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                  #{myRanking.rank}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Score: {myRanking.score}/100
                </div>
              </div>
            </div>
            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Analysis:</div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem', lineHeight: '1.6' }}>
                {myRanking.reasoning.slice(0, 4).map((reason, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)' }}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: '24px', gap: '16px' }}>
        <div className="card">
          <div className="card-header">
            <h3>League Overview</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <StatItem label="Contenders" value={rankings.filter(r => r.status === 'CONTENDER').length} />
              <StatItem label="Rebuilders" value={rankings.filter(r => r.status === 'REBUILDER').length} />
              <StatItem label="Avg Team Score" value={Math.round(rankings.reduce((sum, r) => sum + r.score, 0) / rankings.length)} />
              <StatItem label="League Size" value={leagueSettings.leagueSize} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Competitive Windows</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <StatItem label="Win-Now (1yr)" value={rankings.filter(r => r.competitiveWindow === '1-year').length} />
              <StatItem label="Multi-Year" value={rankings.filter(r => r.competitiveWindow === '2-3 year').length} />
              <StatItem label="Rebuilding" value={rankings.filter(r => r.competitiveWindow === 'rebuilding').length} />
              <StatItem label="Retooling" value={rankings.filter(r => r.competitiveWindow === 'retool').length} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Full Rankings</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rank</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Team</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Record</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Window</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((team) => (
                  <tr
                    key={team.rosterId}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: team.rosterId === myRoster?.rosterId ? 'var(--accent-dim)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedTeam(selectedTeam?.rosterId === team.rosterId ? null : team)}
                  >
                    <td style={{ padding: '12px', fontWeight: 'bold', color: team.rank <= 3 ? 'var(--accent)' : 'inherit' }}>
                      #{team.rank}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '500' }}>{team.name}</div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {team.wins}-{team.losses}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span className={`status-badge status-${team.status.toLowerCase()}`}>
                        {formatStatus(team.status)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                      {team.score}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {team.competitiveWindow}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        className="btn btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeam(selectedTeam?.rosterId === team.rosterId ? null : team);
                        }}
                      >
                        {selectedTeam?.rosterId === team.rosterId ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedTeam && (
        <div className="card" style={{ marginTop: '24px', border: '2px solid var(--accent)' }}>
          <div className="card-header" style={{ background: 'var(--accent-dim)' }}>
            <h3>{selectedTeam.name} - Detailed Analysis</h3>
          </div>
          <div className="card-body">
            <div className="grid-2" style={{ marginBottom: '24px', gap: '16px' }}>
              <div>
                <h4 style={{ marginBottom: '12px' }}>Team Profile</h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <DetailRow label="Rank" value={`#${selectedTeam.rank} of ${rankings.length}`} />
                  <DetailRow label="Score" value={`${selectedTeam.score}/100 (${Math.round(selectedTeam.confidence * 100)}% confidence)`} />
                  <DetailRow label="Status" value={formatStatus(selectedTeam.status)} />
                  <DetailRow label="Competitive Window" value={selectedTeam.competitiveWindow} />
                  <DetailRow label="Projected Points" value={selectedTeam.projectedPoints.toLocaleString()} />
                  <DetailRow label="Total Roster Value" value={selectedTeam.totalValue.toLocaleString()} />
                  <DetailRow label="Starter Value" value={selectedTeam.starterValue.toLocaleString()} />
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '12px' }}>Score Breakdown</h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <ScoreBar label="Record" value={selectedTeam.breakdown.record} max={20} />
                  <ScoreBar label="Roster Age" value={selectedTeam.breakdown.rosterAge} max={20} />
                  <ScoreBar label="Starters" value={selectedTeam.breakdown.starterValue} max={30} />
                  <ScoreBar label="Depth" value={selectedTeam.breakdown.depth} max={15} />
                  <ScoreBar label="Pick Capital" value={selectedTeam.breakdown.pickCapital} max={15} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '12px' }}>Reasoning</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem', lineHeight: '1.8' }}>
                {selectedTeam.reasoning.map((reason, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)' }}>{reason}</li>
                ))}
              </ul>
            </div>

            <div className="grid-2" style={{ gap: '16px', marginBottom: '24px' }}>
              <TeamNeedsSection needs={selectedTeam.teamNeeds.critical} title="Critical Needs" color="var(--error)" />
              <TeamNeedsSection needs={selectedTeam.teamNeeds.high} title="High Priority" color="var(--warning)" />
            </div>

            <div className="grid-2" style={{ gap: '16px', marginBottom: '24px' }}>
              <TeamNeedsSection needs={selectedTeam.teamNeeds.medium} title="Medium Priority" color="var(--info)" />
              <TeamNeedsSection needs={selectedTeam.teamNeeds.strengths} title="Strengths" color="var(--success)" />
            </div>

            {selectedTeam.bestTradePartners && selectedTeam.bestTradePartners.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '12px' }}>Best Trade Partners</h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {selectedTeam.bestTradePartners.map((partner, i) => (
                    <div key={i} className="card" style={{ padding: '12px', background: 'var(--bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '600' }}>{partner.name}</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>
                          {partner.synergy}% match
                        </span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem' }}>
                        {partner.reasons.map((reason, j) => (
                          <li key={j} style={{ color: 'var(--text-secondary)' }}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px' }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent)' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontWeight: '500' }}>{value}</span>
    </div>
  );
}

function ScoreBar({ label, value, max }) {
  const percentage = (value / max) * 100;
  const color = percentage >= 80 ? 'var(--success)' : percentage >= 60 ? 'var(--accent)' : percentage >= 40 ? 'var(--warning)' : 'var(--error)';

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: '600' }}>{value}/{max}</span>
      </div>
      <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percentage}%`, background: color, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}

function TeamNeedsSection({ needs, title, color }) {
  if (!needs || needs.length === 0) return null;

  return (
    <div>
      <h4 style={{ marginBottom: '12px', color }}>{title}</h4>
      <div style={{ display: 'grid', gap: '8px' }}>
        {needs.map((need, i) => (
          <div key={i} className="card" style={{ padding: '10px', background: 'var(--bg)', borderLeft: `3px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span className={`pos-badge pos-${need.position?.toLowerCase()}`}>{need.position}</span>
              {need.priority && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{need.priority}</span>
              )}
            </div>
            <div style={{ fontSize: '0.875rem', marginBottom: '4px' }}>
              {need.reason || need.detail}
            </div>
            {need.recommendation && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {need.recommendation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatStatus(status) {
  const statusMap = {
    'CONTENDER': 'Contender',
    'FRINGE_CONTENDER': 'Fringe',
    'MIDDLE': 'Middle',
    'REBUILDER': 'Rebuild'
  };
  return statusMap[status] || status;
}

export default LeaguePowerRankings;
