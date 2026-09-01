import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AssetsList from './pages/AssetsList';
import AssetDetail from './pages/AssetDetail';
import Rentals from './pages/Rentals';
import Analytics from './pages/Analytics';
import Telematics from './pages/Telematics';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col selection:bg-[#FFCD11] selection:text-slate-950">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 pt-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/assets" element={<AssetsList />} />
            <Route path="/assets/:id" element={<AssetDetail />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/telematics" element={<Telematics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800/80 bg-[#0F172A] py-6 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">TRACK<span className="text-[#FFCD11]">CAT</span></span>
              <span>— Smart Heavy Equipment Rental & Telematics Intelligence</span>
            </div>
            <p className="text-slate-400 text-[11px]">Designed for Caterpillar Fleet Operations</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
