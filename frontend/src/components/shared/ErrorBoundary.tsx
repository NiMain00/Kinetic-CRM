import React from 'react';
import { Button } from '@/components/ui';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((onRetry: () => void) => React.ReactNode);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.handleRetry);
        }
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center space-y-4 max-w-md">
            <span className="material-symbols-outlined text-5xl text-danger">error</span>
            <h3 className="font-heading-section text-base text-on-surface">Terjadi Kesalahan</h3>
            <p className="text-sm text-secondary">
              Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
            </p>
            {this.state.error && (
              <p className="text-xs text-outline bg-surface-container-low rounded-lg p-3 font-mono truncate">
                {this.state.error.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <Button variant="primary" size="md" onClick={this.handleRetry}>
                Coba Lagi
              </Button>
              <Button variant="secondary" size="md" onClick={() => window.location.href = '/dashboard'}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
