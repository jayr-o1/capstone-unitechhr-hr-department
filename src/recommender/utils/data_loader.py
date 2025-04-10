import json
import os
from datetime import datetime
from .error_handler import safe_load_json, safe_save_json, handle_user_error

def load_career_paths():
    """Load career paths from JSON file."""
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'career_paths.json')
    data = safe_load_json(file_path)
    
    if not data:
        handle_user_error("Failed to load career paths data. Using default data.", exit_program=False)
        # Return default data if file cannot be loaded
        return [
            {
                "title": "Software Development",
                "required_skills": ["Programming", "Problem Solving"]
            },
            {
                "title": "Data Science",
                "required_skills": ["Python", "Statistics"]
            }
        ]
    
    return data['career_paths']

def load_skills_data():
    """Load skills data from JSON file."""
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'training_recommendations.json')
    data = safe_load_json(file_path, {})
    
    if not data:
        handle_user_error("Failed to load training recommendations. Using default data.", exit_program=False)
        # Return default data if file cannot be loaded
        return {
            "training_recommendations": {
                "Programming": ["Learn a programming language"],
                "Problem Solving": ["Practice coding challenges"]
            }
        }
    
    return data

def get_training_recommendations(skills):
    """Get training recommendations for specific skills."""
    skills_data = load_skills_data()
    recommendations = {}
    
    for skill in skills:
        if skill in skills_data.get('training_recommendations', {}):
            recommendations[skill] = skills_data['training_recommendations'][skill]
        else:
            # Default recommendation if skill not found
            recommendations[skill] = ["Search for online courses", "Practice regularly"]
    
    return recommendations

def save_user_preferences(user_data):
    """Save user preferences and recommendations."""
    # Create users directory if it doesn't exist
    users_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'users')
    os.makedirs(users_dir, exist_ok=True)
    
    # Save user data
    file_path = os.path.join(users_dir, f"{user_data['user_id']}.json")
    success = safe_save_json(user_data, file_path)
    
    if not success:
        handle_user_error("Failed to save user preferences. Your data may not be saved for next time.", exit_program=False)
    
    return success

def load_user_preferences(user_id):
    """Load user preferences and recommendations."""
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'users', f"{user_id}.json")
    return safe_load_json(file_path)

def load_predefined_users():
    """Load predefined users with their skills."""
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'predefined_users.json')
    data = safe_load_json(file_path)
    
    if not data:
        handle_user_error("Failed to load predefined users. Using default data.", exit_program=False)
        # Return default data if file cannot be loaded
        return {
            "users": [
                {
                    "id": "user1",
                    "name": "John Doe",
                    "skills": ["Python", "Problem Solving", "Cloud Platforms", "Data Analysis"]
                }
            ]
        }
    
    return data

def get_predefined_user(user_id):
    """Get a predefined user by ID."""
    predefined_users = load_predefined_users()
    
    for user in predefined_users.get('users', []):
        if user['id'] == user_id:
            return user
    
    return None

def calculate_specialization_match(user_skills, career_path):
    """
    Calculate how well a user's skills match a specialization.
    Returns a match percentage and missing skills.
    """
    required_skills = set(career_path['required_skills'])
    user_skills_set = set(user_skills)
    
    # Calculate matching skills
    matching_skills = user_skills_set.intersection(required_skills)
    missing_skills = required_skills - user_skills_set
    
    # Calculate match percentage
    if not required_skills:
        return 0, list(missing_skills)
    
    match_percentage = round((len(matching_skills) / len(required_skills)) * 100)
    
    return match_percentage, list(missing_skills)

def recommend_specializations_based_on_skills(user_skills, top_n=3):
    """
    Recommend specializations based on user skills.
    Returns a list of dictionaries with specialization, match percentage, and missing skills.
    """
    career_paths = load_career_paths()
    recommendations = []
    
    for path in career_paths:
        match_percentage, missing_skills = calculate_specialization_match(user_skills, path)
        
        recommendations.append({
            "specialization": path['title'],
            "match_percentage": match_percentage,
            "missing_skills": missing_skills
        })
    
    # Sort by match percentage
    recommendations.sort(key=lambda x: x['match_percentage'], reverse=True)
    
    # Group specializations by field
    field_recommendations = {}
    for rec in recommendations:
        field = get_field_from_specialization(rec['specialization'])
        if field not in field_recommendations:
            field_recommendations[field] = []
        field_recommendations[field].append(rec)
    
    # Find the best field based on average match percentage
    best_field = max(field_recommendations.items(), 
                     key=lambda x: sum(r['match_percentage'] for r in x[1]) / len(x[1]))
    
    top_recommendations = recommendations[:top_n]
    
    return {
        "recommended_field": best_field[0],
        "top_specializations": top_recommendations,
        "all_recommendations": recommendations
    }

def get_field_from_specialization(specialization):
    """Map specialization to a broader field."""
    field_mapping = {
        # Technology fields
        "Software Development": "Computer Science",
        "Data Science": "Computer Science",
        "Cybersecurity": "Computer Science",
        "Cloud Computing": "Computer Science",
        
        # Criminal Justice fields
        "Criminology": "Criminal Justice",
        "Forensic Science": "Criminal Justice",
        "Law Enforcement": "Criminal Justice",
        "Criminal Justice": "Criminal Justice",
        
        # Healthcare fields
        "Healthcare Administration": "Healthcare",
        "Nursing": "Healthcare",
        "Physical Therapy": "Healthcare",
        "Speech-Language Pathology": "Healthcare",
        "Dentistry": "Healthcare",
        "Pharmacy": "Healthcare",
        "Veterinary Medicine": "Healthcare",
        
        # Psychology fields
        "Clinical Psychology": "Psychology",
        "Industrial-Organizational Psychology": "Psychology",
        
        # Business fields
        "Marketing": "Business",
        "Finance": "Business",
        "Human Resources": "Business",
        "Hospitality Management": "Business",
        
        # Engineering fields
        "Mechanical Engineering": "Engineering",
        "Civil Engineering": "Engineering",
        
        # Education fields
        "Elementary Education": "Education",
        "Secondary Education": "Education",
        
        # Arts & Design fields
        "Graphic Design": "Arts & Design",
        "Film Production": "Arts & Design",
        "Architecture": "Arts & Design",
        "Interior Design": "Arts & Design",
        
        # Other professional fields
        "Legal Practice": "Law",
        "Environmental Science": "Environmental Science",
        "Journalism": "Communications",
        "Social Work": "Social Services",
        "Agriculture": "Agriculture",
        "Urban Planning": "Urban Planning"
    }
    
    return field_mapping.get(specialization, "Other") 