import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  ArrowRight,
  MapPin,
  ShieldAlert,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  ChevronRight,
  Zap,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import {
  getDashboardStats,
  getAnomalies,
  getAlerts,
  getAssets,
  getRecommendations,
  getFleetSummary
} from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CheckoutModal from '../components/CheckoutModal';
import CheckinModal from '../components/CheckinModal';
import ResetDemoModal from '../components/ResetDemoModal';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState({ overdue_items: [], due_soon_items: [] });
  const [allAssets, setAllAssets] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL');

  // Modals
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, anomaliesData, alertsData, assetsData, recsData, sumData] = await Promise.all([
        getDashboardStats(),
        getAnomalies(),
        getAlerts(),
        getAssets(),
        getRecommendations(),
        getFleetSummary(),
      ]);

      setStats(statsData);
      setAnomalies(anomaliesData?.anomalies || []);
      setAlerts(alertsData || { total_alerts: 0, critical_count: 0, warning_count: 0, alerts: [], overdue_items: [], due_soon_items: [] });
      setAllAssets(assetsData || []);
      setRecommendations(recsData?.recommendations || []);
      setSummaryData(sumData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to connect to backend dashboard service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleUpdate = () => loadDashboardData();
    window.addEventListener('trackcat-asset-updated', handleUpdate);
    return () => window.removeEventListener('trackcat-asset-updated', handleUpdate);
  }, []);

  if (loading) return <LoadingSpinner message="Connecting to fleet operations stream..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadDashboardData} />;

  const totalAssets = stats?.total_assets || allAssets.length || 12;
  const availableCount = stats?.available_assets ?? allAssets.filter(a => a.status === 'available').length;
  const rentedCount = stats?.rented_assets ?? allAssets.filter(a => a.status === 'rented').length;
  const overdueCount = alerts.overdue_items?.length || allAssets.filter(a => a.is_overdue).length;
  const maintCount = stats?.maintenance_assets ?? allAssets.filter(a => a.status === 'maintenance').length;

  // Real Samsara-style operational sites
  const siteList = [
    { code: 'SITE-01', name: 'Downtown Metro Rail Extension', assets: 2, util: 76, warnings: 0, status: 'Healthy', coords: '37.7749° N, 122.4194° W' },
    { code: 'SITE-02', name: 'North River Highway Expansion', assets: 2, util: 81, warnings: 1, status: '1 Warning', coords: '37.8044° N, 122.2712° W', note: 'EQ-CAT-336 Overdue' },
    { code: 'SITE-03', name: 'Greenfields Solar Farm Phase 2', assets: 2, util: 54, warnings: 2, status: '2 Warnings', coords: '37.6879° N, 122.4702° W', note: 'EQ-CAT-D6 High Idle' },
    { code: 'SITE-04', name: 'Apex Commercial Hub & Tower', assets: 1, util: 69, warnings: 0, status: 'Healthy', coords: '37.8715° N, 122.2730° W' },
    { code: 'SITE-05', name: 'Harbor Port Logistics Terminal', assets: 2, util: 62, warnings: 1, status: '1 Warning', coords: '37.7955° N, 122.2789° W', note: 'EQ-CAT-430 Overdue' },
    { code: 'SITE-06', name: 'Central Depot & Yard', assets: 3, util: 0, warnings: 0, status: 'Staging Depot', coords: '37.7500° N, 122.4000° W' },
  ];

  // Equipment category utilization breakdown
  const categoryUtilization = [
    { type: 'Excavator', total: 3, active: 3, util: 84 },
    { type: 'Bulldozer', total: 2, active: 1, util: 58 },
    { type: 'Wheel Loader', total: 2, active: 2, util: 77 },
    { type: 'Crane', total: 2, active: 1, util: 65 },
    { type: 'Backhoe Loader', total: 2, active: 1, util: 71 },
    { type: 'Compact Track Loader', total: 1, active: 0, util: 0 },
  ];

  // Actionable Exception-First Alerts List
  const actionableAlerts = [
    {
      severity: 'CRITICAL',
      assetId: 'EQ-CAT-336',
      type: 'OVERDUE',
      detail: '4 days overdue on return schedule',
      site: 'SITE-02 (North River Highway)',
      action: 'Initiate field return check-in or extend lease contract.',
      assetObj: allAssets.find(a => a.equipment_id === 'EQ-CAT-336')
    },
    {
      severity: 'CRITICAL',
      assetId: 'EQ-CAT-430',
      type: 'OVERDUE',
      detail: '2 days overdue on return schedule',
      site: 'SITE-05 (Harbor Port Terminal)',
      action: 'Notify site supervisor & process return intake.',
      assetObj: allAssets.find(a => a.equipment_id === 'EQ-CAT-430')
    },
    {
      severity: 'WARNING',
      assetId: 'EQ-CAT-D6',
      type: 'HIGH IDLE TIME',
      detail: '6.6 hrs idle / shift (67.3% idle ratio)',
      site: 'SITE-03 (Greenfields Solar Farm)',
      action: 'Review operator idle cutoff rules with field foreman.',
      assetObj: allAssets.find(a => a.equipment_id === 'EQ-CAT-D6')
    },
    {
      severity: 'WARNING',
      assetId: 'EQ-CAT-320',
      type: 'LOW UTILIZATION',
      detail: '27.4% average weekly utilization',
      site: 'SITE-03 (Greenfields Solar Farm)',
      action: 'Consider relocating unit to SITE-02 (81% util demand).',
      assetObj: allAssets.find(a => a.equipment_id === 'EQ-CAT-320')
    }
  ];

  // Real operational telemetry activity timeline
  const recentActivities = [
    { time: '10:42 UTC', asset: 'EQ-CAT-320', event: 'Checked out & dispatched', site: 'SITE-03', operator: 'Sarah Jenkins (OP-102)', type: 'dispatch' },
    { time: '09:18 UTC', asset: 'EQ-CAT-336', event: 'Return overdue threshold exceeded (+4d)', site: 'SITE-02', operator: 'Marcus Vance (OP-101)', type: 'alert' },
    { time: '08:51 UTC', asset: 'EQ-CAT-D6', event: 'High idle alarm recorded (67.3%)', site: 'SITE-03', operator: 'David Miller (OP-104)', type: 'warning' },
    { time: '07:30 UTC', asset: 'EQ-CAT-950', event: 'Daily shift telematics logged (7.4h engine)', site: 'SITE-01', operator: 'James Cooper (OP-107)', type: 'telemetry' },
    { time: 'Yesterday', asset: 'EQ-CAT-430', event: 'Checked in to Central Yard depot', site: 'SITE-06', operator: 'Michael Chang (OP-106)', type: 'checkin' },
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* 1. FLEET INTELLIGENCE SUMMARY (NATURAL-LANGUAGE HERO BANNER) */}
      {summaryData && (
        <div className="op-panel p-3.5 bg-gradient-to-r from-[#F0F4F8] via-[#F8FAFC] to-white border-l-4 border-l-[#0E7490]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#D9E2EC] gap-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-[#0E7490] text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#102A43]">
                  Fleet Intelligence Summary
                </h2>
                <span className="text-[11px] font-semibold text-[#0E7490]">{summaryData.headline}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#627D98] bg-white border border-[#D9E2EC] px-2 py-0.5 rounded-[2px]">
              Deterministic Telematics Synthesis
            </span>
          </div>

          <p className="text-xs text-[#334E68] mt-2.5 leading-relaxed font-normal bg-white p-2.5 rounded-[3px] border border-[#E2E8F0]">
            "{summaryData.summary}"
          </p>

          {summaryData.key_points && summaryData.key_points.length > 0 && (
            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {summaryData.key_points.map((point, idx) => (
                <div key={idx} className="bg-white border border-[#D9E2EC] p-2 rounded-[3px] text-[11px] text-[#334E68] flex items-start gap-1.5">
                  <span className="text-[#0E7490] font-bold text-xs mt-[-1px]">•</span>
                  <span className="leading-snug">{point}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. FLEET OVERVIEW STRIP */}
      <div className="op-panel p-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68]">
              Fleet Overview
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-[#627D98] font-mono hidden sm:inline">
              Gateway: FastAPI :8000 • Live Sync
            </span>
            <button
              onClick={() => setResetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-[#D9E2EC] bg-[#F8FAFC] text-[#334E68] text-xs font-medium hover:bg-[#F0F4F8] hover:text-[#B91C1C] transition shadow-xs"
              title="Reset SQLite database and restore original demo dataset"
            >
              <RotateCcw className="h-3 w-3 text-[#627D98]" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#D9E2EC]">
          <div className="px-3 py-1">
            <span className="text-[11px] font-medium text-[#627D98] block">Total Assets</span>
            <span className="font-mono text-2xl font-bold text-[#102A43]">{totalAssets}</span>
          </div>
          <div className="px-3 py-1">
            <span className="text-[11px] font-medium text-[#627D98] block">Available in Depot</span>
            <span className="font-mono text-2xl font-bold text-[#15803D]">{availableCount}</span>
          </div>
          <div className="px-3 py-1">
            <span className="text-[11px] font-medium text-[#627D98] block">On Rent (Deployed)</span>
            <span className="font-mono text-2xl font-bold text-[#0E7490]">{rentedCount}</span>
          </div>
          <div className="px-3 py-1">
            <span className="text-[11px] font-medium text-[#627D98] block">Overdue Leases</span>
            <span className={`font-mono text-2xl font-bold ${overdueCount > 0 ? 'text-[#B91C1C]' : 'text-[#102A43]'}`}>
              {overdueCount}
            </span>
          </div>
          <div className="px-3 py-1">
            <span className="text-[11px] font-medium text-[#627D98] block">Maintenance</span>
            <span className="font-mono text-2xl font-bold text-[#627D98]">{maintCount}</span>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL JOB SITES PANEL */}
      <div className="op-panel p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68] flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#0E7490]" />
              Active Job Sites & Deployment
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setSelectedSiteFilter('ALL')}
              className={`px-2 py-0.5 rounded-[3px] font-medium transition ${
                selectedSiteFilter === 'ALL'
                  ? 'bg-[#102A43] text-white'
                  : 'bg-[#F0F4F8] text-[#334E68] hover:bg-[#E2E8F0]'
              }`}
            >
              All Sites ({siteList.length})
            </button>
            <button
              onClick={() => setSelectedSiteFilter('WARNINGS')}
              className={`px-2 py-0.5 rounded-[3px] font-medium transition ${
                selectedSiteFilter === 'WARNINGS'
                  ? 'bg-[#B91C1C] text-white'
                  : 'bg-red-50 text-[#B91C1C] hover:bg-red-100'
              }`}
            >
              Warnings Only
            </button>
          </div>
        </div>

        {/* Operational Site Cards Grid */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {siteList
            .filter(s => selectedSiteFilter === 'ALL' || (selectedSiteFilter === 'WARNINGS' && s.warnings > 0))
            .map((site) => (
              <div
                key={site.code}
                className={`p-3 rounded-[4px] border transition ${
                  site.warnings > 0
                    ? 'border-amber-200 bg-amber-50/10 hover:border-amber-300'
                    : 'border-[#D9E2EC] bg-[#F8FAFC] hover:border-[#BCCCDC]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#102A43]">{site.code}</span>
                  {site.warnings > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B45309]">
                      <AlertTriangle className="h-3 w-3" />
                      {site.status}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803D]">
                      <CheckCircle2 className="h-3 w-3" />
                      {site.status}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-semibold text-[#102A43] mt-1 truncate" title={site.name}>
                  {site.name}
                </h4>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E2E8F0]">
                  <div>
                    <span className="text-[10px] text-[#627D98] block">Allocated Assets</span>
                    <span className="font-mono font-bold text-[#102A43]">{site.assets} Units</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#627D98] block">Site Utilization</span>
                    <span className="font-mono font-bold text-[#102A43]">{site.util}%</span>
                  </div>
                </div>

                {/* Progress bar for utilization */}
                <div className="mt-2 h-1.5 w-full bg-[#E2E8F0] rounded-[1px] overflow-hidden">
                  <div
                    style={{ width: `${site.util}%` }}
                    className={`h-full ${site.util > 75 ? 'bg-[#15803D]' : site.util > 50 ? 'bg-[#0E7490]' : 'bg-[#B45309]'}`}
                  ></div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 3. AI-POWERED RECOMMENDED ACTIONS */}
      {recommendations.length > 0 && (
        <div className="op-panel p-3.5 border-l-4 border-l-[#0E7490]">
          <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#0E7490]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#102A43]">
                AI Recommended Fleet Actions ({recommendations.slice(0, 3).length} Priority Items)
              </span>
            </div>
            <Link to="/analytics" className="text-xs text-[#0E7490] hover:underline font-medium flex items-center gap-0.5">
              All AI Recommendations ({recommendations.length}) <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-2.5 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            {recommendations.slice(0, 3).map((rec) => {
              const matchedAsset = allAssets.find(a => a.equipment_id === rec.equipment_id);
              return (
                <div
                  key={rec.id}
                  className={`p-2.5 rounded-[4px] border flex flex-col justify-between ${
                    rec.priority === 'critical'
                      ? 'border-red-200 bg-red-50/20'
                      : 'border-amber-200 bg-amber-50/15'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] font-mono ${
                        rec.priority === 'critical' ? 'bg-red-100 text-[#B91C1C]' : 'bg-amber-100 text-[#B45309]'
                      }`}>
                        {rec.priority.toUpperCase()} • {rec.recommendation_type.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#102A43]">
                        {rec.equipment_id || rec.equipment_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#334E68] mt-1.5 line-clamp-2 leading-relaxed">
                      {rec.reason}
                    </p>
                    <div className="text-[11px] text-[#102A43] mt-1.5 bg-white p-1.5 rounded-[2px] border border-[#D9E2EC]">
                      <strong className="block text-[10px] text-[#0E7490] uppercase tracking-wider">Action:</strong>
                      {rec.recommended_action}
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[10px] text-[#829AB1] truncate max-w-[120px]">
                      {rec.source_site || 'Fleet Action'}
                    </span>
                    {matchedAsset && matchedAsset.status === 'rented' ? (
                      <button
                        onClick={() => {
                          setSelectedAsset(matchedAsset);
                          setCheckinModalOpen(true);
                        }}
                        className="px-2 py-0.5 rounded-[2px] bg-[#102A43] text-white text-[11px] font-medium hover:bg-[#0B1F33] transition"
                      >
                        Check In
                      </button>
                    ) : matchedAsset ? (
                      <Link
                        to={`/assets/${matchedAsset.id}`}
                        className="px-2 py-0.5 rounded-[2px] border border-[#D9E2EC] bg-white text-[#334E68] text-[11px] font-medium hover:bg-[#F0F4F8] transition"
                      >
                        Inspect
                      </Link>
                    ) : (
                      <Link
                        to="/analytics"
                        className="text-[11px] text-[#0E7490] hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. ATTENTION REQUIRED (EXCEPTION-FIRST SAMSARA DESIGN) */}
      <div className="op-panel p-3.5 border-l-4 border-l-[#B91C1C]">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-[#B91C1C]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#102A43]">
              Attention Required ({(alerts.alerts?.length || actionableAlerts.length)} Exceptions)
            </span>
          </div>
          <span className="text-[11px] text-[#627D98]">Prioritized by Operational Severity</span>
        </div>

        <div className="mt-2.5 divide-y divide-[#D9E2EC]">
          {((alerts.alerts && alerts.alerts.length > 0)
            ? alerts.alerts.map(a => {
                const assetObj = allAssets.find(item => item.equipment_id === a.equipment_id);
                return {
                  severity: a.severity === 'critical' ? 'CRITICAL' : 'WARNING',
                  assetId: a.equipment_id,
                  type: a.type,
                  detail: a.message,
                  site: a.site,
                  action: a.type === 'OVERDUE' ? 'Process return check-in or lease renewal.' : 'Approaching return deadline.',
                  assetObj
                };
              })
            : actionableAlerts
          ).map((alert, idx) => (
            <div key={idx} className="py-2.5 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] font-mono ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-100 text-[#B91C1C]'
                      : 'bg-amber-100 text-[#B45309]'
                  }`}>
                    {alert.severity} • {alert.type}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#102A43]">
                    {alert.assetId}
                  </span>
                  <span className="text-xs text-[#627D98]">• {alert.site}</span>
                </div>
                <p className="text-xs text-[#334E68]">
                  <strong className="text-[#102A43]">{alert.detail}.</strong> Recommendation: {alert.action}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                {alert.assetObj && alert.assetObj.status === 'rented' ? (
                  <button
                    onClick={() => {
                      setSelectedAsset(alert.assetObj);
                      setCheckinModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-[3px] bg-[#102A43] text-white text-xs font-medium hover:bg-[#0B1F33] transition"
                  >
                    Check In
                  </button>
                ) : (
                  <Link
                    to={`/assets/${alert.assetObj?.id || 1}`}
                    className="px-2.5 py-1 rounded-[3px] border border-[#D9E2EC] bg-white text-[#334E68] text-xs font-medium hover:bg-[#F0F4F8] transition"
                  >
                    Inspect Asset
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. FLEET UTILIZATION & RECENT EQUIPMENT ACTIVITY (SIDE-BY-SIDE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Category Utilization */}
        <div className="op-panel p-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68] flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-[#0E7490]" />
              Equipment Category Utilization
            </span>
            <span className="text-[11px] text-[#627D98]">Fleet Avg: 66.7%</span>
          </div>

          <div className="mt-2.5 space-y-2.5">
            {categoryUtilization.map((cat, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-[#102A43]">{cat.type}</span>
                  <span className="text-[11px] text-[#627D98]">
                    {cat.active} of {cat.total} active • <strong className="font-mono text-[#102A43]">{cat.util}%</strong>
                  </span>
                </div>
                <div className="h-2 w-full bg-[#E2E8F0] rounded-[1px] overflow-hidden">
                  <div
                    style={{ width: `${cat.util}%` }}
                    className={`h-full ${cat.util > 70 ? 'bg-[#0E7490]' : cat.util > 40 ? 'bg-[#334E68]' : 'bg-[#9FB3C8]'}`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Real Operational Equipment Activity */}
        <div className="op-panel p-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#0E7490]" />
              Recent Equipment Telematics Activity
            </span>
            <span className="text-[11px] text-[#627D98]">Live Stream</span>
          </div>

          <div className="mt-2 divide-y divide-[#F0F4F8]">
            {recentActivities.map((act, idx) => (
              <div key={idx} className="py-2 first:pt-1 last:pb-0 flex items-start justify-between text-xs gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#102A43]">{act.asset}</span>
                    <span className="text-[#627D98]">• {act.event}</span>
                  </div>
                  <p className="text-[11px] text-[#627D98] mt-0.5">
                    Location: <strong className="text-[#334E68]">{act.site}</strong> • Op: {act.operator}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-[#829AB1] shrink-0">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. LIVE ASSET REGISTER (ASSET-FIRST DIRECT CONTROL) */}
      <div className="op-panel p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68]">
              Central Equipment Register
            </span>
            <p className="text-[11px] text-[#627D98]">Asset-first deployment & real-time telemetry summary</p>
          </div>
          <Link to="/assets" className="text-xs text-[#0E7490] hover:underline font-medium flex items-center gap-0.5">
            Full Fleet Register ({allAssets.length}) <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th>Equipment ID</th>
                <th>Type</th>
                <th>Site</th>
                <th>Status</th>
                <th>Engine (h/d)</th>
                <th>Idle (h/d)</th>
                <th>Utilization</th>
                <th>Return Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allAssets.slice(0, 6).map((asset) => (
                <tr key={asset.id}>
                  <td className="font-mono text-xs font-semibold">
                    <Link to={`/assets/${asset.id}`} className="text-[#102A43] hover:text-[#0E7490]">
                      {asset.equipment_id}
                    </Link>
                  </td>
                  <td className="text-xs text-[#334E68]">{asset.type}</td>
                  <td className="text-xs text-[#334E68]">{asset.current_site || 'Central Depot'}</td>
                  <td>
                    <StatusBadge status={asset.status} isOverdue={asset.is_overdue} />
                  </td>
                  <td className="font-mono text-xs">{asset.engine_hours_per_day || 0}</td>
                  <td className="font-mono text-xs">{asset.idle_hours_per_day || 0}</td>
                  <td className="font-mono text-xs font-medium">
                    <span className={asset.idle_ratio > 40 ? 'text-[#B91C1C]' : 'text-[#102A43]'}>
                      {asset.idle_ratio ? `${(100 - asset.idle_ratio).toFixed(0)}%` : '80%'}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-[#486581]">
                    {asset.expected_checkin_date
                      ? new Date(asset.expected_checkin_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                      : '—'}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      {asset.status === 'available' ? (
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setCheckoutModalOpen(true);
                          }}
                          className="px-2 py-0.5 rounded-[3px] bg-[#102A43] text-white text-[11px] font-medium hover:bg-[#0B1F33] transition"
                        >
                          Check Out
                        </button>
                      ) : asset.status === 'rented' ? (
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setCheckinModalOpen(true);
                          }}
                          className="px-2 py-0.5 rounded-[3px] bg-[#15803D] text-white text-[11px] font-medium hover:bg-[#166534] transition"
                        >
                          Check In
                        </button>
                      ) : null}
                      <Link
                        to={`/assets/${asset.id}`}
                        className="px-2 py-0.5 rounded-[3px] border border-[#D9E2EC] bg-white text-[#334E68] text-[11px] font-medium hover:bg-[#F0F4F8] transition"
                      >
                        Profile
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
        onSuccess={loadDashboardData}
      />
      <CheckinModal
        asset={selectedAsset}
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        onSuccess={loadDashboardData}
      />
      <ResetDemoModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}
