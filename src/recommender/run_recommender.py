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
    load_user_preferences,
    load_predefined_users,
    get_predefined_user,
    recommend_specializations_based_on_skills
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

def display_predefined_users():
    """Display list of predefined users with their names."""
    predefined_users = load_predefined_users()
    if predefined_users and 'users' in predefined_users:
        print("\nPredefined users:")
        for user in predefined_users['users']:
            print(f"  - {user['id']}: {user['name']}")
    return predefined_users.get('users', [])

def handle_undecided_user(user_id, user_name, user_skills, career_paths, skills_data):
    """Handle an undecided user by recommending fields and specializations based on skills."""
    print(f"\n{user_name} is undecided with skills: {', '.join(user_skills)}")
    
    # Get recommendations based on skills
    recommendations = recommend_specializations_based_on_skills(user_skills)
    
    # Display recommended field
    recommended_field = recommendations['recommended_field']
    print(f"\nRecommended Field: {recommended_field}")
    
    # Display top specialization recommendations
    print("\nRecommended Specializations:")
    for i, rec in enumerate(recommendations['top_specializations'], 1):
        print(f"{i}. {rec['specialization']} ({rec['match_percentage']}% match)")
    
    # Ask if the user wants to select one of the recommended specializations
    select_recommendation = get_validated_yes_no("\nWould you like to select one of these specializations?", default='y')
    
    if select_recommendation:
        choice = get_validated_integer("\nEnter the number of your chosen specialization: ", 1, len(recommendations['top_specializations']))
        selected_recommendation = recommendations['top_specializations'][choice-1]
        
        # Find the career path object for the selected specialization
        selected_path = next((path for path in career_paths if path['title'] == selected_recommendation['specialization']), None)
        
        # Run analysis with the selected specialization
        if selected_path:
            run_analysis(user_id, selected_path, user_skills, career_paths, skills_data)
            return
    
    # Ask for feedback on recommendations
    collect_undecided_feedback(user_id, user_name, recommendations)

def collect_undecided_feedback(user_id, user_name, recommendations):
    """Collect feedback from undecided users on their recommendations."""
    print("\n" + "="*60)
    print("FEEDBACK ON RECOMMENDATIONS")
    print("="*60)
    
    print(f"\nWe value your feedback, {user_name}!")
    
    # Get overall satisfaction with field recommendation
    field_satisfaction = get_validated_integer(
        f"\nOn a scale of 1-5, how satisfied are you with the {recommendations['recommended_field']} field recommendation? ", 
        1, 5
    )
    
    # Get satisfaction with specialization recommendations
    spec_satisfaction = get_validated_integer(
        "\nOn a scale of 1-5, how satisfied are you with the specialization recommendations? ", 
        1, 5
    )
    
    # Get most appealing specialization
    print("\nWhich specialization appeals to you the most?")
    for i, rec in enumerate(recommendations['top_specializations'], 1):
        print(f"{i}. {rec['specialization']}")
    
    appealing_choice = get_validated_integer("Enter your choice (1-3): ", 1, len(recommendations['top_specializations']))
    appealing_specialization = recommendations['top_specializations'][appealing_choice-1]['specialization']
    
    # Get free-form feedback
    comments = get_validated_string("\nAny additional comments on your recommendations? ", required=False)
    
    # Save the feedback
    feedback_data = {
        'user_id': user_id,
        'name': user_name,
        'recommended_field': recommendations['recommended_field'],
        'field_satisfaction': field_satisfaction,
        'specialization_satisfaction': spec_satisfaction,
        'appealing_specialization': appealing_specialization,
        'comments': comments,
        'timestamp': datetime.now().isoformat()
    }
    
    # Save feedback
    save_feedback(
        user_id=user_id, 
        rating=field_satisfaction, 
        comments=comments, 
        suggestions=f"Field: {recommendations['recommended_field']}, Preferred: {appealing_specialization}"
    )
    
    print("\nThank you for your feedback! This will help us improve our recommendations.")

