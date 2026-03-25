# Configuration file for Insurance Fraud Detection System

# Flask Configuration
FLASK_HOST = '0.0.0.0'
FLASK_PORT = 5000
FLASK_DEBUG = True

# Model Configuration
MODEL_PATH = 'fraud_model.pkl'
ENCODER_PATH = 'label_encoder.pkl'

# Training Configuration
TRAINING_SAMPLES = 5000
TEST_SIZE = 0.2
RANDOM_STATE = 42

# XGBoost Hyperparameters
XGBOOST_PARAMS = {
    'n_estimators': 100,
    'max_depth': 6,
    'learning_rate': 0.1,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'random_state': 42,
    'eval_metric': 'logloss'
}

# Risk Thresholds
RISK_THRESHOLDS = {
    'low': 30,      # 0-29: Low risk
    'medium': 60    # 30-59: Medium, 60-100: High
}

# Feature Defaults
DEFAULT_VALUES = {
    'policy_age_days': 365,
    'claimant_age': 35,
    'incident_hour': 12,
    'has_witness': 'no'
}

# Suspicious Keywords
SUSPICIOUS_KEYWORDS = [
    'sudden', 'urgent', 'overnight', 'unknown', 'stranger',
    'emergency', 'immediately', 'lost', 'stolen', 'fire'
]

# Claim Type Averages (in Rupees)
CLAIM_AVERAGES = {
    'Motor': 80000,
    'Health': 150000,
    'Property': 500000,
    'Life': 1000000,
    'Travel': 30000
}

# API Configuration
CORS_ORIGINS = '*'  # Change to specific origins in production
API_VERSION = '1.0'
