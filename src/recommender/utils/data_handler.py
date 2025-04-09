import os
import json
import numpy as np
import pandas as pd

def load_feedback_db():
    """
    Load the feedback database from the JSON file.
    
    Returns:
        dict: The feedback database
    """
    try:
        # First try to load mock feedback data
        mock_feedback_path = os.path.join('src', 'recommender', 'data', 'mock_feedback.json')
        if os.path.exists(mock_feedback_path):
            with open(mock_feedback_path, 'r') as f:
                return json.load(f)
        
        # Fall back to regular feedback database
        feedback_path = os.path.join('data', 'feedback.json')
        if not os.path.exists(feedback_path):
            # Create an empty feedback database if it doesn't exist
            feedback_db = {"feedback_entries": []}
            save_feedback_db(feedback_db)
            return feedback_db
        
        with open(feedback_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading feedback database: {e}")
        return {"feedback_entries": []}

def save_feedback_db(feedback_db):
    """
    Save the feedback database to the JSON file.
    
    Args:
        feedback_db (dict): The feedback database to save
    """
    try:
        feedback_path = os.path.join('data', 'feedback.json')
        os.makedirs(os.path.dirname(feedback_path), exist_ok=True)
        with open(feedback_path, 'w') as f:
            json.dump(feedback_db, f, indent=4)
    except Exception as e:
        print(f"Error saving feedback database: {e}")

def process_feedback_data(feedback_data):
    """
    Process feedback data into a format suitable for model training.
    
    Args:
        feedback_data (dict): The feedback database
        
    Returns:
        tuple: (X, y) where X is the feature matrix and y is the target vector
    """
    features = []
    targets = []
    
    for entry in feedback_data.get("feedback_entries", []):
        # Extract features from the entry
        skills = entry.get("skills", "")
        experience = entry.get("experience", "")
        
        # Skip entries with empty skills or experience
        if not skills or not experience:
            continue
            
        # Extract numeric experience value with error handling
        try:
            # Remove "+" and "years" for consistent extraction
            exp_value = experience.replace("+", "").replace("years", "").strip()
            # Convert to numeric
            exp_numeric = float(exp_value)
        except (ValueError, TypeError):
            # Default to 0 if conversion fails
            exp_numeric = 0
        
        # Combine features
        feature = {
            "skills": skills,
            "experience": exp_numeric  # Store as numeric value
        }
        
        # Get the target (selected path from feedback)
        feedback_info = entry.get("feedback", {})
        selected_path = feedback_info.get("selected_path", "")
        
        # If no selected path, try to get the recommended field
        if not selected_path and "recommendations" in entry:
            recommendations = entry.get("recommendations", {})
            selected_path = recommendations.get("Recommended Field", "")
        
        if selected_path:  # Only include entries with a valid target
            features.append(feature)
            targets.append(selected_path)
    
    # Convert to DataFrame for easier manipulation
    if features:
        df_features = pd.DataFrame(features)
        
        # Check for and handle NaN values
        if df_features.isna().any().any():
            print(f"Warning: Found {df_features.isna().sum().sum()} missing values in features, filling with defaults")
            
            # Fill NaN values in skills with empty string
            if 'skills' in df_features.columns:
                df_features['skills'].fillna("", inplace=True)
                
            # Fill NaN values in experience with median or 0
            if 'experience' in df_features.columns:
                if not df_features['experience'].isna().all():
                    median_experience = df_features['experience'].median()
                    df_features['experience'].fillna(median_experience, inplace=True)
                else:
                    df_features['experience'].fillna(0, inplace=True)
        
        # Convert back to list of dictionaries
        features = df_features.to_dict('records')
    
    return features, targets

if __name__ == "__main__":
    # Test the data handler functions
    print("Loading feedback database...")
    feedback_db = load_feedback_db()
    
    num_entries = len(feedback_db.get("feedback_entries", []))
    print(f"Loaded {num_entries} feedback entries")
    
    print("\nProcessing feedback data...")
    features, targets = process_feedback_data(feedback_db)
    print(f"Processed {len(features)} valid entries with features and targets")
    
    if features:
        # Display sample features
        print("\nSample feature entry:")
        print(features[0])
        
        # Count unique targets
        unique_targets = set(targets)
        print(f"\nNumber of unique career paths: {len(unique_targets)}")
        print("Sample career paths:")
        for path in list(unique_targets)[:5]:  # Show first 5 paths
            print(f"- {path}") 