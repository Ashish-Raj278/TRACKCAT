from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import crud
import schemas

router = APIRouter(prefix="/api", tags=["Rentals"])


@router.post("/checkout", response_model=schemas.CheckoutActionResponse)
def checkout_equipment(
    checkout_data: schemas.CheckoutRequest,
    db: Session = Depends(get_db)
):
    """Check out an equipment asset to a site and operator with an expected return date."""
    try:
        rental, asset = crud.checkout_asset(db, checkout_data)
        return schemas.CheckoutActionResponse(
            message=f"Equipment {asset.equipment_id} successfully checked out to {asset.current_site}.",
            rental=rental,
            asset=asset
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal checkout error: {str(e)}")


@router.post("/checkin", response_model=schemas.CheckinActionResponse)
def checkin_equipment(
    checkin_data: schemas.CheckinRequest,
    db: Session = Depends(get_db)
):
    """Check in a currently rented equipment asset, updating status to available and recording telemetry."""
    try:
        rental, asset = crud.checkin_asset(db, checkin_data)
        return schemas.CheckinActionResponse(
            message=f"Equipment {asset.equipment_id} successfully checked in. Status is now available.",
            rental=rental,
            asset=asset
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal checkin error: {str(e)}")


@router.get("/rentals", response_model=List[schemas.RentalTransactionResponse])
def get_rentals(
    status: Optional[str] = Query(None, description="Filter by status (active, completed)"),
    asset_id: Optional[int] = Query(None, description="Filter by asset ID"),
    db: Session = Depends(get_db)
):
    """Retrieve list of rental transactions with optional filters."""
    return crud.get_rentals(db, status=status, asset_id=asset_id)
