import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  Activity,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRight
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
import { getForecast, getAnomalies, getOverdue, getDashboardStats, getFleetUsageSummary } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Analytics() {
  const [forecastData, setForecastData] = useState(null);
  const [anomalyData, setAnomalyData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [severityFilter, setSeverityFilter] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [forecastRes, anomalyRes, , statsRes] = await Promise.all([
        getForecast(),
        getAnomalies(),
        getOverdue(),
        getDashboardStats(),
        getFleetUsageSummary(),
      ]);
      setForecastData(forecastRes);
      setAnomalyData(anomalyRes);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Unable to retrieve fleet analytics intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSpinner message="Calculating demand forecasts and anomaly metrics..." />;
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
      {/* Header */}
      <div className="op-panel p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-sm font-semibold text-[#102A43]">
            Operations Analytics & Predictive Intelligence
          </h1>
          <p className="text-xs text-[#627D98]">
            Samsara-inspired actionable intelligence: utilization, idle benchmarks, anomalies, and demand forecasting
          </p>
        </div>
        <span className="text-xs font-mono bg-[#F8FAFC] border border-[#D9E2EC] px-2 py-0.5 rounded-[3px] text-[#486581]">
          Statistical Planning Horizons (7d / 14d / 30d)
        </span>
      </div>

      {/* 1. FLEET UTILIZATION & CAPACITY BENCHMARKS */}
      <div className="op-panel p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#334E68] pb-2 border-b border-[#D9E2EC]">
          1. Fleet Utilization & Capacity Benchmarks
        </div>

        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D9E2EC]">
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
      </div>

      {/* 2. SITE PERFORMANCE & RUNTIME BENCHMARKS */}
      <div className="op-panel p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68] flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#0E7490]" />
            2. Site Performance & Fuel Efficiency Benchmarks
          </span>
        </div>

        <div className="mt-2 overflow-x-auto">
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

      {/* 3. OPERATIONAL ANOMALIES (RULE-BASED EXCEPTION DETECTOR) */}
      <div className="op-panel p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-[#B45309]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68]">
              3. Telematics & Lease Anomalies ({filteredAnomalies.length})
            </span>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-[3px] border border-[#D9E2EC] bg-white px-2 py-0.5 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
        </div>

        <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {filteredAnomalies.length === 0 ? (
            <div className="col-span-2 py-4 text-center text-[#829AB1]">
              No anomalies detected for selected criteria.
            </div>
          ) : (
            filteredAnomalies.map((a, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-[4px] border border-[#D9E2EC] bg-[#F8FAFC] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#102A43]">{a.equipment_id}</span>
                    <span className={`text-[11px] font-medium uppercase ${
                      a.severity === 'high' ? 'text-[#B91C1C]' : 'text-[#B45309]'
                    }`}>
                      ● {a.severity} Severity
                    </span>
                  </div>
                  <p className="text-[12px] text-[#334E68] mt-1">{a.message}</p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#627D98]">
                  <span>Site: {a.current_site}</span>
                  <span className="font-mono font-medium text-[#102A43]">Value: {String(a.value)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. DEMAND FORECAST HORIZONS CHART */}
      <div className="op-panel p-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E2EC]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#334E68] flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#0E7490]" />
            4. Machinery Demand Forecast Horizons (7d / 14d / 30d)
          </span>
        </div>

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
      </div>

      {/* 5. ACTIONABLE FLEET DISPATCH DECISIONS (SAMSARA-STYLE) */}
      <div className="op-panel p-3.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#334E68] pb-2 border-b border-[#D9E2EC] flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" />
          5. Actionable Fleet Dispatch Recommendations
        </div>

        <div className="mt-2.5 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
          {(forecastData?.forecasts || []).map((f, idx) => {
            const growthPct = Math.round(((f.projected_demand_next_30d || (f.forecast_demand + 2)) - f.current_demand) / (f.current_demand || 1) * 100);
            return (
              <div
                key={idx}
                className="bg-[#F8FAFC] border border-[#D9E2EC] rounded-[4px] p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
                    <span className="font-semibold text-[#102A43]">{f.equipment_type}</span>
                    <span className="font-mono text-[11px] font-bold text-[#0E7490]">
                      {growthPct >= 0 ? `+${growthPct}%` : `${growthPct}%`}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[11px]">
                    <div className="bg-white border border-[#D9E2EC] p-1 rounded-[2px]">
                      <span className="text-[10px] text-[#627D98] block">Current</span>
                      <strong className="font-mono text-[#102A43]">{f.current_demand}</strong>
                    </div>
                    <div className="bg-white border border-[#D9E2EC] p-1 rounded-[2px]">
                      <span className="text-[10px] text-[#627D98] block">Fleet</span>
                      <strong className="font-mono text-[#0E7490]">{f.current_fleet_count ?? f.current_demand}</strong>
                    </div>
                    <div className="bg-white border border-[#D9E2EC] p-1 rounded-[2px]">
                      <span className="text-[10px] text-[#627D98] block">30d Demand</span>
                      <strong className="font-mono text-[#B45309]">{f.projected_demand_next_30d ?? f.forecast_demand}</strong>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-[#334E68] bg-white p-2 rounded-[3px] border border-[#E2E8F0]">
                    <strong className="text-[#102A43] block mb-0.5">Recommendation:</strong>
                    {f.recommendation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
