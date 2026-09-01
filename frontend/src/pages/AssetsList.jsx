import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Truck,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  MapPin,
  User,
  Activity,
  PlusCircle,
  Clock,
  CheckCircle2,
  Gauge,
  QrCode,
  Repeat
} from 'lucide-react';
import { getAssets, getHealth } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CheckoutModal from '../components/CheckoutModal';
import CheckinModal from '../components/CheckinModal';
import UsageLogModal from '../components/UsageLogModal';
import AssetQRModal from '../components/AssetQRModal';

export default function AssetsList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [healthMap, setHealthMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Modals
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [usageLogOpen, setUsageLogOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const fetchFleetAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (siteFilter) params.site = siteFilter;
      const [assetsData, healthData] = await Promise.all([
        getAssets(params),
        getHealth(),
      ]);
      setAssets(assetsData || []);
      const map = {};
      (healthData?.assets || []).forEach(h => {
        map[h.equipment_id] = h;
      });
      setHealthMap(map);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err.message || 'Unable to retrieve equipment fleet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetAssets();
    const handleUpdate = () => fetchFleetAssets();
    window.addEventListener('trackcat-asset-updated', handleUpdate);
    return () => window.removeEventListener('trackcat-asset-updated', handleUpdate);
  }, [statusFilter, typeFilter, siteFilter]);

  const filteredAssets = assets.filter((asset) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      asset.equipment_id.toLowerCase().includes(q) ||
      asset.type.toLowerCase().includes(q) ||
      (asset.current_site && asset.current_site.toLowerCase().includes(q)) ||
      (asset.last_operator?.name && asset.last_operator.name.toLowerCase().includes(q))
    );
  });

  const equipmentTypes = Array.from(new Set(assets.map((a) => a.type)));
  const siteList = Array.from(new Set(assets.map((a) => a.current_site).filter(Boolean)));

  const handleActionSuccess = () => {
    fetchFleetAssets();
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Top Controls Bar */}
      <div className="op-panel p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#102A43]">
            Asset Register
          </span>
          <span className="text-xs text-[#627D98] bg-[#F0F4F8] px-2 py-0.5 rounded-[3px] font-mono">
            {filteredAssets.length} of {assets.length} Units
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/terminal"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#102A43] text-white text-xs font-medium hover:bg-[#0B1F33] transition"
          >
            <Repeat className="h-3.5 w-3.5" />
            Transaction Terminal
          </Link>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="op-panel p-2.5 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#829AB1]" />
          <input
            type="text"
            placeholder="Search ID, model, operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[4px] border border-[#D9E2EC] bg-white pl-8 pr-2.5 py-1 text-xs text-[#102A43] placeholder-[#829AB1] focus:border-[#0E7490] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
          >
            <option value="">Status: All</option>
            <option value="available">Available</option>
            <option value="rented">On Rent</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
          >
            <option value="">Type: All Types</option>
            {equipmentTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-full rounded-[4px] border border-[#D9E2EC] bg-white px-2.5 py-1 text-xs text-[#102A43] focus:border-[#0E7490] focus:outline-none"
          >
            <option value="">Site: All Sites</option>
            {siteList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Querying equipment register..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchFleetAssets} />
      ) : filteredAssets.length === 0 ? (
        <div className="op-panel p-8 text-center text-xs text-[#627D98]">
          No equipment records matched the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl transition-all duration-200 hover:border-slate-700 hover:shadow-2xl"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/assets/${asset.id}`}
                      className="text-base font-black text-white hover:text-[#FFCD11] transition flex items-center gap-1.5"
                    >
                      {asset.equipment_id}
                    </Link>
                    <p className="text-xs font-medium text-slate-400">{asset.type}</p>
                  </div>
                  <StatusBadge status={asset.status} isOverdue={asset.is_overdue} />
                </div>

                {/* Details Section */}
                <div className="mt-4 space-y-2 rounded-xl bg-slate-800/40 p-3 text-xs border border-slate-800">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-[#FFCD11]" />
                      Location:
                    </span>
                    <span className="font-semibold text-white truncate max-w-[170px]">
                      {asset.current_site || 'Main Yard Depot'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 text-slate-400">
                      <User className="h-3.5 w-3.5 text-blue-400" />
                      Operator:
                    </span>
                    <span className="font-medium text-slate-200">
                      {asset.last_operator?.name || 'Unassigned'}
                    </span>
                  </div>

                  {asset.expected_checkin_date && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                        Return Date:
                      </span>
                      <span className={`font-semibold ${asset.is_overdue ? 'text-rose-400' : 'text-slate-200'}`}>
                        {new Date(asset.expected_checkin_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Telematics & Health Snapshot */}
                <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="rounded-lg bg-slate-800/60 p-1.5 border border-slate-700/50">
                    <p className="text-[9px] uppercase font-semibold text-slate-400">Avg Engine</p>
                    <p className="text-xs font-bold text-blue-400 mt-0.5">{asset.engine_hours_per_day}h/d</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-1.5 border border-slate-700/50">
                    <p className="text-[9px] uppercase font-semibold text-slate-400">Idle Ratio</p>
                    <p className={`text-xs font-bold mt-0.5 ${asset.idle_ratio > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {asset.idle_ratio}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-1.5 border border-slate-700/50">
                    <p className="text-[9px] uppercase font-semibold text-slate-400">Health</p>
                    {healthMap[asset.equipment_id] ? (
                      <p className={`text-xs font-bold mt-0.5 ${
                        healthMap[asset.equipment_id].health_score >= 70
                          ? 'text-emerald-400'
                          : healthMap[asset.equipment_id].health_score >= 40
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {healthMap[asset.equipment_id].health_score}/100
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 mt-0.5">--</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/assets/${asset.id}`}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                  >
                    Full Specs
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedAsset(asset);
                      setQrOpen(true);
                    }}
                    title="View Asset QR Code"
                    className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs font-medium text-[#FFCD11] hover:bg-amber-500/20 transition flex items-center gap-1"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    QR
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedAsset(asset);
                      setUsageLogOpen(true);
                    }}
                    title="Log Daily Telematics"
                    className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition flex items-center gap-1"
                  >
                    <Gauge className="h-3.5 w-3.5 text-blue-400" />
                    Log
                  </button>

                  {asset.status === 'available' ? (
                    <button
                      onClick={() => {
                        setSelectedAsset(asset);
                        setCheckoutOpen(true);
                      }}
                      className="rounded-xl bg-[#FFCD11] px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-[#E5B700] transition shadow-md"
                    >
                      Check Out
                    </button>
                  ) : asset.status === 'rented' ? (
                    <button
                      onClick={() => {
                        setSelectedAsset(asset);
                        setCheckinOpen(true);
                      }}
                      className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md"
                    >
                      Check In
                    </button>
                  ) : (
                    <span className="rounded-xl bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                      In Service
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CheckoutModal
        asset={selectedAsset}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <CheckinModal
        asset={selectedAsset}
        isOpen={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <UsageLogModal
        asset={selectedAsset}
        isOpen={usageLogOpen}
        onClose={() => setUsageLogOpen(false)}
        onSuccess={handleActionSuccess}
      />
      <AssetQRModal
        asset={selectedAsset}
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
      />
    </div>
  );
}
