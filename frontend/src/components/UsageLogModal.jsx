import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Gauge, Activity, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { logUsage } from '../services/api';

export default function UsageLogModal({ asset, isOpen, onClose, onSuccess }) {
  const [engineHours, setEngineHours] = useState('6.0');
  const [idleHours, setIdleHours] = useState('1.5');
  const [fuelUsed, setFuelUsed] = useState('24.5');
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
      setLocation(asset?.current_site || 'Main Site Depot');
      setFuelUsed(String(Math.round(Number(engineHours || 6) * 4.0)));
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
      setSuccessMsg(`Daily telemetry logged for ${asset.equipment_id}.`);
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to record telematics log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Record Daily Telematics</h3>
            <p className="text-xs text-slate-400">Push engine runtime, idle hours & fuel usage</p>
          </div>
        </div>

        <div className="my-4 rounded-xl bg-slate-800/70 p-3.5 border border-slate-700/50">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-[#FFCD11]">{asset.equipment_id}</span>
            <span className="text-xs text-slate-300">{asset.type}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-950/60 border border-rose-600/50 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-950/60 border border-emerald-600/50 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#FFCD11]" />
              Telemetry Log Timestamp
            </label>
            <input
              type="datetime-local"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-[#FFCD11] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-[#FFCD11]" />
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
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-[#FFCD11] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-amber-400" />
                Idle (h) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={idleHours}
                onChange={(e) => setIdleHours(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5 text-emerald-400">
                Fuel (gal)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={fuelUsed}
                onChange={(e) => setFuelUsed(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#FFCD11]" />
              Operating Site Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. North River Highway Expansion"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-[#FFCD11] focus:outline-none"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Save Telematics Log'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
