from flask import Flask, jsonify, request, session
from flask_cors import CORS
from datetime import timedelta, datetime, time
import psycopg2
import secrets
import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from flask_session import Session  # Add this import
from hd_prediction.services.blood_report_processor import blood_report_processor
from hd_prediction.errors import register_error_handlers
from hd_prediction import setup_logging, get_logger, PredictionError, ValidationError
from hd_prediction.services.analytics import AnalyticsService
from hd_prediction.services.notifications.email_service import EmailService
from sqlalchemy import JSON  # Add this import

# --- ML Model Integration Imports ---
import joblib
import numpy as np
import pandas as pd

# Debug: Print current directory and check .env file
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '.env')
print(f"Current directory: {current_dir}")
print(f"Looking for .env file at: {env_path}")
print(f".env file exists: {os.path.exists(env_path)}")

# Try to read .env file directly
try:
    with open(env_path, 'r') as f:
        print("\nContents of .env file:")
        for line in f:
            if '=' in line:
                key = line.split('=')[0].strip()
                value = '****' if 'PASSWORD' in key else line.split('=')[1].strip()
                print(f"{key}: {value}")
except Exception as e:
    print(f"Error reading .env file: {str(e)}")

# Load environment variables with explicit path and override
load_dotenv(env_path, override=True)

# Debug: Print all environment variables
print("\nEnvironment variables after loading:")
print(f"MAIL_SERVER: {os.getenv('MAIL_SERVER')}")
print(f"MAIL_PORT: {os.getenv('MAIL_PORT')}")
print(f"MAIL_USERNAME: {os.getenv('MAIL_USERNAME')}")
print(f"MAIL_PASSWORD: {'****' if os.getenv('MAIL_PASSWORD') else 'None'}")
print(f"MAIL_DEFAULT_SENDER: {os.getenv('MAIL_DEFAULT_SENDER')}")

app = Flask(__name__)

# Setup logging
setup_logging(app)

# Register error handlers
register_error_handlers(app)

# Add email configuration with explicit values
app.config.update(
    MAIL_SERVER=os.getenv('MAIL_SERVER', 'smtp.gmail.com'),
    MAIL_PORT=int(os.getenv('MAIL_PORT', 587)),
    MAIL_USE_TLS=os.getenv('MAIL_USE_TLS', 'True').lower() == 'true',
    MAIL_USE_SSL=os.getenv('MAIL_USE_SSL', 'False').lower() == 'true',
    MAIL_USERNAME=os.getenv('MAIL_USERNAME'),
    MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'),
    MAIL_DEFAULT_SENDER=os.getenv('MAIL_DEFAULT_SENDER', 'noreply@heartdiseaseprediction.com'),
    MAIL_MAX_EMAILS=5,
    MAIL_ASCII_ATTACHMENTS=False,
    MAIL_SUPPRESS_SEND=False,
    MAIL_DEBUG=True
)

# Debug: Print app config
print("\nApp config after setting:")
print(f"MAIL_SERVER: {app.config['MAIL_SERVER']}")
print(f"MAIL_PORT: {app.config['MAIL_PORT']}")
print(f"MAIL_USERNAME: {app.config['MAIL_USERNAME']}")
print(f"MAIL_PASSWORD: {'****' if app.config['MAIL_PASSWORD'] else 'None'}")
print(f"MAIL_DEFAULT_SENDER: {app.config['MAIL_DEFAULT_SENDER']}")

# Initialize Flask-Mail with error handling
try:
    mail = Mail(app)
    app.logger.info("Flask-Mail initialized successfully")
except Exception as e:
    app.logger.error(f"Failed to initialize Flask-Mail: {str(e)}")
    mail = None

# Initialize services
email_service = EmailService(app)

# --- Configurations ---
app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{os.getenv('DB_USER', 'postgres')}:{os.getenv('DB_PASSWORD', 'root')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'heart_disease_db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.secret_key = secrets.token_hex(24)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
app.config['SESSION_COOKIE_SECURE'] = False  # Set to False for localhost
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_PATH'] = '/'
app.config['SESSION_COOKIE_DOMAIN'] = None
app.config['SESSION_COOKIE_NAME'] = 'hd_predictor_session_id'
app.config['SESSION_TYPE'] = 'filesystem'

# --- Initialize Extensions ---
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Initialize session
Session(app)

# Configure CORS - Updated configuration
CORS(app,
    resources={r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "x-requested-with"],
        "expose_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "supports_credentials": True,
        "max_age": 3600,
        "send_wildcard": False,
        "vary_header": True,
        "automatic_options": True
    }},
    supports_credentials=True
)

# Add a before_request handler to ensure CORS headers are set consistently
@app.before_request
def before_request():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-requested-with'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '3600'
        response.headers['Vary'] = 'Origin'
        return response

    # Ensure database is initialized
    if not ensure_database_initialized():
        return jsonify({"error": "Database connection error"}), 500

# --- Database Creation (Run once if DB doesn't exist) ---
DEFAULT_DB_ADMIN = 'postgres'
DB_NAME_ACTUAL = os.getenv('DB_NAME', 'heart_disease_db')
DB_USER_ENV = os.getenv('DB_USER', 'postgres')
DB_PASSWORD_ENV = os.getenv('DB_PASSWORD', 'root')
DB_HOST_ENV = os.getenv('DB_HOST', 'localhost')
DB_PORT_ENV = os.getenv('DB_PORT', '5432')

def create_target_database_if_not_exists():
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(
            dbname=DEFAULT_DB_ADMIN, user=DB_USER_ENV, password=DB_PASSWORD_ENV,
            host=DB_HOST_ENV, port=DB_PORT_ENV
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_NAME_ACTUAL,))
        if not cur.fetchone():
            cur.execute(f'CREATE DATABASE "{DB_NAME_ACTUAL}"') # Use quotes for DB name
            app.logger.info(f"Database {DB_NAME_ACTUAL} created successfully.")
        else:
            app.logger.info(f"Database {DB_NAME_ACTUAL} already exists.")
    except psycopg2.Error as e:
        app.logger.error(f"Error connecting to PostgreSQL admin DB or creating target database: {e}")
    finally:
        if cur: cur.close()
        if conn: conn.close()

with app.app_context(): # Ensure app context for initial operations if needed
    create_target_database_if_not_exists()


# --- Load ML Model and Preprocessors ---
MODEL_FILENAME = 'heart_disease_model.joblib'
POLY_FEATURES_FILENAME = 'polynomial_features.joblib'
SCALER_FILENAME = 'scaler.joblib'
IMPUTER_FILENAME = 'simple_imputer.joblib'

ML_COMPONENTS_LOADED = False
heart_disease_model = None
poly_transformer = None
scaler = None
simple_imputer = None

try:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.path.join(base_dir, MODEL_FILENAME)
    POLY_FEATURES_PATH = os.path.join(base_dir, POLY_FEATURES_FILENAME)
    SCALER_PATH = os.path.join(base_dir, SCALER_FILENAME)
    IMPUTER_PATH = os.path.join(base_dir, IMPUTER_FILENAME)

    if not all(os.path.exists(p) for p in [MODEL_PATH, POLY_FEATURES_PATH, SCALER_PATH, IMPUTER_PATH]):
        missing_files = [f for f, p_name in zip(
            [MODEL_FILENAME, POLY_FEATURES_FILENAME, SCALER_FILENAME, IMPUTER_FILENAME],
            [MODEL_PATH, POLY_FEATURES_PATH, SCALER_PATH, IMPUTER_PATH]
        ) if not os.path.exists(p_name)]
        app.logger.error(f"ML Component Loading Error: Could not find: {', '.join(missing_files)} in directory: {base_dir}")
        app.logger.error("Ensure these .joblib files are in the same directory as app.py or update paths.")
    else:
        heart_disease_model = joblib.load(MODEL_PATH)
        poly_transformer = joblib.load(POLY_FEATURES_PATH)
        scaler = joblib.load(SCALER_PATH)
        simple_imputer = joblib.load(IMPUTER_PATH)
        app.logger.info("ML Model and preprocessors loaded successfully.")
        ML_COMPONENTS_LOADED = True
except Exception as e:
    app.logger.error(f"An unexpected error occurred loading ML components: {e}", exc_info=True)


EXPECTED_FEATURE_NAMES = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg',
    'thalach', 'exang', 'oldpeak', 'slope'
]

# --- SQLAlchemy Models ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(50), nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_checkup = db.Column(db.DateTime, nullable=True)

    def set_password(self, password): self.password_hash = generate_password_hash(password)
    def check_password(self, password): return check_password_hash(self.password_hash, password)
    def calculate_health_score(self):
        """Calculate health score based on recent prediction history"""
        # Get the last 3 predictions, ordered by date
        recent_predictions = PredictionRecord.query.filter_by(user_id=self.id)\
            .order_by(PredictionRecord.prediction_date.desc())\
            .limit(3).all()
        
        if not recent_predictions:
            return 75  # Default score if no predictions
            
        # Calculate weighted average of risk percentages
        # More recent predictions have higher weight
        total_weight = 0
        weighted_sum = 0
        
        for i, pred in enumerate(recent_predictions):
            # Weights: most recent = 0.5, second = 0.3, third = 0.2
            weight = 0.5 if i == 0 else (0.3 if i == 1 else 0.2)
            risk_percentage = pred.to_dict()['riskPercentage']
            
            # Convert risk percentage to health score (100 - risk)
            health_score = 100 - risk_percentage
            
            weighted_sum += health_score * weight
            total_weight += weight
        
        final_score = round(weighted_sum / total_weight)
        return max(0, min(100, final_score))  # Ensure score is between 0 and 100
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'fullName': self.full_name,
            'dateOfBirth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            'phoneNumber': self.phone_number,
            'address': self.address,
            'healthScore': self.calculate_health_score(),
            'lastCheckup': self.last_checkup.isoformat() if self.last_checkup else None
        }

class Resource(db.Model):
    __tablename__ = 'resources'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    date_published = db.Column(db.DateTime, default=datetime.utcnow)
    content = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {'id': self.id, 'title': self.title, 'description': self.description,
                'category': self.category, 'url': self.url, 'imageUrl': self.image_url,
                'datePublished': self.date_published.isoformat(), 'content': self.content}

class Admin(db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password): self.password_hash = generate_password_hash(password)
    def check_password(self, password): return check_password_hash(self.password_hash, password)
    def to_dict(self):
        return {'id': self.id, 'email': self.email, 'fullName': self.full_name,
                'createdAt': self.created_at.isoformat(),
                'lastLogin': self.last_login.isoformat() if self.last_login else None}

