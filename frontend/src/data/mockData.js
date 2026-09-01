// Mock data aligned with backend schemas & API Contract

export const mockSites = [
  { id: 1, site_code: "SITE-101", site_name: "Downtown Metro Rail Extension", location: "Sector 4 Metro Corridor" },
  { id: 2, site_code: "SITE-102", site_name: "North River Highway Expansion", location: "Interstate 80 North Interchange" },
  { id: 3, site_code: "SITE-103", site_name: "Greenfields Solar Farm Phase 2", location: "Valley Ridge Renewable Park" },
  { id: 4, site_code: "SITE-104", site_name: "Main Yard Depot", location: "Central Logistics Hub" },
  { id: 5, site_code: "SITE-105", site_name: "Apex Commercial Hub & Tower", location: "Financial District Zone B" },
  { id: 6, site_code: "SITE-106", site_name: "Harbor Port Logistics Terminal", location: "Deepwater Port Dock 9" }
];

export const mockOperators = [
  { id: 1, operator_code: "OP-101", name: "Marcus Vance" },
  { id: 2, operator_code: "OP-102", name: "Sarah Jenkins" },
  { id: 3, operator_code: "OP-103", name: "David Rodriguez" },
  { id: 4, operator_code: "OP-104", name: "Priya Sharma" },
  { id: 5, operator_code: "OP-105", name: "Elena Rostova" },
  { id: 6, operator_code: "OP-106", name: "Michael Chang" },
  { id: 7, operator_code: "OP-107", name: "Tyrone Washington" },
  { id: 8, operator_code: "OP-108", name: "Liam O'Connor" }
];

