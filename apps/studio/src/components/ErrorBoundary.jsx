import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          padding: 'var(--space-xl)',
          gap: 'var(--space-md)',
          textAlign: 'center',
          color: 'var(--color-text)',
        }}>
          <span className="nf nf-fa-exclamation_triangle" style={{ fontSize: '2.5rem', opacity: 0.4 }} />
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 'var(--font-size-xl)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 400, lineHeight: 1.6 }}>
            {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
          </p>
          <button
            className="studio-btn studio-btn--primary"
            onClick={this.handleReset}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
