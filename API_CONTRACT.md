# TRACKCAT – Smart Rental Intelligence System
## Backend API Contract & Specification

**Base URL:** `http://localhost:8000`  
**CORS Allowed Origin:** `http://localhost:5173`, `http://127.0.0.1:5173`  
**Data Format:** JSON (`Content-Type: application/json`)  
**Authentication:** None (Open hackathon development mode)

---

## Summary of Endpoints

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Assets** | `GET` | `/api/assets` | List all assets with optional filtering (`status`, `type`, `site`) |
| **Assets** | `GET` | `/api/assets/{id}` | Get single asset details by ID |
| **Assets** | `POST` | `/api/assets/{id}/reallocate` | Reallocate an asset to an active high-demand project site |
| **Rentals** | `POST` | `/api/checkout` | Check out equipment to a site & operator with return date |
| **Rentals** | `POST` | `/api/checkin` | Check in equipment, record telemetry, set status to `available` |
| **Rentals** | `GET` | `/api/rentals` | List rental transaction history |
| **Usage / Telematics** | `GET` | `/api/usage/{asset_id}` | Get telemetry logs and aggregated usage metrics (runtime, idle, fuel) |
| **Usage / Telematics** | `POST` | `/api/usage` | Record a daily telemetry log (engine hours, idle hours, fuel, location) |
| **Dashboard** | `GET` | `/api/dashboard/stats` | High-level fleet KPIs (utilization %, idle ratio %, total fuel, downtime) |
| **Demo Management** | `POST` | `/api/demo/reset` | Restore SQLite database to its original seeded baseline demo state |
| **Analytics** | `GET` | `/api/analytics/anomalies` | Detected anomalies (`HIGH_IDLE_TIME`, `LOW_UTILIZATION`, `UNUSUALLY_LONG_RENTAL`, `MISSING_OPERATOR`, `OVERDUE_RENTAL`, `EXCESSIVE_DAILY_HOURS`) |
| **Analytics** | `GET` | `/api/analytics/forecast` | Demand forecast by equipment type (`historical_demand`, `forecast_demand`, `trend`, `recommendation_basis`) |
| **Analytics** | `GET` | `/api/analytics/recommendations` | Explainable AI-powered recommendations connecting anomalies, forecasts, and telematics |
| **Analytics** | `GET` | `/api/analytics/optimization` | Asset reallocation opportunities matching underutilized equipment with high-demand sites |
| **Analytics** | `GET` | `/api/analytics/health` | Explainable operational health & risk scoring (0-100) with factor deductions |
| **Analytics** | `GET` | `/api/analytics/summary` | Deterministic natural-language fleet executive summary and key takeaways |
| **Analytics** | `GET` | `/api/analytics/overdue` | List of overdue rentals (`equipment_id`, `type`, `site`, `expected_return_date`, `overdue_days`) |
| **Analytics** | `GET` | `/api/analytics/alerts` | Combined overdue and due-soon approaching return alerts (<48h) |
| **Analytics** | `GET` | `/api/analytics/usage-summary` | Aggregated fleet runtime, idle, fuel, downtime & site breakdown |

---

## Status Value Standards
All entity status strings are consistently **lowercase**:
- **Asset Statuses:** `"available"`, `"rented"`, `"maintenance"`
- **Rental Transaction Statuses:** `"active"`, `"completed"`

---

## 1. Assets Endpoints

### `GET /api/assets`
Retrieve a list of all heavy equipment assets.

**Query Parameters (Optional):**
- `status` (string, optional): Filter by asset status (`available`, `rented`, `maintenance`)
- `type` (string, optional): Filter by equipment type (e.g. `Hydraulic Excavator`, `Track Bulldozer`)
- `site` (string, optional): Filter by current site name

**Sample Response (`200 OK`):**
```json
[
  {
    "id": 1,
    "equipment_id": "EQ-CAT-320",
    "type": "Hydraulic Excavator",
    "status": "rented",
    "current_site": "Downtown Metro Rail Extension",
    "checkout_date": "2026-08-27T07:35:00",
    "expected_checkin_date": "2026-09-08T07:35:00",
    "engine_hours_per_day": 7.5,
    "idle_hours_per_day": 1.8,
    "operating_days": 7,
    "last_operator_id": 1,
    "is_overdue": false,
    "idle_ratio": 19.4,
    "last_operator": {
      "id": 1,
      "operator_code": "OP-101",
      "name": "Marcus Vance"
    }
  },
  {
    "id": 4,
    "equipment_id": "EQ-CAT-D8",
    "type": "Track Bulldozer",
    "status": "available",
    "current_site": "Main Yard Depot",
    "checkout_date": null,
    "expected_checkin_date": null,
    "engine_hours_per_day": 6.1,
    "idle_hours_per_day": 1.5,
    "operating_days": 5,
    "last_operator_id": 4,
    "is_overdue": false,
    "idle_ratio": 19.7,
    "last_operator": {
      "id": 4,
      "operator_code": "OP-104",
      "name": "Priya Sharma"
    }
  }
]
```

