"""
Model training and retraining module for the career recommender system.
This module handles initial model training and retraining based on user feedback.
"""

import os
import sys
import traceback
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.pipeline import Pipeline
from collections import Counter
import json
import pickle
import shutil

# Import utilities
from .feedback_handler import load_feedback_db, get_all_feedback
from .data_loader import load_synthetic_employee_data, load_synthetic_career_path_data

# Define paths
MODEL_PATH = "models/career_path_recommendation_model.pkl"
EMPLOYEE_DATA_PATH = "data/synthetic_employee_data.csv"
CAREER_PATH_DATA_PATH = "data/synthetic_career_path_data.csv"
MODEL_HISTORY_DIR = "models/history"

# Adjust paths for when running from different directories
def get_adjusted_path(path):
    """Check if path exists, if not try to find it relative to the script location."""
    if os.path.exists(path):
        return path
    
    # Try relative to this file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    adjusted = os.path.join(base_dir, path)
    if os.path.exists(adjusted):
        return adjusted
    
    # Try without data/ prefix
    filename = os.path.basename(path)
    adjusted = os.path.join(base_dir, "data", filename)
    if os.path.exists(adjusted):
        return adjusted
    
    # Could not find the file, return original path
    return path

def report_progress(message, percent=None):
    """Report progress for long-running operations."""
    # In a real implementation, this might update a progress bar
    # or send a notification to a user interface
    if percent is not None:
        print(f"{message} - {percent}% complete")
    else:
        print(message)

def ensure_directory_exists(directory_path):
    """Ensure that the directory exists, creating it if necessary."""
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)
        if not os.path.exists(directory_path):
            raise RuntimeError(f"Failed to create directory: {directory_path}")
    return directory_path

def save_model_components(model_components, verbose=False):
    """
    Save model components to disk, with backup.
    
    Args:
        model_components (dict): Dictionary containing model components.
        verbose (bool): If True, print progress messages.
        
    Returns:
        bool: True if saving was successful, False otherwise.
    """
    try:
        # First, ensure the directories exist
        ensure_directory_exists(os.path.dirname(MODEL_PATH))
        ensure_directory_exists(MODEL_HISTORY_DIR)
        
        # Update the timestamp if not already set
        if 'trained_at' not in model_components:
            model_components['trained_at'] = datetime.now().isoformat()
            
        # Create a backup of the existing model if it exists
        if os.path.exists(MODEL_PATH):
            # Get current timestamp for the backup filename
            timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S.%f")
            backup_path = os.path.join(MODEL_HISTORY_DIR, f"career_path_recommendation_model_backup_{timestamp}.pkl")
            
            # Copy the existing model to the backup location
            shutil.copy2(MODEL_PATH, backup_path)
            
            if verbose:
                print(f"Created backup of existing model at {backup_path}")
                
            # Also save metadata about the model for easier tracking
            metadata = {
                "original_model": MODEL_PATH,
                "backup_path": backup_path,
                "backup_time": timestamp,
                "trained_at": model_components.get('trained_at', 'Unknown'),
                "accuracy": model_components.get('accuracy', 0),
                "feedback_entries_used": model_components.get('feedback_entries_used', 0)
            }
            
            metadata_path = os.path.join(MODEL_HISTORY_DIR, "..", "model_metadata.json")
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
                
            if verbose:
                print(f"Saved model metadata to {metadata_path}")
        
        # Save the model components
        joblib.dump(model_components, MODEL_PATH)
        
        if verbose:
            print(f"Saved model components to {MODEL_PATH}")
            
        return True
    except Exception as e:
        if verbose:
            print(f"Error saving model components: {str(e)}")
            traceback.print_exc()
        return False

def load_career_fields():
    """Load career fields from recommender module."""
    try:
        from recommender import career_fields
        return career_fields
    except ImportError:
        # Fallback if direct import fails
        print("Direct import failed, trying with full path...")
        try:
            import sys
            import os
            # Get the parent directory path
            parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if parent_dir not in sys.path:
                sys.path.append(parent_dir)
            
            # Try import again
            from recommender import career_fields
            return career_fields
        except Exception as e:
            print(f"Error importing career_fields: {e}")
            raise

