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