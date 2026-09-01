from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import schemas


def _enrich_asset_metrics(asset: models.Asset) -> None:
    """Helper to attach computed properties to an Asset model instance."""
    now = datetime.utcnow()
    total_hours = (asset.engine_hours_per_day or 0.0) + (asset.idle_hours_per_day or 0.0)
    asset.idle_ratio = round(((asset.idle_hours_per_day or 0.0) / total_hours) * 100, 1) if total_hours > 0 else 0.0
    
    asset.is_overdue = bool(
        asset.status == "rented" and 
        asset.expected_checkin_date and 
        asset.expected_checkin_date < now
    )


def _enrich_rental_metrics(rental: models.RentalTransaction) -> None:
    """Helper to attach computed properties to a RentalTransaction model instance."""
    now = datetime.utcnow()
    is_overdue = bool(
        rental.status == "active" and 
        rental.expected_return_time < now
    )
    rental.is_overdue = is_overdue
    if is_overdue:
        diff = now - rental.expected_return_time
        rental.days_overdue = round(diff.total_seconds() / 86400, 1)
    else:
        rental.days_overdue = 0.0

    if rental.asset:
        rental.equipment_id = rental.asset.equipment_id
    if rental.site:
        rental.site_name = rental.site.site_name
    if rental.operator:
        rental.operator_name = rental.operator.name


# ----------------------------------------------------
# Asset CRUD
# ----------------------------------------------------
def get_assets(
    db: Session,
    status: Optional[str] = None,
    asset_type: Optional[str] = None,
    site: Optional[str] = None
) -> List[models.Asset]:
    query = db.query(models.Asset)
    if status:
        query = query.filter(models.Asset.status.ilike(f"%{status.lower()}%"))
    if asset_type:
        query = query.filter(models.Asset.type.ilike(f"%{asset_type}%"))
    if site:
        query = query.filter(models.Asset.current_site.ilike(f"%{site}%"))
    
    assets = query.all()
    for a in assets:
        _enrich_asset_metrics(a)
    return assets


def get_asset(db: Session, asset_id: int) -> Optional[models.Asset]:
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if asset:
        _enrich_asset_metrics(asset)
    return asset


def get_asset_by_equipment_id(db: Session, equipment_id: str) -> Optional[models.Asset]:
    asset = db.query(models.Asset).filter(models.Asset.equipment_id == equipment_id).first()
    if asset:
        _enrich_asset_metrics(asset)
    return asset


# ----------------------------------------------------
# Operator & Site CRUD
# ----------------------------------------------------
def get_operators(db: Session) -> List[models.Operator]:
    return db.query(models.Operator).all()


def get_sites(db: Session) -> List[models.Site]:
    return db.query(models.Site).all()


# ----------------------------------------------------
# Rental CRUD & Checkout / Checkin Business Logic
# ----------------------------------------------------
def checkout_asset(
    db: Session,
    checkout_data: schemas.CheckoutRequest
) -> Tuple[models.RentalTransaction, models.Asset]:
    asset = db.query(models.Asset).filter(models.Asset.id == checkout_data.asset_id).first()
    if not asset:
        raise ValueError(f"Asset with ID {checkout_data.asset_id} not found.")
    
    if asset.status == "rented":
        raise ValueError(f"Asset {asset.equipment_id} is already checked out (status: rented).")
    elif asset.status == "maintenance":
        raise ValueError(f"Asset {asset.equipment_id} is currently in maintenance and cannot be checked out.")
    elif asset.status != "available":
        raise ValueError(f"Asset {asset.equipment_id} is not available for checkout (current status: {asset.status}).")

    site = db.query(models.Site).filter(models.Site.id == checkout_data.site_id).first()
    if not site:
        raise ValueError(f"Site with ID {checkout_data.site_id} not found.")

    if checkout_data.operator_id:
        operator = db.query(models.Operator).filter(models.Operator.id == checkout_data.operator_id).first()
        if not operator:
            raise ValueError(f"Operator with ID {checkout_data.operator_id} not found.")
        op_id = operator.id
    else:
        op_id = None

    now = datetime.utcnow()

    # Create rental transaction
    rental = models.RentalTransaction(
        asset_id=asset.id,
        site_id=site.id,
        operator_id=op_id,
        checkout_time=now,
        expected_return_time=checkout_data.expected_return_time,
        status="active"
    )
    db.add(rental)

    # Update asset state
    asset.status = "rented"
    asset.current_site = site.site_name
    asset.checkout_date = now
    asset.expected_checkin_date = checkout_data.expected_return_time
    asset.last_operator_id = op_id

    db.commit()
    db.refresh(rental)
    db.refresh(asset)

    _enrich_asset_metrics(asset)
    _enrich_rental_metrics(rental)
    return rental, asset


