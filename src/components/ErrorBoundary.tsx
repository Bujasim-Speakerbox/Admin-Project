import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  declare props: Readonly<ErrorBoundaryProps>;
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed.error === 'string') {
        message = `Firestore ${parsed.operationType || 'operation'} error${
          parsed.path ? ` (${parsed.path})` : ''
        }: ${parsed.error}`;
      }
    } catch {
      // keep original message
    }
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 text-pink-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-black">
              Something went wrong
            </h2>
            <p className="text-xs text-zinc-700 break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
