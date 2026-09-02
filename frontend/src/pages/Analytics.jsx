import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  Activity,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
  RotateCcw,
  Truck,
  AlertTriangle,
  Layers,
  ChevronRight,
  HeartPulse,
  Share2,
  Gauge
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
import {
  getForecast,
  getAnomalies,
  getRecommendations,
  getOptimization,
  getHealth,
  getDashboardStats,
  getFleetUsageSummary,
  getAssets
} from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CheckinModal from '../components/CheckinModal';
import CheckoutModal from '../components/CheckoutModal';
import ReallocateModal from '../components/ReallocateModal';

export default function Analytics() {
  const [forecastData, setForecastData] = useState(null);
  const [anomalyData, setAnomalyData] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [stats, setStats] = useState(null);
  const [allAssets, setAllAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [recTypeFilter, setRecTypeFilter] = useState('ALL');
  const [healthRiskFilter, setHealthRiskFilter] = useState('ALL');

  // Modals
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reallocateOpen, setReallocateOpen] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [forecastRes, anomalyRes, recRes, optRes, healthRes, statsRes, assetsRes] = await Promise.all([
        getForecast(),
        getAnomalies(),
        getRecommendations(),
        getOptimization(),
        getHealth(),
        getDashboardStats(),
        getAssets(),
      ]);
      setForecastData(forecastRes);
      setAnomalyData(anomalyRes);
      setRecommendationsData(recRes);
      setOptimizationData(optRes);
      setHealthData(healthRes);
      setStats(statsRes);
      setAllAssets(assetsRes || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Unable to retrieve fleet analytics intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const handleUpdate = () => fetchAnalytics();
    window.addEventListener('trackcat-asset-updated', handleUpdate);
    return () => window.removeEventListener('trackcat-asset-updated', handleUpdate);
  }, []);

  if (loading) return <LoadingSpinner message="Synthesizing anomaly detection, demand forecasts, and AI recommendations..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAnalytics} />;

  // Chart data for Demand Forecast
  const demandChartData = (forecastData?.forecasts || []).map((f) => ({
    name: f.equipment_type.replace('Hydraulic ', '').replace('Compact Track ', 'CTL ').replace('Rough Terrain ', 'RT '),
    'Current Demand': f.current_demand,
    '7-Day Forecast': f.projected_demand_next_7d ?? f.forecast_demand,
    '14-Day Forecast': f.projected_demand_next_14d ?? (f.forecast_demand + 1),
    '30-Day Forecast': f.projected_demand_next_30d ?? (f.forecast_demand + 2),
  }));

  const rawAnomalies = anomalyData?.anomalies || [];
  const filteredAnomalies = rawAnomalies.filter((a) => {
    if (!severityFilter) return true;
    return a.severity.toLowerCase() === severityFilter.toLowerCase();
  });

  const rawRecommendations = recommendationsData?.recommendations || [];
  const filteredRecommendations = rawRecommendations.filter((r) => {
    if (recTypeFilter === 'ALL') return true;
    return r.recommendation_type === recTypeFilter;
  });

  const rawHealthAssets = healthData?.assets || [];
  const filteredHealthAssets = rawHealthAssets.filter((h) => {
    if (healthRiskFilter === 'ALL') return true;
    return h.risk_level === healthRiskFilter;
  });

  const opportunities = optimizationData?.opportunities || [];

  // Site Performance Rows
  const sitePerformance = [
    { site: 'Downtown Metro Rail Extension', assets: 2, engineH: '110.5h', idleH: '25.4h', idlePct: '18.7%', fuelBurn: '490 gal', health: 'Optimal', healthColor: 'green' },
    { site: 'North River Highway Expansion', assets: 2, engineH: '155.2h', idleH: '32.0h', idlePct: '17.1%', fuelBurn: '710 gal', health: 'Overdue Alert', healthColor: 'red' },
    { site: 'Greenfields Solar Farm Phase 2', assets: 1, engineH: '26.4h', idleH: '54.2h', idlePct: '67.3%', fuelBurn: '212 gal', health: 'Idle Warning', healthColor: 'amber' },
    { site: 'Apex Commercial Hub & Tower', assets: 1, engineH: '18.5h', idleH: '8.2h', idlePct: '30.7%', fuelBurn: '85 gal', health: 'Optimal', healthColor: 'green' },
    { site: 'Harbor Port Logistics Terminal', assets: 2, engineH: '68.5h', idleH: '48.0h', idlePct: '41.2%', fuelBurn: '360 gal', health: 'Overdue Alert', healthColor: 'red' },
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* Page Header */}
      <div className="op-panel p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-[#102A43]">
              Fleet Intelligence & AI Analytics
            </h1>
            <span className="bg-[#E0F2FE] text-[#0369A1] text-[10px] font-bold px-2 py-0.5 rounded-[3px] border border-[#BAE6FD]">
              Explainable AI Layer
            </span>
          </div>
          <p className="text-xs text-[#627D98] mt-0.5">
            Connected pipeline: <strong>Operational Data</strong> → <strong>Rule-Based Anomalies</strong> + <strong>Statistical Forecasts</strong> → <strong>Optimization & Health</strong> → <strong>AI Recommendations</strong> → <strong>Action</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono bg-[#F8FAFC] border border-[#D9E2EC] px-2.5 py-1 rounded-[3px] text-[#486581]">
            Deterministic Decision Engine
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. AI-POWERED RECOMMENDATIONS (TOP STRATEGIC LAYER)                      */}
      {/* ========================================================================= */}
      <div className="op-panel p-3.5 border-l-4 border-l-[#0E7490]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#D9E2EC] gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-[#0E7490] text-white">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#102A43]">
                1. AI-Assisted Fleet Recommendations ({filteredRecommendations.length} Actions)
              </span>
              <p className="text-[11px] text-[#627D98]">Synthesized from live telematics anomalies and 14-day demand forecast signals</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 text-[11px] flex-wrap">
            <button
              onClick={() => setRecTypeFilter('ALL')}
              className={`px-2 py-0.5 rounded-[3px] font-medium transition ${
                recTypeFilter === 'ALL' ? 'bg-[#102A43] text-white' : 'bg-[#F0F4F8] text-[#334E68] hover:bg-[#E2E8F0]'
              }`}
            >
              All ({rawRecommendations.length})
            </button>
            <button
              onClick={() => setRecTypeFilter('RETURN')}
              className={`px-2 py-0.5 rounded-[3px] font-medium transition ${
                recTypeFilter === 'RETURN' ? 'bg-[#B91C1C] text-white' : 'bg-red-50 text-[#B91C1C] hover:bg-red-100'
              }`}
            >
              Returns
            </button>
            <button
              onClick={() => setRecTypeFilter('REALLOCATE')}
              className={`px-2 py-0.5 rounded-[3px] font-medium transition ${
                recTypeFilter === 'REALLOCATE' ? 'bg-[#0E7490] text-white' : 'bg-cyan-50 text-[#0E7490] hover:bg-cyan-100'
              }`}
            >
              Reallocate
            </button>
            <button
              onClick={() => setRecTypeFilter('INVESTIGATE_IDLE')}
              className={`px-2 py-0.5 rounded-[3px] font-medium transition ${
                recTypeFilter === 'INVESTIGATE_IDLE' ? 'bg-[#B45309] text-white' : 'bg-amber-50 text-[#B45309] hover:bg-amber-100'
              }`}
            >
              Idle Audits
            </button>
            <button
              onClick={() => setRecTypeFilter('PRE_POSITION')}
              className={`px-2 py-0.5 rounded-[3px] font-medium transition ${
                recTypeFilter === 'PRE_POSITION' ? 'bg-[#15803D] text-white' : 'bg-emerald-50 text-[#15803D] hover:bg-emerald-100'
              }`}
            >
              Pre-Position
            </button>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredRecommendations.length === 0 ? (
            <div className="col-span-2 py-6 text-center text-xs text-[#627D98] bg-[#F8FAFC] rounded-[4px] border border-[#D9E2EC]">
              Fleet operating within expected parameters for this category.
            </div>
          ) : (
            filteredRecommendations.map((rec) => {
              const matchedAsset = allAssets.find(a => a.equipment_id === rec.equipment_id);
              return (
                <div
                  key={rec.id}
                  className={`p-3 rounded-[4px] border flex flex-col justify-between transition ${
                    rec.priority === 'critical'
                      ? 'border-red-200 bg-red-50/20'
                      : rec.priority === 'high'
                      ? 'border-amber-200 bg-amber-50/15'
                      : 'border-[#D9E2EC] bg-[#F8FAFC]'
                  }`}
                >
                  <div>
                    {/* Top: Badges and Target */}
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E2E8F0]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] font-mono ${
                          rec.priority === 'critical'
                            ? 'bg-red-100 text-[#B91C1C]'
                            : rec.priority === 'high'
                            ? 'bg-amber-100 text-[#B45309]'
                            : 'bg-slate-100 text-[#334E68]'
                        }`}>
                          {rec.priority.toUpperCase()} PRIORITY
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] bg-white border border-[#D9E2EC] text-[#102A43] font-mono">
                          {rec.recommendation_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {rec.equipment_id ? (
                        <span className="font-mono text-xs font-bold text-[#102A43]">
                          {rec.equipment_id}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#0E7490]">
                          {rec.equipment_type}
                        </span>
                      )}
                    </div>

                    {/* Site Route if applicable */}
                    {(rec.source_site || rec.target_site) && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-[#486581]">
                        <MapPin className="h-3 w-3 text-[#0E7490] shrink-0" />
                        <span className="truncate">{rec.source_site || 'Depot'}</span>
                        {rec.target_site && (
                          <>
                            <ArrowRight className="h-3 w-3 text-[#829AB1] shrink-0" />
                            <strong className="text-[#102A43] truncate">{rec.target_site}</strong>
                          </>
                        )}
                      </div>
                    )}

                    {/* Why (Reason) */}
                    <div className="mt-2 text-xs">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#627D98] block">
                        Why Recommended:
                      </span>
                      <p className="text-[#334E68] mt-0.5 leading-relaxed">
                        {rec.reason}
                      </p>
                    </div>

                    {/* Supporting Metrics Pills */}
                    {rec.supporting_metrics && Object.keys(rec.supporting_metrics).length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {Object.entries(rec.supporting_metrics)
                          .filter(([k, v]) => v !== null && v !== undefined && k !== 'current_site' && k !== 'equipment_type')
                          .map(([k, v], idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 bg-white border border-[#D9E2EC] px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono text-[#334E68]">
                              <span className="text-[#829AB1]">{k.replace(/_/g, ' ')}:</span>
                              <strong>{String(v)}</strong>
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Suggested Action Box */}
                    <div className="mt-2.5 bg-white border border-[#D9E2EC] p-2 rounded-[3px] text-xs">
                      <strong className="text-[#102A43] block text-[11px] mb-0.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-[#15803D]" /> Recommended Action:
                      </strong>
                      <p className="text-[#334E68] text-[11px]">
                        {rec.recommended_action}
                      </p>
                      {rec.impact && (
                        <p className="text-[10px] text-[#15803D] mt-1 pt-1 border-t border-[#F0F4F8] font-medium">
                          ⚡ Expected Impact: {rec.impact}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-3 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                    <span className="text-[10px] text-[#829AB1] font-mono">
                      Signal: {rec.recommendation_type}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {matchedAsset && matchedAsset.status === 'rented' && (rec.recommendation_type === 'RETURN' || rec.recommendation_type === 'REALLOCATE') ? (
                        <button
                          onClick={() => {
                            setSelectedAsset(matchedAsset);
                            setCheckinOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-[3px] bg-[#102A43] text-white text-[11px] font-medium hover:bg-[#0B1F33] transition"
                        >
                          Process Check In
                        </button>
                      ) : matchedAsset && matchedAsset.status === 'available' ? (
                        <button
                          onClick={() => {
                            setSelectedAsset(matchedAsset);
                            setCheckoutOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-[3px] bg-[#102A43] text-white text-[11px] font-medium hover:bg-[#0B1F33] transition"
                        >
                          Dispatch Asset
                        </button>
                      ) : null}

                      {matchedAsset && (
                        <Link
                          to={`/assets/${matchedAsset.id}`}
                          className="px-2 py-1 rounded-[3px] border border-[#D9E2EC] bg-white text-[#334E68] text-[11px] font-medium hover:bg-[#F0F4F8] transition"
                        >
                          Inspect Asset
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FLEET OPTIMIZATION OPPORTUNITIES (ASSET REALLOCATION ENGINE)           */}
      {/* ========================================================================= */}
      <div className="op-panel p-3.5 border-l-4 border-l-[#15803D]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#D9E2EC] gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-[#15803D] text-white">
              <Share2 className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#102A43]">
                2. Fleet Optimization & Reallocation Opportunities ({opportunities.length} Matched)
              </span>
              <p className="text-[11px] text-[#627D98]">Matching low-utilization or depot units with active high-demand project sites</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#15803D] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[2px] font-semibold">
            Capacity Optimization
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {opportunities.length === 0 ? (
            <div className="col-span-2 py-6 text-center text-xs text-[#627D98] bg-[#F8FAFC] rounded-[4px] border border-[#D9E2EC]">
              All fleet assets are currently deployed at optimal capacity across project sites.
            </div>
          ) : (
            opportunities.map((opt) => {
              const matchedAsset = allAssets.find(a => a.id === opt.asset_id || a.equipment_id === opt.equipment_id);
              return (
                <div
                  key={opt.id}
                  className="p-3 rounded-[4px] border border-[#D9E2EC] bg-[#F8FAFC] flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Asset & Route */}
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#102A43] text-xs">{opt.equipment_id}</span>
                        <span className="text-[11px] text-[#627D98]">({opt.equipment_type})</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase ${
                        opt.priority === 'high' ? 'bg-emerald-100 text-[#15803D]' : 'bg-slate-100 text-[#486581]'
                      }`}>
                        {opt.priority} Priority
                      </span>
                    </div>

                    {/* Routing */}
                    <div className="mt-2 bg-white border border-[#E2E8F0] p-2 rounded-[3px] flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[#627D98] block">Current Deployment:</span>
                        <strong className="text-[#102A43]">{opt.current_site}</strong>
                        <span className="text-[10px] text-[#B45309] block font-mono">Util: {opt.current_utilization}%</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#0E7490] shrink-0" />
                      <div>
                        <span className="text-[10px] text-[#627D98] block">Recommended Site:</span>
                        <strong className="text-[#15803D]">{opt.recommended_site}</strong>
                        <span className="text-[10px] text-[#0E7490] block font-mono">14d Demand: {opt.target_demand} units</span>
                      </div>
                    </div>

                    {/* Why */}
                    <div className="mt-2 text-xs">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#627D98] block">
                        Optimization Rationale:
                      </span>
                      <p className="text-[#334E68] mt-0.5 leading-relaxed text-[11px]">
                        {opt.reason}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="mt-2 bg-emerald-50/40 border border-emerald-200 p-2 rounded-[3px] text-[11px] text-[#15803D]">
                      <strong>Action:</strong> {opt.recommended_action}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                    <span className="text-[10px] text-[#829AB1] font-mono">Status: {opt.status}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedOpportunity(opt);
                          setReallocateOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-[3px] bg-[#15803D] text-white text-[11px] font-medium hover:bg-[#166534] transition flex items-center gap-1 shadow-xs"
                        title={`Reallocate ${opt.equipment_id} to ${opt.recommended_site}`}
                      >
                        <Share2 className="h-3 w-3" />
                        Reallocate
                      </button>
                      {matchedAsset && matchedAsset.status === 'rented' ? (
                        <button
                          onClick={() => {
                            setSelectedAsset(matchedAsset);
                            setCheckinOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-[3px] bg-[#102A43] text-white text-[11px] font-medium hover:bg-[#0B1F33] transition"
                        >
                          Check In
                        </button>
                      ) : null}
                      {matchedAsset && (
                        <Link
                          to={`/assets/${matchedAsset.id}`}
                          className="px-2 py-1 rounded-[3px] border border-[#D9E2EC] bg-white text-[#334E68] text-[11px] font-medium hover:bg-[#F0F4F8] transition"
                        >
                          Inspect
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EQUIPMENT HEALTH & OPERATIONAL RISK SCORES                             */}
      {/* ========================================================================= */}
      <div className="op-panel p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#D9E2EC] gap-2">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-[#B91C1C]" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68]">
                3. Equipment Operational Health & Risk Scores
              </span>
              <p className="text-[11px] text-[#627D98]">Explainable 0–100 scoring based on telematics duty cycle, idle benchmarks, and overdue states</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-white border border-[#D9E2EC] px-2 py-1 rounded-[3px] text-[#102A43] font-bold">
              Fleet Avg: {healthData?.fleet_average_health ?? 81.2} / 100
            </span>
            <select
              value={healthRiskFilter}
              onChange={(e) => setHealthRiskFilter(e.target.value)}
              className="rounded-[3px] border border-[#D9E2EC] bg-white px-2 py-1 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
            >
              <option value="ALL">All Assets ({rawHealthAssets.length})</option>
              <option value="WATCH">Watch Only ({healthData?.watch_count ?? 0})</option>
              <option value="HIGH_RISK">High Risk ({healthData?.high_risk_count ?? 0})</option>
              <option value="HEALTHY">Healthy ({healthData?.healthy_count ?? 0})</option>
            </select>
          </div>
        </div>

        {/* Health Assets Grid */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {filteredHealthAssets.map((assetHealth) => (
            <div
              key={assetHealth.asset_id}
              className={`p-3 rounded-[4px] border flex flex-col justify-between ${
                assetHealth.risk_level === 'HIGH_RISK'
                  ? 'border-red-300 bg-red-50/20'
                  : assetHealth.risk_level === 'WATCH'
                  ? 'border-amber-300 bg-amber-50/15'
                  : 'border-[#D9E2EC] bg-[#F8FAFC]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
                  <div>
                    <span className="font-mono font-bold text-[#102A43]">{assetHealth.equipment_id}</span>
                    <span className="text-[10px] text-[#627D98] block">{assetHealth.equipment_type}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-sm font-bold block ${
                      assetHealth.health_score >= 70 ? 'text-[#15803D]' : assetHealth.health_score >= 40 ? 'text-[#B45309]' : 'text-[#B91C1C]'
                    }`}>
                      {assetHealth.health_score} / 100
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-1 py-0.2 rounded-[2px] ${
                      assetHealth.risk_level === 'HEALTHY' ? 'bg-emerald-100 text-[#15803D]' : assetHealth.risk_level === 'WATCH' ? 'bg-amber-100 text-[#B45309]' : 'bg-red-100 text-[#B91C1C]'
                    }`}>
                      {assetHealth.risk_level.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#334E68] mt-2 leading-relaxed">
                  {assetHealth.summary}
                </p>

                {/* Score Factor Deductions */}
                {assetHealth.factors && assetHealth.factors.length > 0 && (
                  <div className="mt-2 space-y-1 bg-white border border-[#E2E8F0] p-1.5 rounded-[3px]">
                    <span className="text-[10px] font-bold text-[#627D98] uppercase tracking-wider block">
                      Score Factors:
                    </span>
                    {assetHealth.factors.map((f, fIdx) => (
                      <div key={fIdx} className="text-[10px] flex items-start justify-between gap-1 border-t border-[#F0F4F8] pt-1">
                        <span className="text-[#334E68] leading-tight">{f.message}</span>
                        <span className="font-mono font-bold text-[#B91C1C] shrink-0">{f.impact} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-2.5 pt-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
                <span className="text-[#829AB1]">{assetHealth.current_site || 'Depot'}</span>
                <Link
                  to={`/assets/${assetHealth.asset_id}`}
                  className="text-[#0E7490] hover:underline font-medium flex items-center gap-0.5"
                >
                  Asset Profile <ArrowRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. EXPLAINABLE ANOMALY DETECTION (RULE-BASED EXCEPTION DETECTOR)          */}
      {/* ========================================================================= */}
      <div className="op-panel p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-[#B45309]" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68]">
                4. Explainable Anomaly Detection ({filteredAnomalies.length} Exceptions)
              </span>
              <p className="text-[11px] text-[#627D98]">Deterministic operational benchmarks: idle cutoff, lease duration, runtime, and operator audits</p>
            </div>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-[3px] border border-[#D9E2EC] bg-white px-2 py-0.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
          >
            <option value="">All Severities ({rawAnomalies.length})</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
        </div>

        <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {filteredAnomalies.length === 0 ? (
            <div className="col-span-3 py-6 text-center text-[#829AB1]">
              No anomalies detected for selected criteria.
            </div>
          ) : (
            filteredAnomalies.map((a, idx) => {
              const matchedAsset = allAssets.find(item => item.equipment_id === a.equipment_id);
              return (
                <div
                  key={idx}
                  className="p-3 rounded-[4px] border border-[#D9E2EC] bg-[#F8FAFC] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#102A43]">{a.equipment_id}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase ${
                        a.severity === 'high' ? 'bg-red-100 text-[#B91C1C]' : 'bg-amber-100 text-[#B45309]'
                      }`}>
                        {a.severity} • {a.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#627D98] mt-0.5">
                      {a.equipment_type || 'Equipment'} • {a.current_site || 'Site'}
                    </p>

                    <p className="text-[12px] text-[#334E68] mt-2 leading-relaxed">
                      {a.message}
                    </p>

                    {/* Value vs Threshold Comparison */}
                    <div className="mt-2 bg-white border border-[#E2E8F0] p-2 rounded-[3px] space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#627D98]">Observed Value:</span>
                        <strong className="font-mono text-[#B91C1C]">{String(a.value)}</strong>
                      </div>
                      {a.threshold && (
                        <div className="flex justify-between border-t border-[#F0F4F8] pt-1">
                          <span className="text-[#627D98]">Benchmark:</span>
                          <span className="font-mono text-[#15803D]">{String(a.threshold)}</span>
                        </div>
                      )}
                    </div>

                    {/* Recommended Action */}
                    {a.recommended_action && (
                      <p className="text-[11px] text-[#0E7490] mt-2 bg-[#E0F2FE]/40 p-1.5 rounded-[2px] border border-[#BAE6FD]">
                        <strong>Action:</strong> {a.recommended_action}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[10px] text-[#829AB1]">Rule-based engine</span>
                    {matchedAsset && (
                      <Link
                        to={`/assets/${matchedAsset.id}`}
                        className="text-[11px] text-[#0E7490] hover:underline font-medium flex items-center gap-0.5"
                      >
                        Details <ArrowRight className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DEMAND FORECASTING (STATISTICAL RENTAL FREQUENCY HORIZONS)              */}
      {/* ========================================================================= */}
      <div className="op-panel p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#D9E2EC] gap-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-[#0E7490]" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68]">
                5. Equipment Category Demand Forecasting (7d / 14d / 30d Horizons)
              </span>
              <p className="text-[11px] text-[#627D98]">Forecast derived from SQLite historical transaction turnover frequency and recent 14-day checkout velocity</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#627D98] bg-[#F8FAFC] border border-[#D9E2EC] px-2 py-0.5 rounded-[2px]">
            Statistical Moving Window
          </span>
        </div>

        {/* Chart */}
        <div className="mt-3 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demandChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" stroke="#627D98" fontSize={11} />
              <YAxis stroke="#627D98" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#102A43', borderColor: '#334E68', borderRadius: '4px', color: '#FFFFFF', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Bar dataKey="Current Demand" fill="#9FB3C8" radius={[2, 2, 0, 0]} />
              <Bar dataKey="7-Day Forecast" fill="#0E7490" radius={[2, 2, 0, 0]} />
              <Bar dataKey="14-Day Forecast" fill="#2563EB" radius={[2, 2, 0, 0]} />
              <Bar dataKey="30-Day Forecast" fill="#102A43" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Category Cards with Recommendation Basis */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
          {(forecastData?.forecasts || []).map((f, idx) => {
            const growthPct = Math.round(((f.projected_demand_next_30d || (f.forecast_demand + 2)) - f.current_demand) / (f.current_demand || 1) * 100);
            return (
              <div
                key={idx}
                className="bg-[#F8FAFC] border border-[#D9E2EC] rounded-[4px] p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
                    <div>
                      <span className="font-semibold text-[#102A43] block">{f.equipment_type}</span>
                      <span className="text-[10px] text-[#627D98]">Primary: {f.site || 'Active Sites'}</span>
                    </div>
                    <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-[2px] ${
                      growthPct > 0 ? 'bg-emerald-50 text-[#15803D]' : 'bg-slate-100 text-[#486581]'
                    }`}>
                      {growthPct >= 0 ? `+${growthPct}%` : `${growthPct}%`} (30d)
                    </span>
                  </div>

                  {/* Multi-horizon Demand Metrics */}
                  <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px]">
                    <div className="bg-white border border-[#D9E2EC] p-1 rounded-[2px]">
                      <span className="text-[#627D98] block">Current</span>
                      <strong className="font-mono text-[#102A43] text-xs">{f.current_demand}</strong>
                    </div>
                    <div className="bg-white border border-[#D9E2EC] p-1 rounded-[2px]">
                      <span className="text-[#627D98] block">7-Day</span>
                      <strong className="font-mono text-[#0E7490] text-xs">{f.projected_demand_next_7d ?? f.forecast_demand}</strong>
                    </div>
                    <div className="bg-white border border-[#D9E2EC] p-1 rounded-[2px]">
                      <span className="text-[#627D98] block">14-Day</span>
                      <strong className="font-mono text-[#2563EB] text-xs">{f.projected_demand_next_14d ?? f.forecast_demand}</strong>
                    </div>
                    <div className="bg-white border border-[#D9E2EC] p-1 rounded-[2px]">
                      <span className="text-[#627D98] block">30-Day</span>
                      <strong className="font-mono text-[#B45309] text-xs">{f.projected_demand_next_30d ?? f.forecast_demand}</strong>
                    </div>
                  </div>

                  {/* Recommendation Basis (Plain Language) */}
                  {f.recommendation_basis && (
                    <div className="mt-2 text-[11px] text-[#486581] bg-white p-2 rounded-[2px] border border-[#E2E8F0]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#627D98] block mb-0.5">
                        Demand Trend Basis:
                      </span>
                      {f.recommendation_basis}
                    </div>
                  )}

                  {/* Strategy Recommendation */}
                  <div className="mt-2 text-[11px] text-[#334E68] bg-[#F0F4F8] p-2 rounded-[3px] border border-[#D9E2EC]">
                    <strong className="text-[#102A43] block mb-0.5">Capacity Strategy:</strong>
                    {f.recommendation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. FLEET UTILIZATION & SITE TELEMATICS BENCHMARKS                         */}
      {/* ========================================================================= */}
      <div className="op-panel p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68] flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-[#0E7490]" />
            6. Fleet Telematics & Site Performance Benchmarks
          </span>
        </div>

        {/* Top metric row */}
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D9E2EC] pb-3 border-b border-[#E2E8F0]">
          <div className="px-3 py-1">
            <span className="text-[11px] font-medium text-[#627D98] block">Overall Fleet Utilization</span>
            <span className="font-mono text-xl font-bold text-[#102A43]">{stats?.utilization_rate ?? 66.7}%</span>
            <span className="text-[10px] text-[#15803D] block mt-0.5">Target: &gt;65.0%</span>
          </div>
          <div className="px-3 py-1">
            <span className="text-[11px] font-medium text-[#627D98] block">Fleet Idle Ratio</span>
            <span className="font-mono text-xl font-bold text-[#B45309]">{stats?.average_idle_ratio ?? 29.9}%</span>
            <span className="text-[10px] text-[#627D98] block mt-0.5">Tolerance: &lt;30.0%</span>
          </div>
          <div className="px-3 py-1">
            <span className="text-[11px] font-medium text-[#627D98] block">Total Engine Runtime</span>
            <span className="font-mono text-xl font-bold text-[#102A43]">{stats?.total_fleet_engine_hours ?? 441.1} hrs</span>
            <span className="text-[10px] text-[#627D98] block mt-0.5">Cumulative shift runtime</span>
          </div>
          <div className="px-3 py-1">
            <span className="text-[11px] font-medium text-[#627D98] block">Estimated Fuel Burn</span>
            <span className="font-mono text-xl font-bold text-[#102A43]">{stats?.total_fleet_fuel_used ?? 1980.5} gal</span>
            <span className="text-[10px] text-[#627D98] block mt-0.5">Total site consumption</span>
          </div>
        </div>

        {/* Site Table */}
        <div className="mt-3 overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th>Job Site</th>
                <th>Active Units</th>
                <th>Engine Runtime</th>
                <th>Idle Duration</th>
                <th>Idle Ratio</th>
                <th>Fuel Burned</th>
                <th>Site Health</th>
              </tr>
            </thead>
            <tbody>
              {sitePerformance.map((row, idx) => (
                <tr key={idx}>
                  <td className="font-medium text-[#102A43]">{row.site}</td>
                  <td className="font-mono text-xs">{row.assets}</td>
                  <td className="font-mono text-xs text-[#102A43]">{row.engineH}</td>
                  <td className="font-mono text-xs text-[#486581]">{row.idleH}</td>
                  <td className="font-mono text-xs font-semibold">
                    <span className={parseFloat(row.idlePct) > 40 ? 'text-[#B91C1C]' : 'text-[#102A43]'}>
                      {row.idlePct}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{row.fuelBurn}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      row.healthColor === 'green'
                        ? 'text-[#15803D]'
                        : row.healthColor === 'red'
                        ? 'text-[#B91C1C]'
                        : 'text-[#B45309]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        row.healthColor === 'green'
                          ? 'bg-[#15803D]'
                          : row.healthColor === 'red'
                          ? 'bg-[#B91C1C]'
                          : 'bg-[#B45309]'
                      }`}></span>
                      {row.health}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modals */}
      <CheckinModal
        asset={selectedAsset}
        isOpen={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        onSuccess={fetchAnalytics}
      />
      <CheckoutModal
        asset={selectedAsset}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={fetchAnalytics}
      />
      <ReallocateModal
        opportunity={selectedOpportunity}
        isOpen={reallocateOpen}
        onClose={() => setReallocateOpen(false)}
        onSuccess={fetchAnalytics}
      />
    </div>
  );
}
