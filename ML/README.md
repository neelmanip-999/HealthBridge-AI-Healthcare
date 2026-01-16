# HealthBridge ML Component

## Overview
Machine learning component for patient report analysis and disease prediction.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Train Model

#### Improved Training (Recommended)
```bash
python train_model.py --dataset New_dataset.csv --target Disease --cv --tune
```

Options:
- `--cv`: Enable cross-validation
- `--tune`: Enable hyperparameter tuning
- `--cv-folds N`: Number of CV folds (default: 5)


### 3. Evaluate Model
```bash
python evaluate_model.py --model-dir models --test-data New_dataset.csv --target Disease
```

### 4. Make Predictions
```bash
python predict.py --model-dir models --data '{"Age": 45, "Gender": "Male", ...}'
```

## Model Performance

### Improved Model Results:
- **Accuracy**: 99.98%
- **F1 Score (weighted)**: 99.98%
- **F1 Score (macro)**: 99.78%
- **Cross-Validation F1**: 1.0000 (±0.0001)

### Key Features:
- ✅ Cross-validation for robust evaluation
- ✅ Hyperparameter tuning
- ✅ Class imbalance handling
- ✅ Feature engineering
- ✅ Outlier detection and handling
- ✅ Comprehensive metrics

## Dataset

- **Size**: 30,000 samples
- **Features**: 13 features + target
- **Classes**: 8 disease categories
- **Target Column**: `Disease`

### Class Distribution:
- Cardiovascular Disease: 9,439 (31.5%)
- Multiple Conditions: 6,018 (20.1%)
- Diabetes: 4,595 (15.3%)
- Cardio-Diabetic Condition: 3,934 (13.1%)
- Healthy: 2,570 (8.6%)
- Obesity: 1,954 (6.5%)
- Viral Infection: 1,343 (4.5%)
- Respiratory Disease: 147 (0.5%)

## Files

### Training Scripts:
- `train_model.py` - Training script with CV, hyperparameter tuning, and comprehensive metrics

### Prediction:
- `predict.py` - Prediction script (updated for new features)

### Evaluation:
- `evaluate_model.py` - Comprehensive model evaluation

### API Service:
- `ml_service.py` - Flask API for backend integration

### Documentation:
- `README.md` - This file
- See `PROJECT_IMPROVEMENTS.md` in the root directory for detailed improvement summary

## API Integration

The ML service runs on Flask and can be started with:
```bash
python ml_service.py
```

Default port: 5001

Endpoints:
- `GET /` - Service information
- `GET /health` - Health check
- `POST /predict` - Single prediction
- `POST /predict/batch` - Batch predictions

## Model Files

Trained models are saved in `models/` directory:
- `patient_report_model.joblib` - Trained model
- `scaler.joblib` - Feature scaler
- `label_encoders.joblib` - Label encoders
- `model_metadata.json` - Model metadata

## Feature Engineering

The improved model includes engineered features:
- `Age_BP_Interaction` - Age × BloodPressure
- `BMI_Cholesterol_Interaction` - BMI × Cholesterol
- `Cardiovascular_Risk` - Risk score based on BP, Cholesterol, Glucose thresholds

## Top Important Features

1. Glucose (21.83%)
2. BMI (12.91%)
3. Cholesterol (11.62%)
4. BloodPressure (10.34%)
5. Cough (10.17%)

## Improvements Made

See `PROJECT_IMPROVEMENTS.md` in the root directory for detailed information about:
- Cross-validation implementation
- Hyperparameter tuning
- Class imbalance handling
- Feature engineering
- Comprehensive metrics
- Logging improvements

## Next Steps

1. Monitor model performance in production
2. Implement model versioning
3. Add model interpretability (SHAP values)
4. Create automated retraining pipeline
5. Add data validation

## Requirements

See `requirements.txt` for all dependencies including visualization libraries.

## Notes

- The improved model is backward compatible with existing prediction pipeline
- All engineered features are automatically created during prediction
- Model handles class imbalance effectively
- Comprehensive logging available when training (logs to console and can be redirected to file)

