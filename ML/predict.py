"""
Patient Report Analysis Model Inference Script
This script loads a trained model and makes predictions on new patient reports.
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
import sys

class ReportPredictor:
    def __init__(self, model_dir='models'):
        """Initialize the predictor with trained model"""
        self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.label_encoders = None
        self.feature_names = []
        self.load_model()
    
    def load_model(self):
        """Load the trained model and preprocessors"""
        try:
            # Load model
            model_path = os.path.join(self.model_dir, 'patient_report_model.joblib')
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found: {model_path}")
            
            self.model = joblib.load(model_path)
            print(f"[OK] Model loaded from {model_path}")
            
            # Load scaler
            scaler_path = os.path.join(self.model_dir, 'scaler.joblib')
            self.scaler = joblib.load(scaler_path)
            print(f"[OK] Scaler loaded from {scaler_path}")
            
            # Load label encoders
            encoders_path = os.path.join(self.model_dir, 'label_encoders.joblib')
            self.label_encoders = joblib.load(encoders_path)
            print(f"[OK] Label encoders loaded from {encoders_path}")
            
            # Load metadata
            metadata_path = os.path.join(self.model_dir, 'model_metadata.json')
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                    self.feature_names = metadata.get('feature_names', [])
                    print(f"[OK] Metadata loaded: {len(self.feature_names)} features")
            
        except Exception as e:
            print(f"[ERROR] Error loading model: {str(e)}")
            raise
    
    def preprocess_input(self, data):
        """
        Preprocess input data for prediction
        Args:
            data: dict or DataFrame with patient report data
        Returns:
            Preprocessed numpy array ready for prediction
        """
        # Convert dict to DataFrame if needed
        if isinstance(data, dict):
            df = pd.DataFrame([data])
        else:
            df = data.copy()
        
        # Ensure all required features are present
        missing_features = set(self.feature_names) - set(df.columns)
        if missing_features:
            # Add missing features with default values
            for feature in missing_features:
                df[feature] = 0
        
        # Reorder columns to match training order
        df = df[self.feature_names]
        
        # Handle missing values
        df = df.fillna(df.median(numeric_only=True))
        df = df.fillna('Unknown')
        
        # Encode categorical variables
        for col in df.columns:
            if col in self.label_encoders and df[col].dtype == 'object':
                try:
                    # Transform known values
                    df[col] = df[col].astype(str)
                    known_values = set(self.label_encoders[col].classes_)
                    df[col] = df[col].apply(
                        lambda x: x if x in known_values else 'Unknown'
                    )
                    df[col] = self.label_encoders[col].transform(df[col])
                except Exception as e:
                    print(f"Warning: Error encoding {col}: {e}")
                    df[col] = 0
        
        # Scale features
        X_scaled = self.scaler.transform(df)
        
        return X_scaled
    
    def predict(self, data):
        """
        Make prediction on patient report data
        Args:
            data: dict or DataFrame with patient report data
        Returns:
            dict with prediction results
        """
        try:
            # Preprocess
            X = self.preprocess_input(data)
            
            # Make prediction
            prediction = self.model.predict(X)[0]
            probabilities = self.model.predict_proba(X)[0]
            
            # Decode prediction if target was encoded
            if 'target' in self.label_encoders:
                prediction_label = self.label_encoders['target'].inverse_transform([prediction])[0]
            else:
                prediction_label = str(prediction)
            
            # Get class probabilities
            if 'target' in self.label_encoders:
                classes = self.label_encoders['target'].classes_
                prob_dict = {str(cls): float(prob) for cls, prob in zip(classes, probabilities)}
            else:
                prob_dict = {f"Class_{i}": float(prob) for i, prob in enumerate(probabilities)}
            
            result = {
                'prediction': prediction_label,
                'confidence': float(max(probabilities)),
                'probabilities': prob_dict,
                'status': 'success'
            }
            
            return result
            
        except Exception as e:
            return {
                'prediction': None,
                'error': str(e),
                'status': 'error'
            }
    
    def predict_batch(self, data_list):
        """Make predictions on multiple patient reports"""
        results = []
        for data in data_list:
            results.append(self.predict(data))
        return results

def main():
    """CLI interface for predictions"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Predict Patient Report Analysis')
    parser.add_argument('--model-dir', type=str, default='models', help='Directory containing model files')
    parser.add_argument('--input', type=str, help='Path to JSON file with patient data')
    parser.add_argument('--data', type=str, help='JSON string with patient data')
    
    args = parser.parse_args()
    
    # Initialize predictor
    predictor = ReportPredictor(model_dir=args.model_dir)
    
    # Load input data
    if args.input:
        with open(args.input, 'r') as f:
            data = json.load(f)
    elif args.data:
        data = json.loads(args.data)
    else:
        print("Error: Provide either --input or --data")
        sys.exit(1)
    
    # Make prediction
    result = predictor.predict(data)
    
    # Print result
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()


