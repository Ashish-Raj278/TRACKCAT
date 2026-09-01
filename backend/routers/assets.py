from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import crud
import schemas

router = APIRouter(prefix="/api/assets", tags=["Assets"])


@router.get("", response_model=List[schemas.AssetResponse])
def get_assets(
    status: Optional[str] = Query(None, description="Filter by status (available, rented, maintenance)"),
    type: Optional[str] = Query(None, description="Filter by equipment type"),
    site: Optional[str] = Query(None, description="Filter by current site name"),
    db: Session = Depends(get_db)
):
    """Retrieve all assets with optional filtering by status, type, or site."""
    return crud.get_assets(db, status=status, asset_type=type, site=site)


@router.get("/{id}", response_model=schemas.AssetResponse)
def get_asset(
    id: int,
    db: Session = Depends(get_db)
):
    """Retrieve a single asset by its primary key ID."""
    asset = crud.get_asset(db, asset_id=id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset with ID {id} not found")
    return asset
