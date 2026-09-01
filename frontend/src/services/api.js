import {
  mockAssets,
  mockDashboardStats,
  mockAnomalies,
  mockForecast,
  mockOverdue,
  mockSites,
  mockOperators,
  mockUsageLogs
} from '../data/mockData';

// API Base URL from Vite environment variable or default
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// In-memory local fallback store for seamless interactive offline/mock testing
let inMemoryAssets = JSON.parse(JSON.stringify(mockAssets));
let inMemoryStats = JSON.parse(JSON.stringify(mockDashboardStats));
let inMemoryUsageLogs = JSON.parse(JSON.stringify(mockUsageLogs));

/**
 * Generic helper for making HTTP requests with automatic JSON parsing and error handling
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorDetail = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.detail) {
          errorDetail = errorJson.detail;
        }
      } catch {
        // use status text
      }
      const error = new Error(errorDetail);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (err) {
    // If connection refused (backend offline in dev mode), fallback gracefully
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.warn(`[TRACKCAT API] Backend unreachable at ${url}. Falling back to mock data.`);
      return null;
    }
    throw err;
  }
}

// ----------------------------------------------------------------------
// 1. Assets Endpoints
// ----------------------------------------------------------------------

/**
 * GET /api/assets
 * Retrieve list of all equipment assets with optional filters
 * @param {Object} [params] - { status, type, site }
 */
export async function getAssets(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.type) query.append('type', params.type);
  if (params.site) query.append('site', params.site);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const data = await request(`/assets${qs}`);
  if (data !== null) return data;

  // Local fallback filter
  let result = [...inMemoryAssets];
  if (params.status) {
    result = result.filter(a => a.status.toLowerCase() === params.status.toLowerCase());
  }
  if (params.type) {
    result = result.filter(a => a.type.toLowerCase().includes(params.type.toLowerCase()));
  }
  if (params.site) {
    result = result.filter(a => a.current_site?.toLowerCase().includes(params.site.toLowerCase()));
  }
  return result;
}
export const fetchAssets = getAssets;

/**
 * GET /api/assets/{id}
 * Retrieve single asset details by integer ID
 * @param {number|string} id
 */
export async function getAssetById(id) {
  const data = await request(`/assets/${id}`);
  if (data !== null) return data;

  const found = inMemoryAssets.find(a => String(a.id) === String(id));
  if (!found) {
    throw new Error(`Asset with ID ${id} not found.`);
  }
  return found;
}
export const fetchAssetById = getAssetById;

// ----------------------------------------------------------------------
// 2. Rental Checkout & Checkin Endpoints
// ----------------------------------------------------------------------

/**
 * POST /api/checkout
 * Check out equipment to a site & operator with return date
 * @param {Object} payload - { asset_id: number, site_id: number, operator_id?: number, expected_return_time: string }
 */