class PredictionRecord(db.Model):
    __tablename__ = 'prediction_records'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', name='fk_prediction_user_id'), nullable=False) # Added constraint name
    prediction_date = db.Column(db.DateTime, default=datetime.utcnow)
    age = db.Column(db.Float, nullable=False)
    sex = db.Column(db.Integer, nullable=False)
    cp = db.Column(db.Integer, nullable=False)
    trestbps = db.Column(db.Float, nullable=False)
    chol = db.Column(db.Float, nullable=False)
    fbs = db.Column(db.Integer, nullable=False)
    restecg = db.Column(db.Integer, nullable=False)
    thalach = db.Column(db.Float, nullable=False)
    exang = db.Column(db.Integer, nullable=True)
    oldpeak = db.Column(db.Float, nullable=False)
    slope = db.Column(db.Integer, nullable=False)
    predicted_class = db.Column(db.Integer, nullable=False)
    probability_score = db.Column(db.Float, nullable=True)
    user = db.relationship('User', backref=db.backref('prediction_history', lazy='dynamic')) # Changed to lazy='dynamic'

    def to_dict(self):
        # Basic derived symptoms (customize further)
        symptoms_list = [f"Age: {self.age}", f"Sex: {'Male' if self.sex == 1 else 'Female'}"]
        cp_map = {0: "Typical Angina", 1: "Atypical Angina", 2: "Non-anginal Pain", 3: "Asymptomatic", 4: "CP Type 4"} # VERIFY THIS MAP
        restecg_map = {0: "Normal", 1: "ST-T Abnormality", 2: "LV Hypertrophy"}
        slope_map = {0: "Upsloping", 1: "Flat", 2: "Downsloping", 3: "Slope Type 3"} # VERIFY THIS MAP

        if self.cp in cp_map: symptoms_list.append(f"Chest Pain: {cp_map[self.cp]}")
        if self.trestbps > 130: symptoms_list.append(f"Resting BP: {self.trestbps} (Elevated)")
        if self.chol > 200: symptoms_list.append(f"Cholesterol: {self.chol} (Elevated)")
        if self.fbs == 1: symptoms_list.append("Fasting Blood Sugar: >120 mg/dl")
        if self.restecg in restecg_map: symptoms_list.append(f"Resting ECG: {restecg_map[self.restecg]}")
        if self.exang == 1: symptoms_list.append("Exercise Induced Angina: Yes")
        if self.oldpeak > 1.0: symptoms_list.append(f"ST Depression (Oldpeak): {self.oldpeak} (Significant)")
        if self.slope in slope_map: symptoms_list.append(f"ST Slope: {slope_map[self.slope]}")
        
        # Basic recommendations
        recommendations_list = ["Consult a healthcare professional for a comprehensive evaluation.",
                                "Maintain a heart-healthy lifestyle (diet, exercise, stress management)."]
        if self.predicted_class == 1:
            recommendations_list.append("Further diagnostic tests may be recommended by your doctor.")
        if self.probability_score is not None and self.probability_score >= 0.7:
            recommendations_list.insert(1, "Proactively discuss your risk factors with your doctor.")

        risk_level = "low"
        risk_percentage = 0
        if self.probability_score is not None:
            risk_percentage = round(self.probability_score * 100)
            if risk_percentage >= 70: risk_level = "high"
            elif risk_percentage >= 40: risk_level = "medium"
        elif self.predicted_class == 1:
            risk_level = "high"; risk_percentage = 75
        else:
            risk_percentage = 15

        return {'id': self.id, 'user_id': self.user_id,
                'predictionDate': self.prediction_date.isoformat(),
                'predictedClass': self.predicted_class, 'probabilityScore': self.probability_score,
                'riskLevel': risk_level, 'riskPercentage': risk_percentage,
                'symptoms': symptoms_list[:3], 'recommendations': recommendations_list[:3], # Show top 3 for brevity
                'inputFeatures': { 'age': self.age, 'sex': self.sex, 'cp': self.cp, 'trestbps': self.trestbps,
                                   'chol': self.chol, 'fbs': self.fbs, 'restecg': self.restecg, 'thalach': self.thalach,
                                   'exang': self.exang, 'oldpeak': self.oldpeak, 'slope': self.slope}}

class UserActivity(db.Model):
    __tablename__ = 'user_activities'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)  # login, prediction, profile_update, etc.
    activity_details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref=db.backref('activities', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'activityType': self.activity_type,
            'activityDetails': self.activity_details,
            'ipAddress': self.ip_address,
            'userAgent': self.user_agent,
            'createdAt': self.created_at.isoformat()
        }

class SystemHealth(db.Model):
    __tablename__ = 'system_health'
    id = db.Column(db.Integer, primary_key=True)
    metric_name = db.Column(db.String(50), nullable=False)  # cpu_usage, memory_usage, etc.
    metric_value = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False)  # healthy, warning, critical
    details = db.Column(db.Text, nullable=True)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'metricName': self.metric_name,
            'metricValue': self.metric_value,
            'status': self.status,
            'details': self.details,
            'recordedAt': self.recorded_at.isoformat()
        }

class AdminActivityLog(db.Model):
    __tablename__ = 'admin_activity_logs'
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)  # create, update, delete, etc.
    action_details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    admin = db.relationship('Admin', backref=db.backref('activity_logs', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'adminId': self.admin_id,
            'actionType': self.action_type,
            'actionDetails': self.action_details,
            'ipAddress': self.ip_address,
            'createdAt': self.created_at.isoformat()
        }

class Doctor(db.Model):
    __tablename__ = 'doctors'
    id = db.Column(db.Integer, primary_key=True)
    fullName = db.Column(db.String(100), nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    qualifications = db.Column(db.String(200), nullable=False)
    experience = db.Column(db.Integer, nullable=False)
    hospital = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    area = db.Column(db.String(100), nullable=False)
    phoneNumber = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    availability = db.Column(db.JSON, nullable=False)
    rating = db.Column(db.Float, default=0.0)
    totalAppointments = db.Column(db.Integer, default=0)
    reviews = db.Column(db.Integer, default=0)
    consultationFee = db.Column(db.Float, default=0.0)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)  # Made nullable

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        try:
            # Ensure availability is a valid JSON object with required fields
            availability = self.availability or {}
            if not isinstance(availability, dict):
                availability = {}
            if 'days' not in availability:
                availability['days'] = []
            if 'startTime' not in availability:
                availability['startTime'] = '09:00'
            if 'endTime' not in availability:
                availability['endTime'] = '17:00'

            # Create a dictionary with safe defaults for all fields
            doctor_dict = {
                'id': self.id,
                'fullName': str(self.fullName) if self.fullName else '',
                'specialization': str(self.specialization) if self.specialization else '',
                'qualifications': str(self.qualifications) if self.qualifications else '',
                'experience': int(self.experience) if self.experience is not None else 0,
                'hospital': str(self.hospital) if self.hospital else '',
                'address': str(self.address) if self.address else '',
                'city': str(self.city) if self.city else '',
                'area': str(self.area) if self.area else '',
                'phoneNumber': str(self.phoneNumber) if self.phoneNumber else '',
                'email': str(self.email) if self.email else '',
                'availability': availability,
                'rating': float(self.rating) if self.rating is not None else 0.0,
                'totalAppointments': int(self.totalAppointments) if self.totalAppointments is not None else 0,
                'reviews': int(self.reviews) if self.reviews is not None else 0,
                'consultationFee': float(self.consultationFee) if self.consultationFee is not None else 0.0,
                'latitude': float(self.latitude) if self.latitude is not None else None,
                'longitude': float(self.longitude) if self.longitude is not None else None,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None,
                'last_login': self.last_login.isoformat() if self.last_login else None
            }

            # Log any missing or null fields for debugging
            null_fields = [k for k, v in doctor_dict.items() if v is None]
            if null_fields:
                app.logger.warning(f"Doctor {self.id} has null fields: {null_fields}")

            return doctor_dict
        except Exception as e:
            app.logger.error(f"Error converting doctor {self.id} to dict: {str(e)}", exc_info=True)
            # Return a minimal valid dict with required fields
            return {
                'id': self.id,
                'fullName': str(self.fullName) if self.fullName else '',
                'specialization': str(self.specialization) if self.specialization else '',
                'hospital': str(self.hospital) if self.hospital else '',
                'email': str(self.email) if self.email else '',
                'phoneNumber': str(self.phoneNumber) if self.phoneNumber else '',
                'availability': {
                    'days': [],
                    'startTime': '09:00',
                    'endTime': '17:00'
                },
                'rating': 0.0,
                'totalAppointments': 0,
                'reviews': 0,
                'consultationFee': 0.0
            }

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref='appointments')
    doctor = db.relationship('Doctor', backref='appointments')

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'doctorId': self.doctor_id,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time.strftime('%H:%M') if self.time else None,
            'reason': self.reason,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'doctor': self.doctor.to_dict() if self.doctor else None,
            'user': self.user.to_dict() if self.user else None
        }

