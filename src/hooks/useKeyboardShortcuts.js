import { useEffect, useCallback } from 'react';

/**
 * Custom hook for global keyboard shortcuts
 * @param {Object} shortcuts - Object mapping keys to handler functions
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 */
function useKeyboardShortcuts(shortcuts, enabled = true) {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Ignore if user is typing in an input/textarea
    const target = event.target;
    const isInput = target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable;

    // Allow "/" to work even in inputs (for search focus)
    if (event.key !== '/' && isInput) {
      return;
    }

    // Check for modifier keys
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

    // Handle shortcuts
    for (const [key, handler] of Object.entries(shortcuts)) {
      if (event.key === key || event.key.toLowerCase() === key.toLowerCase()) {
        // If it's "/" and we're already in an input, ignore
        if (key === '/' && isInput) {
          return;
        }

        // Prevent default behavior for our shortcuts
        event.preventDefault();

        // Call the handler
        handler(event);
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

export default useKeyboardShortcuts;
