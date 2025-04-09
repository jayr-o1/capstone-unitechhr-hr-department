#!/bin/bash

echo "======================================================"
echo "   CAREER RECOMMENDER SYSTEM WITH LEARNING CAPABILITY"
echo "======================================================"
echo
echo "This script will automatically check for and install"
echo "any required Python packages before running the system."
echo
echo "Press Enter to continue..."
read

# Change to the script directory
cd "$(dirname "$0")"

# Make sure the script is executable
chmod +x run_recommender.py

# Run the Python script
python3 run_recommender.py

echo
echo "Press Enter to exit..."
read 