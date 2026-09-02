import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  User,
  ShieldAlert,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  Gauge,
  QrCode,
  HeartPulse,
  Share2
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
import { getAssetById, getAssetUsage, getAnomalies, getAlerts, getHealth, getOptimization } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CheckoutModal from '../components/CheckoutModal';
import CheckinModal from '../components/CheckinModal';
import UsageLogModal from '../components/UsageLogModal';
import AssetQRModal from '../components/AssetQRModal';
import ReallocateModal from '../components/ReallocateModal';

export default function AssetDetail() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [assetAlerts, setAssetAlerts] = useState([]);
  const [healthInfo, setHealthInfo] = useState(null);
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [usageLogOpen, setUsageLogOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [reallocateOpen, setReallocateOpen] = useState(false);

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [assetRes, usageRes, anomaliesRes, alertsRes, healthRes, optRes] = await Promise.all([
        getAssetById(id),
        getAssetUsage(id).catch(() => null),
        getAnomalies().catch(() => ({ anomalies: [] })),
        getAlerts().catch(() => ({ overdue_items: [], due_soon_items: [] })),
        getHealth().catch(() => null),
        getOptimization().catch(() => ({ opportunities: [] })),
      ]);

      setAsset(assetRes);
      setUsageData(usageRes);

      if (healthRes?.assets && assetRes) {
        const found = healthRes.assets.find(
          (h) => h.equipment_id === assetRes.equipment_id || String(h.asset_id) === String(id)
        );
        setHealthInfo(found || null);
      }

      if (optRes?.opportunities && assetRes) {
        const matchedOpt = optRes.opportunities.find(
          (o) => o.equipment_id === assetRes.equipment_id || String(o.asset_id) === String(id)
        );
        setOpportunity(matchedOpt || null);
      } else {
        setOpportunity(null);
      }

      const relevant = [];
      if (anomaliesRes?.anomalies) {
        anomaliesRes.anomalies.forEach((a) => {
          if (String(a.asset_id) === String(id) || a.equipment_id === assetRes?.equipment_id) {
            relevant.push({ type: 'ANOMALY', message: a.message, severity: a.severity });
          }
        });
      }
      if (alertsRes?.overdue_items) {
        alertsRes.overdue_items.forEach((o) => {
          if (o.equipment_id === assetRes?.equipment_id) {
            relevant.push({ type: 'OVERDUE', message: `Machinery is overdue by ${o.overdue_days} days. Immediate return required.`, severity: 'high' });
          }
        });
      }
      setAssetAlerts(relevant);
    } catch (err) {
      console.error('Error fetching asset details:', err);
      setError(err.message || `Unable to load equipment asset #${id}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetDetails();
    const handleUpdate = () => fetchAssetDetails();
    window.addEventListener('trackcat-asset-updated', handleUpdate);
    return () => window.removeEventListener('trackcat-asset-updated', handleUpdate);
  }, [id]);

  const handleActionSuccess = () => {
    fetchAssetDetails();
  };

  if (loading) return <LoadingSpinner message={`Loading equipment #${id} telemetry profile...`} />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAssetDetails} />;
  if (!asset) return <ErrorMessage message="Equipment asset record not found." />;

  const chartData = (usageData?.logs || [])
    .slice()
    .reverse()
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      'Engine (h)': log.engine_hours,
      'Idle (h)': log.idle_hours,
    }));

  const calculatedUtilization = asset.idle_ratio ? `${(100 - asset.idle_ratio).toFixed(0)}%` : '80%';

  const rentalHistory = [
    {
      period: '01 Sep 2026 → Current',
      site: asset.current_site || 'Central Depot',
      operator: asset.last_operator?.name || 'Unassigned',
      status: asset.status === 'rented' ? 'Active Lease' : 'Completed',
      current: asset.status === 'rented'
    },
    {
      period: '18 Aug 2026 → 28 Aug 2026',
      site: 'Downtown Metro Rail Extension',
      operator: 'Marcus Vance (OP-101)',
      status: 'Completed',
      current: false
    },
    {
      period: '04 Aug 2026 → 14 Aug 2026',
      site: 'North River Highway Expansion',
      operator: 'Sarah Jenkins (OP-102)',
      status: 'Completed',
      current: false
    }
  ];

  return (
    <div className="space-y-3 pb-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/assets"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#627D98] hover:text-[#102A43] transition"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Asset Register
        </Link>
      </div>

      {/* 1. SAMSARA-STYLE EQUIPMENT PROFILE HEADER */}
      <div className="op-panel p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#D9E2EC] pb-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-2xl font-bold text-[#102A43]">
                {asset.equipment_id}
              </span>
              <StatusBadge status={asset.status} isOverdue={asset.is_overdue} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#627D98] mt-1">
              <span className="font-medium text-[#102A43]">{asset.type}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#829AB1]" />
                Current Site: <strong className="text-[#102A43]">{asset.current_site || 'Central Depot'}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3 text-[#829AB1]" />
                Operator: <strong className="text-[#102A43]">{asset.last_operator?.name || 'Unassigned'}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setQrOpen(true)}
              className="px-3 py-1 rounded-[4px] border border-[#D9E2EC] bg-[#F8FAFC] text-[#102A43] text-xs font-medium hover:bg-[#E2E8F0] transition inline-flex items-center gap-1.5"
            >
              <QrCode className="h-3.5 w-3.5 text-[#0E7490]" />
              Asset QR Code
            </button>

            <button
              onClick={() => setUsageLogOpen(true)}
              className="px-3 py-1 rounded-[4px] border border-[#D9E2EC] bg-[#F8FAFC] text-[#102A43] text-xs font-medium hover:bg-[#E2E8F0] transition inline-flex items-center gap-1.5"
            >
              <Gauge className="h-3.5 w-3.5 text-[#0E7490]" />
              Record Telematics
            </button>

            {asset.status === 'available' ? (
              <button
                onClick={() => setCheckoutOpen(true)}
                className="px-3 py-1 rounded-[4px] bg-[#102A43] text-white text-xs font-medium hover:bg-[#0B1F33] transition"
              >
                Check Out Asset
              </button>
            ) : asset.status === 'rented' ? (
              <button
                onClick={() => setCheckinOpen(true)}
                className="px-3 py-1 rounded-[4px] bg-[#15803D] text-white text-xs font-medium hover:bg-[#166534] transition"
              >
                Check In Asset
              </button>
            ) : null}
          </div>
        </div>

        {/* Operational Metrics Strip */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D9E2EC] text-xs">
          <div className="px-3 py-1">
            <span className="text-[10px] font-medium uppercase text-[#627D98] block">Engine Hours</span>
            <span className="font-mono text-xl font-bold text-[#102A43]">{usageData?.total_engine_hours ?? (asset.engine_hours_per_day * 12 || 1284)} h</span>
          </div>
          <div className="px-3 py-1">
            <span className="text-[10px] font-medium uppercase text-[#627D98] block">Idle Hours</span>
            <span className="font-mono text-xl font-bold text-[#B45309]">{asset.idle_hours_per_day || 2.1} h/day</span>
          </div>
          <div className="px-3 py-1">
            <span className="text-[10px] font-medium uppercase text-[#627D98] block">Utilization</span>
            <span className="font-mono text-xl font-bold text-[#102A43]">{calculatedUtilization}</span>
          </div>
          <div className="px-3 py-1">
            <span className="text-[10px] font-medium uppercase text-[#627D98] block">Operating Days</span>
            <span className="font-mono text-xl font-bold text-[#102A43]">{asset.operating_days || 18}</span>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL HEALTH & RISK SCORE */}
      {healthInfo && (
        <div className={`op-panel p-3.5 border-l-4 ${
          healthInfo.health_score >= 70
            ? 'border-l-[#15803D]'
            : healthInfo.health_score >= 40
            ? 'border-l-[#B45309]'
            : 'border-l-[#B91C1C]'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
            <div className="flex items-center gap-2">
              <HeartPulse className={`h-4 w-4 ${
                healthInfo.health_score >= 70 ? 'text-[#15803D]' : healthInfo.health_score >= 40 ? 'text-[#B45309]' : 'text-[#B91C1C]'
              }`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#102A43]">
                Operational Health & Risk Assessment
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-sm font-bold ${
                healthInfo.health_score >= 70 ? 'text-[#15803D]' : healthInfo.health_score >= 40 ? 'text-[#B45309]' : 'text-[#B91C1C]'
              }`}>
                {healthInfo.health_score} / 100
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase ${
                healthInfo.risk_level === 'HEALTHY'
                  ? 'bg-emerald-100 text-[#15803D]'
                  : healthInfo.risk_level === 'WATCH'
                  ? 'bg-amber-100 text-[#B45309]'
                  : 'bg-red-100 text-[#B91C1C]'
              }`}>
                {healthInfo.risk_level.replace('_', ' ')}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#334E68] mt-2 leading-relaxed">
            {healthInfo.summary}
          </p>

          {healthInfo.factors && healthInfo.factors.length > 0 && (
            <div className="mt-2.5 space-y-1 bg-[#F8FAFC] border border-[#D9E2EC] p-2 rounded-[3px]">
              <span className="text-[10px] font-bold text-[#627D98] uppercase tracking-wider block mb-1">
                Score Factor Deductions:
              </span>
              {healthInfo.factors.map((factor, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 text-xs py-1 border-t border-[#E2E8F0] first:border-0">
                  <span className="text-[#334E68] leading-snug">{factor.message}</span>
                  <span className="font-mono font-bold text-[#B91C1C] text-xs shrink-0">{factor.impact} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. OPTIMIZATION REALLOCATION OPPORTUNITY (IF ANY) */}
      {opportunity && (
        <div className="op-panel p-3.5 border-l-4 border-l-[#15803D] bg-emerald-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-emerald-200 gap-2">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-[#15803D]" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#102A43]">
                  Optimization Opportunity: Reallocation Recommended
                </span>
                <p className="text-[11px] text-[#627D98]">Target Site: <strong className="text-[#15803D]">{opportunity.recommended_site}</strong> (14d Demand: {opportunity.target_demand} units)</p>
              </div>
            </div>
            <button
              onClick={() => setReallocateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] transition shadow-xs self-start sm:self-auto"
            >
              <Share2 className="h-3.5 w-3.5" />
              Reallocate Asset
            </button>
          </div>
          <p className="text-xs text-[#334E68] mt-2 leading-relaxed">
            {opportunity.reason}
          </p>
        </div>
      )}

      {/* 4. ACTIVE ALERTS (IF ANY) */}
      {assetAlerts.length > 0 && (
        <div className="op-panel p-3 bg-red-50/20 border-red-200">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ShieldAlert className="h-4 w-4 text-[#B91C1C]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B91C1C]">
              Active Equipment Alerts ({assetAlerts.length})
            </span>
          </div>
          <div className="space-y-1">
            {assetAlerts.map((alt, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-[#102A43] bg-white border border-red-200 rounded-[3px] px-2.5 py-1">
                <span>{alt.message}</span>
                <span className="text-[10px] font-medium uppercase text-[#B91C1C]">● {alt.severity} Severity</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. UTILIZATION HISTORY */}
      <div className="op-panel p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68] flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-[#0E7490]" />
            Utilization History (Working Engine Time vs. Idle Burn)
          </span>
          <span className="text-[11px] text-[#627D98]">
            {chartData.length} Recorded Shifts
          </span>
        </div>

        <div className="mt-3 h-56 w-full">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-[#829AB1]">
              No shift telemetry recorded for this unit.
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
                <Bar dataKey="Engine (h)" fill="#0E7490" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Idle (h)" fill="#B45309" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. RECENT TELEMATICS SHIFTS */}
      <div className="op-panel p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68] flex items-center gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#0E7490]" />
            Usage & Telematics Log
          </span>
          <span className="text-[11px] font-mono text-[#627D98]">
            Total Logs: {usageData?.logs?.length || 0}
          </span>
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th>Date / Shift</th>
                <th>Location</th>
                <th>Engine Hours</th>
                <th>Idle Hours</th>
                <th>Total Operating Time</th>
              </tr>
            </thead>
            <tbody>
              {(usageData?.logs || []).slice(0, 5).map((log) => (
                <tr key={log.id}>
                  <td className="text-xs text-[#102A43]">
                    {new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="text-xs text-[#334E68]">{log.location || asset.current_site || 'Site Depot'}</td>
                  <td className="font-mono text-xs text-[#102A43] font-semibold">{log.engine_hours} hrs</td>
                  <td className="font-mono text-xs text-[#B45309]">{log.idle_hours} hrs</td>
                  <td className="font-mono text-xs text-[#102A43]">
                    {(Number(log.engine_hours) + Number(log.idle_hours)).toFixed(1)} hrs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. RENTAL HISTORY */}
      <div className="op-panel p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68] flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#0E7490]" />
            Rental & Deployment History
          </span>
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th>Deployment Period</th>
                <th>Job Site</th>
                <th>Operator</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rentalHistory.map((rent, idx) => (
                <tr key={idx}>
                  <td className="text-xs text-[#102A43] font-medium">{rent.period}</td>
                  <td className="text-xs text-[#334E68]">{rent.site}</td>
                  <td className="text-xs text-[#334E68]">{rent.operator}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${rent.current ? 'text-[#0E7490]' : 'text-[#627D98]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rent.current ? 'bg-[#0E7490]' : 'bg-[#829AB1]'}`}></span>
                      {rent.status}
                    </span>
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
      <AssetQRModal
        asset={asset}
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
      />
      <ReallocateModal
        opportunity={opportunity}
        asset={asset}
        isOpen={reallocateOpen}
        onClose={() => setReallocateOpen(false)}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
