#!/usr/bin/env python3
"""
Feedback generation script for the career recommender system.
This script generates synthetic feedback data that is compatible with model retraining.

Usage:
  python generate_feedback.py [num_entries]
  
  num_entries: Optional - Number of feedback entries to generate (default: 100)
"""

import os
import sys
import json
import random
import uuid
from datetime import datetime, timedelta

# Add the parent directory to the path so we can import the recommender module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.feedback_handler import load_feedback_db, save_feedback_db
from utils.data_loader import load_user_preferences
from recommender import recommend_field_and_career_paths, career_fields

def clear_existing_feedback():
    """Clear existing feedback data to start fresh."""
    feedback_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'feedback')
    
    if os.path.exists(feedback_dir):
        # Remove all feedback files
        for filename in os.listdir(feedback_dir):
            if filename.endswith('.json'):
                os.remove(os.path.join(feedback_dir, filename))
        print(f"Cleared existing feedback files from {feedback_dir}")
    
    # Reset the feedback database
    feedback_db = {
        "feedback_entries": [],
        "improved_recommendations": {}
    }
    
    # Save the empty feedback database
    feedback_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'feedback.json')
    with open(feedback_db_path, 'w') as f:
        json.dump(feedback_db, f, indent=4)
    
    print(f"Reset feedback database at {feedback_db_path}")
    return True

def generate_synthetic_feedback(num_entries=100):
    """
    Generate synthetic feedback entries that are compatible with model retraining.
    
    Args:
        num_entries (int): Number of feedback entries to generate
        
    Returns:
        bool: True if successful, False otherwise
    """
    # Set working directory to the recommender root
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    print(f"Generating {num_entries} synthetic feedback entries...")
    
    # Create feedback directory if it doesn't exist
    feedback_dir = os.path.join('data', 'feedback')
    os.makedirs(feedback_dir, exist_ok=True)
    
    # Create detailed feedback directory if it doesn't exist
    detailed_feedback_dir = os.path.join('data', 'detailed_feedback')
    os.makedirs(detailed_feedback_dir, exist_ok=True)
    
    # Load existing feedback database
    feedback_db = load_feedback_db()
    
    # Prepare timestamps
    now = datetime.now()
    timestamps = []
    for i in range(num_entries):
        # Random time in the past 30 days
        days_ago = random.randint(0, 30)
        hours_ago = random.randint(0, 23)
        minutes_ago = random.randint(0, 59)
        timestamp = now - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
        timestamps.append(timestamp.isoformat())
    
    # Sort timestamps chronologically
    timestamps.sort()
    
    # List of all possible fields
    all_fields = list(career_fields.keys())
    
    # Generate feedback entries
    for i in range(num_entries):
        # Generate a user ID
        user_id = f"synthetic_user_{uuid.uuid4().hex[:8]}"
        
        # Select a random field and role
        field = random.choice(all_fields)
        role = random.choice(career_fields[field]["roles"])
        field_skills = career_fields[field]["skills"]
        
        # Select skills (between 3 and 8 skills)
        num_skills = random.randint(3, 8)
        selected_skills = random.sample(field_skills, min(num_skills, len(field_skills)))
        skills_string = ", ".join(selected_skills)
        
        # Generate a rating (bias towards positive ratings)
        rating = random.choices([3, 4, 5], weights=[0.2, 0.3, 0.5])[0]
        
        # Generate comments
        comment_templates = [
            "This recommendation aligns with my career goals.",
            "I found these suggestions helpful for my development.",
            "The training recommendations are useful.",
            "The career path matches my interests.",
            "I appreciate the skill gap analysis.",
            "The recommendation reflects my capabilities well.",
            "This helped me identify areas to improve.",
            "I'm going to focus on developing these skills."
        ]
        comment = random.choice(comment_templates)
        
        # Create simple feedback entry
        simple_feedback = {
            'user_id': user_id,
            'rating': rating,
            'comments': comment,
            'suggestions': "None",
            'timestamp': timestamps[i],
            'is_positive': rating >= 4,
            'skills': skills_string,
            'current_role': role,
            'recommended_role': role  # For retraining, role matches recommendation
        }
        
        # Save individual feedback file
        feedback_file = os.path.join(feedback_dir, f"{user_id}_feedback.json")
        with open(feedback_file, 'w') as f:
            json.dump([simple_feedback], f, indent=4)
        
        # Add to feedback database
        feedback_db["feedback_entries"].append({
            "user_id": user_id,
            "timestamp": timestamps[i],
            "skills": skills_string,
            "feedback": {
                "rating": rating,
                "comments": comment,
                "is_positive": rating >= 4
            }
        })
        
        # Add detailed feedback entry for model retraining
        if rating >= 4:  # Only use high-rated feedback for retraining
            detailed_feedback = {
                "user_id": user_id,
                "timestamp": timestamps[i],
                "skills": skills_string,
                "interests": field,
                "current_role": role,
                "recommended_role": role,
                "is_positive": True,
                "rating": rating,
                "comments": comment
            }
            
            # Save detailed feedback for retraining
            detailed_feedback_file = os.path.join(detailed_feedback_dir, f"{user_id}_detailed.json")
            with open(detailed_feedback_file, 'w') as f:
                json.dump(detailed_feedback, f, indent=4)
        
        print(f"Generated feedback for user {user_id}: Rating {rating}/5, Field: {field}, Role: {role}")
    
    # Save the updated feedback database
    save_feedback_db(feedback_db)
    
    print(f"\nSuccessfully generated {num_entries} feedback entries.")
    print(f"Total feedback entries in database: {len(feedback_db['feedback_entries'])}")
    
    return True

def main():
    """Main function to run feedback generation."""
    print("=" * 60)
    print("CAREER RECOMMENDER SYSTEM - FEEDBACK GENERATOR")
    print("=" * 60)
    
    # Clear existing feedback by default
    print("\nClearing existing feedback data before generating new data...")
    clear_existing_feedback()
    
    # Get number of entries from command line argument or use default
    num_entries = 100  # Default to 100 entries
    if len(sys.argv) > 1:
        try:
            arg_entries = int(sys.argv[1])
            if arg_entries > 0:
                num_entries = arg_entries
            else:
                print(f"Number must be positive. Using default ({num_entries}).")
        except ValueError:
            print(f"Invalid input. Using default ({num_entries}).")
    
    print(f"Will generate {num_entries} feedback entries")
    
    # Generate feedback
    success = generate_synthetic_feedback(num_entries)
    
    if success:
        print("\nFeedback generation completed successfully.")
        print("\nYou can now retrain the model with this synthetic feedback.")
    else:
        print("\nFeedback generation encountered errors.")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 