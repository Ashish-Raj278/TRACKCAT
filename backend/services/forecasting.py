from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
import models
import schemas


def generate_demand_forecast(db: Session) -> List[schemas.ForecastItem]:
    """
    Computes explainable rental demand forecasts for each equipment type based on historical transaction frequency.
    Outputs current_demand, forecast_demand, and recommendation without external ML libraries.
    """
    assets = db.query(models.Asset).all()
    transactions = db.query(models.RentalTransaction).all()
    now = datetime.utcnow()

    # 1. Group assets by type
    type_fleet: Dict[str, List[models.Asset]] = {}
    for asset in assets:
        type_fleet.setdefault(asset.type, []).append(asset)

    # 2. Group transactions by asset type
    type_transactions: Dict[str, List[models.RentalTransaction]] = {}
    asset_type_map = {a.id: a.type for a in assets}

    for tx in transactions:
        asset_type = asset_type_map.get(tx.asset_id)
        if asset_type:
            type_transactions.setdefault(asset_type, []).append(tx)

    forecast_items: List[schemas.ForecastItem] = []

    for eq_type, type_assets in type_fleet.items():
        total_fleet = len(type_assets)
        current_demand = sum(1 for a in type_assets if a.status == "rented")
        
        # Recent checkouts (last 14 days) vs previous period (15-28 days)
        eq_txs = type_transactions.get(eq_type, [])
        txs_last_14d = [tx for tx in eq_txs if tx.checkout_time >= (now - timedelta(days=14))]
        txs_prev_14d = [tx for tx in eq_txs if (now - timedelta(days=28)) <= tx.checkout_time < (now - timedelta(days=14))]

        # Trend detection
        if len(txs_last_14d) > len(txs_prev_14d):
            trend = "INCREASING"
            growth_factor = 1.2
        elif len(txs_last_14d) < len(txs_prev_14d):
            trend = "DECREASING"
            growth_factor = 0.85
        else:
            trend = "STABLE"
            growth_factor = 1.0

        # Historical turnover velocity (average rentals per week)
        historical_checkout_velocity = max(len(eq_txs) / 4.0, 0.5)  # Rentals per week over ~4 weeks
        
        # Projections
        proj_7d = max(1, round(current_demand + (historical_checkout_velocity * 0.4 * growth_factor)))
        proj_14d = max(proj_7d, round(current_demand + (historical_checkout_velocity * 0.7 * growth_factor)))
        proj_30d = max(proj_14d, round(current_demand + (historical_checkout_velocity * 1.2 * growth_factor)))

        # Primary 14-day forecast demand
        forecast_demand = proj_14d

        # Actionable Recommendation
        if forecast_demand > total_fleet:
            deficit = forecast_demand - total_fleet
            recommendation = f"High demand deficit. Forecast of {forecast_demand} units exceeds fleet of {total_fleet}. Recommend acquiring or cross-leasing {deficit} additional unit(s)."
        elif current_demand / total_fleet >= 0.75:
            recommendation = "High utilization (>75%). Fast-track turnarounds to prevent stockouts."
        elif current_demand / total_fleet <= 0.30:
            recommendation = "Surplus capacity detected (<30% utilization). Consider reallocating idle units to higher activity job sites."
        else:
            recommendation = "Optimal supply-demand balance. Maintain standard preventive maintenance rotation."

        forecast_items.append(
            schemas.ForecastItem(
                equipment_type=eq_type,
                current_demand=current_demand,
                forecast_demand=forecast_demand,
                recommendation=recommendation,
                current_fleet_count=total_fleet,
                projected_demand_next_7d=proj_7d,
                projected_demand_next_14d=proj_14d,
                projected_demand_next_30d=proj_30d,
                utilization_trend=trend
            )
        )

    return forecast_items
