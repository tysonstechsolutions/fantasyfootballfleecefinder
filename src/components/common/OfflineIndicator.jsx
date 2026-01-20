import React, { useEffect, useState } from 'react';
import useOffline from '../../hooks/useOffline';

function OfflineIndicator() {
  const { isOffline, wasOffline, queueLength } = useOffline();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    if (wasOffline) {
      setShowOnlineMessage(true);
      const timer = setTimeout(() => {
        setShowOnlineMessage(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [wasOffline]);

  if (isOffline) {
    return (
      <div className="offline-banner">
        ⚠️ You're currently offline. Changes will be saved when you reconnect.
        {queueLength > 0 && ` (${queueLength} action${queueLength > 1 ? 's' : ''} queued)`}
      </div>
    );
  }

  if (showOnlineMessage) {
    return (
      <div className="offline-banner online">
        ✓ You're back online!
      </div>
    );
  }

  return null;
}

export default OfflineIndicator;
