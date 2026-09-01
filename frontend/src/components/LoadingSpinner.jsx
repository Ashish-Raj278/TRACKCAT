import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading TRACKCAT data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#FFCD11] mb-4" />
      <p className="text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
}
