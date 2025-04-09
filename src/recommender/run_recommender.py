#!/usr/bin/env python3
"""
Self-contained script to run the career recommender system.
This script will install required packages if needed and then run the system.
"""

import os
import sys
import subprocess
import importlib
import uuid
from datetime import datetime
import json

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.data_loader import (
    load_career_paths,
    load_skills_data,
    get_training_recommendations,
    save_user_preferences,
    load_user_preferences
)
from utils.cluster_manager import update_clusters, get_users_by_skill
from utils.feedback_handler import save_feedback, get_user_feedback
from utils.input_validator import (
    get_validated_integer,
    get_validated_string,
    get_validated_list,
    get_validated_yes_no
)

def check_install_packages():
    """Check and install required packages."""
    required_packages = {
        'pandas': 'pandas',
        'scikit-learn': 'scikit-learn',
        'xgboost': 'xgboost',
        'imbalanced-learn': 'imbalanced-learn',
        'joblib': 'joblib'
    }
    
    for package, pip_name in required_packages.items():
        try:
            importlib.import_module(package)
            print(f"✓ {package} is already installed")
        except ImportError:
            print(f"✗ {pip_name} needs to be installed")
            print(f"Installing {pip_name}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", pip_name])
            print(f"✓ {pip_name} has been installed")

def display_skill_clusters(skill):
    """Display users who need training in a specific skill."""
    users = get_users_by_skill(skill)
    if users:
        print(f"\nUsers needing training in {skill}:")
        for user in users:
            print(f"\nUser ID: {user['user_id']}")
            print(f"Specialization: {user['preferred_specialization']}")
            print("Current Skills:", ", ".join(user['current_skills']))
    else:
        print(f"\nNo users currently need training in {skill}")

def main():
    """Main function to run the recommender system."""
    print("\n" + "="*60)
    print("CAREER RECOMMENDER SYSTEM WITH LEARNING CAPABILITY")
    print("="*60 + "\n")
    
    # Check and install required packages
    check_install_packages()
    
    # Load or create user preferences
    print("\nPredefined user IDs: user1, user2, user3, user4, user5, user6, user7, user8, user9, user10")
    user_id = get_validated_string("\nEnter your user ID (or press Enter for a new user): ", min_length=0, required=False)
    
    existing_user_data = None
    if user_id:
        existing_user_data = load_user_preferences(user_id)
        if existing_user_data:
            print(f"\nWelcome back, user {user_id}!")
            print(f"Your preferred specialization: {existing_user_data['preferred_specialization']}")
            print("Your current skills:", ", ".join(existing_user_data['current_skills']))
        else:
            print(f"\nNo existing data found for user ID: {user_id}")
            print("Creating a new user profile...")
            user_id = str(uuid.uuid4())
            print(f"New user ID assigned: {user_id}")
    else:
        user_id = str(uuid.uuid4())
        print(f"\nNew user ID assigned: {user_id}")
    
    # Load career paths and skills data
    career_paths = load_career_paths()
    skills_data = load_skills_data()
    
    # Get user's preferred specialization
    if existing_user_data:
        # Ask if the user wants to update their specialization
        update_choice = get_validated_yes_no("\nDo you want to update your specialization?", default='n')
        if not update_choice:
            selected_path = next((path for path in career_paths if path['title'] == existing_user_data['preferred_specialization']), None)
            current_skills = existing_user_data['current_skills']
            # Go directly to analysis and recommendations
            run_analysis(user_id, selected_path, current_skills, career_paths, skills_data)
            return
    
    # Show available specializations
    print("\nAvailable Specializations:")
    for i, path in enumerate(career_paths, 1):
        print(f"{i}. {path['title']}")
    
    choice = get_validated_integer("\nEnter the number of your preferred specialization: ", 1, len(career_paths))
    selected_path = career_paths[choice-1]
    
    # Get user's current skills
    if existing_user_data:
        print("\nYour current skills:", ", ".join(existing_user_data['current_skills']))
        update_skills = get_validated_yes_no("Do you want to update your skills?", default='n')
        if update_skills:
            current_skills = get_validated_list("\nPlease enter your current skills (comma-separated): ", min_items=1)
        else:
            current_skills = existing_user_data['current_skills']
    else:
        current_skills = get_validated_list("\nPlease enter your current skills (comma-separated): ", min_items=1)
    
    # Run analysis and display recommendations
    run_analysis(user_id, selected_path, current_skills, career_paths, skills_data)

