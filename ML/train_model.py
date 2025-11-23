"""
Patient Report Analysis Model Training Script
This script trains a machine learning model to analyze patient reports.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import os
import json
from datetime import datetime

class PatientReportAnalyzer:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = []
        
    def load_data(self, csv_path):
        """Load dataset from CSV file"""
        print(f"Loading data from {csv_path}...")
        df = pd.read_csv(csv_path)
        print(f"Dataset shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        return df
    
    def preprocess_data(self, df, target_column=None):
        """
        Preprocess the dataset
        Args:
            df: DataFrame with patient report data
            target_column: Name of the target column (e.g., 'diagnosis', 'condition', 'status')
        """
        print("Preprocessing data...")
        
        # Make a copy to avoid modifying original
        data = df.copy()
        
        # Handle missing values
        data = data.fillna(data.median(numeric_only=True))
        data = data.fillna('Unknown')  # For categorical columns
        
        # Separate features and target
        if target_column and target_column in data.columns:
            X = data.drop(columns=[target_column])
            y = data[target_column]
        else:
            # If no target column specified, use the last column
            X = data.iloc[:, :-1]
            y = data.iloc[:, -1]
        
        # Encode categorical variables
        categorical_cols = X.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if col not in self.label_encoders:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                self.label_encoders[col] = le
            else:
                X[col] = self.label_encoders[col].transform(X[col].astype(str))
        
        # Encode target variable
        if y.dtype == 'object':
            if 'target' not in self.label_encoders:
                le = LabelEncoder()
                y = le.fit_transform(y)
                self.label_encoders['target'] = le
            else:
                y = self.label_encoders['target'].transform(y)
        
        # Store feature names
        self.feature_names = X.columns.tolist()
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled, y
    
    def train(self, X, y, test_size=0.2, random_state=42):
        """Train the model"""
        print("Splitting data into train and test sets...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        print("Training Random Forest model...")
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        print("\nEvaluating model...")
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\nModel Accuracy: {accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        return accuracy
    
    def save_model(self, model_dir='models'):
        """Save the trained model and preprocessors"""
        os.makedirs(model_dir, exist_ok=True)
        
        # Save model
        model_path = os.path.join(model_dir, 'patient_report_model.joblib')
        joblib.dump(self.model, model_path)
        print(f"Model saved to {model_path}")
        
        # Save scaler
        scaler_path = os.path.join(model_dir, 'scaler.joblib')
        joblib.dump(self.scaler, scaler_path)
        print(f"Scaler saved to {scaler_path}")
        
        # Save label encoders
        encoders_path = os.path.join(model_dir, 'label_encoders.joblib')
        joblib.dump(self.label_encoders, encoders_path)
        print(f"Label encoders saved to {encoders_path}")
        
        # Save feature names and metadata
        metadata = {
            'feature_names': self.feature_names,
            'model_type': 'RandomForestClassifier',
            'trained_at': datetime.now().isoformat(),
            'n_features': len(self.feature_names)
        }
        
        metadata_path = os.path.join(model_dir, 'model_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"Metadata saved to {metadata_path}")
        
        return model_dir

def main():
    """Main training function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Patient Report Analysis Model')
    parser.add_argument('--dataset', type=str, required=True, help='Path to CSV dataset file')
    parser.add_argument('--target', type=str, default=None, help='Name of target column')
    parser.add_argument('--output', type=str, default='models', help='Output directory for model files')
    
    args = parser.parse_args()
    
    # Initialize analyzer
    analyzer = PatientReportAnalyzer()
    
    # Load data
    df = analyzer.load_data(args.dataset)
    
    # Preprocess
    X, y = analyzer.preprocess_data(df, target_column=args.target)
    
    # Train
    accuracy = analyzer.train(X, y)
    
    # Save model
    analyzer.save_model(model_dir=args.output)
    
    print("\n[SUCCESS] Model training completed successfully!")
    print(f"Model accuracy: {accuracy:.4f}")

if __name__ == '__main__':
    main()

