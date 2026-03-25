# API Examples

## Testing with curl

### 1. Health Check
```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2024-01-15T10:30:00"
}
```

### 2. Low Risk Claim
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "claim_type": "Motor",
    "claim_amount": 25000,
    "prior_claims": 0,
    "third_party": "no",
    "description": "Minor accident, all documents available",
    "policy_age_days": 730,
    "claimant_age": 45,
    "incident_hour": 14,
    "has_witness": "yes"
  }'
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "is_fraud": false,
    "fraud_probability": 0.1234,
    "risk_score": 12,
    "risk_level": "Low",
    "risk_color": "#00d4aa",
    "recommendation": "Approve - Low fraud risk"
  },
  "risk_factors": [],
  "model_info": {
    "model_type": "XGBoost Classifier",
    "version": "1.0",
    "timestamp": "2024-01-15T10:30:00"
  }
}
```

### 3. High Risk Claim
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "claim_type": "Property",
    "claim_amount": 1500000,
    "prior_claims": 3,
    "third_party": "yes",
    "description": "Sudden fire overnight, unknown cause, urgent claim",
    "policy_age_days": 45,
    "claimant_age": 28,
    "incident_hour": 2,
    "has_witness": "no"
  }'
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "is_fraud": true,
    "fraud_probability": 0.8756,
    "risk_score": 88,
    "risk_level": "High",
    "risk_color": "#ff5470",
    "recommendation": "Investigate - High fraud risk"
  },
  "risk_factors": [
    {
      "factor": "High claim amount",
      "severity": "high"
    },
    {
      "factor": "3 prior claims in 12 months",
      "severity": "high"
    },
    {
      "factor": "Third party involved",
      "severity": "medium"
    },
    {
      "factor": "Suspicious keywords detected: sudden, overnight, unknown, urgent",
      "severity": "high"
    },
    {
      "factor": "New policy (less than 90 days)",
      "severity": "medium"
    }
  ],
  "model_info": {
    "model_type": "XGBoost Classifier",
    "version": "1.0",
    "timestamp": "2024-01-15T10:30:00"
  }
}
```

## Testing with Python

### Using requests library

```python
import requests
import json

# API endpoint
url = 'http://localhost:5000/predict'

# Claim data
claim = {
    "claim_type": "Health",
    "claim_amount": 200000,
    "prior_claims": 1,
    "third_party": "no",
    "description": "Hospital treatment for injury",
    "policy_age_days": 365,
    "claimant_age": 35,
    "incident_hour": 10,
    "has_witness": "no"
}

# Make request
response = requests.post(url, json=claim)

# Print results
if response.status_code == 200:
    result = response.json()
    print(f"Risk Score: {result['prediction']['risk_score']}/100")
    print(f"Risk Level: {result['prediction']['risk_level']}")
    print(f"Recommendation: {result['prediction']['recommendation']}")
else:
    print(f"Error: {response.status_code}")
```

## Testing with JavaScript (Frontend)

```javascript
// Claim data
const claimData = {
    claim_type: 'Motor',
    claim_amount: 150000,
    prior_claims: 2,
    third_party: 'yes',
    description: 'Accident on highway',
    policy_age_days: 365,
    claimant_age: 35,
    incident_hour: 12,
    has_witness: 'no'
};

// Make API call
fetch('http://localhost:5000/predict', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(claimData)
})
.then(response => response.json())
.then(data => {
    console.log('Risk Score:', data.prediction.risk_score);
    console.log('Risk Level:', data.prediction.risk_level);
    console.log('Recommendation:', data.prediction.recommendation);
    
    // Display risk factors
    data.risk_factors.forEach(factor => {
        console.log(`[${factor.severity}] ${factor.factor}`);
    });
})
.catch(error => {
    console.error('Error:', error);
});
```

## Testing with Postman

### Setup
1. Open Postman
2. Create new POST request
3. URL: `http://localhost:5000/predict`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):

```json
{
  "claim_type": "Motor",
  "claim_amount": 150000,
  "prior_claims": 2,
  "third_party": "yes",
  "description": "Accident on highway",
  "policy_age_days": 365,
  "claimant_age": 35,
  "incident_hour": 12,
  "has_witness": "no"
}
```

6. Click Send

