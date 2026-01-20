import React, { useEffect } from 'react';

function KeyboardShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '/', description: 'Focus search input' },
    { key: 't', description: 'Open Trade Builder' },
    { key: 'Escape', description: 'Close modals/dialogs' },
    { key: '?', description: 'Show this help dialog' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <span>⌨️</span>
            Keyboard Shortcuts
          </h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="shortcut-list">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="shortcut-item">
                <span className="shortcut-desc">{shortcut.description}</span>
                <div className="shortcut-keys">
                  <kbd className="shortcut-key">{shortcut.key}</kbd>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <strong>Tip:</strong> Most shortcuts won't work while typing in text inputs to avoid conflicts.
          </div>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsModal;
