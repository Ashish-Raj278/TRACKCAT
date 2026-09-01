from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import crud
import schemas

router = APIRouter(prefix="/api/usage", tags=["Usage & Telematics"])


@router.get("/{asset_id}", response_model=schemas.AssetUsageListResponse)
def get_asset_usage(
    asset_id: int,
    limit: int = Query(30, ge=1, le=100, description="Max number of logs to return"),
    db: Session = Depends(get_db)
):
    """Retrieve usage and telemetry logs for a specific asset along with aggregated metrics."""
    try:
        return crud.get_usage_logs(db, asset_id=asset_id, limit=limit)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error retrieving usage logs: {str(e)}")


@router.post("", response_model=schemas.UsageLogResponse)
def log_usage(
    usage_data: schemas.UsageLogCreate,
    db: Session = Depends(get_db)
):
    """Record a new daily telemetry usage log for an asset, updating its engine and idle statistics."""
    try:
        log, _ = crud.create_usage_log(db, usage_data)
        return log
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error logging usage: {str(e)}")
