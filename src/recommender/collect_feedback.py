#!/usr/bin/env python3
"""
Standalone feedback collector for the career recommender system.
Run this after getting recommendations to provide feedback.
"""

import os
import sys
import json
from datetime import datetime

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from utils.feedback_handler import save_feedback
    from utils.input_validator import get_validated_integer, get_validated_string
except ImportError as e:
    print(f"Error importing required modules: {e}")
    sys.exit(1)

def collect_feedback():
    """Collect feedback from the user about their recommendations."""
    print("\n" + "=" * 60)
    print("CAREER RECOMMENDER FEEDBACK COLLECTOR")
    print("=" * 60)
    
    # Get basic information
    user_id = get_validated_string("\nPlease enter your user ID (optional): ", min_length=0, required=False)
    if not user_id:
        user_id = "anonymous_" + datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Get which specialization they received recommendations for
    specialization = get_validated_string("Which career path did you receive recommendations for? ", required=True)
    
    # Get satisfaction rating
    print("\nHow satisfied are you with the recommendations you received?")
    print("1. Very satisfied")
    print("2. Satisfied")
    print("3. Neutral")
    print("4. Dissatisfied")
    print("5. Very dissatisfied")
    satisfaction = get_validated_integer("Enter your rating (1-5): ", 1, 5)
    
    # Get the match percentage they received (optional)
    match_percentage = get_validated_integer("What match percentage did you receive? (0-100, optional): ", 0, 100, required=False)
    
    # Get feedback comment
    feedback_comment = get_validated_string("Please provide any additional feedback (optional): ", min_length=0, required=False)
    
    # Get improvement suggestions
    improvement = get_validated_string("How could we improve the recommendations? (optional): ", min_length=0, required=False)
    
    # Create feedback data
    feedback_data = {
        "user_id": user_id,
        "timestamp": datetime.now().isoformat(),
        "specialization": specialization,
        "satisfaction_rating": satisfaction,
        "feedback_comment": feedback_comment,
        "improvement_suggestion": improvement,
        "recommendation_version": "enhanced_v1.0"
    }
    
    if match_percentage is not None:
        feedback_data["match_percentage"] = match_percentage
    
    # Save the feedback
    success = save_feedback(feedback_data)
    
    if success:
        print("\nThank you! Your feedback has been saved.")
        print("This will help improve future recommendations.")
    else:
        print("\nThere was an error saving your feedback. Please try again later.")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    collect_feedback() 