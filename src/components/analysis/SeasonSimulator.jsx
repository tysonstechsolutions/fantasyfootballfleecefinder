import React, { useState } from 'react';
import { useApp } from '../../App';
import { simulateSeason } from '../../services/simulator';
import PlayoffOddsChart from '../charts/PlayoffOddsChart';

function SeasonSimulator() {
  const { league, myRosterId } = useApp();
  const [simulating, setSimulating] = useState(false);
  const [results, setResults] = useState(null);
  const [iterations, setIterations] = useState(10000);
  const [variance, setVariance] = useState(0.15);

  if (!league || !league.rosters) {
    return (
      <div className="empty-state" style={{ padding: '60px 20px' }}>
        <div className="empty-state-icon">📊</div>
        <h2>No League Data</h2>
        <p style={{ marginTop: '8px' }}>Import your league to simulate the season</p>
      </div>
    );
  }

  const handleRunSimulation = async () => {
    setSimulating(true);

    // Run simulation in a setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const simulationResults = simulateSeason(
          league.rosters,
          null, // Let it generate schedule
          iterations,
          variance
        );

        setResults(simulationResults);
      } catch (error) {
        console.error('Simulation error:', error);
        alert('Error running simulation. Please try again.');
      } finally {
        setSimulating(false);
      }
    }, 100);
  };

  const myTeamResults = results?.results?.find(r => r.rosterId === myRosterId);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1>Season Simulator</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Monte Carlo simulation to predict playoff odds and championship chances
        </p>
      </div>

      {/* Configuration Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3>Simulation Settings</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Iterations */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Number of Simulations
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {[1000, 5000, 10000, 25000, 50000].map(val => (
                  <button
                    key={val}
                    className={`btn ${iterations === val ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setIterations(val)}
                    disabled={simulating}
                  >
                    {val.toLocaleString()}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                More simulations = more accurate results (but slower)
              </p>
            </div>

            {/* Variance */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Random Variance: {(variance * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.30"
                step="0.05"
                value={variance}
                onChange={(e) => setVariance(parseFloat(e.target.value))}
                disabled={simulating}
                style={{
                  width: '100%',
                  accentColor: 'var(--accent)'
                }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Controls how much randomness affects each game (any given Sunday factor)
              </p>
            </div>

            {/* Run Button */}
            <button
              className="btn btn-primary btn-lg"
              onClick={handleRunSimulation}
              disabled={simulating}
              style={{ marginTop: '12px' }}
            >
              {simulating ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Simulating {iterations.toLocaleString()} seasons...
                </>
              ) : (
                <>
                  🎲 Run Simulation
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && !simulating && (
        <>
          {/* My Team Summary */}
          {myTeamResults && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <h3>Your Team: {myTeamResults.name}</h3>
              </div>
              <div className="card-body">
                <div className="grid-4">
                  <StatCard
                    label="Playoff Odds"
                    value={`${myTeamResults.playoffOdds}%`}
                    color={myTeamResults.playoffOdds >= 75 ? 'var(--accent)' : myTeamResults.playoffOdds >= 25 ? 'var(--orange)' : 'var(--red)'}
                  />
                  <StatCard
                    label="Championship Odds"
                    value={`${myTeamResults.championshipOdds}%`}
                    color={myTeamResults.championshipOdds >= 10 ? 'var(--accent)' : 'var(--text-secondary)'}
                  />
                  <StatCard
                    label="Projected Record"
                    value={`${myTeamResults.avgWins}-${myTeamResults.avgLosses}`}
                  />
                  <StatCard
                    label="Most Likely Finish"
                    value={`#${myTeamResults.mostLikelyFinish}`}
                  />
                </div>

                {/* Finish Range */}
                <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Projected Finish Range (80% confidence)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Best Case
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                        #{myTeamResults.bestCase}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>→</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Worst Case
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--red)' }}>
                        #{myTeamResults.worstCase}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Playoff Odds Chart */}
          <div className="card">
            <div className="card-header">
              <h3>Playoff Odds by Team</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Based on {results.iterations.toLocaleString()} simulations
              </span>
            </div>
            <div className="card-body">
              <PlayoffOddsChart results={results.results} myRosterId={myRosterId} />
            </div>
          </div>

          {/* Championship Odds */}
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <h3>Championship Odds</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...results.results]
                  .sort((a, b) => b.championshipOdds - a.championshipOdds)
                  .filter(team => team.championshipOdds > 0)
                  .map(team => {
                    const isMyTeam = team.rosterId === myRosterId;
                    return (
                      <div
                        key={team.rosterId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: isMyTeam ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                          border: isMyTeam ? '1px solid var(--accent)' : '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <span style={{
                          fontWeight: isMyTeam ? '600' : '500',
                          color: isMyTeam ? 'var(--accent)' : 'var(--text-primary)'
                        }}>
                          {team.name}
                          {isMyTeam && ' (You)'}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '600',
                          color: team.championshipOdds >= 10 ? 'var(--accent)' : 'var(--text-secondary)'
                        }}>
                          {team.championshipOdds}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Methodology */}
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <h3>How It Works</h3>
            </div>
            <div className="card-body">
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '12px' }}>
                  This Monte Carlo simulation runs thousands of virtual seasons to predict outcomes:
                </p>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>
                    <strong>Player Values</strong> are used to calculate expected weekly points for each team
                  </li>
                  <li>
                    <strong>Random Variance</strong> ({(variance * 100).toFixed(0)}%) is added to simulate the unpredictability of fantasy football
                  </li>
                  <li>
                    <strong>Regular Season</strong> is simulated with round-robin scheduling (14 weeks)
                  </li>
                  <li>
                    <strong>Playoffs</strong> include the top 4 teams competing for the championship
                  </li>
                  <li>
                    <strong>Results</strong> are aggregated across {results.iterations.toLocaleString()} simulations to calculate probabilities
                  </li>
                </ul>
                <p style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Note: This is a statistical model based on current roster values. Actual results may vary due to injuries, trades, and other factors not captured in the simulation.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!results && !simulating && (
        <div className="empty-state" style={{ padding: '60px 20px', marginTop: '40px' }}>
          <div className="empty-state-icon">🎲</div>
          <h3 style={{ marginBottom: '8px' }}>Ready to Simulate</h3>
          <p>
            Click "Run Simulation" above to predict your playoff odds and championship chances
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        marginBottom: '8px',
        fontWeight: '600'
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '1.75rem',
        fontWeight: '700',
        color: color || 'var(--text-primary)'
      }}>
        {value}
      </div>
    </div>
  );
}

export default SeasonSimulator;
