@echo off
echo ======================================================
echo    CAREER RECOMMENDER SYSTEM WITH LEARNING CAPABILITY
echo ======================================================
echo.
echo This script will automatically check for and install
echo any required Python packages before running the system.
echo.
echo Press any key to continue...
pause > nul

:: Change to the script directory
cd %~dp0

:: Run the Python script
python run_recommender.py

echo.
echo Press any key to exit...
pause > nul 