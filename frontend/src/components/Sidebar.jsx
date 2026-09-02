import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  CalendarDays,
  Repeat,
  TrendingUp,
  Cpu
} from 'lucide-react';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/assets', label: 'Assets', icon: Truck },
    { to: '/rentals', label: 'Rentals', icon: CalendarDays },
    { to: '/terminal', label: 'Check-In / Check-Out', icon: Repeat },
    { to: '/analytics', label: 'Analytics', icon: TrendingUp },
    { to: '/telematics', label: 'Telematics', icon: Cpu },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-[#0B1F33] text-[#D9E2EC] border-r border-[#102A43] flex flex-col justify-between transition-transform duration-150 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Workspace Header */}
        <div>
          <div className="h-14 flex items-center px-4 border-b border-[#102A43]">
            <NavLink to="/" className="flex items-center gap-2.5" onClick={onCloseMobile}>
              <div className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-[#0E7490] text-white font-mono font-bold text-xs">
                TC
              </div>
              <div>
                <span className="text-sm font-semibold tracking-tight text-white block leading-none">
                  CAT360
                </span>
                <span className="text-[10px] text-[#829AB1] uppercase tracking-wider block mt-0.5">
                  Fleet Operations
                </span>
              </div>
            </NavLink>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-0.5">
            <div className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#627D98]">
              Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-[3px] text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#102A43] text-white border-l-2 border-[#0E7490]'
                        : 'text-[#9FB3C8] hover:bg-[#102A43]/60 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#829AB1]" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Minimal Operational Status Footer */}
        <div className="p-3 border-t border-[#102A43] bg-[#081827] text-[11px] text-[#829AB1]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-[#627D98]">System Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#15803D] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]"></span>
              Operational
            </span>
          </div>
          <div className="mt-1 text-[10px] text-[#627D98] flex justify-between font-mono">
            <span>FastAPI Gateway</span>
            <span>:8000</span>
          </div>
        </div>
      </aside>
    </>
  );
}
