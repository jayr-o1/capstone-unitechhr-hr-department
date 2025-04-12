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
from utils.cluster_manager import update_clusters, get_users_by_skill, load_clusters, get_skills_by_popularity
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
        update_user_skills_and_recommendations,
        calculate_skill_similarity,
        enhanced_analyze_skill_gap,
        enhanced_recommend_fields_based_on_skills
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

def display_all_skill_clusters():
    """Display all skill clusters with their associated users."""
    # Load all clusters
    clusters = load_clusters()
    if not clusters:
        print("\nNo skill clusters found. Users may not have any skill gaps or no recommendations have been made yet.")
        return
    
    # Get skills sorted by popularity
    skill_popularity = get_skills_by_popularity()
    
    # Display header
    print("\n" + "=" * 60)
    print("ALL SKILL CLUSTERS")
    print("=" * 60)
    print(f"Total skills requiring training: {len(clusters)}")
    
    # Display each cluster
    for skill, count in skill_popularity:
        print(f"\n{'-' * 60}")
        print(f"SKILL: {skill} ({count} users)")
        print(f"{'-' * 60}")
        
        users = clusters.get(skill, [])
        for user in users:
            print(f"\nUser ID: {user['user_id']}")
            print(f"Specialization: {user['preferred_specialization']}")
            print("Current Skills:", ", ".join(user['current_skills']))
    
    print("\n" + "=" * 60)

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
    
    # Perform enhanced skill gap analysis
    analysis = enhanced_analyze_skill_gap(user_skills, selected_path['title'])
    
    # Display results
    print(f"\nSkill Match: {analysis['match_percentage']}%")
    
    # Show current skills that are directly relevant
    if analysis['matching_skills']:
        print("\nYour directly relevant skills:")
        for skill in analysis['matching_skills']:
            print(f"- {skill}")
    
    # Show similar skills that are considered relevant
    if analysis['similar_skills']:
        print("\nYour transferable skills:")
        for req_skill, skill_info in analysis['similar_skills'].items():
            user_skill = skill_info['user_skill']
            similarity = skill_info['similarity']
            similarity_pct = int(similarity * 100)
            print(f"- Your '{user_skill}' is {similarity_pct}% similar to '{req_skill}'")
    
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
        'matching_skills': analysis['matching_skills'],
        'similar_skills': analysis['similar_skills']
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
    Enhanced handling of an undecided user by recommending fields and specializations 
    based on skills, using similarity matching.
    """
    print(f"\nHello {user_name}!")
    print("I'll help you explore career fields and specializations based on your skills.")
    print("This system now recognizes transferable skills for more accurate recommendations!")
    
    # Recommend fields based on skills with the enhanced algorithm
    field_matches = enhanced_recommend_fields_based_on_skills(user_skills)
    
    # Display top 3 recommended fields
    print("\nBased on your skills, here are your top field matches:")
    
    for i, match in enumerate(field_matches[:3], 1):
        print(f"\n{i}. {match['field']} ({match['match_percentage']}% match)")
        
        # Show matching skills for this field
        if match['matching_skills']:
            print("   Directly matching skills:")
            for skill in sorted(match['matching_skills'])[:3]:  # Show top 3
                print(f"   - {skill}")
        
        # Show similar skills
        if match['similar_skills']:
            print("   Transferable skills:")
            similar_items = list(match['similar_skills'].items())
            for req_skill, info in similar_items[:2]:  # Show top 2
                user_skill = info['user_skill']
                similarity = int(info['similarity'] * 100)
                print(f"   - Your '{user_skill}' is {similarity}% similar to '{req_skill}'")
    
    # Ask user which field they want to explore
    print("\nWhich field would you like to explore?")
    for i, match in enumerate(field_matches[:5], 1):
        print(f"{i}. {match['field']} ({match['match_percentage']}% match)")
    
    field_index = get_validated_integer("\nEnter number (or 0 to see all fields): ", 0, len(field_matches[:5]))
    
    if field_index == 0:
        # Show all fields
        print("\nAll field matches:")
        for i, match in enumerate(field_matches, 1):
            print(f"{i}. {match['field']} ({match['match_percentage']}% match)")
        
        field_index = get_validated_integer("\nEnter number: ", 1, len(field_matches))
        selected_field = field_matches[field_index - 1]['field']
    else:
        selected_field = field_matches[field_index - 1]['field']
    
    # Now recommend specializations for that field
    specialization_matches = recommend_specializations_for_field(user_skills, selected_field)
    
    # Display specialization recommendations
    print(f"\nFor {selected_field}, here are recommended specializations:")
    for i, spec in enumerate(specialization_matches, 1):
        print(f"{i}. {spec['specialization']} ({spec['match_percentage']}% match)")
    
    # Ask user which specialization they want to select
    spec_index = get_validated_integer("\nWhich specialization interests you? Enter number: ", 1, len(specialization_matches))
    selected_specialization = specialization_matches[spec_index - 1]['specialization']
    
    # Get career path data for this specialization
    career_paths = load_career_paths()
    selected_path = None
    for path in career_paths:
        if path['title'] == selected_specialization:
            selected_path = path
            break
    
    if selected_path:
        # Perform detailed analysis
        return run_enhanced_analysis(user_id, selected_path, user_skills)
    else:
        print("Could not find data for the selected specialization.")
        return None

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

def update_clusters():
    """Wrapper for updating clusters."""
    try:
        from utils.cluster_manager import update_clusters as update_clusters_func
        update_clusters_func()
    except (ImportError, AttributeError):
        print("Warning: Could not update clusters.")

def get_user_id():
    """
    Get user ID, creating a new one if necessary.
    
    Returns:
        tuple: (user_id, is_new_user, is_predefined)
    """
    # Load all predefined users and display them
    predefined_users = display_predefined_users()
    
    # Get user ID
    user_id = get_validated_string("\nEnter your user ID (or press Enter for a new user): ", min_length=0, required=False)
    
    # Check if this is a predefined user
    is_predefined = False
    if user_id:
        predefined_user = get_predefined_user(user_id)
        if predefined_user:
            print(f"\nWelcome, {predefined_user['name']}!")
            print(f"Your skills: {', '.join(predefined_user['skills'])}")
            is_predefined = True
    
    # If no user_id provided, create a new user
    is_new_user = False
    if not user_id:
        user_id = str(uuid.uuid4())
        print(f"\nNew user ID assigned: {user_id}")
        is_new_user = True
    
    # If not new and not predefined, check if we have existing data
    if not is_new_user and not is_predefined:
        existing_data = load_user_preferences(user_id)
        is_new_user = existing_data is None
    
    return user_id, is_new_user, is_predefined

def main():
    """Run the main program."""
    print("\n" + "=" * 60)
    print("CAREER RECOMMENDER SYSTEM WITH LEARNING CAPABILITY")
    print("=" * 60)
    
    # Check and install packages
    check_install_packages()
    
    # Get user ID or create a new one
    user_id, is_new_user, is_predefined = get_user_id()
    
    if is_predefined:
        # Load predefined user data
        predefined_user = get_predefined_user(user_id)
        if not predefined_user:
            print("Error: Predefined user not found.")
            sys.exit(1)
        
        user_name = predefined_user.get('name', 'User')
        user_skills = predefined_user.get('skills', [])
    else:
        # For non-predefined users
        user_preferences = None if is_new_user else load_user_preferences(user_id)
        
        if user_preferences:
            # Returning user
            user_name = user_preferences.get('user_name', 'User')
            print(f"\nWelcome back, {user_name}!")
            
            # User already made a selection
            if 'preferred_specialization' in user_preferences:
                preferred_spec = user_preferences['preferred_specialization']
                print(f"You previously selected: {preferred_spec}")
                
                # Ask if they want to continue with the same path
                if get_validated_yes_no("Would you like to continue with the same specialization? (y/n): "):
                    career_paths = load_career_paths()
                    selected_path = None
                    for path in career_paths:
                        if path['title'] == preferred_spec:
                            selected_path = path
                            break
                    
                    if selected_path:
                        user_skills = user_preferences.get('current_skills', [])
                        run_analysis(user_id, selected_path, user_skills, career_paths, load_skills_data())
                        return
                    else:
                        print("Your previously selected specialization could not be found. Let's explore new options.")
            
            # Get updated skills
            print("\nYour previously entered skills:")
            for skill in user_preferences.get('current_skills', []):
                print(f"- {skill}")
            
            # Ask if they want to update skills
            if get_validated_yes_no("Would you like to update your skills? (y/n): "):
                user_skills = get_validated_list("Enter your skills (comma-separated): ")
            else:
                user_skills = user_preferences.get('current_skills', [])
        else:
            # New user
            user_name = get_validated_string("Enter your name: ")
            user_skills = get_validated_list("Enter your skills (comma-separated): ")
    
    # Present options to the user
    print("\nWhat would you like to do?")
    print("1. Get career recommendations with skill matching (ENHANCED)")
    print("2. Explore career fields and specializations")
    print("3. View skill clusters (admin)")
    print("4. Train model with recent changes (admin)")
    
    choice = get_validated_integer("Enter your choice (1-4): ", 1, 4)
    
    career_paths = load_career_paths()
    skills_data = load_skills_data()
    
    if choice == 1:
        # NEW: Use enhanced recommendations
        if SKILL_ANALYZER_AVAILABLE:
            handle_enhanced_undecided_user(user_id, user_name, user_skills)
        else:
            print("Enhanced recommendations are not available. Using standard recommendations.")
            handle_undecided_user(user_id, user_name, user_skills, career_paths, skills_data)
    
    elif choice == 2:
        # Explore career fields and specializations
        if SKILL_ANALYZER_AVAILABLE:
            handle_undecided_user(user_id, user_name, user_skills, career_paths, skills_data)
        else:
            handle_undecided_user(user_id, user_name, user_skills, career_paths, skills_data)
    
    elif choice == 3:
        # Admin function: View skill clusters
        print("\nSkill Cluster Management:")
        print("1. View specific skill cluster")
        print("2. View all skill clusters")
        print("3. Return to main menu")
        
        cluster_choice = get_validated_integer("\nEnter your choice (1-3): ", 1, 3)
        
        if cluster_choice == 1:
            # View specific skill cluster
            while True:
                skill = get_validated_string("Enter skill to view user clusters (or 'exit' to quit): ")
                if skill.lower() == 'exit':
                    break
                display_skill_clusters(skill)
        elif cluster_choice == 2:
            # View all skill clusters
            display_all_skill_clusters()
        # Option 3 just returns to main menu
    
    elif choice == 4:
        # Admin function: Train model with recent changes
        print("\n" + "=" * 60)
        print("MODEL TRAINING WITH RECENT CHANGES")
        print("=" * 60)
        
        print("This will update the recommendation model with recent user preferences and feedback.")
        print("The existing model will be backed up before any changes are made.")
        
        if get_validated_yes_no("Do you want to proceed? (y/n): "):
            # Import the training function
            try:
                from utils.model_trainer import train_model_with_recent_changes
                
                # Ask for training options
                use_prefs_only = get_validated_yes_no("Use only user preferences (ignore feedback)? (y/n): ")
                days = get_validated_integer("Consider data from how many recent days? (0 for all data): ", 0, 365)
                min_count = get_validated_integer("Minimum data points required (1-100): ", 1, 100)
                
                print("\nStarting model training...")
                success = train_model_with_recent_changes(
                    user_preferences_only=use_prefs_only,
                    days_threshold=days,
                    min_feedback_count=min_count,
                    verbose=True
                )
                
                if success:
                    print("\nModel training completed successfully!")
                    
                    # Evaluate the model
                    try:
                        from utils.model_trainer import evaluate_model_performance
                        print("\nEvaluating model performance...")
                        metrics = evaluate_model_performance(verbose=True)
                        
                        print("\nModel Evaluation Summary:")
                        print(f"Accuracy: {metrics.get('accuracy', 'N/A')}")
                        print(f"F1 Score: {metrics.get('f1_score', 'N/A')}")
                    except (ImportError, Exception) as e:
                        print(f"\nCould not evaluate model: {str(e)}")
                else:
                    print("\nModel training was not completed.")
                    print("This might be due to insufficient data or an error during training.")
            except ImportError:
                print("\nError: Could not import training functions.")
                print("Make sure all required packages are installed.")
            except Exception as e:
                print(f"\nAn error occurred: {str(e)}")
    
    # Display feedback reminder
    print("\n" + "=" * 60)
    print("YOUR FEEDBACK HELPS US IMPROVE!")
    print("=" * 60)
    print("Please run 'python collect_feedback.py' to provide feedback about your recommendations.")
    print("Your user ID is:", user_id)
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nProgram interrupted by user. Exiting gracefully...")
    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
        print("Please try again later.") 