def run_analysis(user_id, selected_path, current_skills, career_paths, skills_data):
    """Analyze skills and provide recommendations."""
    # Analyze skills and provide recommendations
    required_skills = set(selected_path['required_skills'])
    current_skills_set = set(current_skills)
    lacking_skills = required_skills - current_skills_set
    
    # Save user preferences and recommendations
    user_data = {
        'user_id': user_id,
        'preferred_specialization': selected_path['title'],
        'current_skills': current_skills,
        'lacking_skills': list(lacking_skills),
        'timestamp': datetime.now().isoformat()
    }
    
    save_user_preferences(user_data)
    
    # Update skill clusters
    update_clusters()
    
    # Display results with improved formatting
    print("\n" + "="*60)
    print(f"SPECIALIZATION: {selected_path['title']}")
    print("="*60)
    
    # Display required skills with importance levels and descriptions
    print("\nRequired Skills for This Specialization:")
    print("-" * 40)
    
    # Assign importance levels to skills (this would ideally come from data but we'll simulate it)
    skill_importance = {}
    for i, skill in enumerate(required_skills):
        # Assign importance level: critical, important, or helpful
        if i < len(required_skills) // 3:
            importance = "Critical"
        elif i < (len(required_skills) * 2) // 3:
            importance = "Important"
        else:
            importance = "Helpful"
        skill_importance[skill] = importance
    
    # Create descriptions for skills (simulated)
    skill_descriptions = {
        skill: f"Essential for {selected_path['title']} roles. " + 
              (f"Training recommended." if skill not in current_skills_set else "You already have this skill!")
        for skill in required_skills
    }
    
    # Print skills with formatting
    for skill in required_skills:
        importance = skill_importance[skill]
        description = skill_descriptions[skill]
        skill_status = "✓" if skill in current_skills_set else "✗"
        
        # Color coding based on importance and status
        if skill in current_skills_set:
            print(f"  {skill_status} {skill} - {importance}")
            print(f"     → You already have this skill!")
        else:
            print(f"  {skill_status} {skill} - {importance}")
            print(f"     → {description}")
    
    print("\nYour Current Skills:")
    print("-" * 40)
    for skill in current_skills:
        if skill in required_skills:
            print(f"  ✓ {skill} - Relevant for this specialization")
        else:
            print(f"  • {skill}")
    
    if lacking_skills:
        print("\nSkills You Need to Develop:")
        print("-" * 40)
        print(f"You have {len(current_skills_set & required_skills)}/{len(required_skills)} required skills for this specialization.")
        print(f"Focus on developing these {len(lacking_skills)} skills:\n")
        
        for skill in lacking_skills:
            importance = skill_importance.get(skill, "Important")
            print(f"  ■ {skill} ({importance})")
            # Display other users who need the same skill
            display_skill_clusters(skill)
        
        # Get training recommendations for lacking skills
        training_recommendations = get_training_recommendations(list(lacking_skills))
        print("\nRecommended Training:")
        print("-" * 40)
        for skill, training in training_recommendations.items():
            importance = skill_importance.get(skill, "Important")
            print(f"\nFor {skill} ({importance}):")
            for i, recommendation in enumerate(training, 1):
                print(f"  {i}. {recommendation}")
    else:
        print("\nCongratulations! You have all the required skills for this specialization.")
    
    print("\nYour preferences and recommendations have been saved.")
    print(f"Use your user ID ({user_id}) next time to view or update your recommendations.")
    
    # Collect feedback
    collect_feedback(user_id, lacking_skills)

