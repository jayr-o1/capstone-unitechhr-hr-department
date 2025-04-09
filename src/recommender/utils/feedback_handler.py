import os
import json
from datetime import datetime

def save_feedback(user_id, rating, comments, suggestions):
    """Save user feedback on recommendations."""
    # Create feedback directory if it doesn't exist
    feedback_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'feedback')
    os.makedirs(feedback_dir, exist_ok=True)
    
    # Create feedback data
    feedback_data = {
        'user_id': user_id,
        'rating': rating,
        'comments': comments,
        'suggestions': suggestions,
        'timestamp': datetime.now().isoformat()
    }
    
    # Save feedback to file (append to existing feedback if any)
    file_path = os.path.join(feedback_dir, f"{user_id}_feedback.json")
    
    existing_feedback = []
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            try:
                existing_feedback = json.load(f)
                if not isinstance(existing_feedback, list):
                    existing_feedback = [existing_feedback]
            except json.JSONDecodeError:
                existing_feedback = []
    
    existing_feedback.append(feedback_data)
    
    with open(file_path, 'w') as f:
        json.dump(existing_feedback, f, indent=4)
    
    return feedback_data

def get_user_feedback(user_id):
    """Get all feedback from a specific user."""
    file_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
        'data', 'feedback', f"{user_id}_feedback.json"
    )
    
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def get_all_feedback():
    """Get all feedback from all users."""
    feedback_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
        'data', 'feedback'
    )
    
    if not os.path.exists(feedback_dir):
        return []
    
    all_feedback = []
    for filename in os.listdir(feedback_dir):
        if filename.endswith('_feedback.json'):
            with open(os.path.join(feedback_dir, filename), 'r') as f:
                try:
                    feedback = json.load(f)
                    if isinstance(feedback, list):
                        all_feedback.extend(feedback)
                    else:
                        all_feedback.append(feedback)
                except json.JSONDecodeError:
                    pass
    
    return all_feedback 