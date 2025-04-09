#!/usr/bin/env python3
"""
Retraining script for the career recommender system.
This script retrains the model using accumulated feedback data.
"""

import os
import sys
import argparse
import time
from datetime import datetime, timedelta

# Add the parent directory to the path so we can import the utils module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.model_trainer import retrain_model, evaluate_model_performance
from utils.feedback_handler import get_all_feedback

def main():
    """Main function to run model retraining."""
    # Set working directory to the recommender root
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Retrain the career recommendation model')
    parser.add_argument('--force', action='store_true', help='Force retraining regardless of conditions')
    parser.add_argument('--threshold', type=int, default=10, help='Minimum feedback entries for retraining')
    parser.add_argument('--days', type=int, default=7, help='Minimum days between retraining')
    args = parser.parse_args()
    
    print("=" * 60)
    print("CAREER RECOMMENDER SYSTEM - MODEL RETRAINING")
    print("=" * 60)
    
    # Get current feedback count
    feedback_entries = get_all_feedback()
    print(f"Current feedback entries: {len(feedback_entries)}")
    
    # Check current model metrics
    metrics = evaluate_model_performance()
    if metrics:
        print(f"Model last trained on: {metrics.get('trained_at', 'Unknown').split('T')[0]}")
        
        # Calculate days since last training
        try:
            last_trained = datetime.fromisoformat(metrics.get('trained_at'))
            days_since = (datetime.now() - last_trained).days
            print(f"Days since last training: {days_since}")
        except (ValueError, TypeError):
            days_since = float('inf')
            print("Days since last training: Unknown")
        
        print(f"Current model accuracy: {metrics.get('accuracy', 0):.4f}")
    else:
        print("No existing model found or evaluation failed.")
        days_since = float('inf')
    
    # Check if retraining is needed
    if args.force:
        print("\nForcing model retraining...")
        should_retrain = True
    elif len(feedback_entries) < args.threshold:
        print(f"\nNot enough feedback entries for retraining (need {args.threshold}, have {len(feedback_entries)}).")
        should_retrain = False
    elif days_since < args.days:
        print(f"\nModel was trained recently (within {days_since} days, threshold is {args.days} days).")
        should_retrain = False
    else:
        print(f"\nRetraining conditions met: {len(feedback_entries)} feedback entries and {days_since} days since last training.")
        should_retrain = True
    
    # Retrain the model if needed
    if should_retrain:
        # Start time for tracking duration
        start_time = time.time()
        
        # Create progress indicator
        def show_progress():
            indicators = ['|', '/', '-', '\\']
            i = 0
            while True:
                sys.stdout.write(f"\rRetraining in progress {indicators[i % len(indicators)]} ")
                sys.stdout.flush()
                i += 1
                time.sleep(0.2)
        
        # Try to start progress thread
        try:
            import threading
            stop_event = threading.Event()
            progress_thread = threading.Thread(target=show_progress)
            progress_thread.daemon = True
            progress_thread.start()
        except ImportError:
            progress_thread = None
            stop_event = None
        
        # Run retraining
        success = retrain_model(verbose=True)
        
        # Stop progress indicator
        if progress_thread and stop_event:
            stop_event.set()
            progress_thread.join(timeout=1.0)
        
        # Calculate duration
        duration = time.time() - start_time
        minutes, seconds = divmod(duration, 60)
        
        if success:
            print(f"\nModel retraining completed successfully! (Took {int(minutes)}m {int(seconds)}s)")
            
            # Show new model metrics
            new_metrics = evaluate_model_performance()
            if new_metrics:
                print(f"\nNew model accuracy: {new_metrics.get('accuracy', 0):.4f}")
                print(f"Feedback entries used: {new_metrics.get('feedback_entries_used', 0)}")
                
                # Compare with old metrics
                if metrics:
                    old_accuracy = metrics.get('accuracy', 0)
                    accuracy_change = new_metrics.get('accuracy', 0) - old_accuracy
                    print(f"Accuracy change: {accuracy_change:+.4f}")
            
            return 0
        else:
            print("\nModel retraining failed or was skipped.")
            return 1
    else:
        print("\nSkipping model retraining based on conditions.")
        return 0

if __name__ == "__main__":
    sys.exit(main()) 