---

### `GET /api/assets/{id}`
Retrieve a single asset by its integer database ID.

**Path Parameters:**
- `id` (integer, required): Asset primary key

**Sample Response (`200 OK`):**
```json
{
  "id": 2,
  "equipment_id": "EQ-CAT-336",
  "type": "Hydraulic Excavator",
  "status": "rented",
  "current_site": "North River Highway Expansion",
  "checkout_date": "2026-08-10T07:35:00",
  "expected_checkin_date": "2026-08-28T07:35:00",
  "engine_hours_per_day": 8.3,
  "idle_hours_per_day": 2.1,
  "operating_days": 10,
  "last_operator_id": 2,
  "is_overdue": true,
  "idle_ratio": 20.2,
  "last_operator": {
    "id": 2,
    "operator_code": "OP-102",
    "name": "Sarah Jenkins"
  }
}
```

---

## 2. Rentals Endpoints

### `POST /api/checkout`
Checkout an available equipment asset to a specific site and operator with an expected return timestamp. Updates the asset's status to `rented`.

**Request Body:**
```json
{
  "asset_id": 4,
  "site_id": 2,
  "operator_id": 3,
  "expected_return_time": "2026-09-15T18:00:00Z"
}
```

**Sample Response (`200 OK`):**
```json
{
  "message": "Equipment EQ-CAT-D8 successfully checked out to North River Highway Expansion.",
  "rental": {
    "id": 27,
    "asset_id": 4,
    "equipment_id": "EQ-CAT-D8",
    "site_id": 2,
    "site_name": "North River Highway Expansion",
    "operator_id": 3,
    "operator_name": "David Rodriguez",
    "checkout_time": "2026-09-01T13:00:00",
    "expected_return_time": "2026-09-15T18:00:00",
    "checkin_time": null,
    "status": "active",
    "is_overdue": false,
    "days_overdue": 0.0
  },
  "asset": {
    "id": 4,
    "equipment_id": "EQ-CAT-D8",
    "type": "Track Bulldozer",
    "status": "rented",
    "current_site": "North River Highway Expansion",
    "checkout_date": "2026-09-01T13:00:00",
    "expected_checkin_date": "2026-09-15T18:00:00",
    "engine_hours_per_day": 6.1,
    "idle_hours_per_day": 1.5,
    "operating_days": 5,
    "last_operator_id": 3,
    "is_overdue": false,
    "idle_ratio": 19.7,
    "last_operator": {
      "id": 3,
      "operator_code": "OP-103",
      "name": "David Rodriguez"
    }
  }
}
```

**Error Response (`400 Bad Request`):**
```json
{
  "detail": "Asset EQ-CAT-320 is already checked out (status: rented)."
}
```

---

### `POST /api/checkin`
Check in an active rental. Closes the rental transaction (status `completed`), logs checkin telematics (if supplied), and sets asset status back to `available`.

**Request Body:**
```json
{
  "asset_id": 1,
  "checkin_time": "2026-09-01T13:00:00Z",
  "engine_hours_operated": 7.8,
  "idle_hours_operated": 1.6,
  "fuel_used_gallons": 28.5
}
```

**Sample Response (`200 OK`):**
```json
{
  "message": "Equipment EQ-CAT-320 successfully checked in. Status is now available.",
  "rental": {
    "id": 1,
    "asset_id": 1,
    "equipment_id": "EQ-CAT-320",
    "site_id": 1,
    "site_name": "Downtown Metro Rail Extension",
    "operator_id": 1,
    "operator_name": "Marcus Vance",
    "checkout_time": "2026-08-27T07:35:00",
    "expected_return_time": "2026-09-08T07:35:00",
    "checkin_time": "2026-09-01T13:00:00",
    "status": "completed",
    "is_overdue": false,
    "days_overdue": 0.0
  },
  "asset": {
    "id": 1,
    "equipment_id": "EQ-CAT-320",
    "type": "Hydraulic Excavator",
    "status": "available",
    "current_site": "Downtown Metro Rail Extension",
    "checkout_date": null,
    "expected_checkin_date": null,
    "engine_hours_per_day": 7.5,
    "idle_hours_per_day": 1.7,
    "operating_days": 8,
    "last_operator_id": 1,
    "is_overdue": false,
    "idle_ratio": 18.5,
    "last_operator": {
      "id": 1,
      "operator_code": "OP-101",
      "name": "Marcus Vance"
    }
  }
}
```

