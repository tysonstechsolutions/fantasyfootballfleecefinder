import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

const TIME_PERIODS = [
  { days: 30, label: '30D' },
  { days: 60, label: '60D' },
  { days: 90, label: '90D' }
];

/**
 * ValueTrendChart - Line chart showing player value over time
 * @param {string} playerName - Player's full name
 * @param {Array} data - Array of {date, value, event} objects
 * @param {Array} events - Array of significant events {date, label, type}
 * @param {string} color - Line color (default: primary blue)
 */
function ValueTrendChart({ playerName, data = [], events = [], color = '#3b82f6' }) {
  const [period, setPeriod] = useState(30);

  // Filter data by selected time period
  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);

    return data
      .filter(d => new Date(d.date) >= cutoffDate)
      .map(d => ({
        ...d,
        displayDate: formatDate(d.date)
      }));
  }, [data, period]);

  // Filter events by time period
  const filteredEvents = React.useMemo(() => {
    if (!events || events.length === 0) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);

    return events.filter(e => new Date(e.date) >= cutoffDate);
  }, [events, period]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (filteredData.length === 0) {
      return { min: 0, max: 0, avg: 0, change: 0, changePercent: 0 };
    }

    const values = filteredData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);

    const firstValue = filteredData[0].value;
    const lastValue = filteredData[filteredData.length - 1].value;
    const change = lastValue - firstValue;
    const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;

    return { min, max, avg, change, changePercent, current: lastValue };
  }, [filteredData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    const event = filteredEvents.find(e => e.date === data.date);

    return (
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
          {data.displayDate}
        </div>
        <div style={{ fontSize: '1.125rem', fontWeight: 600, color: color }}>
          {payload[0].value.toLocaleString()}
        </div>
        {event && (
          <div style={{
            marginTop: '8px',
            padding: '6px 8px',
            background: getEventColor(event.type),
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 500
          }}>
            {getEventIcon(event.type)} {event.label}
          </div>
        )}
      </div>
    );
  };

  if (!data || data.length === 0) {
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
          Check back in a few days to see trends!
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
              {playerName} Value Trend
            </h3>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Dynasty trade value over time
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

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          padding: '12px',
          background: 'var(--bg)',
          borderRadius: '8px'
        }}>
          <StatBox label="Current" value={stats.current} />
          <StatBox label="Average" value={stats.avg} />
          <StatBox label="High" value={stats.max} />
          <StatBox label="Low" value={stats.min} />
          <StatBox
            label={`${period}D Change`}
            value={stats.change}
            percent={stats.changePercent}
            showTrend
          />
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
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
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />

          {/* Event markers */}
          {filteredEvents.map((event, i) => {
            const dataPoint = filteredData.find(d => d.date === event.date);
            if (!dataPoint) return null;

            return (
              <ReferenceDot
                key={i}
                x={dataPoint.displayDate}
                y={dataPoint.value}
                r={8}
                fill={getEventColorDot(event.type)}
                stroke="white"
                strokeWidth={2}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* Event legend */}
      {filteredEvents.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>
            SIGNIFICANT EVENTS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {filteredEvents.map((event, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: getEventColor(event.type),
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              >
                <span>{getEventIcon(event.type)}</span>
                <span>{event.label}</span>
                <span style={{ opacity: 0.7 }}>({formatDate(event.date)})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for stat boxes
function StatBox({ label, value, percent, showTrend }) {
  const isPositive = percent > 0;
  const isNegative = percent < 0;

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontSize: '1rem', fontWeight: 600 }}>
          {value?.toLocaleString() || 0}
        </span>
        {showTrend && percent !== undefined && (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: isPositive ? '#10b981' : isNegative ? '#ef4444' : 'var(--text-muted)'
          }}>
            {isPositive ? '↗' : isNegative ? '↘' : '→'} {percent.toFixed(1)}%
          </span>
        )}
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

function getEventIcon(type) {
  const icons = {
    injury: '🏥',
    trade: '🔄',
    breakout: '🚀',
    slump: '📉',
    news: '📰',
    default: '📌'
  };
  return icons[type] || icons.default;
}

function getEventColor(type) {
  const colors = {
    injury: 'rgba(239, 68, 68, 0.1)',
    trade: 'rgba(59, 130, 246, 0.1)',
    breakout: 'rgba(16, 185, 129, 0.1)',
    slump: 'rgba(245, 158, 11, 0.1)',
    news: 'rgba(139, 92, 246, 0.1)',
    default: 'rgba(107, 114, 128, 0.1)'
  };
  return colors[type] || colors.default;
}

function getEventColorDot(type) {
  const colors = {
    injury: '#ef4444',
    trade: '#3b82f6',
    breakout: '#10b981',
    slump: '#f59e0b',
    news: '#8b5cf6',
    default: '#6b7280'
  };
  return colors[type] || colors.default;
}

export default ValueTrendChart;
