@echo off
echo ================================================
echo Insurance Fraud Detection System - Setup
echo ================================================
echo.

echo Step 1: Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo Step 2: Training XGBoost model...
python train_model.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to train model
    pause
    exit /b 1
)
echo.

echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo Starting Flask API server...
echo API will be available at: http://localhost:5000
echo.
echo Open index.html in your browser to use the system
echo.
echo Press Ctrl+C to stop the server
echo ================================================
echo.

python app.py