---

## 3. Usage & Telematics Endpoints

### `GET /api/usage/{asset_id}`
Retrieve historical telemetry records and summary statistics for a given asset.

**Path Parameters:**
- `asset_id` (integer, required): Asset primary key

**Sample Response (`200 OK`):**
```json
{
  "asset_id": 3,
  "equipment_id": "EQ-CAT-D6",
  "total_logs": 8,
  "total_engine_hours": 25.6,
  "total_idle_hours": 52.8,
  "average_engine_hours_per_day": 3.2,
  "average_idle_hours_per_day": 6.6,
  "logs": [
    {
      "id": 18,
      "asset_id": 3,
      "equipment_id": "EQ-CAT-D6",
      "date": "2026-09-01T07:35:00",
      "engine_hours": 3.4,
      "idle_hours": 6.8,
      "location": "Greenfields Solar Farm Phase 2"
    }
  ]
}
```

---

### `POST /api/usage`
Push a new daily telematics log for an asset. Automatically recalculates rolling engine and idle averages.

**Request Body:**
```json
{
  "asset_id": 3,
  "date": "2026-09-01T12:00:00Z",
  "engine_hours": 3.5,
  "idle_hours": 6.8,
  "location": "Greenfields Solar Farm Phase 2"
}
```

**Sample Response (`200 OK`):**
```json
{
  "id": 61,
  "asset_id": 3,
  "equipment_id": "EQ-CAT-D6",
  "date": "2026-09-01T12:00:00",
  "engine_hours": 3.5,
  "idle_hours": 6.8,
  "location": "Greenfields Solar Farm Phase 2"
}
```

---

## 4. Analytics & Dashboard Endpoints

### `GET /api/dashboard/stats`
Retrieve high-level KPIs for the rental intelligence dashboard overview.

**Sample Response (`200 OK`):**
```json
{
  "total_assets": 12,
  "rented_assets": 8,
  "available_assets": 3,
  "maintenance_assets": 1,
  "overdue_assets": 2,
  "total_operators": 8,
  "total_sites": 5,
  "utilization_rate": 66.7,
  "average_idle_ratio": 29.9,
  "total_fleet_engine_hours": 441.1,
  "total_fleet_idle_hours": 181.6,
  "active_rentals_count": 8
}
```

---

### `GET /api/analytics/anomalies`
Detect operational telematics anomalies across the fleet using explainable deterministic benchmarks:
- `HIGH_IDLE_TIME`: Idle ratio $\ge 40\%$ or idle hours $\ge 4.0$ hrs/day
- `LOW_UTILIZATION`: Rented equipment with $<2.0$ hrs/day runtime
- `UNUSUALLY_LONG_RENTAL`: Active rental $>14$ days
- `MISSING_OPERATOR`: Rented equipment with no operator assigned
- `OVERDUE_RENTAL`: Past expected return date
- `EXCESSIVE_DAILY_HOURS`: Engine hours $\ge 12.0$ hrs/day

**Sample Response (`200 OK`):**
```json
{
  "total_anomalies": 6,
  "anomalies": [
    {
      "equipment_id": "EQ-CAT-336",
      "type": "OVERDUE_RENTAL",
      "severity": "high",
      "value": "4.3 days overdue",
      "threshold": "0.0 days overdue (on-schedule return)",
      "message": "Equipment is overdue by 4.3 days (102.9 hrs) at North River Highway Expansion.",
      "recommended_action": "Initiate immediate field check-in or extend lease contract to restore fleet availability.",
      "asset_id": 2,
      "equipment_type": "Hydraulic Excavator",
      "current_site": "North River Highway Expansion",
      "metrics": {
        "days_overdue": 4.3,
        "hours_overdue": 102.9
      }
    },
    {
      "equipment_id": "EQ-CAT-D6",
      "type": "HIGH_IDLE_TIME",
      "severity": "high",
      "value": "68.0% idle (6.6h/day)",
      "threshold": "<30.0% idle ratio (max 3.5h/day)",
      "message": "High idle ratio of 68.0% (6.6h idle vs 3.2h engine). Excessive fuel consumption and unnecessary hour accumulation.",
      "recommended_action": "Review operator idle cutoff rules with field foreman or adjust machine auto-shutdown timer.",
      "asset_id": 3,
      "equipment_type": "Track Bulldozer",
      "current_site": "Greenfields Solar Farm Phase 2",
      "metrics": {
        "engine_hours_per_day": 3.2,
        "idle_hours_per_day": 6.6,
        "idle_ratio_pct": 68.0
      }
    },
    {
      "equipment_id": "EQ-CAT-950",
      "type": "LOW_UTILIZATION",
      "severity": "medium",
      "value": "1.1 hrs/day",
      "threshold": ">=4.0 hrs/day active runtime benchmark",
      "message": "Low utilization rate: only 1.1 hrs/day engine runtime across 7 operating days.",
      "recommended_action": "Consider reallocating this underutilized unit to a higher-demand site or returning to depot pool.",
      "asset_id": 5,
      "equipment_type": "Wheel Loader",
      "current_site": "Apex Commercial Hub & Tower",
      "metrics": {
        "engine_hours_per_day": 1.1,
        "operating_days": 7
      }
    }
  ]
}
```

