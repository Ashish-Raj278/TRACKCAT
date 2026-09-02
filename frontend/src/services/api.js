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
 * Fleet alerts: OVERDUE (critical) and DUE_SOON (warning) sorted by priority
 */
export async function getAlerts() {
  const data = await request('/analytics/alerts');
  if (data !== null) return data;
  const overdueAlerts = (mockOverdue.overdue_items || []).map((o, i) => ({
    id: `overdue-${i + 1}`,
    type: 'OVERDUE',
    severity: 'critical',
    equipment_id: o.equipment_id,
    asset_type: o.type,
    site: o.site,
    expected_return_time: o.expected_return_date,
    overdue_hours: o.hours_overdue || o.overdue_days * 24,
    overdue_days: o.overdue_days,
    hours_remaining: null,
    message: `${o.equipment_id} is overdue by ${o.overdue_days} day(s).`,
    rental_id: o.rental_id,
    operator_name: o.operator_name,
  }));
  return {
    total_alerts: overdueAlerts.length,
    critical_count: overdueAlerts.length,
    warning_count: 0,
    alerts: overdueAlerts,
    total_overdue: overdueAlerts.length,
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

/**
 * GET /api/analytics/recommendations
 * Explainable AI-powered recommendations connecting anomalies, forecasting, and telematics
 */
export async function getRecommendations() {
  const data = await request('/analytics/recommendations');
  if (data !== null) return data;
  return {
    total_recommendations: 3,
    critical_count: 1,
    high_count: 2,
    recommendations: [
      {
        id: 'rec-ret-eq-cat-336',
        recommendation_type: 'RETURN',
        priority: 'critical',
        equipment_id: 'EQ-CAT-336',
        equipment_type: 'Hydraulic Excavator',
        source_site: 'North River Highway Expansion',
        target_site: 'Central Yard Depot',
        reason: 'Asset EQ-CAT-336 is overdue on return schedule by 4.3 days, causing fleet availability blindspots.',
        supporting_metrics: {
          days_overdue: 4.3,
          equipment_type: 'Hydraulic Excavator',
          current_site: 'North River Highway Expansion'
        },
        recommended_action: 'Initiate field return check-in or execute lease extension for EQ-CAT-336.',
        impact: 'Restores fleet capacity for upcoming bookings; mitigates unbilled utilization loss.'
      },
      {
        id: 'rec-realloc-eq-cat-950',
        recommendation_type: 'REALLOCATE',
        priority: 'high',
        equipment_id: 'EQ-CAT-950',
        equipment_type: 'Wheel Loader',
        source_site: 'Apex Commercial Hub & Tower',
        target_site: 'Downtown Metro Rail Extension',
        reason: 'Asset EQ-CAT-950 is underutilized at Apex Commercial Hub (1.1 hrs/day), while regional Wheel Loader demand is projected at 2 units.',
        supporting_metrics: {
          engine_hours_per_day: 1.1,
          target_site_projected_demand: 2,
          equipment_type: 'Wheel Loader',
          utilization_trend: 'INCREASING'
        },
        recommended_action: 'Reallocate EQ-CAT-950 from Apex Commercial Hub to Downtown Metro Rail Extension to fulfill upcoming project demand.',
        impact: 'Increases asset utilization from ~20% to >75%; prevents third-party cross-rental costs.'
      },
      {
        id: 'rec-idle-eq-cat-d6',
        recommendation_type: 'INVESTIGATE_IDLE',
        priority: 'high',
        equipment_id: 'EQ-CAT-D6',
        equipment_type: 'Track Bulldozer',
        source_site: 'Greenfields Solar Farm Phase 2',
        target_site: null,
        reason: 'Excessive idle ratio (68.0%, 6.6h/day) recorded at Greenfields Solar Farm Phase 2. Significant fuel waste and unbilled engine depreciation.',
        supporting_metrics: {
          idle_ratio_pct: 68.0,
          idle_hours_per_day: 6.6,
          current_site: 'Greenfields Solar Farm Phase 2'
        },
        recommended_action: 'Audit operator shift logs with site foreman for EQ-CAT-D6 and activate auto-shutdown timer (5-min cutoff).',
        impact: 'Estimated savings of 12-18 gallons of diesel per week; extends engine service interval.'
      }
    ]
  };
}

/**
 * GET /api/analytics/optimization
 * Deterministic asset reallocation and fleet optimization opportunities
 */
export async function getOptimization() {
  const data = await request('/analytics/optimization');
  if (data !== null) return data;
  return {
    total_opportunities: 1,
    opportunities: [
      {
        id: 'opt-realloc-eq-cat-950',
        asset_id: 5,
        equipment_id: 'EQ-CAT-950',
        equipment_type: 'Wheel Loader',
        current_site: 'Apex Commercial Hub & Tower',
        recommended_site: 'Downtown Metro Rail Extension',
        current_utilization: 15.0,
        target_demand: 2,
        current_target_fleet: 1,
        priority: 'high',
        status: 'rented',
        reason: 'Asset EQ-CAT-950 is operating at only 1.2 hrs/day (15.0% util) at Apex Commercial Hub, while projected 14-day Wheel Loader demand at Downtown Metro Rail Extension is 2 units.',
        supporting_metrics: {
          current_engine_hours_per_day: 1.2,
          current_idle_ratio: 30.7,
          target_site_projected_demand: 2,
          target_site_current_units: 1,
          demand_trend: 'increasing'
        },
        recommended_action: 'Reallocate EQ-CAT-950 from Apex Commercial Hub to Downtown Metro Rail Extension upon next shift rotation.',
        impact: 'Projected utilization increase from 15.0% to >75%; satisfies high regional project demand without acquiring new fleet.'
      }
    ]
  };
}

/**
 * GET /api/analytics/health
 * Operational health and risk scores across all fleet equipment
 */
export async function getHealth() {
  const data = await request('/analytics/health');
  if (data !== null) return data;
  return {
    fleet_average_health: 81.2,
    healthy_count: 9,
    watch_count: 3,
    high_risk_count: 0,
    assets: [
      {
        asset_id: 2,
        equipment_id: 'EQ-CAT-336',
        equipment_type: 'Hydraulic Excavator',
        current_site: 'North River Highway Expansion',
        status: 'rented',
        health_score: 55,
        risk_level: 'WATCH',
        factors: [
          {
            metric: 'overdue_rental',
            value: '4.0 days overdue',
            impact: -30,
            message: 'Lease is 4.0 days overdue, escalating operational tracking and maintenance scheduling risk.'
          },
          {
            metric: 'unusually_long_rental',
            value: '22.0 days deployed',
            impact: -15,
            message: 'Continuous field deployment of 22.0 days without standard depot checkup.'
          }
        ],
        summary: 'Watch status: Lease is 4.0 days overdue, escalating operational tracking and maintenance scheduling risk.'
      }
    ]
  };
}

/**
 * GET /api/analytics/summary
 * Natural-language executive fleet summary and key takeaways
 */
export async function getFleetSummary() {
  const data = await request('/analytics/summary');
  if (data !== null) return data;
  return {
    summary: 'Fleet utilization currently stands at 66.7% across 12 heavy machinery units (8 deployed, 3 ready in depot). 2 active rentals are overdue on scheduled return time and require immediate intake check-in. EQ-CAT-D6 at Greenfields Solar Farm Phase 2 exhibits elevated idle operation (67.3% idle), presenting a fuel conservation opportunity. 14-day regional demand for Backhoe Loaders is projected at 3 units (increasing trend). EQ-CAT-950 is recommended for reallocation from Apex Commercial Hub & Tower to Downtown Metro Rail Extension.',
    headline: 'Fleet Active (66.7% Util) • 2 Overdue Rental Actions Required',
    key_points: [
      'Overdue Action: 2 rental(s) overdue (EQ-CAT-336, EQ-CAT-430) causing unbilled availability delays.',
      'Telematics Exception: EQ-CAT-D6 logged high idle ratio (67.3% idle) at Greenfields Solar Farm Phase 2.',
      'Demand Outlook: Backhoe Loader demand is forecast at 3 units (increasing) at Downtown Metro Rail Extension.',
      'Optimization: Reallocate EQ-CAT-950 from Apex Commercial Hub & Tower to Downtown Metro Rail Extension to satisfy incoming demand.'
    ],
    generated_from: {
      total_assets: 12,
      rented_assets: 8,
      available_assets: 3,
      utilization_rate: 66.7,
      overdue_count: 2,
      due_soon_count: 2,
      total_anomalies: 6,
      fleet_average_health: 81.2,
      high_risk_count: 0
    },
    generated_at: new Date().toISOString()
  };
}

// Auxiliary helpers
export async function getSites() {
  return mockSites;
}

export async function getOperators() {
  return mockOperators;
}

/**
 * POST /api/assets/{id}/reallocate
 * Reallocate equipment asset to a new project site
 * @param {number|string} assetId
 * @param {string} targetSite
 */
export async function reallocateAsset(assetId, targetSite) {
  const data = await request(`/assets/${assetId}/reallocate`, {
    method: 'POST',
    body: JSON.stringify({ target_site: targetSite }),
  });
  if (data !== null) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trackcat-asset-updated'));
    }
    return data;
  }

  // Fallback in-memory state update
  const assetIndex = inMemoryAssets.findIndex(a => String(a.id) === String(assetId));
  const prevSite = assetIndex !== -1 ? inMemoryAssets[assetIndex].current_site : 'Depot';
  if (assetIndex !== -1) {
    inMemoryAssets[assetIndex].current_site = targetSite;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trackcat-asset-updated'));
  }
  return {
    success: true,
    message: `Asset successfully reallocated to ${targetSite}.`,
    asset_id: Number(assetId),
    equipment_id: assetIndex !== -1 ? inMemoryAssets[assetIndex].equipment_id : `EQ-${assetId}`,
    previous_site: prevSite,
    new_site: targetSite
  };
}

/**
 * POST /api/demo/reset
 * Restore SQLite database and demo state to initial seed baseline
 */
export async function resetDemoData() {
  const data = await request('/demo/reset', {
    method: 'POST',
  });
  // Reset in-memory stores as well
  inMemoryAssets = JSON.parse(JSON.stringify(mockAssets));
  inMemoryStats = JSON.parse(JSON.stringify(mockDashboardStats));
  inMemoryUsageLogs = JSON.parse(JSON.stringify(mockUsageLogs));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trackcat-asset-updated'));
  }
  if (data !== null) return data;
  return {
    success: true,
    message: 'Demo data successfully restored.',
    assets_restored: 12,
    rentals_restored: 8,
    sites_restored: 5,
    usage_logs_restored: 71
  };
}
