import { useState, useEffect } from 'react';

/**
 * Custom hook to detect online/offline status
 * Also manages a queue of actions to sync when back online
 */
function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [actionQueue, setActionQueue] = useState([]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('App is online');
      setWasOffline(isOnline === false);
      setIsOnline(true);

      // Process queued actions
      if (actionQueue.length > 0) {
        console.log(`Processing ${actionQueue.length} queued actions`);
        actionQueue.forEach(action => {
          try {
            action();
          } catch (err) {
            console.error('Error processing queued action:', err);
          }
        });
        setActionQueue([]);
      }
    };

    const handleOffline = () => {
      console.log('App is offline');
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [actionQueue, isOnline]);

  // Queue an action to be executed when back online
  const queueAction = (action) => {
    setActionQueue(prev => [...prev, action]);
  };

  // Clear the action queue
  const clearQueue = () => {
    setActionQueue([]);
  };

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline, // True briefly after coming back online
    queueAction,
    clearQueue,
    queueLength: actionQueue.length
  };
}

export default useOffline;
