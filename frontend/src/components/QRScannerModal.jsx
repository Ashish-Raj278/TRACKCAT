import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, QrCode, Search, Truck, CheckCircle2, AlertCircle, Sparkles, Camera, CameraOff, Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import StatusBadge from './StatusBadge';
import { getAssets } from '../services/api';

const SCANNER_ELEMENT_ID = 'CAT360-qr-scanner';

export default function QRScannerModal({ isOpen, onClose, assets = [], onSelectAssetForCheckout, onSelectAssetForCheckin }) {
  const [mode, setMode] = useState('scanner');        // 'scanner' | 'manual'
  const [scanInput, setScanInput] = useState('');
  const [scannedAsset, setScannedAsset] = useState(null);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [allAssets, setAllAssets] = useState(assets);

  const html5QrcodeRef = useRef(null);

  // Merge live asset list with prop assets
  useEffect(() => {
    if (assets && assets.length > 0) {
      setAllAssets(assets);
    } else {
      getAssets().then(d => {
        if (d && Array.isArray(d)) setAllAssets(d);
      }).catch(() => {});
    }
  }, [assets]);

  // ---- Camera lifecycle ----
  const stopCamera = useCallback(async () => {
    if (html5QrcodeRef.current) {
      try {
        const state = html5QrcodeRef.current.getState();
        // State 2 = SCANNING, state 3 = PAUSED
        if (state === 2 || state === 3) {
          await html5QrcodeRef.current.stop();
        }
        html5QrcodeRef.current.clear();
      } catch (_) { /* ignore */ }
      html5QrcodeRef.current = null;
    }
    setCameraActive(false);
    setScanning(false);
  }, []);

  const handleLookup = useCallback((code) => {
    const clean = (code || scanInput).trim().toUpperCase();
    if (!clean) {
      setError('Please enter an equipment ID.');
      return;
    }
    setError(null);
    const found = allAssets.find(
      a => a.equipment_id.toUpperCase() === clean || String(a.id) === clean
    );
    if (found) {
      setScannedAsset(found);
    } else {
      setScannedAsset(null);
      setError(`Equipment "${clean}" not found in the fleet. Check the ID and try again.`);
    }
  }, [scanInput, allAssets]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScanning(true);

    // Wait for DOM element to be present
    await new Promise(r => setTimeout(r, 150));

    if (!document.getElementById(SCANNER_ELEMENT_ID)) {
      setCameraError('Scanner element not found. Please try again.');
      setScanning(false);
      return;
    }

    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      html5QrcodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        (decodedText) => {
          // QR decoded successfully
          const clean = decodedText.trim().toUpperCase();
          handleLookup(clean);
          stopCamera();
        },
        () => { /* scan tick - no action needed */ }
      );

      setCameraActive(true);
      setScanning(false);
    } catch (err) {
      await stopCamera();
      const msg = err?.message || String(err);
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
        setCameraError('Camera permission denied. Use manual entry below.');
      } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('no camera')) {
        setCameraError('No camera detected. Use manual entry below.');
      } else {
        setCameraError(`Camera error: ${msg}. Use manual entry below.`);
      }
      setScanning(false);
    }
  }, [stopCamera, handleLookup]);

  // Stop camera and cleanup when modal closes, unmounts, or mode changes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedAsset(null);
      setError(null);
      setScanInput('');
      setCameraError(null);
    } else {
      // Refresh asset list from API to guarantee latest statuses
      getAssets().then(d => {
        if (d && Array.isArray(d)) setAllAssets(d);
      }).catch(() => {});
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  useEffect(() => {
    if (mode !== 'scanner') stopCamera();
  }, [mode, stopCamera]);

  // Quick presets for demo
  const quickPresets = [
    { code: 'EQ-CAT-336', label: 'Overdue Excavator' },
    { code: 'EQ-CAT-D8', label: 'Available Bulldozer' },
    { code: 'EQ-CAT-430', label: 'Overdue Backhoe' },
    { code: 'EQ-CAT-272', label: 'Available Skid Steer' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl my-4">
        {/* Close Button */}
        <button
          onClick={async () => {
            await stopCamera();
            setScannedAsset(null);
            setError(null);
            onClose();
          }}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-6 pt-6 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFCD11]/20 text-[#FFCD11]">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">QR Code Scanner</h3>
            <p className="text-xs text-slate-400">Scan equipment QR or enter ID manually</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Mode Toggle */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
            <button
              onClick={() => setMode('scanner')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                mode === 'scanner' ? 'bg-[#FFCD11] text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              Camera Scan
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                mode === 'manual' ? 'bg-[#FFCD11] text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              Manual Entry
            </button>
          </div>

          {/* ======== CAMERA SCANNER MODE ======== */}
          {mode === 'scanner' && (
            <div className="space-y-3">
              {/* Scanner viewport */}
              <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-black min-h-[260px] flex items-center justify-center">
                <div id={SCANNER_ELEMENT_ID} className="w-full" />

                {/* Overlay when camera not active */}
                {!cameraActive && !scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-amber-400/50 bg-slate-900">
                      <QrCode className="h-10 w-10 text-amber-400/70" />
                    </div>
                    <p className="text-xs text-slate-400 text-center px-4">
                      {cameraError || 'Click "Start Camera" to scan a QR code'}
                    </p>
                  </div>
                )}

                {/* Loading overlay */}
                {scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80">
                    <Loader2 className="h-8 w-8 text-[#FFCD11] animate-spin" />
                    <p className="text-xs text-slate-400">Starting camera...</p>
                  </div>
                )}

                {/* Active scan indicator */}
                {cameraActive && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Scanning...
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-950/40 border border-amber-600/40 p-3 text-xs text-amber-300">
                  <CameraOff className="h-4 w-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              <div className="flex gap-2">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    disabled={scanning}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#FFCD11] py-2.5 text-xs font-bold text-slate-950 hover:bg-[#E5B700] disabled:opacity-60 transition"
                  >
                    <Camera className="h-4 w-4" />
                    {scanning ? 'Starting...' : 'Start Camera'}
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-700 py-2.5 text-xs font-bold text-white hover:bg-slate-600 transition"
                  >
                    <CameraOff className="h-4 w-4" />
                    Stop Camera
                  </button>
                )}
              </div>

              {/* Quick presets section */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#FFCD11]" /> Demo Quick Scan:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickPresets.map(p => (
                    <button
                      key={p.code}
                      onClick={() => { setScanInput(p.code); handleLookup(p.code); }}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-amber-400 hover:text-white transition"
                    >
                      {p.code} <span className="text-slate-500">– {p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======== MANUAL ENTRY MODE ======== */}
          {mode === 'manual' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Equipment ID</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. EQ-CAT-336"
                      value={scanInput}
                      onChange={e => setScanInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleLookup(); }}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#FFCD11] focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleLookup()}
                    className="rounded-xl bg-[#FFCD11] px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-[#E5B700] transition"
                  >
                    Identify
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#FFCD11]" /> Quick Presets:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickPresets.map(p => (
                    <button
                      key={p.code}
                      onClick={() => { setScanInput(p.code); handleLookup(p.code); }}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-amber-400 hover:text-white transition"
                    >
                      {p.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======== ERROR ======== */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-950/60 border border-rose-600/50 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ======== SCANNED RESULT ======== */}
          {scannedAsset && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-black text-white">{scannedAsset.equipment_id}</span>
                    <StatusBadge status={scannedAsset.status} isOverdue={scannedAsset.is_overdue} />
                  </div>
                  <p className="text-xs text-slate-300">{scannedAsset.type}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Site: <strong className="text-slate-200">{scannedAsset.current_site || 'Main Yard Depot'}</strong>
                  </p>
                </div>

                {/* QR code preview */}
                <div className="shrink-0 p-1.5 bg-white rounded-lg shadow-lg">
                  <QRCodeSVG value={scannedAsset.equipment_id} size={64} level="M" />
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                {scannedAsset.status === 'available' ? (
                  <button
                    onClick={() => { onSelectAssetForCheckout(scannedAsset); onClose(); }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFCD11] px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-[#E5B700] transition"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    Check Out Now
                  </button>
                ) : scannedAsset.status === 'rented' ? (
                  <button
                    onClick={() => { onSelectAssetForCheckin(scannedAsset); onClose(); }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Check In Now
                  </button>
                ) : (
                  <div className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs text-slate-400">
                    ⚙️ Currently under maintenance — checkout not available.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}