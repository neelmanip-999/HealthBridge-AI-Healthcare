"""
Model Evaluation and Visualization Script
Provides comprehensive evaluation metrics and visualizations
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
import argparse
import logging
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
from sklearn.model_selection import train_test_split

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend
    import matplotlib.pyplot as plt
    import seaborn as sns
    HAS_VISUALIZATION = True
    sns.set_style("whitegrid")
except ImportError:
    HAS_VISUALIZATION = False
    logger.warning("Matplotlib/Seaborn not available. Visualizations will be skipped.")


class ModelEvaluator:
    def __init__(self, model_dir='models'):
        self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.label_encoders = None
        self.feature_names = []
        self.load_model()
    
    def load_model(self):
        """Load trained model and preprocessors"""
        model_path = os.path.join(self.model_dir, 'patient_report_model.joblib')
        self.model = joblib.load(model_path)
        
        scaler_path = os.path.join(self.model_dir, 'scaler.joblib')
        self.scaler = joblib.load(scaler_path)
        
        encoders_path = os.path.join(self.model_dir, 'label_encoders.joblib')
        self.label_encoders = joblib.load(encoders_path)
        
        metadata_path = os.path.join(self.model_dir, 'model_metadata.json')
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
                self.feature_names = metadata.get('feature_names', [])
        
        logger.info("Model loaded successfully")
    
    def preprocess_data(self, df, target_column=None):
        """Preprocess data similar to training"""
        from train_model import ImprovedPatientReportAnalyzer
        
        analyzer = ImprovedPatientReportAnalyzer()
        analyzer.scaler = self.scaler
        analyzer.label_encoders = self.label_encoders
        analyzer.feature_names = self.feature_names
        
        X, y = analyzer.preprocess_data(df, target_column=target_column, fit=False)
        return X, y
    
    def evaluate(self, X, y, output_dir='evaluation_results'):
        """Comprehensive model evaluation"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Predictions
        y_pred = self.model.predict(X)
        y_proba = self.model.predict_proba(X)
        
        # Calculate metrics
        metrics = {
            'accuracy': float(accuracy_score(y, y_pred)),
            'precision_weighted': float(precision_score(y, y_pred, average='weighted', zero_division=0)),
            'recall_weighted': float(recall_score(y, y_pred, average='weighted', zero_division=0)),
            'f1_weighted': float(f1_score(y, y_pred, average='weighted', zero_division=0)),
            'precision_macro': float(precision_score(y, y_pred, average='macro', zero_division=0)),
            'recall_macro': float(recall_score(y, y_pred, average='macro', zero_division=0)),
            'f1_macro': float(f1_score(y, y_pred, average='macro', zero_division=0))
        }
        
        # Confusion Matrix
        cm = confusion_matrix(y, y_pred)
        
        # Classification Report
        report = classification_report(y, y_pred, output_dict=True)
        
        # Save metrics
        metrics_path = os.path.join(output_dir, 'metrics.json')
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        # Save classification report
        report_path = os.path.join(output_dir, 'classification_report.json')
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info("\n" + "="*60)
        logger.info("Evaluation Metrics:")
        logger.info(f"  Accuracy: {metrics['accuracy']:.4f}")
        logger.info(f"  Precision (weighted): {metrics['precision_weighted']:.4f}")
        logger.info(f"  Recall (weighted): {metrics['recall_weighted']:.4f}")
        logger.info(f"  F1 Score (weighted): {metrics['f1_weighted']:.4f}")
        logger.info(f"  Precision (macro): {metrics['precision_macro']:.4f}")
        logger.info(f"  Recall (macro): {metrics['recall_macro']:.4f}")
        logger.info(f"  F1 Score (macro): {metrics['f1_macro']:.4f}")
        logger.info("="*60)
        
        # Visualizations
        if HAS_VISUALIZATION:
            self.plot_confusion_matrix(cm, y, output_dir)
            self.plot_feature_importance(output_dir)
        
        return metrics
    
    def plot_confusion_matrix(self, cm, y_true, output_dir):
        """Plot confusion matrix"""
        if not HAS_VISUALIZATION:
            return
        
        # Get class names
        if 'target' in self.label_encoders:
            class_names = self.label_encoders['target'].classes_
        else:
            class_names = [f'Class_{i}' for i in range(len(np.unique(y_true)))]
        
        plt.figure(figsize=(12, 10))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=class_names,
                   yticklabels=class_names)
        plt.title('Confusion Matrix', fontsize=16)
        plt.ylabel('True Label', fontsize=12)
        plt.xlabel('Predicted Label', fontsize=12)
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)
        plt.tight_layout()
        
        save_path = os.path.join(output_dir, 'confusion_matrix.png')
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        logger.info(f"Confusion matrix saved to {save_path}")
    
    def plot_feature_importance(self, output_dir, top_n=15):
        """Plot feature importance"""
        if not HAS_VISUALIZATION or not hasattr(self.model, 'feature_importances_'):
            return
        
        importances = self.model.feature_importances_
        indices = np.argsort(importances)[::-1][:top_n]
        
        plt.figure(figsize=(10, 8))
        plt.title(f'Top {top_n} Feature Importances', fontsize=16)
        plt.barh(range(top_n), importances[indices])
        plt.yticks(range(top_n), [self.feature_names[i] for i in indices])
        plt.xlabel('Importance', fontsize=12)
        plt.gca().invert_yaxis()
        plt.tight_layout()
        
        save_path = os.path.join(output_dir, 'feature_importance.png')
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        logger.info(f"Feature importance plot saved to {save_path}")


def main():
    parser = argparse.ArgumentParser(description='Evaluate Trained Model')
    parser.add_argument('--model-dir', type=str, default='models',
                       help='Directory containing model files')
    parser.add_argument('--test-data', type=str, required=True,
                       help='Path to test dataset CSV')
    parser.add_argument('--target', type=str, default=None,
                       help='Name of target column')
    parser.add_argument('--output', type=str, default='evaluation_results',
                       help='Output directory for evaluation results')
    
    args = parser.parse_args()
    
    # Load evaluator
    evaluator = ModelEvaluator(model_dir=args.model_dir)
    
    # Load test data
    logger.info(f"Loading test data from {args.test_data}...")
    df_test = pd.read_csv(args.test_data)
    
    # Preprocess
    X_test, y_test = evaluator.preprocess_data(df_test, target_column=args.target)
    
    # Evaluate
    metrics = evaluator.evaluate(X_test, y_test, output_dir=args.output)
    
    logger.info("\n[SUCCESS] Evaluation completed!")


if __name__ == '__main__':
    main()

