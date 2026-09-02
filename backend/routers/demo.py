from fastapi import APIRouter, HTTPException
import schemas
from seed import seed_database

router = APIRouter(prefix="/api/demo", tags=["Demo Management"])


@router.post("/reset", response_model=schemas.DemoResetResponse)
def reset_demo_data():
    """
    Restores the TRACKCAT SQLite database to its original seeded baseline state.
    Restores all assets, rental transactions, telematics logs, overdue violations,
    anomaly records, and optimization baseline conditions.
    """
    try:
        result = seed_database()
        return schemas.DemoResetResponse(
            success=True,
            message="Demo data successfully restored to original baseline state.",
            assets_restored=result.get("assets_restored", 12),
            rentals_restored=result.get("rentals_restored", 8),
            sites_restored=result.get("sites_restored", 5),
            usage_logs_restored=result.get("usage_logs_restored", 71)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset demo data: {str(e)}")