export const mockAssets = [
  {
    id: 1,
    equipment_id: "EQ-CAT-320",
    type: "Hydraulic Excavator",
    status: "rented",
    current_site: "Downtown Metro Rail Extension",
    checkout_date: "2026-08-27T07:35:00",
    expected_checkin_date: "2026-09-08T07:35:00",
    engine_hours_per_day: 7.5,
    idle_hours_per_day: 1.8,
    operating_days: 7,
    last_operator_id: 1,
    is_overdue: false,
    idle_ratio: 19.4,
    last_operator: { id: 1, operator_code: "OP-101", name: "Marcus Vance" }
  },
  {
    id: 2,
    equipment_id: "EQ-CAT-336",
    type: "Hydraulic Excavator",
    status: "rented",
    current_site: "North River Highway Expansion",
    checkout_date: "2026-08-10T07:35:00",
    expected_checkin_date: "2026-08-28T07:35:00",
    engine_hours_per_day: 8.2,
    idle_hours_per_day: 2.1,
    operating_days: 10,
    last_operator_id: 2,
    is_overdue: true,
    idle_ratio: 20.4,
    last_operator: { id: 2, operator_code: "OP-102", name: "Sarah Jenkins" }
  },
  {
    id: 3,
    equipment_id: "EQ-CAT-D6",
    type: "Track Bulldozer",
    status: "rented",
    current_site: "Greenfields Solar Farm Phase 2",
    checkout_date: "2026-08-24T07:35:00",
    expected_checkin_date: "2026-09-07T07:35:00",
    engine_hours_per_day: 3.2,
    idle_hours_per_day: 6.6,
    operating_days: 8,
    last_operator_id: 3,
    is_overdue: false,
    idle_ratio: 67.3,
    last_operator: { id: 3, operator_code: "OP-103", name: "David Rodriguez" }
  },
  {
    id: 4,
    equipment_id: "EQ-CAT-D8",
    type: "Track Bulldozer",
    status: "available",
    current_site: "Main Yard Depot",
    checkout_date: null,
    expected_checkin_date: null,
    engine_hours_per_day: 6.1,
    idle_hours_per_day: 1.5,
    operating_days: 5,
    last_operator_id: 4,
    is_overdue: false,
    idle_ratio: 19.7,
    last_operator: { id: 4, operator_code: "OP-104", name: "Priya Sharma" }
  },
  {
    id: 5,
    equipment_id: "EQ-CAT-950",
    type: "Wheel Loader",
    status: "rented",
    current_site: "Apex Commercial Hub & Tower",
    checkout_date: "2026-08-25T07:35:00",
    expected_checkin_date: "2026-09-05T07:35:00",
    engine_hours_per_day: 1.2,
    idle_hours_per_day: 0.8,
    operating_days: 7,
    last_operator_id: 5,
    is_overdue: false,
    idle_ratio: 40.0,
    last_operator: { id: 5, operator_code: "OP-105", name: "Elena Rostova" }
  },
  {
    id: 6,
    equipment_id: "EQ-CAT-980",
    type: "Wheel Loader",
    status: "available",
    current_site: "Main Yard Depot",
    checkout_date: null,
    expected_checkin_date: null,
    engine_hours_per_day: 7.0,
    idle_hours_per_day: 1.8,
    operating_days: 5,
    last_operator_id: null,
    is_overdue: false,
    idle_ratio: 20.5,
    last_operator: null
  },
  {
    id: 7,
    equipment_id: "EQ-CAT-420",
    type: "Backhoe Loader",
    status: "rented",
    current_site: "Downtown Metro Rail Extension",
    checkout_date: "2026-08-28T07:35:00",
    expected_checkin_date: "2026-09-06T07:35:00",
    engine_hours_per_day: 6.8,
    idle_hours_per_day: 1.4,
    operating_days: 5,
    last_operator_id: 7,
    is_overdue: false,
    idle_ratio: 17.1,
    last_operator: { id: 7, operator_code: "OP-107", name: "Tyrone Washington" }
  },
  {
    id: 8,
    equipment_id: "EQ-CAT-430",
    type: "Backhoe Loader",
    status: "rented",
    current_site: "Harbor Port Logistics Terminal",
    checkout_date: "2026-08-15T07:35:00",
    expected_checkin_date: "2026-08-30T07:35:00",
    engine_hours_per_day: 6.0,
    idle_hours_per_day: 2.0,
    operating_days: 8,
    last_operator_id: 6,
    is_overdue: true,
    idle_ratio: 25.0,
    last_operator: { id: 6, operator_code: "OP-106", name: "Michael Chang" }
  },
  {
    id: 9,
    equipment_id: "EQ-CAT-259",
    type: "Compact Track Loader",
    status: "rented",
    current_site: "North River Highway Expansion",
    checkout_date: "2026-08-26T07:35:00",
    expected_checkin_date: "2026-09-09T07:35:00",
    engine_hours_per_day: 14.8,
    idle_hours_per_day: 2.2,
    operating_days: 6,
    last_operator_id: 8,
    is_overdue: false,
    idle_ratio: 12.9,
    last_operator: { id: 8, operator_code: "OP-108", name: "Liam O'Connor" }
  },
  {
    id: 10,
    equipment_id: "EQ-CAT-272",
    type: "Compact Track Loader",
    status: "available",
    current_site: "Main Yard Depot",
    checkout_date: null,
    expected_checkin_date: null,
    engine_hours_per_day: 5.5,
    idle_hours_per_day: 1.2,
    operating_days: 4,
    last_operator_id: null,
    is_overdue: false,
    idle_ratio: 17.9,
    last_operator: null
  },
  {
    id: 11,
    equipment_id: "EQ-CAT-740",
    type: "Articulated Dump Truck",
    status: "maintenance",
    current_site: "Main Yard Depot",
    checkout_date: null,
    expected_checkin_date: null,
    engine_hours_per_day: 5.0,
    idle_hours_per_day: 1.5,
    operating_days: 3,
    last_operator_id: null,
    is_overdue: false,
    idle_ratio: 23.1,
    last_operator: null
  },
  {
    id: 12,
    equipment_id: "EQ-CAT-RT100",
    type: "Rough Terrain Crane",
    status: "rented",
    current_site: "Harbor Port Logistics Terminal",
    checkout_date: "2026-08-26T07:35:00",
    expected_checkin_date: "2026-09-12T07:35:00",
    engine_hours_per_day: 2.5,
    idle_hours_per_day: 5.8,
    operating_days: 6,
    last_operator_id: null,
    is_overdue: false,
    idle_ratio: 69.9,
    last_operator: null
  }
];

export const mockDashboardStats = {
  total_assets: 12,
  rented_assets: 8,
  available_assets: 3,
  maintenance_assets: 1,
  overdue_assets: 2,
  total_operators: 8,
  total_sites: 6,
  utilization_rate: 66.7,
  average_idle_ratio: 29.9,
  total_fleet_engine_hours: 441.1,
  total_fleet_idle_hours: 181.6,
  total_fleet_fuel_used: 1980.5,
  fleet_downtime_hours: 221.6,
  active_rentals_count: 8
};

export const mockAlerts = {
  total_alerts: 3,
  total_overdue: 2,
  total_due_soon: 1,
  overdue_items: [
    {
      equipment_id: "EQ-CAT-336",
      type: "Hydraulic Excavator",
      site: "North River Highway Expansion",
      expected_return_date: "2026-08-28T07:35:00",
      overdue_days: 4.0,
      rental_id: 2,
      operator_name: "Sarah Jenkins"
    },
    {
      equipment_id: "EQ-CAT-430",
      type: "Backhoe Loader",
      site: "Harbor Port Logistics Terminal",
      expected_return_date: "2026-08-30T07:35:00",
      overdue_days: 2.0,
      rental_id: 6,
      operator_name: "Michael Chang"
    }
  ],
  due_soon_items: [
    {
      equipment_id: "EQ-CAT-950",
      type: "Wheel Loader",
      site: "Apex Commercial Hub & Tower",
      expected_return_date: "2026-09-03T18:00:00",
      hours_remaining: 28.5,
      rental_id: 4,
      operator_name: "Elena Rostova"
    }
  ]
};

