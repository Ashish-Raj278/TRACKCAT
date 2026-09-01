import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Repeat } from 'lucide-react';
import { getAssets } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CheckoutModal from '../components/CheckoutModal';
import CheckinModal from '../components/CheckinModal';
import UsageLogModal from '../components/UsageLogModal';

export default function AssetsList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
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

  const fetchFleetAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (siteFilter) params.site = siteFilter;
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
        /* High-Density Enterprise Table */
        <div className="op-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Equipment ID</th>
                  <th>Type</th>
                  <th>Job Site</th>
                  <th>Status</th>
                  <th>Operator</th>
                  <th>Engine (h/d)</th>
                  <th>Idle (h/d)</th>
                  <th>Utilization</th>
                  <th>Return</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => {
                  const isOverdue = asset.is_overdue;
                  const returnDateStr = asset.expected_checkin_date
                    ? new Date(asset.expected_checkin_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                    : '—';
                  const utilizationPct = asset.idle_ratio ? `${(100 - asset.idle_ratio).toFixed(0)}%` : '80%';

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => navigate(`/assets/${asset.id}`)}
                      className={`cursor-pointer ${isOverdue ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="font-mono text-xs font-semibold">
                        <Link
                          to={`/assets/${asset.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#102A43] hover:text-[#0E7490]"
                        >
                          {asset.equipment_id}
                        </Link>
                      </td>

                      <td className="text-xs text-[#334E68]">{asset.type}</td>

                      <td className="text-xs text-[#334E68] max-w-xs truncate" title={asset.current_site}>
                        {asset.current_site || 'Central Depot'}
                      </td>

                      <td>
                        <StatusBadge status={asset.status} isOverdue={asset.is_overdue} />
                      </td>

                      <td className="text-xs text-[#486581]">
                        {asset.last_operator?.name || '—'}
                      </td>

                      <td className="font-mono text-xs text-[#102A43]">
                        {asset.engine_hours_per_day || 0}
                      </td>

                      <td className="font-mono text-xs text-[#486581]">
                        {asset.idle_hours_per_day || 0}
                      </td>

                      <td className="font-mono text-xs font-medium text-[#102A43]">
                        {utilizationPct}
                      </td>

                      <td className="font-mono text-xs">
                        <span className={isOverdue ? 'text-[#B91C1C] font-semibold' : 'text-[#486581]'}>
                          {returnDateStr}
                        </span>
                      </td>

                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {asset.status === 'available' ? (
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setCheckoutOpen(true);
                              }}
                              className="px-2 py-0.5 rounded-[3px] bg-[#102A43] text-white text-[11px] font-medium hover:bg-[#0B1F33] transition"
                            >
                              Check Out
                            </button>
                          ) : asset.status === 'rented' ? (
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setCheckinOpen(true);
                              }}
                              className="px-2 py-0.5 rounded-[3px] bg-[#15803D] text-white text-[11px] font-medium hover:bg-[#166534] transition"
                            >
                              Check In
                            </button>
                          ) : null}

                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setUsageLogOpen(true);
                            }}
                            className="px-2 py-0.5 rounded-[3px] border border-[#D9E2EC] bg-white text-[#334E68] text-[11px] font-medium hover:bg-[#F0F4F8] transition"
                          >
                            Log
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
    </div>
  );
}
