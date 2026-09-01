import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-white border border-[#B91C1C] border-l-4 rounded-[4px] p-3 text-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-[#B91C1C] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-[#102A43]">
              Operational Error
            </h4>
            <p className="text-[#627D98] text-[12px] mt-0.5">
              {message || 'Unable to complete telematics request.'}
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#102A43] text-white text-[11px] font-medium hover:bg-[#0B1F33] transition shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
