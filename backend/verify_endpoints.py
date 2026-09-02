import sys
import os
import json
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_audit_suite():
    results = []

    def record(name, endpoint, status_code, passed, details=""):
        results.append({
            "name": name,
            "endpoint": endpoint,
            "status_code": status_code,
            "passed": passed,
            "details": details
        })
        mark = "[PASS]" if passed else "[FAIL]"
        print(f"  {mark} {endpoint} -> HTTP {status_code} ({name}) {details}")

    print("\n=======================================================")
    print("CAT360 PHASE 1 + 2 RUNTIME AUDIT TEST SUITE")
    print("=======================================================")

    # 1. GET /api/assets
    res = client.get("/api/assets")
    data = res.json()
    valid_statuses = all(a["status"] in ["available", "rented", "maintenance"] for a in data)
    record("List Assets (Lowercase Statuses)", "GET /api/assets", res.status_code, 
           res.status_code == 200 and len(data) >= 10 and valid_statuses, 
           f"Returned {len(data)} assets; all statuses lowercase: {valid_statuses}")

    # 2. GET /api/assets/{id}
    res = client.get("/api/assets/1")
    data = res.json()
    record("Get Single Asset", "GET /api/assets/1", res.status_code,
           res.status_code == 200 and data.get("equipment_id") == "EQ-CAT-320",
           f"Asset: {data.get('equipment_id')}, Status: {data.get('status')}")

    # 3. GET /api/dashboard/stats
    res = client.get("/api/dashboard/stats")
    data = res.json()
    record("Dashboard Stats", "GET /api/dashboard/stats", res.status_code,
           res.status_code == 200 and data.get("total_assets") == 12,
           f"Total: {data.get('total_assets')}, Rented: {data.get('rented_assets')}, Available: {data.get('available_assets')}, Util: {data.get('utilization_rate')}%")

    # 4. GET /api/analytics/anomalies
    res = client.get("/api/analytics/anomalies")
    data = res.json()
    anomalies = data.get("anomalies", [])
    types_found = {a["type"] for a in anomalies}
    required_types = {"HIGH_IDLE_TIME", "LOW_UTILIZATION", "UNUSUALLY_LONG_RENTAL", "MISSING_OPERATOR"}
    has_all_types = required_types.issubset(types_found)
    has_required_fields = all("equipment_id" in a and "type" in a and "severity" in a and "value" in a and "message" in a for a in anomalies)
    record("Anomaly Detection", "GET /api/analytics/anomalies", res.status_code,
           res.status_code == 200 and has_all_types and has_required_fields,
           f"Types present: {types_found}; Required fields verified: {has_required_fields}")

    # 5. GET /api/analytics/forecast
    res = client.get("/api/analytics/forecast")
    data = res.json()
    forecasts = data.get("forecasts", [])
    has_forecast_fields = all("equipment_type" in f and "current_demand" in f and "forecast_demand" in f and "recommendation" in f for f in forecasts)
    record("Demand Forecasting", "GET /api/analytics/forecast", res.status_code,
           res.status_code == 200 and len(forecasts) >= 5 and has_forecast_fields,
           f"Generated forecasts for {len(forecasts)} equipment types; fields verified: {has_forecast_fields}")

    # 6. GET /api/analytics/overdue
    res = client.get("/api/analytics/overdue")
    data = res.json()
    overdue_items = data.get("overdue_items", [])
    has_overdue_fields = all("equipment_id" in o and "type" in o and "site" in o and "expected_return_date" in o and "overdue_days" in o for o in overdue_items)
    record("Overdue Rentals", "GET /api/analytics/overdue", res.status_code,
           res.status_code == 200 and len(overdue_items) >= 2 and has_overdue_fields,
           f"Found {len(overdue_items)} overdue rentals; fields verified: {has_overdue_fields}")

    # 7. GET /api/usage/{asset_id}
    res = client.get("/api/usage/1")
    data = res.json()
    record("Get Usage Logs", "GET /api/usage/1", res.status_code,
           res.status_code == 200 and len(data.get("logs", [])) > 0,
           f"Logs count: {data.get('total_logs')}, Avg Engine: {data.get('average_engine_hours_per_day')}h")

    # 8. POST /api/usage
    res = client.post("/api/usage", json={
        "asset_id": 1,
        "engine_hours": 8.0,
        "idle_hours": 1.5,
        "location": "Downtown Metro Rail Extension"
    })
    data = res.json()
    new_log_id = data.get("id")
    record("Add Usage Log", "POST /api/usage", res.status_code,
           res.status_code == 200 and data.get("engine_hours") == 8.0,
           f"Created UsageLog ID: {new_log_id}")

    # 9. Verify retrieval of that newly added usage log
    res = client.get("/api/usage/1")
    data = res.json()
    log_ids = [l["id"] for l in data.get("logs", [])]
    record("Retrieve Newly Added Usage Log", "GET /api/usage/1", res.status_code,
           res.status_code == 200 and new_log_id in log_ids,
           f"New log {new_log_id} confirmed present in asset usage logs")

    # 10. Checkout available asset (Asset 4 - EQ-CAT-D8)
    res = client.post("/api/checkout", json={
        "asset_id": 4,
        "site_id": 1,
        "operator_id": 1,
        "expected_return_time": "2026-09-20T18:00:00"
    })
    data = res.json()
    record("Checkout Available Asset", "POST /api/checkout", res.status_code,
           res.status_code == 200 and data.get("asset", {}).get("status") == "rented",
           f"Checked out EQ-CAT-D8, status is now '{data.get('asset', {}).get('status')}'")

    # 11. Attempt to checkout the same rented asset again (Verify rejection HTTP 400)
    res = client.post("/api/checkout", json={
        "asset_id": 4,
        "site_id": 2,
        "operator_id": 2,
        "expected_return_time": "2026-09-25T18:00:00"
    })
    record("Reject Double Checkout of Rented Asset", "POST /api/checkout", res.status_code,
           res.status_code == 400,
           f"Rejection detail: {res.json().get('detail')}")

    # 12. Check the asset back in
    res = client.post("/api/checkin", json={
        "asset_id": 4,
        "checkin_time": "2026-09-02T12:00:00",
        "engine_hours_operated": 5.5,
        "idle_hours_operated": 1.2
    })
    data = res.json()
    record("Check Asset Back In", "POST /api/checkin", res.status_code,
           res.status_code == 200 and data.get("asset", {}).get("status") == "available",
           f"Checked in EQ-CAT-D8, status restored to '{data.get('asset', {}).get('status')}'")

    # 13. GET /api/analytics/alerts
    res = client.get("/api/analytics/alerts")
    data = res.json()
    record("Get Fleet Alerts (Overdue & Due Soon)", "GET /api/analytics/alerts", res.status_code,
           res.status_code == 200 and "overdue_items" in data and "due_soon_items" in data,
           f"Overdue: {data.get('total_overdue')}, Due Soon: {data.get('total_due_soon')}")

    # 14. GET /api/analytics/usage-summary
    res = client.get("/api/analytics/usage-summary")
    data = res.json()
    record("Fleet Usage & Site Breakdown", "GET /api/analytics/usage-summary", res.status_code,
           res.status_code == 200 and "total_fuel_used_gallons" in data and len(data.get("site_breakdown", [])) > 0,
           f"Fuel Used: {data.get('total_fuel_used_gallons')} gal, Sites: {len(data.get('site_breakdown', []))}, Downtime: {data.get('fleet_downtime_hours')}h")

    # 15. GET /api/analytics/recommendations
    res = client.get("/api/analytics/recommendations")
    data = res.json()
    recs = data.get("recommendations", [])
    rec_types = {r["recommendation_type"] for r in recs}
    has_rec_fields = all(
        "id" in r and "recommendation_type" in r and "priority" in r and "reason" in r and "recommended_action" in r
        for r in recs
    )
    record("AI-Powered Recommendations", "GET /api/analytics/recommendations", res.status_code,
           res.status_code == 200 and len(recs) >= 3 and has_rec_fields,
           f"Total: {data.get('total_recommendations')}, Critical: {data.get('critical_count')}, Types: {rec_types}")

    # 16. GET /api/analytics/optimization
    res = client.get("/api/analytics/optimization")
    data = res.json()
    opps = data.get("opportunities", [])
    has_opp_fields = all(
        "asset_id" in o and "equipment_id" in o and "current_site" in o and "recommended_site" in o and "recommended_action" in o
        for o in opps
    )
    record("Fleet Optimization / Reallocation", "GET /api/analytics/optimization", res.status_code,
           res.status_code == 200 and len(opps) >= 1 and has_opp_fields,
           f"Total Opportunities: {data.get('total_opportunities')}")

    # 17. GET /api/analytics/health
    res = client.get("/api/analytics/health")
    data = res.json()
    assets_health = data.get("assets", [])
    has_health_fields = all(
        "equipment_id" in h and "health_score" in h and "risk_level" in h and "factors" in h and "summary" in h
        for h in assets_health
    )
    record("Equipment Health & Risk Scoring", "GET /api/analytics/health", res.status_code,
           res.status_code == 200 and len(assets_health) >= 10 and has_health_fields,
           f"Fleet Avg: {data.get('fleet_average_health')}/100, Healthy: {data.get('healthy_count')}, Watch: {data.get('watch_count')}")

    # 18. GET /api/analytics/summary
    res = client.get("/api/analytics/summary")
    data = res.json()
    has_summary = bool(data.get("summary")) and len(data.get("key_points", [])) >= 3
    record("Natural-Language Fleet Summary", "GET /api/analytics/summary", res.status_code,
           res.status_code == 200 and has_summary,
           f"Headline: '{data.get('headline')}', Key Points: {len(data.get('key_points', []))}")

    # 19. POST /api/assets/{id}/reallocate
    res_realloc = client.post("/api/assets/5/reallocate", json={"target_site": "Downtown Metro Rail Extension"})
    data_realloc = res_realloc.json()
    has_realloc = (
        res_realloc.status_code == 200 and
        data_realloc.get("success") is True and
        data_realloc.get("new_site") == "Downtown Metro Rail Extension"
    )
    record("Actionable Asset Reallocation", "POST /api/assets/5/reallocate", res_realloc.status_code,
           has_realloc,
           f"Equipment: {data_realloc.get('equipment_id')}, Moved to: '{data_realloc.get('new_site')}'")

    # 20. POST /api/demo/reset
    res_reset = client.post("/api/demo/reset")
    data_reset = res_reset.json()
    has_reset = (
        res_reset.status_code == 200 and
        data_reset.get("success") is True and
        data_reset.get("assets_restored") == 12
    )
    record("Reset Demo Data Baseline", "POST /api/demo/reset", res_reset.status_code,
           has_reset,
           f"Assets Restored: {data_reset.get('assets_restored')}, Active Rentals: {data_reset.get('rentals_restored')}")

    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)

    print("\n=======================================================")
    print(f"AUDIT SUMMARY: {passed_count}/{total_count} CHECKS PASSED")
    print("=======================================================\n")

    return passed_count == total_count

if __name__ == "__main__":
    success = run_audit_suite()
    if not success:
        sys.exit(1)
