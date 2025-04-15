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
        enhanced_recommend_fields_based_on_skills,
        recommend_skills_for_specialization
    )
    SKILL_ANALYZER_AVAILABLE = True
except ImportError:
    SKILL_ANALYZER_AVAILABLE = False

# Import hybrid recommender
try:
    from recommender.hybrid_recommender import HybridRecommender
    HYBRID_RECOMMENDER_AVAILABLE = True
except ImportError:
    HYBRID_RECOMMENDER_AVAILABLE = False
    print("Hybrid recommender not available, falling back to basic recommender")

# Import ML model access functions
try:
    from utils.model_trainer import (
        load_career_recommendation_model,
        preprocess_skills_for_model,
        predict_career_field,
        get_field_skill_importance
    )
    MODEL_AVAILABLE = True
except ImportError:
    MODEL_AVAILABLE = False

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
        "Technology": ["Software Development", "Data Science", "Cybersecurity", "Cloud Computing", 
                      "AI Research", "Database Administration", "Network Engineering", "IT Security"],
        "Criminal Justice": ["Criminology", "Forensic Science", "Law Enforcement", "Criminal Justice"],
        "Healthcare": ["Healthcare Administration", "Nursing", "Clinical Psychology", "Industrial-Organizational Psychology"],
        "Business": ["Marketing", "Finance", "Human Resources", "Business Analysis", "Management Consulting",
                    "Operations Management", "Business Development", "Strategic Planning"],
        "Engineering": ["Mechanical Engineering", "Civil Engineering", "Aerospace Engineering", "Electrical Engineering"],
        "Education": ["Elementary Education", "Secondary Education", "Educational Technology", "Special Education"],
        "Creative Arts": ["Graphic Design", "Film Production", "Fine Art", "Music", "Photography", 
                          "Dance", "Creative Writing", "Film", "Animation"],
        "Legal": ["Legal Practice", "Corporate Law", "Criminal Law", "Environmental Law"],
        "Science": ["Environmental Science", "Chemistry", "Physics", "Biology", "Astronomy"],
        "Media": ["Journalism", "Broadcasting", "Digital Media", "Public Relations"],
        "Social Services": ["Social Work", "Community Outreach", "Counseling", "Nonprofit Management"],
        "Healthcare Specialists": ["Physical Therapy", "Speech-Language Pathology", "Occupational Therapy"],
        "Design": ["Architecture", "Interior Design", "Product Design", "UX/UI Design", "Fashion Design"],
        "Agriculture": ["Agriculture", "Agronomy", "Horticulture", "Food Science"],
        "Hospitality": ["Hospitality Management", "Hotel Administration", "Tourism", "Restaurant Management"],
        "Medical": ["Dentistry", "Pharmacy", "Veterinary Medicine", "Radiology", "Nursing"],
        "Urban Development": ["Urban Planning", "City Management", "Community Development", "Transportation Planning"],
        "Environmental Science": ["Conservation Science", "Climate Change Analysis", "Environmental Management"],
        "Library & Information Science": ["Library Science", "Information Management", "Archival Studies"],
        "Marine Science": ["Marine Biology", "Oceanography", "Marine Conservation", "Marine Resource Management"],
        "Maritime & Logistics": ["Maritime Operations", "Port Management", "Shipping Logistics", "Maritime Safety"],
        "Museum & Cultural Heritage": ["Museum Studies", "Cultural Preservation", "Exhibition Design"],
        "Psychology": ["Clinical Psychology", "Neuropsychology", "Developmental Psychology", "Research Psychology"],
        "Textile & Material Science": ["Textile Engineering", "Material Science", "Fabric Development"],
        "Logistics & Operations": ["Supply Chain Management", "Operations Management", "Logistics Coordination"],
        "Social Sciences": ["Sociology", "Anthropology", "Economics", "Political Science"],
        "Real Estate": ["Real Estate Agent", "Property Management", "Real Estate Development"]
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
        "Technology": ["Software Development", "Data Science", "Cybersecurity", "Cloud Computing", 
                      "AI Research", "Database Administration", "Network Engineering", "IT Security"],
        "Criminal Justice": ["Criminology", "Forensic Science", "Law Enforcement", "Criminal Justice"],
        "Healthcare": ["Healthcare Administration", "Nursing", "Clinical Psychology", "Industrial-Organizational Psychology"],
        "Business": ["Marketing", "Finance", "Human Resources", "Business Analysis", "Management Consulting",
                    "Operations Management", "Business Development", "Strategic Planning"],
        "Engineering": ["Mechanical Engineering", "Civil Engineering", "Aerospace Engineering", "Electrical Engineering"],
        "Education": ["Elementary Education", "Secondary Education", "Educational Technology", "Special Education"],
        "Creative Arts": ["Graphic Design", "Film Production", "Fine Art", "Music", "Photography", 
                          "Dance", "Creative Writing", "Film", "Animation"],
        "Legal": ["Legal Practice", "Corporate Law", "Criminal Law", "Environmental Law"],
        "Science": ["Environmental Science", "Chemistry", "Physics", "Biology", "Astronomy"],
        "Media": ["Journalism", "Broadcasting", "Digital Media", "Public Relations"],
        "Social Services": ["Social Work", "Community Outreach", "Counseling", "Nonprofit Management"],
        "Healthcare Specialists": ["Physical Therapy", "Speech-Language Pathology", "Occupational Therapy"],
        "Design": ["Architecture", "Interior Design", "Product Design", "UX/UI Design", "Fashion Design"],
        "Agriculture": ["Agriculture", "Agronomy", "Horticulture", "Food Science"],
        "Hospitality": ["Hospitality Management", "Hotel Administration", "Tourism", "Restaurant Management"],
        "Medical": ["Dentistry", "Pharmacy", "Veterinary Medicine", "Radiology", "Nursing"],
        "Urban Development": ["Urban Planning", "City Management", "Community Development", "Transportation Planning"],
        "Environmental Science": ["Conservation Science", "Climate Change Analysis", "Environmental Management"],
        "Library & Information Science": ["Library Science", "Information Management", "Archival Studies"],
        "Marine Science": ["Marine Biology", "Oceanography", "Marine Conservation", "Marine Resource Management"],
        "Maritime & Logistics": ["Maritime Operations", "Port Management", "Shipping Logistics", "Maritime Safety"],
        "Museum & Cultural Heritage": ["Museum Studies", "Cultural Preservation", "Exhibition Design"],
        "Psychology": ["Clinical Psychology", "Neuropsychology", "Developmental Psychology", "Research Psychology"],
        "Textile & Material Science": ["Textile Engineering", "Material Science", "Fabric Development"],
        "Logistics & Operations": ["Supply Chain Management", "Operations Management", "Logistics Coordination"],
        "Social Sciences": ["Sociology", "Anthropology", "Economics", "Political Science"],
        "Real Estate": ["Real Estate Agent", "Property Management", "Real Estate Development"]
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

