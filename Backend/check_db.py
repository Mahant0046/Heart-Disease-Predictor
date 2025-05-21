from app import app, db, Doctor
from datetime import datetime

def check_database():
    with app.app_context():
        print("Checking doctors table...")
        doctors = Doctor.query.all()
        print(f"Number of doctors: {len(doctors)}")
        for doctor in doctors:
            print("\nDoctor details:")
            print(f"ID: {doctor.id}")
            print(f"Name: {doctor.fullName}")
            print(f"Email: {doctor.email}")
            print(f"Specialization: {doctor.specialization}")
            print(f"City: {doctor.city}")
            print(f"Area: {doctor.area}")
            print(f"Availability: {doctor.availability}")

if __name__ == "__main__":
    check_database() 