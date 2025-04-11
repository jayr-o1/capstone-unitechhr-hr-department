#!/usr/bin/env python3

from utils.model_trainer import retrain_model, evaluate_model_performance

print("Starting model retraining...")
success = retrain_model(verbose=True)

if success:
    print("Model retrained successfully!")
    
    # Evaluate model performance
    print("Evaluating model performance...")
    metrics = evaluate_model_performance(verbose=True)
    
    print("\nModel Evaluation:")
    print(f"Accuracy: {metrics.get('accuracy', 'N/A')}")
    print(f"F1 Score: {metrics.get('f1_score', 'N/A')}")
else:
    print("Model retraining failed.") 