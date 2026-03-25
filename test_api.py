import requests
import json

# API endpoint
API_URL = 'http://localhost:5000'

def test_health():
    """Test health endpoint"""
    print("\n" + "="*50)
    print("Testing Health Endpoint")
    print("="*50)
    
    try:
        response = requests.get(f'{API_URL}/health')
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_prediction(test_case):
    """Test prediction endpoint"""
    print("\n" + "="*50)
    print(f"Testing: {test_case['name']}")
    print("="*50)
    
    try:
        response = requests.post(
            f'{API_URL}/predict',
            json=test_case['data'],
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\nPrediction Results:")
            print(f"  Risk Score: {result['prediction']['risk_score']}/100")
            print(f"  Risk Level: {result['prediction']['risk_level']}")
            print(f"  Fraud Probability: {result['prediction']['fraud_probability']:.2%}")
            print(f"  Recommendation: {result['prediction']['recommendation']}")
            
            if result['risk_factors']:
                print(f"\n  Risk Factors:")
                for factor in result['risk_factors']:
                    print(f"    - [{factor['severity'].upper()}] {factor['factor']}")
            
            return True
        else:
            print(f"ERROR: {response.text}")
            return False
            
    except Exception as e:
        print(f"ERROR: {e}")
        return False

# Test cases
test_cases = [
    {
        'name': 'Low Risk Claim',
        'data': {
            'claim_type': 'Motor',
            'claim_amount': 25000,
            'prior_claims': 0,
            'third_party': 'no',
            'description': 'Minor accident, all documents available',
            'policy_age_days': 730,
            'claimant_age': 45,
            'incident_hour': 14,
            'has_witness': 'yes'
        }
    },
    {
        'name': 'Medium Risk Claim',
        'data': {
            'claim_type': 'Health',
            'claim_amount': 200000,
            'prior_claims': 1,
            'third_party': 'no',
            'description': 'Hospital treatment for injury',
            'policy_age_days': 365,
            'claimant_age': 35,
            'incident_hour': 10,
            'has_witness': 'no'
        }
    },
    {
        'name': 'High Risk Claim',
        'data': {
            'claim_type': 'Property',
            'claim_amount': 1500000,
            'prior_claims': 3,
            'third_party': 'yes',
            'description': 'Sudden fire overnight, unknown cause, urgent claim',
            'policy_age_days': 45,
            'claimant_age': 28,
            'incident_hour': 2,
            'has_witness': 'no'
        }
    },
    {
        'name': 'Suspicious Keywords Test',
        'data': {
            'claim_type': 'Motor',
            'claim_amount': 500000,
            'prior_claims': 2,
            'third_party': 'yes',
            'description': 'Sudden accident with stranger, unknown vehicle, emergency situation',
            'policy_age_days': 60,
            'claimant_age': 30,
            'incident_hour': 23,
            'has_witness': 'no'
        }
    }
]

if __name__ == '__main__':
    print("\n" + "="*50)
    print("Insurance Fraud Detection API - Test Suite")
    print("="*50)
    print("\nMake sure the Flask server is running!")
    print("Run: python app.py")
    
    input("\nPress Enter to start tests...")
    
    # Test health endpoint
    health_ok = test_health()
    
    if not health_ok:
        print("\n❌ Health check failed! Make sure the server is running.")
        exit(1)
    
    # Test predictions
    results = []
    for test_case in test_cases:
        result = test_prediction(test_case)
        results.append(result)
    
    # Summary
    print("\n" + "="*50)
    print("Test Summary")
    print("="*50)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("\n✅ All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    
    print("\n" + "="*50)
