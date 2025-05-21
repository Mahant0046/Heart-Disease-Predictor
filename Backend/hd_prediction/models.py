from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

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
        recent_predictions = PredictionRecord.query.filter_by(user_id=self.id)\
            .order_by(PredictionRecord.prediction_date.desc())\
            .limit(3).all()
        if not recent_predictions:
            return 75
        total_weight = 0
        weighted_sum = 0
        for i, pred in enumerate(recent_predictions):
            weight = 0.5 if i == 0 else (0.3 if i == 1 else 0.2)
            risk_percentage = pred.to_dict()['riskPercentage']
            health_score = 100 - risk_percentage
            weighted_sum += health_score * weight
            total_weight += weight
        final_score = round(weighted_sum / total_weight)
        return max(0, min(100, final_score))
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
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', name='fk_prediction_user_id'), nullable=False)
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
    user = db.relationship('User', backref=db.backref('prediction_history', lazy='dynamic'))

    def to_dict(self):
        symptoms_list = [f"Age: {self.age}", f"Sex: {'Male' if self.sex == 1 else 'Female'}"]
        cp_map = {0: "Typical Angina", 1: "Atypical Angina", 2: "Non-anginal Pain", 3: "Asymptomatic", 4: "CP Type 4"}
        restecg_map = {0: "Normal", 1: "ST-T Abnormality", 2: "LV Hypertrophy"}
        slope_map = {0: "Upsloping", 1: "Flat", 2: "Downsloping", 3: "Slope Type 3"}
        if self.cp in cp_map: symptoms_list.append(f"Chest Pain: {cp_map[self.cp]}")
        if self.trestbps > 130: symptoms_list.append(f"Resting BP: {self.trestbps} (Elevated)")
        if self.chol > 200: symptoms_list.append(f"Cholesterol: {self.chol} (Elevated)")
        if self.fbs == 1: symptoms_list.append("Fasting Blood Sugar: >120 mg/dl")
        if self.restecg in restecg_map: symptoms_list.append(f"Resting ECG: {restecg_map[self.restecg]}")
        if self.exang == 1: symptoms_list.append("Exercise Induced Angina: Yes")
        if self.oldpeak > 1.0: symptoms_list.append(f"ST Depression (Oldpeak): {self.oldpeak} (Significant)")
        if self.slope in slope_map: symptoms_list.append(f"ST Slope: {slope_map[self.slope]}")
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
                'symptoms': symptoms_list[:3], 'recommendations': recommendations_list[:3],
                'inputFeatures': { 'age': self.age, 'sex': self.sex, 'cp': self.cp, 'trestbps': self.trestbps,
                                   'chol': self.chol, 'fbs': self.fbs, 'restecg': self.restecg, 'thalach': self.thalach,
                                   'exang': self.exang, 'oldpeak': self.oldpeak, 'slope': self.slope}} 