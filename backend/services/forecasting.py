from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
import models
import schemas


def generate_demand_forecast(db: Session) -> List[schemas.ForecastItem]:
    """
    Computes explainable rental demand forecasts for each equipment category
    based on actual historical transaction velocity, recent demand trends, and fleet utilization.

    Methodology:
    - Analyzes past checkouts across 14-day rolling windows (recent vs previous 14d)
    - Determines directional trend (increasing, decreasing, stable)
    - Projects 7-day, 14-day, and 30-day demand horizons using weighted turnover velocity
    - Maps primary active job site with highest rental concentration
    - Generates plain-language recommendation basis
    """
    assets = db.query(models.Asset).all()
    transactions = db.query(models.RentalTransaction).all()
    sites = db.query(models.Site).all()
    now = datetime.utcnow()

    site_map = {s.id: s.site_name for s in sites}

    # 1. Group assets by type
    type_fleet: Dict[str, List[models.Asset]] = {}
    asset_type_map: Dict[int, str] = {}
    for asset in assets:
        type_fleet.setdefault(asset.type, []).append(asset)
        asset_type_map[asset.id] = asset.type

    # 2. Group transactions by asset type
    type_transactions: Dict[str, List[models.RentalTransaction]] = {}
    type_site_counts: Dict[str, Dict[str, int]] = {}

    for tx in transactions:
        asset_type = asset_type_map.get(tx.asset_id)
        if asset_type:
            type_transactions.setdefault(asset_type, []).append(tx)
            site_name = site_map.get(tx.site_id, "Central Depot")
            type_site_counts.setdefault(asset_type, {})
            type_site_counts[asset_type][site_name] = type_site_counts[asset_type].get(site_name, 0) + 1

    forecast_items: List[schemas.ForecastItem] = []

    for eq_type, type_assets in type_fleet.items():
        total_fleet = len(type_assets)
        current_demand = sum(1 for a in type_assets if a.status == "rented")
        
        # Historical transaction metrics
        eq_txs = type_transactions.get(eq_type, [])
        total_historical_checkouts = len(eq_txs)

        # Recent checkouts (last 14 days) vs previous period (15-28 days)
        txs_last_14d = [tx for tx in eq_txs if tx.checkout_time >= (now - timedelta(days=14))]
        txs_prev_14d = [tx for tx in eq_txs if (now - timedelta(days=28)) <= tx.checkout_time < (now - timedelta(days=14))]

        # Primary deployment site for this equipment type
        site_counts = type_site_counts.get(eq_type, {})
        primary_site = max(site_counts, key=site_counts.get) if site_counts else "Downtown Metro Rail Extension"

        # Directional trend calculation
        if len(txs_last_14d) > len(txs_prev_14d):
            trend = "increasing"
            growth_factor = 1.25
            trend_label = "INCREASING"
            basis_text = f"Recent rental frequency ({len(txs_last_14d)} checkouts in last 14d vs {len(txs_prev_14d)} prior) is increasing compared with historical average."
        elif len(txs_last_14d) < len(txs_prev_14d):
            trend = "decreasing"
            growth_factor = 0.85
            trend_label = "DECREASING"
            basis_text = f"Recent rental activity ({len(txs_last_14d)} checkouts in last 14d) shows cooling demand compared with historical baseline."
        else:
            trend = "stable"
            growth_factor = 1.0
            trend_label = "STABLE"
            basis_text = f"Rental frequency ({len(txs_last_14d)} checkouts in last 14d) remains steady with predictable project cycles."

        # Turnover velocity (average checkouts per week over ~4 weeks)
        historical_checkout_velocity = max(total_historical_checkouts / 4.0, 0.5)
        
        # Projections across horizons (7d, 14d, 30d)
        proj_7d = max(1, round(current_demand + (historical_checkout_velocity * 0.35 * growth_factor)))
        proj_14d = max(proj_7d, round(current_demand + (historical_checkout_velocity * 0.70 * growth_factor)))
        proj_30d = max(proj_14d, round(current_demand + (historical_checkout_velocity * 1.25 * growth_factor)))

        # Primary 14-day forecast demand
        forecast_demand = proj_14d

        # Actionable Recommendation
        if forecast_demand > total_fleet:
            deficit = forecast_demand - total_fleet
            recommendation = f"High demand deficit. Forecast of {forecast_demand} units exceeds fleet of {total_fleet}. Recommend pre-positioning or cross-leasing {deficit} additional unit(s)."
        elif current_demand / total_fleet >= 0.75:
            recommendation = "High fleet utilization (>75%). Fast-track turnarounds and stage replacement units at active job sites."
        elif current_demand / total_fleet <= 0.30:
            recommendation = "Surplus capacity detected (<30% utilization). Consider reallocating idle units to higher-activity project corridors."
        else:
            recommendation = "Optimal supply-demand balance. Maintain standard preventive maintenance rotation."

        forecast_items.append(
            schemas.ForecastItem(
                equipment_type=eq_type,
                site=primary_site,
                historical_demand=total_historical_checkouts,
                current_demand=current_demand,
                forecast_demand=forecast_demand,
                trend=trend,
                forecast_period="14d",
                recommendation_basis=basis_text,
                recommendation=recommendation,
                current_fleet_count=total_fleet,
                projected_demand_next_7d=proj_7d,
                projected_demand_next_14d=proj_14d,
                projected_demand_next_30d=proj_30d,
                utilization_trend=trend_label
            )
        )

    # Sort so highest forecast demand / deficit appears first
    forecast_items.sort(key=lambda x: (x.forecast_demand - (x.current_fleet_count or 0)), reverse=True)
    return forecast_items
