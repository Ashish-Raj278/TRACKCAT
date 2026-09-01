import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  User,
  Plus,
  ArrowRight,
  Filter,
  Search,
  QrCode,
  Bell
} from 'lucide-react';
import { getAssets, getAlerts } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CheckoutModal from '../components/CheckoutModal';
import CheckinModal from '../components/CheckinModal';
import QRScannerModal from '../components/QRScannerModal';

export default function Rentals() {
  const [assets, setAssets] = useState([]);
  const [alerts, setAlerts] = useState({ overdue_items: [], due_soon_items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab filter: 'active' | 'available' | 'all'
  const [viewTab, setViewTab] = useState('active');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

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
  }, []);

  const handleActionSuccess = () => {
    fetchRentalsData();
  };

  const activeRentals = assets.filter((a) => a.status === 'rented');
  const availableAssets = assets.filter((a) => a.status === 'available');

  const displayedAssets = (
    viewTab === 'active'
      ? activeRentals
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Rental <span className="text-[#FFCD11]">Operations</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Dispatch machinery, manage return schedules, and process returns via manual input or QR/RFID scan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setQrOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-2.5 text-xs font-bold text-[#FFCD11] hover:bg-amber-500/30 transition shadow-sm"
          >
            <QrCode className="h-4 w-4" />
            Scan QR / RFID
          </button>
          <button
            onClick={() => {
              if (availableAssets.length > 0) {
                setSelectedAsset(availableAssets[0]);
                setCheckoutOpen(true);
              }
            }}
            disabled={availableAssets.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFCD11] px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-[#E5B700] transition disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Check Out Equipment
          </button>
        </div>
      </div>

      {/* Return Alerts Section (Overdue + Due Soon) */}
      {(overdueList.length > 0 || dueSoonList.length > 0) && (
        <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-3 border-b border-rose-900/40 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-900/60 text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-rose-200 text-sm">
                Return Schedule Alerts: {overdueList.length} Overdue • {dueSoonList.length} Approaching Deadline
              </h3>
              <p className="text-xs text-rose-300/80">
                Equipment requiring immediate return processing or dispatch notice.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {overdueList.map((item, idx) => {
              const matchedAsset = assets.find((a) => a.equipment_id === item.equipment_id);
              return (
                <div
                  key={`overdue-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-rose-900/50 bg-rose-950/40 p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{item.equipment_id}</span>
                      <span className="text-[11px] text-slate-400">({item.type})</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Site: {item.site}</p>
                    <p className="text-[10px] text-slate-400">Op: {item.operator_name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-md bg-rose-900 px-2 py-0.5 text-xs font-bold text-rose-200 border border-rose-600/40">
                      +{item.overdue_days}d overdue
                    </span>
                    {matchedAsset && (
                      <div className="mt-2">
                        <button
                          onClick={() => {
                            setSelectedAsset(matchedAsset);
                            setCheckinOpen(true);
                          }}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition"
                        >
                          Check In
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {dueSoonList.map((item, idx) => {
              const matchedAsset = assets.find((a) => a.equipment_id === item.equipment_id);
              return (
                <div
                  key={`duesoon-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-amber-900/50 bg-amber-950/40 p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{item.equipment_id}</span>
                      <span className="text-[11px] text-slate-400">({item.type})</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">Site: {item.site}</p>
                    <p className="text-[10px] text-slate-400">Op: {item.operator_name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-md bg-amber-900 px-2 py-0.5 text-xs font-bold text-amber-200 border border-amber-600/40">
                      Due in {item.hours_remaining}h
                    </span>
                    {matchedAsset && (
                      <div className="mt-2">
                        <button
                          onClick={() => {
                            setSelectedAsset(matchedAsset);
                            setCheckinOpen(true);
                          }}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition"
                        >
                          Check In
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewTab('active')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              viewTab === 'active'
                ? 'bg-[#FFCD11] text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Active Leases ({activeRentals.length})
          </button>
          <button
            onClick={() => setViewTab('available')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              viewTab === 'available'
                ? 'bg-[#FFCD11] text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Available Depot ({availableAssets.length})
          </button>
          <button
            onClick={() => setViewTab('all')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              viewTab === 'all'
                ? 'bg-[#FFCD11] text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Machinery ({assets.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search active rentals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-400 focus:border-[#FFCD11] focus:outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner message="Synchronizing rental schedules & statuses..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchRentalsData} />
      ) : displayedAssets.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-500 mb-3" />
          <h3 className="text-base font-bold text-white">No Rentals Match Filter</h3>
          <p className="text-xs text-slate-400 mt-1">Switch tabs or clear search to view equipment.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Equipment ID</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Job Site</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Checkout Date</th>
                  <th className="py-3.5 px-4">Expected Return</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <Link to={`/assets/${asset.id}`} className="hover:text-[#FFCD11] transition">
                        {asset.equipment_id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{asset.type}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={asset.status} isOverdue={asset.is_overdue} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{asset.current_site || 'Yard Depot'}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {asset.last_operator?.name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {asset.checkout_date
                        ? new Date(asset.checkout_date).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {asset.expected_checkin_date ? (
                        <span className={`font-semibold ${asset.is_overdue ? 'text-rose-400' : 'text-slate-300'}`}>
                          {new Date(asset.expected_checkin_date).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {asset.status === 'available' && (
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setCheckoutOpen(true);
                            }}
                            className="rounded-lg bg-[#FFCD11] px-3 py-1 text-xs font-bold text-slate-950 hover:bg-[#E5B700] transition"
                          >
                            Check Out
                          </button>
                        )}
                        {asset.status === 'rented' && (
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setCheckinOpen(true);
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500 transition"
                          >
                            Check In
                          </button>
                        )}
                        <Link
                          to={`/assets/${asset.id}`}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                        >
                          Specs
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
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
      <QRScannerModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        assets={assets}
        onSelectAssetForCheckout={(asset) => {
          setSelectedAsset(asset);
          setCheckoutOpen(true);
        }}
        onSelectAssetForCheckin={(asset) => {
          setSelectedAsset(asset);
          setCheckinOpen(true);
        }}
      />
    </div>
  );
}
