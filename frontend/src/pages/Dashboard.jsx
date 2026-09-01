import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Activity,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  Calendar,
  Gauge,
  QrCode,
  Fuel,
  ShieldAlert,
  Bell
} from 'lucide-react';
import { getDashboardStats, getAnomalies, getAlerts, getAssets } from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CheckoutModal from '../components/CheckoutModal';
import CheckinModal from '../components/CheckinModal';
import QRScannerModal from '../components/QRScannerModal';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [alerts, setAlerts] = useState({ overdue_items: [], due_soon_items: [] });
  const [allAssets, setAllAssets] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, anomaliesData, alertsData, assetsData] = await Promise.all([
        getDashboardStats(),
        getAnomalies(),
        getAlerts(),
        getAssets(),
      ]);

      setStats(statsData);
      setAnomalies(anomaliesData?.anomalies || []);
      setAlerts(alertsData || { overdue_items: [], due_soon_items: [] });
      setAllAssets(assetsData || []);
      setRecentAssets((assetsData || []).slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to connect to backend dashboard service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleActionSuccess = () => {
    loadDashboardData();
  };

  if (loading) return <LoadingSpinner message="Aggregating fleet KPIs, telematics & alerts..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadDashboardData} />;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Fleet Intelligence <span className="text-[#FFCD11]">Overview</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time machinery utilization, fuel telematics, overdue alerts & predictive planning.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setQrModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-2.5 text-xs font-bold text-[#FFCD11] hover:bg-amber-500/30 transition shadow-sm"
          >
            <QrCode className="h-4 w-4" />
            Scan QR / RFID
          </button>
          <Link
            to="/rentals"
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFCD11] px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-[#E5B700] transition"
          >
            <Clock className="h-4 w-4" />
            Manage Rentals
          </Link>
          <Link
            to="/analytics"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            <TrendingUp className="h-4 w-4 text-[#FFCD11]" />
            AI Forecast
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Fleet Utilization"
          value={`${stats?.utilization_rate ?? 0}%`}
          subtitle={`${stats?.rented_assets ?? 0} of ${stats?.total_assets ?? 0} units active`}
          icon={Truck}
          color="amber"
        />
        <StatCard
          title="Available Units"
          value={stats?.available_assets ?? 0}
          subtitle="Ready for deployment"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Average Idle Ratio"
          value={`${stats?.average_idle_ratio ?? 0}%`}
          subtitle="Target threshold: <30%"
          icon={Activity}
          color={stats?.average_idle_ratio > 35 ? 'rose' : 'blue'}
        />
        <StatCard
          title="Return Alerts"
          value={(alerts?.overdue_items?.length || 0) + (alerts?.due_soon_items?.length || 0)}
          subtitle={`${alerts?.overdue_items?.length || 0} overdue • ${alerts?.due_soon_items?.length || 0} due soon`}
          icon={AlertTriangle}
          color="rose"
          alert={(alerts?.overdue_items?.length || 0) > 0}
        />
      </div>

      {/* Fleet Telematics & Fuel Counters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="p-2 text-center border-r border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Fleet</p>
          <p className="text-xl font-bold text-white mt-1">{stats?.total_assets ?? 0} units</p>
        </div>
        <div className="p-2 text-center border-r border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Active Sites</p>
          <p className="text-xl font-bold text-[#FFCD11] mt-1">{stats?.total_sites ?? 0}</p>
        </div>
        <div className="p-2 text-center border-r border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Engine Hours</p>
          <p className="text-xl font-bold text-blue-400 mt-1">{stats?.total_fleet_engine_hours ?? 0} h</p>
        </div>
        <div className="p-2 text-center border-r border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Fuel Consumed</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{stats?.total_fleet_fuel_used ?? 0} gal</p>
        </div>
        <div className="p-2 text-center col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Fleet Downtime</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{stats?.fleet_downtime_hours ?? 0} h</p>
        </div>
      </div>

      {/* Return Alerts & Anomalies Split Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Return Alerts Card (Overdue + Due Soon) */}
        <div className="rounded-2xl border border-rose-900/40 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Return Schedule Alerts</h3>
                <p className="text-[11px] text-slate-400">Overdue violations & approaching deadlines (next 48h)</p>
              </div>
            </div>
            <Link to="/rentals" className="text-xs text-[#FFCD11] hover:underline flex items-center gap-1 font-semibold">
              View All ({alerts.overdue_items.length + (alerts.due_soon_items?.length || 0)})
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {alerts.overdue_items.length === 0 && (alerts.due_soon_items?.length || 0) === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No overdue or approaching return alerts detected.</p>
            ) : (
              <>
                {alerts.overdue_items.slice(0, 2).map((item, idx) => (
                  <div
                    key={`overdue-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-rose-900/50 bg-rose-950/20 p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.equipment_id}</span>
                        <span className="text-[11px] text-slate-400">({item.type})</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">Site: {item.site}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-md bg-rose-900/80 px-2 py-0.5 text-xs font-bold text-rose-300 border border-rose-600/40">
                        +{item.overdue_days}d overdue
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Op: {item.operator_name || 'Unassigned'}</p>
                    </div>
                  </div>
                ))}
                {(alerts.due_soon_items || []).slice(0, 2).map((item, idx) => (
                  <div
                    key={`due-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-amber-900/50 bg-amber-950/20 p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.equipment_id}</span>
                        <span className="text-[11px] text-slate-400">({item.type})</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">Site: {item.site}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-md bg-amber-900/80 px-2 py-0.5 text-xs font-bold text-amber-300 border border-amber-600/40">
                        Due in {item.hours_remaining}h
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Op: {item.operator_name || 'Unassigned'}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Fleet Anomalies Quick Alert */}
        <div className="rounded-2xl border border-amber-900/40 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-[#FFCD11]">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Detected Telematics Anomalies</h3>
                <p className="text-[11px] text-slate-400">High idle, low utilization & runtime flags</p>
              </div>
            </div>
            <Link to="/analytics" className="text-xs text-[#FFCD11] hover:underline flex items-center gap-1 font-semibold">
              View All ({anomalies.length})
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {anomalies.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">All telematics operating within standard parameters.</p>
            ) : (
              anomalies.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#FFCD11] text-xs">{item.equipment_id}</span>
                      <span className="text-[10px] font-bold uppercase rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                        {item.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      item.severity === 'high' ? 'bg-rose-950 text-rose-300 border border-rose-600/40' : 'bg-amber-950 text-amber-300 border border-amber-600/40'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-300 line-clamp-2">{item.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fleet Assets Snapshot Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-white text-base">Fleet Equipment Snapshot</h3>
            <p className="text-xs text-slate-400">Current status and operating metrics for active machinery</p>
          </div>
          <Link
            to="/assets"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFCD11] hover:underline"
          >
            All Equipment Fleet
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/50 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Equipment ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Current Site</th>
                <th className="py-3 px-4">Runtime / Idle</th>
                <th className="py-3 px-4">Idle Ratio</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-white">
                    <Link to={`/assets/${asset.id}`} className="hover:text-[#FFCD11] transition">
                      {asset.equipment_id}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{asset.type}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={asset.status} isOverdue={asset.is_overdue} />
                  </td>
                  <td className="py-3 px-4 text-slate-300">{asset.current_site || 'Yard Depot'}</td>
                  <td className="py-3 px-4 text-slate-300">
                    <span className="text-blue-400 font-semibold">{asset.engine_hours_per_day}h</span> engine /{' '}
                    <span className="text-amber-400 font-semibold">{asset.idle_hours_per_day}h</span> idle
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${asset.idle_ratio > 40 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {asset.idle_ratio}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      {asset.status === 'available' && (
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setCheckoutModalOpen(true);
                          }}
                          className="rounded-lg bg-[#FFCD11] px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-[#E5B700] transition"
                        >
                          Check Out
                        </button>
                      )}
                      {asset.status === 'rented' && (
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setCheckinModalOpen(true);
                          }}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition"
                        >
                          Check In
                        </button>
                      )}
                      <Link
                        to={`/assets/${asset.id}`}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 transition"
                      >
                        Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CheckoutModal
        asset={selectedAsset}
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <CheckinModal
        asset={selectedAsset}
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <QRScannerModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        assets={allAssets}
        onSelectAssetForCheckout={(asset) => {
          setSelectedAsset(asset);
          setCheckoutModalOpen(true);
        }}
        onSelectAssetForCheckin={(asset) => {
          setSelectedAsset(asset);
          setCheckinModalOpen(true);
        }}
      />
    </div>
  );
}
