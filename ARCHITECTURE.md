# System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Browser)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │ index.html │  │ styles.css │  │    script.js       │   │
│  │            │  │            │  │  - ML API calls    │   │
│  │  - Login   │  │  - Dark/   │  │  - Risk display    │   │
│  │  - Forms   │  │    Light   │  │  - Fallback logic  │   │
│  │  - Tables  │  │    themes  │  │                    │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP POST /predict
                            │ (JSON payload)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND API (Flask)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                     app.py                            │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Routes:                                        │  │  │
│  │  │  - POST /predict  → Fraud prediction           │  │  │
│  │  │  - GET  /health   → Health check               │  │  │
│  │  │  - GET  /         → API info                   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Feature Extraction:                           │  │  │
│  │  │  - Parse claim data                            │  │  │
│  │  │  - Encode categorical variables                │  │  │
│  │  │  - Count suspicious keywords                   │  │  │
│  │  │  - Create feature vector                       │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Load model
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   ML MODEL (XGBoost)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              fraud_model.pkl                          │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  XGBoost Classifier                            │  │  │
│  │  │  - 100 trees                                   │  │  │
│  │  │  - Max depth: 6                                │  │  │
│  │  │  - Learning rate: 0.1                          │  │  │
│  │  │  - Trained on 5000 samples                     │  │  │
│  │  │  - 93% accuracy                                │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  Input Features (10):                                │  │
│  │  1. claim_type_encoded                               │  │
│  │  2. claim_amount                                     │  │
│  │  3. prior_claims                                     │  │
│  │  4. third_party                                      │  │
│  │  5. policy_age_days                                  │  │
│  │  6. claimant_age                                     │  │
│  │  7. incident_hour                                    │  │
│  │  8. has_witness                                      │  │
│  │  9. description_length                               │  │
│  │  10. suspicious_keywords                             │  │
│  │                                                       │  │
│  │  Output:                                              │  │
│  │  - Fraud probability (0.0 - 1.0)                     │  │
│  │  - Binary prediction (0 or 1)                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Return prediction
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESPONSE (JSON)                           │
│  {                                                           │
│    "success": true,                                          │
│    "prediction": {                                           │
│      "risk_score": 82,                                       │
│      "risk_level": "High",                                   │
│      "fraud_probability": 0.8234,                            │
│      "recommendation": "Investigate"                         │
│    },                                                        │
│    "risk_factors": [...]                                     │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Submits Claim
```
User fills form → JavaScript collects data → Validates input
```

### 2. API Request
```
script.js → fetch(ML_API_URL) → POST /predict
Payload: {
  claim_type, claim_amount, prior_claims,
  third_party, description, ...
}
```

### 3. Backend Processing
```
Flask receives request
  ↓
Extract features from claim data
  ↓
Encode categorical variables (claim_type)
  ↓
Count suspicious keywords in description
  ↓
Create feature vector [10 features]
  ↓
Load XGBoost model
  ↓
model.predict_proba(features)
  ↓
Calculate risk score (0-100)
  ↓
Identify risk factors
  ↓
Generate recommendation
```

### 4. Response Handling
```
Backend returns JSON
  ↓
Frontend receives response
  ↓
Update UI with risk score
  ↓
Display risk factors
  ↓
Show recommendation
```

### 5. Fallback Mechanism
```
If ML API fails:
  ↓
Catch error in JavaScript
  ↓
Fall back to rule-based system
  ↓
Calculate risk using predefined rules
  ↓
Display result with "Rule-Based System" label
```

## Component Responsibilities

### Frontend (script.js)
- ✅ Collect user input
- ✅ Validate form data
- ✅ Make API calls
- ✅ Handle responses
- ✅ Update UI
- ✅ Fallback to rules if API fails

### Backend (app.py)
- ✅ Receive HTTP requests
- ✅ Extract and validate data
- ✅ Feature engineering
- ✅ Load ML model
- ✅ Make predictions
- ✅ Format responses
- ✅ Error handling

### ML Model (fraud_model.pkl)
- ✅ Binary classification (fraud/legitimate)
- ✅ Probability estimation
- ✅ Feature importance
- ✅ Gradient boosting algorithm

### Training (train_model.py)
- ✅ Generate synthetic data
- ✅ Feature engineering
- ✅ Train XGBoost model
- ✅ Evaluate performance
- ✅ Save model artifacts

## Technology Stack

### Frontend
- HTML5
- CSS3 (Custom design system)
- Vanilla JavaScript (ES6+)
- Fetch API for HTTP requests

### Backend
- Python 3.8+
- Flask (Web framework)
- Flask-CORS (Cross-origin support)

### Machine Learning
- XGBoost (Gradient boosting)
- scikit-learn (Preprocessing, evaluation)
- pandas (Data manipulation)
- numpy (Numerical operations)
- joblib (Model serialization)

## Deployment Architecture

```
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │
         │ HTTP
         │
┌────────▼────────┐
│  Static Server  │  (index.html, styles.css, script.js)
│  (Port 8000)    │
└─────────────────┘
         │
         │ API Calls
         │
┌────────▼────────┐
│  Flask Server   │  (app.py)
│  (Port 5000)    │
└────────┬────────┘
         │
         │ Load
         │
┌────────▼────────┐
│   ML Models     │  (fraud_model.pkl, label_encoder.pkl)
│   (Disk)        │
└─────────────────┘
```

## Security Considerations

### Current Implementation (Development)
- ⚠️ CORS: Allow all origins
- ⚠️ No authentication
- ⚠️ No rate limiting
- ⚠️ Debug mode enabled

### Production Recommendations
- ✅ Implement JWT authentication
- ✅ Restrict CORS to specific domains
- ✅ Add rate limiting (Flask-Limiter)
- ✅ Use HTTPS only
- ✅ Input validation and sanitization
- ✅ API key management
- ✅ Logging and monitoring
- ✅ Model versioning

## Scalability

### Current Limitations
- Single Flask process
- In-memory model loading
- No caching
- No load balancing

### Scaling Options
1. **Horizontal Scaling**: Multiple Flask instances + Load balancer
2. **Model Serving**: TensorFlow Serving, TorchServe, or MLflow
3. **Caching**: Redis for frequent predictions
4. **Async Processing**: Celery for batch predictions
5. **Database**: PostgreSQL for claim storage
6. **Cloud Deployment**: AWS, Azure, or GCP

## Performance Metrics

### Model Performance
- Training Accuracy: ~95%
- Testing Accuracy: ~93%
- Inference Time: <50ms per prediction

### API Performance
- Response Time: ~100-200ms
- Throughput: ~50 requests/second (single process)
- Model Load Time: ~1 second on startup

## Future Enhancements

1. **Model Improvements**
   - Add more features (geolocation, time patterns)
   - Ensemble methods (XGBoost + Random Forest)
   - Deep learning models (Neural Networks)
   - Online learning for model updates

2. **Feature Engineering**
   - NLP on claim descriptions
   - Network analysis (fraud rings)
   - Temporal patterns
   - Anomaly detection

3. **System Features**
   - Real-time monitoring dashboard
   - A/B testing framework
   - Model explainability (SHAP values)
   - Automated retraining pipeline
   - Multi-model comparison

4. **Integration**
   - Database integration
   - Document verification API
   - Email notifications
   - Audit logging
   - Reporting system
