from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import crud
import schemas
from services.anomaly import detect_anomalies
from services.forecasting import generate_demand_forecast
from services.recommendations import generate_recommendations
from services.optimization import generate_optimization_opportunities
from services.health import calculate_equipment_health
from services.summary import generate_fleet_summary

router = APIRouter(prefix="/api", tags=["Analytics & Intelligence"])


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


@router.get("/analytics/recommendations", response_model=schemas.RecommendationsResponse)
def get_recommendations(db: Session = Depends(get_db)):
    """
    Retrieve synthesized AI-powered fleet recommendations connecting
    anomaly detection, demand forecasting, and real-time equipment telematics.
    """
    recommendations = generate_recommendations(db)
    critical_count = sum(1 for r in recommendations if r.priority.lower() == "critical")
    high_count = sum(1 for r in recommendations if r.priority.lower() == "high")
    return schemas.RecommendationsResponse(
        total_recommendations=len(recommendations),
        critical_count=critical_count,
        high_count=high_count,
        recommendations=recommendations
    )


@router.get("/analytics/optimization", response_model=schemas.OptimizationResponse)
def get_optimization_opportunities(db: Session = Depends(get_db)):
    """
    Retrieve deterministic asset reallocation and fleet optimization opportunities
    matching underutilized or depot assets with high-demand project sites.
    """
    opportunities = generate_optimization_opportunities(db)
    return schemas.OptimizationResponse(
        total_opportunities=len(opportunities),
        opportunities=opportunities
    )


@router.get("/analytics/health", response_model=schemas.HealthResponse)
def get_equipment_health(db: Session = Depends(get_db)):
    """
    Retrieve explainable operational health and risk scores (0-100) for all fleet assets
    with factor-by-factor score deductions.
    """
    return calculate_equipment_health(db)


@router.get("/analytics/summary", response_model=schemas.FleetSummaryResponse)
def get_fleet_summary(db: Session = Depends(get_db)):
    """
    Retrieve a concise, natural-language executive summary of current fleet operations,
    utilization, active exceptions, and strategic recommendations.
    """
    return generate_fleet_summary(db)


@router.get("/analytics/overdue", response_model=schemas.OverdueResponse)
def get_overdue(db: Session = Depends(get_db)):
    """Retrieve all currently active rental transactions that have exceeded their expected checkin time."""
    alerts = crud.get_alerts(db)
    return schemas.OverdueResponse(
        total_overdue=alerts.total_overdue,
        overdue_items=alerts.overdue_items,
        due_soon_items=alerts.due_soon_items
    )


@router.get("/analytics/alerts", response_model=schemas.AlertsResponse)
def get_alerts(db: Session = Depends(get_db)):
    """Retrieve both overdue rental violations and approaching due-soon reminders (next 48h)."""
    return crud.get_alerts(db)


@router.get("/analytics/usage-summary", response_model=schemas.FleetUsageSummaryResponse)
def get_fleet_usage_summary(db: Session = Depends(get_db)):
    """Retrieve aggregated fleet runtime, idle hours, fuel consumption, downtime, and site breakdown."""
    return crud.get_fleet_usage_summary(db)
