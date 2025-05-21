from flask import Flask
from flask_migrate import Migrate, upgrade
from app import app, db

def run_migrations():
    with app.app_context():
        # Run all pending migrations
        upgrade()

if __name__ == '__main__':
    run_migrations() 