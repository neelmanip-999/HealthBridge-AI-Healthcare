#!/usr/bin/env python
"""Test ML model through backend API"""

import requests
import json

def test_backend_analyze():
    """Test the analyze endpoint through backend"""
    
    # First, register to get a token
    print("Registering user...")
    reg_data = {
        'name': 'Test ML User',
        'email': f'testML{int(json.dumps({}).__len__())}@example.com',
        'password': 'Test@1234',
        'age': 45,
        'gender': 'male'
    }
    
    r = requests.post('http://localhost:5000/api/patient/register', json=reg_data, timeout=5)
    if r.status_code != 200:
        print(f"Registration failed: {r.status_code}")
        print(r.text)
        return
    
    token = r.json().get('token')
    print(f"✓ Token received: {token[:20]}...")
    
    # Test data: High risk patient
    test_cases = [
        {
            "name": "High Risk Cardiovascular",
            "data": {
                'Age': 55,
                'Gender': 'Male',
                'BloodPressure': 150,
                'Cholesterol': 280,
                'Glucose': 130,
                'HeartRate': 90,
                'BMI': 30,
                'Fever': 0,
                'Cough': 0,
                'Fatigue': 1,
                'Headache': 0,
                'Nausea': 0,
                'ShortnessBreath': 1
            }
        },
        {
            "name": "Healthy Patient",
            "data": {
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
        },
        {
            "name": "Diabetic Patient",
            "data": {
                'Age': 60,
                'Gender': 'Male',
                'BloodPressure': 135,
                'Cholesterol': 220,
                'Glucose': 200,
                'HeartRate': 80,
                'BMI': 26,
                'Fever': 0,
                'Cough': 0,
                'Fatigue': 1,
                'Headache': 0,
                'Nausea': 0,
                'ShortnessBreath': 0
            }
        }
    ]
    
    headers = {'auth-token': token, 'Content-Type': 'application/json'}
    
    for test_case in test_cases:
        print(f"\n{'='*60}")
        print(f"Testing: {test_case['name']}")
        print(f"{'='*60}")
        
        r = requests.post(
            'http://localhost:5000/api/reports/analyze',
            json=test_case['data'],
            headers=headers,
            timeout=30
        )
        
        print(f"Status Code: {r.status_code}")
        
        if r.status_code == 200:
            result = r.json()
            analysis = result.get('analysis', {})
            print(f"✓ Prediction: {analysis.get('prediction')}")
            print(f"✓ Confidence: {analysis.get('confidence', 0)*100:.1f}%")
            print(f"✓ Top 3 Probabilities:")
            probs = analysis.get('probabilities', {})
            for i, (condition, prob) in enumerate(sorted(probs.items(), key=lambda x: x[1], reverse=True)[:3]):
                print(f"   {i+1}. {condition}: {prob*100:.1f}%")
        else:
            print(f"✗ Error: {r.status_code}")
            print(f"Response: {r.text}")

if __name__ == '__main__':
    test_backend_analyze()
