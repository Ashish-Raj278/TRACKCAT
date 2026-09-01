import React, { useState, useEffect } from 'react';
import { X, Clock, Activity, AlertCircle, CheckCircle2, Loader2, Gauge } from 'lucide-react';
import { checkinAsset } from '../services/api';

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
      setEngineHours(asset?.engine_hours_per_day ? String(asset.engine_hours_per_day) : '6.5');
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
      }, 1000);
    } catch (err) {
      setError(err.message || 'Check-in failed. Please verify runtime telematics and try again.');
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Equipment Check-In</h3>
            <p className="text-xs text-slate-400">Complete rental & record return telematics</p>
          </div>
        </div>

        {/* Asset summary banner */}
        <div className="my-4 rounded-xl bg-slate-800/70 p-3.5 border border-slate-700/50">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="font-bold text-[#FFCD11]">{asset.equipment_id}</span>
              <span className="text-slate-300 ml-2">({asset.type})</span>
            </div>
            <span className="text-xs text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/30">
              Site: {asset.current_site || 'Active Job'}
            </span>
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
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              Check-In Timestamp
            </label>
            <input
              type="datetime-local"
              value={checkinTime}
              onChange={(e) => setCheckinTime(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-[#FFCD11]" />
                Engine Hours (hrs)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={engineHours}
                onChange={(e) => setEngineHours(e.target.value)}
                placeholder="e.g. 7.5"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-[#FFCD11] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-amber-400" />
                Idle Hours (hrs)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={idleHours}
                onChange={(e) => setIdleHours(e.target.value)}
                placeholder="e.g. 1.5"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <p className="text-xs text-slate-400">
            * Check-in will return asset status to <strong className="text-emerald-400">Available</strong> and update rolling telematics averages.
          </p>

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
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating Telematics...
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
