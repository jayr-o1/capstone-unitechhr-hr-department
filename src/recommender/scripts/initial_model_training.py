#!/usr/bin/env python3
"""
Initial model training script for the career recommender system.
This script performs initial model training using synthetic data.
"""

import os
import sys
import time
from datetime import datetime

# Add the parent directory to the path so we can import the utils module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.model_trainer import initial_model_training, evaluate_model

def print_progress_spinner(duration=0.1, running=None):
    """
    Print a simple progress spinner to indicate ongoing work.
    
    Args:
        duration (float): Time between spinner frames
        running (list): A single-element list with a boolean to control the spinner,
                       where [True] means continue spinning and [False] means stop
    """
    chars = ['|', '/', '-', '\\']
    i = 0
    # If running is not provided, spin only once
    if running is None:
        for char in chars:
            sys.stdout.write('\r' + 'Processing ' + char + ' ')
            sys.stdout.flush()
            time.sleep(duration)
    else:
        # Continue spinning while running[0] is True
        while running[0]:
            char = chars[i % len(chars)]
            sys.stdout.write('\r' + 'Processing ' + char + ' ')
            sys.stdout.flush()
            time.sleep(duration)
            i += 1
        # Clear the spinner line when done
        sys.stdout.write('\r' + ' ' * 20 + '\r')
        sys.stdout.flush()

def main():
    """
    Main function to perform initial model training using synthetic data.
    
    This script should be run only once to create the initial model.
    For model updates, use the retrain_with_feedback script.
    
    Returns:
        int: 0 for success, 1 for failure
    """
    # Get the current date and time for training timestamp
    training_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    print("===== Career Recommender System - Initial Model Training =====")
    print(f"Training started at: {training_date}")
    print("\nWARNING: This will create or overwrite any existing model.")
    print("It should only be run once to initialize the system.")
    print("For model updates, use the retrain_with_feedback script instead.")
    
    # Confirm with the user before proceeding
    confirm = input("\nDo you want to proceed with the initial model training? (y/n): ")
    if confirm.lower() != 'y':
        print("Training aborted.")
        return 1
    
    # Start the timer to measure training duration
    start_time = time.time()
    
    print("\nStarting initial model training with synthetic data...")
    
    # Start a thread to display a progress spinner
    import threading
    spinner_running = [True]  # Use a list for a mutable object that can be modified from other scopes
    spinner_thread = threading.Thread(target=print_progress_spinner, args=(0.1, spinner_running))
    spinner_thread.daemon = True
    spinner_thread.start()
    
    try:
        # Perform the initial model training
        success = initial_model_training(verbose=True)
        
        # Stop the spinner
        spinner_running[0] = False
        spinner_thread.join(timeout=1.0)
    except Exception as e:
        # Stop the spinner in case of exception
        spinner_running[0] = False
        try:
            spinner_thread.join(timeout=1.0)
        except:
            pass
        print(f"\nError occurred during model training: {str(e)}")
        return 1
        
    # Calculate the training duration
    end_time = time.time()
    duration = end_time - start_time
    minutes = duration / 60
    seconds = duration % 60
    
    if success:
        print(f"\nModel training completed successfully! (Took {int(minutes)}m {int(seconds)}s)")
        
        # Evaluate the model
        print("\nEvaluating model performance:")
        # Use the evaluate_model function with verbose=True to show detailed progress
        metrics = evaluate_model(verbose=True)
        
        if metrics:
            # Progress visualization will be handled by the evaluate_model function
            
            # If we have class-specific metrics, display them
            if "classification_report" in metrics:
                print("\nClass-specific metrics:")
                report = metrics["classification_report"]
                
                # Display average metrics
                if "weighted avg" in report:
                    avg = report["weighted avg"]
                    print(f"Weighted Average:")
                    print(f"  Precision: {avg.get('precision', 0):.4f}")
                    print(f"  Recall: {avg.get('recall', 0):.4f}")
                    print(f"  F1-score: {avg.get('f1-score', 0):.4f}")
                    
                # Display confusion matrix if available
                if "confusion_matrix" in metrics:
                    print("\nConfusion Matrix available in the returned metrics")
        
        print("\nYou can now use the recommender system with the new model.")
        return 0
    else:
        print("\nModel training failed. Check the logs for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 