export async function checkoutAsset(payload) {
  const data = await request('/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data !== null) return data;

  // In-memory update for mock state
  const assetIndex = inMemoryAssets.findIndex(a => a.id === payload.asset_id);
  if (assetIndex === -1) {
    throw new Error(`Asset with ID ${payload.asset_id} not found.`);
  }

  const site = mockSites.find(s => s.id === payload.site_id) || { site_name: 'Assigned Site' };
  const operator = payload.operator_id ? mockOperators.find(o => o.id === payload.operator_id) : null;

  const updatedAsset = {
    ...inMemoryAssets[assetIndex],
    status: 'rented',
    current_site: site.site_name,
    checkout_date: new Date().toISOString(),
    expected_checkin_date: payload.expected_return_time,
    last_operator_id: operator ? operator.id : null,
    last_operator: operator,
    is_overdue: false,
  };

  inMemoryAssets[assetIndex] = updatedAsset;
  inMemoryStats.rented_assets = inMemoryAssets.filter(a => a.status === 'rented').length;
  inMemoryStats.available_assets = inMemoryAssets.filter(a => a.status === 'available').length;
  inMemoryStats.active_rentals_count = inMemoryStats.rented_assets;

  return {
    message: `Equipment ${updatedAsset.equipment_id} successfully checked out to ${site.site_name}.`,
    rental: {
      id: Math.floor(Math.random() * 1000) + 10,
      asset_id: updatedAsset.id,
      equipment_id: updatedAsset.equipment_id,
      site_id: payload.site_id,
      site_name: site.site_name,
      operator_id: operator?.id || null,
      operator_name: operator?.name || null,
      checkout_time: new Date().toISOString(),
      expected_return_time: payload.expected_return_time,
      status: 'active',
      is_overdue: false,
      days_overdue: 0.0,
    },
    asset: updatedAsset,
  };
}

/**
 * POST /api/checkin
 * Check in an active rental, update asset to available, log telematics
 * @param {Object} payload - { asset_id: number, checkin_time?: string, engine_hours_operated?: number, idle_hours_operated?: number }
 */
export async function checkinAsset(payload) {
  const data = await request('/checkin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data !== null) return data;

  // In-memory update for mock state
  const assetIndex = inMemoryAssets.findIndex(a => a.id === payload.asset_id);
  if (assetIndex === -1) {
    throw new Error(`Asset with ID ${payload.asset_id} not found.`);
  }

  const asset = inMemoryAssets[assetIndex];
  const updatedAsset = {
    ...asset,
    status: 'available',
    checkout_date: null,
    expected_checkin_date: null,
    is_overdue: false,
  };

  if (payload.engine_hours_operated != null) {
    const totalDays = (asset.operating_days || 0) + 1;
    const newEngineAvg = Number((((asset.engine_hours_per_day || 0) * (asset.operating_days || 0) + payload.engine_hours_operated) / totalDays).toFixed(1));
    const newIdleAvg = Number((((asset.idle_hours_per_day || 0) * (asset.operating_days || 0) + (payload.idle_hours_operated || 0)) / totalDays).toFixed(1));
    updatedAsset.operating_days = totalDays;
    updatedAsset.engine_hours_per_day = newEngineAvg;
    updatedAsset.idle_hours_per_day = newIdleAvg;
    const totalH = newEngineAvg + newIdleAvg;
    updatedAsset.idle_ratio = totalH > 0 ? Number(((newIdleAvg / totalH) * 100).toFixed(1)) : 0;
  }

  inMemoryAssets[assetIndex] = updatedAsset;
  inMemoryStats.rented_assets = inMemoryAssets.filter(a => a.status === 'rented').length;
  inMemoryStats.available_assets = inMemoryAssets.filter(a => a.status === 'available').length;
  inMemoryStats.active_rentals_count = inMemoryStats.rented_assets;

  return {
    message: `Equipment ${updatedAsset.equipment_id} successfully checked in. Status is now available.`,
    rental: {
      id: Math.floor(Math.random() * 1000) + 10,
      asset_id: updatedAsset.id,
      equipment_id: updatedAsset.equipment_id,
      site_id: 1,
      site_name: updatedAsset.current_site,
      operator_id: updatedAsset.last_operator_id,
      operator_name: updatedAsset.last_operator?.name,
      checkout_time: asset.checkout_date || new Date().toISOString(),
      expected_return_time: asset.expected_checkin_date || new Date().toISOString(),
      checkin_time: payload.checkin_time || new Date().toISOString(),
      status: 'completed',
      is_overdue: false,
      days_overdue: 0.0,
    },
    asset: updatedAsset,
  };
}

// ----------------------------------------------------------------------
// 3. Usage & Telematics Endpoints
// ----------------------------------------------------------------------

/**
 * GET /api/usage/{asset_id}
 * Retrieve telematics history and calculated metrics
 * @param {number|string} assetId
 * @param {number} [limit=30]
 */
export async function getAssetUsage(assetId, limit = 30) {
  const data = await request(`/usage/${assetId}?limit=${limit}`);
  if (data !== null) return data;

  const logs = inMemoryUsageLogs[assetId] || [
    {
      id: 999,
      asset_id: Number(assetId),
      equipment_id: `EQ-ASSET-${assetId}`,
      date: new Date().toISOString(),
      engine_hours: 6.5,
      idle_hours: 1.5,
      location: 'Site Yard'
    }
  ];

  const totalEngine = logs.reduce((sum, l) => sum + l.engine_hours, 0);
  const totalIdle = logs.reduce((sum, l) => sum + l.idle_hours, 0);
  const count = logs.length || 1;

  return {
    asset_id: Number(assetId),
    equipment_id: logs[0]?.equipment_id || `EQ-ASSET-${assetId}`,
    total_logs: logs.length,
    total_engine_hours: Number(totalEngine.toFixed(1)),
    total_idle_hours: Number(totalIdle.toFixed(1)),
    total_fuel_used_gallons: Number(logs.reduce((sum, l) => sum + (l.fuel_used_gallons || 0), 0).toFixed(1)),
    average_engine_hours_per_day: Number((totalEngine / count).toFixed(1)),
    average_idle_hours_per_day: Number((totalIdle / count).toFixed(1)),
    logs: logs.slice(0, limit),
  };
}

/**
 * POST /api/usage
 * Record daily telemetry usage log
 * @param {Object} payload - { asset_id: number, date?: string, engine_hours: number, idle_hours: number, fuel_used_gallons?: number, location?: string }
 */
export async function logUsage(payload) {
  const data = await request('/usage', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data !== null) return data;

  const newLog = {
    id: Date.now(),
    asset_id: payload.asset_id,
    equipment_id: `EQ-${payload.asset_id}`,
    date: payload.date || new Date().toISOString(),
    engine_hours: Number(payload.engine_hours),
    idle_hours: Number(payload.idle_hours),
    fuel_used_gallons: Number(payload.fuel_used_gallons || (payload.engine_hours * 3.5)),
    location: payload.location || 'Logged Location',
  };

  if (!inMemoryUsageLogs[payload.asset_id]) {
    inMemoryUsageLogs[payload.asset_id] = [];
  }
  inMemoryUsageLogs[payload.asset_id].unshift(newLog);

  return newLog;
}

// ----------------------------------------------------------------------
// 4. Analytics & Dashboard Endpoints
// ----------------------------------------------------------------------

/**
 * GET /api/dashboard/stats
 * High-level fleet KPIs and summary statistics
 */
export async function getDashboardStats() {
  const data = await request('/dashboard/stats');
  if (data !== null) return data;
  return inMemoryStats;
}

/**
 * GET /api/analytics/anomalies
 * Operational and telematics anomalies across the fleet
 */
export async function getAnomalies() {
  const data = await request('/analytics/anomalies');
  if (data !== null) return data;
  return mockAnomalies;
}

/**
 * GET /api/analytics/forecast
 * Statistical rental demand forecast by equipment category
 */
export async function getForecast() {
  const data = await request('/analytics/forecast');
  if (data !== null) return data;
  return mockForecast;
}

/**
 * GET /api/analytics/overdue
 * Currently active overdue rentals
 */
export async function getOverdue() {
  const data = await request('/analytics/overdue');
  if (data !== null) return data;
  return mockOverdue;
}

/**
 * GET /api/analytics/alerts
 * Fleet-wide alerts including overdue returns and approaching due-soon reminders (next 48h)
 */
export async function getAlerts() {
  const data = await request('/analytics/alerts');
  if (data !== null) return data;
  return {
    total_alerts: (mockOverdue.overdue_items || []).length,
    total_overdue: (mockOverdue.overdue_items || []).length,
    total_due_soon: 0,
    overdue_items: mockOverdue.overdue_items || [],
    due_soon_items: [],
  };
}

/**
 * GET /api/analytics/usage-summary
 * Aggregated fleet runtime, idle hours, fuel consumption, downtime, and site breakdown
 */
export async function getFleetUsageSummary() {
  const data = await request('/analytics/usage-summary');
  if (data !== null) return data;
  return {
    total_engine_hours: 441.1,
    total_idle_hours: 181.6,
    total_fuel_used_gallons: 1980.5,
    fleet_downtime_hours: 221.6,
    average_idle_ratio: 29.9,
    site_breakdown: [],
  };
}

// Auxiliary helpers
export async function getSites() {
  return mockSites;
}

export async function getOperators() {
  return mockOperators;
}

