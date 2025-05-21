import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import xgboost as xgb
import joblib
import os

def load_and_preprocess_data(file_path):
    """Load and preprocess the heart disease dataset"""
    # Load the data
    df = pd.read_csv(file_path)
    
    # Separate features and target
    X = df.drop('target', axis=1)
    y = df['target']
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    return X_train, X_test, y_train, y_test

def create_preprocessing_pipeline():
    """Create and return preprocessing components"""
    # Imputer for handling missing values
    imputer = SimpleImputer(strategy='median')
    
    # Scaler for normalizing features
    scaler = StandardScaler()
    
    # Polynomial features for capturing interactions
    poly = PolynomialFeatures(degree=2, include_bias=False)
    
    return imputer, scaler, poly

def train_model(X_train, y_train, imputer, scaler, poly):
    """Train the XGBoost model with improved parameters"""
    # Preprocess training data
    X_train_imputed = imputer.fit_transform(X_train)
    X_train_scaled = scaler.fit_transform(X_train_imputed)
    X_train_poly = poly.fit_transform(X_train_scaled)
    
    # Define XGBoost parameters
    params = {
        'objective': 'binary:logistic',
        'eval_metric': 'logloss',
        'max_depth': 4,  # Reduced to prevent overfitting
        'learning_rate': 0.1,
        'n_estimators': 100,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,
        'gamma': 0.1,
        'scale_pos_weight': 1,  # Adjust if class imbalance exists
        'random_state': 42
    }
    
    # Train the model
    model = xgb.XGBClassifier(**params)
    model.fit(X_train_poly, y_train)
    
    return model

def evaluate_model(model, X_test, y_test, imputer, scaler, poly):
    """Evaluate the model's performance"""
    # Preprocess test data
    X_test_imputed = imputer.transform(X_test)
    X_test_scaled = scaler.transform(X_test_imputed)
    X_test_poly = poly.transform(X_test_scaled)
    
    # Make predictions
    y_pred = model.predict(X_test_poly)
    y_pred_proba = model.predict_proba(X_test_poly)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred)
    conf_matrix = confusion_matrix(y_test, y_pred)
    
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(report)
    print("\nConfusion Matrix:")
    print(conf_matrix)
    
    return accuracy, report, conf_matrix

def save_components(model, imputer, scaler, poly, output_dir):
    """Save the model and preprocessing components"""
    os.makedirs(output_dir, exist_ok=True)
    
    joblib.dump(model, os.path.join(output_dir, 'heart_disease_model.joblib'))
    joblib.dump(imputer, os.path.join(output_dir, 'simple_imputer.joblib'))
    joblib.dump(scaler, os.path.join(output_dir, 'scaler.joblib'))
    joblib.dump(poly, os.path.join(output_dir, 'polynomial_features.joblib'))
    
    print(f"Components saved to {output_dir}")

def main():
    # Path to your dataset
    data_path = 'heart_disease_data.csv'  # Update this path
    
    # Load and preprocess data
    X_train, X_test, y_train, y_test = load_and_preprocess_data(data_path)
    
    # Create preprocessing pipeline
    imputer, scaler, poly = create_preprocessing_pipeline()
    
    # Train model
    model = train_model(X_train, y_train, imputer, scaler, poly)
    
    # Evaluate model
    accuracy, report, conf_matrix = evaluate_model(model, X_test, y_test, imputer, scaler, poly)
    
    # Save components
    save_components(model, imputer, scaler, poly, '.')

if __name__ == "__main__":
    main() 