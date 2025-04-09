#!/usr/bin/env python3
"""
Feedback generation script for the career recommender system.
This script generates synthetic feedback data based on existing users.
"""

import os
import sys
import json
import random
import uuid
from datetime import datetime, timedelta

# Add the parent directory to the path so we can import the recommender module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.feedback import load_feedback_db, save_feedback_db
from utils.data_loader import load_user_preferences
from recommender import recommend_field_and_career_paths

def generate_synthetic_feedback(num_entries=15):
    """
    Generate synthetic feedback entries based on existing users.
    
    Args:
        num_entries (int): Number of feedback entries to generate
        
    Returns:
        bool: True if successful, False otherwise
    """
    # Set working directory to the recommender root
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    print(f"Generating {num_entries} synthetic feedback entries...")
    
    # Load existing feedback database
    feedback_db = load_feedback_db()
    
    # Load users data
    users_dir = os.path.join('data', 'users')
    if not os.path.exists(users_dir):
        print(f"Error: Users directory not found at {users_dir}")
        return False
    
    user_files = [f for f in os.listdir(users_dir) if f.endswith('.json')]
    if not user_files:
        print("Error: No user files found")
        return False
    
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
    
    # Generate feedback entries
    for i in range(num_entries):
        # Randomly select a user file
        user_file = random.choice(user_files)
        user_id = user_file.replace('.json', '')
        
        # Load user data
        user_data_path = os.path.join(users_dir, user_file)
        try:
            with open(user_data_path, 'r') as f:
                user_data = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading user data from {user_file}: {e}")
            continue
        
        # Extract user information
        preferred_specialization = user_data.get('preferred_specialization', '')
        current_skills = user_data.get('current_skills', [])
        
        # Generate skills string
        skills = ", ".join(current_skills)
        
        # Generate random experience
        experience = f"{random.randint(0, 15)}+ years"
        
        # Get recommendations based on user's skills and experience
        try:
            recommendations = recommend_field_and_career_paths(skills, experience)
        except Exception as e:
            print(f"Error generating recommendations for user {user_id}: {e}")
            continue
        
        # Generate feedback
        # Favor high ratings and preferred specialization to make feedback more useful for retraining
        rating = random.choices([3, 4, 5], weights=[0.2, 0.3, 0.5])[0]
        
        # Select path from top 3 recommendations, with bias towards user's preferred specialization
        selected_path = None
        top_paths = recommendations["Top 3 Career Paths"]
        
        # Check if user's preferred specialization is in top 3 recommendations
        if preferred_specialization in top_paths:
            # 70% chance to select their preferred specialization
            if random.random() < 0.7:
                selected_path = preferred_specialization
            else:
                # Otherwise randomly select from top 3
                selected_path = random.choice(top_paths)
        else:
            # Randomly select from top 3
            selected_path = random.choice(top_paths)
        
        # Generate comments
        comment_templates = [
            "This recommendation aligns with my career goals.",
            "I found these recommendations helpful.",
            "Good suggestions for skills to develop.",
            "The training recommendations are useful.",
            "I'm interested in exploring the {path} path.",
            "Not sure about {path}, but the other options are good.",
            "The skill gap analysis is accurate.",
            "Would like more specific training resources.",
            "Perfect match for my skills and interests.",
            "Need more information about {path} requirements."
        ]
        
        comment = random.choice(comment_templates).replace("{path}", selected_path)
        
        # Create feedback entry
        feedback_entry = {
            "user_id": user_id,
            "timestamp": timestamps[i],
            "skills": skills,
            "experience": experience,
            "recommendations": recommendations,
            "feedback": {
                "selected_path": selected_path,
                "rating": rating,
                "comments": comment
            }
        }
        
        # Add to feedback database
        feedback_db["feedback_entries"].append(feedback_entry)
        
        # Generate improved recommendations for high ratings
        if rating >= 4:
            # Create improved recommendation based on user feedback
            improved_rec = recommendations.copy()
            
            # If user selected a specific path, prioritize it
            if selected_path in improved_rec["Top 3 Career Paths"]:
                idx = improved_rec["Top 3 Career Paths"].index(selected_path)
                
                # Move the selected path to the top
                for key in ["Top 3 Career Paths", "Required Skills", "Confidence Percentages", 
                           "Lacking Skills", "Training Recommendations"]:
                    if idx > 0 and len(improved_rec[key]) > idx:
                        improved_rec[key][0], improved_rec[key][idx] = improved_rec[key][idx], improved_rec[key][0]
            
            # Store the improved recommendation
            feedback_db["improved_recommendations"][user_id] = {
                "skills": skills,
                "experience": experience,
                "recommendation": improved_rec,
                "last_updated": timestamps[i]
            }
        
        print(f"Generated feedback for user {user_id}: Rating {rating}/5, Selected path: {selected_path}")
    
    # Save the updated feedback database
    save_feedback_db(feedback_db)
    
    print(f"\nSuccessfully generated {num_entries} feedback entries.")
    print(f"Total feedback entries: {len(feedback_db['feedback_entries'])}")
    print(f"Total improved recommendations: {len(feedback_db['improved_recommendations'])}")
    
    return True

def main():
    """Main function to run feedback generation."""
    print("=" * 60)
    print("CAREER RECOMMENDER SYSTEM - FEEDBACK GENERATOR")
    print("=" * 60)
    
    # Ask for number of entries to generate
    try:
        num_entries = int(input("\nHow many feedback entries to generate? (default: 15): ") or "15")
        if num_entries <= 0:
            print("Number must be positive. Using default (15).")
            num_entries = 15
    except ValueError:
        print("Invalid input. Using default (15).")
        num_entries = 15
    
    # Generate feedback
    success = generate_synthetic_feedback(num_entries)
    
    if success:
        print("\nFeedback generation completed successfully!")
        return 0
    else:
        print("\nFeedback generation failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 