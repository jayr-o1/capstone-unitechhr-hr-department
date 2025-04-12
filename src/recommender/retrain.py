#!/usr/bin/env python3
"""
Script to retrain the career recommender model with recent changes.
This script can be run directly or scheduled to run periodically.
"""

import argparse
from utils.model_trainer import retrain_model, train_model_with_recent_changes, evaluate_model_performance, initial_model_training
import os

def main():
    """Main entry point with command-line argument handling."""
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Retrain the career recommender model')
    parser.add_argument('--full', action='store_true', 
                        help='Perform a full retraining rather than just updating with recent changes')
    parser.add_argument('--days', type=int, default=30,
                        help='Only consider data from the last N days (default: 30)')
    parser.add_argument('--min-count', type=int, default=5,
                        help='Minimum number of user data points required (default: 5)')
    parser.add_argument('--prefs-only', action='store_true',
                        help='Only use user preferences for training (ignore feedback)')
    parser.add_argument('--force', action='store_true',
                        help='Force retraining even if thresholds are not met')
    parser.add_argument('--quiet', action='store_true',
                        help='Suppress detailed output')
    
    # Parse arguments
    args = parser.parse_args()
    verbose = not args.quiet
    
    if verbose:
        print("Career Recommender Model Training")
        print("=" * 40)
    
    # Determine which training method to use
    success = False
    
    # Check if model exists
    model_path = os.path.join('models', 'career_path_recommendation_model.pkl')
    model_exists = os.path.exists(model_path)
    
    if not model_exists:
        if verbose:
            print("No existing model found. Performing initial training...")
        success = initial_model_training(verbose=verbose)
    elif args.full:
        if verbose:
            print("Starting full model retraining...")
        success = retrain_model(force=args.force, verbose=verbose)
    else:
        if verbose:
            print("Starting incremental model update with recent changes...")
        # If force is set, bypass the minimum count requirement
        min_count = 1 if args.force else args.min_count
        success = train_model_with_recent_changes(
            user_preferences_only=args.prefs_only,
            days_threshold=args.days,
            min_feedback_count=min_count,
            verbose=verbose
        )
    
    if success:
        if verbose:
            print("\nModel updated successfully!")
        
        # Evaluate model performance
        if verbose:
            print("Evaluating model performance...")
        metrics = evaluate_model_performance(verbose=verbose)
        
        if verbose:
            print("\nModel Evaluation:")
            print(f"Accuracy: {metrics.get('accuracy', 'N/A')}")
            print(f"F1 Score: {metrics.get('f1_score', 'N/A')}")
    else:
        if verbose:
            print("\nModel update failed or skipped due to insufficient data.")
            print("Try using --force to override minimum data requirements.")

if __name__ == "__main__":
    main() 