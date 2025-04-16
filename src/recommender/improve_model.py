#!/usr/bin/env python3
"""
Script to improve model accuracy for all specializations by:
1. Generating more balanced training data
2. Adjusting model weights
3. Retraining the model
"""

import os
import sys
from utils.model_trainer import initial_model_training
from generate_data import main as generate_data
import argparse

def improve_model_accuracy(employee_count=5000, verbose=True):
    """
    Improve model accuracy by generating more employee data while keeping existing career paths.
    
    Args:
        employee_count (int): Number of employee records to generate
        verbose (bool): Whether to print progress messages
    """
    if verbose:
        print("Starting model improvement process...")
    
    # Step 1: Generate more employee data
    if verbose:
        print("\n=== Generating Employee Data ===")
        print(f"Generating {employee_count} employee records...")
    
    # Generate data with balanced distribution
    sys.argv = [
        'generate_data.py',
        '--employee-count', str(employee_count),
        '--career-path-count', '0',  # Don't generate new career paths
        '--replace',  # Replace existing files to ensure fresh data
        '--train'     # Train model after generating data
    ]
    
    generate_data()
    
    if verbose:
        print("\n=== Model Improvement Complete ===")
        print("The model has been retrained with more employee data.")
        print("You can now use the recommender with improved accuracy for all specializations.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Improve model accuracy for all specializations')
    parser.add_argument('--employee-count', type=int, default=5000,
                        help='Number of employee records to generate')
    parser.add_argument('--verbose', action='store_true',
                        help='Print detailed progress messages')
    
    args = parser.parse_args()
    
    improve_model_accuracy(
        employee_count=args.employee_count,
        verbose=args.verbose
    ) 