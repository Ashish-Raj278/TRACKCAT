import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import assets, rentals, usage, analytics

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TRACKCAT - Smart Rental Intelligence System API",
    description="Backend API for heavy equipment rental tracking, telematics monitoring, anomaly detection, and demand forecasting.",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"  # Allow dev access
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(assets.router)
app.include_router(rentals.router)
app.include_router(usage.router)
app.include_router(analytics.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "healthy",
        "system": "TRACKCAT Smart Rental Intelligence API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