def checkin_asset(
    db: Session,
    checkin_data: schemas.CheckinRequest
) -> Tuple[models.RentalTransaction, models.Asset]:
    asset = db.query(models.Asset).filter(models.Asset.id == checkin_data.asset_id).first()
    if not asset:
        raise ValueError(f"Asset with ID {checkin_data.asset_id} not found.")

    # Find the active rental transaction
    rental = db.query(models.RentalTransaction).filter(
        models.RentalTransaction.asset_id == asset.id,
        models.RentalTransaction.status == "active"
    ).order_by(models.RentalTransaction.checkout_time.desc()).first()

    if not rental:
        raise ValueError(f"No active rental transaction found for asset {asset.equipment_id}.")

    now = checkin_data.checkin_time or datetime.utcnow()
    rental.checkin_time = now
    rental.status = "completed"

    # If telemetry hours logged during checkin
    if checkin_data.engine_hours_operated is not None:
        usage = models.UsageLog(
            asset_id=asset.id,
            date=now,
            engine_hours=checkin_data.engine_hours_operated,
            idle_hours=checkin_data.idle_hours_operated or 0.0,
            location=asset.current_site
        )
        db.add(usage)

    # Update Asset status to available
    asset.status = "available"
    asset.checkout_date = None
    asset.expected_checkin_date = None

    db.commit()
    db.refresh(rental)
    db.refresh(asset)

    # Recalculate asset average metrics from logs
    recalculate_asset_metrics(db, asset.id)
    db.refresh(asset)

    _enrich_asset_metrics(asset)
    _enrich_rental_metrics(rental)
    return rental, asset


def get_rentals(
    db: Session,
    status: Optional[str] = None,
    asset_id: Optional[int] = None
) -> List[models.RentalTransaction]:
    query = db.query(models.RentalTransaction)
    if status:
        query = query.filter(models.RentalTransaction.status == status.lower())
    if asset_id:
        query = query.filter(models.RentalTransaction.asset_id == asset_id)
    rentals = query.order_by(models.RentalTransaction.checkout_time.desc()).all()
    for r in rentals:
        _enrich_rental_metrics(r)
    return rentals


def get_overdue_rentals(db: Session) -> List[schemas.OverdueItem]:
    """
    Returns active rentals where expected_return_time < now AND asset is still rented / not checked in.
    Each item contains equipment_id, type, site, expected_return_date, overdue_days.
    """
    now = datetime.utcnow()
    active_rentals = db.query(models.RentalTransaction).filter(
        models.RentalTransaction.status == "active",
        models.RentalTransaction.expected_return_time < now
    ).all()

    overdue_items: List[schemas.OverdueItem] = []
    for r in active_rentals:
        diff = now - r.expected_return_time
        days_overdue = round(diff.total_seconds() / 86400, 1)
        hours_overdue = round(diff.total_seconds() / 3600, 1)

        overdue_items.append(
            schemas.OverdueItem(
                equipment_id=r.asset.equipment_id if r.asset else f"ID-{r.asset_id}",
                type=r.asset.type if r.asset else "Unknown",
                site=r.site.site_name if r.site else (r.asset.current_site if r.asset else "Unassigned"),
                expected_return_date=r.expected_return_time,
                overdue_days=days_overdue,
                rental_id=r.id,
                operator_name=r.operator.name if r.operator else "Unassigned",
                checkout_time=r.checkout_time,
                hours_overdue=hours_overdue
            )
        )
    return overdue_items


