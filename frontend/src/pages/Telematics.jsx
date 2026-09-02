import React, { useState, useEffect } from 'react';
import {
  Cpu,
  PlusCircle,
  TrendingUp,
  FileSpreadsheet,
  MapPin,
  Clock,
  Activity,
  AlertCircle
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
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import UsageLogModal from '../components/UsageLogModal';

export default function Telematics() {
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [timeRange, setTimeRange] = useState('30d');
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [usageLogOpen, setUsageLogOpen] = useState(false);

  const fetchAssetsList = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data] = await Promise.all([
        getAssets(),
        getFleetUsageSummary(),
      ]);
      setAssets(data || []);
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
    const handleUpdate = () => fetchAssetsList();
    window.addEventListener('CAT360-asset-updated', handleUpdate);
    return () => window.removeEventListener('CAT360-asset-updated', handleUpdate);
  }, []);

  const fetchTelematicsForAsset = async (assetId) => {
    if (!assetId) return;
    try {
      setLogsLoading(true);
      const limit = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
      const data = await getAssetUsage(assetId, limit);
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
  }, [selectedAssetId, timeRange]);

  const selectedAsset = assets.find((a) => String(a.id) === String(selectedAssetId));

  const filteredAssets = assets.filter((a) => {
    if (!siteFilter) return true;
    return a.current_site === siteFilter;
  });

  const siteList = Array.from(new Set(assets.map((a) => a.current_site).filter(Boolean)));

  const handleActionSuccess = () => {
    fetchTelematicsForAsset(selectedAssetId);
  };

  if (loading) return <LoadingSpinner message="Connecting to IoT telemetry gateway..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAssetsList} />;

  // Chart data
  const chartData = (usageData?.logs || [])
    .slice()
    .reverse()
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      'Engine Runtime': log.engine_hours,
      'Idle Time': log.idle_hours,
    }));

  const calculatedUtilization = selectedAsset?.idle_ratio ? `${(100 - selectedAsset.idle_ratio).toFixed(0)}%` : '80%';

  return (
    <div className="space-y-3 pb-6">
      {/* Header */}
      <div className="op-panel p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-sm font-semibold text-[#102A43]">
            Equipment Telematics & Live Tracking
          </h1>
          <p className="text-xs text-[#627D98]">
            Samsara-style operational monitoring: machinery location, active engine hours, idle fuel burn, and shift logs
          </p>
        </div>

        <button
          onClick={() => setUsageLogOpen(true)}
          disabled={!selectedAsset}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-[4px] bg-[#102A43] text-white text-xs font-medium hover:bg-[#0B1F33] transition disabled:opacity-50"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Log Shift Telematics
        </button>
      </div>

      {/* 1. SELECTORS STRIP */}
      <div className="op-panel p-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-[#486581] mb-1 uppercase">
            Select Equipment:
          </label>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
          >
            {filteredAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.equipment_id} — {asset.type} ({asset.current_site || 'Depot'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#486581] mb-1 uppercase">
            Filter by Job Site:
          </label>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
          >
            <option value="">All Job Sites ({siteList.length})</option>
            {siteList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#486581] mb-1 uppercase">
            Telemetry Time Horizon:
          </label>
          <div className="flex gap-1">
            {['7d', '14d', '30d'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`flex-1 py-1 text-xs font-medium rounded-[3px] transition ${
                  timeRange === r
                    ? 'bg-[#102A43] text-white'
                    : 'bg-[#F0F4F8] text-[#334E68] hover:bg-[#E2E8F0]'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SAMSARA 5-QUESTION TELEMETRY STATUS PANEL */}
      {selectedAsset && (
        <div className="op-panel p-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-[#102A43]">{selectedAsset.equipment_id}</span>
              <span className="text-xs text-[#627D98]">{selectedAsset.type}</span>
            </div>
            <StatusBadge status={selectedAsset.status} isOverdue={selectedAsset.is_overdue} />
          </div>

          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#D9E2EC] text-xs">
            <div className="px-3 py-1">
              <span className="text-[10px] text-[#627D98] font-medium uppercase block">Current Location</span>
              <span className="font-medium text-[#102A43] truncate block mt-0.5">{selectedAsset.current_site || 'Central Depot'}</span>
              <span className="text-[10px] text-[#627D98]">Stationed</span>
            </div>

            <div className="px-3 py-1">
              <span className="text-[10px] text-[#627D98] font-medium uppercase block">Engine Runtime</span>
              <span className="font-mono text-lg font-bold text-[#102A43] block mt-0.5">{usageData?.total_engine_hours ?? selectedAsset.engine_hours_per_day} hrs</span>
              <span className="text-[10px] text-[#627D98]">Avg {usageData?.average_engine_hours_per_day ?? selectedAsset.engine_hours_per_day}h / shift</span>
            </div>

            <div className="px-3 py-1">
              <span className="text-[10px] text-[#627D98] font-medium uppercase block">Idle Time</span>
              <span className="font-mono text-lg font-bold text-[#B45309] block mt-0.5">{usageData?.total_idle_hours ?? selectedAsset.idle_hours_per_day} hrs</span>
              <span className="text-[10px] text-[#627D98]">Avg {usageData?.average_idle_hours_per_day ?? selectedAsset.idle_hours_per_day}h / shift</span>
            </div>

            <div className="px-3 py-1">
              <span className="text-[10px] text-[#627D98] font-medium uppercase block">Operating Efficiency</span>
              <span className="font-mono text-lg font-bold text-[#102A43] block mt-0.5">{calculatedUtilization}</span>
              <span className="text-[10px] text-[#15803D]">Optimal Range</span>
            </div>

            <div className="px-3 py-1">
              <span className="text-[10px] text-[#627D98] font-medium uppercase block">Last Shift Activity</span>
              <span className="font-medium text-[#102A43] block mt-0.5">{selectedAsset.last_operator?.name || 'General Crew'}</span>
              <span className="text-[10px] text-[#627D98]">Active Operator</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. SHIFT RUNTIME VS IDLE CHART */}
      <div className="op-panel p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68] flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#0E7490]" />
            Runtime vs. Idle Shift Telematics ({selectedAsset?.equipment_id})
          </span>
          <span className="text-[11px] font-mono text-[#627D98]">
            Horizon: {timeRange.toUpperCase()}
          </span>
        </div>

        <div className="mt-3 h-56 w-full">
          {logsLoading ? (
            <LoadingSpinner message="Querying telemetry data stream..." />
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-[#829AB1]">
              No telemetry recorded for this unit in the selected range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" stroke="#627D98" fontSize={11} />
                <YAxis stroke="#627D98" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#102A43', borderColor: '#334E68', borderRadius: '4px', color: '#FFFFFF', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="Engine Runtime" fill="#0E7490" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Idle Time" fill="#B45309" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. TELEMATICS LOG ARCHIVE TABLE */}
      <div className="op-panel p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68] flex items-center gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#0E7490]" />
            Telematics Shift Log Archive
          </span>
          <span className="text-[11px] font-mono text-[#627D98]">
            Total Logs: {usageData?.logs?.length || 0}
          </span>
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th>Log Timestamp</th>
                <th>Equipment ID</th>
                <th>Location</th>
                <th>Engine Runtime</th>
                <th>Idle Duration</th>
                <th>Total Shift Time</th>
              </tr>
            </thead>
            <tbody>
              {(usageData?.logs || []).map((log) => (
                <tr key={log.id}>
                  <td className="text-xs text-[#102A43]">
                    {new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                    <span className="text-[#829AB1] font-mono">
                      {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="font-mono text-xs font-semibold">{log.equipment_id || selectedAsset?.equipment_id}</td>
                  <td className="text-xs text-[#334E68]">{log.location || selectedAsset?.current_site || 'Site Depot'}</td>
                  <td className="font-mono text-xs text-[#102A43]">{log.engine_hours} hrs</td>
                  <td className="font-mono text-xs text-[#B45309]">{log.idle_hours} hrs</td>
                  <td className="font-mono text-xs font-semibold text-[#102A43]">
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