# --- Decorators ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS': resp = app.make_response(); return resp, 200
        if 'user_id' not in session: return jsonify({'error': 'User authentication required', 'type': 'AUTH_ERROR'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS': resp = app.make_response(); return resp, 200
        if 'admin_id' not in session: return jsonify({'error': 'Admin authentication required', 'type': 'AUTH_ERROR'}), 401
        return f(*args, **kwargs) # For simplicity, removed DB check here, add if high security needed
    return decorated_function

# --- Routes ---
@app.route('/')
def index(): return jsonify({"message": "Backend server is running"})

# --- User Auth ---
@app.route('/api/register', methods=['POST'])
def register_route():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        app.logger.info(f"Registration attempt with data: {data}")
        
        email, password, full_name = data.get('email'), data.get('password'), data.get('fullName')
        if not all([email, password, full_name]):
            return jsonify({"error": "Required fields missing"}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400
        
        try:
            dob_str = data.get('dateOfBirth')
            dob = datetime.strptime(dob_str, '%Y-%m-%d').date() if dob_str else None
        except Exception as e:
            app.logger.error(f"Date parsing error: {str(e)}")
            return jsonify({"error": "Invalid date format"}), 400
        
        user = User(
            email=email,
            full_name=full_name,
            date_of_birth=dob,
            gender=data.get('gender'),
            phone_number=data.get('phoneNumber'),
            address=data.get('address')
        )
        user.set_password(password)
        
        try:
            db.session.add(user)
            db.session.commit()
            app.logger.info(f"User created successfully with ID: {user.id}")
            
            # Send welcome email
            try:
                # Verify email configuration
                if not all([
                    app.config.get('MAIL_SERVER'),
                    app.config.get('MAIL_PORT'),
                    app.config.get('MAIL_USERNAME'),
                    app.config.get('MAIL_PASSWORD')
                ]):
                    missing_configs = [
                        config for config in ['MAIL_SERVER', 'MAIL_PORT', 'MAIL_USERNAME', 'MAIL_PASSWORD']
                        if not app.config.get(config)
                    ]
                    app.logger.error(f"Missing email configurations: {', '.join(missing_configs)}")
                    raise ValueError(f"Missing email configurations: {', '.join(missing_configs)}")
                
                email_service.send_welcome_email(user.email, user.full_name)
                app.logger.info(f"Welcome email sent to {user.email}")
            except Exception as e:
                app.logger.error(f"Failed to send welcome email: {str(e)}", exc_info=True)
                # Continue with registration even if email fails
            
            session.clear()
            session.permanent = True
            session['user_id'] = user.id
            session['user_email'] = user.email
            session['user_full_name'] = user.full_name
            
            return jsonify({
                "message": "User registered successfully",
                "user": user.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Database error during registration: {str(e)}")
            return jsonify({"error": "Database error during registration"}), 500
            
    except Exception as e:
        app.logger.error(f"Unexpected error during registration: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred during registration"}), 500

@app.route('/api/login', methods=['POST'])
def login_route():
    try:
        data = request.get_json()
        if not data:
            app.logger.error("Login attempt with no data")
            return jsonify({"error": "No data provided"}), 400

        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            app.logger.error(f"Login attempt with missing credentials: email={bool(email)}, password={bool(password)}")
            return jsonify({"error": "Email and password are required"}), 400

        app.logger.info(f"Login attempt for email: {email}")
        
        try:
            user = User.query.filter_by(email=email).first()
        except Exception as db_error:
            app.logger.error(f"Database error during login: {str(db_error)}")
            return jsonify({"error": "Database error occurred"}), 500
        
        if not user:
            app.logger.warning(f"Login failed: No user found with email {email}")
            return jsonify({"error": "Invalid email or password", "type": "AUTH_ERROR"}), 401
            
        if not user.check_password(password):
            app.logger.warning(f"Login failed: Invalid password for user {email}")
            return jsonify({"error": "Invalid email or password", "type": "AUTH_ERROR"}), 401

        try:
            # Clear any existing session data
            session.clear()
            session.permanent = True
            
            # Set session data
            session['user_id'] = user.id
            session['user_email'] = user.email
            session['user_full_name'] = user.full_name
        
            # Log successful login
            log_user_activity(user.id, 'login', f'User logged in from {request.remote_addr}')
        
            app.logger.info(f"Login successful for user {email}")
            return jsonify({
                "message": "User login successful",
                "user": user.to_dict()
            })
        except Exception as session_error:
            app.logger.error(f"Session error during login: {str(session_error)}")
            return jsonify({"error": "Session error occurred"}), 500

    except Exception as e:
        app.logger.error(f"Unexpected error during login: {str(e)}", exc_info=True)
        return jsonify({
            "error": "An unexpected error occurred during login",
            "message": str(e)
        }), 500

@app.route('/api/logout', methods=['POST'])
@login_required
def user_logout_route():
    user_id = session.get('user_id')
    session.pop('user_id', None); session.pop('user_email', None); session.pop('user_full_name', None)
    
    # Log logout
    if user_id:
        log_user_activity(user_id, 'logout', f'User logged out from {request.remote_addr}')
    
    return jsonify({"message": "User logged out successfully"})

@app.route('/api/check-user-auth', methods=['GET'])
def check_user_auth_route():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user: return jsonify({"authenticated": True, "user": user.to_dict()})
    return jsonify({"authenticated": False, "type": "AUTH_ERROR"}), 401

# --- Admin Auth ---
@app.route('/api/admin/login', methods=['POST'])
def admin_login_route():
    data = request.get_json();
    if not data: return jsonify({"error": "No data provided"}), 400
    email, password = data.get('email'), data.get('password')
    if not email or not password: return jsonify({'error': 'Email/password required'}), 400
    app.logger.info(f"ADMIN LOGIN ATTEMPT: Email='{email}'")
    admin = Admin.query.filter_by(email=email).first()
    if not admin:
        app.logger.warning(f"ADMIN LOGIN FAILED: No admin with email '{email}'")
        return jsonify({'error': 'Invalid admin email or password', 'type': 'AUTH_ERROR'}), 401
    if not admin.check_password(password):
        app.logger.warning(f"ADMIN LOGIN FAILED: Password incorrect for admin '{email}'")
        return jsonify({'error': 'Invalid admin email or password', 'type': 'AUTH_ERROR'}), 401
    app.logger.info(f"ADMIN LOGIN SUCCESS: Admin '{email}' authenticated.")
    admin.last_login = datetime.utcnow(); db.session.commit()
    session.clear(); session.permanent = True
    session['admin_id'], session['admin_email'], session['admin_full_name'] = admin.id, admin.email, admin.full_name
    
    # Log admin login
    log_admin_activity(admin.id, 'login', f'Admin logged in from {request.remote_addr}')
    
    return jsonify({'message': 'Admin login successful', 'admin': admin.to_dict()})

@app.route('/api/admin/logout', methods=['POST'])
@admin_required
def admin_logout_route():
    admin_id = session.get('admin_id')
    session.pop('admin_id', None); session.pop('admin_email', None); session.pop('admin_full_name', None)
    
    # Log admin logout
    if admin_id:
        log_admin_activity(admin_id, 'logout', f'Admin logged out from {request.remote_addr}')
    
    return jsonify({'message': 'Admin logged out successfully'})

@app.route('/api/admin/check-auth', methods=['GET'])
@admin_required
def check_admin_auth_route():
    admin = Admin.query.get(session['admin_id'])
    return jsonify({"authenticated": True, "admin": admin.to_dict()})

# --- User Profile ---
@app.route('/api/profile', methods=['GET'])
@login_required
def get_profile_route():
    user = User.query.get(session['user_id']); return jsonify(user.to_dict())

@app.route('/api/profile', methods=['PUT'])
@login_required
def update_profile_route():
    user = User.query.get(session['user_id']); data = request.get_json()
    if not data: return jsonify({"error": "No data provided"}), 400
    try:
        if 'fullName' in data: user.full_name = data['fullName']; session['user_full_name'] = user.full_name
        if 'dateOfBirth' in data: user.date_of_birth = datetime.strptime(data['dateOfBirth'], '%Y-%m-%d').date() if data['dateOfBirth'] else None
        if 'gender' in data: user.gender = data['gender']
        if 'phoneNumber' in data: user.phone_number = data['phoneNumber']
        if 'address' in data: user.address = data['address']
        db.session.commit()
        return jsonify({"message": "Profile updated", "user": user.to_dict()})
    except ValueError: return jsonify({"error": "Invalid date format"}), 400
    except Exception as e: db.session.rollback(); app.logger.error(f"Profile update error: {e}"); return jsonify({"error": "Update failed"}), 500

@app.route('/api/change-password', methods=['POST'])
@login_required
def change_password_route():
    user = User.query.get(session['user_id']); data = request.get_json()
    curr_pass, new_pass = data.get('currentPassword'), data.get('newPassword')
    if not all([curr_pass, new_pass]): return jsonify({"error": "Fields required"}), 400
    if not user.check_password(curr_pass): return jsonify({"error": "Current pass incorrect"}), 401
    if len(new_pass) < 6: return jsonify({"error": "New pass too short"}), 400
    user.set_password(new_pass)
    try: db.session.commit(); return jsonify({"message": "Password updated"})
    except Exception as e: db.session.rollback(); app.logger.error(f"Pwd change error: {e}"); return jsonify({"error": "Pwd change failed"}), 500

# --- Admin Resource CRUD ---
@app.route('/api/admin/resources', methods=['GET'])
@admin_required
def admin_get_resources_route():
    try:
        page = request.args.get('page', 1, type=int); per_page = request.args.get('per_page', 10, type=int)
        pagination = Resource.query.order_by(Resource.date_published.desc()).paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({'success': True, 'resources': [r.to_dict() for r in pagination.items], 'total': pagination.total,
                        'pages': pagination.pages, 'current_page': pagination.page, 'has_next': pagination.has_next, 'has_prev': pagination.has_prev})
    except Exception as e: app.logger.error(f"Admin get resources error: {e}"); return jsonify({'error': 'Fetch failed'}), 500

@app.route('/api/admin/resources', methods=['POST'])
@admin_required
def admin_create_resource_route():
    data = request.get_json();
    if not data or not all(f in data for f in ['title', 'description', 'category', 'url']): 
        return jsonify({'error': 'Missing fields'}), 400
    try:
        res = Resource(title=data['title'], description=data['description'], category=data['category'],
                       url=data['url'], image_url=data.get('imageUrl'), content=data.get('content'))
        db.session.add(res); db.session.commit()
        
        # Log resource creation
        log_admin_activity(
            session['admin_id'],
            'create_resource',
            f'Created resource: {data["title"]}'
        )
        
        return jsonify({'success': True, 'message': 'Resource created', 'resource': res.to_dict()}), 201
    except Exception as e: 
        db.session.rollback(); 
        app.logger.error(f"Admin create resource error: {e}")
        return jsonify({'error': 'Create failed'}), 500

@app.route('/api/admin/resources/<int:resource_id>', methods=['GET'])
@admin_required
def admin_get_resource_route(resource_id):
    res = Resource.query.get_or_404(resource_id); return jsonify({'success': True, 'resource': res.to_dict()})

@app.route('/api/admin/resources/<int:resource_id>', methods=['PUT'])
@admin_required
def admin_update_resource_route(resource_id):
    res = Resource.query.get_or_404(resource_id); data = request.get_json()
    if not data: return jsonify({'error': 'No data provided'}), 400
    try:
        res.title = data.get('title', res.title); res.description = data.get('description', res.description)
        res.category = data.get('category', res.category); res.url = data.get('url', res.url)
        res.image_url = data.get('imageUrl', res.image_url); res.content = data.get('content', res.content)
        if 'datePublished' in data and data['datePublished']:
            res.date_published = datetime.fromisoformat(data['datePublished'].replace('Z', '+00:00'))
        db.session.commit()
        return jsonify({'success': True, 'message': 'Resource updated', 'resource': res.to_dict()})
    except Exception as e: db.session.rollback(); app.logger.error(f"Admin update res error: {e}"); return jsonify({'error': 'Update failed'}), 500

@app.route('/api/admin/resources/<int:resource_id>', methods=['DELETE'])
@admin_required
def admin_delete_resource_route(resource_id):
    res = Resource.query.get_or_404(resource_id)
    try: 
        db.session.delete(res); 
        db.session.commit()
        
        # Log resource deletion
        log_admin_activity(
            session['admin_id'],
            'delete_resource',
            f'Deleted resource: {res.title}'
        )
        
        return jsonify({'success': True, 'message': 'Resource deleted'})
    except Exception as e: 
        db.session.rollback(); 
        app.logger.error(f"Admin delete res error: {e}")
        return jsonify({'error': 'Delete failed'}), 500

# --- Public Resource Routes ---
@app.route('/api/resources', methods=['GET'])
def get_public_resources_route():
    try:
        page = request.args.get('page', 1, type=int); per_page = request.args.get('per_page', 10, type=int)
        category = request.args.get('category', None, type=str)
        query = Resource.query
        if category: query = query.filter_by(category=category)
        pagination = query.order_by(Resource.date_published.desc()).paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({'success': True, 'resources': [r.to_dict() for r in pagination.items], 'total': pagination.total,
                        'pages': pagination.pages, 'currentPage': pagination.page, 'hasNext': pagination.has_next, 'hasPrev': pagination.has_prev})
    except Exception as e: app.logger.error(f"Public get resources error: {e}"); return jsonify({'success': False, 'error': 'Fetch failed'}), 500

@app.route('/api/resources/<int:resource_id>', methods=['GET'])
def get_public_resource_route(resource_id):
    try: res = Resource.query.get_or_404(resource_id); return jsonify({'success': True, 'resource': res.to_dict()})
    except Exception as e:
        app.logger.error(f"Public get resource by ID error: {e}")
        if hasattr(e, 'code') and e.code == 404: return jsonify({'success': False, 'error': 'Resource not found.'}), 404
        return jsonify({'success': False, 'error': 'Fetch failed'}), 500

# --- Prediction History Route ---
@app.route('/api/prediction-history', methods=['GET'])
@login_required
def get_prediction_history_route():
    current_user_id = session['user_id']
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 5, type=int)
    history_pagination = PredictionRecord.query.filter_by(user_id=current_user_id)\
                                             .order_by(PredictionRecord.prediction_date.desc())\
                                             .paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({'success': True, 'history': [r.to_dict() for r in history_pagination.items],
                    'total': history_pagination.total, 'pages': history_pagination.pages,
                    'currentPage': history_pagination.page, 'hasNext': history_pagination.has_next,
                    'hasPrev': history_pagination.has_prev})


# --- ML Model Prediction Endpoint ---
@app.route('/api/predict-heart-disease', methods=['POST'])
@login_required
def predict_heart_disease_route():
    if not ML_COMPONENTS_LOADED:
        app.logger.error("ML components not loaded for prediction.")
        return jsonify({"error": "Prediction service temporarily unavailable."}), 503

    current_user_id = session['user_id']
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    app.logger.info(f"PREDICTION - Raw JSON from frontend: {data}")
    feature_values_dict = {}
    for feature_name in EXPECTED_FEATURE_NAMES:
        value = data.get(feature_name)
        if value is None:
            if feature_name == 'exang':
                feature_values_dict[feature_name] = np.nan
            else:
                app.logger.error(f"Missing feature: {feature_name}")
                return jsonify({"error": f"Missing required feature: {feature_name}"}), 400
        else:
            try:
                feature_values_dict[feature_name] = float(value)
            except (ValueError, TypeError):
                app.logger.error(f"Invalid value for {feature_name}: {value}")
                return jsonify({"error": f"Invalid value for {feature_name}."}), 400

    try:
        imputed_features = simple_imputer.transform(pd.DataFrame([feature_values_dict], columns=EXPECTED_FEATURE_NAMES))
        app.logger.info(f"PREDICTION - After Imputation (shape: {imputed_features.shape}):\n{imputed_features}")
        scaled_features = scaler.transform(imputed_features)
        app.logger.info(f"PREDICTION - After Scaling (shape: {scaled_features.shape}):\n{scaled_features}")
        poly_features_transformed = poly_transformer.transform(scaled_features)
        app.logger.info(f"PREDICTION - After Poly (shape: {poly_features_transformed.shape}):\n{poly_features_transformed}")
        
        prediction_raw = heart_disease_model.predict(poly_features_transformed)
        app.logger.info(f"PREDICTION - Raw model.predict(): {prediction_raw}")
        prediction_result = int(prediction_raw[0])
        
        prediction_proba = None
        if hasattr(heart_disease_model, "predict_proba"):
            probabilities = heart_disease_model.predict_proba(poly_features_transformed)
            prediction_proba = float(probabilities[0][1])
            app.logger.info(f"PREDICTION - Probabilities: {probabilities}")
        
        app.logger.info(f"PREDICTION - Final prediction: {prediction_result}, Probability: {prediction_proba}")

        # Calculate risk level and percentage
        risk_percentage = round(prediction_proba * 100) if prediction_proba is not None else (75 if prediction_result == 1 else 15)
        risk_level = "high" if risk_percentage >= 70 else "medium" if risk_percentage >= 40 else "low"

        # Generate detailed interpretation
        interpretation = generate_interpretation(prediction_result, prediction_proba, feature_values_dict)

        # Save prediction record
        new_record = PredictionRecord(
            user_id=current_user_id,
            age=feature_values_dict.get('age'),
            sex=int(feature_values_dict.get('sex')),
            cp=int(feature_values_dict.get('cp')),
            trestbps=feature_values_dict.get('trestbps'),
            chol=feature_values_dict.get('chol'),
            fbs=int(feature_values_dict.get('fbs')),
            restecg=int(feature_values_dict.get('restecg')),
            thalach=feature_values_dict.get('thalach'),
            exang=int(feature_values_dict.get('exang')) if not np.isnan(feature_values_dict.get('exang')) else None,
            oldpeak=feature_values_dict.get('oldpeak'),
            slope=int(feature_values_dict.get('slope')),
            predicted_class=prediction_result,
            probability_score=prediction_proba
        )
        db.session.add(new_record)
        db.session.commit()
        app.logger.info(f"Prediction record {new_record.id} saved for user {current_user_id}.")

        return jsonify({
            "message": "Prediction successful",
            "prediction": prediction_result,
            "probability_of_heart_disease": prediction_proba,
            "interpretation": interpretation,
            "risk_level": risk_level,
            "risk_percentage": risk_percentage,
            "history_id": new_record.id
        })

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"PREDICTION - General error: {str(e)}")
        return jsonify({"error": "Prediction processing error."}), 500

def generate_interpretation(prediction_result, probability, features):
    """Generate detailed interpretation of the prediction results"""
    interpretation = []
    
    # Basic prediction interpretation
    if prediction_result == 1:
        interpretation.append("The model indicates a likelihood of heart disease.")
    else:
        interpretation.append("The model indicates a low likelihood of heart disease.")

    # Add probability-based interpretation
    if probability is not None:
        prob_percentage = round(probability * 100)
        if prob_percentage >= 70:
            interpretation.append(f"High confidence in prediction ({prob_percentage}%).")
        elif prob_percentage >= 40:
            interpretation.append(f"Moderate confidence in prediction ({prob_percentage}%).")
        else:
            interpretation.append(f"Low confidence in prediction ({prob_percentage}%).")

    # Add feature-based interpretations
    if features.get('age', 0) > 65:
        interpretation.append("Age is a significant risk factor.")
    if features.get('chol', 0) > 240:
        interpretation.append("Elevated cholesterol levels detected.")
    if features.get('trestbps', 0) > 140:
        interpretation.append("Elevated blood pressure noted.")
    if features.get('fbs', 0) == 1:
        interpretation.append("Elevated fasting blood sugar detected.")
    if features.get('exang', 0) == 1:
        interpretation.append("Exercise-induced angina reported.")

    return " ".join(interpretation)

# Add near your other admin routes in app.py

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats_route():
    try:
        user_count = User.query.count()
        # You can add more stats here later, e.g., resource_count
        # resource_count = Resource.query.count()
        return jsonify({
            "success": True,
            "stats": {
                "total_users": user_count,
                # "total_resources": resource_count 
            }
        }), 200
    except Exception as e:
        app.logger.error(f"Error fetching admin stats: {e}")
        return jsonify({"success": False, "error": "Failed to fetch statistics"}), 500
    
    
# --- Initial Data Seeding Utility ---
def create_initial_admin():
    with app.app_context():
        target_email = 'admin@hd.com'  # Changed email
        app.logger.info(f"Checking for existing admin: {target_email}")
        if not Admin.query.filter_by(email=target_email).first():
            app.logger.info(f"Attempting to create default admin: {target_email}")
            try:
                admin = Admin(email=target_email, full_name='HD Admin')
                admin_password = 'Admin@123'  # Changed password
                admin.set_password(admin_password)
                db.session.add(admin)
                db.session.commit()
                app.logger.info(f"Default admin '{target_email}' created.")
            except Exception as e:
                db.session.rollback()
                app.logger.error(f"ERROR creating default admin: {e}", exc_info=True)
        else:
            app.logger.info(f"Default admin '{target_email}' already exists.")

# --- Flask CLI Commands ---
@app.cli.command("seed-db")
def seed_db_command():
    """Creates initial admin user if not exists."""
    app.logger.info("Running seed-db command...")
    create_initial_admin()
    app.logger.info("Database seeding (admin user) completed.")

@app.cli.command("init-db") # Renamed for clarity, or use "create-db-tables"
def init_db_command():
    """Creates database tables based on SQLAlchemy models."""
    with app.app_context():
        db.create_all()
    app.logger.info("Database tables ensured/created (if they didn't exist based on models).")

@app.route('/api/upload-blood-report', methods=['POST'])
@login_required
def upload_blood_report_route():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file:
        return jsonify({'error': 'Invalid file'}), 400
    
    try:
        # Read file content
        file_content = file.read()
        file_type = file.content_type
        
        # Process the file
        extracted_values = blood_report_processor.process_file(file_content, file_type)
        
        return jsonify({
            'success': True,
            'extracted': extracted_values
        })
    except Exception as e:
        app.logger.error(f"Blood report processing error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-email', methods=['GET'])
@login_required
def test_email():
    """Test route to verify email configuration"""
    try:
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Test sending a health reminder email
        success = email_service.send_health_reminder(user.email, user.full_name)
        
        if success:
            app.logger.info(f"Test email sent successfully to {user.email}")
            return jsonify({
                'message': 'Test email sent successfully',
                'email': user.email
            })
        else:
            app.logger.error(f"Failed to send test email to {user.email}")
            return jsonify({'error': 'Failed to send test email'}), 500
            
    except Exception as e:
        app.logger.error(f"Error in test email route: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-email-config', methods=['GET'])
def test_email_config():
    """Test endpoint to verify email configuration"""
    try:
        # Check required configurations
        required_configs = {
            'MAIL_SERVER': app.config.get('MAIL_SERVER'),
            'MAIL_PORT': app.config.get('MAIL_PORT'),
            'MAIL_USERNAME': app.config.get('MAIL_USERNAME'),
            'MAIL_PASSWORD': '****' if app.config.get('MAIL_PASSWORD') else None,
            'MAIL_DEFAULT_SENDER': app.config.get('MAIL_DEFAULT_SENDER')
        }
        
        # Log all configurations for debugging
        app.logger.info("Current email configurations:")
        for key, value in required_configs.items():
            app.logger.info(f"{key}: {value}")
        
        missing_configs = [k for k, v in required_configs.items() if not v]
        
        if missing_configs:
            app.logger.error(f"Missing email configurations: {', '.join(missing_configs)}")
            return jsonify({
                'status': 'error',
                'message': 'Missing email configurations',
                'missing_configs': missing_configs,
                'current_config': {k: v for k, v in required_configs.items() if k != 'MAIL_PASSWORD'}
            }), 400
            
        # Try to send a test email
        test_email = app.config.get('MAIL_USERNAME')
        app.logger.info(f"Attempting to send test email to: {test_email}")
        
        success = email_service.send_health_reminder(test_email, "Test User")
        
        if success:
            app.logger.info("Test email sent successfully")
            return jsonify({
                'status': 'success',
                'message': 'Email configuration is working',
                'config': {k: v for k, v in required_configs.items() if k != 'MAIL_PASSWORD'}
            })
        else:
            app.logger.error("Failed to send test email")
            return jsonify({
                'status': 'error',
                'message': 'Failed to send test email',
                'config': {k: v for k, v in required_configs.items() if k != 'MAIL_PASSWORD'}
            }), 500
            
    except Exception as e:
        app.logger.error(f"Email configuration test failed: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': str(e),
            'error_type': type(e).__name__
        }), 500

# --- Database Initialization Check ---
def ensure_database_initialized():
    try:
        with app.app_context():
            # Test database connection
            db.engine.connect()
            app.logger.info("Database connection successful")
            
            # Ensure tables exist
            db.create_all()
            app.logger.info("Database tables verified")
            
            return True
    except Exception as e:
        app.logger.error(f"Database connection failed: {str(e)}", exc_info=True)
        return False

# Ensure database is initialized before handling requests
@app.before_request
def before_request():
    if not ensure_database_initialized():
        return jsonify({"error": "Database connection error"}), 500

# --- Database Table Creation ---
def create_tables_if_not_exist():
    try:
        with app.app_context():
            db.create_all()
            app.logger.info("Database tables created/verified successfully")
            return True
    except Exception as e:
        app.logger.error(f"Error creating database tables: {str(e)}", exc_info=True)
        return False

# Create tables when the application starts
create_tables_if_not_exist()

# --- Admin Dashboard Enhanced Routes ---
@app.route('/api/admin/user-activities', methods=['GET'])
@admin_required
def get_user_activities_route():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        user_id = request.args.get('user_id', type=int)
        activity_type = request.args.get('activity_type')
        
        query = UserActivity.query
        if user_id:
            query = query.filter_by(user_id=user_id)
        if activity_type:
            query = query.filter_by(activity_type=activity_type)
            
        pagination = query.order_by(UserActivity.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'activities': [activity.to_dict() for activity in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': pagination.page
        })
    except Exception as e:
        app.logger.error(f"Error fetching user activities: {str(e)}")
        return jsonify({'error': 'Failed to fetch user activities'}), 500

@app.route('/api/admin/system-health', methods=['GET'])
@admin_required
def get_system_health_route():
    try:
        # Get latest metrics for each type
        metrics = {}
        for metric_name in ['cpu_usage', 'memory_usage', 'disk_usage', 'active_users']:
            latest = SystemHealth.query.filter_by(metric_name=metric_name)\
                .order_by(SystemHealth.recorded_at.desc())\
                .first()
            if latest:
                metrics[metric_name] = latest.to_dict()
        
        # Get system status summary
        status_summary = {
            'healthy': SystemHealth.query.filter_by(status='healthy').count(),
            'warning': SystemHealth.query.filter_by(status='warning').count(),
            'critical': SystemHealth.query.filter_by(status='critical').count()
        }
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'status_summary': status_summary
        })
    except Exception as e:
        app.logger.error(f"Error fetching system health: {str(e)}")
        return jsonify({'error': 'Failed to fetch system health'}), 500

@app.route('/api/admin/activity-logs', methods=['GET'])
@admin_required
def get_admin_activity_logs_route():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        admin_id = request.args.get('admin_id', type=int)
        action_type = request.args.get('action_type')
        
        query = AdminActivityLog.query
        if admin_id:
            query = query.filter_by(admin_id=admin_id)
        if action_type:
            query = query.filter_by(action_type=action_type)
            
        pagination = query.order_by(AdminActivityLog.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'logs': [log.to_dict() for log in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': pagination.page
        })
    except Exception as e:
        app.logger.error(f"Error fetching admin activity logs: {str(e)}")
        return jsonify({'error': 'Failed to fetch admin activity logs'}), 500

@app.route('/api/admin/users/bulk', methods=['POST'])
@admin_required
def bulk_user_management_route():
    try:
        data = request.get_json()
        if not data or 'action' not in data or 'user_ids' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
            
        action = data['action']
        user_ids = data['user_ids']
        
        if action == 'delete':
            User.query.filter(User.id.in_(user_ids)).delete(synchronize_session=False)
            db.session.commit()
            return jsonify({'message': f'Successfully deleted {len(user_ids)} users'})
        elif action == 'deactivate':
            User.query.filter(User.id.in_(user_ids)).update(
                {User.is_active: False}, synchronize_session=False
            )
            db.session.commit()
            return jsonify({'message': f'Successfully deactivated {len(user_ids)} users'})
        else:
            return jsonify({'error': 'Invalid action'}), 400
            
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error in bulk user management: {str(e)}")
        return jsonify({'error': 'Failed to process bulk user action'}), 500

# Helper function to log admin activity
def log_admin_activity(admin_id, action_type, action_details=None):
    try:
        log = AdminActivityLog(
            admin_id=admin_id,
            action_type=action_type,
            action_details=action_details,
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        app.logger.error(f"Error logging admin activity: {str(e)}")

# Helper function to log user activity
def log_user_activity(user_id, activity_type, activity_details=None):
    try:
        activity = UserActivity(
            user_id=user_id,
            activity_type=activity_type,
            activity_details=activity_details,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string
        )
        db.session.add(activity)
        db.session.commit()
    except Exception as e:
        app.logger.error(f"Error logging user activity: {str(e)}")

# Helper function to update system health metrics
def update_system_health_metrics():
    with app.app_context():
        try:
            import psutil
            
            # CPU Usage
            cpu_usage = psutil.cpu_percent()
            cpu_status = 'critical' if cpu_usage > 90 else 'warning' if cpu_usage > 70 else 'healthy'
            SystemHealth(
                metric_name='cpu_usage',
                metric_value=cpu_usage,
                status=cpu_status,
                details=f'CPU usage at {cpu_usage}%'
            )
            
            # Memory Usage
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
            memory_status = 'critical' if memory_usage > 90 else 'warning' if memory_usage > 70 else 'healthy'
            SystemHealth(
                metric_name='memory_usage',
                metric_value=memory_usage,
                status=memory_status,
                details=f'Memory usage at {memory_usage}%'
            )
            
            # Disk Usage
            disk = psutil.disk_usage('/')
            disk_usage = disk.percent
            disk_status = 'critical' if disk_usage > 90 else 'warning' if disk_usage > 70 else 'healthy'
            SystemHealth(
                metric_name='disk_usage',
                metric_value=disk_usage,
                status=disk_status,
                details=f'Disk usage at {disk_usage}%'
            )
            
            # Active Users (last 15 minutes)
            active_users = UserActivity.query.filter(
                UserActivity.created_at >= datetime.utcnow() - timedelta(minutes=15)
            ).distinct(UserActivity.user_id).count()
            
            SystemHealth(
                metric_name='active_users',
                metric_value=active_users,
                status='healthy',
                details=f'{active_users} active users in last 15 minutes'
            )
            
            db.session.commit()
        except Exception as e:
            app.logger.error(f"Error updating system health metrics: {str(e)}")
            if 'db' in locals():
                db.session.rollback()

# Schedule system health updates
from apscheduler.schedulers.background import BackgroundScheduler
scheduler = BackgroundScheduler()
scheduler.add_job(update_system_health_metrics, 'interval', minutes=5)
scheduler.start()

# --- Admin User Management Routes ---
@app.route('/api/admin/users', methods=['GET'])
@admin_required
def get_users_route():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        query = User.query
        
        # Search functionality
        if search:
            search = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.email.ilike(search),
                    User.full_name.ilike(search),
                    User.phone_number.ilike(search)
                )
            )
        
        # Sorting
        if sort_by in ['email', 'full_name', 'created_at', 'last_checkup']:
            sort_column = getattr(User, sort_by)
            if sort_order == 'desc':
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
        
        # Pagination
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'success': True,
            'users': [user.to_dict() for user in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': pagination.page
        })
    except Exception as e:
        app.logger.error(f"Error fetching users: {str(e)}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user_details_route(user_id):
    try:
        user = User.query.get_or_404(user_id)
        # Get user's prediction history
        predictions = PredictionRecord.query.filter_by(user_id=user_id)\
            .order_by(PredictionRecord.prediction_date.desc())\
            .limit(5).all()
        
        # Get user's recent activities
        activities = UserActivity.query.filter_by(user_id=user_id)\
            .order_by(UserActivity.created_at.desc())\
            .limit(5).all()
        
        user_data = user.to_dict()
        user_data.update({
            'recent_predictions': [pred.to_dict() for pred in predictions],
            'recent_activities': [activity.to_dict() for activity in activities],
            'total_predictions': PredictionRecord.query.filter_by(user_id=user_id).count(),
            'last_activity': activities[0].to_dict() if activities else None
        })
        
        return jsonify({
            'success': True,
            'user': user_data
        })
    except Exception as e:
        app.logger.error(f"Error fetching user details: {str(e)}")
        return jsonify({'error': 'Failed to fetch user details'}), 500

# --- Admin Analytics Routes ---
@app.route('/api/admin/analytics/dashboard', methods=['GET'])
@admin_required
def get_dashboard_analytics_route():
    try:
        # Get total users
        total_users = User.query.count()
        
        # Get new users in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        new_users = User.query.filter(User.created_at >= thirty_days_ago).count()
        
        # Get total predictions
        total_predictions = PredictionRecord.query.count()
        
        # Get predictions in last 30 days
        recent_predictions = PredictionRecord.query.filter(
            PredictionRecord.prediction_date >= thirty_days_ago
        ).count()
        
        # Get risk level distribution using simpler queries
        high_risk = PredictionRecord.query.filter(
            PredictionRecord.probability_score >= 0.7
        ).count()
        
        medium_risk = PredictionRecord.query.filter(
            PredictionRecord.probability_score >= 0.4,
            PredictionRecord.probability_score < 0.7
        ).count()
        
        low_risk = PredictionRecord.query.filter(
            PredictionRecord.probability_score < 0.4
        ).count()
        
        risk_distribution = {
            'high': high_risk,
            'medium': medium_risk,
            'low': low_risk
        }
        
        # Get active users (users with predictions in last 30 days)
        active_users = db.session.query(PredictionRecord.user_id)\
            .filter(PredictionRecord.prediction_date >= thirty_days_ago)\
            .group_by(PredictionRecord.user_id)\
            .count()

        # Get doctor statistics
        total_doctors = Doctor.query.count()
        new_doctors = Doctor.query.filter(Doctor.created_at >= thirty_days_ago).count()
        
        # Get doctor specializations distribution
        specializations = db.session.query(
            Doctor.specialization,
            db.func.count(Doctor.id).label('count')
        ).group_by(Doctor.specialization).all()
        
        specialization_distribution = {
            spec: count for spec, count in specializations
        }
        
        # Get top rated doctors
        top_doctors = Doctor.query.order_by(Doctor.rating.desc()).limit(5).all()
        top_doctors_list = [{
            'id': doc.id,
            'name': doc.fullName,
            'specialization': doc.specialization,
            'rating': doc.rating,
            'totalAppointments': doc.totalAppointments
        } for doc in top_doctors]
        
        # Get system health metrics with default values
        latest_health = SystemHealth.query.order_by(SystemHealth.recorded_at.desc()).first()
        system_health = {
            'metricName': 'system_status',
            'metricValue': 100,
            'status': 'healthy',
            'details': 'System is running normally'
        } if not latest_health else latest_health.to_dict()
        
        return jsonify({
            'success': True,
            'analytics': {
                'users': {
                    'total': total_users,
                    'new_last_30_days': new_users,
                    'active_last_30_days': active_users
                },
                'predictions': {
                    'total': total_predictions,
                    'last_30_days': recent_predictions
                },
                'risk_distribution': risk_distribution,
                'doctors': {
                    'total': total_doctors,
                    'new_last_30_days': new_doctors,
                    'specialization_distribution': specialization_distribution,
                    'top_rated': top_doctors_list
                },
                'system_health': system_health
            }
        })
    except Exception as e:
        app.logger.error(f"Error fetching dashboard analytics: {str(e)}", exc_info=True)
        # Return a default response structure even in case of error
        return jsonify({
            'success': True,
            'analytics': {
                'users': {
                    'total': 0,
                    'new_last_30_days': 0,
                    'active_last_30_days': 0
                },
                'predictions': {
                    'total': 0,
                    'last_30_days': 0
                },
                'risk_distribution': {
                    'high': 0,
                    'medium': 0,
                    'low': 0
                },
                'doctors': {
                    'total': 0,
                    'new_last_30_days': 0,
                    'specialization_distribution': {},
                    'top_rated': []
                },
                'system_health': {
                    'metricName': 'system_status',
                    'metricValue': 0,
                    'status': 'error',
                    'details': 'Failed to fetch metrics'
                }
            }
        })

@app.route('/api/admin/analytics/predictions', methods=['GET'])
@admin_required
def get_prediction_analytics_route():
    try:
        # Get predictions over time (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        daily_predictions = db.session.query(
            db.func.date(PredictionRecord.prediction_date).label('date'),
            db.func.count(PredictionRecord.id).label('count')
        ).filter(
            PredictionRecord.prediction_date >= thirty_days_ago
        ).group_by('date').all()
        
        # Get average risk score over time
        daily_risk_scores = db.session.query(
            db.func.date(PredictionRecord.prediction_date).label('date'),
            db.func.avg(PredictionRecord.probability_score).label('avg_risk')
        ).filter(
            PredictionRecord.prediction_date >= thirty_days_ago
        ).group_by('date').all()
        
        return jsonify({
            'success': True,
            'analytics': {
                'daily_predictions': [
                    {'date': str(date), 'count': count}
                    for date, count in daily_predictions
                ],
                'daily_risk_scores': [
                    {'date': str(date), 'avg_risk': float(avg_risk) if avg_risk else 0}
                    for date, avg_risk in daily_risk_scores
                ]
            }
        })
    except Exception as e:
        app.logger.error(f"Error fetching prediction analytics: {str(e)}")
        return jsonify({'error': 'Failed to fetch prediction analytics'}), 500