def prepare_features(data, target):
    """
    Prepare features for training with advanced text preprocessing
    """
    # Ensure data has the required columns
    if 'Skills' not in data.columns:
        raise ValueError(f"Skills column not found in data. Available columns: {data.columns.tolist()}")
    
    if target not in data.columns:
        raise ValueError(f"Target column '{target}' not found in data. Available columns: {data.columns.tolist()}")
    
    # Extract features and target
    X = data['Skills'].fillna('')
    y = data[target].fillna('')
    
    # Remove empty targets and skills
    valid = (y != '') & (X != '')
    return X[valid], y[valid]

def train_enhanced_model(X, y, experience=None, verbose=False):
    """
    Train a model with enhanced feature extraction and parameter tuning
    
    Args:
        X: Series or array of skill strings
        y: Series or array of target labels
        experience: Series or array of experience values (optional)
        verbose: Whether to print progress messages
    """
    if verbose:
        print("Starting enhanced model training...")
    
    # Create TF-IDF vectorizer with improved parameters
    tfidf = TfidfVectorizer(
        max_features=150,       # Increased features
        min_df=2,               # Minimum document frequency
        max_df=0.9,             # Maximum document frequency
        ngram_range=(1, 2),     # Include bigrams
        stop_words='english'    # Remove common English stop words
    )
    X_tfidf = tfidf.fit_transform(X)
    
    if verbose:
        print(f"TF-IDF created {X_tfidf.shape[1]} features")
    
    # Add experience as a feature if provided
    if experience is not None:
        X_exp = np.array(experience).reshape(-1, 1)
        X_combined = np.hstack([X_tfidf.toarray(), X_exp])
    else:
        X_combined = X_tfidf.toarray()
        
    # Apply PCA for dimensionality reduction
    n_components = min(X_combined.shape[0]-1, X_combined.shape[1]-1, 50)
    pca = PCA(n_components=n_components)
    X_pca = pca.fit_transform(X_combined)
    
    if verbose:
        explained_variance = pca.explained_variance_ratio_.sum() * 100
        print(f"PCA reduced dimensions to {n_components} components, explaining {explained_variance:.2f}% of variance")
    
    # Encode target labels
    encoder = LabelEncoder()
    y_encoded = encoder.fit_transform(y)
    
    # Balance class weights for imbalanced datasets
    class_counts = np.bincount(y_encoded)
    if max(class_counts) / min(class_counts) > 5:
        # Imbalanced dataset
        if verbose:
            print("Imbalanced classes detected, using balanced class weights")
        class_weight = 'balanced'
    else:
        class_weight = None
    
    # Train RandomForestClassifier with improved parameters
    model = RandomForestClassifier(
        n_estimators=100, 
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight=class_weight,
        random_state=42
    )
    model.fit(X_pca, y_encoded)
    
    if verbose:
        print("Model training complete")
    
    return model, tfidf, pca, encoder

def cross_validate_model(X, y, folds=5):
    """
    Perform cross-validation to evaluate model quality
    """
    # Create a pipeline with all preprocessing steps
    tfidf = TfidfVectorizer(max_features=150, ngram_range=(1, 2))
    
    # Use simple model for cross-validation to save time
    pipeline = Pipeline([
        ('tfidf', tfidf),
        ('classifier', RandomForestClassifier(n_estimators=50, random_state=42))
    ])
    
    # Convert y to numpy array if it's a pandas Series
    if isinstance(y, pd.Series):
        y = y.values
    
    # Perform stratified k-fold cross-validation
    try:
        cv = StratifiedKFold(n_splits=min(folds, len(set(y))), shuffle=True, random_state=42)
        scores = cross_val_score(pipeline, X, y, cv=cv, scoring='accuracy')
        return scores
    except Exception as e:
        print(f"Cross-validation error: {e}")
        return [0.0]  # Return dummy score on error

