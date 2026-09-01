import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message = 'An error occurred while communicating with the server.', onRetry }) {
  return (
    <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 p-5 text-slate-200">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-rose-900/50 p-2 text-rose-400">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-rose-300">Data Synchronization Notice</h4>
          <p className="mt-1 text-sm text-slate-300">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-800/60 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
