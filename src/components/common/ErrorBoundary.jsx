import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid var(--red, #ef4444)',
            borderRadius: 'var(--radius-sm, 8px)',
            padding: '2rem'
          }}>
            <h2 style={{ color: 'var(--red, #ef4444)', marginTop: 0 }}>
              Oops! Something went wrong
            </h2>
            <p style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: '1.5rem' }}>
              We encountered an unexpected error. Please try again.
            </p>
            {this.state.error && (
              <details style={{
                textAlign: 'left',
                marginBottom: '1.5rem',
                backgroundColor: 'var(--bg-surface, #1e293b)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm, 8px)',
                border: '1px solid var(--border, #334155)'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary, #f1f5f9)'
                }}>
                  Error Details
                </summary>
                <pre style={{
                  fontSize: '0.85rem',
                  overflow: 'auto',
                  color: 'var(--red, #ef4444)',
                  fontFamily: 'var(--font-mono, monospace)'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
