# Insurance Fraud Detection System with XGBoost ML Model

A complete insurance fraud detection system with a Python Flask backend using XGBoost machine learning model.

## 🚀 Features

- **XGBoost ML Model** - Advanced fraud detection using gradient boosting
- **Real-time Risk Scoring** - Instant fraud probability calculation
- **REST API** - Flask backend with CORS support
- **Modern UI** - Responsive dashboard with dark/light mode
- **Role-based Access** - Admin, Agent, and Investigator roles
- **Fallback System** - Automatic fallback to rule-based if ML API fails

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser

## 🛠️ Installation & Setup

### Step 1: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 2: Train the XGBoost Model

```bash
python train_model.py
```

This will:
- Generate 5000 synthetic training samples
- Train an XGBoost classifier
- Save the model as `fraud_model.pkl`
- Save the label encoder as `label_encoder.pkl`
- Display model accuracy and feature importance

Expected output:
```
Dataset created: 5000 samples
Fraud cases: ~1500 (30%)
Legitimate cases: ~3500 (70%)

Training XGBoost model...

Model Performance:
Training Accuracy: ~95%
Testing Accuracy: ~93%

Feature Importance:
[Feature importance table]

Model saved as 'fraud_model.pkl'
```

### Step 3: Start the Flask API Server

```bash
python app.py
```

The API will start on `http://localhost:5000`

### Step 4: Open the Frontend

Open `index.html` in your web browser or use a local server:

```bash
# Using Python's built-in server
python -m http.server 8000
```

Then visit `http://localhost:8000`

## 🔧 Configuration

### Enable/Disable ML Model

In `script.js`, line 1:

```javascript
const USE_ML_MODEL = true;  // Set to false for rule-based system
```

### API Endpoint

In `script.js`, line 1:

```javascript
const ML_API_URL = 'http://localhost:5000/predict';
```

## 📡 API Endpoints

### POST /predict
Predict fraud probability for a claim

**Request:**
```json
{
  "claim_type": "Motor",
  "claim_amount": 150000,
  "prior_claims": 2,
  "third_party": "yes",
  "description": "Sudden accident with unknown vehicle",
  "policy_age_days": 365,
  "claimant_age": 35,
  "incident_hour": 12,
  "has_witness": "no"
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "is_fraud": true,
    "fraud_probability": 0.8234,
    "risk_score": 82,
    "risk_level": "High",
    "risk_color": "#ff5470",
    "recommendation": "Investigate - High fraud risk"
  },
  "risk_factors": [
    {
      "factor": "2 prior claims in 12 months",
      "severity": "medium"
    }
  ],
  "model_info": {
    "model_type": "XGBoost Classifier",
    "version": "1.0"
  }
}
```

### GET /health
Check API health status

### GET /
API information

## 🎯 Model Features

The XGBoost model uses 10 features:

1. **claim_type_encoded** - Type of insurance claim
2. **claim_amount** - Claim amount in rupees
3. **prior_claims** - Number of claims in last 12 months
4. **third_party** - Third party involvement (0/1)
5. **policy_age_days** - Age of policy in days
6. **claimant_age** - Age of claimant
7. **incident_hour** - Hour of incident (0-23)
8. **has_witness** - Witness present (0/1)
9. **description_length** - Length of incident description
10. **suspicious_keywords** - Count of suspicious words

## 📊 Risk Scoring

- **0-29**: Low Risk (Green) - Likely approved
- **30-59**: Medium Risk (Amber) - Review recommended
- **60-100**: High Risk (Red) - Investigation required

## 🔐 User Roles

1. **Admin** - Full system access, approve/reject claims
2. **Insurance Agent** - Submit new claims
3. **Fraud Investigator** - Review and flag suspicious claims

## 🐛 Troubleshooting

### Model not loading
```bash
# Retrain the model
python train_model.py
```

### CORS errors
- Ensure Flask-CORS is installed
- Check that API is running on port 5000

### API connection failed
- The system will automatically fall back to rule-based scoring
- Check browser console for error messages

## 📁 Project Structure

```
.
├── index.html              # Main HTML file
├── styles.css              # All CSS styles
├── script.js               # Frontend JavaScript
├── app.py                  # Flask API server
├── train_model.py          # Model training script
├── requirements.txt        # Python dependencies
├── fraud_model.pkl         # Trained XGBoost model (generated)
├── label_encoder.pkl       # Label encoder (generated)
└── README.md              # This file
```

## 🚀 Production Deployment

For production use:

1. Use a production WSGI server (Gunicorn, uWSGI)
2. Set up proper HTTPS
3. Use environment variables for configuration
4. Implement authentication and rate limiting
5. Use a real database for claim storage
6. Train model on real historical data

## 📝 License

This is a demonstration project for educational purposes.

## 👨‍💻 Author

Insurance Fraud Detection System with XGBoost ML Integration