---

### `GET /api/analytics/forecast`
Statistical rental demand projections across 7-day, 14-day, and 30-day horizons based on historical rental transactions, recent checkout velocity, and fleet size.

**Sample Response (`200 OK`):**
```json
{
  "forecast_generated_at": "2026-09-01T23:30:00",
  "forecasts": [
    {
      "equipment_type": "Hydraulic Excavator",
      "site": "Downtown Metro Rail Extension",
      "historical_demand": 8,
      "current_demand": 2,
      "forecast_demand": 3,
      "trend": "increasing",
      "forecast_period": "14d",
      "recommendation_basis": "Recent rental frequency (2 checkouts in last 14d vs 0 prior) is increasing compared with historical average.",
      "recommendation": "High demand deficit. Forecast of 3 units exceeds fleet of 2. Recommend pre-positioning or cross-leasing 1 additional unit(s).",
      "current_fleet_count": 2,
      "projected_demand_next_7d": 2,
      "projected_demand_next_14d": 3,
      "projected_demand_next_30d": 5,
      "utilization_trend": "INCREASING"
    }
  ]
}
```

---

### `GET /api/analytics/recommendations`
Synthesized AI-powered fleet recommendations connecting operational anomalies, demand forecasting, and real-time equipment telematics into actionable fleet management decisions.

**Recommendation Types:**
- `RETURN`: Trigger return check-in or contract renewal for overdue assets.
- `INVESTIGATE_IDLE`: Audit operator idle cutoff rules and activate auto-shutdown timer on high-idle machines.
- `REALLOCATE`: Move underutilized machines to sites experiencing high projected demand.
- `REASSIGN`: Attach certified operators to active machines with missing operator records.
- `PRE_POSITION`: Stage extra units from depot pool or cross-lease partners before demand deficit occurs.

**Sample Response (`200 OK`):**
```json
{
  "total_recommendations": 6,
  "critical_count": 2,
  "high_count": 4,
  "recommendations": [
    {
      "id": "rec-ret-eq-cat-336",
      "recommendation_type": "RETURN",
      "priority": "critical",
      "equipment_id": "EQ-CAT-336",
      "equipment_type": "Hydraulic Excavator",
      "source_site": "North River Highway Expansion",
      "target_site": "Central Yard Depot",
      "reason": "Asset EQ-CAT-336 is overdue on return schedule by 4.3 days, causing fleet availability blindspots.",
      "supporting_metrics": {
        "days_overdue": 4.3,
        "equipment_type": "Hydraulic Excavator",
        "current_site": "North River Highway Expansion"
      },
      "recommended_action": "Initiate field return check-in or execute lease extension for EQ-CAT-336.",
      "impact": "Restores fleet capacity for upcoming bookings; mitigates unbilled utilization loss."
    },
    {
      "id": "rec-realloc-eq-cat-950",
      "recommendation_type": "REALLOCATE",
      "priority": "high",
      "equipment_id": "EQ-CAT-950",
      "equipment_type": "Wheel Loader",
      "source_site": "Apex Commercial Hub & Tower",
      "target_site": "Downtown Metro Rail Extension",
      "reason": "Asset EQ-CAT-950 is underutilized at 'Apex Commercial Hub & Tower' (1.1 hrs/day), while regional 14-day Wheel Loader demand is projected at 2 units.",
      "supporting_metrics": {
        "engine_hours_per_day": 1.1,
        "target_site_projected_demand": 2,
        "equipment_type": "Wheel Loader",
        "utilization_trend": "INCREASING"
      },
      "recommended_action": "Reallocate EQ-CAT-950 from Apex Commercial Hub & Tower to Downtown Metro Rail Extension to fulfill upcoming project demand.",
      "impact": "Increases asset utilization from ~20% to >75%; prevents third-party cross-rental costs."
    },
    {
      "id": "rec-idle-eq-cat-d6",
      "recommendation_type": "INVESTIGATE_IDLE",
      "priority": "high",
      "equipment_id": "EQ-CAT-D6",
      "equipment_type": "Track Bulldozer",
      "source_site": "Greenfields Solar Farm Phase 2",
      "target_site": null,
      "reason": "Excessive idle ratio (68.0%, 6.6h/day) recorded at Greenfields Solar Farm Phase 2. Significant fuel waste and unbilled engine depreciation.",
      "supporting_metrics": {
        "idle_ratio_pct": 68.0,
        "idle_hours_per_day": 6.6,
        "current_site": "Greenfields Solar Farm Phase 2"
      },
      "recommended_action": "Audit operator shift logs with site foreman for EQ-CAT-D6 and activate auto-shutdown timer (5-min cutoff).",
      "impact": "Estimated savings of 12-18 gallons of diesel per week; extends engine service interval."
    }
  ]
}
```

