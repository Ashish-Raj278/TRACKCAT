import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { checkoutAsset, getSites, getOperators } from '../services/api';
import StatusBadge from './StatusBadge';

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
      const defaultReturn = new Date();
      defaultReturn.setDate(defaultReturn.getDate() + 7);
      defaultReturn.setHours(18, 0, 0, 0);
      setExpectedReturnTime(defaultReturn.toISOString().slice(0, 16));

      getSites().then(data => {
        setSites(data || []);
        if (data && data.length > 0) setSiteId(String(data[0].id));
      }).catch(() => {});

      getOperators().then(data => {
        setOperators(data || []);
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
      setError('Please specify the expected return date & time.');
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
      }, 900);
    } catch (err) {
      setError(err.message || 'Equipment checkout failed. Verify parameters.');
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
            Equipment Check-Out
          </h3>
          <p className="text-[12px] text-[#627D98] mt-0.5">
            Assign job site deployment and operator
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
              Destination Site *
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
              required
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.site_code ? `[${site.site_code}] ` : ''}{site.site_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#486581] mb-1">
              Designated Operator
            </label>
            <select
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
            >
              <option value="">-- No operator assigned --</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  [{op.operator_code}] {op.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#486581] mb-1">
              Expected Return Date & Time *
            </label>
            <input
              type="datetime-local"
              value={expectedReturnTime}
              onChange={(e) => setExpectedReturnTime(e.target.value)}
              className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
              required
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
                  Dispatching...
                </>
              ) : (
                'Confirm Check-Out'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
