#!/usr/bin/env python
"""Test script for ML model predictions"""

from predict import ReportPredictor
import json
import pandas as pd

def test_prediction():
    """Test the ML model with different data"""
    p = ReportPredictor()
    
    # Test data 1: High risk patient
    test_data_1 = {
        'Age': 50,
        'Gender': 'Male',
        'BloodPressure': 140,
        'Cholesterol': 250,
        'Glucose': 120,
        'HeartRate': 85,
        'BMI': 28,
        'Fever': 0,
        'Cough': 0,
        'Fatigue': 0,
        'Headache': 0,
        'Nausea': 0,
        'ShortnessBreath': 0
    }
    
    # Test data 2: Healthy patient
    test_data_2 = {
        'Age': 25,
        'Gender': 'Female',
        'BloodPressure': 110,
        'Cholesterol': 180,
        'Glucose': 90,
        'HeartRate': 70,
        'BMI': 22,
        'Fever': 0,
        'Cough': 0,
        'Fatigue': 0,
        'Headache': 0,
        'Nausea': 0,
        'ShortnessBreath': 0
    }
    
    test_cases = [
        ("High Risk Patient", test_data_1),
        ("Healthy Patient", test_data_2)
    ]
    
    for name, data in test_cases:
        print(f"\n{'='*50}")
        print(f"Testing: {name}")
        print(f"{'='*50}")
        print(f"Input data: {json.dumps(data, indent=2)}")
        
        try:
            # Debug: Show preprocessing
            print("\nPreprocessing...")
            X = p.preprocess_input(data)
            print(f"Preprocessed shape: {X.shape}")
            print(f"Preprocessed data (first 5 features): {X[0][:5]}")
            
            # Make prediction
            result = p.predict(data)
            print(f"\nPrediction Result:")
            print(json.dumps(result, indent=2))
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    test_prediction()
