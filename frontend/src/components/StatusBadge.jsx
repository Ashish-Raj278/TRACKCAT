import React from 'react';

export default function StatusBadge({ status, isOverdue }) {
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#B91C1C]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]"></span>
        Overdue
      </span>
    );
  }

  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'available':
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#15803D]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]"></span>
          Available
        </span>
      );
    case 'rented':
    case 'active':
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0E7490]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0E7490]"></span>
          On Rent
        </span>
      );
    case 'maintenance':
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#627D98]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#627D98]"></span>
          Maintenance
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#486581]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#829AB1]"></span>
          {status || 'Unknown'}
        </span>
      );
  }
}
