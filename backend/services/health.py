from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
import models
import schemas
from services.anomaly import detect_anomalies


def calculate_equipment_health(db: Session) -> schemas.HealthResponse:
    """
    Computes explainable Operational Health and Risk Scores (0-100) for all fleet equipment
    based on telematics metrics, idle ratios, active rental status, and operational anomalies.

    Scoring Baseline: 100 points (Healthy)
    Deductions:
    - High Idle Ratio >= 60%: -25 pts (Severe fuel burn & engine wear)
    - High Idle Ratio 40-59%: -15 pts (Sub-optimal idle efficiency)
    - Overdue Active Rental: -30 pts (High contractual and operational risk)
    - Excessive Daily Runtime >= 12h/d: -20 pts (Accelerated wear / missed servicing)
    - Unusually Long Rental > 14d: -15 pts (Extended field deployment)
    - Low Utilization < 2.0h/d while rented: -10 pts (Capital inefficiency)
    - Missing Operator: -15 pts (Safety & compliance violation)
    - Unscheduled Maintenance: -40 pts (Mechanical downtime)
    """
    assets = db.query(models.Asset).all()
    anomalies = detect_anomalies(db)
    now = datetime.utcnow()

    # Index anomalies by equipment_id
    asset_anomalies: Dict[str, List[schemas.AnomalyItem]] = {}
    for anom in anomalies:
        asset_anomalies.setdefault(anom.equipment_id, []).append(anom)

    health_items: List[schemas.AssetHealthItem] = []

    for asset in assets:
        score = 100
        factors: List[schemas.HealthFactor] = []
        anom_list = asset_anomalies.get(asset.equipment_id, [])

        # 1. Maintenance Status check
        if asset.status == "maintenance":
            impact = -40
            score += impact
            factors.append(
                schemas.HealthFactor(
                    metric="status_maintenance",
                    value="Undergoing Maintenance",
                    impact=impact,
                    message="Asset is currently inactive undergoing mechanical maintenance or overhaul."
                )
            )

        # 2. Overdue Rental check
        if asset.status == "rented" and asset.expected_checkin_date and asset.expected_checkin_date < now:
            days_overdue = round((now - asset.expected_checkin_date).total_seconds() / 86400, 1)
            impact = -30
            score += impact
            factors.append(
                schemas.HealthFactor(
                    metric="overdue_rental",
                    value=f"{days_overdue} days overdue",
                    impact=impact,
                    message=f"Lease is {days_overdue} days overdue, escalating operational tracking and maintenance scheduling risk."
                )
            )

        # 3. Idle Ratio check
        total_hours = (asset.engine_hours_per_day or 0.0) + (asset.idle_hours_per_day or 0.0)
        idle_pct = round(((asset.idle_hours_per_day or 0.0) / total_hours) * 100, 1) if total_hours > 0 else 0.0

        if idle_pct >= 60.0 or (asset.idle_hours_per_day or 0.0) >= 5.5:
            impact = -25
            score += impact
            factors.append(
                schemas.HealthFactor(
                    metric="high_idle_ratio",
                    value=f"{idle_pct}% ({asset.idle_hours_per_day}h/d)",
                    impact=impact,
                    message=f"Excessive idle ratio of {idle_pct}% wastes fuel and accelerates engine oil breakdown."
                )
            )
        elif idle_pct >= 40.0 or (asset.idle_hours_per_day or 0.0) >= 3.5:
            impact = -15
            score += impact
            factors.append(
                schemas.HealthFactor(
                    metric="elevated_idle_ratio",
                    value=f"{idle_pct}% ({asset.idle_hours_per_day}h/d)",
                    impact=impact,
                    message=f"Idle ratio of {idle_pct}% is above the <30% operational benchmark."
                )
            )

        # 4. Excessive Daily Runtime check
        if (asset.engine_hours_per_day or 0.0) >= 12.0:
            impact = -20
            score += impact
            factors.append(
                schemas.HealthFactor(
                    metric="excessive_daily_hours",
                    value=f"{asset.engine_hours_per_day} hrs/day",
                    impact=impact,
                    message=f"High daily duty cycle ({asset.engine_hours_per_day} hrs/day) requires expedited fluid inspection."
                )
            )

        # 5. Unusually Long Rental check
        if asset.status == "rented" and asset.checkout_date:
            rental_days = round((now - asset.checkout_date).total_seconds() / 86400, 1)
            if rental_days > 14.0:
                impact = -15
                score += impact
                factors.append(
                    schemas.HealthFactor(
                        metric="unusually_long_rental",
                        value=f"{rental_days} days deployed",
                        impact=impact,
                        message=f"Continuous field deployment of {rental_days} days without standard depot checkup."
                    )
                )

        # 6. Low Utilization check
        if asset.status == "rented" and (asset.engine_hours_per_day or 0.0) < 2.0 and (asset.operating_days or 0) >= 2:
            impact = -10
            score += impact
            factors.append(
                schemas.HealthFactor(
                    metric="low_utilization",
                    value=f"{asset.engine_hours_per_day} hrs/day",
                    impact=impact,
                    message=f"Sub-optimal productive runtime ({asset.engine_hours_per_day} hrs/day) across {asset.operating_days} site days."
                )
            )

        # 7. Missing Operator check
        if asset.status == "rented" and not asset.last_operator_id:
            impact = -15
            score += impact
            factors.append(
                schemas.HealthFactor(
                    metric="missing_operator",
                    value="Unassigned",
                    impact=impact,
                    message="No designated site operator attached in active shift register."
                )
            )

        # Clamp score between 0 and 100
        final_score = max(0, min(100, score))

        # Determine Risk Level
        if final_score >= 70:
            risk_level = "HEALTHY"
            summary = "Equipment is operating within standard operational benchmarks with low risk."
        elif final_score >= 40:
            risk_level = "WATCH"
            top_issue = factors[0].message if factors else "Operational parameters require monitoring."
            summary = f"Watch status: {top_issue}"
        else:
            risk_level = "HIGH_RISK"
            summary = "High risk: Multiple critical operational exceptions detected requiring management action."

        health_items.append(
            schemas.AssetHealthItem(
                asset_id=asset.id,
                equipment_id=asset.equipment_id,
                equipment_type=asset.type,
                current_site=asset.current_site,
                status=asset.status,
                health_score=final_score,
                risk_level=risk_level,
                factors=factors,
                summary=summary
            )
        )

    # Fleet-wide Health Metrics
    total_assets = len(health_items) or 1
    avg_health = round(sum(h.health_score for h in health_items) / total_assets, 1)
    healthy_cnt = sum(1 for h in health_items if h.risk_level == "HEALTHY")
    watch_cnt = sum(1 for h in health_items if h.risk_level == "WATCH")
    high_risk_cnt = sum(1 for h in health_items if h.risk_level == "HIGH_RISK")

    # Sort so high-risk/watch assets appear first
    health_items.sort(key=lambda x: x.health_score)

    return schemas.HealthResponse(
        fleet_average_health=avg_health,
        healthy_count=healthy_cnt,
        watch_count=watch_cnt,
        high_risk_count=high_risk_cnt,
        assets=health_items
    )
