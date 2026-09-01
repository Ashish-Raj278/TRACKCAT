import React from 'react';
import { Truck } from 'lucide-react';

export default function EquipmentIcon({ type, className = "h-4 w-4" }) {
  const normalized = (type || '').toLowerCase();

  if (normalized.includes('excavator')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 17h14v3H2z" />
        <circle cx="5" cy="20" r="1.5" />
        <circle cx="13" cy="20" r="1.5" />
        <path d="M5 17V9l6 3v5" />
        <path d="M11 12l5-5 4 2-2 4-4-1" />
      </svg>
    );
  }

  if (normalized.includes('bulldozer') || normalized.includes('dozer')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 17h13v3H2z" />
        <circle cx="4" cy="20" r="1.5" />
        <circle cx="8" cy="20" r="1.5" />
        <circle cx="12" cy="20" r="1.5" />
        <path d="M4 17V10h7l2 7" />
        <path d="M17 12l4 2v6h-3" />
      </svg>
    );
  }

  if (normalized.includes('crane')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 21h16" />
        <path d="M7 21V5l10-2v18" />
        <path d="M7 9h10" />
        <path d="M7 14h10" />
        <path d="M17 5l4 3v4" />
      </svg>
    );
  }

  if (normalized.includes('wheel loader') || normalized.includes('loader')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="16" cy="18" r="2.5" />
        <path d="M6 15.5h10V10H9l-3 5.5z" />
        <path d="M16 13l4-3v6h-4" />
      </svg>
    );
  }

  if (normalized.includes('backhoe')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="18" r="2" />
        <circle cx="17" cy="17" r="3" />
        <path d="M5 16h10V9H8l-3 7z" />
        <path d="M17 14l4-5-3-1" />
      </svg>
    );
  }

  return <Truck className={className} />;
}