def get_recommendations_with_enhanced_model(user_skills, user_preferences=None):
    """
    Get personalized career path recommendations using the enhanced ML model and semantic matching.
    
    Args:
        user_skills (list): List of user's skills
        user_preferences (dict, optional): User's preferences
        
    Returns:
        dict: Recommendation results
    """
    recommendations = {}
    
    # Try to use the hybrid recommender if available (preferred approach)
    if HYBRID_RECOMMENDER_AVAILABLE:
        try:
            # Get current field and specialization from preferences if available
            current_field = None
            current_specialization = None
            
            if user_preferences:
                current_field = user_preferences.get('current_field')
                current_specialization = user_preferences.get('current_specialization')
            
            # Create hybrid recommender instance
            recommender = HybridRecommender()
            
            # Get recommendations
            recommendations = recommender.recommend_fields_for_employee(
                user_skills,
                current_field=current_field,
                current_specialization=current_specialization,
                verbose=False
            )
            
            return recommendations
        except Exception as e:
            print(f"Error using hybrid recommender: {str(e)}")
            # Fall back to enhanced model if hybrid recommender fails
    
    # Fall back to enhanced model-based recommendations
    if MODEL_AVAILABLE:
        try:
            # Load model
            model, model_components = load_career_recommendation_model()
            
            # Preprocess skills for the model
            processed_skills = preprocess_skills_for_model(user_skills, model_components)
            
            # Get prediction and confidence
            predicted_field, confidence, all_scores = predict_career_field(
                processed_skills, model, model_components
            )
            
            # Sort fields by score
            sorted_fields = sorted(all_scores.items(), key=lambda x: x[1], reverse=True)
            top_fields = [(field, score) for field, score in sorted_fields[:5]]
            
            # Create recommendations object
            recommendations = {
                'top_fields': [
                    {
                        'field': field,
                        'match_percentage': round(score * 100, 1),
                        'sources': ['model'],
                        'matching_skills': []  # Would require additional analysis
                    }
                    for field, score in top_fields
                ],
                'explanation': {
                    'summary': f"Based on your skills, the model predicts {predicted_field} as the best matching field with {round(confidence * 100, 1)}% confidence."
                }
            }
            
            return recommendations
        except Exception as e:
            print(f"Error using ML model: {str(e)}")
    
    # Fall back to semantic matching if both hybrid and ML approaches fail
    try:
        # Get recommendations using semantic matching
        semantic_recommendations = enhanced_recommend_fields_based_on_skills(user_skills)
        
        # Create recommendations object
        recommendations = {
            'top_fields': [
                {
                    'field': rec['field'],
                    'match_percentage': rec['match_percentage'],
                    'sources': ['semantic'],
                    'matching_skills': rec['matching_skills'],
                    'missing_skills': rec.get('missing_skills', [])
                }
                for rec in semantic_recommendations[:5]
            ],
            'explanation': {
                'summary': f"Based on semantic matching of your skills, {semantic_recommendations[0]['field']} is the best matching field with {semantic_recommendations[0]['match_percentage']}% match."
            }
        }
        
        return recommendations
    except Exception as e:
        print(f"Error using semantic matching: {str(e)}")
        
        # Return empty recommendations if all approaches fail
        return {
            'top_fields': [],
            'explanation': {
                'summary': "Unable to generate recommendations. Please try again later."
            }
        }

