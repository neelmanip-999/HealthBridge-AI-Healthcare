"""
Improved Patient Report Analysis Model Training Script
Includes cross-validation, hyperparameter tuning, and comprehensive evaluation
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, RobustScaler
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    precision_score, recall_score, f1_score, roc_auc_score
)
from sklearn.impute import SimpleImputer
import joblib
import os
import json
import logging
from datetime import datetime
from typing import Tuple, Dict, Any
import warnings
warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class ImprovedPatientReportAnalyzer:
    def __init__(self):
        self.model = None
        self.scaler = RobustScaler()  # More robust to outliers than StandardScaler
        self.label_encoders = {}
        self.feature_names = []
        self.best_params = {}
        self.cv_scores = {}
        
    def load_data(self, csv_path: str) -> pd.DataFrame:
        """Load dataset from CSV file with validation"""
        logger.info(f"Loading data from {csv_path}...")
        
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Dataset file not found: {csv_path}")
        
        df = pd.read_csv(csv_path)
        logger.info(f"Dataset shape: {df.shape}")
        logger.info(f"Columns: {df.columns.tolist()}")
        
        if df.empty:
            raise ValueError("Dataset is empty")
        
        return df
    
    def detect_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect and cap outliers using IQR method"""
        logger.info("Detecting and handling outliers...")
        df_clean = df.copy()
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            # Cap outliers instead of removing (preserve data)
            df_clean[col] = df_clean[col].clip(lower=lower_bound, upper=upper_bound)
        
        return df_clean
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create additional features"""
        logger.info("Engineering features...")
        df_fe = df.copy()
        
        # Create interaction features
        if 'Age' in df_fe.columns and 'BloodPressure' in df_fe.columns:
            df_fe['Age_BP_Interaction'] = df_fe['Age'] * df_fe['BloodPressure']
        
        if 'BMI' in df_fe.columns and 'Cholesterol' in df_fe.columns:
            df_fe['BMI_Cholesterol_Interaction'] = df_fe['BMI'] * df_fe['Cholesterol']
        
        # Create risk score features
        if all(col in df_fe.columns for col in ['BloodPressure', 'Cholesterol', 'Glucose']):
            df_fe['Cardiovascular_Risk'] = (
                (df_fe['BloodPressure'] > 140).astype(int) +
                (df_fe['Cholesterol'] > 200).astype(int) +
                (df_fe['Glucose'] > 100).astype(int)
            )
        
        return df_fe
    
    def preprocess_data(self, df: pd.DataFrame, target_column: str = None, 
                       fit: bool = True) -> Tuple[np.ndarray, np.ndarray]:
        """
        Improved preprocessing with outlier handling and feature engineering
        """
        logger.info("Preprocessing data...")
        
        # Make a copy
        data = df.copy()
        
        # Detect and handle outliers
        data = self.detect_outliers(data)
        
        # Feature engineering
        data = self.engineer_features(data)
        
        # Separate features and target
        if target_column and target_column in data.columns:
            X = data.drop(columns=[target_column])
            y = data[target_column]
        else:
            X = data.iloc[:, :-1]
            y = data.iloc[:, -1]
        
        # Handle missing values
        numeric_cols = X.select_dtypes(include=[np.number]).columns
        categorical_cols = X.select_dtypes(include=['object']).columns
        
        if len(numeric_cols) > 0:
            imputer = SimpleImputer(strategy='median')
            X[numeric_cols] = imputer.fit_transform(X[numeric_cols])
        
        # Fill categorical missing values
        for col in categorical_cols:
            X[col] = X[col].fillna('Unknown')
        
        # Encode categorical variables
        for col in categorical_cols:
            if fit:
                if col not in self.label_encoders:
                    le = LabelEncoder()
                    X[col] = le.fit_transform(X[col].astype(str))
                    self.label_encoders[col] = le
                else:
                    X[col] = self.label_encoders[col].transform(X[col].astype(str))
            else:
                # Transform with existing encoder
                X[col] = X[col].astype(str)
                known_values = set(self.label_encoders[col].classes_)
                X[col] = X[col].apply(
                    lambda x: x if x in known_values else 'Unknown'
                )
                # Handle unknown values
                if 'Unknown' not in self.label_encoders[col].classes_:
                    le = LabelEncoder()
                    classes = list(self.label_encoders[col].classes_) + ['Unknown']
                    le.fit(classes)
                    self.label_encoders[col] = le
                X[col] = self.label_encoders[col].transform(X[col])
        
        # Encode target variable
        if y.dtype == 'object':
            if fit:
                if 'target' not in self.label_encoders:
                    le = LabelEncoder()
                    y = le.fit_transform(y)
                    self.label_encoders['target'] = le
                else:
                    y = self.label_encoders['target'].transform(y)
            else:
                y = self.label_encoders['target'].transform(y)
        
        # Store feature names
        if fit:
            self.feature_names = X.columns.tolist()
        
        # Scale features
        if fit:
            X_scaled = self.scaler.fit_transform(X)
        else:
            X_scaled = self.scaler.transform(X)
        
        return X_scaled, y
    
    def evaluate_model(self, y_true: np.ndarray, y_pred: np.ndarray, 
                      y_proba: np.ndarray = None) -> Dict[str, float]:
        """Comprehensive model evaluation"""
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_true, y_pred, average='weighted', zero_division=0),
            'f1_score': f1_score(y_true, y_pred, average='weighted', zero_division=0)
        }
        
        # Per-class metrics
        unique_classes = np.unique(y_true)
        if len(unique_classes) <= 10:
            metrics['precision_macro'] = precision_score(y_true, y_pred, average='macro', zero_division=0)
            metrics['recall_macro'] = recall_score(y_true, y_pred, average='macro', zero_division=0)
            metrics['f1_macro'] = f1_score(y_true, y_pred, average='macro', zero_division=0)
        
        return metrics
    
    def train_with_cv(self, X: np.ndarray, y: np.ndarray, 
                      cv_folds: int = 5) -> Dict[str, Any]:
        """Train model with cross-validation"""
        logger.info(f"Training with {cv_folds}-fold cross-validation...")
        
        # Use stratified k-fold for imbalanced data
        cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
        
        # Base model with class_weight='balanced' to handle imbalance
        base_model = RandomForestClassifier(
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'
        )
        
        # Cross-validation scores
        cv_scores = cross_val_score(
            base_model, X, y, 
            cv=cv, 
            scoring='f1_weighted',
            n_jobs=-1
        )
        
        self.cv_scores = {
            'mean': float(cv_scores.mean()),
            'std': float(cv_scores.std()),
            'scores': cv_scores.tolist()
        }
        
        logger.info(f"CV F1 Score: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        
        return self.cv_scores
    
    def tune_hyperparameters(self, X: np.ndarray, y: np.ndarray, 
                            cv_folds: int = 5) -> Dict[str, Any]:
        """Hyperparameter tuning using GridSearchCV"""
        logger.info("Tuning hyperparameters...")
        
        # Define parameter grid (reduced for faster training)
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [15, 20, 25, None],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2],
            'max_features': ['sqrt', 'log2']
        }
        
        # Base model
        base_model = RandomForestClassifier(
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'
        )
        
        # Grid search
        cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
        grid_search = GridSearchCV(
            base_model,
            param_grid,
            cv=cv,
            scoring='f1_weighted',
            n_jobs=-1,
            verbose=1
        )
        
        grid_search.fit(X, y)
        
        self.best_params = grid_search.best_params_
        logger.info(f"Best parameters: {self.best_params}")
        logger.info(f"Best CV score: {grid_search.best_score_:.4f}")
        
        return grid_search.best_params_
    
    def train(self, X: np.ndarray, y: np.ndarray, 
             use_cv: bool = True, tune_hyperparams: bool = True,
             test_size: float = 0.2, random_state: int = 42) -> Dict[str, Any]:
        """Train the model with improved methodology"""
        logger.info("Starting model training...")
        
        # Cross-validation
        if use_cv:
            self.train_with_cv(X, y)
        
        # Hyperparameter tuning
        if tune_hyperparams:
            self.tune_hyperparameters(X, y)
            # Use best parameters
            self.model = RandomForestClassifier(
                **self.best_params,
                random_state=random_state,
                n_jobs=-1,
                class_weight='balanced'
            )
        else:
            self.model = RandomForestClassifier(
                n_estimators=200,
                max_depth=20,
                random_state=random_state,
                n_jobs=-1,
                class_weight='balanced'
            )
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        logger.info("Training final model...")
        self.model.fit(X_train, y_train)
        
        # Evaluate on test set
        logger.info("Evaluating model...")
        y_pred = self.model.predict(X_test)
        y_proba = self.model.predict_proba(X_test)
        
        # Comprehensive metrics
        test_metrics = self.evaluate_model(y_test, y_pred, y_proba)
        
        logger.info("\n" + "="*60)
        logger.info("Test Set Metrics:")
        for metric, value in test_metrics.items():
            logger.info(f"  {metric}: {value:.4f}")
        logger.info("="*60)
        
        logger.info("\nClassification Report:")
        logger.info("\n" + classification_report(y_test, y_pred))
        
        # Feature importance
        feature_importance = dict(zip(
            self.feature_names,
            self.model.feature_importances_
        ))
        feature_importance = dict(sorted(
            feature_importance.items(), 
            key=lambda x: x[1], 
            reverse=True
        ))
        
        logger.info("\nTop 10 Most Important Features:")
        for i, (feature, importance) in enumerate(list(feature_importance.items())[:10]):
            logger.info(f"  {i+1}. {feature}: {importance:.4f}")
        
        return {
            'test_metrics': test_metrics,
            'cv_scores': self.cv_scores,
            'best_params': self.best_params,
            'feature_importance': feature_importance
        }
    
    def save_model(self, model_dir: str = 'models') -> str:
        """Save the trained model and preprocessors"""
        os.makedirs(model_dir, exist_ok=True)
        
        # Save model
        model_path = os.path.join(model_dir, 'patient_report_model.joblib')
        joblib.dump(self.model, model_path)
        logger.info(f"Model saved to {model_path}")
        
        # Save scaler
        scaler_path = os.path.join(model_dir, 'scaler.joblib')
        joblib.dump(self.scaler, scaler_path)
        logger.info(f"Scaler saved to {scaler_path}")
        
        # Save label encoders
        encoders_path = os.path.join(model_dir, 'label_encoders.joblib')
        joblib.dump(self.label_encoders, encoders_path)
        logger.info(f"Label encoders saved to {encoders_path}")
        
        # Save comprehensive metadata
        metadata = {
            'feature_names': self.feature_names,
            'model_type': 'RandomForestClassifier',
            'trained_at': datetime.now().isoformat(),
            'n_features': len(self.feature_names),
            'best_params': self.best_params,
            'cv_scores': self.cv_scores,
            'feature_importance': {k: float(v) for k, v in dict(list(
                zip(self.feature_names, self.model.feature_importances_)
            )).items()}
        }
        
        metadata_path = os.path.join(model_dir, 'model_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        logger.info(f"Metadata saved to {metadata_path}")
        
        return model_dir


def main():
    """Main training function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Improved Patient Report Analysis Model')
    parser.add_argument('--dataset', type=str, required=True, help='Path to CSV dataset file')
    parser.add_argument('--target', type=str, default=None, help='Name of target column')
    parser.add_argument('--output', type=str, default='models', help='Output directory for model files')
    parser.add_argument('--cv', action='store_true', help='Use cross-validation')
    parser.add_argument('--tune', action='store_true', help='Tune hyperparameters')
    parser.add_argument('--cv-folds', type=int, default=5, help='Number of CV folds')
    
    args = parser.parse_args()
    
    # Initialize analyzer
    analyzer = ImprovedPatientReportAnalyzer()
    
    try:
        # Load data
        df = analyzer.load_data(args.dataset)
        
        # Preprocess
        X, y = analyzer.preprocess_data(df, target_column=args.target, fit=True)
        
        # Train
        results = analyzer.train(
            X, y,
            use_cv=args.cv,
            tune_hyperparams=args.tune
        )
        
        # Save model
        analyzer.save_model(model_dir=args.output)
        
        logger.info("\n" + "="*60)
        logger.info("[SUCCESS] Model training completed successfully!")
        logger.info(f"Test Accuracy: {results['test_metrics']['accuracy']:.4f}")
        logger.info(f"Test F1 Score: {results['test_metrics']['f1_score']:.4f}")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"Error during training: {str(e)}", exc_info=True)
        raise


if __name__ == '__main__':
    main()

