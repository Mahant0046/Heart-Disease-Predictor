from app import app, db, Doctor
from werkzeug.security import generate_password_hash
from datetime import datetime

def setup_database():
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if we already have doctors
        if Doctor.query.first() is None:
            # Create a test doctor
            test_doctor = Doctor(
                fullName="Dr. John Smith",
                specialization="Cardiology",
                qualifications="MD, FACC",
                experience=15,
                hospital="City General Hospital",
                address="123 Medical Center Drive",
                city="New York",
                area="Manhattan",
                phoneNumber="+1-555-0123",
                email="doctor@example.com",
                availability={
                    "days": ["Monday", "Wednesday", "Friday"],
                    "startTime": "09:00",
                    "endTime": "17:00"
                },
                rating=4.5,
                totalAppointments=100,
                reviews=50,
                consultationFee=150.0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            test_doctor.set_password("doctor123")
            
            # Add the doctor to the database
            db.session.add(test_doctor)
            db.session.commit()
            print("Test doctor created successfully!")
        else:
            print("Doctors table already has data.")

if __name__ == "__main__":
    setup_database() 