def get_specialization_recommendations(user_skills, field, top_n=3):
    """
    Get specialization recommendations for a specific field.
    
    Args:
        user_skills (list): User's skills
        field (str): Field to get specializations for
        top_n (int): Number of top recommendations to return
        
    Returns:
        list: Recommended specializations
    """
    # Try to use hybrid recommender if available
    if HYBRID_RECOMMENDER_AVAILABLE:
        try:
            recommender = HybridRecommender()
            return recommender.recommend_specializations_for_field(user_skills, field, top_n)
        except Exception as e:
            print(f"Error getting specialization recommendations from hybrid recommender: {str(e)}")
    
    # Fall back to basic approach
    specializations = []
    
    # Get specializations for the field
    field_specializations = fields.get(field, [])
    
    for spec in field_specializations:
        # Calculate match percentage
        analysis = enhanced_analyze_skill_gap(user_skills, spec)
        
        # Create specialization recommendation
        specializations.append({
            'specialization': spec,
            'match_percentage': analysis['match_percentage'],
            'matching_skills': analysis['matching_skills'],
            'similar_skills': analysis.get('similar_skills', {}),
            'missing_skills': analysis['missing_skills'][:5]  # Limit to top 5
        })
    
    # Sort by match percentage
    specializations.sort(key=lambda x: x['match_percentage'], reverse=True)
    
    return specializations[:top_n]

