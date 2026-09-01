from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
import models
import schemas


def detect_anomalies(db: Session) -> List[schemas.AnomalyItem]:
    """
    Evaluates assets and their operational state to detect explainable anomalies:
    - HIGH_IDLE_TIME: Idle ratio >= 40% or idle hours >= 4.0 hrs/day
    - LOW_UTILIZATION: Engine hours < 2.0 hrs/day while rented
    - UNUSUALLY_LONG_RENTAL: Active rental duration > 14 days
    - MISSING_OPERATOR: Rented asset with no operator assigned
    - OVERDUE_RENTAL: Rented asset past expected checkin date
    - EXCESSIVE_DAILY_HOURS: Engine hours >= 12.0 hrs/day
    """
    assets = db.query(models.Asset).all()
    now = datetime.utcnow()
    anomalies: List[schemas.AnomalyItem] = []

    for asset in assets:
        # 1. Check MISSING_OPERATOR (rented asset with no operator assigned)
        if asset.status == "rented" and (asset.last_operator_id is None or asset.last_operator is None):
            anomalies.append(
                schemas.AnomalyItem(
                    equipment_id=asset.equipment_id,
                    type="MISSING_OPERATOR",
                    severity="high",
                    value="No assigned operator",
                    threshold="1 assigned certified operator",
                    message=f"Equipment {asset.equipment_id} is active at site '{asset.current_site or 'Unassigned'}' but has no designated operator on record.",
                    recommended_action="Assign a certified site operator immediately to ensure safety compliance and shift logging.",
                    asset_id=asset.id,
                    equipment_type=asset.type,
                    current_site=asset.current_site,
                    metrics={"operator_id": None}
                )
            )

        # 2. Check UNUSUALLY_LONG_RENTAL (active rental exceeding 14 days)
        if asset.status == "rented" and asset.checkout_date:
            rental_duration_days = (now - asset.checkout_date).total_seconds() / 86400
            if rental_duration_days > 14.0:
                severity = "medium" if rental_duration_days <= 21.0 else "high"
                anomalies.append(
                    schemas.AnomalyItem(
                        equipment_id=asset.equipment_id,
                        type="UNUSUALLY_LONG_RENTAL",
                        severity=severity,
                        value=f"{round(rental_duration_days, 1)} days",
                        threshold="14.0 days maximum standard lease",
                        message=f"Rental duration has reached {round(rental_duration_days, 1)} days at {asset.current_site or 'site'}. Standard rental review recommended.",
                        recommended_action="Review site contract duration with project supervisor; execute lease extension or schedule return intake.",
                        asset_id=asset.id,
                        equipment_type=asset.type,
                        current_site=asset.current_site,
                        metrics={"rental_duration_days": round(rental_duration_days, 1)}
                    )
                )

        # 3. Check HIGH_IDLE_TIME (idle ratio >= 40%)
        total_daily_hours = (asset.engine_hours_per_day or 0.0) + (asset.idle_hours_per_day or 0.0)
        if total_daily_hours > 0:
            idle_ratio_pct = round(((asset.idle_hours_per_day or 0.0) / total_daily_hours) * 100, 1)
            if idle_ratio_pct >= 40.0 or (asset.idle_hours_per_day or 0.0) >= 4.0:
                severity = "high" if (idle_ratio_pct >= 60.0 or (asset.idle_hours_per_day or 0) >= 5.5) else "medium"
                anomalies.append(
                    schemas.AnomalyItem(
                        equipment_id=asset.equipment_id,
                        type="HIGH_IDLE_TIME",
                        severity=severity,
                        value=f"{idle_ratio_pct}% idle ({asset.idle_hours_per_day}h/day)",
                        threshold="<30.0% idle ratio (max 3.5h/day)",
                        message=f"High idle ratio of {idle_ratio_pct}% ({asset.idle_hours_per_day}h idle vs {asset.engine_hours_per_day}h engine). Excessive fuel consumption and unnecessary hour accumulation.",
                        recommended_action="Review operator idle cutoff rules with field foreman or adjust machine auto-shutdown timer.",
                        asset_id=asset.id,
                        equipment_type=asset.type,
                        current_site=asset.current_site,
                        metrics={
                            "engine_hours_per_day": asset.engine_hours_per_day,
                            "idle_hours_per_day": asset.idle_hours_per_day,
                            "idle_ratio_pct": idle_ratio_pct
                        }
                    )
                )

        # 4. Check LOW_UTILIZATION (engine hours < 2.0 hrs/day while rented)
        if asset.status == "rented" and (asset.engine_hours_per_day or 0) < 2.0 and (asset.operating_days or 0) >= 2:
            severity = "high" if (asset.engine_hours_per_day or 0) < 1.0 else "medium"
            anomalies.append(
                schemas.AnomalyItem(
                    equipment_id=asset.equipment_id,
                    type="LOW_UTILIZATION",
                    severity=severity,
                    value=f"{asset.engine_hours_per_day} hrs/day",
                    threshold=">=4.0 hrs/day active runtime benchmark",
                    message=f"Low utilization rate: only {asset.engine_hours_per_day} hrs/day engine runtime across {asset.operating_days} operating days.",
                    recommended_action="Consider reallocating this underutilized unit to a higher-demand site or returning to depot pool.",
                    asset_id=asset.id,
                    equipment_type=asset.type,
                    current_site=asset.current_site,
                    metrics={
                        "engine_hours_per_day": asset.engine_hours_per_day,
                        "operating_days": asset.operating_days
                    }
                )
            )

        # 5. Check OVERDUE_RENTAL (past expected return date)
        if asset.status == "rented" and asset.expected_checkin_date:
            if asset.expected_checkin_date < now:
                diff = now - asset.expected_checkin_date
                days_overdue = round(diff.total_seconds() / 86400, 1)
                hours_overdue = round(diff.total_seconds() / 3600, 1)
                anomalies.append(
                    schemas.AnomalyItem(
                        equipment_id=asset.equipment_id,
                        type="OVERDUE_RENTAL",
                        severity="high",
                        value=f"{days_overdue} days overdue",
                        threshold="0.0 days overdue (on-schedule return)",
                        message=f"Equipment is overdue by {days_overdue} days ({hours_overdue} hrs) at {asset.current_site or 'site'}.",
                        recommended_action="Initiate immediate field check-in or extend lease contract to restore fleet availability.",
                        asset_id=asset.id,
                        equipment_type=asset.type,
                        current_site=asset.current_site,
                        metrics={
                            "expected_checkin_date": asset.expected_checkin_date.isoformat(),
                            "days_overdue": days_overdue,
                            "hours_overdue": hours_overdue
                        }
                    )
                )

        # 6. Check EXCESSIVE_DAILY_HOURS (engine hours >= 12.0)
        if (asset.engine_hours_per_day or 0.0) >= 12.0:
            anomalies.append(
                schemas.AnomalyItem(
                    equipment_id=asset.equipment_id,
                    type="EXCESSIVE_DAILY_HOURS",
                    severity="high",
                    value=f"{asset.engine_hours_per_day} hrs/day",
                    threshold="<10.0 hrs/day single-shift benchmark",
                    message=f"Excessive daily runtime ({asset.engine_hours_per_day} hrs/day). Equipment operating across multiple shifts without standard rest intervals.",
                    recommended_action="Schedule expedited preventive maintenance inspection and fluid check to prevent mechanical failure.",
                    asset_id=asset.id,
                    equipment_type=asset.type,
                    current_site=asset.current_site,
                    metrics={
                        "engine_hours_per_day": asset.engine_hours_per_day,
                        "idle_hours_per_day": asset.idle_hours_per_day
                    }
                )
            )

    # Sort anomalies by severity: high first, medium second, low third
    severity_rank = {"high": 0, "medium": 1, "low": 2}
    anomalies.sort(key=lambda x: severity_rank.get(x.severity, 3))
    return anomalies
