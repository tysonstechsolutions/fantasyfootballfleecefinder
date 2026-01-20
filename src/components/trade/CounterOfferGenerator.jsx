import React, { useState } from 'react';
import { generateCounterOffer } from '../../services/claude';

function CounterOfferGenerator({ originalTrade, myRoster, theirRoster, apiKey, onUseCounterOffer }) {
  const [counterOffers, setCounterOffers] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateCounters = async () => {
    if (!apiKey) {
      alert('Add your Claude API key in Settings');
      return;
    }

    if (!originalTrade.iGive || originalTrade.iGive.length === 0 || !originalTrade.iGet || originalTrade.iGet.length === 0) {
      alert('Please specify the original trade first');
      return;
    }

    setLoading(true);
    setCounterOffers('');

    try {
      const result = await generateCounterOffer(apiKey, {
        originalTrade: {
          iGive: originalTrade.iGive,
          iGet: originalTrade.iGet
        },
        rejectionReason: rejectionReason.trim() || 'Not specified',
        myRoster,
        theirRoster
      });

      setCounterOffers(result);
    } catch (err) {
      setCounterOffers(`Error: ${err.message}`);
    }

    setLoading(false);
  };

  if (!originalTrade || !myRoster || !theirRoster) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="card-header">
        <h3>Counter Offer Generator</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Trade got rejected? AI suggests alternatives to keep the deal alive
        </p>
      </div>
      <div className="card-body">
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Rejection Reason (Optional)
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g., 'Not enough value' or 'Don't want to give up RB depth' or 'Need more picks'"
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              resize: 'vertical',
              minHeight: '80px'
            }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerateCounters}
          disabled={loading}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          {loading ? 'Generating Counter Offers...' : 'Generate Counter Offers'}
        </button>

        {counterOffers && (
          <div
            style={{
              background: 'var(--bg-base)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              color: 'var(--text-secondary)'
            }}
          >
            {counterOffers}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            Finding alternative offers...
          </div>
        )}

        {counterOffers && !loading && onUseCounterOffer && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <strong>Tip:</strong> Review the counter offers above and manually adjust your trade in the Trade Builder to match one of the suggested options.
          </div>
        )}
      </div>
    </div>
  );
}

export default CounterOfferGenerator;
