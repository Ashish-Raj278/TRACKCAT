import os
import sys
from datetime import datetime, timedelta
import random

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
import models
import crud


def seed_database():
    print("Initializing TRACKCAT database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    now = datetime.utcnow()

    try:
        print("Seeding Operators...")
        operators_data = [
            {"operator_code": "OP-101", "name": "Marcus Vance"},
            {"operator_code": "OP-102", "name": "Sarah Jenkins"},
            {"operator_code": "OP-103", "name": "David Rodriguez"},
            {"operator_code": "OP-104", "name": "Priya Sharma"},
            {"operator_code": "OP-105", "name": "James Buck Miller"},
            {"operator_code": "OP-106", "name": "Elena Rostova"},
            {"operator_code": "OP-107", "name": "Ahmed Hassan"},
            {"operator_code": "OP-108", "name": "Michael Chang"},
        ]
        operators = []
        for op in operators_data:
            operator_obj = models.Operator(**op)
            db.add(operator_obj)
            operators.append(operator_obj)
        db.commit()

        print("Seeding Sites...")
        sites_data = [
            {"site_code": "S-101", "site_name": "Downtown Metro Rail Extension", "location": "Sector 12, Metro Core"},
            {"site_code": "S-102", "site_name": "North River Highway Expansion", "location": "Highway 101, Mile 45"},
            {"site_code": "S-103", "site_name": "Harbor Port Logistics Terminal", "location": "Pier 7, South Dock"},
            {"site_code": "S-104", "site_name": "Greenfields Solar Farm Phase 2", "location": "Valley District Plot 8"},
            {"site_code": "S-105", "site_name": "Apex Commercial Hub & Tower", "location": "Financial District, 5th Ave"},
        ]
        sites = []
        for s in sites_data:
            site_obj = models.Site(**s)
            db.add(site_obj)
            sites.append(site_obj)
        db.commit()

        print("Seeding Assets...")
        # 12 Assets spanning 6 types with distinct operational profiles
        assets_data = [
            # 1. Active rental due soon (Expected return in ~6 hours)
            {
                "equipment_id": "EQ-CAT-320",
                "type": "Hydraulic Excavator",
                "status": "rented",
                "current_site": "Downtown Metro Rail Extension",
                "checkout_date": now - timedelta(days=5),
                "expected_checkin_date": now + timedelta(hours=6),  # DUE SOON (6 hrs)
                "engine_hours_per_day": 7.5,
                "idle_hours_per_day": 1.8,
                "operating_days": 15,
                "last_operator_id": 1,  # Marcus Vance
            },
            # 2. Overdue Rental + Unusually Long Rental (Checked out 22 days ago, expected return 4 days ago)
            {
                "equipment_id": "EQ-CAT-336",
                "type": "Hydraulic Excavator",
                "status": "rented",
                "current_site": "North River Highway Expansion",
                "checkout_date": now - timedelta(days=22),
                "expected_checkin_date": now - timedelta(days=4),  # OVERDUE
                "engine_hours_per_day": 8.2,
                "idle_hours_per_day": 2.1,
                "operating_days": 18,
                "last_operator_id": 2,  # Sarah Jenkins
            },
            # 3. High Idle Time Equipment (6.5h idle vs 3.2h engine = 67% idle ratio)
            {
                "equipment_id": "EQ-CAT-D6",
                "type": "Track Bulldozer",
                "status": "rented",
                "current_site": "Greenfields Solar Farm Phase 2",
                "checkout_date": now - timedelta(days=8),
                "expected_checkin_date": now + timedelta(days=6),
                "engine_hours_per_day": 3.2,
                "idle_hours_per_day": 6.5,
                "operating_days": 12,
                "last_operator_id": 3,  # David Rodriguez
            },
            # 4. Available Heavy Bulldozer
            {
                "equipment_id": "EQ-CAT-D8",
                "type": "Track Bulldozer",
                "status": "available",
                "current_site": "Main Yard Depot",
                "checkout_date": None,
                "expected_checkin_date": None,
                "engine_hours_per_day": 6.0,
                "idle_hours_per_day": 1.5,
                "operating_days": 20,
                "last_operator_id": 4,
            },
            # 5. Low Utilization + Due Soon (1.2h/day engine, expected return in ~14 hours)
            {
                "equipment_id": "EQ-CAT-950",
                "type": "Wheel Loader",
                "status": "rented",
                "current_site": "Apex Commercial Hub & Tower",
                "checkout_date": now - timedelta(days=10),
                "expected_checkin_date": now + timedelta(hours=14),  # DUE SOON (14 hrs)
                "engine_hours_per_day": 1.2,
                "idle_hours_per_day": 0.8,
                "operating_days": 10,
                "last_operator_id": 5,  # James Buck Miller
            },
            # 6. Available Wheel Loader
            {
                "equipment_id": "EQ-CAT-980",
                "type": "Wheel Loader",
                "status": "available",
                "current_site": "Main Yard Depot",
                "checkout_date": None,
                "expected_checkin_date": None,
                "engine_hours_per_day": 7.0,
                "idle_hours_per_day": 1.9,
                "operating_days": 25,
                "last_operator_id": 6,
            },
            # 7. Normal active rental
            {
                "equipment_id": "EQ-CAT-420",
                "type": "Backhoe Loader",
                "status": "rented",
                "current_site": "Downtown Metro Rail Extension",
                "checkout_date": now - timedelta(days=3),
                "expected_checkin_date": now + timedelta(days=11),
                "engine_hours_per_day": 6.8,
                "idle_hours_per_day": 1.4,
                "operating_days": 14,
                "last_operator_id": 7,  # Ahmed Hassan
            },
            # 8. Overdue Rental (Expected return was 2 days ago)
            {
                "equipment_id": "EQ-CAT-430",
                "type": "Backhoe Loader",
                "status": "rented",
                "current_site": "Harbor Port Logistics Terminal",
                "checkout_date": now - timedelta(days=9),
                "expected_checkin_date": now - timedelta(days=2),  # OVERDUE
                "engine_hours_per_day": 5.9,
                "idle_hours_per_day": 2.0,
                "operating_days": 9,
                "last_operator_id": 8,  # Michael Chang
            },
            # 9. Excessive daily hours (14.5h/day)
            {
                "equipment_id": "EQ-CAT-259",
                "type": "Skid Steer Loader",
                "status": "rented",
                "current_site": "North River Highway Expansion",
                "checkout_date": now - timedelta(days=6),
                "expected_checkin_date": now + timedelta(days=8),
                "engine_hours_per_day": 14.5,
                "idle_hours_per_day": 2.2,
                "operating_days": 16,
                "last_operator_id": 1,  # Marcus Vance
            },
            # 10. Available Skid Steer
            {
                "equipment_id": "EQ-CAT-272",
                "type": "Skid Steer Loader",
                "status": "available",
                "current_site": "Main Yard Depot",
                "checkout_date": None,
                "expected_checkin_date": None,
                "engine_hours_per_day": 5.5,
                "idle_hours_per_day": 1.2,
                "operating_days": 18,
                "last_operator_id": 2,
            },
            # 11. Maintenance Status Crane
            {
                "equipment_id": "EQ-CAT-RT70",
                "type": "Rough Terrain Crane",
                "status": "maintenance",
                "current_site": "Central Maintenance Facility",
                "checkout_date": None,
                "expected_checkin_date": None,
                "engine_hours_per_day": 4.5,
                "idle_hours_per_day": 2.0,
                "operating_days": 30,
                "last_operator_id": 4,
            },
            # 12. High Idle Time + Missing Operator (Crane standing idle at dock with no designated operator)
            {
                "equipment_id": "EQ-CAT-RT100",
                "type": "Rough Terrain Crane",
                "status": "rented",
                "current_site": "Harbor Port Logistics Terminal",
                "checkout_date": now - timedelta(days=7),
                "expected_checkin_date": now + timedelta(days=14),
                "engine_hours_per_day": 2.5,
                "idle_hours_per_day": 5.8,
                "operating_days": 12,
                "last_operator_id": None,  # MISSING OPERATOR
            },
        ]

        assets = []
        for a in assets_data:
            asset_obj = models.Asset(**a)
            db.add(asset_obj)
            assets.append(asset_obj)
        db.commit()

        print("Seeding Rental Transactions (Historical & Active)...")
        transactions_data = [
            # Active Rentals (7 matching active assets above)
            {
                "asset_id": 1, "site_id": 1, "operator_id": 1,
                "checkout_time": now - timedelta(days=5),
                "expected_return_time": now + timedelta(hours=6),  # Due Soon (6h)
                "checkin_time": None, "status": "active"
            },
            {
                "asset_id": 2, "site_id": 2, "operator_id": 2,
                "checkout_time": now - timedelta(days=22),
                "expected_return_time": now - timedelta(days=4),
                "checkin_time": None, "status": "active"  # Overdue + long rental
            },
            {
                "asset_id": 3, "site_id": 4, "operator_id": 3,
                "checkout_time": now - timedelta(days=8),
                "expected_return_time": now + timedelta(days=6),
                "checkin_time": None, "status": "active"
            },
            {
                "asset_id": 5, "site_id": 5, "operator_id": 5,
                "checkout_time": now - timedelta(days=10),
                "expected_return_time": now + timedelta(hours=14),  # Due Soon (14h)
                "checkin_time": None, "status": "active"
            },
            {
                "asset_id": 7, "site_id": 1, "operator_id": 7,
                "checkout_time": now - timedelta(days=3),
                "expected_return_time": now + timedelta(days=11),
                "checkin_time": None, "status": "active"
            },
            {
                "asset_id": 8, "site_id": 3, "operator_id": 8,
                "checkout_time": now - timedelta(days=9),
                "expected_return_time": now - timedelta(days=2),
                "checkin_time": None, "status": "active"  # Overdue
            },
            {
                "asset_id": 9, "site_id": 2, "operator_id": 1,
                "checkout_time": now - timedelta(days=6),
                "expected_return_time": now + timedelta(days=8),
                "checkin_time": None, "status": "active"
            },
            {
                "asset_id": 12, "site_id": 3, "operator_id": None,
                "checkout_time": now - timedelta(days=7),
                "expected_return_time": now + timedelta(days=14),
                "checkin_time": None, "status": "active"  # Missing operator
            },

            # Historical Completed Rentals (Past 15 to 60 days for forecasting)
            {
                "asset_id": 1, "site_id": 2, "operator_id": 3,
                "checkout_time": now - timedelta(days=25),
                "expected_return_time": now - timedelta(days=12),
                "checkin_time": now - timedelta(days=12), "status": "completed"
            },
            {
                "asset_id": 2, "site_id": 1, "operator_id": 4,
                "checkout_time": now - timedelta(days=35),
                "expected_return_time": now - timedelta(days=20),
                "checkin_time": now - timedelta(days=20), "status": "completed"
            },
            {
                "asset_id": 3, "site_id": 5, "operator_id": 5,
                "checkout_time": now - timedelta(days=40),
                "expected_return_time": now - timedelta(days=25),
                "checkin_time": now - timedelta(days=25), "status": "completed"
            },
            {
                "asset_id": 4, "site_id": 4, "operator_id": 6,
                "checkout_time": now - timedelta(days=22),
                "expected_return_time": now - timedelta(days=10),
                "checkin_time": now - timedelta(days=10), "status": "completed"
            },
            {
                "asset_id": 4, "site_id": 2, "operator_id": 7,
                "checkout_time": now - timedelta(days=50),
                "expected_return_time": now - timedelta(days=36),
                "checkin_time": now - timedelta(days=36), "status": "completed"
            },
            {
                "asset_id": 5, "site_id": 3, "operator_id": 8,
                "checkout_time": now - timedelta(days=30),
                "expected_return_time": now - timedelta(days=18),
                "checkin_time": now - timedelta(days=18), "status": "completed"
            },
            {
                "asset_id": 6, "site_id": 1, "operator_id": 1,
                "checkout_time": now - timedelta(days=18),
                "expected_return_time": now - timedelta(days=6),
                "checkin_time": now - timedelta(days=6), "status": "completed"
            },
            {
                "asset_id": 6, "site_id": 5, "operator_id": 2,
                "checkout_time": now - timedelta(days=45),
                "expected_return_time": now - timedelta(days=32),
                "checkin_time": now - timedelta(days=31), "status": "completed"
            },
            {
                "asset_id": 7, "site_id": 2, "operator_id": 3,
                "checkout_time": now - timedelta(days=28),
                "expected_return_time": now - timedelta(days=15),
                "checkin_time": now - timedelta(days=15), "status": "completed"
            },
            {
                "asset_id": 8, "site_id": 4, "operator_id": 4,
                "checkout_time": now - timedelta(days=38),
                "expected_return_time": now - timedelta(days=26),
                "checkin_time": now - timedelta(days=26), "status": "completed"
            },
            {
                "asset_id": 9, "site_id": 1, "operator_id": 5,
                "checkout_time": now - timedelta(days=20),
                "expected_return_time": now - timedelta(days=10),
                "checkin_time": now - timedelta(days=10), "status": "completed"
            },
            {
                "asset_id": 10, "site_id": 3, "operator_id": 6,
                "checkout_time": now - timedelta(days=15),
                "expected_return_time": now - timedelta(days=5),
                "checkin_time": now - timedelta(days=5), "status": "completed"
            },
            {
                "asset_id": 10, "site_id": 2, "operator_id": 7,
                "checkout_time": now - timedelta(days=48),
                "expected_return_time": now - timedelta(days=35),
                "checkin_time": now - timedelta(days=34), "status": "completed"
            },
            {
                "asset_id": 11, "site_id": 5, "operator_id": 8,
                "checkout_time": now - timedelta(days=32),
                "expected_return_time": now - timedelta(days=16),
                "checkin_time": now - timedelta(days=16), "status": "completed"
            },
            {
                "asset_id": 12, "site_id": 4, "operator_id": 1,
                "checkout_time": now - timedelta(days=42),
                "expected_return_time": now - timedelta(days=28),
                "checkin_time": now - timedelta(days=28), "status": "completed"
            },
            {
                "asset_id": 1, "site_id": 3, "operator_id": 2,
                "checkout_time": now - timedelta(days=55),
                "expected_return_time": now - timedelta(days=40),
                "checkin_time": now - timedelta(days=40), "status": "completed"
            },
            {
                "asset_id": 3, "site_id": 1, "operator_id": 3,
                "checkout_time": now - timedelta(days=58),
                "expected_return_time": now - timedelta(days=45),
                "checkin_time": now - timedelta(days=45), "status": "completed"
            },
            {
                "asset_id": 7, "site_id": 5, "operator_id": 4,
                "checkout_time": now - timedelta(days=52),
                "expected_return_time": now - timedelta(days=42),
                "checkin_time": now - timedelta(days=42), "status": "completed"
            }
        ]

        for tx in transactions_data:
            db.add(models.RentalTransaction(**tx))
        db.commit()

        print("Seeding Usage Logs (Telematics)...")
        usage_logs_to_add = []

        # 1. EQ-CAT-320 (Normal Hydraulic Excavator) - 7 daily logs
        for i in range(7):
            eh = round(random.uniform(7.0, 8.2), 1)
            ih = round(random.uniform(1.4, 2.0), 1)
            usage_logs_to_add.append(
                models.UsageLog(
                    asset_id=1,
                    date=now - timedelta(days=6 - i),
                    engine_hours=eh,
                    idle_hours=ih,
                    fuel_used_gallons=round(eh * 4.2 + ih * 0.8, 1),
                    location="Downtown Metro Rail Extension"
                )
            )

        # 2. EQ-CAT-336 (Overdue Excavator) - 10 daily logs
        for i in range(10):
            eh = round(random.uniform(7.8, 8.9), 1)
            ih = round(random.uniform(1.8, 2.4), 1)
            usage_logs_to_add.append(
                models.UsageLog(
                    asset_id=2,
                    date=now - timedelta(days=10 - i),
                    engine_hours=eh,
                    idle_hours=ih,
                    fuel_used_gallons=round(eh * 4.8 + ih * 0.9, 1),
                    location="North River Highway Expansion"
                )
            )

        # 3. EQ-CAT-D6 (High Idle Bulldozer - 67% idle ratio) - 8 daily logs
        for i in range(8):
            eh = round(random.uniform(2.8, 3.6), 1)
            ih = round(random.uniform(6.0, 7.2), 1)
            usage_logs_to_add.append(
                models.UsageLog(
                    asset_id=3,
                    date=now - timedelta(days=7 - i),
                    engine_hours=eh,
                    idle_hours=ih,
                    fuel_used_gallons=round(eh * 5.0 + ih * 1.5, 1),
                    location="Greenfields Solar Farm Phase 2"
                )
            )

        # 4. EQ-CAT-D8 (Available Bulldozer) - 5 historical logs
        for i in range(5):
            eh = round(random.uniform(5.5, 6.8), 1)
            ih = round(random.uniform(1.2, 1.8), 1)
            usage_logs_to_add.append(
                models.UsageLog(
                    asset_id=4,
                    date=now - timedelta(days=15 - i),
                    engine_hours=eh,
                    idle_hours=ih,
                    fuel_used_gallons=round(eh * 6.5 + ih * 1.2, 1),
                    location="Main Yard Depot"
                )
            )

        # 5. EQ-CAT-950 (Low Utilization Loader - 1.2h engine/day) - 7 daily logs
        for i in range(7):
            eh = round(random.uniform(0.8, 1.5), 1)
            ih = round(random.uniform(0.5, 1.0), 1)
            usage_logs_to_add.append(
                models.UsageLog(
                    asset_id=5,
                    date=now - timedelta(days=7 - i),
                    engine_hours=eh,
                    idle_hours=ih,
                    fuel_used_gallons=round(eh * 3.8 + ih * 0.7, 1),
                    location="Apex Commercial Hub & Tower"
                )
            )

        # 6. EQ-CAT-980 (Available Wheel Loader) - 5 historical logs
        for i in range(5):
            eh = round(random.uniform(6.5, 7.5), 1)
            ih = round(random.uniform(1.5, 2.2), 1)
            usage_logs_to_add.append(
                models.UsageLog(
                    asset_id=6,
                    date=now - timedelta(days=12 - i),
                    engine_hours=eh,
                    idle_hours=ih,
                    fuel_used_gallons=round(eh * 5.2 + ih * 1.0, 1),
                    location="Main Yard Depot"
                )
            )

        # 7. EQ-CAT-420 (Normal Backhoe Loader) - 5 daily logs
        for i in range(5):
            eh = round(random.uniform(6.2, 7.4), 1)
            ih = round(random.uniform(1.1, 1.6), 1)
            usage_logs_to_add.append(
                models.UsageLog(
                    asset_id=7,
                    date=now - timedelta(days=4 - i),
                    engine_hours=eh,
                    idle_hours=ih,
                    fuel_used_gallons=round(eh * 3.2 + ih * 0.6, 1),
                    location="Downtown Metro Rail Extension"
                )
            )

        # 8. EQ-CAT-430 (Overdue Backhoe) - 8 daily logs
        for i in range(8):
            eh = round(random.uniform(5.5, 6.4), 1)
            ih = round(random.uniform(1.8, 2.3), 1)
            usage_logs_to_add.append(
                models.UsageLog(
                    asset_id=8,
                    date=now - timedelta(days=8 - i),
                    engine_hours=eh,
                    idle_hours=ih,
                    fuel_used_gallons=round(eh * 3.5 + ih * 0.8, 1),
                    location="Harbor Port Logistics Terminal"
                )
            )

        # 9. EQ-CAT-259 (Excessive Hours Skid Steer - 14.5h/day) - 6 daily logs
        for i in range(6):
            eh = round(random.uniform(14.0, 15.5), 1)
            ih = round(random.uniform(1.8, 2.5), 1)
            usage_logs_to_add.append(
                models.UsageLog(
                    asset_id=9,
                    date=now - timedelta(days=5 - i),
                    engine_hours=eh,
                    idle_hours=ih,
                    fuel_used_gallons=round(eh * 2.8 + ih * 0.5, 1),
                    location="North River Highway Expansion"
                )
            )

        # 10. EQ-CAT-272 (Available Skid Steer) - 4 historical logs
        for i in range(4):
            eh = round(random.uniform(5.0, 6.0), 1)
            ih = round(random.uniform(1.0, 1.5), 1)
            usage_logs_to_add.append(
                models.UsageLog(
                    asset_id=10,
                    date=now - timedelta(days=10 - i),
                    engine_hours=eh,
                    idle_hours=ih,
                    fuel_used_gallons=round(eh * 2.5 + ih * 0.5, 1),
                    location="Main Yard Depot"
                )
            )

        # 11. EQ-CAT-RT100 (High Idle Crane - 70% idle ratio) - 6 daily logs
        for i in range(6):
            eh = round(random.uniform(2.0, 3.0), 1)
            ih = round(random.uniform(5.2, 6.4), 1)
            usage_logs_to_add.append(
                models.UsageLog(
                    asset_id=12,
                    date=now - timedelta(days=6 - i),
                    engine_hours=eh,
                    idle_hours=ih,
                    fuel_used_gallons=round(eh * 4.5 + ih * 1.8, 1),
                    location="Harbor Port Logistics Terminal"
                )
            )

        for log in usage_logs_to_add:
            db.add(log)
        db.commit()

        # Recalculate metrics for all assets from the seeded usage logs
        print("Synchronizing asset telematics metrics...")
        for asset in assets:
            crud.recalculate_asset_metrics(db, asset.id)

        # Final counts
        total_assets = db.query(models.Asset).count()
        total_types = len(set(a.type for a in db.query(models.Asset).all()))
        total_sites = db.query(models.Site).count()
        total_operators = db.query(models.Operator).count()
        total_transactions = db.query(models.RentalTransaction).count()
        total_logs = db.query(models.UsageLog).count()

        print("\n==========================================")
        print("TRACKCAT DATABASE SEED COMPLETE!")
        print("==========================================")
        print(f"Total Assets:            {total_assets} (across {total_types} equipment types)")
        print(f"Total Sites:             {total_sites}")
        print(f"Total Operators:         {total_operators}")
        print(f"Total Rental Transactions: {total_transactions}")
        print(f"Total Usage Logs:        {total_logs}")
        print("==========================================\n")

        return {
            "assets_restored": total_assets,
            "rentals_restored": db.query(models.RentalTransaction).filter(models.RentalTransaction.status == "active").count(),
            "total_transactions": total_transactions,
            "sites_restored": total_sites,
            "operators_restored": total_operators,
            "usage_logs_restored": total_logs
        }

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