## Batch Testing

### Test multiple claims at once

```python
import requests
import json

claims = [
    {
        "name": "Low Risk",
        "data": {
            "claim_type": "Motor",
            "claim_amount": 25000,
            "prior_claims": 0,
            "third_party": "no",
            "description": "Minor accident"
        }
    },
    {
        "name": "Medium Risk",
        "data": {
            "claim_type": "Health",
            "claim_amount": 200000,
            "prior_claims": 1,
            "third_party": "no",
            "description": "Hospital treatment"
        }
    },
    {
        "name": "High Risk",
        "data": {
            "claim_type": "Property",
            "claim_amount": 1500000,
            "prior_claims": 3,
            "third_party": "yes",
            "description": "Sudden fire overnight"
        }
    }
]

for claim in claims:
    response = requests.post(
        'http://localhost:5000/predict',
        json=claim['data']
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n{claim['name']}:")
        print(f"  Risk Score: {result['prediction']['risk_score']}/100")
        print(f"  Risk Level: {result['prediction']['risk_level']}")
    else:
        print(f"\n{claim['name']}: Error {response.status_code}")
```

## Error Handling

### Invalid claim type
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "claim_type": "InvalidType",
    "claim_amount": 100000
  }'
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "risk_score": 45,
    "risk_level": "Medium",
    ...
  }
}
```
Note: Invalid types are handled gracefully with default encoding.

### Missing required fields
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "risk_score": 0,
    "risk_level": "Low",
    ...
  }
}
```
Note: Missing fields use default values.

### Server not running
```bash
curl http://localhost:5000/predict
```

**Response:**
```
curl: (7) Failed to connect to localhost port 5000: Connection refused
```

**Solution:** Start the Flask server with `python app.py`

## Performance Testing

### Measure response time

```python
import requests
import time

url = 'http://localhost:5000/predict'
claim = {
    "claim_type": "Motor",
    "claim_amount": 150000,
    "prior_claims": 2,
    "third_party": "yes",
    "description": "Test claim"
}

# Test 100 requests
times = []
for i in range(100):
    start = time.time()
    response = requests.post(url, json=claim)
    end = time.time()
    times.append((end - start) * 1000)  # Convert to ms

print(f"Average response time: {sum(times)/len(times):.2f}ms")
print(f"Min: {min(times):.2f}ms")
print(f"Max: {max(times):.2f}ms")
```

Expected output:
```
Average response time: 150.23ms
Min: 98.45ms
Max: 245.67ms
```

## Integration Examples

### Flask App Integration

```python
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)
ML_API = 'http://localhost:5000/predict'

@app.route('/submit-claim', methods=['POST'])
def submit_claim():
    claim_data = request.json
    
    # Call ML API
    response = requests.post(ML_API, json=claim_data)
    
    if response.status_code == 200:
        result = response.json()
        
        # Store in database
        # send_notification()
        # etc.
        
        return jsonify({
            'status': 'success',
            'risk_score': result['prediction']['risk_score']
        })
    else:
        return jsonify({'status': 'error'}), 500
```

### React Integration

```javascript
import React, { useState } from 'react';

function ClaimForm() {
    const [riskScore, setRiskScore] = useState(null);
    
    const handleSubmit = async (formData) => {
        try {
            const response = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            setRiskScore(data.prediction.risk_score);
        } catch (error) {
            console.error('Error:', error);
        }
    };
    
    return (
        <div>
            {/* Form fields */}
            {riskScore && <div>Risk Score: {riskScore}/100</div>}
        </div>
    );
}
```

## Monitoring

### Log all predictions

```python
import requests
import json
from datetime import datetime

def predict_and_log(claim_data):
    response = requests.post(
        'http://localhost:5000/predict',
        json=claim_data
    )
    
    result = response.json()
    
    # Log to file
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'claim': claim_data,
        'prediction': result['prediction']
    }
    
    with open('predictions.log', 'a') as f:
        f.write(json.dumps(log_entry) + '\n')
    
    return result
```

## Summary

The API is simple to use and integrate:
- ✅ RESTful design
- ✅ JSON request/response
- ✅ Clear error handling
- ✅ Fast response times (<200ms)
- ✅ Easy to test
- ✅ Production-ready
