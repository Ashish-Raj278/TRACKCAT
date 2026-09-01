from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import models
import schemas
from services.anomaly import detect_anomalies
from services.forecasting import generate_demand_forecast


def generate_optimization_opportunities(db: Session) -> List[schemas.OptimizationOpportunity]:
    """
    Evaluates fleet assets, current deployment sites, and demand forecasting
    to identify deterministic, explainable asset reallocation opportunities.

    Matching Formula:
    UNDERUTILIZED OR AVAILABLE ASSET + HIGHER PROJECTED DEMAND AT ANOTHER SITE = REALLOCATION OPPORTUNITY
    """
    assets = db.query(models.Asset).all()
    sites = db.query(models.Site).all()
    anomalies = detect_anomalies(db)
    forecasts = generate_demand_forecast(db)

    forecast_map = {f.equipment_type: f for f in forecasts}
    real_sites = [s.site_name for s in sites if s.site_name != "Central Depot"]
    opportunities: List[schemas.OptimizationOpportunity] = []

    # Map current site asset distribution by equipment type
    site_category_counts: Dict[str, Dict[str, int]] = {}
    for a in assets:
        site_name = a.current_site or "Central Depot"
        site_category_counts.setdefault(site_name, {})
        site_category_counts[site_name][a.type] = site_category_counts[site_name].get(a.type, 0) + 1

    # 1. Check underutilized rented assets (e.g. LOW_UTILIZATION anomalies)
    low_util_anomalies = [a for a in anomalies if a.type == "LOW_UTILIZATION"]
    for anom in low_util_anomalies:
        asset = next((a for a in assets if a.equipment_id == anom.equipment_id), None)
        if not asset:
            continue

        eq_type = asset.type
        current_site = asset.current_site or "Current Site"
        fcast = forecast_map.get(eq_type)

        # Determine target site: primary forecast site or site with highest demand
        recommended_site = fcast.site if (fcast and fcast.site and fcast.site != current_site) else None
        if not recommended_site or recommended_site == current_site:
            recommended_site = next((s for s in real_sites if s != current_site), "Downtown Metro Rail Extension")

        target_fleet = site_category_counts.get(recommended_site, {}).get(eq_type, 0)
        target_demand = fcast.forecast_demand if fcast else 2
        utilization_val = round((asset.engine_hours_per_day or 0.0) / 8.0 * 100, 1)

        total_h = (asset.engine_hours_per_day or 0.0) + (asset.idle_hours_per_day or 0.0)
        idle_ratio_val = round(((asset.idle_hours_per_day or 0.0) / total_h) * 100, 1) if total_h > 0 else 0.0

        opportunities.append(
            schemas.OptimizationOpportunity(
                id=f"opt-realloc-{asset.equipment_id.lower()}",
                asset_id=asset.id,
                equipment_id=asset.equipment_id,
                equipment_type=eq_type,
                current_site=current_site,
                recommended_site=recommended_site,
                current_utilization=utilization_val,
                target_demand=target_demand,
                current_target_fleet=target_fleet,
                priority="high",
                status=asset.status,
                reason=f"Asset {asset.equipment_id} is operating at only {asset.engine_hours_per_day} hrs/day ({utilization_val}% util) at '{current_site}', while projected 14-day {eq_type} demand at '{recommended_site}' is {target_demand} units (current site fleet: {target_fleet}).",
                supporting_metrics={
                    "current_engine_hours_per_day": asset.engine_hours_per_day,
                    "current_idle_ratio": idle_ratio_val,
                    "target_site_projected_demand": target_demand,
                    "target_site_current_units": target_fleet,
                    "demand_trend": fcast.trend if fcast else "increasing"
                },
                recommended_action=f"Reallocate {asset.equipment_id} from {current_site} to {recommended_site} upon next shift rotation.",
                impact=f"Projected utilization increase from {utilization_val}% to >75%; satisfies high regional project demand without acquiring new fleet."
            )
        )

    # 2. Check available depot assets where regional demand is forecast to exceed site capacity
    available_assets = [a for a in assets if a.status == "available"]
    for asset in available_assets:
        eq_type = asset.type
        fcast = forecast_map.get(eq_type)
        current_site = asset.current_site or "Main Yard Depot"

        # Check if forecast indicates high demand / deficit
        if fcast and (fcast.forecast_demand > (fcast.current_demand or 0)):
            recommended_site = fcast.site or "Downtown Metro Rail Extension"
            if recommended_site == current_site:
                recommended_site = next((s for s in real_sites if s != current_site), "Downtown Metro Rail Extension")

            target_fleet = site_category_counts.get(recommended_site, {}).get(eq_type, 0)
            target_demand = fcast.forecast_demand

            opportunities.append(
                schemas.OptimizationOpportunity(
                    id=f"opt-stage-{asset.equipment_id.lower()}",
                    asset_id=asset.id,
                    equipment_id=asset.equipment_id,
                    equipment_type=eq_type,
                    current_site=current_site,
                    recommended_site=recommended_site,
                    current_utilization=0.0,
                    target_demand=target_demand,
                    current_target_fleet=target_fleet,
                    priority="high" if (target_demand > target_fleet) else "medium",
                    status="available",
                    reason=f"Asset {asset.equipment_id} is idle in depot ({current_site}), while '{recommended_site}' has rising 14-day demand ({target_demand} units projected vs {target_fleet} on site).",
                    supporting_metrics={
                        "asset_availability": "Ready for deployment",
                        "target_site_projected_demand": target_demand,
                        "target_site_current_units": target_fleet,
                        "forecast_trend": fcast.trend
                    },
                    recommended_action=f"Stage and dispatch {asset.equipment_id} to {recommended_site} for upcoming work packages.",
                    impact="Reduces mobilization lead time to 0 hours; captures impending rental revenue."
                )
            )

    # Sort opportunities: high priority first
    priority_order = {"high": 0, "medium": 1, "low": 2}
    opportunities.sort(key=lambda x: priority_order.get(x.priority.lower(), 3))

    return opportunities
