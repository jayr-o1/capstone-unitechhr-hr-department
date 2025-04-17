#!/usr/bin/env python3
"""
Script to collect user feedback for the career recommender system.
This feedback is used to improve future recommendations through model retraining.
"""

import os
import json
import sys
from datetime import datetime

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.input_validator import (
    get_validated_integer,
    get_validated_string,
    get_validated_list,
    get_validated_yes_no
)
from utils.feedback_handler import save_feedback
from utils.data_loader import load_user_preferences

def collect_and_save_feedback():
    """Collect feedback from user and save it for model improvement."""
    print("\n" + "=" * 60)
    print("CAREER RECOMMENDER FEEDBACK COLLECTION")
    print("=" * 60)
    print("Your feedback helps us improve our recommendations for you and other users.")
    print("Please answer a few quick questions about your experience.")
    
    # Get user ID
    user_id = get_validated_string("\nEnter your user ID: ", min_length=1, required=True)
    
    # Check if we have data for this user
    user_data = load_user_preferences(user_id)
    
    if not user_data:
        print("\nNo recommendation data found for this user ID.")
        print("Please make sure you've received recommendations first.")
        return
    
    print(f"\nWelcome back, {user_data.get('user_name', 'User')}!")
    
    if 'preferred_specialization' in user_data:
        print(f"You previously selected: {user_data['preferred_specialization']}")
        
        if 'current_skills' in user_data:
            print("\nYour skills:")
            for skill in user_data['current_skills']:
                print(f"- {skill}")
        
        if 'lacking_skills' in user_data:
            print("\nRecommended skills to develop:")
            for skill in user_data['lacking_skills']:
                print(f"- {skill}")
    
    # Collect feedback
    print("\n" + "-" * 60)
    print("Please rate the following aspects of your recommendations:")
    
    # Rating on a scale of 1-5
    accuracy_rating = get_validated_integer("How accurate were the recommendations (1-5, where 5 is very accurate): ", 1, 5)
    relevance_rating = get_validated_integer("How relevant were the recommended skills to your career goals (1-5): ", 1, 5)
    overall_rating = get_validated_integer("Overall satisfaction with the recommendations (1-5): ", 1, 5)
    
    # Additional comments
    helpful_aspect = get_validated_string("What was the most helpful aspect of the recommendations? ", required=False)
    improvement_suggestion = get_validated_string("How could the recommendations be improved? ", required=False)
    
    # Did the user apply any recommendations?
    applied_recommendations = get_validated_yes_no("Have you applied any of the recommendations in your career (y/n)? ")
    
    # If specialization was shown, ask if it was helpful
    specialization_helpful = None
    if 'preferred_specialization' in user_data:
        specialization_helpful = get_validated_yes_no(f"Was the recommended specialization ({user_data['preferred_specialization']}) helpful (y/n)? ")
    
    # Create feedback object
    feedback = {
        "user_id": user_id,
        "timestamp": datetime.now().isoformat(),
        "accuracy_rating": accuracy_rating,
        "relevance_rating": relevance_rating,
        "overall_rating": overall_rating,
        "helpful_aspect": helpful_aspect,
        "improvement_suggestion": improvement_suggestion,
        "applied_recommendations": applied_recommendations,
        "specialization_helpful": specialization_helpful,
        "user_skills": user_data.get('current_skills', []),
        "lacking_skills": user_data.get('lacking_skills', []),
        "selected_specialization": user_data.get('preferred_specialization', None),
        "selected_field": user_data.get('preferred_field', None),
        "rating": overall_rating  # For compatibility with existing code
    }
    
    # Save feedback
    success = save_feedback(feedback)
    
    if success:
        print("\nThank you for your feedback!")
        print("Your input will help us improve our recommendations.")
        
        # If high rating, suggest retraining
        if overall_rating >= 4:
            print("\nYour positive feedback will be used to train our recommendation model.")
            if get_validated_yes_no("Would you like to help retrain the model now (y/n)? "):
                print("\nStarting model retraining...")
                try:
                    # Import and call model training function
                    from utils.model_trainer import train_model_with_recent_changes
                    training_success = train_model_with_recent_changes(
                        user_preferences_only=False,  # Include both preferences and feedback
                        days_threshold=30,            # Consider recent data
                        min_feedback_count=1,         # Allow retraining with just this feedback
                        verbose=True
                    )
                    
                    if training_success:
                        print("\nModel updated successfully with your feedback!")
                    else:
                        print("\nModel training was not completed.")
                        print("Please try again later or contact the administrator.")
                except ImportError:
                    print("\nCould not import training module. Please contact the administrator.")
                except Exception as e:
                    print(f"\nAn error occurred: {str(e)}")
    else:
        print("\nThere was an issue saving your feedback. Please try again later.")
    
    print("\n" + "=" * 60)
    print("Thank you for using the Career Recommender!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        collect_and_save_feedback()
    except KeyboardInterrupt:
        print("\n\nFeedback collection cancelled by user.")
    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
        print("Please try again later.") 