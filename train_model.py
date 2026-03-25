import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
import joblib

# Generate synthetic training data
np.random.seed(42)
n_samples = 5000

# Create synthetic dataset
data = {
    'claim_type': np.random.choice(['Motor', 'Health', 'Property', 'Life', 'Travel'], n_samples),
    'claim_amount': np.random.uniform(5000, 2000000, n_samples),
    'prior_claims': np.random.choice([0, 1, 2, 3, 4], n_samples, p=[0.4, 0.3, 0.15, 0.1, 0.05]),
    'third_party': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),
    'policy_age_days': np.random.uniform(30, 3650, n_samples),
    'claimant_age': np.random.uniform(18, 80, n_samples),
    'incident_hour': np.random.randint(0, 24, n_samples),
    'has_witness': np.random.choice([0, 1], n_samples, p=[0.4, 0.6]),
    'description_length': np.random.uniform(10, 500, n_samples),
    'suspicious_keywords': np.random.randint(0, 5, n_samples)
}

df = pd.DataFrame(data)

# Create fraud labels based on risk factors
fraud_score = (
    (df['claim_amount'] > 500000).astype(int) * 0.3 +
    (df['prior_claims'] >= 2).astype(int) * 0.25 +
    (df['third_party'] == 1).astype(int) * 0.15 +
    (df['policy_age_days'] < 90).astype(int) * 0.2 +
    (df['suspicious_keywords'] >= 2).astype(int) * 0.2 +
    (df['has_witness'] == 0).astype(int) * 0.1 +
    np.random.uniform(0, 0.3, n_samples)
)

df['is_fraud'] = (fraud_score > 0.6).astype(int)

print(f"Dataset created: {len(df)} samples")
print(f"Fraud cases: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.2f}%)")
print(f"Legitimate cases: {(1-df['is_fraud']).sum()} ({(1-df['is_fraud']).mean()*100:.2f}%)")

# Encode categorical variables
le = LabelEncoder()
df['claim_type_encoded'] = le.fit_transform(df['claim_type'])

# Save label encoder
joblib.dump(le, 'label_encoder.pkl')

# Features for training
feature_cols = ['claim_type_encoded', 'claim_amount', 'prior_claims', 'third_party', 
                'policy_age_days', 'claimant_age', 'incident_hour', 'has_witness',
                'description_length', 'suspicious_keywords']

X = df[feature_cols]
y = df['is_fraud']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Train XGBoost model
print("\nTraining XGBoost model...")
model = XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    eval_metric='logloss'
)

model.fit(X_train, y_train)

# Evaluate
train_score = model.score(X_train, y_train)
test_score = model.score(X_test, y_test)

print(f"\nModel Performance:")
print(f"Training Accuracy: {train_score*100:.2f}%")
print(f"Testing Accuracy: {test_score*100:.2f}%")

# Feature importance
feature_importance = pd.DataFrame({
    'feature': feature_cols,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\nFeature Importance:")
print(feature_importance)

# Save model
joblib.dump(model, 'fraud_model.pkl')
print("\nModel saved as 'fraud_model.pkl'")
print("Label encoder saved as 'label_encoder.pkl'")
