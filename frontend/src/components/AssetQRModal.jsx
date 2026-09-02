import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Download } from 'lucide-react';

export default function AssetQRModal({ isOpen, onClose, asset }) {
  if (!isOpen || !asset) return null;

  function downloadQR() {
    const svg = document.getElementById('asset-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const size = 300;
    canvas.width = size;
    canvas.height = size + 40;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(asset.equipment_id, size / 2, size + 26);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = `${asset.equipment_id}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFCD11]/20 text-[#FFCD11]">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Asset QR Code</h3>
            <p className="text-xs text-slate-400">{asset.type}</p>
          </div>
        </div>

        {/* QR Code Display */}
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-2xl shadow-lg">
            <QRCodeSVG
              id="asset-qr-svg"
              value={asset.equipment_id}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>

          {/* Equipment ID label */}
          <div className="text-center">
            <p className="font-black text-lg text-white font-mono tracking-wider">{asset.equipment_id}</p>
            <p className="text-xs text-slate-400 mt-0.5">{asset.current_site || 'Main Yard Depot'}</p>
          </div>

          {/* Instructions */}
          <div className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
            <p className="text-[11px] text-slate-400">
              Scan this QR code using the CAT360 Scanner to instantly identify this equipment and initiate check-in or check-out.
            </p>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadQR}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <Download className="h-3.5 w-3.5" />
            Download QR as PNG
          </button>
        </div>
      </div>
    </div>
  );
}
