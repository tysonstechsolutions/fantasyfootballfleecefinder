import React from 'react';

function DraftBoard({ draft }) {
  if (!draft) return null;

  const board = draft.getDraftBoard();
  const currentPick = draft.getCurrentPick();

  return (
    <div className="card">
      <div className="card-header">
        <h3>Draft Board</h3>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Pick {currentPick.pick} of {draft.numTeams * draft.rounds}
        </span>
      </div>
      <div className="card-body" style={{ padding: '0', overflowX: 'auto' }}>
        <div style={{ minWidth: '600px' }}>
          {/* Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `60px repeat(${draft.numTeams}, 1fr)`,
            gap: '1px',
            background: 'var(--border)',
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{
              padding: '8px',
              background: 'var(--bg-surface)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}>
              RND
            </div>
            {draft.draftOrder.map((team, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 4px',
                  background: team.isUser ? 'var(--accent-muted)' : 'var(--bg-surface)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: team.isUser ? 'var(--accent)' : 'var(--text-muted)',
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}
              >
                {team.teamName}
              </div>
            ))}
          </div>

          {/* Rounds */}
          {board.map((round, roundIdx) => (
            <div
              key={roundIdx}
              style={{
                display: 'grid',
                gridTemplateColumns: `60px repeat(${draft.numTeams}, 1fr)`,
                gap: '1px',
                background: 'var(--border)'
              }}
            >
              {/* Round Number */}
              <div style={{
                padding: '12px 8px',
                background: 'var(--bg-elevated)',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {roundIdx + 1}
              </div>

              {/* Picks in Round */}
              {round.map((pickInfo) => {
                const isCurrentPick = pickInfo.pick === currentPick.pick && !draft.isDraftComplete();
                const isPicked = pickInfo.player !== null;

                return (
                  <DraftCell
                    key={pickInfo.pick}
                    pickInfo={pickInfo}
                    isCurrentPick={isCurrentPick}
                    isPicked={isPicked}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DraftCell({ pickInfo, isCurrentPick, isPicked }) {
  const bgColor = pickInfo.isUser
    ? 'var(--accent-muted)'
    : 'var(--bg-surface)';

  const borderStyle = isCurrentPick
    ? '2px solid var(--accent)'
    : 'none';

  return (
    <div style={{
      padding: '8px 6px',
      background: bgColor,
      minHeight: '60px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      border: borderStyle,
      position: 'relative'
    }}>
      {isCurrentPick && (
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '4px',
          fontSize: '0.625rem',
          color: 'var(--accent)',
          fontWeight: 700
        }}>
          ON CLOCK
        </div>
      )}

      {isPicked ? (
        <>
          <div style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {pickInfo.player.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className={`pos-badge pos-${pickInfo.player.position.toLowerCase()}`}
              style={{ fontSize: '0.625rem', padding: '2px 6px' }}>
              {pickInfo.player.position}
            </span>
            <span style={{
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {pickInfo.player.college}
            </span>
          </div>
        </>
      ) : (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          {pickInfo.pick}.{pickInfo.pickInRound < 10 ? `0${pickInfo.pickInRound}` : pickInfo.pickInRound}
        </div>
      )}
    </div>
  );
}

export default DraftBoard;
