import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  Search,
  Repeat
} from 'lucide-react';
import { getAssets, getAlerts } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CheckoutModal from '../components/CheckoutModal';
import CheckinModal from '../components/CheckinModal';

export default function Rentals() {
  const [assets, setAssets] = useState([]);
  const [alerts, setAlerts] = useState({ overdue_items: [], due_soon_items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab filter: 'active' | 'overdue' | 'available' | 'all'
  const [viewTab, setViewTab] = useState('active');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);

  const fetchRentalsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [assetsData, alertsData] = await Promise.all([
        getAssets(),
        getAlerts(),
      ]);
      setAssets(assetsData || []);
      setAlerts(alertsData || { overdue_items: [], due_soon_items: [] });
    } catch (err) {
      console.error('Error fetching rentals data:', err);
      setError(err.message || 'Failed to load rental transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentalsData();
    const handleUpdate = () => fetchRentalsData();
    window.addEventListener('trackcat-asset-updated', handleUpdate);
    return () => window.removeEventListener('trackcat-asset-updated', handleUpdate);
  }, []);

  const handleActionSuccess = () => {
    fetchRentalsData();
  };

  const activeRentals = assets.filter((a) => a.status === 'rented');
  const overdueRentals = assets.filter((a) => a.is_overdue || (a.status === 'rented' && alerts.overdue_items?.some(o => o.equipment_id === a.equipment_id)));
  const availableAssets = assets.filter((a) => a.status === 'available');

  const displayedAssets = (
    viewTab === 'active'
      ? activeRentals
      : viewTab === 'overdue'
      ? overdueRentals
      : viewTab === 'available'
      ? availableAssets
      : assets
  ).filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.equipment_id.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      (a.current_site && a.current_site.toLowerCase().includes(q)) ||
      (a.last_operator?.name && a.last_operator.name.toLowerCase().includes(q))
    );
  });

  const overdueList = alerts.overdue_items || [];
  const dueSoonList = alerts.due_soon_items || [];

  return (
    <div className="space-y-3 pb-6">
      {/* Header */}
      <div className="op-panel p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-sm font-semibold text-[#102A43]">
            Active Rentals & Return Schedules
          </h1>
          <p className="text-xs text-[#627D98]">
            Operational equipment leases, return tracking, and overdue dispatch alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/terminal"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] border border-[#D9E2EC] bg-white text-xs font-medium text-[#334E68] hover:bg-[#F0F4F8] transition"
          >
            <Repeat className="h-3.5 w-3.5 text-[#0E7490]" />
            Terminal
          </Link>
          <button
            onClick={() => {
              if (availableAssets.length > 0) {
                setSelectedAsset(availableAssets[0]);
                setCheckoutOpen(true);
              }
            }}
            disabled={availableAssets.length === 0}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-[4px] bg-[#102A43] text-white text-xs font-medium hover:bg-[#0B1F33] transition disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Dispatch Asset
          </button>
        </div>
      </div>

      {/* RETURN SCHEDULE ALERTS */}
      {(overdueList.length > 0 || dueSoonList.length > 0) && (
        <div className="op-panel p-3 bg-red-50/20 border-red-200">
          <div className="flex items-center justify-between pb-2 border-b border-red-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C]">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Return Schedule Alerts ({overdueList.length} Overdue • {dueSoonList.length} Due Soon)</span>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {overdueList.map((item, idx) => {
              const matchedAsset = assets.find((a) => a.equipment_id === item.equipment_id);
              return (
                <div
                  key={`overdue-${idx}`}
                  className="bg-white border border-red-200 rounded-[3px] p-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#102A43]">{item.equipment_id}</span>
                      <span className="text-[11px] font-medium text-[#B91C1C]">+{item.overdue_days}d Overdue</span>
                    </div>
                    <p className="text-[12px] text-[#486581] mt-0.5">{item.type} • {item.site}</p>
                    <p className="text-[11px] text-[#627D98]">Operator: {item.operator_name || 'Unassigned'}</p>
                  </div>
                  {matchedAsset && (
                    <div className="mt-2 pt-1.5 border-t border-[#F0F4F8] flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedAsset(matchedAsset);
                          setCheckinOpen(true);
                        }}
                        className="px-2 py-0.5 rounded-[3px] bg-[#B91C1C] text-white text-[11px] font-medium hover:bg-red-800 transition"
                      >
                        Check In
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {dueSoonList.map((item, idx) => {
              const matchedAsset = assets.find((a) => a.equipment_id === item.equipment_id);
              return (
                <div
                  key={`duesoon-${idx}`}
                  className="bg-white border border-amber-200 rounded-[3px] p-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#102A43]">{item.equipment_id}</span>
                      <span className="text-[11px] font-medium text-[#B45309]">Due in {item.hours_remaining}h</span>
                    </div>
                    <p className="text-[12px] text-[#486581] mt-0.5">{item.type} • {item.site}</p>
                    <p className="text-[11px] text-[#627D98]">Operator: {item.operator_name || 'Unassigned'}</p>
                  </div>
                  {matchedAsset && (
                    <div className="mt-2 pt-1.5 border-t border-[#F0F4F8] flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedAsset(matchedAsset);
                          setCheckinOpen(true);
                        }}
                        className="px-2 py-0.5 rounded-[3px] bg-[#15803D] text-white text-[11px] font-medium hover:bg-[#166534] transition"
                      >
                        Check In
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER TABS & SEARCH */}
      <div className="op-panel p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewTab('active')}
            className={`px-2.5 py-1 rounded-[3px] font-medium transition ${
              viewTab === 'active'
                ? 'bg-[#102A43] text-white'
                : 'text-[#627D98] hover:bg-[#F0F4F8]'
            }`}
          >
            Active Leases ({activeRentals.length})
          </button>
          <button
            onClick={() => setViewTab('overdue')}
            className={`px-2.5 py-1 rounded-[3px] font-medium transition ${
              viewTab === 'overdue'
                ? 'bg-[#B91C1C] text-white'
                : 'text-[#627D98] hover:bg-[#F0F4F8]'
            }`}
          >
            Overdue ({overdueRentals.length})
          </button>
          <button
            onClick={() => setViewTab('available')}
            className={`px-2.5 py-1 rounded-[3px] font-medium transition ${
              viewTab === 'available'
                ? 'bg-[#15803D] text-white'
                : 'text-[#627D98] hover:bg-[#F0F4F8]'
            }`}
          >
            Available in Depot ({availableAssets.length})
          </button>
          <button
            onClick={() => setViewTab('all')}
            className={`px-2.5 py-1 rounded-[3px] font-medium transition ${
              viewTab === 'all'
                ? 'bg-[#102A43] text-white'
                : 'text-[#627D98] hover:bg-[#F0F4F8]'
            }`}
          >
            All ({assets.length})
          </button>
        </div>

        <div className="relative sm:w-56">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#829AB1]" />
          <input
            type="text"
            placeholder="Filter leases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[4px] border border-[#D9E2EC] bg-white pl-8 pr-2.5 py-1 text-xs text-[#102A43] placeholder-[#829AB1] focus:border-[#0E7490] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Querying lease records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchRentalsData} />
      ) : displayedAssets.length === 0 ? (
        <div className="op-panel p-8 text-center text-xs text-[#627D98]">
          No lease records found for the selected filter.
        </div>
      ) : (
        /* TABLE OF RENTAL RECORDS */
        <div className="op-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Equipment ID</th>
                  <th>Type</th>
                  <th>Job Site</th>
                  <th>Operator</th>
                  <th>Checked Out</th>
                  <th>Expected Return</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedAssets.map((asset) => {
                  const isOverdue = asset.is_overdue;
                  const checkoutDateStr = asset.checkout_date
                    ? new Date(asset.checkout_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                    : '—';
                  const returnDateStr = asset.expected_checkin_date
                    ? new Date(asset.expected_checkin_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                    : '—';
                  const durationStr = asset.operating_days ? `${asset.operating_days} days` : 'Active';

                  return (
                    <tr
                      key={asset.id}
                      className={isOverdue ? 'bg-red-50/30' : ''}
                    >
                      <td className="font-mono text-xs font-semibold">
                        <Link to={`/assets/${asset.id}`} className="text-[#102A43] hover:text-[#0E7490]">
                          {asset.equipment_id}
                        </Link>
                      </td>
                      <td className="text-xs text-[#334E68]">{asset.type}</td>
                      <td className="text-xs text-[#334E68] max-w-xs truncate" title={asset.current_site}>
                        {asset.current_site || 'Central Depot'}
                      </td>
                      <td className="text-xs text-[#486581]">
                        {asset.last_operator?.name || '—'}
                      </td>
                      <td className="font-mono text-xs text-[#486581]">
                        {checkoutDateStr}
                      </td>
                      <td className="font-mono text-xs">
                        <span className={isOverdue ? 'text-[#B91C1C] font-semibold' : 'text-[#102A43]'}>
                          {returnDateStr}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-[#486581]">
                        {durationStr}
                      </td>
                      <td>
                        <StatusBadge status={asset.status} isOverdue={asset.is_overdue} />
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          {asset.status === 'rented' ? (
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setCheckinOpen(true);
                              }}
                              className="px-2 py-0.5 rounded-[3px] bg-[#15803D] text-white text-[11px] font-medium hover:bg-[#166534] transition"
                            >
                              Check In
                            </button>
                          ) : asset.status === 'available' ? (
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setCheckoutOpen(true);
                              }}
                              className="px-2 py-0.5 rounded-[3px] bg-[#102A43] text-white text-[11px] font-medium hover:bg-[#0B1F33] transition"
                            >
                              Dispatch
                            </button>
                          ) : null}
                          <Link
                            to={`/assets/${asset.id}`}
                            className="px-2 py-0.5 rounded-[3px] border border-[#D9E2EC] bg-white text-[#334E68] text-[11px] font-medium hover:bg-[#F0F4F8] transition"
                          >
                            Details
                          </Link>
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
    </div>
  );
}
