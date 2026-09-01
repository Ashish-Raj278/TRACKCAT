from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Operator(Base):
    __tablename__ = "operators"

    id = Column(Integer, primary_key=True, index=True)
    operator_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)

    # Relationships
    rentals = relationship("RentalTransaction", back_populates="operator")


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    site_code = Column(String, unique=True, index=True, nullable=False)
    site_name = Column(String, nullable=False)
    location = Column(String, nullable=False)

    # Relationships
    rentals = relationship("RentalTransaction", back_populates="site")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, index=True, nullable=False)
    status = Column(String, index=True, default="available")  # available, rented, maintenance
    current_site = Column(String, nullable=True)
    checkout_date = Column(DateTime, nullable=True)
    expected_checkin_date = Column(DateTime, nullable=True)
    engine_hours_per_day = Column(Float, default=0.0)
    idle_hours_per_day = Column(Float, default=0.0)
    operating_days = Column(Integer, default=0)
    last_operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)

    # Relationships
    last_operator = relationship("Operator", foreign_keys=[last_operator_id])
    rentals = relationship("RentalTransaction", back_populates="asset", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="asset", cascade="all, delete-orphan")


class RentalTransaction(Base):
    __tablename__ = "rental_transactions"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True, index=True)
    checkout_time = Column(DateTime, nullable=False)
    expected_return_time = Column(DateTime, nullable=False)
    checkin_time = Column(DateTime, nullable=True)
    status = Column(String, default="active", index=True)  # active, completed

    # Relationships
    asset = relationship("Asset", back_populates="rentals")
    site = relationship("Site", back_populates="rentals")
    operator = relationship("Operator", back_populates="rentals")


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, default=datetime.utcnow)
    engine_hours = Column(Float, nullable=False, default=0.0)
    idle_hours = Column(Float, nullable=False, default=0.0)
    fuel_used_gallons = Column(Float, nullable=True, default=0.0)
    location = Column(String, nullable=True)

    # Relationships
    asset = relationship("Asset", back_populates="usage_logs")
