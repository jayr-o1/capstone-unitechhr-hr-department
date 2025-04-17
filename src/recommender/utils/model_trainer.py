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
import difflib

# Import utilities
from .data_loader import load_synthetic_employee_data, load_synthetic_career_path_data

# Try to import data_manager if available
try:
    from .data_manager import load_specialization_skills
except ImportError:
    # If not available, define a stub function
    def load_specialization_skills():
        return {}

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
    """
    Load career fields dictionary.
    This function no longer tries to import from recommender.py and directly uses its own dictionary.
    """
    # Return a minimal default dictionary
    return {
        "Computer Science": {
            "roles": [
                "Software Engineer", "Data Scientist", "Machine Learning Engineer",
                "Cybersecurity Analyst", "Cloud Architect", "UI/UX Designer", 
                "AI Research Scientist", "Full-Stack Developer"
            ],
            "skills": [
                "Python", "Java", "C++", "JavaScript", "SQL", 
                "Machine Learning", "Cloud Computing", "Web Development"
            ]
        },
        "Marketing": {
            "roles": [
                "Digital Marketing Specialist", "Brand Manager", "Market Research Analyst",
                "Content Strategist", "Social Media Manager"
            ],
            "skills": [
                "Social Media Marketing", "SEO", "Content Marketing",
                "Data Analytics", "Brand Management", "Market Research"
            ]
        },
        "Finance": {
            "roles": [
                "Investment Banker", "Portfolio Manager", "Risk Manager",
                "Financial Advisor"
            ],
            "skills": [
                "Financial Modeling", "Valuation", "Risk Management",
                "Market Analysis", "Financial Research"
            ]
        }
    }

def prepare_features(data, target):
    """
    Prepare features for training with advanced text preprocessing
    """
    # Find the skills column - could be 'Skills' (employee data) or 'Required Skills' (career path data)
    skills_column = None
    if 'Skills' in data.columns:
        skills_column = 'Skills'
    elif 'Required Skills' in data.columns:
        skills_column = 'Required Skills'
    else:
        raise ValueError(f"No skills column found in data. Available columns: {data.columns.tolist()}")
    
    if target not in data.columns:
        raise ValueError(f"Target column '{target}' not found in data. Available columns: {data.columns.tolist()}")
    
    # Extract features and target
    X = data[skills_column].fillna('')
    y = data[target].fillna('')
    
    # Remove empty targets and skills
    valid = (y != '') & (X != '')
    return X[valid], y[valid]

def identify_popular_specializations(data, threshold=5):
    """
    Identify popular specializations that have enough training examples.
    
    Args:
        data: DataFrame containing training data
        threshold: Minimum number of examples needed to be considered popular
        
    Returns:
        dict: Dictionary mapping fields to their popular specializations
    """
    # Group by field and specialization to count occurrences
    counts = data.groupby(['Field', 'Specialization']).size().reset_index(name='count')
    
    # Filter to specializations that have at least threshold examples
    popular = counts[counts['count'] >= threshold]
    
    # Create a dictionary mapping fields to their popular specializations
    result = {}
    for field, group in popular.groupby('Field'):
        result[field] = group['Specialization'].tolist()
        
    return result

def filter_to_popular_specializations(data, popular_specs=None, min_examples=5):
    """
    Filter dataset to include only popular specializations with sufficient training examples.
    
    Args:
        data: DataFrame containing training data
        popular_specs: Optional pre-defined dictionary of popular specializations
        min_examples: Minimum examples needed if popular_specs not provided
        
    Returns:
        DataFrame: Filtered dataset with only popular specializations
    """
    if popular_specs is None:
        popular_specs = identify_popular_specializations(data, min_examples)
    
    # If no popular specializations were found or all are empty, return original data
    if not popular_specs or all(len(specs) == 0 for specs in popular_specs.values()):
        print(f"No popular specializations found with threshold {min_examples}. Using all data.")
        return data
    
    # Create a mask for rows to keep
    mask = pd.Series(False, index=data.index)
    
    # Include rows where the field+specialization combination is in our popular list
    for field, specializations in popular_specs.items():
        if specializations:  # Only if we have specializations for this field
            field_mask = (data['Field'] == field) & (data['Specialization'].isin(specializations))
            mask = mask | field_mask
    
    # Filter the data
    filtered_data = data[mask].copy()
    
    # If filtering resulted in too little data, return the original
    if len(filtered_data) < 50 or len(filtered_data) < 0.1 * len(data):
        print(f"Filtered data too small ({len(filtered_data)} rows). Using all {len(data)} rows instead.")
        return data
        
    print(f"Filtered from {len(data)} to {len(filtered_data)} examples (focusing on popular specializations)")
    return filtered_data

