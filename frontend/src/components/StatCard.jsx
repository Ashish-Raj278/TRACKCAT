import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'amber', alert = false }) {
  const colorMap = {
    amber: 'from-amber-500/10 to-yellow-500/5 border-amber-500/30 text-amber-400',
    emerald: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/30 text-emerald-400',
    blue: 'from-blue-500/10 to-cyan-500/5 border-blue-500/30 text-blue-400',
    rose: 'from-rose-500/10 to-red-500/5 border-rose-500/30 text-rose-400',
    purple: 'from-purple-500/10 to-indigo-500/5 border-purple-500/30 text-purple-400',
  };

  const selectedColor = colorMap[color] || colorMap.amber;

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] ${selectedColor} ${alert ? 'ring-2 ring-rose-500/50' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/60 border border-slate-700/50 shadow-inner">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