def predict_field(skills_str, components):
    """
    Predict career field based on skills with confidence score
    """
    X = components['field_tfidf'].transform([skills_str])
    X_pca = components['field_pca'].transform(X.toarray())
    
    try:
        # Try to get probability scores
        proba = components['field_model'].predict_proba(X_pca)[0]
        pred_idx = np.argmax(proba)
        confidence = proba[pred_idx]
        
        # Get predicted field
        field = components['field_encoder'].inverse_transform([pred_idx])[0]
        
        # Return field and confidence
        return field, confidence
    except:
        # Fallback to basic prediction without confidence
        pred_idx = components['field_model'].predict(X_pca)[0]
        field = components['field_encoder'].inverse_transform([pred_idx])[0]
        return field, 0.7  # Default confidence

def predict_specialization(skills_str, field, components):
    """
    Predict specialization based on skills and field context with balanced handling
    for all specializations.
    """
    X = components['specialization_tfidf'].transform([skills_str])
    X_pca = components['specialization_pca'].transform(X.toarray())
    
    # Get field-specific specializations
    field_specializations = components.get('field_to_specializations', {}).get(field, [])
    
    try:
        # Get probability scores for all specializations
        proba = components['specialization_model'].predict_proba(X_pca)[0]
        
        # Get all specializations with their probabilities
        specialization_probs = {
            components['specialization_encoder'].inverse_transform([i])[0]: proba[i]
            for i in range(len(proba))
        }
        
        # Prioritize specializations from the predicted field
        if field_specializations:
            # Boost scores for specializations in the predicted field
            for spec in field_specializations:
                if spec in specialization_probs:
                    specialization_probs[spec] *= 1.2  # 20% boost for field-specific specializations
        
        # Get top specialization
        top_spec = max(specialization_probs.items(), key=lambda x: x[1])
        return top_spec[0], top_spec[1]
    except:
        # Fallback to basic prediction
        pred_idx = components['specialization_model'].predict(X_pca)[0]
        spec = components['specialization_encoder'].inverse_transform([pred_idx])[0]
        return spec, 0.7  # Default confidence

def identify_missing_skills(skills_str, specialization, components):
    """
    Identify skills needed for specialization that user doesn't have,
    with importance weighting for all specializations.
    """
    user_skills = set(skill.strip().lower() for skill in skills_str.split(','))
    
    # Get weighted skills for the specialization
    weighted_skills = components['specialization_skills'].get(specialization, {})
    
    if not weighted_skills:
        # If we don't have skills, return an empty set
        return set()
    
    # Sort skills by importance (weight)
    sorted_skills = sorted(weighted_skills.items(), key=lambda x: x[1], reverse=True)
    
    # Extract missing skills with their importance
    missing_skills_with_weight = [
        (skill, weight) for skill, weight in sorted_skills
        if skill.lower() not in user_skills
    ]
    
    # Convert to set of skills only (without weights)
    missing_skills = set(skill for skill, _ in missing_skills_with_weight)
    
    return missing_skills

def recommend_career_path(skills_str, model_path=MODEL_PATH):
    """
    Complete three-stage career recommendation with confidence scores:
    1. Recommend field with confidence score
    2. Recommend specialization with confidence score
    3. Identify missing skills with importance levels
    """
    # Load model components
    components = joblib.load(model_path)
    
    # Stage 1: Field Recommendation
    field, field_confidence = predict_field(skills_str, components)
    
    # Stage 2: Specialization Recommendation
    specialization, spec_confidence = predict_specialization(skills_str, field, components)
    
    # Stage 3: Skill Gap Analysis
    missing_skills = identify_missing_skills(skills_str, specialization, components)
    
    # Get user's existing skills
    user_skills = [skill.strip() for skill in skills_str.split(',')]
    
    return {
        'recommended_field': field,
        'field_confidence': round(field_confidence * 100, 2),
        'recommended_specialization': specialization,
        'specialization_confidence': round(spec_confidence * 100, 2),
        'missing_skills': list(missing_skills),
        'existing_skills': user_skills,
        'model_version': components.get('version', '1.0')
    }

