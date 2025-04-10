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
    get_predefined_user
)
from utils.cluster_manager import update_clusters, get_users_by_skill
from utils.feedback_handler import save_feedback, get_user_feedback
from utils.input_validator import (
    get_validated_integer,
    get_validated_string,
    get_validated_list,
    get_validated_yes_no
)

# Try to import skill analyzer functionality
try:
    from utils.skill_analyzer import (
        recommend_fields_based_on_skills,
        recommend_specializations_for_field,
        analyze_skill_gap,
        get_training_recommendations_for_skills,
        update_user_skills_and_recommendations
    )
    SKILL_ANALYZER_AVAILABLE = True
except ImportError:
    SKILL_ANALYZER_AVAILABLE = False

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

def calculate_skill_match_percentage(user_skills, required_skills):
    """Calculate how well user skills match required skills."""
    if not required_skills:
        return 0
    
    user_skills_set = set(user_skills)
    required_skills_set = set(required_skills)
    
    matching_skills = user_skills_set.intersection(required_skills_set)
    
    return round((len(matching_skills) / len(required_skills_set)) * 100, 1)

def run_analysis(user_id, selected_path, user_skills, career_paths, skills_data):
    """Run detailed analysis based on user's selected path."""
    if SKILL_ANALYZER_AVAILABLE:
        return run_enhanced_analysis(user_id, selected_path, user_skills)
    
    print("\nAnalyzing your skills for:", selected_path['title'])
    print("-" * 60)
    
    # Calculate skill match 
    match_percentage = calculate_skill_match_percentage(user_skills, selected_path['required_skills'])
    print(f"\nSkill Match: {match_percentage}%")
    
    # Identify missing skills
    user_skills_set = set(user_skills)
    required_skills_set = set(selected_path['required_skills'])
    missing_skills = required_skills_set - user_skills_set
    
    # Show current skills that are relevant
    relevant_skills = user_skills_set.intersection(required_skills_set)
    if relevant_skills:
        print("\nYour relevant skills:")
        for skill in relevant_skills:
            print(f"- {skill}")
    
    # Show missing skills
    if missing_skills:
        print("\nSkills you could develop:")
        for skill in missing_skills:
            print(f"- {skill}")
            
            # Show training recommendations
            training_recs = get_training_recommendations(skill, skills_data)
            if training_recs:
                for i, rec in enumerate(training_recs[:2], 1):  # Show only top 2 recommendations
                    print(f"  {i}. {rec}")
    
    # Save user preferences
    save_user_preferences({
        'user_id': user_id,
        'preferred_specialization': selected_path['title'],
        'current_skills': user_skills,
        'lacking_skills': list(missing_skills)
    })
    
    # Update skill clusters silently (do not display to regular users)
    update_clusters()
    
    # Get user feedback on recommendations
    print("\n" + "="*60)
    print("Thank you for using the Career Recommender!")
    print("Your profile has been saved and will be used to improve future recommendations.")
    print("="*60)
    
    return {
        'user_id': user_id,
        'missing_skills': list(missing_skills),
        'match_percentage': match_percentage
    }