export const mockFleetUsageSummary = {
  total_engine_hours: 441.1,
  total_idle_hours: 181.6,
  total_fuel_used_gallons: 1980.5,
  fleet_downtime_hours: 221.6,
  average_idle_ratio: 29.9,
  site_breakdown: [
    { site_name: "Downtown Metro Rail Extension", active_assets: 2, total_engine_hours: 110.5, total_idle_hours: 25.4, total_fuel_used_gallons: 490.2 },
    { site_name: "North River Highway Expansion", active_assets: 2, total_engine_hours: 155.2, total_idle_hours: 32.0, total_fuel_used_gallons: 710.8 },
    { site_name: "Greenfields Solar Farm Phase 2", active_assets: 1, total_engine_hours: 26.4, total_idle_hours: 54.2, total_fuel_used_gallons: 212.0 },
    { site_name: "Apex Commercial Hub & Tower", active_assets: 1, total_engine_hours: 18.5, total_idle_hours: 8.2, total_fuel_used_gallons: 85.4 },
    { site_name: "Harbor Port Logistics Terminal", active_assets: 2, total_engine_hours: 68.5, total_idle_hours: 48.0, total_fuel_used_gallons: 360.5 },
    { site_name: "Main Yard Depot", active_assets: 0, total_engine_hours: 62.0, total_idle_hours: 13.8, total_fuel_used_gallons: 121.6 }
  ]
};

export const mockAnomalies = {
  total_anomalies: 5,
  anomalies: [
    {
      equipment_id: "EQ-CAT-RT100",
      type: "MISSING_OPERATOR",
      severity: "high",
      value: "None",
      message: "Equipment EQ-CAT-RT100 is active at site 'Harbor Port Logistics Terminal' but has no designated operator on record.",
      asset_id: 12,
      current_site: "Harbor Port Logistics Terminal"
    },
    {
      equipment_id: "EQ-CAT-336",
      type: "OVERDUE_RENTAL",
      severity: "high",
      value: "4.0 days overdue",
      message: "Equipment is overdue by 4.0 days (96.0 hrs) at North River Highway Expansion.",
      asset_id: 2,
      current_site: "North River Highway Expansion"
    },
    {
      equipment_id: "EQ-CAT-336",
      type: "UNUSUALLY_LONG_RENTAL",
      severity: "high",
      value: "22.0 days",
      message: "Rental duration has reached 22.0 days at North River Highway Expansion. Standard rental review recommended.",
      asset_id: 2,
      current_site: "North River Highway Expansion"
    },
    {
      equipment_id: "EQ-CAT-D6",
      type: "HIGH_IDLE_TIME",
      severity: "high",
      value: "67.3%",
      message: "High idle ratio of 67.3% (6.6h idle vs 3.2h engine). Fuel burn efficiency alert.",
      asset_id: 3,
      current_site: "Greenfields Solar Farm Phase 2"
    },
    {
      equipment_id: "EQ-CAT-950",
      type: "LOW_UTILIZATION",
      severity: "medium",
      value: "1.2 hrs/day",
      message: "Low utilization rate: only 1.2 hrs/day engine runtime across 7 operating days.",
      asset_id: 5,
      current_site: "Apex Commercial Hub & Tower"
    }
  ]
};