def train_enhanced_model(X, y, verbose=False):
    """
    Train a model with enhanced feature extraction and parameter tuning
    
    Args:
        X: Series or array of skill strings
        y: Series or array of target labels
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
        print(f"Extracted {X_tfidf.shape[1]} features from skills text")
    
    # Choose appropriate n_estimators based on dataset size
    n_trees = min(200, max(100, int(len(X) / 10)))
    
    # Create RandomForest with improved parameters
    model = RandomForestClassifier(
        n_estimators=n_trees,
        max_depth=None,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features='sqrt',
        bootstrap=True,
        class_weight='balanced',
        random_state=42
    )
    
    if verbose:
        print(f"Training RandomForest with {n_trees} trees...")
    
    # Train the model
    model.fit(X_tfidf, y)
    
    # Get training accuracy
    y_pred = model.predict(X_tfidf)
    accuracy = accuracy_score(y, y_pred)
    
    if verbose:
        print(f"Model training completed with accuracy: {accuracy:.4f}")
        
        # Show class distribution
        class_counts = Counter(y)
        total = sum(class_counts.values())
        print("\nClass distribution:")
        for cls, count in class_counts.most_common():
            percentage = (count / total) * 100
            print(f"  {cls}: {count} examples ({percentage:.1f}%)")
    
    return model, tfidf, accuracy

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
    Predict field based on skills.
    
    Args:
        skills_str (str): Comma-separated list of skills
        components (dict): Model components
        
    Returns:
        dict: Prediction results with field and confidence
    """
    try:
        # Extract model components
        field_model = components.get('field_model')
        field_vectorizer = components.get('field_vectorizer')
        
        if field_model is None or field_vectorizer is None:
            # Missing required components
            print("Missing field model components")
            return {
                'field': "Technology",  # Default fallback field
                'confidence': 0.3,
                'error': "Missing model components"
            }
        
        # Convert skills to features
        X = field_vectorizer.transform([skills_str])
        
        # Make prediction
        field = field_model.predict(X)[0]
        
        # Get prediction probabilities
        proba = field_model.predict_proba(X)[0]
        confidence = max(proba)
        
        # Get alternate fields as the top 3 predicted fields
        predicted_classes = field_model.classes_
        sorted_indices = np.argsort(proba)[::-1]  # Sort in descending order
        alternate_fields = [predicted_classes[i] for i in sorted_indices[1:4]]  # Next 3 fields after the top one
        
        return {
            'field': field,
            'confidence': float(confidence),
            'alternate_fields': alternate_fields
        }
    except Exception as e:
        # Fallback to default
        print(f"Error in field prediction: {str(e)}")
        return {
            'field': "Technology",  # Default fallback field
            'confidence': 0.2,
            'error': str(e)
        }