def run_enhanced_analysis(user_id, selected_path, user_skills):
    """
    Run enhanced analysis using the skill analyzer functionality.
    
    Args:
        user_id (str): User ID
        selected_path (dict): Selected career path
        user_skills (list): User's current skills
        
    Returns:
        dict: Analysis results
    """
    print("\nAnalyzing your skills for:", selected_path['title'])
    print("-" * 60)
    
    # Perform skill gap analysis
    analysis = analyze_skill_gap(user_skills, selected_path['title'])
    
    # Display results
    print(f"\nSkill Match: {analysis['match_percentage']}%")
    
    # Show current skills that are relevant
    if analysis['matching_skills']:
        print("\nYour relevant skills:")
        for skill in analysis['matching_skills']:
            print(f"- {skill}")
    
    # Show missing skills with training recommendations
    if analysis['missing_skills']:
        print("\nSkills you could develop:")
        training_recs = get_training_recommendations_for_skills(analysis['missing_skills'])
        
        for skill in analysis['missing_skills']:
            print(f"- {skill}")
            
            # Show training recommendations
            if skill in training_recs:
                for i, rec in enumerate(training_recs[skill][:2], 1):  # Show only top 2 recommendations
                    print(f"  {i}. {rec}")
    
    # Get the field for this specialization
    field = get_field_for_specialization(selected_path['title'], [selected_path])
    
    # Save user preferences with field information
    user_data = {
        'user_id': user_id,
        'preferred_field': field,
        'preferred_specialization': selected_path['title'],
        'current_skills': user_skills,
        'lacking_skills': analysis['missing_skills']
    }
    save_user_preferences(user_data)
    
    # Update skill clusters
    update_clusters()
    
    # Get user feedback on recommendations
    print("\n" + "="*60)
    print("Thank you for using the Career Recommender!")
    print("Your profile has been saved and will be used to improve future recommendations.")
    print("="*60)
    
    return {
        'user_id': user_id,
        'missing_skills': analysis['missing_skills'],
        'match_percentage': analysis['match_percentage'],
        'matching_skills': analysis['matching_skills']
    }

def handle_undecided_user(user_id, user_name, user_skills, career_paths, skills_data):
    """Handle an undecided user by recommending fields and specializations based on skills."""
    if SKILL_ANALYZER_AVAILABLE:
        return handle_enhanced_undecided_user(user_id, user_name, user_skills)
    
    print(f"\nHello {user_name}!")
    print("I'll help you explore career fields and specializations based on your skills.")
    
    # Group career paths by field
    fields = {
        "Technology": ["Software Development", "Data Science", "Cybersecurity", "Cloud Computing"],
        "Criminal Justice": ["Criminology", "Forensic Science", "Law Enforcement", "Criminal Justice"],
        "Healthcare": ["Healthcare Administration", "Nursing", "Clinical Psychology", "Industrial-Organizational Psychology"],
        "Business": ["Marketing", "Finance", "Human Resources"],
        "Engineering": ["Mechanical Engineering", "Civil Engineering"],
        "Education": ["Elementary Education", "Secondary Education"],
        "Creative Arts": ["Graphic Design", "Film Production"],
        "Legal": ["Legal Practice"],
        "Science": ["Environmental Science"],
        "Media": ["Journalism"],
        "Social Services": ["Social Work"],
        "Healthcare Specialists": ["Physical Therapy", "Speech-Language Pathology"],
        "Design": ["Architecture", "Interior Design"],
        "Agriculture": ["Agriculture"],
        "Hospitality": ["Hospitality Management"],
        "Medical": ["Dentistry", "Pharmacy", "Veterinary Medicine"],
        "Urban Development": ["Urban Planning"]
    }
    
    # Show available fields with match percentages
    print("\nAvailable Fields:")
    field_matches = {}
    for field, specializations in fields.items():
        # Calculate field match percentage based on skills
        field_skills = set()
        for path in career_paths:
            if path['title'] in specializations:
                field_skills.update(path['required_skills'])
        match_percentage = calculate_skill_match_percentage(user_skills, list(field_skills))
        field_matches[field] = match_percentage
        print(f"{list(fields.keys()).index(field) + 1}. {field} (Match: {match_percentage:.1f}%)")
    
    choice = get_validated_integer("\nEnter the number of your preferred field: ", 1, len(fields))
    
    # User selected a specific field
    selected_field = list(fields.keys())[choice-1]
    
    # Filter career paths for the selected field
    field_paths = [path for path in career_paths if path['title'] in fields[selected_field]]
    
    # Show specializations within the selected field
    print(f"\nAvailable Specializations in {selected_field}:")
    for i, path in enumerate(field_paths, 1):
        match_percentage = calculate_skill_match_percentage(user_skills, path['required_skills'])
        print(f"{i}. {path['title']} (Match: {match_percentage:.1f}%)")
    
    spec_choice = get_validated_integer("\nEnter the number of your preferred specialization: ", 1, len(field_paths))
    
    # User selected a specific specialization
    selected_path = field_paths[spec_choice-1]
    
    # Run analysis and display recommendations
    return run_analysis(user_id, selected_path, user_skills, career_paths, skills_data)

