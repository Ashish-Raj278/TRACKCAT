import React, { useState } from 'react';
import { X, QrCode, Radio, Search, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function QRScannerModal({ isOpen, onClose, assets = [], onSelectAssetForCheckout, onSelectAssetForCheckin }) {
  const [scanMode, setScanMode] = useState('qr');
  const [scanInput, setScanInput] = useState('');
  const [scannedAsset, setScannedAsset] = useState(null);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const quickPresets = [
    { code: 'EQ-CAT-320', label: 'EQ-CAT-320 [Excavator - Rented]' },
    { code: 'EQ-CAT-D8', label: 'EQ-CAT-D8 [Bulldozer - Available]' },
    { code: 'EQ-CAT-430', label: 'EQ-CAT-430 [Backhoe - Overdue]' },
    { code: 'EQ-CAT-950', label: 'EQ-CAT-950 [Loader - Active]' },
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
        setError(`No equipment record matched barcode/RFID payload "${clean}".`);
      }
    }, 250);
  };

  const handleSimulateScan = (code) => {
    setScanInput(code);
    handleLookup(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md rounded-[4px] border border-[#D9E2EC] bg-white p-5 shadow-lg">
        <button
          onClick={() => {
            setScannedAsset(null);
            setError(null);
            onClose();
          }}
          className="absolute right-4 top-4 p-1 text-[#829AB1] hover:text-[#102A43] transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#D9E2EC] pb-3">
          <h3 className="text-sm font-semibold text-[#102A43]">
            Barcode & RFID Scanner
          </h3>
          <p className="text-[12px] text-[#627D98] mt-0.5">
            Optical scan or RFID transponder lookup
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="my-3 flex rounded-[4px] border border-[#D9E2EC] bg-[#F0F4F8] p-0.5 text-xs font-medium">
          <button
            onClick={() => {
              setScanMode('qr');
              setError(null);
            }}
            className={`flex-1 py-1 rounded-[3px] transition ${
              scanMode === 'qr'
                ? 'bg-white text-[#102A43] shadow-xs'
                : 'text-[#627D98] hover:text-[#102A43]'
            }`}
          >
            Barcode / QR Code
          </button>
          <button
            onClick={() => {
              setScanMode('rfid');
              setError(null);
            }}
            className={`flex-1 py-1 rounded-[3px] transition ${
              scanMode === 'rfid'
                ? 'bg-white text-[#102A43] shadow-xs'
                : 'text-[#627D98] hover:text-[#102A43]'
            }`}
          >
            RFID Transponder
          </button>
        </div>

        {/* Viewfinder simulation */}
        <div className="relative rounded-[4px] border border-[#D9E2EC] bg-[#0B1F33] p-4 text-center text-white">
          <div className="relative mx-auto flex h-20 w-40 items-center justify-center border border-dashed border-[#829AB1] bg-[#102A43]">
            {scanMode === 'qr' ? (
              <QrCode className="h-8 w-8 text-[#38BDF8]" />
            ) : (
              <Radio className="h-8 w-8 text-[#38BDF8]" />
            )}
            {isScanning && (
              <div className="absolute inset-x-0 h-0.5 bg-[#EF4444] top-1/2"></div>
            )}
          </div>
          <p className="mt-2 text-[11px] text-[#9FB3C8]">
            {scanMode === 'qr'
              ? 'Align camera over machine code'
              : 'Hold wireless transponder near sensor'}
          </p>
        </div>

        {/* Search */}
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#627D98]" />
            <input
              type="text"
              placeholder="Enter ID (e.g. EQ-CAT-320)"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLookup();
              }}
              className="w-full rounded-[4px] border border-[#D9E2EC] bg-white pl-8 pr-3 py-1.5 text-xs text-[#102A43] font-mono focus:border-[#0E7490] focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleLookup()}
            className="rounded-[4px] bg-[#102A43] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#0B1F33] transition"
          >
            Lookup
          </button>
        </div>

        {/* Presets */}
        <div className="mt-2.5 pt-2 border-t border-[#D9E2EC]">
          <span className="text-[10px] font-semibold text-[#627D98] uppercase block mb-1">Preset simulation:</span>
          <div className="flex flex-wrap gap-1">
            {quickPresets.map((preset) => (
              <button
                key={preset.code}
                onClick={() => handleSimulateScan(preset.code)}
                className="rounded-[3px] border border-[#D9E2EC] bg-[#F8FAFC] px-1.5 py-0.5 font-mono text-[11px] text-[#334E68] hover:bg-[#F0F4F8] transition"
              >
                {preset.code}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-[3px] bg-red-50 border border-red-200 p-2 text-xs text-[#B91C1C]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scanned Result Card */}
        {scannedAsset && (
          <div className="mt-3 rounded-[4px] border border-[#D9E2EC] bg-[#F8FAFC] p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#102A43] text-sm">{scannedAsset.equipment_id}</span>
                  <StatusBadge status={scannedAsset.status} isOverdue={scannedAsset.is_overdue} />
                </div>
                <p className="text-xs text-[#334E68] mt-0.5">{scannedAsset.type}</p>
                <p className="text-[11px] text-[#627D98] mt-0.5">
                  Site: <span className="font-medium text-[#102A43]">{scannedAsset.current_site || 'Central Depot'}</span>
                </p>
              </div>

              <div className="shrink-0">
                {scannedAsset.status === 'available' ? (
                  <button
                    onClick={() => {
                      onSelectAssetForCheckout(scannedAsset);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 rounded-[4px] bg-[#102A43] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#0B1F33] transition"
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
                    className="inline-flex items-center gap-1 rounded-[4px] bg-[#15803D] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#166534] transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Check In
                  </button>
                ) : (
                  <span className="text-xs text-[#627D98]">In Maintenance</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
