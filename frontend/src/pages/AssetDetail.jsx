import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  MapPin,
  User,
  Calendar,
  Gauge,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { getAssetById, getAssetUsage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CheckoutModal from '../components/CheckoutModal';
import CheckinModal from '../components/CheckinModal';
import UsageLogModal from '../components/UsageLogModal';

export default function AssetDetail() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [usageLogOpen, setUsageLogOpen] = useState(false);

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [assetRes, usageRes] = await Promise.all([
        getAssetById(id),
        getAssetUsage(id).catch(() => null),
      ]);
      setAsset(assetRes);
      setUsageData(usageRes);
    } catch (err) {
      console.error('Error fetching asset details:', err);
      setError(err.message || `Unable to load asset #${id}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  const handleActionSuccess = () => {
    fetchAssetDetails();
  };

  if (loading) return <LoadingSpinner message={`Loading equipment #${id} telemetry profile...`} />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAssetDetails} />;
  if (!asset) return <ErrorMessage message="Equipment asset record not found." />;

  // Prepare chart data (reverse so oldest to newest)
  const chartData = (usageData?.logs || [])
    .slice()
    .reverse()
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      'Engine Runtime': log.engine_hours,
      'Idle Time': log.idle_hours,
    }));

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/assets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#FFCD11] transition mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Fleet Inventory
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white sm:text-3xl">
              {asset.equipment_id}
            </h1>
            <StatusBadge status={asset.status} isOverdue={asset.is_overdue} />
          </div>
          <p className="text-sm text-slate-400 mt-1">{asset.type} • Fleet Machinery Profile</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUsageLogOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            <Gauge className="h-4 w-4 text-blue-400" />
            Record Telematics
          </button>

          {asset.status === 'available' ? (
            <button
              onClick={() => setCheckoutOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFCD11] px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-[#E5B700] transition shadow-lg shadow-amber-500/10"
            >
              <Truck className="h-4 w-4" />
              Check Out Asset
            </button>
          ) : asset.status === 'rented' ? (
            <button
              onClick={() => setCheckinOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 className="h-4 w-4" />
              Check In Asset
            </button>
          ) : null}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Current Assignment</p>
          <p className="mt-1 text-base font-bold text-white flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#FFCD11]" />
            {asset.current_site || 'Main Yard Depot'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Op: {asset.last_operator?.name ? `${asset.last_operator.name} (${asset.last_operator.operator_code})` : 'Unassigned'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Avg Daily Engine Runtime</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">{asset.engine_hours_per_day} hrs</p>
          <p className="text-xs text-slate-400 mt-1">Across {asset.operating_days || 1} logged operational days</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Idle Fuel Burn Ratio</p>
          <p className={`mt-1 text-2xl font-bold ${asset.idle_ratio > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {asset.idle_ratio}%
          </p>
          <p className="text-xs text-slate-400 mt-1">Avg {asset.idle_hours_per_day}h idle per operating shift</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Rental Status</p>
          <p className="mt-1 text-base font-bold text-white">
            {asset.status === 'rented' ? 'Active On-Site' : 'Available in Depot'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {asset.expected_checkin_date
              ? `Expected: ${new Date(asset.expected_checkin_date).toLocaleDateString()}`
              : 'No active lease'}
          </p>
        </div>
      </div>

      {/* Telematics Historical Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#FFCD11]" />
              Historical Runtime & Idle Telematics
            </h3>
            <p className="text-xs text-slate-400">Shift breakdown: Engine operation vs. idle fuel burn</p>
          </div>
          <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
            Total Telemetry Logs: {usageData?.total_logs ?? 0}
          </span>
        </div>

        <div className="mt-6 h-72 w-full">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No daily telemetry logs recorded for this machine yet. Click "Record Telematics" above to add logs.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Engine Runtime" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Idle Time" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Telemetry Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-400" />
            Recent Telematics Logs
          </h3>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/50 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Location / Site</th>
                <th className="py-3 px-4">Engine Hours</th>
                <th className="py-3 px-4">Idle Hours</th>
                <th className="py-3 px-4">Total Shift Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(usageData?.logs || []).map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-semibold text-white">
                    {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{log.location || asset.current_site}</td>
                  <td className="py-3 px-4 font-semibold text-blue-400">{log.engine_hours} hrs</td>
                  <td className="py-3 px-4 font-semibold text-amber-400">{log.idle_hours} hrs</td>
                  <td className="py-3 px-4 text-slate-300">
                    {(Number(log.engine_hours) + Number(log.idle_hours)).toFixed(1)} hrs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CheckoutModal
        asset={asset}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <CheckinModal
        asset={asset}
        isOpen={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <UsageLogModal
        asset={asset}
        isOpen={usageLogOpen}
        onClose={() => setUsageLogOpen(false)}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
