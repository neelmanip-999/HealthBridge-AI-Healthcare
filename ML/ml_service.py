"""
Flask service for ML model inference
This service exposes the trained model via HTTP API for the Node.js backend to call
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import ReportPredictor
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize predictor
MODEL_DIR = os.getenv('MODEL_DIR', 'models')
predictor = None

try:
    predictor = ReportPredictor(model_dir=MODEL_DIR)
    print("[OK] ML Service started successfully")
    print(f"[OK] Predictor initialized: {predictor is not None}")
    if predictor.model is not None:
        print("[OK] Model is loaded and ready")
    else:
        print("[WARNING] Model object is None")
except Exception as e:
    print(f"[ERROR] Error initializing ML service: {e}")
    import traceback
    traceback.print_exc()
    print("[WARNING] Service will start but predictions will fail until model is trained")

@app.route('/', methods=['GET'])
def root():
    """Root endpoint - provides service information"""
    return jsonify({
        'service': 'HealthBridge ML Service',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'health': '/health',
            'predict': '/predict (POST)',
            'batch_predict': '/predict/batch (POST)'
        },
        'model_loaded': predictor is not None
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': predictor is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict endpoint for patient report analysis"""
    print(f"[DEBUG] Predict called, predictor is None: {predictor is None}")
    if predictor is None:
        print("[ERROR] Predictor is None - model not loaded")
        return jsonify({
            'status': 'error',
            'message': 'Model not loaded. Please train the model first.'
        }), 500
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        # Make prediction
        result = predictor.predict(data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """Batch prediction endpoint"""
    if predictor is None:
        return jsonify({
            'status': 'error',
            'message': 'Model not loaded. Please train the model first.'
        }), 500
    
    try:
        data = request.get_json()
        
        if not data or 'reports' not in data:
            return jsonify({
                'status': 'error',
                'message': 'No reports array provided'
            }), 400
        
        # Make batch predictions
        results = predictor.predict_batch(data['reports'])
        
        return jsonify({
            'status': 'success',
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('ML_SERVICE_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)


