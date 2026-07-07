import React from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global Error Boundary caught an exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-slate-800 dark:text-slate-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl text-center space-y-5 max-w-lg shadow-xl animate-in fade-in duration-300">
            <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center">
              <WarningAmberIcon className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold">Something went wrong</h3>
            <p className="text-sm text-slate-550 dark:text-slate-400">
              A critical client-side execution error occurred. Please reload the dashboard or clear your browser storage.
            </p>
            <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-2xl text-xs font-mono text-left max-h-40 overflow-y-auto text-rose-500">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl shadow transition-colors text-sm"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