def handle_enhanced_undecided_user(user_id, user_name, user_skills):
    """
    Enhanced handling of undecided users using the skill analyzer functionality.
    
    Args:
        user_id (str): User ID
        user_name (str): User name
        user_skills (list): User's current skills
        
    Returns:
        dict: Analysis results
    """
    print(f"\nHello {user_name}!")
    print("I'll help you explore career fields and specializations based on your skills.")
    
    # Get field recommendations
    field_recommendations = recommend_fields_based_on_skills(user_skills)
    
    # Show top fields with match percentages
    print("\nRecommended Fields:")
    for i, field_rec in enumerate(field_recommendations[:10], 1):
        print(f"{i}. {field_rec['field']} (Match: {field_rec['match_percentage']}%)")
    
    choice = get_validated_integer("\nEnter the number of your preferred field: ", 1, len(field_recommendations[:10]))
    
    # User selected a specific field
    selected_field = field_recommendations[choice-1]['field']
    
    # Get specialization recommendations for the selected field
    spec_recommendations = recommend_specializations_for_field(user_skills, selected_field)
    
    # Show specializations within the selected field
    print(f"\nRecommended Specializations in {selected_field}:")
    for i, spec_rec in enumerate(spec_recommendations, 1):
        print(f"{i}. {spec_rec['specialization']} (Match: {spec_rec['match_percentage']}%)")
        
        # Show top missing skills for this specialization
        if spec_rec['missing_skills']:
            print(f"   Missing skills: {', '.join(spec_rec['missing_skills'][:3])}{'...' if len(spec_rec['missing_skills']) > 3 else ''}")
    
    spec_choice = get_validated_integer("\nEnter the number of your preferred specialization: ", 1, len(spec_recommendations))
    
    # User selected a specific specialization
    selected_specialization = spec_recommendations[spec_choice-1]['specialization']
    
    # Load career paths to get the selected path details
    career_paths = load_career_paths()
    selected_path = None
    for path in career_paths:
        if path['title'] == selected_specialization:
            selected_path = path
            break
    
    if not selected_path:
        print(f"Error: Could not find specialization '{selected_specialization}' in career paths.")
        selected_path = {'title': selected_specialization, 'required_skills': []}
    
    # Run analysis and display recommendations
    return run_enhanced_analysis(user_id, selected_path, user_skills)

