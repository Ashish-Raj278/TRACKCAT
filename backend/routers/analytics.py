from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import crud
import schemas
from services.anomaly import detect_anomalies
from services.forecasting import generate_demand_forecast

router = APIRouter(prefix="/api", tags=["Analytics & Dashboard"])


@router.get("/dashboard/stats", response_model=schemas.DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Retrieve high-level summary KPIs and metrics for the fleet intelligence dashboard."""
    return crud.get_dashboard_stats(db)


@router.get("/analytics/anomalies", response_model=schemas.AnomalyResponse)
def get_anomalies(db: Session = Depends(get_db)):
    """Retrieve detected telematics and operational anomalies across all fleet equipment."""
    anomalies = detect_anomalies(db)
    return schemas.AnomalyResponse(
        total_anomalies=len(anomalies),
        anomalies=anomalies
    )


@router.get("/analytics/forecast", response_model=schemas.ForecastResponse)
def get_forecast(db: Session = Depends(get_db)):
    """Retrieve rental demand forecasts for 7-day, 14-day, and 30-day horizons by equipment type."""
    forecasts = generate_demand_forecast(db)
    return schemas.ForecastResponse(
        forecast_generated_at=datetime.utcnow(),
        forecasts=forecasts
    )


@router.get("/analytics/overdue", response_model=schemas.OverdueResponse)
def get_overdue(db: Session = Depends(get_db)):
    """Retrieve all currently active rental transactions that have exceeded their expected checkin time."""
    overdue_list = crud.get_overdue_rentals(db)
    return schemas.OverdueResponse(
        total_overdue=len(overdue_list),
        overdue_items=overdue_list
    )
