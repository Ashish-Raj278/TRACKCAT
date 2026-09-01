import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, User, Truck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { checkoutAsset, getSites, getOperators } from '../services/api';

export default function CheckoutModal({ asset, isOpen, onClose, onSuccess }) {
  const [sites, setSites] = useState([]);
  const [operators, setOperators] = useState([]);
  const [siteId, setSiteId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [expectedReturnTime, setExpectedReturnTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      // default 7 days from today
      const defaultReturn = new Date();
      defaultReturn.setDate(defaultReturn.getDate() + 7);
      defaultReturn.setHours(18, 0, 0, 0);
      setExpectedReturnTime(defaultReturn.toISOString().slice(0, 16));

      getSites().then(data => {
        setSites(data);
        if (data.length > 0) setSiteId(data[0].id);
      }).catch(() => {});

      getOperators().then(data => {
        setOperators(data);
      }).catch(() => {});
    }
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!siteId) {
      setError('Please select a destination job site.');
      return;
    }
    if (!expectedReturnTime) {
      setError('Please select an expected return date and time.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        asset_id: asset.id,
        site_id: Number(siteId),
        operator_id: operatorId ? Number(operatorId) : null,
        expected_return_time: new Date(expectedReturnTime).toISOString(),
      };

      const res = await checkoutAsset(payload);
      setSuccessMsg(res.message || `Equipment ${asset.equipment_id} successfully checked out.`);
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Checkout failed. Please check parameters and try again.');
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-[#FFCD11]">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Equipment Checkout</h3>
            <p className="text-xs text-slate-400">Deploy equipment to site & assign operator</p>
          </div>
        </div>

        {/* Selected Asset Info Banner */}
        <div className="my-4 rounded-xl bg-slate-800/70 p-3.5 border border-slate-700/50">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="font-bold text-[#FFCD11]">{asset.equipment_id}</span>
              <span className="text-slate-300 ml-2">({asset.type})</span>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/30">
              Ready for Checkout
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
              <MapPin className="h-3.5 w-3.5 text-[#FFCD11]" />
              Destination Site *
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-[#FFCD11] focus:outline-none"
              required
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.site_name} ({site.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#FFCD11]" />
              Designated Operator (Optional)
            </label>
            <select
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-[#FFCD11] focus:outline-none"
            >
              <option value="">-- No operator assigned --</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.operator_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#FFCD11]" />
              Expected Return Date & Time *
            </label>
            <input
              type="datetime-local"
              value={expectedReturnTime}
              onChange={(e) => setExpectedReturnTime(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-[#FFCD11] focus:outline-none"
              required
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFCD11] px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-[#E5B700] transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Checkout'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
