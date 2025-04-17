#!/usr/bin/env python3
"""
Initialize or reset the recommendation model.
This script performs initial training of the model with synthetic data.
"""

from utils.model_trainer import initial_model_training

if __name__ == "__main__":
    print("Starting initial model training...")
    success = initial_model_training(verbose=True)
    
    if not success:
        print("Model initialization failed. Check logs for errors.")
    else:
        print("Model initialized successfully!") 