import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  QrCode
} from 'lucide-react';
import { getAssets } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CheckoutModal from '../components/CheckoutModal';
import CheckinModal from '../components/CheckinModal';
import UsageLogModal from '../components/UsageLogModal';
import AssetQRModal from '../components/AssetQRModal';

export default function AssetsList() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
      const data = await getAssets(params);
      setAssets(data || []);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err.message || 'Unable to retrieve equipment fleet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetAssets();
  }, [statusFilter, typeFilter]);

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

  const handleActionSuccess = () => {
    fetchFleetAssets();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Fleet Asset <span className="text-[#FFCD11]">Inventory</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor machinery availability, track telematics metrics, and manage site assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300">
            Total Units: <strong className="text-[#FFCD11]">{filteredAssets.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, equipment type, site, operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-[#FFCD11] focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs text-white focus:border-[#FFCD11] focus:outline-none"
          >
            <option value="">All Statuses (Available, Rented, Maint)</option>
            <option value="available">Available Only</option>
            <option value="rented">Rented / Active</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs text-white focus:border-[#FFCD11] focus:outline-none"
          >
            <option value="">All Equipment Types</option>
            {equipmentTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading fleet machinery inventory..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchFleetAssets} />
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
          <Truck className="mx-auto h-12 w-12 text-slate-500 mb-3" />
          <h3 className="text-base font-bold text-white">No Equipment Found</h3>
          <p className="text-xs text-slate-400 mt-1">Try modifying your filter or search criteria.</p>
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

                {/* Telematics Snapshot */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-700/50">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Avg Engine</p>
                    <p className="text-sm font-bold text-blue-400 mt-0.5">{asset.engine_hours_per_day}h / day</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-700/50">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Idle Ratio</p>
                    <p className={`text-sm font-bold mt-0.5 ${asset.idle_ratio > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {asset.idle_ratio}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/assets/${asset.id}`}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                  >
                    Specs
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
