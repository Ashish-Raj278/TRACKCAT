import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Gauge,
  Activity,
  PlusCircle,
  Clock,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2
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
import { getAssets, getAssetUsage, getFleetUsageSummary } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import UsageLogModal from '../components/UsageLogModal';

export default function Telematics() {
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [usageData, setUsageData] = useState(null);
  const [fleetSummary, setFleetSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [usageLogOpen, setUsageLogOpen] = useState(false);

  const fetchAssetsList = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, summaryData] = await Promise.all([
        getAssets(),
        getFleetUsageSummary(),
      ]);
      setAssets(data || []);
      setFleetSummary(summaryData);
      if (data && data.length > 0) {
        setSelectedAssetId(String(data[0].id));
      }
    } catch (err) {
      console.error('Failed to load fleet assets for telematics:', err);
      setError(err.message || 'Unable to connect to telematics telemetry service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetsList();
  }, []);

  const fetchTelematicsForAsset = async (assetId) => {
    if (!assetId) return;
    try {
      setLogsLoading(true);
      const data = await getAssetUsage(assetId);
      setUsageData(data);
    } catch (err) {
      console.error(`Error loading telematics for asset ${assetId}:`, err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAssetId) {
      fetchTelematicsForAsset(selectedAssetId);
    }
  }, [selectedAssetId]);

  const selectedAsset = assets.find((a) => String(a.id) === String(selectedAssetId));

  const handleActionSuccess = () => {
    fetchTelematicsForAsset(selectedAssetId);
  };

  if (loading) return <LoadingSpinner message="Connecting to IoT telematics gateway..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAssetsList} />;

  // Chart data
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Cpu className="h-4 w-4" />
            Live Machine Telemetry
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Telematics & <span className="text-[#FFCD11]">Runtime Logging</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor engine runtime vs idle fuel burn, log daily shift hours, and track operating efficiency.
          </p>
        </div>

        <button
          onClick={() => setUsageLogOpen(true)}
          disabled={!selectedAsset}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FFCD11] px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-[#E5B700] transition disabled:opacity-50"
        >
          <PlusCircle className="h-4 w-4" />
          Log Daily Shift Telematics
        </button>
      </div>

      {/* Asset Selector Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#FFCD11]" />
            Select Equipment Asset:
          </label>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white focus:border-[#FFCD11] focus:outline-none sm:w-80"
          >
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.equipment_id} – {asset.type} ({asset.current_site || 'Yard Depot'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      {selectedAsset && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Total Shift Logs</p>
            <p className="mt-1 text-2xl font-bold text-white">{usageData?.total_logs ?? 0}</p>
            <p className="text-xs text-slate-400 mt-1">Recorded telematics entries</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Total Engine Runtime</p>
            <p className="mt-1 text-2xl font-bold text-blue-400">{usageData?.total_engine_hours ?? 0} hrs</p>
            <p className="text-xs text-slate-400 mt-1">Avg {usageData?.average_engine_hours_per_day ?? 0}h / shift</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Total Idle Fuel Burn</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">{usageData?.total_idle_hours ?? 0} hrs</p>
            <p className="text-xs text-slate-400 mt-1">Avg {usageData?.average_idle_hours_per_day ?? 0}h / shift</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Idle Efficiency Ratio</p>
            <p className={`mt-1 text-2xl font-bold ${selectedAsset.idle_ratio > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {selectedAsset.idle_ratio}%
            </p>
            <p className="text-xs text-slate-400 mt-1">{selectedAsset.idle_ratio > 40 ? 'Alert: High fuel waste' : 'Optimal fuel efficiency'}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#FFCD11]" />
            Runtime vs. Idle Shift Comparison ({selectedAsset?.equipment_id})
          </h3>
        </div>

        <div className="h-72 w-full">
          {logsLoading ? (
            <LoadingSpinner message="Fetching telemetry stream..." />
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No historical telematics logs available for this unit.
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

      {/* Log History */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-slate-400" />
            Telematics Log Archive
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Log Timestamp</th>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Engine Runtime</th>
                <th className="py-3 px-4">Idle Duration</th>
                <th className="py-3 px-4">Total Shift Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(usageData?.logs || []).map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-semibold text-white">
                    {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#FFCD11]">{log.equipment_id || selectedAsset?.equipment_id}</td>
                  <td className="py-3 px-4 text-slate-300">{log.location || selectedAsset?.current_site || 'Site Yard'}</td>
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

      {/* Modal */}
      {selectedAsset && (
        <UsageLogModal
          asset={selectedAsset}
          isOpen={usageLogOpen}
          onClose={() => setUsageLogOpen(false)}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}
