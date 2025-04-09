#!/usr/bin/env python3
"""
Initial model training script for the career recommender system.
This script performs initial training using synthetic data without requiring feedback.
"""

import os
import sys

# Add the parent directory to the path so we can import the recommender module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.model_trainer import initial_model_training, evaluate_model_performance

def main():
    """Run initial model training."""
    # Set working directory to the recommender root
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    print("=" * 60)
    print("CAREER RECOMMENDER SYSTEM - INITIAL MODEL TRAINING")
    print("=" * 60)
    
    print("\nThis will train a new model using synthetic data.")
    print("Note: This will overwrite any existing model.\n")
    
    confirm = input("Do you want to continue? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Operation cancelled.")
        return 1
    
    print("\nStarting initial model training...")
    success = initial_model_training()
    
    if success:
        print("\nModel training completed successfully!")
        
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
        print("\nModel training failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 