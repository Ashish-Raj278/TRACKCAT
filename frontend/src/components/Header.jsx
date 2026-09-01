import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, QrCode, Menu, Clock } from 'lucide-react';

export default function Header({ onOpenMobileMenu, onOpenQRScanner }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('');
  const [searchVal, setSearchVal] = useState('');

  // Page titles and operational subtexts
  const pageMeta = {
    '/': {
      title: 'Fleet Overview',
      desc: 'Real-time machinery deployment and utilization'
    },
    '/assets': {
      title: 'Asset Register',
      desc: 'Live equipment inventory and rental assignments'
    },
    '/rentals': {
      title: 'Active Rentals',
      desc: 'Machine leases, return schedules, and overdue tracking'
    },
    '/terminal': {
      title: 'Transaction Terminal',
      desc: 'Barcode/RFID intake, check-in, and dispatch assignments'
    },
    '/checkout': {
      title: 'Equipment Check-Out',
      desc: 'Dispatch machinery to job sites and assign operators'
    },
    '/checkin': {
      title: 'Equipment Check-In',
      desc: 'Complete rental leases and record return telematics'
    },
    '/analytics': {
      title: 'Operations Analytics',
      desc: 'Demand forecast horizons and telematics anomalies'
    },
    '/telematics': {
      title: 'Fleet Telematics',
      desc: 'Machinery telemetry, engine runtime, and idle logs'
    }
  };

  const currentPath = location.pathname.startsWith('/assets/') ? '/assets' : location.pathname;
  const currentMeta = pageMeta[currentPath] || {
    title: 'Fleet Operations',
    desc: 'Equipment telemetry and rental platform'
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setCurrentTime(`${dateStr} • ${timeStr} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/assets?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#D9E2EC] px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1 rounded-[3px] text-[#334E68] hover:bg-[#F0F4F8] md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-semibold text-[#102A43] flex items-center gap-2 leading-tight">
            {currentMeta.title}
          </h1>
          <p className="hidden sm:block text-[11px] text-[#627D98] leading-tight">
            {currentMeta.desc}
          </p>
        </div>
      </div>

      {/* Right: Quick Search, Live Date, QR Scanner Trigger */}
      <div className="flex items-center gap-2.5">
        {/* Compact Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden lg:block">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#627D98]" />
          <input
            type="text"
            placeholder="Search equipment ID or site..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-52 rounded-[3px] border border-[#D9E2EC] bg-[#F8FAFC] pl-8 pr-3 py-1 text-xs text-[#102A43] placeholder-[#829AB1] focus:border-[#0E7490] focus:bg-white focus:outline-none"
          />
        </form>

        {/* Live Date / Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-[3px] bg-[#F4F7F9] border border-[#D9E2EC] font-mono text-[11px] text-[#486581]">
          <Clock className="h-3 w-3 text-[#627D98]" />
          <span>{currentTime || '01 Sep 2026 • 15:30 UTC'}</span>
        </div>

        {/* Scan Barcode / RFID Action */}
        <button
          onClick={onOpenQRScanner}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#102A43] text-white text-xs font-medium hover:bg-[#0B1F33] transition"
          title="Open Barcode / RFID Scanner"
        >
          <QrCode className="h-3.5 w-3.5 text-[#38BDF8]" />
          <span className="hidden sm:inline">Scan Code</span>
        </button>
      </div>
    </header>
  );
}
