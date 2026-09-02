import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import QRScannerModal from './QRScannerModal';
import CheckoutModal from './CheckoutModal';
import CheckinModal from './CheckinModal';
import { getAssets } from '../services/api';

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [allAssets, setAllAssets] = useState([]);

  // Modal actions triggered from scanner
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);

  const fetchAssetsForScanner = async () => {
    try {
      const data = await getAssets();
      setAllAssets(data || []);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchAssetsForScanner();
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-[#102A43] flex">
      {/* Navigation Rail */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-60">
        <Header
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenQRScanner={() => {
            fetchAssetsForScanner();
            setQrModalOpen(true);
          }}
        />

        <main className="flex-1 p-4 sm:p-5 max-w-6xl w-full mx-auto">
          {children}
        </main>

        {/* Minimalist Restrained Footer */}
        <footer className="border-t border-[#D9E2EC] bg-white py-2 px-4 sm:px-6 text-[11px] text-[#627D98]">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#102A43]">CAT360</span>
              <span>•</span>
              <span>Fleet Operations Platform</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#15803D] font-medium">● Operational</span>
              <span>v1.0</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Action Modals */}
      <QRScannerModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        assets={allAssets}
        onSelectAssetForCheckout={(asset) => {
          setSelectedAsset(asset);
          setCheckoutModalOpen(true);
        }}
        onSelectAssetForCheckin={(asset) => {
          setSelectedAsset(asset);
          setCheckinModalOpen(true);
        }}
      />

      <CheckoutModal
        asset={selectedAsset}
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onSuccess={() => {
          fetchAssetsForScanner();
          window.dispatchEvent(new CustomEvent('CAT360-asset-updated'));
        }}
      />

      <CheckinModal
        asset={selectedAsset}
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        onSuccess={() => {
          fetchAssetsForScanner();
          window.dispatchEvent(new CustomEvent('CAT360-asset-updated'));
        }}
      />
    </div>
  );
}
