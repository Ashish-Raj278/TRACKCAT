import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { checkinAsset } from '../services/api';
import StatusBadge from './StatusBadge';

export default function CheckinModal({ asset, isOpen, onClose, onSuccess }) {
  const [engineHours, setEngineHours] = useState('');
  const [idleHours, setIdleHours] = useState('');
  const [checkinTime, setCheckinTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setEngineHours(asset?.engine_hours_per_day ? String(asset.engine_hours_per_day) : '7.0');
      setIdleHours(asset?.idle_hours_per_day ? String(asset.idle_hours_per_day) : '1.5');
      setCheckinTime(new Date().toISOString().slice(0, 16));
    }
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      const payload = {
        asset_id: asset.id,
        checkin_time: checkinTime ? new Date(checkinTime).toISOString() : new Date().toISOString(),
        engine_hours_operated: engineHours !== '' ? Number(engineHours) : undefined,
        idle_hours_operated: idleHours !== '' ? Number(idleHours) : undefined,
      };

      const res = await checkinAsset(payload);
      setSuccessMsg(res.message || `Equipment ${asset.equipment_id} successfully checked in.`);
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
      }, 900);
    } catch (err) {
      setError(err.message || 'Check-in failed. Verify parameters.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md rounded-[4px] border border-[#D9E2EC] bg-white p-5 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-[#829AB1] hover:text-[#102A43] transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#D9E2EC] pb-3">
          <h3 className="text-sm font-semibold text-[#102A43]">
            Equipment Check-In
          </h3>
          <p className="text-[12px] text-[#627D98] mt-0.5">
            Complete rental and record return shift hours
          </p>
        </div>

        {/* Equipment Spec Strip */}
        <div className="my-3 rounded-[4px] bg-[#F8FAFC] border border-[#D9E2EC] p-2.5 flex items-center justify-between text-xs">
          <div>
            <span className="font-mono font-bold text-[#102A43] text-sm">{asset.equipment_id}</span>
            <span className="text-[#627D98] ml-2">{asset.type}</span>
          </div>
          <StatusBadge status={asset.status} isOverdue={asset.is_overdue} />
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-[3px] bg-red-50 border border-red-200 p-2 text-xs text-[#B91C1C]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 flex items-center gap-2 rounded-[3px] bg-emerald-50 border border-emerald-200 p-2 text-xs text-[#15803D] font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#486581] mb-1">
              Check-In Timestamp
            </label>
            <input
              type="datetime-local"
              value={checkinTime}
              onChange={(e) => setCheckinTime(e.target.value)}
              className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#486581] mb-1">
                Final Shift Engine (h)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={engineHours}
                onChange={(e) => setEngineHours(e.target.value)}
                placeholder="e.g. 7.5"
                className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#486581] mb-1">
                Final Shift Idle (h)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={idleHours}
                onChange={(e) => setIdleHours(e.target.value)}
                placeholder="e.g. 1.5"
                className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none font-mono"
              />
            </div>
          </div>

          <p className="text-[11px] text-[#627D98]">
            * Returning machinery updates state to Available in central depot.
          </p>

          <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-[#D9E2EC]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[4px] border border-[#D9E2EC] bg-white px-3 py-1.5 text-xs font-medium text-[#334E68] hover:bg-[#F0F4F8] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#15803D] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#166534] transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Check-In'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
