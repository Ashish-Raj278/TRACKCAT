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
| **Rentals** | `POST` | `/api/checkout` | Check out equipment to a site & operator with return date |
| **Rentals** | `POST` | `/api/checkin` | Check in equipment, record telemetry, set status to `available` |
| **Rentals** | `GET` | `/api/rentals` | List rental transaction history |
| **Usage / Telematics** | `GET` | `/api/usage/{asset_id}` | Get telemetry logs and aggregated usage metrics for an asset |
| **Usage / Telematics** | `POST` | `/api/usage` | Record a daily telemetry log (engine hours, idle hours, location) |
| **Dashboard** | `GET` | `/api/dashboard/stats` | High-level fleet KPIs (utilization %, idle ratio %, counts) |
| **Analytics** | `GET` | `/api/analytics/anomalies` | Detected anomalies (`HIGH_IDLE_TIME`, `LOW_UTILIZATION`, `UNUSUALLY_LONG_RENTAL`, `MISSING_OPERATOR`) |
| **Analytics** | `GET` | `/api/analytics/forecast` | Demand forecast by equipment type (`current_demand`, `forecast_demand`, `recommendation`) |
| **Analytics** | `GET` | `/api/analytics/overdue` | List of overdue rentals (`equipment_id`, `type`, `site`, `expected_return_date`, `overdue_days`) |

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
  "idle_hours_operated": 1.6
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
Detect operational telematics anomalies across the fleet:
- `HIGH_IDLE_TIME`: Idle ratio $\ge 40\%$
- `LOW_UTILIZATION`: Rented equipment with $<2.0$ hrs/day runtime
- `UNUSUALLY_LONG_RENTAL`: Active rental $>14$ days
- `MISSING_OPERATOR`: Rented equipment with no operator assigned
- `OVERDUE_RENTAL`: Past expected return date

**Sample Response (`200 OK`):**
```json
{
  "total_anomalies": 6,
  "anomalies": [
    {
      "equipment_id": "EQ-CAT-RT100",
      "type": "MISSING_OPERATOR",
      "severity": "high",
      "value": "None",
      "message": "Equipment EQ-CAT-RT100 is active at site 'Harbor Port Logistics Terminal' but has no designated operator on record.",
      "asset_id": 12,
      "current_site": "Harbor Port Logistics Terminal"
    },
    {
      "equipment_id": "EQ-CAT-336",
      "type": "OVERDUE_RENTAL",
      "severity": "high",
      "value": "4.0 days overdue",
      "message": "Equipment is overdue by 4.0 days (96.0 hrs) at North River Highway Expansion.",
      "asset_id": 2,
      "current_site": "North River Highway Expansion"
    },
    {
      "equipment_id": "EQ-CAT-336",
      "type": "UNUSUALLY_LONG_RENTAL",
      "severity": "high",
      "value": "22.0 days",
      "message": "Rental duration has reached 22.0 days at North River Highway Expansion. Standard rental review recommended.",
      "asset_id": 2,
      "current_site": "North River Highway Expansion"
    },
    {
      "equipment_id": "EQ-CAT-D6",
      "type": "HIGH_IDLE_TIME",
      "severity": "high",
      "value": "66.7%",
      "message": "High idle ratio of 66.7% (6.6h idle vs 3.3h engine). Fuel burn efficiency alert.",
      "asset_id": 3,
      "current_site": "Greenfields Solar Farm Phase 2"
    },
    {
      "equipment_id": "EQ-CAT-950",
      "type": "LOW_UTILIZATION",
      "severity": "medium",
      "value": "1.2 hrs/day",
      "message": "Low utilization rate: only 1.2 hrs/day engine runtime across 7 operating days.",
      "asset_id": 5,
      "current_site": "Apex Commercial Hub & Tower"
    }
  ]
}
```

---

### `GET /api/analytics/forecast`
Statistical rental demand projections by equipment category based on historical rental transactions.

**Sample Response (`200 OK`):**
```json
{
  "forecast_generated_at": "2026-09-01T13:00:00",
  "forecasts": [
    {
      "equipment_type": "Hydraulic Excavator",
      "current_demand": 2,
      "forecast_demand": 3,
      "recommendation": "High demand deficit. Forecast of 3 units exceeds fleet of 2. Recommend acquiring or cross-leasing 1 additional unit(s).",
      "current_fleet_count": 2,
      "projected_demand_next_7d": 3,
      "projected_demand_next_14d": 3,
      "projected_demand_next_30d": 6,
      "utilization_trend": "INCREASING"
    },
    {
      "equipment_type": "Track Bulldozer",
      "current_demand": 1,
      "forecast_demand": 2,
      "recommendation": "Optimal supply-demand balance. Maintain standard preventive maintenance rotation.",
      "current_fleet_count": 2,
      "projected_demand_next_7d": 1,
      "projected_demand_next_14d": 2,
      "projected_demand_next_30d": 4,
      "utilization_trend": "STABLE"
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
