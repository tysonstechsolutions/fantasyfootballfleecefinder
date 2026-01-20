import React, { useEffect } from 'react';

const Toast = ({ id, message, variant = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const variantStyles = {
    success: {
      backgroundColor: '#4CAF50',
      icon: '✓'
    },
    error: {
      backgroundColor: '#f44336',
      icon: '✕'
    },
    warning: {
      backgroundColor: '#ff9800',
      icon: '⚠'
    },
    info: {
      backgroundColor: '#2196F3',
      icon: 'ℹ'
    }
  };

  const style = variantStyles[variant] || variantStyles.info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: style.backgroundColor,
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        minWidth: '300px',
        maxWidth: '500px',
        animation: 'slideIn 0.3s ease-out',
        marginBottom: '8px'
      }}
    >
      <span style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        flexShrink: 0
      }}>
        {style.icon}
      </span>
      <p style={{
        margin: 0,
        flex: 1,
        fontSize: '0.95rem'
      }}>
        {message}
      </p>
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '1.25rem',
          cursor: 'pointer',
          padding: '0 4px',
          lineHeight: 1,
          opacity: 0.8,
          flexShrink: 0
        }}
        onMouseOver={(e) => e.target.style.opacity = '1'}
        onMouseOut={(e) => e.target.style.opacity = '0.8'}
        aria-label="Close"
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
