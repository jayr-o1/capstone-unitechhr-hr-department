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

def get_user_feedback(recommendations, user_id=None, skills=None, experience=None):
    """
    Gathers user feedback on recommendations and stores it for future improvement.
    
    Args:
        recommendations (dict): The recommendations to get feedback on
        user_id (str, optional): User ID for tracking feedback
        skills (str, optional): User's skills (if already available)
        experience (str, optional): User's experience (if already available)
        
    Returns:
        str: The user_id used or created
    """
    print("\nWe'd like your feedback to improve future recommendations:")
    
    # Show the recommendations
    print(f"Field: {recommendations['Recommended Field']} (Confidence: {recommendations['Field Confidence']}%)")
    for i, path in enumerate(recommendations["Top 3 Career Paths"], 1):
        print(f"{i}. {path}")
    
    # Get selected path
    selected_idx = input("\nWhich career path interests you the most? (1-3, or 0 if none): ")
    selected_path = None
    if selected_idx.isdigit() and 1 <= int(selected_idx) <= 3:
        selected_path = recommendations["Top 3 Career Paths"][int(selected_idx) - 1]
    
    # Get rating
    rating = input("On a scale of 1-5, how helpful were these recommendations? ")
    if not rating.isdigit():
        rating = 0
    else:
        rating = int(rating)
    
    # Get comments
    comments = input("Any additional feedback? (optional): ")
    
    # Store the feedback
    feedback = {
        "selected_path": selected_path,
        "rating": rating,
        "comments": comments
    }
    
    return store_user_feedback(user_id, skills, experience, recommendations, feedback)

def store_user_feedback(user_id, skills, experience, recommendations, feedback):
    """
    Stores user feedback about recommendations for future improvements.
    
    Args:
        user_id (str): Unique identifier for the user
        skills (str): User's skills
        experience (str): User's experience
        recommendations (dict): The recommendations provided to the user
        feedback (dict): User feedback with format {"selected_path": str, "rating": int, "comments": str}
        
    Returns:
        str: The user ID (generated if not provided)
    """
    if not user_id:
        user_id = str(uuid.uuid4())
    
    feedback_db = load_feedback_db()
    
    # Store the feedback entry
    feedback_entry = {
        "user_id": user_id,
        "timestamp": datetime.now().isoformat(),
        "skills": skills,
        "experience": experience,
        "recommendations": recommendations,
        "feedback": feedback
    }
    
    feedback_db["feedback_entries"].append(feedback_entry)
    
    # If user rated the recommendation highly or provided a preferred path,
    # store it as an improved recommendation for this user
    if feedback.get("rating", 0) >= 4 or feedback.get("selected_path"):
        # Create improved recommendation based on user feedback
        improved_rec = recommendations.copy()
        
        # If user selected a specific path, prioritize it
        if feedback.get("selected_path"):
            selected_path = feedback["selected_path"]
            # Find the selected path and move it to the top if it exists
            if selected_path in improved_rec["Top 3 Career Paths"]:
                idx = improved_rec["Top 3 Career Paths"].index(selected_path)
                
                # Move the selected path to the top
                for key in ["Top 3 Career Paths", "Required Skills", "Confidence Percentages", 
                           "Lacking Skills", "Training Recommendations"]:
                    if idx > 0 and len(improved_rec[key]) > idx:
                        improved_rec[key][0], improved_rec[key][idx] = improved_rec[key][idx], improved_rec[key][0]
        
        # Store the improved recommendation
        feedback_db["improved_recommendations"][user_id] = {
            "skills": skills,
            "experience": experience,
            "recommendation": improved_rec,
            "last_updated": datetime.now().isoformat()
        }
    
    save_feedback_db(feedback_db)
    return user_id

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