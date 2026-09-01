import React, { useState } from 'react';
import { X, QrCode, Radio, Search, Truck, CheckCircle2, AlertCircle, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { getAssets } from '../services/api';

const SCANNER_ELEMENT_ID = 'trackcat-qr-scanner';

export default function QRScannerModal({ isOpen, onClose, assets = [], onSelectAssetForCheckout, onSelectAssetForCheckin }) {
  const [scanMode, setScanMode] = useState('qr'); // 'qr' | 'rfid'
  const [scanInput, setScanInput] = useState('');
  const [scannedAsset, setScannedAsset] = useState(null);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const quickPresets = [
    { code: 'EQ-CAT-320', label: 'EQ-CAT-320 (Hydraulic Excavator - Rented)' },
    { code: 'EQ-CAT-D8', label: 'EQ-CAT-D8 (Track Bulldozer - Available)' },
    { code: 'EQ-CAT-430', label: 'EQ-CAT-430 (Backhoe Loader - Overdue)' },
    { code: 'EQ-CAT-950', label: 'EQ-CAT-950 (Wheel Loader - Active)' },
  ];

  const handleLookup = (code) => {
    setError(null);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const clean = (code || scanInput).trim().toUpperCase();
      const found = assets.find(
        (a) => a.equipment_id.toUpperCase() === clean || String(a.id) === clean
      );
      if (found) {
        setScannedAsset(found);
      } else {
        setScannedAsset(null);
        setError(`No equipment found matching QR/RFID payload "${clean}".`);
      }
    }, 400);
  };

  const handleSimulateScan = (code) => {
    setScanInput(code);
    handleLookup(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={() => {
            setScannedAsset(null);
            setError(null);
            onClose();
          }}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFCD11]/20 text-[#FFCD11]">
            {scanMode === 'qr' ? <QrCode className="h-5 w-5" /> : <Radio className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">QR / RFID Telematics Scanner</h3>
            <p className="text-xs text-slate-400">Scan equipment barcode or tap RFID tag for instant check-in/out</p>
          </div>
        </div>

        {/* Scanner Mode Toggle */}
        <div className="my-4 flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
          <button
            onClick={() => {
              setScanMode('qr');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
              scanMode === 'qr'
                ? 'bg-[#FFCD11] text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            QR / Barcode Optical Scan
          </button>
          <button
            onClick={() => {
              setScanMode('rfid');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
              scanMode === 'rfid'
                ? 'bg-[#FFCD11] text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            RFID NFC Tag Reader
          </button>
        </div>

        {/* Visual Simulated Viewfinder */}
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-6 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-dashed border-amber-400/60 bg-slate-900/60 relative">
            {scanMode === 'qr' ? (
              <QrCode className="h-14 w-14 text-amber-400/80 animate-pulse" />
            ) : (
              <Radio className="h-14 w-14 text-blue-400/80 animate-bounce" />
            )}
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-[#FFCD11] shadow-lg shadow-amber-400 animate-pulse top-1/2"></div>
            )}
          </div>
          <p className="mt-3 text-xs font-medium text-slate-400">
            {scanMode === 'qr'
              ? 'Point camera at equipment QR code or select simulation preset'
              : 'Hold RFID keycard or wireless telemetry transponder near reader'}
          </p>
        </div>

        {/* Input and Trigger */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Enter or scan Equipment ID (e.g. EQ-CAT-320)"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLookup();
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-[#FFCD11] focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleLookup()}
            className="rounded-xl bg-[#FFCD11] px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-[#E5B700] transition"
          >
            Lookup
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#FFCD11]" /> Quick Simulation Tags:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map((preset) => (
              <button
                key={preset.code}
                onClick={() => handleSimulateScan(preset.code)}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-amber-400 hover:text-white transition"
              >
                {preset.code}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-950/60 border border-rose-600/50 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Scanned Result Card */}
        {scannedAsset && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">{scannedAsset.equipment_id}</span>
                  <StatusBadge status={scannedAsset.status} isOverdue={scannedAsset.is_overdue} />
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{scannedAsset.type}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Site: <strong className="text-slate-200">{scannedAsset.current_site || 'Main Yard Depot'}</strong>
                </p>
              </div>

              <div className="text-right">
                {scannedAsset.status === 'available' ? (
                  <button
                    onClick={() => {
                      onSelectAssetForCheckout(scannedAsset);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFCD11] px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-[#E5B700] transition"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    Check Out
                  </button>
                ) : scannedAsset.status === 'rented' ? (
                  <button
                    onClick={() => {
                      onSelectAssetForCheckin(scannedAsset);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Check In
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">In Maintenance</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
