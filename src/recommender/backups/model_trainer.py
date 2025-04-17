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
    Load career fields from recommender module or return a default dictionary.
    This function has been modified to work even if career_fields is removed from recommender.py.
    """
    try:
        # Try to import career_fields from recommender.py
        from recommender import career_fields
        return career_fields
    except ImportError:
        # Fallback if direct import fails
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
            print(f"Could not import career_fields: {e}")
            print("Using default career fields dictionary instead.")
            
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
    Predict specialization for a given field based on skills.
    
    Args:
        skills_str (str): Comma-separated list of skills
        field (str): The field to predict specialization for
        components (dict): Model components
        
    Returns:
        dict: Prediction results with specialization and confidence
    """
    try:
        # Get model and vectorizer for this field
        specialization_models = components.get('specialization_models', {})
        specialization_vectorizers = components.get('specialization_vectorizers', {})
        popular_specializations = components.get('popular_specializations', {})
        
        if field not in specialization_models or field not in specialization_vectorizers:
            # If we don't have a model for this field, return a default
            field_specs = popular_specializations.get(field, [])
            if field_specs:
                # Return the top 3 popular specializations for this field with decreasing confidence
                top_specs = field_specs[:min(3, len(field_specs))]
                
                specs_with_confidence = []
                for i, spec in enumerate(top_specs):
                    # Assign decreasing confidence scores: 0.5, 0.4, 0.3
                    confidence = 0.5 - (i * 0.1)
                    specs_with_confidence.append({
                        'specialization': spec,
                        'confidence': confidence
                    })
                
                # If we don't have 3, add generic ones
                while len(specs_with_confidence) < 3:
                    generic_spec = f"{field} Specialist {len(specs_with_confidence)}"
                    confidence = 0.3 - (len(specs_with_confidence) * 0.05)
                    specs_with_confidence.append({
                        'specialization': generic_spec,
                        'confidence': max(0.1, confidence)
                    })
                
                return {
                    'specialization': top_specs[0],
                    'confidence': 0.5,
                    'note': 'Using popular specialization default - no model available for this field',
                    'top_specializations': specs_with_confidence
                }
            
            # Generic fallback if no popular specializations
            return {
                'specialization': f"{field} Specialist",
                'confidence': 0.3,
                'note': 'Using generic default - no model available for this field',
                'top_specializations': [
                    {'specialization': f"{field} Specialist", 'confidence': 0.3},
                    {'specialization': f"{field} Analyst", 'confidence': 0.2},
                    {'specialization': f"{field} Associate", 'confidence': 0.1}
                ]
            }
            
        # Get the model and vectorizer
        model = specialization_models[field]
        vectorizer = specialization_vectorizers[field]
        
        # Preprocess the skills
        X = vectorizer.transform([skills_str])
        
        # Make prediction for top class
        specialization = model.predict(X)[0]
        
        # Get prediction probabilities for all classes
        proba = model.predict_proba(X)[0]
        
        # Get the class encoder
        encoder = components.get('specialization_encoders', {}).get(field)
        if encoder is None:
            # Fallback to default
            top_specializations = [
                {'specialization': specialization, 'confidence': float(max(proba))}
            ]
            
            # Add some popular specializations if available
            field_specs = popular_specializations.get(field, [])
            for i, spec in enumerate(field_specs[:2]):
                if spec != specialization:
                    top_specializations.append({
                        'specialization': spec,
                        'confidence': float(max(proba) * 0.8 - (i * 0.1))
                    })
        else:
            # Get the classes
            classes = encoder.classes_
            
            # Create list of (specialization, probability) tuples
            spec_probs = [(classes[i], float(p)) for i, p in enumerate(proba)]
            
            # Sort by probability in descending order
            spec_probs.sort(key=lambda x: x[1], reverse=True)
            
            # Take top 3 or less if fewer are available
            top_specializations = [
                {'specialization': spec, 'confidence': conf}
                for spec, conf in spec_probs[:min(3, len(spec_probs))]
            ]
        
        # If we have fewer than 3 specializations, add generic ones
        while len(top_specializations) < 3:
            generic_spec = f"{field} Specialist {len(top_specializations)}"
            # Base confidence on the lowest confidence in the list, or a default if list is empty
            base_confidence = 0.1
            if top_specializations:
                base_confidence = top_specializations[-1]['confidence'] * 0.7
            top_specializations.append({
                'specialization': generic_spec,
                'confidence': max(0.05, base_confidence)
            })
        
        return {
            'specialization': specialization,
            'confidence': float(max(proba)),
            'top_specializations': top_specializations
        }
    except Exception as e:
        # Fallback to default
        print(f"Error in specialization prediction: {str(e)}")
        return {
            'specialization': f"{field} Specialist",
            'confidence': 0.2,
            'error': str(e),
            'top_specializations': [
                {'specialization': f"{field} Specialist", 'confidence': 0.2},
                {'specialization': f"{field} Analyst", 'confidence': 0.15},
                {'specialization': f"{field} Associate", 'confidence': 0.1}
            ]
        }

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
        # First try to use the data_manager module
        specialization_specific_skills = load_specialization_skills()
        
        # As a fallback, try loading directly if data_manager failed
        if not specialization_specific_skills:
            skills_file_path = get_adjusted_path("data/specialization_skills.json")
            try:
                with open(skills_file_path, 'r') as file:
                    specialization_specific_skills = json.load(file)
            except Exception as e:
                print(f"Error loading specialization skills from {skills_file_path}: {str(e)}")
                # If the file doesn't exist or has errors, we'll use the backup method below
                pass
        
        # Get skill profiles from model components
        skill_profiles = components.get('specialization_skill_profiles', {})
        
        # Define common technology compound terms
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
        
        # First check if we have specialization-specific skills defined in the JSON file
        specialization_skills = []
        if specialization in specialization_specific_skills:
            specialization_skills = specialization_specific_skills[specialization]
        else:
            # Find skills for this specialization from the model data
            
            # Check if we have skill profile for this specialization
            if specialization in skill_profiles:
                # Get skill weights - higher weight means more important
                skill_weights = skill_profiles[specialization]
                
                # Convert to list of (skill, weight) tuples and sort by weight (descending)
                weighted_skills = [(skill, weight) for skill, weight in skill_weights.items()]
                weighted_skills.sort(key=lambda x: x[1], reverse=True)
                
                # Extract top skills (most important ones)
                specialization_skills = [skill for skill, _ in weighted_skills[:30]]
            
            # If no skill profile found, try to find which field this specialization belongs to
            if not specialization_skills:
                # Try to get field-specific skills from the fallback dictionary
                try:
                    career_fields = load_career_fields()
                    for field, data in career_fields.items():
                        if specialization in data.get('roles', []):
                            specialization_skills = data.get('skills', [])[:30]
                            break
                except Exception:
                    pass
                    
                # If still no skills, try to find which field this specialization belongs to from the specialization models
                if not specialization_skills:
                    specialization_field = None
                    specialization_encoders = components.get('specialization_encoders', {})
                    
                    for field, encoder in specialization_encoders.items():
                        if hasattr(encoder, 'classes_') and specialization in encoder.classes_:
                            specialization_field = field
                            break
                    
                    # If we found the field, get top skills for that field
                    if specialization_field:
                        # Get a list of all specializations in this field
                        field_specializations = set()
                        if specialization_field in specialization_encoders and hasattr(specialization_encoders[specialization_field], 'classes_'):
                            field_specializations = set(specialization_encoders[specialization_field].classes_)
                        
                        # Get all skill profiles for specializations in this field
                        field_skill_profiles = {
                            spec: profile for spec, profile in skill_profiles.items() 
                            if spec in field_specializations
                        }
                        
                        # Combine skill weights across all specializations in this field
                        combined_weights = {}
                        for profile in field_skill_profiles.values():
                            for skill, weight in profile.items():
                                combined_weights[skill] = combined_weights.get(skill, 0) + weight
                        
                        # Sort skills by combined weight
                        if combined_weights:
                            combined_skills = [(skill, weight) for skill, weight in combined_weights.items()]
                            combined_skills.sort(key=lambda x: x[1], reverse=True)
                            specialization_skills = [skill for skill, _ in combined_skills[:30]]
                
                # If we still don't have skills, use model's vocabulary
                if not specialization_skills:
                    vectorizers = components.get('specialization_vectorizers', {})
                    for field, vectorizer in vectorizers.items():
                        if hasattr(vectorizer, 'vocabulary_'):
                            # Get top feature names by their index (higher index = more important)
                            vocab = vectorizer.vocabulary_
                            top_features = sorted(vocab.items(), key=lambda x: x[1], reverse=True)[:50]
                            specialization_skills = [feature for feature, _ in top_features]
                            break
        
        # Process skills to identify compound terms if we're not using predefined skills
        if specialization not in specialization_specific_skills:
            processed_skills = []
            raw_tokens = []
            
            # First extract all individual words
            for skill in specialization_skills:
                tokens = skill.lower().split()
                raw_tokens.extend(tokens)
            
            # Look for compound skills in the raw tokens
            for i in range(len(raw_tokens) - 1):
                bigram = f"{raw_tokens[i]} {raw_tokens[i+1]}"
                if bigram in compound_skills:
                    processed_skills.append(compound_skills[bigram])
                    
            # Also check for compound skills in the original specialization skills
            for skill in specialization_skills:
                skill_lower = skill.lower()
                if skill_lower in compound_skills:
                    processed_skills.append(compound_skills[skill_lower])
                else:
                    # Check if this contains a known compound skill
                    for compound, formal in compound_skills.items():
                        if compound in skill_lower and formal not in processed_skills:
                            processed_skills.append(formal)
            
            # Keep track of words that are part of compound skills to avoid duplication
            words_in_compounds = set()
            for compound in compound_skills:
                for word in compound.split():
                    if len(word) > 2:  # Only track meaningful words
                        words_in_compounds.add(word)
            
            # Add single-word skills, but only if they're not already part of a compound skill
            for token in set(raw_tokens):
                if token in compound_skills:
                    processed_skills.append(compound_skills[token])
                elif len(token) > 2 and token not in words_in_compounds and token not in ['the', 'and', 'for', 'with', 'a', 'an', 'of', 'to', 'in', 'on', 'is', 'are']:
                    # Add capitalized individual tokens if they're not common words and not part of compounds
                    processed_skills.append(token.capitalize())
                    
            specialization_skills = processed_skills
        
        # Remove duplicates
        specialization_skills = list(set(specialization_skills))
        
        # Find missing skills
        missing_skills = []
        for skill in specialization_skills:
            skill_lower = skill.lower()
            if all(skill_lower not in user_skill.lower() for user_skill in user_skills):
                missing_skills.append(skill)
        
        # Sort missing skills alphabetically (for consistency)
        missing_skills.sort()
        
        # Return the top 7 missing skills
        top_missing = missing_skills[:min(7, len(missing_skills))]
        
        return {
            'missing_skills': top_missing,
            'specialization': specialization,
            'user_skills_count': len(user_skills),
            'required_skills_count': len(specialization_skills),
            'missing_skills_count': len(missing_skills)
        }
    except Exception as e:
        print(f"Error identifying missing skills: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'missing_skills': [],
            'error': str(e)
        }

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