---

### `GET /api/analytics/overdue`
Retrieve all active rental transactions that are currently overdue past their expected return date.

**Sample Response (`200 OK`):**
```json
{
  "total_overdue": 2,
  "overdue_items": [
    {
      "equipment_id": "EQ-CAT-336",
      "type": "Hydraulic Excavator",
      "site": "North River Highway Expansion",
      "expected_return_date": "2026-08-28T07:35:00",
      "overdue_days": 4.0,
      "rental_id": 2,
      "operator_name": "Sarah Jenkins"
    },
    {
      "equipment_id": "EQ-CAT-430",
      "type": "Backhoe Loader",
      "site": "Harbor Port Logistics Terminal",
      "expected_return_date": "2026-08-30T07:35:00",
      "overdue_days": 2.0,
      "rental_id": 6,
      "operator_name": "Michael Chang"
    }
  ]
}
```

---

### `GET /api/analytics/alerts`
Retrieve dynamic fleet return schedule alerts categorized by severity:
- **`OVERDUE`** (`severity: critical`): Active rentals where current time exceeds `expected_return_time`.
- **`DUE_SOON`** (`severity: warning`): Active rentals scheduled for return within the next 24 hours.

Alerts are sorted with critical overdue violations first (ordered by longest overdue), followed by warning approaching return reminders (ordered by soonest due).

**Sample Response (`200 OK`):**
```json
{
  "total_alerts": 4,
  "critical_count": 2,
  "warning_count": 2,
  "alerts": [
    {
      "id": "overdue-2",
      "type": "OVERDUE",
      "severity": "critical",
      "equipment_id": "EQ-CAT-336",
      "asset_type": "Hydraulic Excavator",
      "site": "North River Highway Expansion",
      "expected_return_time": "2026-08-28T07:35:00",
      "overdue_hours": 96.0,
      "hours_remaining": null,
      "overdue_days": 4.0,
      "message": "EQ-CAT-336 is overdue by 4 days and 0 hours at North River Highway Expansion.",
      "rental_id": 2,
      "operator_name": "Sarah Jenkins"
    },
    {
      "id": "overdue-6",
      "type": "OVERDUE",
      "severity": "critical",
      "equipment_id": "EQ-CAT-430",
      "asset_type": "Backhoe Loader",
      "site": "Harbor Port Logistics Terminal",
      "expected_return_time": "2026-08-30T07:35:00",
      "overdue_hours": 48.0,
      "hours_remaining": null,
      "overdue_days": 2.0,
      "message": "EQ-CAT-430 is overdue by 2 days and 0 hours at Harbor Port Logistics Terminal.",
      "rental_id": 6,
      "operator_name": "Michael Chang"
    },
    {
      "id": "due-soon-1",
      "type": "DUE_SOON",
      "severity": "warning",
      "equipment_id": "EQ-CAT-320",
      "asset_type": "Hydraulic Excavator",
      "site": "Downtown Metro Rail Extension",
      "expected_return_time": "2026-09-01T16:00:00",
      "overdue_hours": null,
      "hours_remaining": 6.0,
      "overdue_days": null,
      "message": "EQ-CAT-320 is due for return in approximately 6 hours at Downtown Metro Rail Extension.",
      "rental_id": 1,
      "operator_name": "Marcus Vance"
    },
    {
      "id": "due-soon-4",
      "type": "DUE_SOON",
      "severity": "warning",
      "equipment_id": "EQ-CAT-950",
      "asset_type": "Wheel Loader",
      "site": "Apex Commercial Hub & Tower",
      "expected_return_time": "2026-09-02T00:00:00",
      "overdue_hours": null,
      "hours_remaining": 14.0,
      "overdue_days": null,
      "message": "EQ-CAT-950 is due for return in approximately 14 hours at Apex Commercial Hub & Tower.",
      "rental_id": 4,
      "operator_name": "James Buck Miller"
    }
  ],
  "total_overdue": 2,
  "total_due_soon": 2,
  "overdue_items": [ ... ],
  "due_soon_items": [ ... ]
}
```