export const mockForecast = {
  forecast_generated_at: "2026-09-01T13:00:00",
  forecasts: [
    {
      equipment_type: "Hydraulic Excavator",
      current_demand: 2,
      forecast_demand: 3,
      recommendation: "High demand deficit. Forecast of 3 units exceeds fleet of 2. Recommend acquiring or cross-leasing 1 additional unit(s).",
      current_fleet_count: 2,
      projected_demand_next_7d: 3,
      projected_demand_next_14d: 3,
      projected_demand_next_30d: 6,
      utilization_trend: "INCREASING"
    },
    {
      equipment_type: "Track Bulldozer",
      current_demand: 1,
      forecast_demand: 2,
      recommendation: "Optimal supply-demand balance. Maintain standard preventive maintenance rotation.",
      current_fleet_count: 2,
      projected_demand_next_7d: 1,
      projected_demand_next_14d: 2,
      projected_demand_next_30d: 4,
      utilization_trend: "STABLE"
    },
    {
      equipment_type: "Wheel Loader",
      current_demand: 1,
      forecast_demand: 1,
      recommendation: "Stable demand profile. Surplus capacity available in central yard.",
      current_fleet_count: 2,
      projected_demand_next_7d: 1,
      projected_demand_next_14d: 1,
      projected_demand_next_30d: 2,
      utilization_trend: "STABLE"
    },
    {
      equipment_type: "Backhoe Loader",
      current_demand: 2,
      forecast_demand: 2,
      recommendation: "Fleet fully utilized across 2 active job sites.",
      current_fleet_count: 2,
      projected_demand_next_7d: 2,
      projected_demand_next_14d: 2,
      projected_demand_next_30d: 3,
      utilization_trend: "STABLE"
    },
    {
      equipment_type: "Compact Track Loader",
      current_demand: 1,
      forecast_demand: 2,
      recommendation: "Projected surge for upcoming commercial landscaping contracts.",
      current_fleet_count: 2,
      projected_demand_next_7d: 1,
      projected_demand_next_14d: 2,
      projected_demand_next_30d: 4,
      utilization_trend: "INCREASING"
    },
    {
      equipment_type: "Rough Terrain Crane",
      current_demand: 1,
      forecast_demand: 1,
      recommendation: "Continuous dedicated lease at harbor logistics dock.",
      current_fleet_count: 1,
      projected_demand_next_7d: 1,
      projected_demand_next_14d: 1,
      projected_demand_next_30d: 1,
      utilization_trend: "STABLE"
    }
  ]
};

export const mockOverdue = {
  total_overdue: 2,
  overdue_items: [
    {
      equipment_id: "EQ-CAT-336",
      type: "Hydraulic Excavator",
      site: "North River Highway Expansion",
      expected_return_date: "2026-08-28T07:35:00",
      overdue_days: 4.0,
      rental_id: 2,
      operator_name: "Sarah Jenkins"
    },
    {
      equipment_id: "EQ-CAT-430",
      type: "Backhoe Loader",
      site: "Harbor Port Logistics Terminal",
      expected_return_date: "2026-08-30T07:35:00",
      overdue_days: 2.0,
      rental_id: 6,
      operator_name: "Michael Chang"
    }
  ]
};

export const mockUsageLogs = {
  1: [
    { id: 101, asset_id: 1, equipment_id: "EQ-CAT-320", date: "2026-09-01T07:35:00", engine_hours: 7.8, idle_hours: 1.6, location: "Downtown Metro Rail Extension" },
    { id: 102, asset_id: 1, equipment_id: "EQ-CAT-320", date: "2026-08-31T07:35:00", engine_hours: 7.5, idle_hours: 1.9, location: "Downtown Metro Rail Extension" },
    { id: 103, asset_id: 1, equipment_id: "EQ-CAT-320", date: "2026-08-30T07:35:00", engine_hours: 8.0, idle_hours: 1.5, location: "Downtown Metro Rail Extension" },
    { id: 104, asset_id: 1, equipment_id: "EQ-CAT-320", date: "2026-08-29T07:35:00", engine_hours: 7.2, idle_hours: 2.0, location: "Downtown Metro Rail Extension" },
    { id: 105, asset_id: 1, equipment_id: "EQ-CAT-320", date: "2026-08-28T07:35:00", engine_hours: 7.4, idle_hours: 1.7, location: "Downtown Metro Rail Extension" }
  ],
  3: [
    { id: 106, asset_id: 3, equipment_id: "EQ-CAT-D6", date: "2026-09-01T07:35:00", engine_hours: 3.4, idle_hours: 6.8, location: "Greenfields Solar Farm Phase 2" },
    { id: 107, asset_id: 3, equipment_id: "EQ-CAT-D6", date: "2026-08-31T07:35:00", engine_hours: 3.0, idle_hours: 6.5, location: "Greenfields Solar Farm Phase 2" },
    { id: 108, asset_id: 3, equipment_id: "EQ-CAT-D6", date: "2026-08-30T07:35:00", engine_hours: 3.2, idle_hours: 7.0, location: "Greenfields Solar Farm Phase 2" },
    { id: 109, asset_id: 3, equipment_id: "EQ-CAT-D6", date: "2026-08-29T07:35:00", engine_hours: 2.9, idle_hours: 6.2, location: "Greenfields Solar Farm Phase 2" },
    { id: 110, asset_id: 3, equipment_id: "EQ-CAT-D6", date: "2026-08-28T07:35:00", engine_hours: 3.5, idle_hours: 6.6, location: "Greenfields Solar Farm Phase 2" }
  ]
};
