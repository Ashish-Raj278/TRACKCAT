import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAlerts } from '../services/api';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationBell() {
  const [alertData, setAlertData] = useState({ total_alerts: 0, critical_count: 0, warning_count: 0, alerts: [] });
  const [open, setOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getAlerts();
      if (data) {
        setAlertData(data);
        // Browser notifications for new critical alerts
        if (notifPermission === 'granted' && data.alerts?.length > 0) {
          const notified = JSON.parse(localStorage.getItem('trackcat_notified_alerts') || '[]');
          const newNotified = [...notified];
          data.alerts.forEach(alert => {
            if (!notified.includes(alert.id)) {
              const title = alert.severity === 'critical' ? '🔴 TRACKCAT Critical Alert' : '🟠 TRACKCAT Return Reminder';
              new Notification(title, {
                body: alert.message,
                icon: '/favicon.ico',
                tag: alert.id,
              });
              newNotified.push(alert.id);
            }
          });
          localStorage.setItem('trackcat_notified_alerts', JSON.stringify(newNotified.slice(-50)));
        }
      }
    } catch (e) {
      // silently ignore
    }
  }, [notifPermission]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function enableDesktopAlerts() {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  const count = alertData.total_alerts || 0;
  const alerts = alertData.alerts || [];

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center h-7 w-7 rounded-[3px] border border-[#D9E2EC] bg-[#F8FAFC] text-[#334E68] hover:bg-[#E2E8F0] hover:text-[#102A43] transition"
        title="Fleet Alerts"
      >
        <Bell className="h-3.5 w-3.5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B91C1C] px-1 text-[9px] font-bold text-white shadow leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[520px] flex flex-col rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/60 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#FFCD11]" />
              <span className="text-sm font-bold text-white">Fleet Alerts</span>
              {count > 0 && (
                <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[11px] font-bold text-rose-400">
                  {count} Active
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Summary Pills */}
          {count > 0 && (
            <div className="flex gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-950/40 shrink-0">
              {alertData.critical_count > 0 && (
                <span className="flex items-center gap-1 rounded-lg bg-rose-950/60 border border-rose-600/40 px-2.5 py-1 text-[11px] font-semibold text-rose-400">
                  🔴 {alertData.critical_count} Overdue
                </span>
              )}
              {alertData.warning_count > 0 && (
                <span className="flex items-center gap-1 rounded-lg bg-amber-950/60 border border-amber-600/40 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
                  🟠 {alertData.warning_count} Due Soon
                </span>
              )}
            </div>
          )}

          {/* Alert List */}
          <div className="overflow-y-auto flex-1">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <Bell className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-white">All Clear</p>
                <p className="text-xs text-slate-400">No overdue or due-soon rentals.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {alerts.map(alert => (
                  <button
                    key={alert.id}
                    onClick={() => { navigate('/rentals'); setOpen(false); }}
                    className="w-full text-left px-4 py-3.5 hover:bg-slate-800/60 transition group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-sm ${
                        alert.severity === 'critical'
                          ? 'border-rose-600/50 bg-rose-950/60 text-rose-400'
                          : 'border-amber-600/50 bg-amber-950/60 text-amber-400'
                      }`}>
                        {alert.severity === 'critical' ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {alert.type === 'OVERDUE' ? '● OVERDUE' : '◎ DUE SOON'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-bold text-white truncate">{alert.equipment_id}</span>
                          <span className="text-xs text-slate-400 truncate">{alert.asset_type}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{alert.message}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[11px] text-slate-500">
                            {alert.site}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Due: {formatDate(alert.expected_return_time)}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 transition mt-2 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-800 shrink-0 bg-slate-950/40 flex items-center justify-between gap-3">
            {notifPermission !== 'granted' && notifPermission !== 'denied' ? (
              <button
                onClick={enableDesktopAlerts}
                className="text-[11px] font-semibold text-[#FFCD11] hover:underline"
              >
                🔔 Enable Desktop Alerts
              </button>
            ) : notifPermission === 'granted' ? (
              <span className="text-[11px] text-emerald-400 font-medium">✓ Desktop alerts enabled</span>
            ) : (
              <span className="text-[11px] text-slate-500">In-app alerts active</span>
            )}
            <button
              onClick={() => { navigate('/rentals'); setOpen(false); }}
              className="text-[11px] font-semibold text-slate-400 hover:text-white transition"
            >
              View All Rentals →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