def identify_skill_gaps_for_career_path(user_skills, career_path):
    """
    Identify skill gaps for a specific career path.
    
    Args:
        user_skills (list): User's skills
        career_path (str): Career path title or specialization
        
    Returns:
        dict: Skill gap analysis
    """
    # Try to use hybrid recommender if available
    if HYBRID_RECOMMENDER_AVAILABLE:
        try:
            recommender = HybridRecommender()
            return recommender.identify_skill_gaps(user_skills, career_path)
        except Exception as e:
            print(f"Error identifying skill gaps from hybrid recommender: {str(e)}")
    
    # Fall back to enhanced skill gap analysis
    return enhanced_analyze_skill_gap(user_skills, career_path)

def save_user_recommendation(user_id, recommendation_data, user_skills=None):
    """
    Save user recommendation for future reference.
    
    Args:
        user_id (str): User ID
        recommendation_data (dict): Recommendation results
        user_skills (list, optional): User's skills
        
    Returns:
        bool: Whether save was successful
    """
    # Try to use hybrid recommender if available
    if HYBRID_RECOMMENDER_AVAILABLE:
        try:
            recommender = HybridRecommender()
            return recommender.save_employee_recommendation(user_id, recommendation_data, user_skills)
        except Exception as e:
            print(f"Error saving recommendation with hybrid recommender: {str(e)}")
    
    # Fall back to basic approach
    try:
        # Prepare data to save
        save_data = {
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'recommendations': recommendation_data
        }
        
        if user_skills:
            save_data['user_skills'] = user_skills
        
        # Save to user preferences
        save_user_preferences(save_data)
        
        return True
    except Exception as e:
        print(f"Error saving user recommendation: {str(e)}")
        return False

def example_workflow():
    """Example workflow for the user to follow."""
    # Get a user ID - either existing or new
    user_id = get_user_id()
    
    # Get predefined users
    predefined_users = display_predefined_users()
    predefined_user_ids = [user['id'] for user in predefined_users]
    
    # Check if this is a predefined user
    if user_id in predefined_user_ids:
        for user in predefined_users:
            if user['id'] == user_id:
                print(f"\nWelcome back, {user['name']}!")
                user_data = get_predefined_user(user_id)
                
                # Get current user data
                user_skills = user_data.get('skills', [])
                current_field = user_data.get('field')
                current_specialization = user_data.get('specialization')
                
                print("\nYour current profile:")
                print(f"Skills: {', '.join(user_skills)}")
                if current_field:
                    print(f"Field: {current_field}")
                if current_specialization:
                    print(f"Specialization: {current_specialization}")
                
                # Use sequential recommendation
                print("\nGenerating comprehensive career recommendations...")
                results = run_sequential_recommendation(
                    user_id, 
                    user_skills, 
                    current_field, 
                    current_specialization
                )
                
                # Display results
                display_sequential_recommendation_results(results)
                
                # Ask if user wants to save any feedback
                if get_validated_yes_no("\nWould you like to provide feedback on these recommendations?"):
                    feedback = get_validated_string("Please enter your feedback: ")
                    save_feedback(user_id, "recommendation", feedback)
                    print("Thank you for your feedback!")
                
                return
    
    # For a new user
    print("\nWelcome to the Career Path Recommendation System!")
    
    # Get user name
    user_name = get_validated_string("Please enter your name: ")
    
    # Get user skills
    print("\nPlease enter your current skills, separated by commas.")
    print("Example: Python, Data Analysis, Excel, SQL")
    user_skills_input = get_validated_string("Skills: ")
    user_skills = [skill.strip() for skill in user_skills_input.split(',') if skill.strip()]
    
    # Check if user already has a career field in mind
    has_field = get_validated_yes_no("\nDo you already have a specific career field in mind? (y/n) ")
    
    if has_field:
        field = get_validated_string("What field are you interested in? ")
        has_specialization = get_validated_yes_no("Do you have a specific specialization in mind? (y/n) ")
        
        if has_specialization:
            specialization = get_validated_string("What specialization are you interested in? ")
            
            # Run sequential recommendation with field and specialization
            print("\nGenerating comprehensive career recommendations...")
            results = run_sequential_recommendation(user_id, user_skills, field, specialization)
            
            # Display results
            display_sequential_recommendation_results(results)
        else:
            # Run sequential recommendation with just field
            print("\nGenerating comprehensive career recommendations...")
            results = run_sequential_recommendation(user_id, user_skills, field)
            
            # Display results
            display_sequential_recommendation_results(results)
    else:
        # Undecided user - run sequential recommendation with no field/specialization
        print("\nGenerating comprehensive career recommendations...")
        results = run_sequential_recommendation(user_id, user_skills)
        
        # Display results
        display_sequential_recommendation_results(results)
    
    # Ask if user wants to save any feedback
    if get_validated_yes_no("\nWould you like to provide feedback on these recommendations?"):
        feedback = get_validated_string("Please enter your feedback: ")
        save_feedback(user_id, "recommendation", feedback)
        print("Thank you for your feedback!")