# --- Enhanced System Monitoring Routes ---
@app.route('/api/admin/system/health-detailed', methods=['GET'])
@admin_required
def get_detailed_system_health_route():
    try:
        import psutil
        
        # CPU Information
        cpu_info = {
            'usage_percent': psutil.cpu_percent(interval=1),
            'count': psutil.cpu_count(),
            'frequency': psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
        }
        
        # Memory Information
        memory = psutil.virtual_memory()
        memory_info = {
            'total': memory.total,
            'available': memory.available,
            'used': memory.used,
            'percent': memory.percent
        }
        
        # Disk Information
        disk = psutil.disk_usage('/')
        disk_info = {
            'total': disk.total,
            'used': disk.used,
            'free': disk.free,
            'percent': disk.percent
        }
        
        # Network Information
        network = psutil.net_io_counters()
        network_info = {
            'bytes_sent': network.bytes_sent,
            'bytes_recv': network.bytes_recv,
            'packets_sent': network.packets_sent,
            'packets_recv': network.packets_recv
        }
        
        # Database Connection Status
        try:
            db.engine.connect()
            db_status = 'healthy'
        except Exception as e:
            db_status = 'error'
            app.logger.error(f"Database connection error: {str(e)}")
        
        # Application Metrics
        app_metrics = {
            'active_users': UserActivity.query.filter(
                UserActivity.created_at >= datetime.utcnow() - timedelta(minutes=15)
            ).distinct(UserActivity.user_id).count(),
            'total_users': User.query.count(),
            'total_predictions': PredictionRecord.query.count(),
            'database_status': db_status
        }
        
        return jsonify({
            'success': True,
            'system_health': {
                'cpu': cpu_info,
                'memory': memory_info,
                'disk': disk_info,
                'network': network_info,
                'application': app_metrics,
                'timestamp': datetime.utcnow().isoformat()
            }
        })
    except Exception as e:
        app.logger.error(f"Error fetching detailed system health: {str(e)}")
        return jsonify({'error': 'Failed to fetch system health details'}), 500

