#!/usr/bin/env python3
"""
Simple script to check model metrics
"""
from utils.model_trainer import evaluate_model_performance

print("Evaluating model performance...")
metrics = evaluate_model_performance(verbose=True)

if metrics:
    print("\nModel Metrics:")
    print(f"Accuracy: {metrics.get('accuracy', 0):.4f}")
    print(f"Trained at: {metrics.get('trained_at', 'Unknown')}")
    print(f"Feedback entries used: {metrics.get('feedback_entries_used', 0)}")
    
    if 'classification_report' in metrics:
        report = metrics["classification_report"]
        print("\nClass-specific metrics:")
        
        # Display weighted average metrics
        if "weighted avg" in report:
            avg = report["weighted avg"]
            print(f"Weighted Average:")
            print(f"  Precision: {avg.get('precision', 0):.4f}")
            print(f"  Recall: {avg.get('recall', 0):.4f}")
            print(f"  F1-score: {avg.get('f1-score', 0):.4f}")
else:
    print("Model evaluation failed or no model found.") 