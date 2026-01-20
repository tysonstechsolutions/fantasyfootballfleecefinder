import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';

const TIME_PERIODS = [
  { days: 30, label: '30D' },
  { days: 60, label: '60D' },
  { days: 90, label: '90D' }
];

const PLAYER_COLORS = {
  player1: '#3b82f6', // Blue
  player2: '#ef4444'  // Red
};

/**
 * CompareChart - Side-by-side comparison of two players with overlay
 * @param {string} player1Name - First player's name
 * @param {string} player2Name - Second player's name
 * @param {Object} comparisonData - Data from comparePlayerHistory service
 * @param {Function} onVerdictUpdate - Callback when verdict is calculated
 */
function CompareChart({ player1Name, player2Name, comparisonData, onVerdictUpdate }) {
  const [period, setPeriod] = useState(30);

  // Filter data by selected time period
  const filteredData = React.useMemo(() => {
    if (!comparisonData?.data || comparisonData.data.length === 0) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);

    return comparisonData.data
      .filter(d => new Date(d.date) >= cutoffDate)
      .map(d => ({
        ...d,
        displayDate: formatDate(d.date)
      }));
  }, [comparisonData, period]);

  // Filter crossovers by time period
  const filteredCrossovers = React.useMemo(() => {
    if (!comparisonData?.crossovers || comparisonData.crossovers.length === 0) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);

    return comparisonData.crossovers.filter(c => new Date(c.date) >= cutoffDate);
  }, [comparisonData, period]);

  // Calculate verdict
  const verdict = React.useMemo(() => {
    if (!comparisonData || !player1Name || !player2Name) return null;

    const p1Trend = comparisonData.player1Trend;
    const p2Trend = comparisonData.player2Trend;

    // Get latest values
    const latestData = filteredData[filteredData.length - 1];
    if (!latestData) return null;

    const p1Current = latestData[player1Name];
    const p2Current = latestData[player2Name];

    // Calculate who's better
    const valueDiff = p1Current - p2Current;
    const valueDiffPercent = p2Current > 0 ? (valueDiff / p2Current) * 100 : 0;

    // Combine value and trend for verdict
    const p1Score = p1Current + (p1Trend.change * 2); // Weight recent trend
    const p2Score = p2Current + (p2Trend.change * 2);

    let winner, reason, confidence;

    if (Math.abs(valueDiffPercent) < 5) {
      winner = 'tie';
      reason = 'Values are nearly identical';
      confidence = 'low';
    } else if (p1Score > p2Score) {
      winner = 'player1';
      const gap = Math.abs(valueDiffPercent);
      if (gap > 20) {
        reason = `${player1Name} is significantly more valuable`;
        confidence = 'high';
      } else if (gap > 10) {
        reason = `${player1Name} has better value`;
        confidence = 'medium';
      } else {
        reason = `${player1Name} has slight edge`;
        confidence = 'low';
      }
    } else {
      winner = 'player2';
      const gap = Math.abs(valueDiffPercent);
      if (gap > 20) {
        reason = `${player2Name} is significantly more valuable`;
        confidence = 'high';
      } else if (gap > 10) {
        reason = `${player2Name} has better value`;
        confidence = 'medium';
      } else {
        reason = `${player2Name} has slight edge`;
        confidence = 'low';
      }
    }

    // Trend analysis
    let trendNote = '';
    if (p1Trend.trend === 'rising' && p2Trend.trend === 'falling') {
      trendNote = `${player1Name} trending up while ${player2Name} falling`;
    } else if (p1Trend.trend === 'falling' && p2Trend.trend === 'rising') {
      trendNote = `${player2Name} trending up while ${player1Name} falling`;
    } else if (p1Trend.trend === 'rising' && p2Trend.trend === 'rising') {
      trendNote = 'Both players trending up';
    } else if (p1Trend.trend === 'falling' && p2Trend.trend === 'falling') {
      trendNote = 'Both players trending down';
    }

    const verdictData = {
      winner,
      reason,
      confidence,
      trendNote,
      p1Current,
      p2Current,
      valueDiff,
      valueDiffPercent: Math.round(valueDiffPercent * 10) / 10,
      p1Trend: p1Trend.trend,
      p2Trend: p2Trend.trend
    };

    // Callback to parent
    if (onVerdictUpdate) {
      onVerdictUpdate(verdictData);
    }

    return verdictData;
  }, [filteredData, comparisonData, player1Name, player2Name, onVerdictUpdate]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    const p1Value = data[player1Name];
    const p2Value = data[player2Name];

    return (
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '200px'
      }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          {data.displayDate}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {p1Value && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: PLAYER_COLORS.player1, fontWeight: 500, fontSize: '0.875rem' }}>
                {player1Name}:
              </span>
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                {p1Value.toLocaleString()}
              </span>
            </div>
          )}
          {p2Value && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: PLAYER_COLORS.player2, fontWeight: 500, fontSize: '0.875rem' }}>
                {player2Name}:
              </span>
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                {p2Value.toLocaleString()}
              </span>
            </div>
          )}
          {p1Value && p2Value && (
            <div style={{
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '1px solid var(--border)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              Difference: {Math.abs(p1Value - p2Value).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!comparisonData || !player1Name || !player2Name) {
    return (
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</div>
        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
          Select Players to Compare
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Choose two players to see their value trends side-by-side
        </div>
      </div>
    );
  }

  if (!filteredData || filteredData.length === 0) {
    return (
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</div>
        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
          No Historical Data
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Value tracking will begin once you import your league.
          <br />
          Check back in a few days to see comparisons!
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
              Value Comparison
            </h3>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span style={{ color: PLAYER_COLORS.player1, fontWeight: 500 }}>{player1Name}</span>
              {' vs '}
              <span style={{ color: PLAYER_COLORS.player2, fontWeight: 500 }}>{player2Name}</span>
            </div>
          </div>

          {/* Time period selector */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {TIME_PERIODS.map(p => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  background: period === p.days ? 'var(--primary)' : 'var(--bg)',
                  color: period === p.days ? 'white' : 'var(--text)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Verdict Card */}
        {verdict && (
          <VerdictCard verdict={verdict} player1Name={player1Name} player2Name={player2Name} />
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={filteredData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="displayDate"
            stroke="var(--text-muted)"
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis
            stroke="var(--text-muted)"
            style={{ fontSize: '0.75rem' }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '16px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey={player1Name}
            name={player1Name}
            stroke={PLAYER_COLORS.player1}
            strokeWidth={2}
            dot={{ fill: PLAYER_COLORS.player1, r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey={player2Name}
            name={player2Name}
            stroke={PLAYER_COLORS.player2}
            strokeWidth={2}
            dot={{ fill: PLAYER_COLORS.player2, r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />

          {/* Crossover markers */}
          {filteredCrossovers.map((crossover, i) => {
            const dataPoint = filteredData.find(d => d.date === crossover.date);
            if (!dataPoint) return null;

            return (
              <ReferenceDot
                key={i}
                x={dataPoint.displayDate}
                y={crossover.value}
                r={10}
                fill="#8b5cf6"
                stroke="white"
                strokeWidth={2}
                label={{
                  value: '✕',
                  position: 'top',
                  fill: '#8b5cf6',
                  fontSize: 16,
                  fontWeight: 'bold'
                }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* Crossover info */}
      {filteredCrossovers.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '1.25rem' }}>✕</span>
          <div style={{ fontSize: '0.875rem' }}>
            <strong>Crossover Point{filteredCrossovers.length > 1 ? 's' : ''}</strong>
            {' - '}
            Players switched positions {filteredCrossovers.length} time{filteredCrossovers.length > 1 ? 's' : ''} in the last {period} days
          </div>
        </div>
      )}
    </div>
  );
}

// Verdict Card Component
function VerdictCard({ verdict, player1Name, player2Name }) {
  const getVerdictStyle = () => {
    if (verdict.winner === 'tie') {
      return {
        background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(107, 114, 128, 0.05) 100%)',
        borderColor: '#6b7280',
        icon: '🤝',
        label: 'Even Match'
      };
    }

    if (verdict.winner === 'player1') {
      return {
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
        borderColor: PLAYER_COLORS.player1,
        icon: '👍',
        label: player1Name
      };
    }

    return {
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
      borderColor: PLAYER_COLORS.player2,
      icon: '👍',
      label: player2Name
    };
  };

  const style = getVerdictStyle();
  const confidenceColor = verdict.confidence === 'high' ? '#10b981' : verdict.confidence === 'medium' ? '#f59e0b' : '#6b7280';

  return (
    <div style={{
      padding: '16px',
      background: style.background,
      border: `2px solid ${style.borderColor}`,
      borderRadius: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ fontSize: '1.5rem' }}>{style.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
            WOULD YOU RATHER
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: style.borderColor }}>
            {style.label}
          </div>
        </div>
        <div style={{
          padding: '4px 10px',
          background: confidenceColor,
          color: 'white',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase'
        }}>
          {verdict.confidence} confidence
        </div>
      </div>

      <div style={{ fontSize: '0.875rem', color: 'var(--text)', marginBottom: '8px' }}>
        {verdict.reason}
      </div>

      {verdict.trendNote && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {verdict.trendNote}
        </div>
      )}

      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        fontSize: '0.8125rem'
      }}>
        <div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Value Gap</div>
          <div style={{ fontWeight: 600 }}>
            {Math.abs(verdict.valueDiff).toLocaleString()} ({Math.abs(verdict.valueDiffPercent)}%)
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>{player1Name} Trend</div>
          <div style={{ fontWeight: 600 }}>
            {getTrendIcon(verdict.p1Trend)} {verdict.p1Trend}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>{player2Name} Trend</div>
          <div style={{ fontWeight: 600 }}>
            {getTrendIcon(verdict.p2Trend)} {verdict.p2Trend}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

function getTrendIcon(trend) {
  const icons = {
    rising: '📈',
    falling: '📉',
    stable: '➡️'
  };
  return icons[trend] || '➡️';
}

export default CompareChart;
