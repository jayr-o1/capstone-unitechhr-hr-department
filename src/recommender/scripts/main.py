"""
Main entry point for the career recommender system.
This script integrates all components and provides the user interface.
"""

import os
import sys

# Add the parent directory to the path so we can import the recommender module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.feedback import initialize_feedback_db, get_user_feedback
from recommender import recommend_career_from_resume, load_model_and_data

# Try to import model evaluation function
try:
    from utils.model_trainer import evaluate_model_performance
    MODEL_EVALUATION_AVAILABLE = True
except ImportError:
    MODEL_EVALUATION_AVAILABLE = False

def main():
    """
    Main entry point for the career recommender system.
    """
    # Set working directory to the recommender root
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    print("=" * 60)
    print("CAREER RECOMMENDER SYSTEM WITH LEARNING CAPABILITY")
    print("=" * 60)
    
    # Initialize the feedback database
    initialize_feedback_db()
    
    # Load the model and data
    print("\nLoading model and data...")
    if not load_model_and_data():
        print("Failed to load model and data. Exiting.")
        return 1
    
    # Show model information if available
    if MODEL_EVALUATION_AVAILABLE:
        try:
            metrics = evaluate_model_performance()
            if metrics:
                print(f"\nUsing model trained on: {metrics.get('trained_at', 'Unknown')}")
                print(f"Model accuracy: {metrics.get('accuracy', 0):.4f}")
                print(f"Using feedback from {metrics.get('feedback_entries_used', 0)} users")
        except Exception as e:
            print(f"Error evaluating model: {e}")
            print("Continuing with existing model without evaluation metrics.")
    
    # Ask user for their ID or create a new one
    user_id = input("\nEnter your user ID (leave blank for new user): ").strip() or None
    
    # Path to the resume file
    resume_file_path = "data/resume_1.txt"
    print(f"\nAnalyzing resume from: {resume_file_path}")
    
    # Get recommendations
    recommendations, skills, experience = recommend_career_from_resume(resume_file_path, user_id)
    
    # Display recommendations
    print("\n" + "=" * 60)
    print("RECOMMENDATIONS")
    print("=" * 60)
    
    print(f"\nRecommended Field: {recommendations['Recommended Field']} (Confidence: {recommendations['Field Confidence']}%)")
    
    print("\nTop Career Paths:")
    for i, (path, confidence) in enumerate(zip(recommendations["Top 3 Career Paths"], recommendations["Confidence Percentages"]), 1):
        print(f"{i}. {path} (Match: {confidence}%)")
        
        # Show required skills
        required = recommendations["Required Skills"][i-1].split(", ")
        print(f"   Required Skills: {', '.join(required)}")
        
        # Show lacking skills
        lacking = recommendations["Lacking Skills"][i-1]
        if lacking:
            print(f"   Skills to Develop: {', '.join(lacking)}")
        
        # Show training recommendations
        training = recommendations["Training Recommendations"][i-1]
        if training:
            print(f"   Recommended Training: {training[0]}" + (f" + {len(training)-1} more" if len(training) > 1 else ""))
    
    # Gather feedback for learning
    user_id = get_user_feedback(recommendations, user_id, skills, experience)
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 