@app.route('/api/admin/system/logs', methods=['GET'])
@admin_required
def get_system_logs_route():
    try:
        # Get recent admin activities
        admin_activities = AdminActivityLog.query\
            .order_by(AdminActivityLog.created_at.desc())\
            .limit(50).all()
        
        # Get recent user activities
        user_activities = UserActivity.query\
            .order_by(UserActivity.created_at.desc())\
            .limit(50).all()
        
        # Get recent system health records
        health_records = SystemHealth.query\
            .order_by(SystemHealth.recorded_at.desc())\
            .limit(50).all()
        
        return jsonify({
            'success': True,
            'logs': {
                'admin_activities': [log.to_dict() for log in admin_activities],
                'user_activities': [activity.to_dict() for activity in user_activities],
                'health_records': [record.to_dict() for record in health_records]
            }
        })
    except Exception as e:
        app.logger.error(f"Error fetching system logs: {str(e)}")
        return jsonify({'error': 'Failed to fetch system logs'}), 500

# --- Doctor Management Routes ---
@app.route('/api/admin/doctors', methods=['GET'])
@admin_required
def get_doctors_route():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        specialization = request.args.get('specialization', '')
        
        app.logger.info(f"Fetching doctors - page: {page}, per_page: {per_page}, search: {search}, specialization: {specialization}")
        
        # Validate pagination parameters
        if page < 1:
            return jsonify({'error': 'Page number must be greater than 0'}), 400
        if per_page < 1 or per_page > 100:
            return jsonify({'error': 'Items per page must be between 1 and 100'}), 400
        
        try:
            # First, try to get a single doctor to check if the table structure is correct
            test_doctor = Doctor.query.first()
            if test_doctor:
                app.logger.info("Successfully queried a doctor record")
        except Exception as table_error:
            app.logger.error(f"Error accessing doctors table: {str(table_error)}", exc_info=True)
            return jsonify({
                'error': 'Database table structure error',
                'details': str(table_error)
            }), 500
        
        query = Doctor.query
        
        # Search functionality
        if search:
            search = f"%{search}%"
            query = query.filter(
                db.or_(
                    Doctor.fullName.ilike(search),
                    Doctor.email.ilike(search),
                    Doctor.hospital.ilike(search)
                )
            )
        
        # Filter by specialization
        if specialization:
            query = query.filter(Doctor.specialization == specialization)
        
        # Get total count before pagination
        try:
            total_count = query.count()
            app.logger.info(f"Total doctors found: {total_count}")
        except Exception as count_error:
            app.logger.error(f"Error counting doctors: {str(count_error)}", exc_info=True)
            return jsonify({
                'error': 'Error counting doctors',
                'details': str(count_error)
            }), 500
        
        # Paginate the results
        try:
            paginated_doctors = query.paginate(page=page, per_page=per_page, error_out=False)
            if not paginated_doctors.items and page > 1:
                # If no items found on requested page, return to page 1
                paginated_doctors = query.paginate(page=1, per_page=per_page, error_out=False)
                page = 1
            
            # Convert doctors to dict format
            doctors_list = []
            for doctor in paginated_doctors.items:
                try:
                    doctor_dict = doctor.to_dict()
                    doctors_list.append(doctor_dict)
                except Exception as dict_error:
                    app.logger.error(f"Error converting doctor {doctor.id} to dict: {str(dict_error)}", exc_info=True)
                    # Skip this doctor but continue with others
                    continue
            
            return jsonify({
                'success': True,
                'doctors': doctors_list,
                'total': total_count,
                'pages': paginated_doctors.pages,
                'current_page': page,
                'has_next': paginated_doctors.has_next,
                'has_prev': paginated_doctors.has_prev
            })
            
        except Exception as pagination_error:
            app.logger.error(f"Error during pagination: {str(pagination_error)}", exc_info=True)
            return jsonify({
                'error': 'Error during pagination',
                'details': str(pagination_error)
            }), 500
            
    except Exception as e:
        app.logger.error(f"Error fetching doctors: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to fetch doctors',
            'details': str(e)
        }), 500

