import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-danger-border bg-danger-soft text-danger">
            <AlertOctagon className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="mb-2 text-lg font-medium tracking-tight text-ink">
            Something went wrong
          </h2>
          <p className="mb-7 max-w-md text-sm font-normal text-ink-muted">
            An unexpected error occurred while loading this view. Try reloading the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reload workspace
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