---

### `GET /api/analytics/optimization`
Deterministic asset reallocation opportunities matching underutilized or depot units with active high-demand project sites based on 14-day forecasts.

**Sample Response (`200 OK`):**
```json
{
  "total_opportunities": 2,
  "opportunities": [
    {
      "id": "opt-realloc-eq-cat-950",
      "asset_id": 5,
      "equipment_id": "EQ-CAT-950",
      "equipment_type": "Wheel Loader",
      "current_site": "Apex Commercial Hub & Tower",
      "recommended_site": "Downtown Metro Rail Extension",
      "current_utilization": 15.0,
      "target_demand": 2,
      "current_target_fleet": 1,
      "priority": "high",
      "status": "rented",
      "reason": "Asset EQ-CAT-950 is operating at only 1.2 hrs/day (15.0% util) at 'Apex Commercial Hub & Tower', while projected 14-day Wheel Loader demand at 'Downtown Metro Rail Extension' is 2 units (current site fleet: 1).",
      "supporting_metrics": {
        "current_engine_hours_per_day": 1.2,
        "current_idle_ratio": 30.7,
        "target_site_projected_demand": 2,
        "target_site_current_units": 1,
        "demand_trend": "increasing"
      },
      "recommended_action": "Reallocate EQ-CAT-950 from Apex Commercial Hub & Tower to Downtown Metro Rail Extension upon next shift rotation.",
      "impact": "Projected utilization increase from 15.0% to >75%; satisfies high regional project demand without acquiring new fleet."
    }
  ]
}
```

---

### `GET /api/analytics/health`
Explainable operational health and risk scores (0-100) across all fleet assets with factor-by-factor score deductions.

**Health Baseline:** 100 points
**Risk Categories:** `HEALTHY` (70–100), `WATCH` (40–69), `HIGH_RISK` (0–39)

**Sample Response (`200 OK`):**
```json
{
  "fleet_average_health": 81.2,
  "healthy_count": 9,
  "watch_count": 3,
  "high_risk_count": 0,
  "assets": [
    {
      "asset_id": 2,
      "equipment_id": "EQ-CAT-336",
      "equipment_type": "Hydraulic Excavator",
      "current_site": "North River Highway Expansion",
      "status": "rented",
      "health_score": 55,
      "risk_level": "WATCH",
      "factors": [
        {
          "metric": "overdue_rental",
          "value": "4.0 days overdue",
          "impact": -30,
          "message": "Lease is 4.0 days overdue, escalating operational tracking and maintenance scheduling risk."
        },
        {
          "metric": "unusually_long_rental",
          "value": "22.0 days deployed",
          "impact": -15,
          "message": "Continuous field deployment of 22.0 days without standard depot checkup."
        }
      ],
]
}
```

---

### `GET /api/analytics/overdue`
Retrieve all active rental transactions that are currently overdue past their expected return date.

**Sample Response (`200 OK`):**
```json
{
  "total_overdue": 2,
  "overdue_items": [
    {
      "equipment_id": "EQ-CAT-336",
      "type": "Hydraulic Excavator",
      "site": "North River Highway Expansion",
      "expected_return_date": "2026-08-28T07:35:00",
      "overdue_days": 4.0,
      "rental_id": 2,
      "operator_name": "Sarah Jenkins"
    },
    {
      "equipment_id": "EQ-CAT-430",
      "type": "Backhoe Loader",
      "site": "Harbor Port Logistics Terminal",
      "expected_return_date": "2026-08-30T07:35:00",
      "overdue_days": 2.0,
      "rental_id": 6,
      "operator_name": "Michael Chang"
    }
  ]
}
```

