import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { resetDemoData } from '../services/api';

export default function ResetDemoModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleReset = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await resetDemoData();
      setSuccessMsg(res.message || 'Demo data successfully restored to baseline state.');
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to reset demo data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-[4px] border border-[#D9E2EC] bg-white p-5 shadow-2xl">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 p-1 text-[#829AB1] hover:text-[#102A43] transition disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 pb-3 border-b border-[#D9E2EC]">
          <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-amber-100 text-amber-700">
            <RotateCcw className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#102A43]">
              Reset Demo Data Baseline
            </h3>
            <p className="text-[11px] text-[#627D98]">Restore original SQLite hackathon dataset</p>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-[3px] border border-red-200 bg-red-50 p-2.5 text-xs text-[#B91C1C]">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg ? (
          <div className="mt-3 flex items-start gap-2 rounded-[3px] border border-emerald-200 bg-emerald-50 p-3 text-xs text-[#15803D]">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#15803D]" />
            <div className="space-y-0.5">
              <strong className="block font-semibold">Demo Data Restored!</strong>
              <p>{successMsg}</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-[#334E68] leading-relaxed">
              Reset all <strong>CAT360</strong> demo data to its original state?
            </p>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-[3px] text-[11px] text-[#486581] space-y-1">
              <span className="font-semibold block text-[#102A43]">This action will restore:</span>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Original 12 asset statuses & site locations</li>
                <li>8 active & 18 historical rental transaction records</li>
                <li>71 telematics usage & idle telemetry logs</li>
                <li>Overdue violation alerts & due-soon reminders</li>
                <li>Anomalies, demand forecasts, health scores & recommendations</li>
              </ul>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-[#D9E2EC]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3 py-1.5 rounded-[3px] border border-[#D9E2EC] bg-white text-xs font-medium text-[#334E68] hover:bg-[#F0F4F8] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#B91C1C] text-white text-xs font-medium hover:bg-[#991B1B] transition disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Restoring Data...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Demo Data
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
