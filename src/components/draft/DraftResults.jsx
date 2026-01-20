import React from 'react';

function DraftResults({ draft, onStartOver }) {
  if (!draft || !draft.isDraftComplete()) return null;

  const userPicks = draft.getUserPicks();
  const gradeData = draft.getDraftGrade(userPicks);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '12px' }}>Draft Complete!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Here's how you did in your {draft.rounds}-round rookie draft
        </p>
      </div>

      {/* Overall Grade */}
      <div className="card" style={{ marginBottom: '24px', textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
          Your Draft Grade
        </div>
        <div style={{
          fontSize: '4rem',
          fontWeight: 700,
          marginBottom: '8px',
          color: getGradeColor(gradeData.grade)
        }}>
          {gradeData.grade}
        </div>
        <div style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>
          Average Score: {gradeData.score}/100
        </div>
        <div style={{ marginTop: '16px', color: 'var(--text-muted)' }}>
          {getGradeMessage(gradeData.grade)}
        </div>
      </div>

      {/* Your Picks */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3>Your Picks</h3>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {userPicks.length} players selected
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 80px 80px 100px 120px',
            gap: '12px',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            fontWeight: 600
          }}>
            <span>Pick</span>
            <span>Player</span>
            <span>Pos</span>
            <span>ADP</span>
            <span style={{ textAlign: 'right' }}>Value</span>
            <span style={{ textAlign: 'right' }}>Grade</span>
          </div>

          {/* Picks */}
          {gradeData.analysis.map((pick, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 80px 80px 100px 120px',
                gap: '12px',
                padding: '14px 20px',
                borderBottom: idx < gradeData.analysis.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center'
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                {pick.round}.{String(pick.pick % draft.numTeams || draft.numTeams).padStart(2, '0')}
              </span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{pick.player}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {userPicks[idx].player.college}
                </div>
              </div>
              <span className={`pos-badge pos-${pick.position.toLowerCase()}`}>
                {pick.position}
              </span>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                {pick.adp}
              </span>
              <span style={{
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
                fontWeight: 500
              }}>
                {userPicks[idx].player.projectedValue.toLocaleString()}
              </span>
              <div style={{ textAlign: 'right' }}>
                <div className={`verdict ${getVerdictClass(pick.verdict)}`}
                  style={{ display: 'inline-flex', padding: '4px 12px', fontSize: '0.75rem' }}>
                  {pick.verdict}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roster Composition */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3>Roster Composition</h3>
        </div>
        <div className="card-body">
          <RosterBreakdown picks={userPicks} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button className="btn btn-primary btn-lg" onClick={onStartOver}>
          Start New Draft
        </button>
      </div>
    </div>
  );
}

function RosterBreakdown({ picks }) {
  const positions = { QB: 0, RB: 0, WR: 0, TE: 0 };
  let totalValue = 0;

  picks.forEach(pick => {
    const pos = pick.player.position;
    if (positions[pos] !== undefined) {
      positions[pos]++;
    }
    totalValue += pick.player.projectedValue;
  });

  return (
    <div className="grid-4">
      <StatBox label="QBs" value={positions.QB} color="var(--pink)" />
      <StatBox label="RBs" value={positions.RB} color="var(--accent)" />
      <StatBox label="WRs" value={positions.WR} color="var(--blue)" />
      <StatBox label="TEs" value={positions.TE} color="var(--orange)" />
      <div className="card" style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>TOTAL PROJECTED VALUE</div>
        <div className="value-big value-positive">{totalValue.toLocaleString()}</div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function getGradeColor(grade) {
  if (grade.startsWith('A')) return 'var(--accent)';
  if (grade.startsWith('B')) return 'var(--blue)';
  if (grade.startsWith('C')) return 'var(--orange)';
  return 'var(--red)';
}

function getGradeMessage(grade) {
  if (grade === 'A+' || grade === 'A') return 'Outstanding draft! You crushed it!';
  if (grade === 'A-' || grade === 'B+') return 'Great draft! Solid value throughout.';
  if (grade === 'B' || grade === 'B-') return 'Good draft. A few reaches but mostly solid.';
  if (grade === 'C+' || grade === 'C') return 'Average draft. Could have gotten better value.';
  if (grade === 'C-' || grade === 'D') return 'Below average. Too many reaches.';
  return 'Tough draft. Consider sticking closer to ADP.';
}

function getVerdictClass(verdict) {
  if (verdict.includes('STEAL') || verdict.includes('Great')) return 'win';
  if (verdict.includes('Reach') || verdict.includes('⚠')) return 'lose';
  return 'fair';
}

export default DraftResults;
