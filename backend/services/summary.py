from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
import models
import schemas
import crud
from services.anomaly import detect_anomalies
from services.forecasting import generate_demand_forecast
from services.recommendations import generate_recommendations
from services.health import calculate_equipment_health


def generate_fleet_summary(db: Session) -> schemas.FleetSummaryResponse:
    """
    Generates a concise, plain-language executive fleet summary and key bullet points
    deterministically synthesized from current SQLite database values and analytical signals.
    """
    stats = crud.get_dashboard_stats(db)
    alerts = crud.get_alerts(db)
    anomalies = detect_anomalies(db)
    forecasts = generate_demand_forecast(db)
    recommendations = generate_recommendations(db)
    health = calculate_equipment_health(db)

    total_assets = stats.total_assets
    utilization = stats.utilization_rate
    rented_count = stats.rented_assets
    overdue_count = alerts.total_overdue
    due_soon_count = alerts.total_due_soon
    avg_health = health.fleet_average_health

    # Find top signals
    top_idle = next((a for a in anomalies if a.type == "HIGH_IDLE_TIME"), None)
    top_forecast = next((f for f in forecasts if f.trend == "increasing"), forecasts[0] if forecasts else None)
    top_realloc = next((r for r in recommendations if r.recommendation_type == "REALLOCATE"), None)
    top_overdue = next((a for a in anomalies if a.type == "OVERDUE_RENTAL"), None)

    # 1. Compose headline
    if overdue_count > 0:
      headline = f"Fleet Active ({utilization}% Util) • {overdue_count} Overdue Rental Action{'s' if overdue_count > 1 else ''} Required"
    elif due_soon_count > 0:
      headline = f"Fleet Active ({utilization}% Util) • {due_soon_count} Approaching Return Schedule{'s' if due_soon_count > 1 else ''}"
    else:
      headline = f"Fleet Operating at Optimal Capacity ({utilization}% Utilization)"

    # 2. Compose natural language paragraph
    summary_parts = []
    summary_parts.append(
        f"Fleet utilization currently stands at {utilization}% across {total_assets} heavy machinery units ({rented_count} deployed, {stats.available_assets} ready in depot)."
    )

    if overdue_count > 0:
        summary_parts.append(
            f"{overdue_count} active rental{'s are' if overdue_count > 1 else ' is'} overdue on scheduled return time and require immediate intake check-in."
        )
    elif due_soon_count > 0:
        summary_parts.append(
            f"{due_soon_count} machine{'s are' if due_soon_count > 1 else ' is'} approaching scheduled return within the next 48 hours."
        )

    if top_idle:
        summary_parts.append(
            f"{top_idle.equipment_id} at {top_idle.current_site or 'field'} exhibits elevated idle operation ({top_idle.value}), presenting a fuel conservation opportunity."
        )

    if top_forecast:
        summary_parts.append(
            f"14-day regional demand for {top_forecast.equipment_type}s is projected at {top_forecast.forecast_demand} units ({top_forecast.trend} trend)."
        )

    if top_realloc and top_realloc.equipment_id:
        summary_parts.append(
            f"{top_realloc.equipment_id} is recommended for reallocation from {top_realloc.source_site} to {top_realloc.target_site}."
        )

    full_summary = " ".join(summary_parts)

    # 3. Key bullet points
    key_points: List[str] = []

    if overdue_count > 0:
        key_points.append(
            f"Overdue Action: {overdue_count} rental(s) overdue ({', '.join(o.equipment_id for o in alerts.overdue_items[:2])}) causing unbilled availability delays."
        )
    else:
        key_points.append("Return Integrity: All deployed equipment rentals are on schedule.")

    if top_idle:
        key_points.append(
            f"Telematics Exception: {top_idle.equipment_id} logged high idle ratio ({top_idle.value}) at {top_idle.current_site}."
        )

    if top_forecast:
        key_points.append(
            f"Demand Outlook: {top_forecast.equipment_type} demand is forecast at {top_forecast.forecast_demand} units ({top_forecast.trend}) at {top_forecast.site}."
        )

    if top_realloc and top_realloc.equipment_id:
        key_points.append(
            f"Optimization: Reallocate {top_realloc.equipment_id} from {top_realloc.source_site} to {top_realloc.target_site} to satisfy incoming demand."
        )
    else:
        key_points.append(
            f"Equipment Health: Fleet average health is {avg_health}/100 ({health.healthy_count} healthy, {health.watch_count} watch, {health.high_risk_count} high-risk)."
        )

    return schemas.FleetSummaryResponse(
        summary=full_summary,
        headline=headline,
        key_points=key_points,
        generated_from={
            "total_assets": total_assets,
            "rented_assets": rented_count,
            "available_assets": stats.available_assets,
            "utilization_rate": utilization,
            "overdue_count": overdue_count,
            "due_soon_count": due_soon_count,
            "total_anomalies": len(anomalies),
            "fleet_average_health": avg_health,
            "high_risk_count": health.high_risk_count
        },
        generated_at=datetime.utcnow()
    )