def predict_specialization(skills_str, field, components):
    """
    Predict specialization within a field based on skills.
    
    Args:
        skills_str (str): Comma-separated list of skills
        field (str): The field to predict specialization within
        components (dict): Model components
        
    Returns:
        dict: Prediction results with specialization and confidence
    """
    try:
        # First, check if we have a dedicated specialization matcher
        if 'specialization_matcher' in components and 'specialization_vectorizer' in components:
            try:
                # This is the new specialization matcher trained specifically on specialization_skills.json
                model = components['specialization_matcher']
                vectorizer = components['specialization_vectorizer']
                
                # Transform input skills
                X = vectorizer.transform([skills_str])
                
                # Get prediction and probabilities
                prediction = model.predict(X)[0]
                probas = model.predict_proba(X)[0]
                
                # Get class indices sorted by probability
                classes = model.classes_
                class_probas = dict(zip(classes, probas))
                
                # Get top specializations
                top_specs = []
                for spec, prob in sorted(class_probas.items(), key=lambda x: x[1], reverse=True)[:5]:
                    top_specs.append({
                        'specialization': spec,
                        'confidence': float(prob)
                    })
                
                return {
                    'specialization': prediction,
                    'confidence': float(class_probas[prediction]),
                    'top_specializations': top_specs
                }
            except Exception as e:
                print(f"Error using specialization matcher: {str(e)}")
                # Fall back to traditional method below
                pass
                
        # Traditional field-specific specialization prediction
        # Get the specialization encoder and model for this field
        if field not in components.get('specialization_encoders', {}):
            # If this field doesn't have a specific encoder, try to find the closest match
            field_options = list(components.get('specialization_encoders', {}).keys())
            if not field_options:
                return {
                    'specialization': f"{field} Specialist",
                    'confidence': 0.5
                }
            
            # Find closest matching field
            field = find_closest_match(field, field_options)
        
        # Get the encoder and model
        encoder = components['specialization_encoders'].get(field)
        model = components['specialization_models'].get(field)
        vectorizer = components['specialization_vectorizers'].get(field)
        
        if not encoder or not model or not vectorizer:
            return {
                'specialization': f"{field} Specialist",
                'confidence': 0.5
            }
        
        # Transform input
        X = vectorizer.transform([skills_str])
        
        # Get prediction
        prediction_idx = model.predict(X)[0]
        
        # Get probabilities
        probas = model.predict_proba(X)[0]
        confidence = probas[prediction_idx]
        
        # Decode specialization name
        if hasattr(encoder, 'inverse_transform'):
            specialization = encoder.inverse_transform([prediction_idx])[0]
        else:
            # Fallback for LabelEncoder
            specialization = encoder.classes_[prediction_idx]
        
        # Get alternate specializations
        alternate_specializations = []
        if hasattr(encoder, 'classes_'):
            # Get top N predictions
            top_n = 3
            top_indices = probas.argsort()[-top_n:][::-1]
            
            for idx in top_indices:
                if idx != prediction_idx:  # Skip the primary prediction
                    alt_spec = encoder.classes_[idx]
                    alt_confidence = probas[idx]
                    alternate_specializations.append({
                        'specialization': alt_spec,
                        'confidence': float(alt_confidence)
                    })
        
        # Return full prediction results
        return {
            'specialization': specialization,
            'confidence': float(confidence),
            'alternate_specializations': alternate_specializations
        }
    except Exception as e:
        # If any error occurs, return a default response
        print(f"Error predicting specialization: {str(e)}")
        return {
            'specialization': f"{field} Specialist",
            'confidence': 0.5
        }

def load_specialization_skills():
    """
    Load specialization skills from JSON file.
    """
    skills_file_path = get_adjusted_path("data/specialization_skills.json")
    try:
        with open(skills_file_path, 'r') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading specialization skills from {skills_file_path}: {str(e)}")
        return {}

def calculate_skill_match_percentage(user_skills_str, specialization, specialization_skills=None):
    """
    Calculate the percentage of specialization skills that match the user's skills.
    
    Args:
        user_skills_str (str): Comma-separated list of user skills
        specialization (str): Target specialization
        specialization_skills (dict, optional): Dictionary of specialization skills
        
    Returns:
        float: Percentage of matched skills (0.0 to 1.0)
    """
    # Parse user skills
    user_skills = [skill.strip().lower() for skill in user_skills_str.split(',') if skill.strip()]
    
    # Load specialization skills if not provided
    if not specialization_skills:
        specialization_skills = load_specialization_skills()
    
    # If specialization not found in our data, return 0
    if specialization not in specialization_skills:
        return 0.0
    
    # Get required skills for this specialization
    required_skills = [skill.lower() for skill in specialization_skills[specialization]]
    
    if not required_skills:
        return 0.0
    
    # Calculate matches
    matches = 0
    for skill in user_skills:
        # Direct match
        if skill in required_skills:
            matches += 1
            continue
            
        # Check for partial or related matches
        for req_skill in required_skills:
            if are_skills_related(skill, req_skill):
                matches += 0.5  # Give partial credit for related skills
                break
    
    # Calculate match percentage
    match_percentage = min(1.0, matches / len(required_skills))
    
    return match_percentage

