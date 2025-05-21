from app import app, db, Admin
from datetime import datetime

def create_admin():
    with app.app_context():
        # Check if admin already exists
        if Admin.query.filter_by(email="admin@hd.com").first():
            print("Admin user already exists.")
            return
        
        # Create new admin
        admin = Admin(
            full_name="HD Admin",
            email="admin@hd.com",
            created_at=datetime.utcnow()
        )
        admin.set_password("Admin@123")
        db.session.add(admin)
        db.session.commit()
        print("Admin user created successfully!")
        print("Credentials:")
        print("Email: admin@hd.com")
        print("Password: Admin@123")

if __name__ == "__main__":
    create_admin() 