@app.route('/api/admin/doctors', methods=['POST'])
@admin_required
def create_doctor_route():
    try:
        data = request.get_json()
        app.logger.info(f"Received doctor creation request with data: {data}")
        
        # Validate required fields
        required_fields = [
            'fullName', 'specialization', 'qualifications', 'experience',
            'hospital', 'address', 'city', 'area', 'phoneNumber',
            'email', 'availability', 'password'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            app.logger.error(f"Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Validate availability structure
        availability = data.get('availability', {})
        if not isinstance(availability, dict):
            app.logger.error(f"Invalid availability format: {availability}")
            return jsonify({'error': 'Availability must be a JSON object'}), 400
            
        required_availability_fields = ['days', 'startTime', 'endTime']
        missing_availability_fields = [field for field in required_availability_fields if field not in availability]
        if missing_availability_fields:
            app.logger.error(f"Missing availability fields: {missing_availability_fields}")
            return jsonify({'error': f'Missing availability fields: {", ".join(missing_availability_fields)}'}), 400
        
        # Validate days array
        if not isinstance(availability['days'], list) or not availability['days']:
            app.logger.error(f"Invalid days format: {availability['days']}")
            return jsonify({'error': 'Availability days must be a non-empty array'}), 400
        
        # Log the availability data structure
        app.logger.info(f"Availability data: {availability}")
        
        try:
            # Create new doctor with default values for optional fields
            doctor = Doctor(
                fullName=data['fullName'],
                specialization=data['specialization'],
                qualifications=data['qualifications'],
                experience=int(data['experience']),
                hospital=data['hospital'],
                address=data['address'],
                city=data['city'],
                area=data['area'],
                phoneNumber=data['phoneNumber'],
                email=data['email'],
                availability=availability,
                rating=0.0,
                totalAppointments=0,
                reviews=0,
                consultationFee=0.0,
                latitude=float(data.get('latitude', 0.0)) if data.get('latitude') is not None else None,
                longitude=float(data.get('longitude', 0.0)) if data.get('longitude') is not None else None
            )
            
            # Set password
            doctor.set_password(data['password'])
            
            app.logger.info("Doctor object created successfully")
            
            db.session.add(doctor)
            app.logger.info("Doctor added to session")
            
            db.session.commit()
            app.logger.info(f"Successfully created doctor with ID: {doctor.id}")
            
            return jsonify({
                'success': True,
                'message': 'Doctor created successfully',
                'doctor': doctor.to_dict()
            })
            
        except ValueError as ve:
            db.session.rollback()
            app.logger.error(f"Value error while creating doctor: {str(ve)}", exc_info=True)
            return jsonify({'error': f'Invalid data format: {str(ve)}'}), 400
        except Exception as db_error:
            db.session.rollback()
            app.logger.error(f"Database error while creating doctor: {str(db_error)}", exc_info=True)
            return jsonify({'error': f'Database error while creating doctor: {str(db_error)}'}), 500
            
    except Exception as e:
        app.logger.error(f"Unexpected error in doctor creation: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to create doctor'}), 500

@app.route('/api/admin/doctors/<int:doctor_id>', methods=['PUT'])
@admin_required
def update_doctor_route(doctor_id):
    try:
        doctor = Doctor.query.get_or_404(doctor_id)
        data = request.get_json()
        
        # Update fields
        if 'fullName' in data:
            doctor.fullName = data['fullName']
        if 'specialization' in data:
            doctor.specialization = data['specialization']
        if 'qualifications' in data:
            doctor.qualifications = data['qualifications']
        if 'experience' in data:
            doctor.experience = data['experience']
        if 'hospital' in data:
            doctor.hospital = data['hospital']
        if 'address' in data:
            doctor.address = data['address']
        if 'city' in data:
            doctor.city = data['city']
        if 'area' in data:
            doctor.area = data['area']
        if 'phoneNumber' in data:
            doctor.phoneNumber = data['phoneNumber']
        if 'email' in data:
            doctor.email = data['email']
        if 'availability' in data:
            doctor.availability = data['availability']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Doctor updated successfully',
            'doctor': doctor.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating doctor: {str(e)}")
        return jsonify({'error': 'Failed to update doctor'}), 500

@app.route('/api/admin/doctors/<int:doctor_id>', methods=['DELETE'])
@admin_required
def delete_doctor_route(doctor_id):
    try:
        doctor = Doctor.query.get_or_404(doctor_id)
        db.session.delete(doctor)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Doctor deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting doctor: {str(e)}")
        return jsonify({'error': 'Failed to delete doctor'}), 500

# --- Doctor Search and Recommendation Routes ---
@app.route('/api/doctors/search', methods=['GET'])
def search_doctors():
    try:
        city = request.args.get('city', '').strip()
        area = request.args.get('area', '').strip()
        specialization = request.args.get('specialization', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        app.logger.info(f"Doctor search request - City: {city}, Area: {area}, Specialization: {specialization}, Page: {page}")

        if not city:
            return jsonify({
                'success': False,
                'error': 'City is required'
            }), 400

        # Base query with case-insensitive search
        query = Doctor.query.filter(Doctor.city.ilike(f'%{city}%'))
        
        # Add area filter if provided
        if area:
            query = query.filter(Doctor.area.ilike(f'%{area}%'))

        # Add specialization filter if provided
        if specialization:
            query = query.filter(Doctor.specialization.ilike(f'%{specialization}%'))

        # Get total count before pagination
        total_count = query.count()
        app.logger.info(f"Total doctors found: {total_count}")

        # Paginate the results
        paginated_doctors = query.paginate(page=page, per_page=per_page, error_out=False)
        
        if not paginated_doctors.items and page > 1:
            # If no items found on requested page, return to page 1
            paginated_doctors = query.paginate(page=1, per_page=per_page, error_out=False)
            page = 1

        # Convert doctors to dict format
        doctors_list = []
        for doctor in paginated_doctors.items:
            try:
                doctor_dict = doctor.to_dict()
                doctors_list.append(doctor_dict)
            except Exception as dict_error:
                app.logger.error(f"Error converting doctor {doctor.id} to dict: {str(dict_error)}")
                continue

        return jsonify({
            'success': True,
            'doctors': doctors_list,
            'total': total_count,
            'pages': paginated_doctors.pages,
            'current_page': page,
            'has_next': paginated_doctors.has_next,
            'has_prev': paginated_doctors.has_prev
        })

    except Exception as e:
        app.logger.error(f"Error in search_doctors: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to search doctors',
            'details': str(e)
        }), 500

@app.route('/api/doctors/suggest', methods=['GET'])
def suggest_doctors_route():
    try:
        # Log the incoming request
        app.logger.info("Received doctor suggestion request")
        app.logger.info(f"Request args: {request.args}")

        # Get and validate parameters
        risk_level = request.args.get('riskLevel', 'low').lower()
        city = request.args.get('city', '').strip()
        area = request.args.get('area', '').strip()
        specialization = request.args.get('specialization', '').strip()
        
        app.logger.info(f"Parsed parameters - Risk: {risk_level}, City: {city}, Area: {area}, Specialization: {specialization}")
        
        # Validate required parameters
        if not city:
            app.logger.warning("City parameter is missing")
            return jsonify({
                'success': False,
                'error': 'City is required'
            }), 400

        try:
            # Base query with case-insensitive search
            query = Doctor.query.filter(Doctor.city.ilike(f'%{city}%'))
            
            # Add area filter if provided
            if area:
                query = query.filter(Doctor.area.ilike(f'%{area}%'))
            
            # Filter by specialization if provided
            if specialization:
                query = query.filter(Doctor.specialization.ilike(f'%{specialization}%'))
            
            # Get all matching doctors
            doctors = query.all()
            app.logger.info(f"Found {len(doctors)} doctors matching criteria")
            
            if not doctors:
                app.logger.info("No doctors found matching criteria")
                return jsonify({
                    'success': True,
                    'doctors': [],
                    'message': 'No doctors found matching your criteria'
                })
            
            # Calculate relevance score for each doctor
            suggested_doctors = []
            for doctor in doctors:
                try:
                    app.logger.info(f"Processing doctor {doctor.id}: {doctor.fullName}")
                    
                    # Get doctor dictionary with safe defaults
                    doctor_dict = doctor.to_dict()
                    if not doctor_dict:
                        app.logger.warning(f"Doctor {doctor.id} returned empty dictionary")
                        continue
                    
                    # Calculate a relevance score based on multiple factors
                    relevance_score = 0
                    
                    # Experience factor (0-3 points)
                    try:
                        if risk_level == 'high':
                            if doctor.experience >= 10:
                                relevance_score += 3
                            elif doctor.experience >= 5:
                                relevance_score += 2
                            elif doctor.experience >= 2:
                                relevance_score += 1
                        elif risk_level == 'medium':
                            if doctor.experience >= 5:
                                relevance_score += 2
                            elif doctor.experience >= 2:
                                relevance_score += 1
                        else:  # low risk
                            if doctor.experience >= 2:
                                relevance_score += 1
                    except Exception as exp_error:
                        app.logger.error(f"Error calculating experience score for doctor {doctor.id}: {str(exp_error)}")
                    
                    # Rating factor (0-2 points)
                    try:
                        relevance_score += min(float(doctor.rating or 0), 5) * 0.4
                    except Exception as rating_error:
                        app.logger.error(f"Error calculating rating score for doctor {doctor.id}: {str(rating_error)}")
                    
                    # Reviews factor (0-1 point)
                    try:
                        relevance_score += min(int(doctor.reviews or 0) / 50, 1)
                    except Exception as reviews_error:
                        app.logger.error(f"Error calculating reviews score for doctor {doctor.id}: {str(reviews_error)}")
                    
                    # Specialization match factor (0-2 points)
                    try:
                        if specialization and specialization.lower() in doctor.specialization.lower():
                            relevance_score += 2
                    except Exception as spec_error:
                        app.logger.error(f"Error calculating specialization score for doctor {doctor.id}: {str(spec_error)}")
                    
                    # Location match factor (0-2 points)
                    try:
                        if area and area.lower() in doctor.area.lower():
                            relevance_score += 2
                        elif city.lower() in doctor.city.lower():
                            relevance_score += 1
                    except Exception as loc_error:
                        app.logger.error(f"Error calculating location score for doctor {doctor.id}: {str(loc_error)}")
                    
                    doctor_dict['relevance_score'] = round(relevance_score, 2)
                    suggested_doctors.append(doctor_dict)
                    app.logger.info(f"Successfully processed doctor {doctor.id} with relevance score {relevance_score}")
                except Exception as dict_error:
                    app.logger.error(f"Error processing doctor {doctor.id}: {str(dict_error)}", exc_info=True)
                    continue
            
            # Sort by relevance score
            suggested_doctors.sort(key=lambda x: -x['relevance_score'])
            
            app.logger.info(f"Successfully processed {len(suggested_doctors)} doctors")
            
            return jsonify({
                'success': True,
                'doctors': suggested_doctors,
                'total': len(suggested_doctors)
            })
        except Exception as query_error:
            app.logger.error(f"Database query error: {str(query_error)}", exc_info=True)
            return jsonify({
                'success': False,
                'error': 'Error querying database',
                'details': str(query_error)
            }), 500
    except Exception as e:
        app.logger.error(f"Unexpected error in suggest_doctors_route: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred',
            'details': str(e)
        }), 500

# --- Appointment Routes ---
@app.route('/api/appointments', methods=['GET'])
@login_required
def get_appointments_route():
    try:
        user_id = session['user_id']
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = Appointment.query.filter_by(user_id=user_id)
        pagination = query.order_by(Appointment.date.desc(), Appointment.time.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'appointments': [appointment.to_dict() for appointment in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': pagination.page
        })
    except Exception as e:
        app.logger.error(f"Error fetching appointments: {str(e)}")
        return jsonify({'error': 'Failed to fetch appointments'}), 500

@app.route('/api/appointments', methods=['POST'])
@login_required
def create_appointment_route():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        required_fields = ['doctorId', 'date', 'time', 'reason']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate doctor exists
        doctor = Doctor.query.get(data['doctorId'])
        if not doctor:
            return jsonify({'error': 'Doctor not found'}), 404
        
        # Parse date and time
        try:
            appointment_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            appointment_time = datetime.strptime(data['time'], '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time'}), 400
        
        # First check if the slot is within doctor's availability
        available_slots = get_available_slots(doctor, appointment_date)
        if not available_slots:
            return jsonify({
                'error': 'Doctor is not available on this date',
                'message': 'Please select a different date'
            }), 409
            
        if appointment_time.strftime('%H:%M') not in available_slots:
            return jsonify({
                'error': 'Selected time slot is not available',
                'message': 'Please select from available time slots',
                'availableSlots': available_slots
            }), 409
        
        # Then check if the slot is already booked
        if not is_slot_available(doctor.id, appointment_date, appointment_time):
            # Get next 7 days of available slots
            alternative_dates = []
            current_date = appointment_date
            for _ in range(7):
                current_date = current_date + timedelta(days=1)
                available_slots = get_available_slots(doctor, current_date)
                if available_slots:
                    alternative_dates.append({
                        'date': current_date.isoformat(),
                        'availableSlots': available_slots
                    })
            
            return jsonify({
                'error': 'This time slot is already booked',
                'message': 'Please select an alternative time slot',
                'suggestions': {
                    'message': 'Here are some alternative dates and times:',
                    'alternativeDates': alternative_dates
                }
            }), 409
        
        # Create appointment
        appointment = Appointment(
            user_id=session['user_id'],
            doctor_id=data['doctorId'],
            date=appointment_date,
            time=appointment_time,
            reason=data['reason'],
            status='scheduled'
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Appointment created successfully',
            'appointment': appointment.to_dict()
        })
    except ValueError as e:
        return jsonify({'error': 'Invalid date or time format'}), 400
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error creating appointment: {str(e)}")
        return jsonify({'error': 'Failed to create appointment'}), 500

