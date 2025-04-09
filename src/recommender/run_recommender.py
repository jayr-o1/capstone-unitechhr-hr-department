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
    
    # Display results
    print("\n" + "="*60)
    print(f"SPECIALIZATION: {selected_path['title']}")
    print("="*60)
    
    print("\nRequired Skills:")
    for skill in required_skills:
        print(f"- {skill}")
    
    print("\nYour Current Skills:")
    for skill in current_skills:
        print(f"- {skill}")
    
    if lacking_skills:
        print("\nSkills You Need to Develop:")
        for skill in lacking_skills:
            print(f"- {skill}")
            # Display other users who need the same skill
            display_skill_clusters(skill)
        
        # Get training recommendations for lacking skills
        training_recommendations = get_training_recommendations(list(lacking_skills))
        print("\nRecommended Training:")
        for skill, training in training_recommendations.items():
            print(f"\nFor {skill}:")
            for recommendation in training:
                print(f"- {recommendation}")
    else:
        print("\nGreat! You have all the required skills for this specialization.")
    
    print("\nYour preferences and recommendations have been saved.")
    print(f"Use your user ID ({user_id}) next time to view or update your recommendations.")
    
    # Collect feedback
    collect_feedback(user_id, lacking_skills)

def collect_feedback(user_id, lacking_skills):
    """Collect user feedback on recommendations."""
    print("\n" + "="*60)
    print("FEEDBACK")
    print("="*60)
    
    print("\nWe value your feedback! Please rate our recommendations:")
    
    # Get rating
    rating = get_validated_integer("\nOn a scale of 1-5, how helpful were these recommendations? ", 1, 5)
    
    # Get comments
    comments = get_validated_string("\nWhat did you like or dislike about the recommendations? ", required=False)
    
    # Get suggestions for improvement
    suggestions = get_validated_string("\nAny suggestions for improving the recommendations? ", required=False)
    
    # Save feedback
    feedback_data = save_feedback(user_id, rating, comments, suggestions)
    
    print("\nThank you for your feedback! It will help us improve our recommendations.")

if __name__ == "__main__":
    main() 