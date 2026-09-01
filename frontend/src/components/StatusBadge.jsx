import React from 'react';

export default function StatusBadge({ status, isOverdue }) {
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-600/40">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
        Overdue
      </span>
    );
  }

  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'available':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Available
        </span>
      );
    case 'rented':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Rented / Active
        </span>
      );
    case 'maintenance':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-600/50">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Maintenance
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
          {status || 'Unknown'}
        </span>
      );
  }
}