# ----------------------------------------------------
# Usage Log CRUD & Metric Calculation
# ----------------------------------------------------
def create_usage_log(db: Session, usage_in: schemas.UsageLogCreate) -> Tuple[models.UsageLog, models.Asset]:
    asset = db.query(models.Asset).filter(models.Asset.id == usage_in.asset_id).first()
    if not asset:
        raise ValueError(f"Asset with ID {usage_in.asset_id} not found.")

    log = models.UsageLog(
        asset_id=usage_in.asset_id,
        date=usage_in.date or datetime.utcnow(),
        engine_hours=usage_in.engine_hours,
        idle_hours=usage_in.idle_hours,
        location=usage_in.location or asset.current_site
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    recalculate_asset_metrics(db, asset.id)
    db.refresh(asset)

    if asset:
        log.equipment_id = asset.equipment_id

    _enrich_asset_metrics(asset)
    return log, asset


def recalculate_asset_metrics(db: Session, asset_id: int) -> None:
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        return

    logs = db.query(models.UsageLog).filter(models.UsageLog.asset_id == asset_id).all()
    if not logs:
        return

    count = len(logs)
    total_engine = sum(l.engine_hours for l in logs)
    total_idle = sum(l.idle_hours for l in logs)

    asset.operating_days = count
    asset.engine_hours_per_day = round(total_engine / count, 1)
    asset.idle_hours_per_day = round(total_idle / count, 1)
    db.commit()


def get_usage_logs(db: Session, asset_id: int, limit: int = 30) -> schemas.AssetUsageListResponse:
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise ValueError(f"Asset with ID {asset_id} not found.")

    logs = db.query(models.UsageLog).filter(
        models.UsageLog.asset_id == asset_id
    ).order_by(models.UsageLog.date.desc()).limit(limit).all()

    for l in logs:
        l.equipment_id = asset.equipment_id

    total_engine = round(sum(l.engine_hours for l in logs), 1)
    total_idle = round(sum(l.idle_hours for l in logs), 1)
    count = len(logs)

    avg_engine = round(total_engine / count, 1) if count > 0 else 0.0
    avg_idle = round(total_idle / count, 1) if count > 0 else 0.0

    return schemas.AssetUsageListResponse(
        asset_id=asset.id,
        equipment_id=asset.equipment_id,
        total_logs=count,
        total_engine_hours=total_engine,
        total_idle_hours=total_idle,
        average_engine_hours_per_day=avg_engine,
        average_idle_hours_per_day=avg_idle,
        logs=logs
    )


# ----------------------------------------------------
# Dashboard Summary Stats
# ----------------------------------------------------
def get_dashboard_stats(db: Session) -> schemas.DashboardStatsResponse:
    assets = db.query(models.Asset).all()
    now = datetime.utcnow()

    total_assets = len(assets)
    rented_assets = 0
    available_assets = 0
    maintenance_assets = 0
    overdue_assets = 0

    total_engine_sum = 0.0
    total_idle_sum = 0.0
    idle_ratios: List[float] = []

    for a in assets:
        if a.status == "available":
            available_assets += 1
        elif a.status == "maintenance":
            maintenance_assets += 1
        elif a.status == "rented":
            rented_assets += 1
            if a.expected_checkin_date and a.expected_checkin_date < now:
                overdue_assets += 1

        tot_h = (a.engine_hours_per_day or 0.0) + (a.idle_hours_per_day or 0.0)
        if tot_h > 0:
            ratio = ((a.idle_hours_per_day or 0.0) / tot_h) * 100
            idle_ratios.append(ratio)

    all_logs = db.query(models.UsageLog).all()
    total_engine_sum = round(sum(l.engine_hours for l in all_logs), 1)
    total_idle_sum = round(sum(l.idle_hours for l in all_logs), 1)

    total_operators = db.query(models.Operator).count()
    total_sites = db.query(models.Site).count()
    active_rentals = db.query(models.RentalTransaction).filter(
        models.RentalTransaction.status == "active"
    ).count()

    utilization_rate = round((rented_assets / total_assets * 100), 1) if total_assets > 0 else 0.0
    average_idle_ratio = round(sum(idle_ratios) / len(idle_ratios), 1) if idle_ratios else 0.0

    return schemas.DashboardStatsResponse(
        total_assets=total_assets,
        rented_assets=rented_assets,
        available_assets=available_assets,
        maintenance_assets=maintenance_assets,
        overdue_assets=overdue_assets,
        total_operators=total_operators,
        total_sites=total_sites,
        utilization_rate=utilization_rate,
        average_idle_ratio=average_idle_ratio,
        total_fleet_engine_hours=total_engine_sum,
        total_fleet_idle_hours=total_idle_sum,
        active_rentals_count=active_rentals
    )
