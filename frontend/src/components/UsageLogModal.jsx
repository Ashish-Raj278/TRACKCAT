import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { logUsage } from '../services/api';

export default function UsageLogModal({ asset, isOpen, onClose, onSuccess }) {
  const [engineHours, setEngineHours] = useState('6.5');
  const [idleHours, setIdleHours] = useState('1.5');
  const [fuelUsed, setFuelUsed] = useState('26.0');
  const [logDate, setLogDate] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setLogDate(new Date().toISOString().slice(0, 16));
      setLocation(asset?.current_site || 'Central Depot');
      setFuelUsed(String(Math.round(Number(engineHours || 6.5) * 4.0)));
    }
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!engineHours || isNaN(Number(engineHours))) {
      setError('Please provide valid engine hours.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        asset_id: asset.id,
        date: logDate ? new Date(logDate).toISOString() : new Date().toISOString(),
        engine_hours: Number(engineHours),
        idle_hours: Number(idleHours || 0),
        fuel_used_gallons: fuelUsed !== '' ? Number(fuelUsed) : 0,
        location: location || asset.current_site,
      };

      const res = await logUsage(payload);
      setSuccessMsg(`Telemetry logged for ${asset.equipment_id}.`);
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
      }, 900);
    } catch (err) {
      setError(err.message || 'Failed to record telematics log.');
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

        {/* Header */}
        <div className="border-b border-[#D9E2EC] pb-3">
          <h3 className="text-sm font-semibold text-[#102A43]">
            Record Shift Telematics
          </h3>
          <p className="text-[12px] text-[#627D98] mt-0.5">
            Log machinery runtime, idle hours, and fuel consumption
          </p>
        </div>

        {/* Equipment Spec Strip */}
        <div className="my-3 rounded-[4px] bg-[#F8FAFC] border border-[#D9E2EC] p-2.5 flex items-center justify-between text-xs">
          <span className="font-mono font-bold text-[#102A43]">{asset.equipment_id}</span>
          <span className="text-[#627D98]">{asset.type}</span>
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
              Timestamp
            </label>
            <input
              type="datetime-local"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#486581] mb-1">
                Engine (h) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={engineHours}
                onChange={(e) => {
                  setEngineHours(e.target.value);
                  setFuelUsed(String(Math.round(Number(e.target.value || 0) * 4.0)));
                }}
                required
                className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#486581] mb-1">
                Idle (h) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={idleHours}
                onChange={(e) => setIdleHours(e.target.value)}
                required
                className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#486581] mb-1">
                Fuel (gal)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={fuelUsed}
                onChange={(e) => setFuelUsed(e.target.value)}
                className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#486581] mb-1">
              Location / Site
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. North River Highway Expansion"
              className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
            />
          </div>

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
              className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#102A43] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#0B1F33] transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Telematics'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
