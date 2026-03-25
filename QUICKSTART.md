# 🚀 Quick Start Guide

## Option 1: Automated Setup (Windows)

Simply double-click `setup_and_run.bat` - it will:
1. Install all dependencies
2. Train the XGBoost model
3. Start the Flask API server

Then open `index.html` in your browser.

---

## Option 2: Manual Setup

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Train the Model
```bash
python train_model.py
```

You should see:
```
Dataset created: 5000 samples
Fraud cases: 1500 (30.00%)
Legitimate cases: 3500 (70.00%)

Training XGBoost model...

Model Performance:
Training Accuracy: ~95%
Testing Accuracy: ~93%

Model saved as 'fraud_model.pkl'
```

### Step 3: Start the API Server
```bash
python app.py
```

You should see:
```
==================================================
Fraud Detection API Server
==================================================

✓ Model loaded successfully

Starting server on http://localhost:5000
==================================================
```

### Step 4: Open the Frontend

Open `index.html` in your browser, or use:
```bash
python -m http.server 8000
```
Then visit: http://localhost:8000

---

## 🧪 Test the API

In a new terminal, run:
```bash
python test_api.py
```

This will test:
- ✅ Health endpoint
- ✅ Low risk claim prediction
- ✅ Medium risk claim prediction
- ✅ High risk claim prediction
- ✅ Suspicious keywords detection

---

## 🎯 Using the System

### Login Credentials

**Admin Account:**
- Email: `admin@company.com`
- Password: `password123`

**User Account (Agent/Investigator):**
- Email: `user@company.com`
- Password: `password123`

### Submit a Test Claim

1. Login as "User" → Select "Insurance Agent"
2. Click "Submit Claim" in sidebar
3. Fill in the form:
   - Policy Number: `POL-12345`
   - Claim Type: `Motor`
   - Claimant Name: `Test User`
   - Incident Date: `01/01/2024`
   - Claim Amount: `150000`
   - Description: `Accident on highway`
4. Watch the risk score update in real-time!
5. Submit the claim

### View Risk Analysis

The system will show:
- **Risk Score** (0-100)
- **Risk Level** (Low/Medium/High)
- **Risk Factors** detected by ML model
- **Recommendation** (Approve/Review/Investigate)

---

## 🔧 Troubleshooting

### "Model not loaded" error
```bash
python train_model.py
```

### "Connection refused" error
Make sure Flask server is running:
```bash
python app.py
```

### CORS errors in browser
- Check that Flask-CORS is installed
- Verify API is on port 5000

### System uses rule-based instead of ML
Check `script.js` line 1:
```javascript
const USE_ML_MODEL = true;  // Should be true
```

---

## 📊 Understanding the Results

### Risk Score Ranges
- **0-29**: 🟢 Low Risk - Likely legitimate
- **30-59**: 🟡 Medium Risk - Needs review
- **60-100**: 🔴 High Risk - Likely fraud

### Model Features
The XGBoost model analyzes:
- Claim type and amount
- Prior claim history
- Third-party involvement
- Policy age
- Claimant demographics
- Incident timing
- Description keywords
- Witness availability

---

## 🎓 For Academic Projects

### What to Demonstrate

1. **ML Integration**: Show how XGBoost model is trained and deployed
2. **API Design**: Explain REST API architecture
3. **Feature Engineering**: Discuss the 10 features used
4. **Model Performance**: Show accuracy metrics (93%+)
5. **Real-time Prediction**: Demonstrate live risk scoring
6. **Fallback System**: Explain graceful degradation

### Key Points to Mention

- Uses **XGBoost** (industry-standard gradient boosting)
- **93% accuracy** on test data
- **Real-time predictions** via REST API
- **10 engineered features** for fraud detection
- **Automatic fallback** to rule-based system
- **Scalable architecture** (Flask + ML model)

---

## 📝 Next Steps

1. ✅ Train model with real historical data
2. ✅ Add more features (location, time patterns, etc.)
3. ✅ Implement model versioning
4. ✅ Add authentication to API
5. ✅ Deploy to cloud (AWS, Azure, GCP)
6. ✅ Add model monitoring and retraining

---

## 🆘 Need Help?

Check the full documentation in `README.md`

Happy fraud detecting! 🕵️‍♂️
