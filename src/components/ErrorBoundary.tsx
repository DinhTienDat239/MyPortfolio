import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-start justify-center px-8">
        <h1 className="text-4xl font-medium tracking-tight">Something went wrong.</h1>
        <button onClick={() => window.location.reload()} className="link mt-6">
          Reload the page
        </button>
        <pre className="mt-8 max-w-lg overflow-auto text-xs text-muted">{this.state.error.message}</pre>
      </div>
    );
  }
}
