#!/usr/bin/env python3
"""
Script to initialize the model by running initial training.
This creates a fresh model from scratch using synthetic data.
"""

from utils.model_trainer import initial_model_training

if __name__ == "__main__":
    print("Starting initial model training...")
    success = initial_model_training(verbose=True)
    
    if success:
        print("Model initialization completed successfully!")
    else:
        print("Model initialization failed. Check logs for errors.") 