from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


# ----------------------------------------------------
# Operator Schemas
# ----------------------------------------------------
class OperatorBase(BaseModel):
    operator_code: str
    name: str


class OperatorCreate(OperatorBase):
    pass


class OperatorResponse(OperatorBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Site Schemas
# ----------------------------------------------------
class SiteBase(BaseModel):
    site_code: str
    site_name: str
    location: str


class SiteCreate(SiteBase):
    pass


class SiteResponse(SiteBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Asset Schemas
# ----------------------------------------------------
class AssetBase(BaseModel):
    equipment_id: str
    type: str
    status: str = "available"  # available, rented, maintenance
    current_site: Optional[str] = None
    checkout_date: Optional[datetime] = None
    expected_checkin_date: Optional[datetime] = None
    engine_hours_per_day: float = 0.0
    idle_hours_per_day: float = 0.0
    operating_days: int = 0
    last_operator_id: Optional[int] = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    type: Optional[str] = None
    status: Optional[str] = None
    current_site: Optional[str] = None
    checkout_date: Optional[datetime] = None
    expected_checkin_date: Optional[datetime] = None
    engine_hours_per_day: Optional[float] = None
    idle_hours_per_day: Optional[float] = None
    operating_days: Optional[int] = None
    last_operator_id: Optional[int] = None


class AssetResponse(AssetBase):
    id: int
    last_operator: Optional[OperatorResponse] = None
    is_overdue: bool = False
    idle_ratio: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Rental Transaction Schemas
# ----------------------------------------------------
class CheckoutRequest(BaseModel):
    asset_id: int
    site_id: int
    operator_id: Optional[int] = None
    expected_return_time: datetime


class CheckinRequest(BaseModel):
    asset_id: int
    checkin_time: Optional[datetime] = None
    engine_hours_operated: Optional[float] = None
    idle_hours_operated: Optional[float] = None
    fuel_used_gallons: Optional[float] = None


class RentalTransactionResponse(BaseModel):
    id: int
    asset_id: int
    equipment_id: Optional[str] = None
    site_id: int
    site_name: Optional[str] = None
    operator_id: Optional[int] = None
    operator_name: Optional[str] = None
    checkout_time: datetime
    expected_return_time: datetime
    checkin_time: Optional[datetime] = None
    status: str = "active"  # active, completed
    is_overdue: bool = False
    days_overdue: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class CheckoutActionResponse(BaseModel):
    message: str
    rental: RentalTransactionResponse
    asset: AssetResponse


class CheckinActionResponse(BaseModel):
    message: str
    rental: RentalTransactionResponse
    asset: AssetResponse


# ----------------------------------------------------
# Usage Log Schemas
# ----------------------------------------------------
class UsageLogCreate(BaseModel):
    asset_id: int
    date: Optional[datetime] = Field(default_factory=datetime.utcnow)
    engine_hours: float
    idle_hours: float
    fuel_used_gallons: Optional[float] = 0.0
    location: Optional[str] = None


class UsageLogResponse(BaseModel):
    id: int
    asset_id: int
    equipment_id: Optional[str] = None
    date: datetime
    engine_hours: float
    idle_hours: float
    fuel_used_gallons: Optional[float] = 0.0
    location: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AssetUsageListResponse(BaseModel):
    asset_id: int
    equipment_id: str
    total_logs: int
    total_engine_hours: float
    total_idle_hours: float
    total_fuel_used_gallons: Optional[float] = 0.0
    average_engine_hours_per_day: float
    average_idle_hours_per_day: float
    logs: List[UsageLogResponse]


# ----------------------------------------------------
# Analytics & Dashboard Schemas
# ----------------------------------------------------
class DashboardStatsResponse(BaseModel):
    total_assets: int
    rented_assets: int
    available_assets: int
    maintenance_assets: int
    overdue_assets: int
    total_operators: int
    total_sites: int
    utilization_rate: float  # Percentage of fleet currently rented
    average_idle_ratio: float  # Percentage of operating hours spent idling
    total_fleet_engine_hours: float
    total_fleet_idle_hours: float
    total_fleet_fuel_used: Optional[float] = 0.0
    fleet_downtime_hours: Optional[float] = 0.0
    active_rentals_count: int


class AnomalyItem(BaseModel):
    equipment_id: str
    type: str          # HIGH_IDLE_TIME, LOW_UTILIZATION, UNUSUALLY_LONG_RENTAL, MISSING_OPERATOR, etc.
    severity: str      # high, medium, low
    value: Any         # Metric value (e.g. 67.0%, 1.2 hrs/day, 35 days, Missing)
    message: str
    asset_id: Optional[int] = None
    current_site: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None


class AnomalyResponse(BaseModel):
    total_anomalies: int
    anomalies: List[AnomalyItem]


class ForecastItem(BaseModel):
    equipment_type: str
    current_demand: int
    forecast_demand: int
    recommendation: str
    current_fleet_count: Optional[int] = None
    projected_demand_next_7d: Optional[int] = None
    projected_demand_next_14d: Optional[int] = None
    projected_demand_next_30d: Optional[int] = None
    utilization_trend: Optional[str] = None


class ForecastResponse(BaseModel):
    forecast_generated_at: datetime
    forecasts: List[ForecastItem]


class OverdueItem(BaseModel):
    equipment_id: str
    type: str
    site: str
    expected_return_date: datetime
    overdue_days: float
    rental_id: Optional[int] = None
    operator_name: Optional[str] = None
    checkout_time: Optional[datetime] = None
    hours_overdue: Optional[float] = None


class DueSoonItem(BaseModel):
    equipment_id: str
    type: str
    site: str
    expected_return_date: datetime
    hours_remaining: float
    rental_id: Optional[int] = None
    operator_name: Optional[str] = None


class OverdueResponse(BaseModel):
    total_overdue: int
    overdue_items: List[OverdueItem]
    due_soon_items: Optional[List[DueSoonItem]] = []


class AlertsResponse(BaseModel):
    total_alerts: int
    total_overdue: int
    total_due_soon: int
    overdue_items: List[OverdueItem]
    due_soon_items: List[DueSoonItem]


class SiteUsageSummary(BaseModel):
    site_name: str
    active_assets: int
    total_engine_hours: float
    total_idle_hours: float
    total_fuel_used_gallons: float


class FleetUsageSummaryResponse(BaseModel):
    total_engine_hours: float
    total_idle_hours: float
    total_fuel_used_gallons: float
    fleet_downtime_hours: float
    average_idle_ratio: float
    site_breakdown: List[SiteUsageSummary]