def collect_feedback(user_id, lacking_skills):
    """Collect detailed user feedback on recommendations."""
    print("\n" + "="*60)
    print("FEEDBACK")
    print("="*60)
    
    print("\nWe value your feedback! Please help us improve our recommendations:")
    
    # Get overall rating
    rating = get_validated_integer("\nOn a scale of 1-5, how helpful were these recommendations? ", 1, 5)
    
    # Get specific feedback on skills recommendations
    skills_rating = get_validated_integer("\nOn a scale of 1-5, how accurate were the skills recommendations? ", 1, 5)
    
    # Get feedback on specific skills if there are lacking skills
    skill_specific_feedback = {}
    if lacking_skills:
        print("\nFor each skill recommendation, please indicate if it was relevant (y/n):")
        for skill in lacking_skills:
            relevant = get_validated_yes_no(f"Is '{skill}' relevant to your career goals? ", default='y')
            skill_specific_feedback[skill] = relevant
    
    # Get feedback on training recommendations
    training_rating = get_validated_integer("\nOn a scale of 1-5, how useful were the training recommendations? ", 1, 5)
    
    # Get comments on what was most helpful
    helpful_comments = get_validated_string("\nWhat aspect of the recommendations was most helpful? ", required=False)
    
    # Get suggestions for improvement
    improvement_suggestions = get_validated_string("\nHow can we improve these recommendations for you? ", required=False)
    
    # Get career path validation
    career_path_accurate = get_validated_yes_no("\nDoes the recommended specialization align with your career goals? ", default='y')
    
    # Ask if missing any skills
    missing_skills = get_validated_string("\nAre there any important skills missing from our recommendations? (comma-separated or leave blank) ", required=False)
    
    # Combine all feedback
    feedback_data = {
        'user_id': user_id,
        'rating': rating,
        'skills_rating': skills_rating,
        'training_rating': training_rating,
        'skill_specific_feedback': skill_specific_feedback,
        'helpful_comments': helpful_comments,
        'improvement_suggestions': improvement_suggestions,
        'career_path_accurate': career_path_accurate,
        'missing_skills': missing_skills,
        'timestamp': datetime.now().isoformat()
    }
    
    # Save comprehensive feedback
    save_feedback(user_id, rating, 
                 f"Skills rating: {skills_rating}/5, Training rating: {training_rating}/5, " + 
                 f"Most helpful: {helpful_comments}, Suggestions: {improvement_suggestions}", 
                 missing_skills)
    
    # Save detailed feedback to a separate file for model improvement
    save_detailed_feedback(user_id, feedback_data)
    
    print("\nThank you for your detailed feedback!")
    print("This will help us improve our recommendation system for you and other users.")
    
    # Check if they want to retrain the model with their feedback
    if rating >= 4:
        retrain_option = get_validated_yes_no("\nWould you like to contribute your feedback to improve the model? ", default='y')
        if retrain_option:
            print("\nThank you! Your feedback will be used to improve the model in the next training cycle.")
            # Set a flag in the user profile to include this feedback in the next training
            update_user_feedback_preference(user_id, include_in_training=True)

def save_detailed_feedback(user_id, feedback_data):
    """Save detailed feedback data for model improvement."""
    feedback_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                               'data', 'detailed_feedback')
    os.makedirs(feedback_dir, exist_ok=True)
    
    file_path = os.path.join(feedback_dir, f"{user_id}_detailed_feedback.json")
    
    # Load existing feedback if any
    existing_feedback = []
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                existing_feedback = json.load(f)
                if not isinstance(existing_feedback, list):
                    existing_feedback = [existing_feedback]
        except json.JSONDecodeError:
            existing_feedback = []
    
    # Add new feedback
    existing_feedback.append(feedback_data)
    
    # Save updated feedback
    with open(file_path, 'w') as f:
        json.dump(existing_feedback, f, indent=4)

def update_user_feedback_preference(user_id, include_in_training=True):
    """Update user preferences for including feedback in model training."""
    user_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                            'data', 'users', f"{user_id}.json")
    
    if os.path.exists(user_file):
        try:
            with open(user_file, 'r') as f:
                user_data = json.load(f)
            
            # Update preference
            user_data['include_feedback_in_training'] = include_in_training
            
            # Save updated data
            with open(user_file, 'w') as f:
                json.dump(user_data, f, indent=4)
        except Exception as e:
            print(f"Error updating user preferences: {e}")

if __name__ == "__main__":
    main() 