import React from 'react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo);
    // If it's a ChunkLoadError (usually means new version is deployed or dev server restarted mid-session)
    if (error.name === 'ChunkLoadError' || (error.message && error.message.includes('Loading chunk'))) {
      const isReloaded = sessionStorage.getItem('chunk_error_reloaded');
      if (!isReloaded) {
        sessionStorage.setItem('chunk_error_reloaded', 'true');
        window.location.reload(true);
      } else {
        // Clear it so it can try again later if it fails twice (unlikely to fix itself without intervention)
        sessionStorage.removeItem('chunk_error_reloaded');
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h2>Oops, something went wrong.</h2>
          <p>Please refresh the page to continue.</p>
          <button 
            onClick={() => window.location.reload(true)}
            style={{ padding: '10px 20px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