def initial_model_training(verbose=True):
    """
    Perform initial model training using synthetic data.
    
    Args:
        verbose (bool): If True, print progress messages
        
    Returns:
        bool: True if training was successful, False otherwise
    """
    try:
        # Load synthetic data
        employee_data = pd.read_csv(get_adjusted_path(EMPLOYEE_DATA_PATH))
        career_path_data = pd.read_csv(get_adjusted_path(CAREER_PATH_DATA_PATH))
        
        if verbose:
            print("Loading employee data...")
            print(f"Successfully loaded {len(employee_data)} records")
            print("Columns:", ", ".join(employee_data.columns))
            
            print("\nLoading career path data...")
            print(f"Successfully loaded {len(career_path_data)} career path records")
            print("Career path columns:", ", ".join(career_path_data.columns))
        
        # Create specialization to field mapping
        specialization_to_field = dict(zip(career_path_data['Specialization'], career_path_data['Field']))
        
        # Map Career Goal to Field and Specialization
        employee_data['Specialization'] = employee_data['Career Goal']
        employee_data['Field'] = employee_data['Career Goal'].map(specialization_to_field)
        
        # Remove rows with missing fields
        employee_data = employee_data.dropna(subset=['Field', 'Specialization'])
        
        if verbose:
            print(f"\nMapped {len(employee_data)} employee records to fields and specializations")
            print("Sample mappings:")
            sample = employee_data[['Career Goal', 'Field', 'Specialization']].head(3)
            print(sample)
        
        # Prepare field training data
        X_field, y_field = prepare_features(employee_data, 'Field')
        experience = employee_data['Years Experience'].fillna(0).astype(float)
        
        if verbose:
            print("\n=== Training Field Recommendation Model ===")
            print(f"Field training data shape: {len(X_field)} samples with {len(set(y_field))} unique fields")
        
        # Train field model
        field_model, field_tfidf, field_pca, field_encoder = train_enhanced_model(
            X_field, y_field, experience=experience, verbose=verbose
        )
        
        # Prepare specialization training data
        X_spec, y_spec = prepare_features(employee_data, 'Specialization')
        
        if verbose:
            print("\n=== Training Specialization Recommendation Model ===")
            print(f"Specialization training data shape: {len(X_spec)} samples with {len(set(y_spec))} unique specializations")
        
        # Train specialization model
        specialization_model, specialization_tfidf, specialization_pca, specialization_encoder = train_enhanced_model(
            X_spec, y_spec, experience=experience, verbose=verbose
        )
        
        # Create field to specializations mapping
        field_to_specializations = {}
        for spec, field in specialization_to_field.items():
            if field not in field_to_specializations:
                field_to_specializations[field] = []
            field_to_specializations[field].append(spec)
        
        # Create specialization skill profiles
        specialization_skills = {}
        for _, row in career_path_data.iterrows():
            skills = [s.strip() for s in row['Required Skills'].split(',')]
            specialization_skills[row['Specialization']] = skills
        
        # Save model components
        model_data = {
            'field_model': field_model,
            'field_tfidf': field_tfidf,
            'field_pca': field_pca,
            'field_encoder': field_encoder,
            'specialization_model': specialization_model,
            'specialization_tfidf': specialization_tfidf,
            'specialization_pca': specialization_pca,
            'specialization_encoder': specialization_encoder,
            'specialization_skills': specialization_skills,
            'field_to_specializations': field_to_specializations,
            'specialization_to_field': specialization_to_field,
            'trained_at': datetime.now().isoformat(),
            'training_data_shape': {
                'employees': len(employee_data),
                'career_paths': len(career_path_data)
            },
            'version': '2.0'
        }
        
        success = save_model_components(model_data, verbose=verbose)
        
        if success and verbose:
            print("\n=== Model Training Complete ===")
            print("Model training completed successfully!")
            
        return success
        
    except Exception as e:
        if verbose:
            print(f"Error during model training: {str(e)}")
            traceback.print_exc()
        return False

