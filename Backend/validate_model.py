import pandas as pd
import numpy as np
import joblib
from sklearn.metrics import accuracy_score, classification_report

def load_components():
    """Load the model and preprocessing components"""
    model = joblib.load('heart_disease_model.joblib')
    imputer = joblib.load('simple_imputer.joblib')
    scaler = joblib.load('scaler.joblib')
    poly = joblib.load('polynomial_features.joblib')
    return model, imputer, scaler, poly

def preprocess_input(input_data):
    """Preprocess a single input case"""
    model, imputer, scaler, poly = load_components()
    
    # Convert input to DataFrame
    df = pd.DataFrame([input_data])
    
    # Apply preprocessing
    imputed = imputer.transform(df)
    scaled = scaler.transform(imputed)
    poly_features = poly.transform(scaled)
    
    return poly_features

def validate_case(input_data, expected_output):
    """Validate a single case against the model"""
    # Preprocess input
    processed_input = preprocess_input(input_data)
    
    # Load model and make prediction
    model = joblib.load('heart_disease_model.joblib')
    prediction = model.predict(processed_input)[0]
    probability = model.predict_proba(processed_input)[0][1]
    
    # Compare with expected output
    is_correct = prediction == expected_output
    
    return {
        'prediction': int(prediction),
        'probability': float(probability),
        'expected': int(expected_output),
        'is_correct': bool(is_correct)
    }

def main():
    # Test case that was showing incorrect prediction
    test_case = {
        'age': 61,
        'sex': 0,
        'cp': 4,
        'trestbps': 130,
        'chol': 294,
        'fbs': 0,
        'restecg': 1,
        'thalach': 120,
        'exang': 1,
        'oldpeak': 1,
        'slope': 2
    }
    
    # Expected output (0 for no heart disease)
    expected_output = 0
    
    # Validate the case
    result = validate_case(test_case, expected_output)
    
    print("\nValidation Results:")
    print(f"Input Features: {test_case}")
    print(f"Model Prediction: {result['prediction']}")
    print(f"Prediction Probability: {result['probability']:.4f}")
    print(f"Expected Output: {result['expected']}")
    print(f"Prediction Correct: {result['is_correct']}")
    
    if not result['is_correct']:
        print("\nAnalysis of Incorrect Prediction:")
        print("1. High cholesterol (294 mg/dl) might be influencing the prediction")
        print("2. Low maximum heart rate (120 bpm) for age 61 is concerning")
        print("3. Exercise-induced angina (exang=1) is a strong risk factor")
        print("4. ST depression (oldpeak=1) and downsloping ST segment (slope=2) indicate possible ischemia")
        print("\nRecommendations:")
        print("1. Consider adjusting the model's feature weights")
        print("2. Review the polynomial feature interactions")
        print("3. Recalibrate the model's decision threshold")
        print("4. Add domain-specific feature engineering")

if __name__ == "__main__":
    main() 