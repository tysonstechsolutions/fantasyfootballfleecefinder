import React, { useState } from 'react';
import { generateNegotiationPitch } from '../../services/claude';

function NegotiationCoach({ trade, opponentRoster, myRoster, apiKey }) {
  const [pitch, setPitch] = useState('');
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState('friendly');
  const [copied, setCopied] = useState(false);

  const handleGeneratePitch = async () => {
    if (!apiKey) {
      alert('Add your Claude API key in Settings');
      return;
    }

    if (!trade.iGive || trade.iGive.length === 0 || !trade.iGet || trade.iGet.length === 0) {
      alert('Please select assets for both sides of the trade first');
      return;
    }

    setLoading(true);
    setPitch('');
    setCopied(false);

    try {
      // Determine opponent profile
      const opponentProfile = {
        isContender: opponentRoster.wins > opponentRoster.losses + 2,
        isRebuilding: opponentRoster.losses > opponentRoster.wins + 2,
        record: `${opponentRoster.wins}-${opponentRoster.losses}`
      };

      const result = await generateNegotiationPitch(apiKey, {
        trade: {
          iGive: trade.iGive,
          iGet: trade.iGet,
          opponentRoster,
          myRoster
        },
        opponentProfile
      });

      // Adjust tone if needed
      let finalPitch = result;

      if (tone === 'business') {
        // Business tone is already the default
      } else if (tone === 'aggressive') {
        finalPitch = result.replace(/might/g, 'will')
          .replace(/could/g, 'should')
          .replace(/I think/g, 'I know')
          .replace(/perhaps/g, 'clearly');
      } else if (tone === 'friendly') {
        // Add a friendly opener
        finalPitch = `Hey! ${result}`;
      }

      setPitch(finalPitch);
    } catch (err) {
      setPitch(`Error: ${err.message}`);
    }

    setLoading(false);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(pitch).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!trade || !opponentRoster || !myRoster) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="card-header">
        <h3>Negotiation Coach</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          AI-powered persuasive messaging to sell your trade
        </p>
      </div>
      <div className="card-body">
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Message Tone
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${tone === 'friendly' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTone('friendly')}
              style={{ flex: 1 }}
            >
              Friendly
            </button>
            <button
              className={`btn ${tone === 'business' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTone('business')}
              style={{ flex: 1 }}
            >
              Business
            </button>
            <button
              className={`btn ${tone === 'aggressive' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTone('aggressive')}
              style={{ flex: 1 }}
            >
              Aggressive
            </button>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGeneratePitch}
          disabled={loading}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          {loading ? 'Generating Pitch...' : 'Generate Pitch'}
        </button>

        {pitch && (
          <div>
            <div
              style={{
                background: 'var(--bg-base)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                marginBottom: '12px',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)'
              }}
            >
              {pitch}
            </div>
            <button
              className="btn btn-ghost"
              onClick={handleCopyToClipboard}
              style={{ width: '100%' }}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            Crafting your persuasive message...
          </div>
        )}
      </div>
    </div>
  );
}

export default NegotiationCoach;
