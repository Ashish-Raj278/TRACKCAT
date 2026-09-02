import React, { useState, useEffect } from 'react';
import {
  Repeat,
  QrCode,
  Search,
  Truck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { getAssets, getSites, getOperators, checkoutAsset, checkinAsset } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Terminal() {
  const [assets, setAssets] = useState([]);
  const [sites, setSites] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Terminal workflow state
  const [lookupInput, setLookupInput] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [lookupError, setLookupError] = useState(null);

  // Form states for checkout
  const [destSiteId, setDestSiteId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [expectedReturnTime, setExpectedReturnTime] = useState('');

  // Form states for checkin
  const [checkinEngineHours, setCheckinEngineHours] = useState('7.0');
  const [checkinIdleHours, setCheckinIdleHours] = useState('1.5');
  const [checkinTime, setCheckinTime] = useState('');

  // Submission state
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const loadTerminalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [assetsData, sitesData, operatorsData] = await Promise.all([
        getAssets(),
        getSites(),
        getOperators(),
      ]);

      setAssets(assetsData || []);
      setSites(sitesData || []);
      setOperators(operatorsData || []);

      if (sitesData && sitesData.length > 0) {
        setDestSiteId(String(sitesData[0].id));
      }

      const def = new Date();
      def.setDate(def.getDate() + 7);
      def.setHours(18, 0, 0, 0);
      setExpectedReturnTime(def.toISOString().slice(0, 16));
      setCheckinTime(new Date().toISOString().slice(0, 16));
    } catch (err) {
      console.error('Failed to initialize terminal:', err);
      setError(err.message || 'Unable to connect to transaction dispatch backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerminalData();
  }, []);

  const handleLookup = (code) => {
    setLookupError(null);
    setReceipt(null);
    const target = (code || lookupInput).trim().toUpperCase();
    if (!target) {
      setLookupError('Enter an Equipment ID to lookup.');
      return;
    }

    const found = assets.find(
      (a) => a.equipment_id.toUpperCase() === target || String(a.id) === target
    );

    if (found) {
      setSelectedAsset(found);
      setCheckinEngineHours(found.engine_hours_per_day ? String(found.engine_hours_per_day) : '7.0');
      setCheckinIdleHours(found.idle_hours_per_day ? String(found.idle_hours_per_day) : '1.5');
    } else {
      setSelectedAsset(null);
      setLookupError(`No equipment record found for ID "${target}".`);
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    if (!destSiteId) {
      setLookupError('Select a destination job site.');
      return;
    }

    try {
      setIsProcessing(true);
      setLookupError(null);

      const payload = {
        asset_id: selectedAsset.id,
        site_id: Number(destSiteId),
        operator_id: operatorId ? Number(operatorId) : null,
        expected_return_time: new Date(expectedReturnTime).toISOString(),
      };

      const res = await checkoutAsset(payload);
      const chosenSite = sites.find(s => String(s.id) === String(destSiteId));
      const chosenOp = operators.find(o => String(o.id) === String(operatorId));

      setReceipt({
        type: 'CHECK_OUT',
        txId: `TX-OUT-${Math.floor(Math.random() * 90000) + 10000}`,
        timestamp: new Date().toISOString(),
        equipment_id: selectedAsset.equipment_id,
        equipment_type: selectedAsset.type,
        site_name: chosenSite ? chosenSite.site_name : selectedAsset.current_site,
        operator_name: chosenOp ? `${chosenOp.name} (${chosenOp.operator_code})` : 'Unassigned',
        return_time: expectedReturnTime,
        message: res.message || 'Equipment successfully dispatched.'
      });

      const updatedAssets = await getAssets();
      setAssets(updatedAssets || []);
      const refound = updatedAssets.find(a => a.id === selectedAsset.id);
      if (refound) setSelectedAsset(refound);
      window.dispatchEvent(new CustomEvent('CAT360-asset-updated'));
    } catch (err) {
      setLookupError(err.message || 'Check-out transaction failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      setIsProcessing(true);
      setLookupError(null);

      const payload = {
        asset_id: selectedAsset.id,
        checkin_time: checkinTime ? new Date(checkinTime).toISOString() : new Date().toISOString(),
        engine_hours_operated: checkinEngineHours ? Number(checkinEngineHours) : undefined,
        idle_hours_operated: checkinIdleHours ? Number(checkinIdleHours) : undefined,
      };

      const res = await checkinAsset(payload);

      setReceipt({
        type: 'CHECK_IN',
        txId: `TX-IN-${Math.floor(Math.random() * 90000) + 10000}`,
        timestamp: new Date().toISOString(),
        equipment_id: selectedAsset.equipment_id,
        equipment_type: selectedAsset.type,
        site_name: selectedAsset.current_site || 'Central Depot',
        operator_name: selectedAsset.last_operator?.name || 'Unassigned',
        engine_hours: checkinEngineHours,
        idle_hours: checkinIdleHours,
        message: res.message || 'Equipment successfully returned and telematics logged.'
      });

      const updatedAssets = await getAssets();
      setAssets(updatedAssets || []);
      const refound = updatedAssets.find(a => a.id === selectedAsset.id);
      if (refound) setSelectedAsset(refound);
      window.dispatchEvent(new CustomEvent('CAT360-asset-updated'));
    } catch (err) {
      setLookupError(err.message || 'Check-in transaction failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetTerminal = () => {
    setSelectedAsset(null);
    setLookupInput('');
    setReceipt(null);
    setLookupError(null);
  };

  if (loading) return <LoadingSpinner message="Initializing transaction terminal..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadTerminalData} />;

  return (
    <div className="space-y-3 pb-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="op-panel p-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-[#102A43]">
            Transaction Terminal
          </h1>
          <p className="text-xs text-[#627D98]">
            Field optical scan, deployment dispatch, and return intake
          </p>
        </div>
        <button
          onClick={handleResetTerminal}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] border border-[#D9E2EC] bg-white text-xs font-medium text-[#334E68] hover:bg-[#F0F4F8] transition"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      {/* STEP 1: SCAN EQUIPMENT */}
      <div className="op-panel p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#334E68] mb-2 flex items-center gap-1.5">
          <QrCode className="h-3.5 w-3.5 text-[#0E7490]" />
          Step 1: Scan Equipment or Enter ID
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#829AB1]" />
            <input
              type="text"
              placeholder="Enter Equipment ID (e.g. EQ-CAT-320, EQ-CAT-D8)"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLookup();
              }}
              className="w-full rounded-[4px] border border-[#D9E2EC] bg-white pl-8 pr-3 py-1.5 font-mono text-xs font-medium text-[#102A43] placeholder-[#829AB1] focus:border-[#0E7490] focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleLookup()}
            className="px-4 py-1.5 rounded-[4px] bg-[#102A43] text-white text-xs font-medium hover:bg-[#0B1F33] transition shrink-0"
          >
            Lookup Asset
          </button>
        </div>

        {/* Quick presets */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#D9E2EC]">
          <span className="text-[10px] font-semibold text-[#627D98] uppercase">Presets:</span>
          {assets.slice(0, 5).map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setLookupInput(a.equipment_id);
                handleLookup(a.equipment_id);
              }}
              className="font-mono text-[11px] px-1.5 py-0.5 rounded-[3px] border border-[#D9E2EC] bg-[#F8FAFC] text-[#334E68] hover:bg-[#F0F4F8] transition"
            >
              {a.equipment_id}
            </button>
          ))}
        </div>

        {lookupError && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-[3px] bg-red-50 border border-red-200 p-2 text-xs text-[#B91C1C]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}
      </div>

      {/* STEP 2: EQUIPMENT STATUS PANEL */}
      {selectedAsset && (
        <div className="op-panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68]">
              Step 2: Equipment Status & Location
            </span>
            <StatusBadge status={selectedAsset.status} isOverdue={selectedAsset.is_overdue} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-[#F8FAFC] border border-[#D9E2EC] p-2 rounded-[3px]">
              <span className="text-[10px] font-medium uppercase text-[#627D98]">Equipment ID</span>
              <p className="font-mono font-bold text-[#102A43] text-sm mt-0.5">{selectedAsset.equipment_id}</p>
              <p className="text-[11px] text-[#627D98] truncate">{selectedAsset.type}</p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#D9E2EC] p-2 rounded-[3px]">
              <span className="text-[10px] font-medium uppercase text-[#627D98]">Status</span>
              <p className="font-medium text-[#102A43] mt-0.5 capitalize">{selectedAsset.status}</p>
              <p className="text-[11px] text-[#627D98]">{selectedAsset.is_overdue ? 'Overdue' : 'Normal'}</p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#D9E2EC] p-2 rounded-[3px]">
              <span className="text-[10px] font-medium uppercase text-[#627D98]">Current Site</span>
              <p className="font-medium text-[#102A43] mt-0.5 truncate">{selectedAsset.current_site || 'Central Depot'}</p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#D9E2EC] p-2 rounded-[3px]">
              <span className="text-[10px] font-medium uppercase text-[#627D98]">Assigned Operator</span>
              <p className="font-medium text-[#102A43] mt-0.5 truncate">{selectedAsset.last_operator?.name || 'Unassigned'}</p>
            </div>
          </div>

          {/* STEP 3: TRANSACTION EXECUTION */}
          <div className="border-t border-[#D9E2EC] pt-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68] block mb-2">
              Step 3: Execute Transaction
            </span>

            {selectedAsset.status === 'available' ? (
              /* CHECK-OUT FORM */
              <form onSubmit={handleCheckoutSubmit} className="space-y-3 bg-[#F8FAFC] border border-[#D9E2EC] p-3.5 rounded-[4px] text-xs">
                <div className="font-medium text-[#102A43]">
                  Dispatch Check-Out Protocol
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#486581] mb-1">
                      Destination Site *
                    </label>
                    <select
                      value={destSiteId}
                      onChange={(e) => setDestSiteId(e.target.value)}
                      className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
                      required
                    >
                      {sites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.site_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#486581] mb-1">
                      Assigned Operator
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
                    <label className="block text-[11px] font-semibold uppercase text-[#486581] mb-1">
                      Expected Return Timestamp *
                    </label>
                    <input
                      type="datetime-local"
                      value={expectedReturnTime}
                      onChange={(e) => setExpectedReturnTime(e.target.value)}
                      className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-1.5 rounded-[4px] bg-[#102A43] text-white text-xs font-medium hover:bg-[#0B1F33] transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isProcessing ? (
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
            ) : selectedAsset.status === 'rented' ? (
              /* CHECK-IN FORM */
              <form onSubmit={handleCheckinSubmit} className="space-y-3 bg-[#F8FAFC] border border-[#D9E2EC] p-3.5 rounded-[4px] text-xs">
                <div className="font-medium text-[#102A43]">
                  Return Intake & Telematics Recording
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#486581] mb-1">
                      Return Timestamp
                    </label>
                    <input
                      type="datetime-local"
                      value={checkinTime}
                      onChange={(e) => setCheckinTime(e.target.value)}
                      className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#486581] mb-1">
                      Final Shift Engine (h)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={checkinEngineHours}
                      onChange={(e) => setCheckinEngineHours(e.target.value)}
                      placeholder="e.g. 7.5"
                      className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#486581] mb-1">
                      Final Shift Idle (h)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={checkinIdleHours}
                      onChange={(e) => setCheckinIdleHours(e.target.value)}
                      placeholder="e.g. 1.5"
                      className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-1.5 rounded-[4px] bg-[#15803D] text-white text-xs font-medium hover:bg-[#166534] transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isProcessing ? (
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
            ) : (
              <div className="p-3 bg-[#F0F4F8] border border-[#D9E2EC] rounded-[4px] text-xs text-[#627D98]">
                Equipment is in maintenance status. Clear maintenance lock before dispatching.
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: TRANSACTION CONFIRMATION RECEIPT */}
      {receipt && (
        <div className="op-panel p-4 border border-[#102A43]">
          <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-2.5">
            <div>
              <span className="text-[10px] font-semibold uppercase text-[#627D98]">Step 4: Audit Receipt</span>
              <h3 className="text-xs font-bold text-[#102A43]">
                {receipt.type === 'CHECK_OUT' ? 'Check-Out Confirmation' : 'Check-In Confirmation'}
              </h3>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 bg-[#F0F4F8] border border-[#D9E2EC] text-[#102A43] rounded-[3px]">
              {receipt.txId}
            </span>
          </div>

          <div className="my-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[10px] font-medium uppercase text-[#627D98]">Equipment</span>
              <p className="font-mono font-bold text-[#102A43] mt-0.5">{receipt.equipment_id}</p>
              <p className="text-[11px] text-[#627D98]">{receipt.equipment_type}</p>
            </div>

            <div>
              <span className="text-[10px] font-medium uppercase text-[#627D98]">Job Site</span>
              <p className="font-medium text-[#102A43] mt-0.5">{receipt.site_name}</p>
            </div>

            <div>
              <span className="text-[10px] font-medium uppercase text-[#627D98]">Operator</span>
              <p className="font-medium text-[#102A43] mt-0.5">{receipt.operator_name}</p>
            </div>

            <div>
              <span className="text-[10px] font-medium uppercase text-[#627D98]">
                {receipt.type === 'CHECK_OUT' ? 'Expected Return' : 'Recorded At'}
              </span>
              <p className="font-mono text-[#102A43] mt-0.5">
                {receipt.return_time
                  ? new Date(receipt.return_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : new Date(receipt.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="p-2 bg-[#F8FAFC] border border-[#D9E2EC] rounded-[3px] text-xs text-[#334E68] flex items-center justify-between">
            <span>{receipt.message}</span>
            <span className="font-medium text-[#15803D]">● Confirmed</span>
          </div>
        </div>
      )}
    </div>
  );
}
