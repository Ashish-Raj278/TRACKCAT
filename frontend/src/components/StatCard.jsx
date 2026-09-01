import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  alert = false,
  statusColor = 'neutral',
}) {
  const dotColor = {
    green: 'bg-[#15803D]',
    amber: 'bg-[#B45309]',
    red: 'bg-[#B91C1C]',
    blue: 'bg-[#0E7490]',
    neutral: 'bg-[#829AB1]'
  };

  return (
    <div className={`p-3 bg-white border border-[#D9E2EC] rounded-[4px] flex flex-col justify-between ${alert ? 'bg-red-50/20 border-red-200' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#627D98]">
          {title}
        </span>
        {statusColor !== 'neutral' && (
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor[statusColor] || dotColor.neutral}`}></span>
        )}
      </div>

      <div className="mt-1.5">
        <span className="font-mono text-xl lg:text-2xl font-bold tracking-tight text-[#102A43]">
          {value}
        </span>
      </div>

      {subtitle && (
        <p className="mt-0.5 text-[11px] text-[#627D98] truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