---

### `GET /api/analytics/alerts`
Retrieve dynamic fleet return schedule alerts categorized by severity:
- **`OVERDUE`** (`severity: critical`): Active rentals where current time exceeds `expected_return_time`.
- **`DUE_SOON`** (`severity: warning`): Active rentals scheduled for return within the next 24 hours.

Alerts are sorted with critical overdue violations first (ordered by longest overdue), followed by warning approaching return reminders (ordered by soonest due).

**Sample Response (`200 OK`):**
```json
{
  "total_alerts": 4,
  "critical_count": 2,
  "warning_count": 2,
  "alerts": [
    {
      "id": "overdue-2",
      "type": "OVERDUE",
      "severity": "critical",
      "equipment_id": "EQ-CAT-336",
      "asset_type": "Hydraulic Excavator",
      "site": "North River Highway Expansion",
      "expected_return_time": "2026-08-28T07:35:00",
      "overdue_hours": 96.0,
      "hours_remaining": null,
      "overdue_days": 4.0,
      "message": "EQ-CAT-336 is overdue by 4 days and 0 hours at North River Highway Expansion.",
      "rental_id": 2,
      "operator_name": "Sarah Jenkins"
    },
    {
      "id": "overdue-6",
      "type": "OVERDUE",
      "severity": "critical",
      "equipment_id": "EQ-CAT-430",
      "asset_type": "Backhoe Loader",
      "site": "Harbor Port Logistics Terminal",
      "expected_return_time": "2026-08-30T07:35:00",
      "overdue_hours": 48.0,
      "hours_remaining": null,
      "overdue_days": 2.0,
      "message": "EQ-CAT-430 is overdue by 2 days and 0 hours at Harbor Port Logistics Terminal.",
      "rental_id": 6,
      "operator_name": "Michael Chang"
    },
    {
      "id": "due-soon-1",
      "type": "DUE_SOON",
      "severity": "warning",
      "equipment_id": "EQ-CAT-320",
      "asset_type": "Hydraulic Excavator",
      "site": "Downtown Metro Rail Extension",
      "expected_return_time": "2026-09-01T16:00:00",
      "overdue_hours": null,
      "hours_remaining": 6.0,
      "overdue_days": null,
      "message": "EQ-CAT-320 is due for return in approximately 6 hours at Downtown Metro Rail Extension.",
      "rental_id": 1,
      "operator_name": "Marcus Vance"
    },
    {
      "id": "due-soon-4",
      "type": "DUE_SOON",
      "severity": "warning",
      "equipment_id": "EQ-CAT-950",
      "asset_type": "Wheel Loader",
      "site": "Apex Commercial Hub & Tower",
      "expected_return_time": "2026-09-02T00:00:00",
      "overdue_hours": null,
      "hours_remaining": 14.0,
      "overdue_days": null,
      "message": "EQ-CAT-950 is due for return in approximately 14 hours at Apex Commercial Hub & Tower.",
      "rental_id": 4,
      "operator_name": "James Buck Miller"
    }
  ],
  "total_overdue": 2,
  "total_due_soon": 2,
  "overdue_items": [ ... ],
  "due_soon_items": [ ... ]
}
```

---

### `GET /api/analytics/optimization`
Deterministic asset reallocation opportunities matching underutilized or depot units with active high-demand project sites based on 14-day forecasts.

**Sample Response (`200 OK`):**
```json
{
  "total_opportunities": 2,
  "opportunities": [
    {
      "id": "opt-realloc-eq-cat-950",
      "asset_id": 5,
      "equipment_id": "EQ-CAT-950",
      "equipment_type": "Wheel Loader",
      "current_site": "Apex Commercial Hub & Tower",
      "recommended_site": "Downtown Metro Rail Extension",
      "current_utilization": 15.0,
      "target_demand": 2,
      "current_target_fleet": 1,
      "priority": "high",
      "status": "rented",
      "reason": "Asset EQ-CAT-950 is operating at only 1.2 hrs/day (15.0% util) at 'Apex Commercial Hub & Tower', while projected 14-day Wheel Loader demand at 'Downtown Metro Rail Extension' is 2 units (current site fleet: 1).",
      "supporting_metrics": {
        "current_engine_hours_per_day": 1.2,
        "current_idle_ratio": 30.7,
        "target_site_projected_demand": 2,
        "target_site_current_units": 1,
        "demand_trend": "increasing"
      },
      "recommended_action": "Reallocate EQ-CAT-950 from Apex Commercial Hub & Tower to Downtown Metro Rail Extension upon next shift rotation.",
      "impact": "Projected utilization increase from 15.0% to >75%; satisfies high regional project demand without acquiring new fleet."
    }
  ]
}
```

