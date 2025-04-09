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
    
    # Ask user for their ID or create a new one
    user_id = input("\nEnter your user ID (leave blank for new user): ").strip() or None
    
    # Path to the resume file
    resume_file_path = "data/resume_1.txt"
    print(f"\nAnalyzing resume from: {resume_file_path}")
    
    # Get recommendations
    try:
        recommendations, skills, experience = recommend_career_from_resume(resume_file_path, user_id)
        
        # Print the recommendations with confidence percentages, lacking skills, and training recommendations
        print("\nAccording to your profile, you're more suited to be in the field of", recommendations["Recommended Field"])
        print(f"Confidence in Field Recommendation: {recommendations['Field Confidence']}%")
        print("\nHere are the top 3 career paths you can take:")
        
        for i, (career_path, skills, confidence, lacking_skills, training) in enumerate(zip(
            recommendations["Top 3 Career Paths"], 
            recommendations["Required Skills"], 
            recommendations["Confidence Percentages"],
            recommendations["Lacking Skills"],
            recommendations["Training Recommendations"]
        ), 1):
            print(f"\n{i}. {career_path} (Confidence: {confidence}%)")
            print(f"   Required Skills: {skills}")
            print(f"   Lacking Skills: {', '.join(lacking_skills) if lacking_skills else 'None'}")
            print(f"   Training Recommendations: {', '.join(training) if training else 'None'}")
        
        # Get user feedback
        user_id = get_user_feedback(recommendations, user_id, skills, experience)
        print(f"\nThank you for your feedback! Your user ID is: {user_id}")
        
        # For demo purposes, show how recommendations change with feedback
        print("\nLet's see how recommendations change with your feedback:")
        new_recommendations, _, _ = recommend_career_from_resume(resume_file_path, user_id)
        
        print("\nUpdated recommendations based on your feedback:")
        print("Field:", new_recommendations["Recommended Field"])
        for i, path in enumerate(new_recommendations["Top 3 Career Paths"], 1):
            print(f"{i}. {path}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 