def create_minimal_dataset():
    """Create a minimal synthetic dataset for testing when no real data is available."""
    print("Creating minimal synthetic dataset for training...")
    
    # Create a simple dataset with a few fields and specializations
    employee_data = pd.DataFrame({
        'Employee ID': [f'EMP{i:03d}' for i in range(1, 21)],
        'Name': ['Test User ' + str(i) for i in range(1, 21)],
        'Age': [30 + i % 15 for i in range(1, 21)],
        'Years Experience': [5 + i % 10 for i in range(1, 21)],
        'Skills': [
            'Python, Data Analysis, Machine Learning' if i % 4 == 0 else
            'JavaScript, React, Web Development' if i % 4 == 1 else
            'Leadership, Project Management, Communication' if i % 4 == 2 else
            'Healthcare, Patient Care, Medical Knowledge' 
            for i in range(1, 21)
        ],
        'Career Goal': [
            'Data Scientist' if i % 4 == 0 else
            'Frontend Developer' if i % 4 == 1 else
            'Project Manager' if i % 4 == 2 else
            'Registered Nurse'
            for i in range(1, 21)
        ],
        'Current Role': [
            'Data Analyst' if i % 4 == 0 else
            'Web Developer' if i % 4 == 1 else
            'Team Lead' if i % 4 == 2 else
            'Nursing Assistant'
            for i in range(1, 21)
        ],
        'Field': [
            'Computer Science' if i % 4 == 0 else
            'Computer Science' if i % 4 == 1 else
            'Business' if i % 4 == 2 else
            'Healthcare'
            for i in range(1, 21)
        ],
        'Specialization': [
            'Data Scientist' if i % 4 == 0 else
            'Frontend Developer' if i % 4 == 1 else
            'Project Manager' if i % 4 == 2 else
            'Registered Nurse'
            for i in range(1, 21)
        ]
    })
    
    print(f"Created minimal dataset with {len(employee_data)} records")
    return employee_data

def fine_tune_specialization_mapping(specialization_to_field):
    """
    Fine-tune the specialization to field mapping with manual corrections
    for important specializations to ensure more accurate recommendations.
    
    Args:
        specialization_to_field (dict): Original mapping from specialization to field
        
    Returns:
        dict: Enhanced mapping with manual corrections
    """
    # Create a copy to avoid modifying the original
    enhanced_mapping = specialization_to_field.copy()
    
    # Define specific data science related specializations that should map to Computer Science
    data_science_specializations = [
        "Data Scientist", 
        "Data Analyst", 
        "Machine Learning Engineer",
        "Data Engineer",
        "Big Data Specialist",
        "Business Intelligence Analyst",
        "AI Research Scientist",
        "NLP Engineer",
        "Computer Vision Engineer"
    ]
    
    # Ensure data science specializations map to Computer Science
    for specialization in data_science_specializations:
        enhanced_mapping[specialization] = "Computer Science"
    
    # Other important specialization corrections
    specific_mappings = {
        # Software development specializations
        "Software Engineer": "Computer Science",
        "Frontend Developer": "Computer Science",
        "Backend Developer": "Computer Science",
        "Full-Stack Developer": "Computer Science",
        "Mobile App Developer": "Computer Science",
        "Game Developer": "Computer Science",
        
        # Business specializations
        "Project Manager": "Business",
        "Business Analyst": "Business",
        "Marketing Specialist": "Business",
        "Human Resources Specialist": "Business",
        
        # Healthcare specializations
        "Registered Nurse": "Healthcare",
        "Medical Doctor": "Healthcare",
        "Physical Therapist": "Healthcare",
        
        # Correct common misclassifications
        "Biotechnology": "Biology" 
    }
    
    # Apply specific mappings
    for specialization, field in specific_mappings.items():
        enhanced_mapping[specialization] = field
    
    return enhanced_mapping