@app.route('/api/appointments/<int:appointment_id>', methods=['PUT'])
def update_appointment_route(appointment_id):
    try:
        # Check if doctor is authenticated
        if 'doctor_id' not in session:
            return jsonify({'error': 'Unauthorized', 'type': 'AUTH_ERROR'}), 401

        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Verify that the appointment belongs to this doctor
        if appointment.doctor_id != session['doctor_id']:
            return jsonify({'error': 'Unauthorized to update this appointment'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields
        if 'status' in data:
            appointment.status = data['status']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Appointment updated successfully',
            'appointment': appointment.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating appointment: {str(e)}")
        return jsonify({'error': 'Failed to update appointment'}), 500

@app.route('/api/appointments/<int:appointment_id>', methods=['DELETE'])
@login_required
def delete_appointment_route(appointment_id):
    try:
        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Verify ownership
        if appointment.user_id != session['user_id']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Appointment deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting appointment: {str(e)}")
        return jsonify({'error': 'Failed to delete appointment'}), 500

# --- Main Execution ---
if __name__ == '__main__':
    # Recommended setup:
    # 1. flask db init (once per project)
    # 2. flask db migrate -m "Initial schema"
    # 3. flask db upgrade
    # 4. flask seed-db
    port = int(os.environ.get("PORT", 5000))
    is_debug = os.getenv('FLASK_DEBUG', '1') == '1' # Default to debug for development
    app.run(debug=is_debug, host='0.0.0.0', port=port)

@app.route('/api/locations', methods=['GET'])
def get_locations_route():
    try:
        # Get unique cities and their corresponding areas
        cities_query = db.session.query(Doctor.city).distinct().order_by(Doctor.city)
        cities = [city[0] for city in cities_query.all()]
        
        # Get areas for each city
        locations = {}
        for city in cities:
            areas_query = db.session.query(Doctor.area)\
                .filter(Doctor.city == city)\
                .distinct()\
                .order_by(Doctor.area)
            locations[city] = [area[0] for area in areas_query.all()]
        
        return jsonify({
            'success': True,
            'locations': locations
        })
    except Exception as e:
        app.logger.error(f"Error fetching locations: {str(e)}")
        return jsonify({'error': 'Failed to fetch locations'}), 500

# Add this new route for debugging
@app.route('/api/doctors/debug', methods=['GET'])
def debug_doctors():
    try:
        # Get all doctors
        all_doctors = Doctor.query.all()
        
        # Get unique cities and areas
        cities = db.session.query(Doctor.city).distinct().all()
        areas = db.session.query(Doctor.area).distinct().all()
        
        return jsonify({
            'success': True,
            'total_doctors': len(all_doctors),
            'cities': [city[0] for city in cities],
            'areas': [area[0] for area in areas],
            'doctors': [doctor.to_dict() for doctor in all_doctors]
        })
    except Exception as e:
        app.logger.error(f"Error in debug_doctors: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Add these helper functions after the Doctor model definition

def get_available_slots(doctor, date):
    """Get available time slots for a doctor on a specific date."""
    try:
        # Get doctor's availability
        availability = doctor.availability
        if not availability or 'days' not in availability or 'startTime' not in availability or 'endTime' not in availability:
            return []

        # Check if the date is in the doctor's available days
        day_name = date.strftime('%A')  # Get full day name (e.g., 'Monday', 'Tuesday')
        if day_name not in availability['days']:
            return []

        # Parse start and end times
        start_time = datetime.strptime(availability['startTime'], '%H:%M').time()
        end_time = datetime.strptime(availability['endTime'], '%H:%M').time()

        # Get all booked appointments for this doctor on this date
        booked_slots = Appointment.query.filter_by(
            doctor_id=doctor.id,
            date=date,
            status='scheduled'  # Only consider active appointments
        ).all()

        # Convert booked slots to time objects
        booked_times = [appt.time for appt in booked_slots]

        # Generate all possible slots (30-minute intervals)
        available_slots = []
        current_time = start_time
        while current_time < end_time:
            # Check if this slot is not booked
            if current_time not in booked_times:
                available_slots.append(current_time.strftime('%H:%M'))
            # Add 30 minutes
            current_time = (datetime.combine(date, current_time) + timedelta(minutes=30)).time()

        return available_slots
    except Exception as e:
        app.logger.error(f"Error getting available slots: {str(e)}")
        return []

def is_slot_available(doctor_id, date, time):
    """Check if a specific slot is available."""
    try:
        # Check if there's any existing appointment for this slot
        existing_appointment = Appointment.query.filter_by(
            doctor_id=doctor_id,
            date=date,
            time=time,
            status='scheduled'
        ).first()
        
        return existing_appointment is None
    except Exception as e:
        app.logger.error(f"Error checking slot availability: {str(e)}")
        return False

# Add these new routes after your existing appointment routes

@app.route('/api/appointments/available-slots', methods=['GET'])
@login_required
def get_available_slots_route():
    try:
        doctor_id = request.args.get('doctorId')
        date_str = request.args.get('date')
        
        if not doctor_id or not date_str:
            return jsonify({'error': 'Doctor ID and date are required'}), 400
            
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
            
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return jsonify({'error': 'Doctor not found'}), 404
            
        available_slots = get_available_slots(doctor, date)
        
        return jsonify({
            'success': True,
            'availableSlots': available_slots
        })
    except Exception as e:
        app.logger.error(f"Error getting available slots: {str(e)}")
        return jsonify({'error': 'Failed to get available slots'}), 500

# Add doctor authentication routes
@app.route('/api/doctor/login', methods=['POST', 'OPTIONS'])
def doctor_login_route():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = '*'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '3600'
        response.headers['Vary'] = 'Origin'
        return response, 200

    try:
        data = request.get_json()
        if not data:
            app.logger.error("Doctor login attempt with no data")
            return jsonify({"error": "No data provided"}), 400

        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            app.logger.error(f"Doctor login attempt with missing credentials: email={bool(email)}, password={bool(password)}")
            return jsonify({"error": "Email and password are required"}), 400

        app.logger.info(f"Doctor login attempt for email: {email}")
        
        try:
            doctor = Doctor.query.filter_by(email=email).first()
        except Exception as db_error:
            app.logger.error(f"Database error during doctor login: {str(db_error)}")
            return jsonify({"error": "Database error occurred"}), 500
        
        if not doctor:
            app.logger.warning(f"Doctor login failed: No doctor found with email {email}")
            return jsonify({"error": "Invalid email or password", "type": "AUTH_ERROR"}), 401
            
        if not doctor.check_password(password):
            app.logger.warning(f"Doctor login failed: Invalid password for doctor {email}")
            return jsonify({"error": "Invalid email or password", "type": "AUTH_ERROR"}), 401

        try:
            # Clear any existing session data
            session.clear()
            session.permanent = True
            
            # Set session data
            session['doctor_id'] = doctor.id
            session['doctor_email'] = doctor.email
            session['doctor_name'] = doctor.fullName
        
            # Update last login
            doctor.last_login = datetime.utcnow()
            db.session.commit()
        
            app.logger.info(f"Doctor login successful for {email}")
            
            response = jsonify({
                "message": "Doctor login successful",
                "doctor": doctor.to_dict()
            })
            
            # Set CORS headers for the response
            response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            
            return response
            
        except Exception as session_error:
            app.logger.error(f"Session error during doctor login: {str(session_error)}")
            return jsonify({"error": "Session error occurred"}), 500

    except Exception as e:
        app.logger.error(f"Unexpected error during doctor login: {str(e)}", exc_info=True)
        return jsonify({
            "error": "An unexpected error occurred during login",
            "message": str(e)
        }), 500

@app.route('/api/doctor/logout', methods=['POST'])
def doctor_logout_route():
    session.pop('doctor_id', None)
    session.pop('doctor_email', None)
    session.pop('doctor_name', None)
    return jsonify({"message": "Doctor logged out successfully"})

@app.route('/api/doctor/check-auth', methods=['GET'])
def check_doctor_auth_route():
    if 'doctor_id' in session:
        doctor = Doctor.query.get(session['doctor_id'])
        if doctor:
            return jsonify({"authenticated": True, "doctor": doctor.to_dict()})
    return jsonify({"authenticated": False, "type": "AUTH_ERROR"}), 401

@app.route('/api/doctor/change-password', methods=['POST'])
def doctor_change_password_route():
    if 'doctor_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')

        if not current_password or not new_password:
            return jsonify({"error": "Both current and new passwords are required"}), 400

        doctor = Doctor.query.get(session['doctor_id'])
        if not doctor.check_password(current_password):
            return jsonify({"error": "Current password is incorrect"}), 401

        doctor.set_password(new_password)
        db.session.commit()

        return jsonify({"message": "Password updated successfully"})
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error changing doctor password: {str(e)}")
        return jsonify({"error": "Failed to update password"}), 500

@app.route('/api/admin/debug/doctors', methods=['GET'])
@admin_required
def debug_doctors_table():
    try:
        # Get all doctors
        doctors = Doctor.query.all()
        
        # Get table info
        table_info = {
            'total_doctors': len(doctors),
            'doctors': []
        }
        
        for doctor in doctors:
            doctor_dict = {
                'id': doctor.id,
                'fullName': doctor.fullName,
                'email': doctor.email,
                'has_password_hash': bool(doctor.password_hash),
                'password_hash_length': len(doctor.password_hash) if doctor.password_hash else 0
            }
            table_info['doctors'].append(doctor_dict)
        
        return jsonify({
            'success': True,
            'table_info': table_info
        })
    except Exception as e:
        app.logger.error(f"Error in debug_doctors_table: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Add OPTIONS route handler for CORS preflight requests
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = app.make_default_options_response()
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    response.headers['Access-Control-Allow-Headers'] = '*'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Max-Age'] = '3600'
    response.headers['Vary'] = 'Origin'
    return response, 200

# Add these routes after the doctor login routes

@app.route('/api/doctor/forgot-password', methods=['POST', 'OPTIONS'])
def doctor_forgot_password_route():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = '*'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '3600'
        response.headers['Vary'] = 'Origin'
        return response, 200

    try:
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({"error": "Email is required"}), 400

        email = data['email']
        doctor = Doctor.query.filter_by(email=email).first()

        if not doctor:
            # For security reasons, return success even if email doesn't exist
            return jsonify({
                "message": "If your email is registered, you will receive password reset instructions."
            })

        # Generate a secure token
        token = secrets.token_urlsafe(32)
        expiry = datetime.utcnow() + timedelta(hours=1)

        # Store the token in the database (you might want to create a separate table for this)
        # For now, we'll store it in the session
        session[f'reset_token_{doctor.id}'] = {
            'token': token,
            'expiry': expiry.isoformat()
        }

        # Create reset link
        reset_link = f"http://localhost:3000/reset-password?token={token}&id={doctor.id}"

        # Send email
        try:
            email_service.send_password_reset_email(
                doctor.email,
                doctor.fullName,
                reset_link
            )
            app.logger.info(f"Password reset email sent to doctor {doctor.email}")
        except Exception as e:
            app.logger.error(f"Failed to send password reset email: {str(e)}")
            return jsonify({"error": "Failed to send reset email"}), 500

        return jsonify({
            "message": "If your email is registered, you will receive password reset instructions."
        })

    except Exception as e:
        app.logger.error(f"Error in forgot password route: {str(e)}")
        return jsonify({"error": "An error occurred"}), 500

@app.route('/api/doctor/reset-password', methods=['POST', 'OPTIONS'])
def doctor_reset_password_route():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = '*'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '3600'
        response.headers['Vary'] = 'Origin'
        return response, 200

    try:
        data = request.get_json()
        if not data or not all(k in data for k in ['token', 'doctorId', 'newPassword']):
            return jsonify({"error": "Missing required fields"}), 400

        token = data['token']
        doctor_id = data['doctorId']
        new_password = data['newPassword']

        # Validate token
        stored_token_data = session.get(f'reset_token_{doctor_id}')
        if not stored_token_data:
            return jsonify({"error": "Invalid or expired token"}), 400

        stored_token = stored_token_data['token']
        expiry = datetime.fromisoformat(stored_token_data['expiry'])

        if token != stored_token:
            return jsonify({"error": "Invalid token"}), 400

        if datetime.utcnow() > expiry:
            session.pop(f'reset_token_{doctor_id}', None)
            return jsonify({"error": "Token has expired"}), 400

        # Update password
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return jsonify({"error": "Doctor not found"}), 404

        doctor.set_password(new_password)
        db.session.commit()

        # Clear the token
        session.pop(f'reset_token_{doctor_id}', None)

        return jsonify({
            "message": "Password has been reset successfully"
        })

    except Exception as e:
        app.logger.error(f"Error in reset password route: {str(e)}")
        return jsonify({"error": "An error occurred"}), 500

@app.route('/api/doctor/simple-reset-password', methods=['POST', 'OPTIONS'])
def doctor_simple_reset_password_route():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-requested-with'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '3600'
        response.headers['Vary'] = 'Origin'
        return response, 200

    try:
        data = request.get_json()
        if not data or not all(k in data for k in ['email', 'newPassword']):
            return jsonify({"error": "Email and new password are required"}), 400

        email = data['email']
        new_password = data['newPassword']

        # Find doctor by email
        doctor = Doctor.query.filter_by(email=email).first()
        if not doctor:
            return jsonify({"error": "Doctor not found"}), 404

        # Update password
        doctor.set_password(new_password)
        db.session.commit()

        response = jsonify({
            "message": "Password has been reset successfully"
        })
        
        # Add CORS headers to the response
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error in simple reset password route: {str(e)}")
        return jsonify({"error": "An error occurred"}), 500

@app.route('/api/appointments/doctor', methods=['GET'])
def get_doctor_appointments_route():
    try:
        app.logger.info(f"Session contents: {dict(session)}")
        app.logger.info(f"Doctor ID in session: {session.get('doctor_id')}")
        
        if 'doctor_id' not in session:
            app.logger.warning("No doctor_id found in session")
            return jsonify({'error': 'Unauthorized', 'type': 'AUTH_ERROR'}), 401

        doctor_id = session['doctor_id']
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = Appointment.query.filter_by(doctor_id=doctor_id)
        pagination = query.order_by(Appointment.date.desc(), Appointment.time.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        response = jsonify({
            'success': True,
            'appointments': [appointment.to_dict() for appointment in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': pagination.page
        })
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    except Exception as e:
        app.logger.error(f"Error fetching doctor appointments: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to fetch appointments'}), 500