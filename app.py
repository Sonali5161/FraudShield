from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load model and encoder
MODEL_PATH = 'fraud_model.pkl'
ENCODER_PATH = 'label_encoder.pkl'

model = None
label_encoder = None

def load_model():
    global model, label_encoder
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
        model = joblib.load(MODEL_PATH)
        label_encoder = joblib.load(ENCODER_PATH)
        print("Model and encoder loaded successfully!")
    else:
        print("Model files not found. Please run train_model.py first.")

load_model()

def extract_features(claim_data):
    """Extract features from claim data"""
    
    # Map claim type to encoded value
    claim_type = claim_data.get('claim_type', 'Motor')
    try:
        claim_type_encoded = label_encoder.transform([claim_type])[0]
    except:
        claim_type_encoded = 0
    
    # Extract claim amount
    claim_amount = float(claim_data.get('claim_amount', 0))
    
    # Prior claims
    prior_claims = int(claim_data.get('prior_claims', 0))
    
    # Third party involved
    third_party = 1 if claim_data.get('third_party', 'no') == 'yes' else 0
    
    # Policy age (days) - default to 365 if not provided
    policy_age_days = int(claim_data.get('policy_age_days', 365))
    
    # Claimant age - default to 35 if not provided
    claimant_age = int(claim_data.get('claimant_age', 35))
    
    # Incident hour - extract from time or default to 12
    incident_hour = int(claim_data.get('incident_hour', 12))
    
    # Has witness
    has_witness = 1 if claim_data.get('has_witness', 'no') == 'yes' else 0
    
    # Description length
    description = claim_data.get('description', '')
    description_length = len(description)
    
    # Count suspicious keywords
    suspicious_words = ['sudden', 'urgent', 'overnight', 'unknown', 'stranger', 
                       'emergency', 'immediately', 'lost', 'stolen', 'fire']
    description_lower = description.lower()
    suspicious_keywords = sum(1 for word in suspicious_words if word in description_lower)
    
    # Create feature array
    features = np.array([[
        claim_type_encoded,
        claim_amount,
        prior_claims,
        third_party,
        policy_age_days,
        claimant_age,
        incident_hour,
        has_witness,
        description_length,
        suspicious_keywords
    ]])
    
    return features

@app.route('/')
def home():
    return jsonify({
        'status': 'running',
        'message': 'Fraud Detection API',
        'model_loaded': model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({
            'error': 'Model not loaded. Please run train_model.py first.'
        }), 500
    
    try:
        # Get claim data from request
        claim_data = request.json
        
        # Extract features
        features = extract_features(claim_data)
        
        # Make prediction
        fraud_probability = float(model.predict_proba(features)[0][1])
        is_fraud = int(model.predict(features)[0])
        
        # Calculate risk score (0-100)
        risk_score = int(fraud_probability * 100)
        
        # Determine risk level
        if risk_score < 30:
            risk_level = 'Low'
            risk_color = '#00d4aa'
            recommendation = 'Approve - Low fraud risk'
        elif risk_score < 60:
            risk_level = 'Medium'
            risk_color = '#ffb547'
            recommendation = 'Review - Moderate fraud indicators'
        else:
            risk_level = 'High'
            risk_color = '#ff5470'
            recommendation = 'Investigate - High fraud risk'
        
        # Generate risk factors
        risk_factors = []
        
        if claim_data.get('claim_amount', 0) > 500000:
            risk_factors.append({
                'factor': 'High claim amount',
                'severity': 'high' if claim_data.get('claim_amount', 0) > 1000000 else 'medium'
            })
        
        if claim_data.get('prior_claims', 0) >= 2:
            risk_factors.append({
                'factor': f"{claim_data.get('prior_claims')} prior claims in 12 months",
                'severity': 'high' if claim_data.get('prior_claims', 0) >= 3 else 'medium'
            })
        
        if claim_data.get('third_party') == 'yes':
            risk_factors.append({
                'factor': 'Third party involved',
                'severity': 'medium'
            })
        
        description = claim_data.get('description', '')
        suspicious_words = ['sudden', 'urgent', 'overnight', 'unknown', 'stranger']
        found_words = [w for w in suspicious_words if w in description.lower()]
        if len(found_words) >= 2:
            risk_factors.append({
                'factor': f"Suspicious keywords detected: {', '.join(found_words)}",
                'severity': 'high'
            })
        
        if claim_data.get('policy_age_days', 365) < 90:
            risk_factors.append({
                'factor': 'New policy (less than 90 days)',
                'severity': 'medium'
            })
        
        # Response
        response = {
            'success': True,
            'prediction': {
                'is_fraud': bool(is_fraud),
                'fraud_probability': round(fraud_probability, 4),
                'risk_score': risk_score,
                'risk_level': risk_level,
                'risk_color': risk_color,
                'recommendation': recommendation
            },
            'risk_factors': risk_factors,
            'model_info': {
                'model_type': 'XGBoost Classifier',
                'version': '1.0',
                'timestamp': datetime.now().isoformat()
            }
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("\n" + "="*50)
    print("Fraud Detection API Server")
    print("="*50)
    if model is None:
        print("\n⚠️  WARNING: Model not loaded!")
        print("Please run: python train_model.py")
    else:
        print("\n✓ Model loaded successfully")
    print("\nStarting server on http://localhost:5000")
    print("="*50 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
