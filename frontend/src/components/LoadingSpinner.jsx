import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = "Loading telematics feed..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white border border-[#D9E2EC] rounded-[4px]">
      <Loader2 className="h-5 w-5 animate-spin text-[#0E7490] mb-2" />
      <p className="text-xs font-medium text-[#334E68]">
        {message}
      </p>
    </div>
  );
}