def get_field_for_specialization(specialization, career_paths):
    """Determine which field a specialization belongs to."""
    # Define mapping from specializations to fields
    fields = {
        "Technology": ["Software Development", "Data Science", "Cybersecurity", "Cloud Computing"],
        "Criminal Justice": ["Criminology", "Forensic Science", "Law Enforcement", "Criminal Justice"],
        "Healthcare": ["Healthcare Administration", "Nursing", "Clinical Psychology", "Industrial-Organizational Psychology"],
        "Business": ["Marketing", "Finance", "Human Resources"],
        "Engineering": ["Mechanical Engineering", "Civil Engineering"],
        "Education": ["Elementary Education", "Secondary Education"],
        "Creative Arts": ["Graphic Design", "Film Production"],
        "Legal": ["Legal Practice"],
        "Science": ["Environmental Science"],
        "Media": ["Journalism"],
        "Social Services": ["Social Work"],
        "Healthcare Specialists": ["Physical Therapy", "Speech-Language Pathology"],
        "Design": ["Architecture", "Interior Design"],
        "Agriculture": ["Agriculture"],
        "Hospitality": ["Hospitality Management"],
        "Medical": ["Dentistry", "Pharmacy", "Veterinary Medicine"],
        "Urban Development": ["Urban Planning"]
    }
    
    # Find the field that contains this specialization
    for field, specializations in fields.items():
        if specialization in specializations:
            return field
    
    # If not found in the mapping, try to extract from career paths
    for path in career_paths:
        if path['title'] == specialization and 'field' in path:
            return path['field']
    
    # Default return if not found
    return "Other"

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
    
    # Load career paths and skills data
    career_paths = load_career_paths()
    skills_data = load_skills_data()
    
    # Check if this is a predefined user
    if user_id:
        predefined_user = get_predefined_user(user_id)
        if predefined_user:
            print(f"\nWelcome, {predefined_user['name']}!")
            print(f"Your skills: {', '.join(predefined_user['skills'])}")
        
        # Also check for existing user data
        existing_user_data = load_user_preferences(user_id)
        
        if existing_user_data:
            print(f"\nWelcome back! We found your saved preferences.")
            
            if 'preferred_specialization' in existing_user_data:
                print(f"Your preferred specialization: {existing_user_data['preferred_specialization']}")
            
            if 'current_skills' in existing_user_data:
                current_skills = existing_user_data['current_skills']
                print(f"Your current skills: {', '.join(current_skills)}")
            
            if 'lacking_skills' in existing_user_data:
                lacking_skills = existing_user_data['lacking_skills']
                if lacking_skills:
                    print(f"Skills you could develop: {', '.join(lacking_skills)}")
    
    # If no user_id provided, create a new user
    if not user_id:
        user_id = str(uuid.uuid4())
        print(f"\nNew user ID assigned: {user_id}")
    
    # Interactive Mode - Get user's skills
    # Only ask for skills if we don't have them already from existing data
    if 'current_skills' not in locals() or not current_skills:
        if predefined_user:
            current_skills = predefined_user['skills']
            print(f"\nUsing predefined skills: {', '.join(current_skills)}")
        else:
            current_skills = get_validated_list("\nPlease enter your current skills (comma-separated): ", min_items=1)
    
    # If we have existing user data with a preferred specialization, use it
    if existing_user_data and 'preferred_specialization' in existing_user_data:
        preferred_specialization = existing_user_data['preferred_specialization']
        
        # Find the career path for this specialization
        selected_path = None
        for path in career_paths:
            if path['title'] == preferred_specialization:
                selected_path = path
                break
        
        if not selected_path:
            print(f"Error: Could not find your preferred specialization '{preferred_specialization}' in career paths.")
            print("Please select a new specialization.")
            selected_path = None
    else:
        selected_path = None
    
    # If user doesn't have a specialization yet, or we couldn't find it, ask them to select one
    if not selected_path:
        # First decision - is the user undecided?
        is_undecided = get_validated_yes_no("\nAre you undecided about your career path? (y/n): ")
        
        if is_undecided:
            # Handle undecided user - recommend fields and specializations
            user_name = "there" if not predefined_user else predefined_user['name']
            analysis_result = handle_undecided_user(user_id, user_name, current_skills, career_paths, skills_data)
        else:
            # Show all available career paths
            print("\nAvailable Career Paths:")
            for i, path in enumerate(career_paths, 1):
                print(f"{i}. {path['title']}")
            
            choice = get_validated_integer("\nSelect a career path (1-{}): ".format(len(career_paths)), 1, len(career_paths))
            
            # User selected a specific path
            selected_path = career_paths[choice-1]
            
            # Run analysis and display recommendations
            analysis_result = run_analysis(user_id, selected_path, current_skills, career_paths, skills_data)
    else:
        # Run analysis with existing preferences
        print(f"\nAnalyzing your skills for your preferred specialization: {preferred_specialization}")
        analysis_result = run_analysis(user_id, selected_path, current_skills, career_paths, skills_data)
    
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main() 