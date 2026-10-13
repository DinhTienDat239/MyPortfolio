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
      <div className="flex min-h-screen flex-col items-center justify-center bg-abyss p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-blood-400">Something broke the seal</p>
        <h1 className="mt-6 font-display text-4xl font-black text-bone md:text-6xl">The ritual failed.</h1>
        <button
          onClick={() => window.location.reload()}
          className="mt-10 border border-blood-500 px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-blood-400 hover:bg-blood-500 hover:text-void"
        >
          Try again
        </button>
        <pre className="mt-8 max-h-40 max-w-lg overflow-auto text-left font-mono text-[10px] text-blood-300/70">{this.state.error.message}</pre>
      </div>
    );
  }
}
