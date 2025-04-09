#!/usr/bin/env python3
"""
Self-contained script to run the career recommender system.
This script will install required packages if needed and then run the system.
"""

import os
import sys
import subprocess
import importlib

def check_install_packages():
    """Check if required packages are installed, and install them if not."""
    required_packages = [
        "pandas",
        "numpy",
        "scikit-learn",
        "xgboost",
        "imbalanced-learn",
        "joblib"
    ]
    
    print("\n==== Checking required packages ====")
    packages_to_install = []
    
    for package in required_packages:
        try:
            importlib.import_module(package.replace("-", "_"))
            print(f"✓ {package} is already installed")
        except ImportError:
            print(f"✗ {package} needs to be installed")
            packages_to_install.append(package)
    
    if packages_to_install:
        print("\nInstalling missing packages...")
        for package in packages_to_install:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print("All packages installed successfully!")
    else:
        print("All required packages are already installed.")

def main():
    """Main function to install packages and run the recommender system."""
    print("=" * 60)
    print("CAREER RECOMMENDER SYSTEM WITH LEARNING CAPABILITY")
    print("=" * 60)
    
    # Change to the recommender root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    recommender_dir = os.path.dirname(script_dir)
    os.chdir(recommender_dir)
    
    # Add the recommender directory to the path
    sys.path.append(recommender_dir)
    
    # Check and install required packages
    check_install_packages()
    
    print("\n==== Starting Career Recommender System ====")
    
    # Import and run the main script
    try:
        from scripts.main import main as run_main
        return run_main()
    except Exception as e:
        print(f"Error running recommender system: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main()) 