def identify_missing_skills(skills_str, specialization, components):
    """
    Identify missing skills for a specific specialization using model data.
    
    Args:
        skills_str (str): Comma-separated list of skills
        specialization (str): Target specialization
        components (dict): Model components
        
    Returns:
        dict: Dictionary with missing skills and recommendations
    """
    try:
        # Parse user skills
        user_skills = [skill.strip().lower() for skill in skills_str.split(',') if skill.strip()]
        user_skills_set = set(user_skills)
        
        # Load specialization-specific skills from JSON file
        specialization_specific_skills = load_specialization_skills()
        
        # Calculate skill match percentage
        match_percentage = calculate_skill_match_percentage(skills_str, specialization, specialization_specific_skills)
        
        # Define common technology compound terms for better matching
        compound_skills = {
            "cloud computing": "Cloud Computing",
            "machine learning": "Machine Learning",
            "deep learning": "Deep Learning",
            "data science": "Data Science",
            "data analysis": "Data Analysis",
            "data analytics": "Data Analytics",
            "big data": "Big Data",
            "artificial intelligence": "Artificial Intelligence",
            "natural language processing": "Natural Language Processing",
            "computer vision": "Computer Vision",
            "web development": "Web Development",
            "mobile development": "Mobile Development",
            "game development": "Game Development",
            "software development": "Software Development",
            "api development": "API Development",
            "front end": "Front-end Development",
            "frontend": "Front-end Development",
            "back end": "Back-end Development", 
            "backend": "Back-end Development",
            "full stack": "Full-Stack Development",
            "fullstack": "Full-Stack Development",
            "devops": "DevOps",
            "ci cd": "CI/CD",
            "version control": "Version Control",
            "git": "Git",
            "docker": "Docker",
            "kubernetes": "Kubernetes",
            "database": "Database Management",
            "sql": "SQL",
            "nosql": "NoSQL",
            "ui ux": "UI/UX Design",
            "user interface": "UI/UX Design",
            "user experience": "UI/UX Design",
            "agile": "Agile Methodology",
            "scrum": "Scrum",
            "project management": "Project Management",
            "cyber security": "Cybersecurity",
            "cybersecurity": "Cybersecurity",
            "network security": "Network Security",
            "blockchain": "Blockchain",
            "cloud architecture": "Cloud Architecture",
            "aws": "AWS",
            "azure": "Microsoft Azure",
            "gcp": "Google Cloud Platform",
            "react": "React.js",
            "angular": "Angular",
            "vue": "Vue.js",
            "node": "Node.js",
            "express": "Express.js",
            "django": "Django",
            "flask": "Flask",
            "spring": "Spring Framework",
            "tensorflow": "TensorFlow",
            "pytorch": "PyTorch",
            "scikit learn": "Scikit-learn",
            "opencv": "OpenCV",
            "java": "Java",
            "python": "Python",
            "c#": "C#",
            "c++": "C++",
            "javascript": "JavaScript",
            "typescript": "TypeScript",
            "swift": "Swift",
            "kotlin": "Kotlin",
            "ruby": "Ruby",
            "go": "Go",
            "rust": "Rust",
            "php": "PHP",
            "html": "HTML",
            "css": "CSS",
            "sass": "SASS/SCSS",
            "scala": "Scala",
            "r language": "R",
            "embedded systems": "Embedded Systems",
            "iot": "IoT",
            "microservices": "Microservices Architecture",
            "restful api": "RESTful API",
            "graphql": "GraphQL",
            "test driven": "Test-Driven Development",
            "unit testing": "Unit Testing",
            "penetration testing": "Penetration Testing",
            "data modeling": "Data Modeling",
            "object oriented": "Object-Oriented Programming",
            "functional programming": "Functional Programming",
            "distributed systems": "Distributed Systems",
            "api gateway": "API Gateway",
            "serverless": "Serverless Architecture",
            "message queue": "Message Queuing",
            "etl": "ETL Processes",
            "data warehouse": "Data Warehousing",
            "data visualization": "Data Visualization",
            "power bi": "Power BI",
            "tableau": "Tableau",
            "unix": "Unix/Linux",
            "windows server": "Windows Server",
            "networking": "Computer Networking",
            "tcp ip": "TCP/IP",
            "system design": "System Design",
            "architecture design": "Architecture Design",
            "automation": "Automation",
            "shell scripting": "Shell Scripting",
            "bash": "Bash",
            "powershell": "PowerShell",
            "business intelligence": "Business Intelligence",
            "data mining": "Data Mining",
            "3d modeling": "3D Modeling",
            "unity": "Unity",
            "unreal": "Unreal Engine",
            "augmented reality": "Augmented Reality (AR)",
            "virtual reality": "Virtual Reality (VR)"
        }
        
        # Create additional mappings for skill matching
        skill_variations = {}
        for compound, standardized in compound_skills.items():
            skill_variations[standardized.lower()] = standardized
            skill_variations[compound] = standardized
            # Add variations without special chars
            clean_compound = compound.replace('.', '').replace('-', ' ').replace('/', ' ')
            if clean_compound != compound:
                skill_variations[clean_compound] = standardized
                
        # Standardize user skills
        standardized_user_skills = set()
        for skill in user_skills:
            # Check if this is a known skill variation
            if skill.lower() in skill_variations:
                standardized_user_skills.add(skill_variations[skill.lower()])
            else:
                standardized_user_skills.add(skill.title())  # Use title case for consistency
                
        # First check if we have specialization-specific skills defined in the JSON file
        required_skills = []
        if specialization in specialization_specific_skills:
            required_skills = [skill for skill in specialization_specific_skills[specialization]]
            
            # Calculate missing skills using the specialized skills JSON
            # Convert required skills to lowercase for case-insensitive comparison
            required_skills_lower = set(skill.lower() for skill in required_skills)
            
            # Find missing skills by comparing with standardized user skills
            missing_skills = []
            for skill in required_skills:
                # Check for exact match or variation match
                skill_lower = skill.lower()
                if (skill_lower not in [s.lower() for s in standardized_user_skills] and
                    not any(are_skills_related(skill_lower, user_skill.lower()) for user_skill in standardized_user_skills)):
                    missing_skills.append(skill)
                    
            # Sort missing skills by importance (assume earlier in the list = more important)
            # This preserves the original order from the JSON file
            missing_skills.sort(key=lambda x: required_skills.index(x) if x in required_skills else 999)
            
            # Limit to a reasonable number of recommendations
            if len(missing_skills) > 10:
                missing_skills = missing_skills[:10]
            
            return {
                'missing_skills': missing_skills,
                'required_skills': required_skills,
                'match_percentage': round(match_percentage * 100, 2),
                'source': 'specialization_skills_json'
            }
                    
        # If no specific skills found in JSON, fall back to model-based approach
        # ... rest of the existing function code ...
        
    except Exception as e:
        print(f"Error identifying missing skills: {str(e)}")
        return []

