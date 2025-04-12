import os
import json
import uuid
from datetime import datetime

# Define path for feedback database
FEEDBACK_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'feedback.json')

def convert_sets_to_lists(obj):
    """
    Recursively converts sets to lists in a nested dictionary or list.
    
    Args:
        obj: The object to convert
        
    Returns:
        The object with all sets converted to lists
    """
    if isinstance(obj, dict):
        return {k: convert_sets_to_lists(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_sets_to_lists(item) for item in obj]
    elif isinstance(obj, set):
        return [item for item in obj]  # Convert set to list
    else:
        return obj

def initialize_feedback_db():
    """
    Initialize the feedback database if it doesn't exist.
    """
    if not os.path.exists(FEEDBACK_DB_PATH):
        with open(FEEDBACK_DB_PATH, 'w') as f:
            json.dump({
                "feedback_entries": [],
                "improved_recommendations": {}
            }, f, indent=4)
        print(f"Created new feedback database at {FEEDBACK_DB_PATH}")

def load_feedback_db():
    """
    Load the feedback database from disk.
    
    Returns:
        dict: The feedback database
    """
    try:
        # Try to load the existing database
        if os.path.exists(FEEDBACK_DB_PATH):
            with open(FEEDBACK_DB_PATH, 'r') as f:
                return json.load(f)
        else:
            # If file doesn't exist, initialize a new one
            initialize_feedback_db()
            with open(FEEDBACK_DB_PATH, 'r') as f:
                return json.load(f)
    except json.JSONDecodeError as e:
        # If JSON is corrupted, create a new database
        print(f"Warning: Feedback database corrupted. Creating a new one. Error: {e}")
        # Backup the corrupted file
        if os.path.exists(FEEDBACK_DB_PATH):
            backup_path = f"{FEEDBACK_DB_PATH}.backup.{datetime.now().strftime('%Y%m%d%H%M%S')}"
            try:
                os.rename(FEEDBACK_DB_PATH, backup_path)
                print(f"Corrupted database backed up to {backup_path}")
            except:
                print("Could not back up corrupted database")
        
        # Create a new database
        initialize_feedback_db()
        with open(FEEDBACK_DB_PATH, 'r') as f:
            return json.load(f)

def save_feedback_db(db):
    """
    Save the feedback database to disk.
    
    Args:
        db (dict): The feedback database to save
    """
    # Convert any sets to lists before saving as JSON
    json_safe_db = convert_sets_to_lists(db)
    with open(FEEDBACK_DB_PATH, 'w') as f:
        json.dump(json_safe_db, f, indent=4)

def save_feedback(feedback_data):
    """
    Save user feedback to the feedback directory.
    
    Args:
        feedback_data (dict): Dictionary with feedback data
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create feedback directory if it doesn't exist
        feedback_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'feedback')
        os.makedirs(feedback_dir, exist_ok=True)
        
        # Generate a unique filename based on user ID and timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        user_id = feedback_data.get('user_id', 'unknown')
        filename = f"feedback_{user_id}_{timestamp}.json"
        filepath = os.path.join(feedback_dir, filename)
        
        # Save the feedback data
        with open(filepath, 'w') as f:
            json.dump(feedback_data, f, indent=2)
        
        # Also append to the main feedback file
        main_feedback_file = os.path.join(feedback_dir, 'feedback.json')
        all_feedback = {"feedback": []}
        
        # Load existing feedback if it exists
        if os.path.exists(main_feedback_file):
            try:
                with open(main_feedback_file, 'r') as f:
                    all_feedback = json.load(f)
            except json.JSONDecodeError:
                # If the file is corrupted, start fresh
                all_feedback = {"feedback": []}
        
        # Append the new feedback
        all_feedback["feedback"].append(feedback_data)
        
        # Save the updated feedback file
        with open(main_feedback_file, 'w') as f:
            json.dump(all_feedback, f, indent=2)
        
        return True
    
    except Exception as e:
        print(f"Error saving feedback: {str(e)}")
        return False

def get_user_feedback(user_id=None):
    """
    Get feedback data for a specific user or all feedback if user_id is None.
    
    Args:
        user_id (str, optional): User ID to filter feedback for
        
    Returns:
        list: Feedback data items
    """
    try:
        feedback_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'feedback')
        main_feedback_file = os.path.join(feedback_dir, 'feedback.json')
        
        if not os.path.exists(main_feedback_file):
            return []
        
        with open(main_feedback_file, 'r') as f:
            all_feedback = json.load(f)
        
        if user_id:
            # Filter feedback for the specified user
            return [item for item in all_feedback.get("feedback", []) if item.get("user_id") == user_id]
        else:
            # Return all feedback
            return all_feedback.get("feedback", [])
    
    except Exception as e:
        print(f"Error retrieving feedback: {str(e)}")
        return []

def analyze_feedback(min_rating=None, max_rating=None):
    """
    Analyze feedback data.
    
    Args:
        min_rating (int, optional): Minimum rating to filter by
        max_rating (int, optional): Maximum rating to filter by
        
    Returns:
        dict: Analysis results
    """
    all_feedback = get_user_feedback()
    
    # Filter by rating if specified
    if min_rating is not None:
        all_feedback = [f for f in all_feedback if f.get("satisfaction_rating", 0) >= min_rating]
    
    if max_rating is not None:
        all_feedback = [f for f in all_feedback if f.get("satisfaction_rating", 0) <= max_rating]
    
    # Calculate average satisfaction
    if all_feedback:
        ratings = [f.get("satisfaction_rating", 0) for f in all_feedback if "satisfaction_rating" in f]
        avg_rating = sum(ratings) / len(ratings) if ratings else None
    else:
        avg_rating = None
    
    # Count feedback by recommendation type
    field_feedback = [f for f in all_feedback if f.get("recommendation_type") == "field_recommendations"]
    specialization_feedback = [f for f in all_feedback if "specialization" in f]
    error_feedback = [f for f in all_feedback if "error_type" in f]
    
    return {
        "total_feedback": len(all_feedback),
        "average_rating": avg_rating,
        "field_recommendations_count": len(field_feedback),
        "specialization_recommendations_count": len(specialization_feedback),
        "error_feedback_count": len(error_feedback)
    }

def get_user_specific_feedback(user_id):
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
    
    # Load from the main feedback.json file first
    main_feedback_file = os.path.join(feedback_dir, 'feedback.json')
    if os.path.exists(main_feedback_file):
        try:
            with open(main_feedback_file, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict) and "feedback" in data:
                    all_feedback.extend(data["feedback"])
        except json.JSONDecodeError:
            pass
    
    # Process all individual feedback files
    for filename in os.listdir(feedback_dir):
        if filename.endswith('.json') and filename != 'feedback.json':
            file_path = os.path.join(feedback_dir, filename)
            with open(file_path, 'r') as f:
                try:
                    feedback = json.load(f)
                    if isinstance(feedback, list):
                        all_feedback.extend(feedback)
                    else:
                        all_feedback.append(feedback)
                except json.JSONDecodeError:
                    pass
    
    return all_feedback 