import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Flame,
  AlertTriangle,
  Clock,
  Sparkles,
  BarChart3,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  Filter
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
import { getForecast, getAnomalies, getOverdue } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Analytics() {
  const [forecastData, setForecastData] = useState(null);
  const [anomalyData, setAnomalyData] = useState(null);
  const [overdueData, setOverdueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [severityFilter, setSeverityFilter] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [forecastRes, anomalyRes, overdueRes] = await Promise.all([
        getForecast(),
        getAnomalies(),
        getOverdue(),
      ]);
      setForecastData(forecastRes);
      setAnomalyData(anomalyRes);
      setOverdueData(overdueRes);
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

  if (loading) return <LoadingSpinner message="Calculating predictive demand forecasts & anomaly models..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAnalytics} />;

  // Chart data for Demand Forecast
  const demandChartData = (forecastData?.forecasts || []).map((f) => ({
    name: f.equipment_type.replace('Hydraulic ', '').replace('Compact ', ''),
    'Current Active': f.current_demand,
    '7-Day Forecast': f.projected_demand_next_7d ?? f.forecast_demand,
    '14-Day Forecast': f.projected_demand_next_14d ?? (f.forecast_demand + 1),
    '30-Day Forecast': f.projected_demand_next_30d ?? (f.forecast_demand + 2),
  }));

  const rawAnomalies = anomalyData?.anomalies || [];
  const filteredAnomalies = rawAnomalies.filter((a) => {
    if (!severityFilter) return true;
    return a.severity.toLowerCase() === severityFilter.toLowerCase();
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFCD11]">
          <Sparkles className="h-4 w-4" />
          Predictive Fleet Intelligence
        </div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Demand Forecasting & <span className="text-[#FFCD11]">Anomaly Detection</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Statistical rental demand projections and automated telemetry anomaly identification.
        </p>
      </div>

      {/* Demand Forecast Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#FFCD11]" />
              Equipment Demand Forecast Horizons
            </h2>
            <p className="text-xs text-slate-400">
              Projected machinery demand over 7-day, 14-day, and 30-day time horizons
            </p>
          </div>
          <div className="text-right">
            <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300">
              Model Generated: {forecastData?.forecast_generated_at ? new Date(forecastData.forecast_generated_at).toLocaleDateString() : 'Active'}
            </span>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demandChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} angle={-15} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Current Active" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="7-Day Forecast" fill="#FFCD11" radius={[4, 4, 0, 0]} />
              <Bar dataKey="14-Day Forecast" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="30-Day Forecast" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Recommendations Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 pt-2">
          {(forecastData?.forecasts || []).map((f, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-800/50 p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{f.equipment_type}</h4>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    f.utilization_trend === 'INCREASING'
                      ? 'bg-amber-950 text-[#FFCD11] border border-amber-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {f.utilization_trend || 'STABLE'}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-slate-900/60 p-1.5 border border-slate-800">
                    <p className="text-[10px] text-slate-400">Current</p>
                    <p className="font-bold text-white mt-0.5">{f.current_demand}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/60 p-1.5 border border-slate-800">
                    <p className="text-[10px] text-slate-400">Fleet Size</p>
                    <p className="font-bold text-blue-400 mt-0.5">{f.current_fleet_count ?? f.current_demand}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/60 p-1.5 border border-slate-800">
                    <p className="text-[10px] text-slate-400">30d Demand</p>
                    <p className="font-bold text-[#FFCD11] mt-0.5">{f.projected_demand_next_30d ?? f.forecast_demand}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                  {f.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Anomaly Detection Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-rose-400" />
              Operational Telematics Anomalies ({filteredAnomalies.length})
            </h2>
            <p className="text-xs text-slate-400">
              Rule-based detector flagging excessive idle time, overdue leases, and missing operator records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-[#FFCD11] focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="high">High Severity Only</option>
              <option value="medium">Medium Severity</option>
              <option value="low">Low Severity</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredAnomalies.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-xs text-slate-400">
              No operational anomalies detected matching the current filter.
            </div>
          ) : (
            filteredAnomalies.map((anomaly, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 shadow-md transition ${
                  anomaly.severity === 'high'
                    ? 'border-rose-800/60 bg-rose-950/20 hover:border-rose-700'
                    : 'border-amber-800/60 bg-amber-950/20 hover:border-amber-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{anomaly.equipment_id}</span>
                    <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                      {anomaly.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    anomaly.severity === 'high'
                      ? 'bg-rose-900 text-rose-200 border border-rose-600/40'
                      : 'bg-amber-900 text-amber-200 border border-amber-600/40'
                  }`}>
                    {anomaly.severity} severity
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-200">{anomaly.message}</p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                  <span>Site: {anomaly.current_site || 'Active Job'}</span>
                  <span className="font-bold text-[#FFCD11]">Value: {String(anomaly.value)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