def are_skills_related(skill1, skill2):
    """
    Check if two skills are related (similar or variations of the same skill).
    
    Args:
        skill1 (str): First skill
        skill2 (str): Second skill
        
    Returns:
        bool: True if skills are related, False otherwise
    """
    # If either is a substring of the other, they're related
    if skill1 in skill2 or skill2 in skill1:
        return True
        
    # Check for common prefixes (at least 5 chars)
    if len(skill1) >= 5 and len(skill2) >= 5:
        common_prefix_len = 0
        for i in range(min(len(skill1), len(skill2))):
            if skill1[i] == skill2[i]:
                common_prefix_len += 1
            else:
                break
                
        if common_prefix_len >= 5:
            return True
            
    # Calculate string similarity
    similarity = difflib.SequenceMatcher(None, skill1, skill2).ratio()
    if similarity > 0.8:  # High similarity threshold
        return True
        
    return False

def recommend_career_path(skills_str, model_path=MODEL_PATH):
    """
    Recommend career path based on skills.
    
    Args:
        skills_str (str): Comma-separated list of skills
        model_path (str): Path to the model file
        
    Returns:
        dict: Recommendation results
    """
    try:
        # Load model components
        model_file = get_adjusted_path(model_path)
        if not os.path.exists(model_file):
            return {
                'status': 'error', 
                'message': f'Model file not found at {model_file}'
            }
        
        components = joblib.load(model_file)
        
        # Parse user skills
        user_skills = [skill.strip() for skill in skills_str.split(',') if skill.strip()]
    
        # Stage 1: Field Recommendation
        field_info = predict_field(skills_str, components)
        field = field_info['field']
    
        # Stage 2: Specialization Recommendation
        specialization_info = predict_specialization(skills_str, field, components)
        
        if isinstance(specialization_info, dict):
            specialization = specialization_info.get('specialization')
            spec_confidence = specialization_info.get('confidence', 0.7)
        else:
            # Handle legacy format (tuple of specialization and confidence)
            specialization = specialization_info[0] if isinstance(specialization_info, tuple) else specialization_info
            spec_confidence = specialization_info[1] if isinstance(specialization_info, tuple) else 0.7
    
        # Stage 3: Skill Gap Analysis
        missing_skills_info = identify_missing_skills(skills_str, specialization, components)
        
        if isinstance(missing_skills_info, dict):
            missing_skills = missing_skills_info.get('missing_skills', [])
        else:
            # Handle legacy format (set of skills)
            missing_skills = list(missing_skills_info) if missing_skills_info else []
        
        # Prepare the response
        return {
            'status': 'success',
            'recommended_field': field,
            'field_confidence': round(field_info.get('confidence', 0.7) * 100, 2),
            'recommended_specialization': specialization,
            'specialization_confidence': round(spec_confidence * 100, 2),
            'missing_skills': missing_skills,
            'existing_skills': user_skills,
            'model_version': components.get('version', '1.0'),
            'alternate_fields': field_info.get('alternate_fields', []),
            'alternate_specializations': specialization_info.get('top_specializations', [])
        }
    except Exception as e:
        print(f"Error in career path recommendation: {str(e)}")
        traceback.print_exc()
        return {
            'status': 'error',
            'message': str(e)
        }

