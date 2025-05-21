from app import app, db
from werkzeug.security import generate_password_hash
from datetime import datetime
from sqlalchemy import text

def reset_database():
    with app.app_context():
        # Drop all tables with CASCADE
        with db.engine.connect() as conn:
            conn.execute(text('DROP SCHEMA public CASCADE;'))
            conn.execute(text('CREATE SCHEMA public;'))
            conn.commit()
        print("All tables dropped successfully.")
        
        # Create all tables
        db.create_all()
        print("All tables created successfully.")

if __name__ == "__main__":
    reset_database() 