def main():
    """Main function to run the recommender system."""
    print("\n" + "="*60)
    print("CAREER RECOMMENDER SYSTEM WITH LEARNING CAPABILITY")
    print("="*60 + "\n")
    
    # Check and install required packages
    check_install_packages()
    
    # Load all predefined users and display them
    predefined_users = display_predefined_users()
    
    # Load or create user preferences
    user_id = get_validated_string("\nEnter your user ID (or press Enter for a new user): ", min_length=0, required=False)
    
    # Initialize variables
    existing_user_data = None
    predefined_user = None
    
    # Check if this is a predefined user
    if user_id:
        predefined_user = get_predefined_user(user_id)
        if predefined_user:
            print(f"\nWelcome, {predefined_user['name']}!")
            print(f"Your skills: {', '.join(predefined_user['skills'])}")
        
        # Also check for existing user data
        existing_user_data = load_user_preferences(user_id)
        if existing_user_data:
            print(f"Your preferred specialization: {existing_user_data['preferred_specialization']}")
            print(f"Your current skills: {', '.join(existing_user_data['current_skills'])}")
    
    # If no user_id provided, create a new user
    if not user_id:
        user_id = str(uuid.uuid4())
        print(f"\nNew user ID assigned: {user_id}")
    
    # Load career paths and skills data
    career_paths = load_career_paths()
    skills_data = load_skills_data()
    
    # If we have a predefined user but no existing user data
    if predefined_user and not existing_user_data:
        # Ask if they're undecided or want to choose a specialization
        undecided = get_validated_yes_no("\nAre you undecided about your career path?", default='n')
        
        if undecided:
            # Handle undecided user by recommending based on skills
            handle_undecided_user(
                user_id=user_id,
                user_name=predefined_user['name'],
                user_skills=predefined_user['skills'],
                career_paths=career_paths,
                skills_data=skills_data
            )
            return
    
    # If user has existing data, ask if they want to update
    if existing_user_data:
        update_choice = get_validated_yes_no("\nDo you want to update your specialization?", default='n')
        if not update_choice:
            selected_path = next((path for path in career_paths if path['title'] == existing_user_data['preferred_specialization']), None)
            # Use current skills from database or predefined user
            current_skills = existing_user_data['current_skills']
            # Go directly to analysis and recommendations
            run_analysis(user_id, selected_path, current_skills, career_paths, skills_data)
            return
    
    # Show available specializations with an option for "Undecided"
    print("\nAvailable Specializations:")
    print("0. I'm Undecided (Get Recommendations)")
    for i, path in enumerate(career_paths, 1):
        print(f"{i}. {path['title']}")
    
    choice = get_validated_integer("\nEnter the number of your preferred specialization: ", 0, len(career_paths))
    
    # Handle undecided user (choice 0)
    if choice == 0:
        if predefined_user:
            current_skills = predefined_user['skills']
        else:
            # Get user's name
            user_name = get_validated_string("\nPlease enter your name: ", min_length=1)
            # Get skills for a new undecided user
            current_skills = get_validated_list("\nPlease enter your current skills (comma-separated): ", min_items=1)
            
        # Handle undecided user
        handle_undecided_user(
            user_id=user_id,
            user_name=predefined_user['name'] if predefined_user else user_name,
            user_skills=current_skills,
            career_paths=career_paths,
            skills_data=skills_data
        )
        return
    
    # User selected a specific specialization
    selected_path = career_paths[choice-1]
    
    # Get user's current skills (from predefined user or input)
    if predefined_user:
        current_skills = predefined_user['skills']
    elif existing_user_data:
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
    
    # Print a thank you message
    print("\nThank you for your detailed feedback!")
    print("This will help us improve our recommendation system for you and other users.")
    
    # Ask if they want to contribute their feedback to model improvement
    contribute = get_validated_yes_no("\nWould you like to contribute your feedback to improve the model? ", default='y')
    
    if contribute:
        # Save feedback data
        save_feedback(
            user_id=user_id,
            rating=rating,
            comments=helpful_comments,
            suggestions=improvement_suggestions
        )
        print("\nThank you! Your feedback will be used to improve the model in the next training cycle.")

if __name__ == "__main__":
    main() 