def initial_model_training(verbose=True):
    """
    Perform initial model training using synthetic data.
        
    Returns:
        bool: True if training was successful, False otherwise
    """
    try:
        if verbose:
            print("Loading synthetic data for model training...")
            
        # Load the employee and career path data
        employee_data = load_synthetic_employee_data()
        career_path_data = load_synthetic_career_path_data()
        
        if employee_data is None or career_path_data is None:
            if verbose:
                print("Failed to load synthetic data. Please generate data first.")
            return False
            
        if verbose:
            print(f"Loaded {len(employee_data)} employee records and {len(career_path_data)} career path records")
        
        # Identify popular specializations
        popular_specs = identify_popular_specializations(career_path_data, threshold=5)
        
        if verbose:
            print("\nPopular specializations by field:")
            for field, specs in popular_specs.items():
                print(f"  {field}: {len(specs)} specializations")
                for spec in specs[:5]:  # Show first 5 for each field
                    print(f"    - {spec}")
                if len(specs) > 5:
                    print(f"    - ... and {len(specs)-5} more")
        
        # Filter data to focus on popular specializations
        filtered_career_data = filter_to_popular_specializations(career_path_data, popular_specs)
        
        # Train field prediction model
        if verbose:
            print("\n=== Training Field Prediction Model ===")
        
        X_field, y_field = prepare_features(filtered_career_data, 'Field')
        field_model, field_vectorizer, field_accuracy = train_enhanced_model(X_field, y_field, verbose=verbose)
        
        # Train specialization prediction model - one model per field
        if verbose:
            print("\n=== Training Specialization Prediction Models ===")
            
        specialization_models = {}
        specialization_vectorizers = {}
        specialization_accuracies = {}
        
        # Get all unique fields
        fields = filtered_career_data['Field'].unique()
        
        for field in fields:
            if verbose:
                print(f"\nTraining model for field: {field}")
                
            # Filter data for this field
            field_data = filtered_career_data[filtered_career_data['Field'] == field]
            
            # Check if we have enough data
            if len(field_data) < 5:
                if verbose:
                    print(f"Not enough data for field {field}. Skipping...")
                continue
                
            # Prepare features
            X_spec, y_spec = prepare_features(field_data, 'Specialization')
            
            if len(X_spec) < 5:
                if verbose:
                    print(f"Not enough valid data for field {field}. Skipping...")
                continue
            
            # Train the model
            spec_model, spec_vectorizer, spec_accuracy = train_enhanced_model(
                X_spec, y_spec, verbose=verbose
            )
            
            # Store the model
            specialization_models[field] = spec_model
            specialization_vectorizers[field] = spec_vectorizer
            specialization_accuracies[field] = spec_accuracy
        
        # Prepare to create the final model components
        model_components = {
            'field_model': field_model,
            'field_vectorizer': field_vectorizer,
            'field_accuracy': field_accuracy,
            'specialization_models': specialization_models,
            'specialization_vectorizers': specialization_vectorizers,
            'specialization_accuracies': specialization_accuracies,
            'popular_specializations': popular_specs,
            'trained_at': datetime.now().isoformat()
        }
        
        # Save the model
        if save_model_components(model_components, verbose):
            if verbose:
                print("\n=== Model Training Complete ===")
                print(f"Field prediction accuracy: {field_accuracy:.4f}")
                
                # Calculate average specialization accuracy
                if specialization_accuracies:
                    avg_spec_accuracy = sum(specialization_accuracies.values()) / len(specialization_accuracies)
                    print(f"Average specialization prediction accuracy: {avg_spec_accuracy:.4f}")
                    
                print(f"Model saved to {MODEL_PATH}")
            
            return True
        else:
            if verbose:
                print("Failed to save model components.")
            return False
        
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