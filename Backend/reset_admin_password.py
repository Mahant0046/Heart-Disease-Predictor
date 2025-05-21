from app import app, db, Admin

def reset_admin_password():
    with app.app_context():
        # Find the admin user
        admin = Admin.query.filter_by(email="admin@hd.com").first()
        if admin:
            # Reset the password
            admin.set_password("Admin@123")
            db.session.commit()
            print("Admin password has been reset successfully!")
            print("New credentials:")
            print("Email: admin@hd.com")
            print("Password: Admin@123")
        else:
            print("Admin user not found!")

if __name__ == "__main__":
    reset_admin_password() 