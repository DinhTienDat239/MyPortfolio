import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-night p-6 text-center">
        <p className="font-label text-xs uppercase text-torch">Cave-in!</p>
        <h1 className="mt-6 pixel-shadow text-4xl font-bold text-parchment md:text-6xl">Something collapsed.</h1>
        <button
          onClick={() => window.location.reload()}
          className="px-btn mt-10"
        >
          Dig again
        </button>
        <pre className="mt-8 max-h-40 max-w-lg overflow-auto text-left font-label text-[10px] text-mist">{this.state.error.message}</pre>
      </div>
    );
  }
}