def run_sequential_recommendation(user_id, user_skills, current_field=None, current_specialization=None):
    """
    Run the sequential recommendation workflow:
    1. Recommend field based on skills
    2. Recommend specialization based on field and skills
    3. Recommend skills based on specialization data
    
    Args:
        user_id (str): User ID
        user_skills (list): List of user's current skills
        current_field (str, optional): User's current field if available
        current_specialization (str, optional): User's current specialization if available
    
    Returns:
        dict: Comprehensive recommendation results
    """
    # Initialize the hybrid recommender
    if not HYBRID_RECOMMENDER_AVAILABLE:
        print("Hybrid recommender not available. Using basic recommender instead.")
        # Fallback to basic recommendation
        field_recs = recommend_fields_based_on_skills(user_skills)
        top_field = field_recs[0]['field'] if field_recs else None
        
        if top_field:
            spec_recs = recommend_specializations_for_field(user_skills, top_field)
            top_spec = spec_recs[0]['specialization'] if spec_recs else None
            
            if top_spec:
                skill_analysis = enhanced_analyze_skill_gap(user_skills, top_spec)
                return {
                    "status": "basic",
                    "field_recommendations": {
                        "top_field": top_field,
                        "all_fields": field_recs
                    },
                    "specialization_recommendations": {
                        "top_specialization": top_spec,
                        "all_specializations": spec_recs
                    },
                    "skill_recommendations": {
                        "recommended_skills": skill_analysis.get('missing_skills', []),
                        "popularity_scores": {},
                        "total_employees_analyzed": 0
                    }
                }
        return {"status": "failed", "message": "Could not generate recommendations"}
    
    # Use the hybrid recommender for sequential recommendations
    try:
        recommender = HybridRecommender()
        results = recommender.sequential_recommendation(
            user_skills,
            current_field,
            current_specialization
        )
        
        # Save recommendation for this user
        save_user_recommendation(user_id, results, user_skills)
        
        # Update skill clusters
        if results["status"] == "complete":
            update_user_skills_and_recommendations(
                user_id,
                results["field_recommendations"]["top_field"],
                results["specialization_recommendations"]["top_specialization"],
                user_skills
            )
            
            # Also update the skill clusters
            update_clusters()
        
        return results
    
    except Exception as e:
        print(f"Error in sequential recommendation: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

def display_sequential_recommendation_results(results, verbose=True):
    """
    Display the results of the sequential recommendation in a user-friendly format.
    
    Args:
        results (dict): Results from run_sequential_recommendation
        verbose (bool): Whether to show detailed information
    """
    if results.get("status") == "error":
        print(f"\nError: {results.get('message', 'Unknown error')}")
        return
    
    if results.get("status") == "failed":
        print("\nCould not generate recommendations. Please try again with more skills information.")
        return
    
    # Print header
    print("\n" + "=" * 60)
    print("CAREER PATH RECOMMENDATION RESULTS")
    print("=" * 60)
    
    # Field recommendation
    field_recs = results.get("field_recommendations", {})
    top_field = field_recs.get("top_field", "Unknown")
    match_percentage = field_recs.get("match_percentage", 0)
    
    print(f"\nRecommended Field: {top_field} ({match_percentage}% match)")
    
    # Field explanation if available
    explanation = results.get("explanation", {})
    if "field_reasoning" in explanation and explanation["field_reasoning"]:
        print(f"\n{explanation['field_reasoning']}")
    
    # Specialization recommendation
    spec_recs = results.get("specialization_recommendations", {})
    top_spec = spec_recs.get("top_specialization", "Unknown")
    spec_match = spec_recs.get("match_percentage", 0)
    
    print(f"\nRecommended Specialization: {top_spec} ({spec_match}% match)")
    
    if "specialization_match" in explanation and explanation["specialization_match"]:
        print(f"\n{explanation['specialization_match']}")
    
    # Skill recommendations
    skill_recs = results.get("skill_recommendations", {})
    recommended_skills = skill_recs.get("recommended_skills", [])
    popularity_scores = skill_recs.get("popularity_scores", {})
    total_analyzed = skill_recs.get("total_employees_analyzed", 0)
    
    if recommended_skills:
        print(f"\nRecommended Skills to Develop (based on {total_analyzed} professionals):")
        for skill in recommended_skills:
            popularity = popularity_scores.get(skill, 0)
            print(f"- {skill} (used by {popularity:.1f}% of {top_spec} professionals)")
    else:
        print("\nNo additional skills to recommend. You already have a strong skill set for this specialization.")
    
    # Additional details if verbose
    if verbose:
        print("\n" + "-" * 60)
        print("DETAILED INFORMATION")
        print("-" * 60)
        
        # Current state
        current_state = results.get("current_state", {})
        print(f"\nCurrent Skills: {', '.join(current_state.get('current_skills', []))}")
        
        if current_state.get("current_field"):
            print(f"Current Field: {current_state.get('current_field')}")
        
        if current_state.get("current_specialization"):
            print(f"Current Specialization: {current_state.get('current_specialization')}")
        
        # Additional fields if available
        all_fields = field_recs.get("all_fields", [])
        if len(all_fields) > 1:
            print("\nOther Possible Fields:")
            for field in all_fields[1:4]:  # Show next 3 fields
                print(f"- {field.get('field', 'Unknown')} ({field.get('match_percentage', 0)}% match)")
        
        # Additional specializations if available
        all_specs = spec_recs.get("all_specializations", [])
        if len(all_specs) > 1:
            print("\nOther Possible Specializations in this Field:")
            for spec in all_specs[1:4]:  # Show next 3 specializations
                print(f"- {spec.get('specialization', 'Unknown')} ({spec.get('match_percentage', 0)}% match)")
    
    # Final advice
    print("\n" + "=" * 60)
    if "skill_improvement" in explanation and explanation["skill_improvement"]:
        print(f"\n{explanation['skill_improvement']}")
    print("=" * 60)

def main():
    """Main function that runs the recommendation system."""
    # Check for required packages
    check_install_packages()
    
    print("\nCareer Path Recommendation System")
    print("=" * 40)
    
    # Show available operations
    print("\nSelect an operation:")
    print("1. Get career path recommendations (for yourself)")
    print("2. View skill clusters (for trainers/managers)")
    print("3. View employees needing specific skill training (for trainers)")
    print("4. Update skill clusters (for administrators)")
    print("5. Exit")
    
    choice = get_validated_integer("Enter your choice (1-5): ", min_val=1, max_val=5)
    
    if choice == 1:
        # Run the recommendation workflow
        example_workflow()
    elif choice == 2:
        # View all clusters
        display_all_skill_clusters()
    elif choice == 3:
        # View specific skill cluster
        skill = get_validated_string("Enter the skill to view: ")
        display_skill_clusters(skill)
    elif choice == 4:
        # Update clusters
        update_clusters()
        print("Skill clusters updated successfully")
    elif choice == 5:
        print("\nThank you for using the Career Path Recommendation System. Goodbye!")
        sys.exit(0)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nProgram interrupted by user. Exiting gracefully...")
    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
        print("Please try again later.") 