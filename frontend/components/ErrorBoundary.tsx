import React, { ReactNode } from 'react';
import { ExclamationTriangleIcon } from './icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: unknown;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // FIX: Replaced class property state initialization with a constructor to ensure compatibility and correct component instantiation, which can resolve issues where this.props is not correctly recognized.
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log the error to an error reporting service here
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4">
          <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-w-lg">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-danger" />
            <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Oops! Something went wrong.</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              We're sorry for the inconvenience. An unexpected error occurred.
              Please try reloading the application.
            </p>
            {this.state.error && (
               <details className="mt-4 text-left bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md text-xs">
                    <summary className="cursor-pointer font-medium text-slate-600 dark:text-slate-300">Error Details</summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-slate-500 dark:text-slate-400">
                      <code>
                        {this.state.error instanceof Error ? this.state.error.stack : String(this.state.error)}
                      </code>
                    </pre>
                </details>
            )}
            <button
              onClick={this.handleReload}
              className="mt-6 px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-slate-800"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    // If there is no error, render the children.
    return this.props.children;
  }
}
