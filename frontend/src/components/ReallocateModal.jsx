import React, { useState } from 'react';
import { X, Share2, ArrowRight, CheckCircle2, AlertTriangle, Loader2, MapPin } from 'lucide-react';
import { reallocateAsset } from '../services/api';

export default function ReallocateModal({ opportunity, asset, isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const targetAssetId = opportunity?.asset_id || asset?.id;
  const targetEquipmentId = opportunity?.equipment_id || asset?.equipment_id;
  const targetEquipmentType = opportunity?.equipment_type || asset?.type;
  const currentSite = opportunity?.current_site || asset?.current_site || 'Current Site';
  const recommendedSite = opportunity?.recommended_site || 'Downtown Metro Rail Extension';
  const reason = opportunity?.reason || `Reallocate ${targetEquipmentId} to satisfy rising project demand at ${recommendedSite}.`;

  const handleReallocate = async () => {
    if (!targetAssetId) {
      setError('Asset ID not found.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await reallocateAsset(targetAssetId, recommendedSite);
      setSuccessMsg(res.message || `${targetEquipmentId} successfully reallocated to ${recommendedSite}.`);
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to reallocate asset.');
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
          <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-emerald-100 text-emerald-700">
            <Share2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#102A43]">
              Confirm Asset Reallocation
            </h3>
            <p className="text-[11px] text-[#627D98]">Execute logistics transfer to high-demand site</p>
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
              <strong className="block font-semibold">Reallocation Executed!</strong>
              <p>{successMsg}</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {/* Asset Identifier Strip */}
            <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-[3px]">
              <div>
                <span className="font-mono text-xs font-bold text-[#102A43]">{targetEquipmentId}</span>
                <span className="text-[11px] text-[#627D98] block">{targetEquipmentType}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-emerald-100 text-[#15803D] uppercase font-mono">
                Optimization Target
              </span>
            </div>

            {/* Source to Target Route */}
            <div className="bg-white border border-[#D9E2EC] p-3 rounded-[3px] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#486581]">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-[#829AB1] block">From Source Site</span>
                  <span className="font-medium text-[#102A43] flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#829AB1]" />
                    {currentSite}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#0E7490] shrink-0 mx-2" />
                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] uppercase font-semibold text-[#829AB1] block">To Target Site</span>
                  <span className="font-bold text-[#15803D] flex items-center justify-end gap-1">
                    <MapPin className="h-3 w-3 text-[#15803D]" />
                    {recommendedSite}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F0F4F8] text-[11px] text-[#334E68] leading-relaxed">
                <strong className="text-[#102A43] block text-[10px] uppercase tracking-wider mb-0.5">Rationale:</strong>
                {reason}
              </div>
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
                onClick={handleReallocate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#15803D] text-white text-xs font-medium hover:bg-[#166534] transition disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Executing Move...
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    Confirm Reallocation
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
