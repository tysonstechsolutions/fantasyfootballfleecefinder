import React from 'react';

const LoadingSkeleton = ({
  width = '100%',
  height = '20px',
  variant = 'text',
  borderRadius,
  style = {}
}) => {
  const variantStyles = {
    text: {
      height: '20px',
      borderRadius: '4px'
    },
    card: {
      height: '200px',
      borderRadius: '8px'
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%'
    }
  };

  const variantStyle = variantStyles[variant] || {};

  const finalStyle = {
    width: variant === 'avatar' ? (variantStyle.width || width) : width,
    height: variantStyle.height || height,
    borderRadius: borderRadius || variantStyle.borderRadius || '4px',
    backgroundColor: '#e0e0e0',
    position: 'relative',
    overflow: 'hidden',
    ...style
  };

  return (
    <div style={finalStyle}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
          animation: 'shimmer 1.5s infinite'
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSkeleton;