---

### `GET /api/analytics/health`
Explainable operational health and risk scores (0-100) across all fleet assets with factor-by-factor score deductions.

**Health Baseline:** 100 points
**Risk Categories:** `HEALTHY` (70–100), `WATCH` (40–69), `HIGH_RISK` (0–39)

**Sample Response (`200 OK`):**
```json
{
  "fleet_average_health": 81.2,
  "healthy_count": 9,
  "watch_count": 3,
  "high_risk_count": 0,
  "assets": [
    {
      "asset_id": 2,
      "equipment_id": "EQ-CAT-336",
      "equipment_type": "Hydraulic Excavator",
      "current_site": "North River Highway Expansion",
      "status": "rented",
      "health_score": 55,
      "risk_level": "WATCH",
      "factors": [
        {
          "metric": "overdue_rental",
          "value": "4.0 days overdue",
          "impact": -30,
          "message": "Lease is 4.0 days overdue, escalating operational tracking and maintenance scheduling risk."
        },
        {
          "metric": "unusually_long_rental",
          "value": "22.0 days deployed",
          "impact": -15,
          "message": "Continuous field deployment of 22.0 days without standard depot checkup."
        }
      ],
      "summary": "Watch status: Lease is 4.0 days overdue, escalating operational tracking and maintenance scheduling risk."
    }
  ]
}
```

---

### `GET /api/analytics/summary`
Natural-language executive fleet summary and key takeaways deterministically synthesized from real-time database metrics and analytical signals.

**Sample Response (`200 OK`):**
```json
{
  "summary": "Fleet utilization currently stands at 66.7% across 12 heavy machinery units (8 deployed, 3 ready in depot). 2 active rentals are overdue on scheduled return time and require immediate intake check-in. EQ-CAT-D6 at Greenfields Solar Farm Phase 2 exhibits elevated idle operation (67.3% idle), presenting a fuel conservation opportunity. 14-day regional demand for Backhoe Loaders is projected at 3 units (increasing trend). EQ-CAT-950 is recommended for reallocation from Apex Commercial Hub & Tower to Downtown Metro Rail Extension.",
  "headline": "Fleet Active (66.7% Util) • 2 Overdue Rental Actions Required",
  "key_points": [
    "Overdue Action: 2 rental(s) overdue (EQ-CAT-336, EQ-CAT-430) causing unbilled availability delays.",
    "Telematics Exception: EQ-CAT-D6 logged high idle ratio (67.3% idle) at Greenfields Solar Farm Phase 2.",
    "Demand Outlook: Backhoe Loader demand is forecast at 3 units (increasing) at Downtown Metro Rail Extension.",
    "Optimization: Reallocate EQ-CAT-950 from Apex Commercial Hub & Tower to Downtown Metro Rail Extension to satisfy incoming demand."
  ],
  "generated_from": {
    "total_assets": 12,
    "rented_assets": 8,
    "available_assets": 3,
    "utilization_rate": 66.7,
    "overdue_count": 2,
    "due_soon_count": 2,
    "total_anomalies": 6,
    "fleet_average_health": 81.2,
    "high_risk_count": 0
  },
  "generated_at": "2026-09-02T00:00:00"
}
```

---

### `POST /api/assets/{id}/reallocate`
Performs an operational reallocation of an equipment asset to a new project site. Validates target site existence, prevents duplicate stationing, updates active rental site mapping, and records a telematics transfer event.

**Sample Request (`POST /api/assets/5/reallocate`):**
```json
{
  "target_site": "Downtown Metro Rail Extension"
}
```

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "message": "EQ-CAT-950 successfully reallocated from Apex Commercial Hub & Tower to Downtown Metro Rail Extension.",
  "asset_id": 5,
  "equipment_id": "EQ-CAT-950",
  "previous_site": "Apex Commercial Hub & Tower",
  "new_site": "Downtown Metro Rail Extension"
}
```

---

### `POST /api/demo/reset`
Restores the local SQLite database to the original seeded hackathon demo state. Resets all 12 assets, 8 active rentals, 71 telematics logs, overdue violations, anomalies, optimization matches, and health scores.

**Sample Request:**
```http
POST /api/demo/reset
```

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Demo data successfully restored to original baseline state.",
  "assets_restored": 12,
  "rentals_restored": 8,
  "sites_restored": 5,
  "usage_logs_restored": 71
}
```
