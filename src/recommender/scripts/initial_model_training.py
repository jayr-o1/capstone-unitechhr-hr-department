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

from utils.model_trainer import initial_model_training, evaluate_model_performance

def print_progress_spinner(duration=0.1):
    """Print a simple progress spinner to indicate ongoing work."""
    chars = ['|', '/', '-', '\\']
    for char in chars:
        sys.stdout.write('\r' + 'Processing ' + char + ' ')
        sys.stdout.flush()
        time.sleep(duration)

def main():
    """Main function to run initial model training."""
    # Set working directory to the recommender root
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    print("=" * 60)
    print("CAREER RECOMMENDER SYSTEM - INITIAL MODEL TRAINING")
    print("=" * 60)
    
    print("\nThis will train a new model using synthetic data.")
    print("Note: This will overwrite any existing model.")
    
    confirm = input("\nDo you want to continue? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Operation cancelled.")
        return 1
    
    print("\nStarting initial model training...")
    
    # Indicate progress while training
    print("\nLoading data and preparing for training...")
    
    # Create a background progress indicator in case training takes long
    progress_thread = None
    try:
        import threading
        
        # Function to show continuous progress indicator
        def show_progress():
            indicators = ['|', '/', '-', '\\']
            i = 0
            while not stop_event.is_set():
                sys.stdout.write(f"\rTraining in progress {indicators[i % len(indicators)]} ")
                sys.stdout.flush()
                i += 1
                time.sleep(0.2)
            sys.stdout.write("\rTraining completed!          \n")
            sys.stdout.flush()
        
        stop_event = threading.Event()
        progress_thread = threading.Thread(target=show_progress)
        progress_thread.daemon = True
        progress_thread.start()
    except ImportError:
        # Simple fallback if threading is not available
        print("Training in progress...")
        progress_thread = None
        stop_event = None
    
    # Start time for tracking duration
    start_time = time.time()
    
    # Run the training
    success = initial_model_training()
    
    # Calculate training duration
    duration = time.time() - start_time
    minutes, seconds = divmod(duration, 60)
    
    # Stop the progress indicator
    if stop_event:
        stop_event.set()
    if progress_thread:
        progress_thread.join(timeout=1.0)
    
    if success:
        print(f"\nModel training completed successfully! (Took {int(minutes)}m {int(seconds)}s)")
        
        # Evaluate the model
        print("\nEvaluating model performance:")
        metrics = evaluate_model_performance()
        
        if metrics:
            print(f"Model accuracy: {metrics.get('accuracy', 0):.4f}")
            print(f"Model trained at: {metrics.get('trained_at', 'Unknown')}")
            
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
        
        print("\nYou can now use the recommender system with the new model.")
        return 0
    else:
        print("\nModel training failed. Check the logs for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 