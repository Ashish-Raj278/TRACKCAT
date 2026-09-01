import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Truck, CalendarDays, TrendingUp, Cpu } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/assets', label: 'Fleet Assets', icon: Truck },
    { to: '/rentals', label: 'Rentals', icon: CalendarDays },
    { to: '/analytics', label: 'Analytics & Forecast', icon: TrendingUp },
    { to: '/telematics', label: 'Telematics', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0F172A]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFCD11] text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              TC
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white">TRACK<span className="text-[#FFCD11]">CAT</span></span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FFCD11] border border-amber-500/30">
                  Smart Fleet
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Equipment Rental & Telematics Intelligence</p>
            </div>
          </NavLink>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#FFCD11] text-slate-950 shadow-md shadow-amber-500/10'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Right side: notification bell + status pill */}
        <div className="flex items-center gap-2.5">
          <NotificationBell />
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-medium text-slate-300">FastAPI Ready</span>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-800/60 px-2 py-2 gap-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  isActive
                    ? 'bg-[#FFCD11] text-slate-950 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </header>
  );
}
