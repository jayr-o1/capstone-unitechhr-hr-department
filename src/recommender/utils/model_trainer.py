"""
Model training and retraining module for the career recommender system.
This module handles initial model training and retraining based on user feedback.
"""

import os
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import json
import pickle
import shutil
import traceback  # Add traceback module for error handling

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
    """Ensure that a directory exists, create it if it doesn't."""
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)
        print(f"Created directory: {directory_path}")

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

def prepare_features(data):
    """Prepare features for model training or prediction."""
    # Check if necessary columns exist
    if 'Skills' not in data.columns or 'Field' not in data.columns:
        # Try to accommodate different column names
        skills_col = next((col for col in data.columns if 'skill' in col.lower()), None)
        field_col = next((col for col in data.columns if 'field' in col.lower() or 'career' in col.lower()), None)
        
        if not skills_col or not field_col:
            raise ValueError(f"Required columns not found in data. Available columns: {data.columns.tolist()}")
        
        X = data[skills_col]
        y = data[field_col]
    else:
        X = data['Skills']
        y = data['Field']
    
    # Fill NaN values in X with empty string
    X = X.fillna('')
    
    # Remove rows where y is NaN
    valid_indices = ~pd.isna(y)
    X = X[valid_indices]
    y = y[valid_indices]
    
    return X, y

def initial_model_training(verbose=True):
    """
    Perform initial model training using synthetic data.
    This should only be run when no model exists or when a complete retrain is desired.
    
    Args:
        verbose (bool): If True, print detailed progress messages
    
    Returns:
        bool: True if training was successful, False otherwise
    """
    try:
        print("Starting initial model training process...")
        
        # Load datasets using our new flexible loaders
        print("Loading synthetic employee data...")
        employee_data = load_synthetic_employee_data(verbose=verbose)
        
        if employee_data is None:
            print("Failed to load employee data. Creating minimal synthetic dataset.")
            # Create a minimal synthetic dataset for testing
            employee_data = pd.DataFrame({
                'Employee ID': [f'EMP{i:03d}' for i in range(1, 21)],
                'Name': ['Test User ' + str(i) for i in range(1, 21)],
                'Age': [30 + i % 15 for i in range(1, 21)],
                'Years Experience': [5 + i % 10 for i in range(1, 21)],
                'Skills': ['Programming, Data Analysis' if i % 2 == 0 else 'Management, Leadership' for i in range(1, 21)],
                'Career Goal': ['Software Development' if i % 2 == 0 else 'Management' for i in range(1, 21)],
                'Current Role': ['Developer' if i % 2 == 0 else 'Team Lead' for i in range(1, 21)]
            })
            
        print(f"Loaded {len(employee_data)} employee records")
        
        # Create the target variable - map career goal to a field
        print("Loading career fields...")
        try:
            career_fields = load_career_fields()
            print(f"Loaded {len(career_fields)} career fields")
            
            # First, load the career path data to create mapping
            print("Loading career path data...")
            career_path_data = load_synthetic_career_path_data(verbose=verbose)
            if career_path_data is not None:
                if 'Field' in career_path_data.columns and 'Specialization' in career_path_data.columns:
                    print(f"Using career path data with {len(career_path_data)} entries to create field mapping")
                    print(f"Sample of career path data: {career_path_data[['Field', 'Specialization']].head(3).to_dict()}")
                    # Create mapping from specialization to field from the career path data
                    specialization_to_field = dict(zip(career_path_data['Specialization'], career_path_data['Field']))
                    print(f"Created mapping for {len(specialization_to_field)} specializations to fields")
                    print(f"First 5 mappings: {dict(list(specialization_to_field.items())[:5])}")
                else:
                    specialization_to_field = {}
                    print(f"Career path data columns available: {career_path_data.columns.tolist()}")
                    print("Required columns 'Field' and/or 'Specialization' not found in career path data")
            else:
                specialization_to_field = {}
                print("Could not load career path data to create specialization-to-field mapping")
            
            # Map each career goal to its field
            print("Mapping career goals to fields...")
            field_mapping = {}
            
            # First, try to use the career_fields dictionary
            for field, data in career_fields.items():
                for role in data.get("roles", []):
                    field_mapping[role] = field
            
            # Then, supplement with specialization_to_field mapping
            field_mapping.update(specialization_to_field)
            
            # Apply mapping to create the target variable
            print("Creating target variables...")
            
            # Check if Career Goal column exists, otherwise try to find a similar column
            if 'Career Goal' in employee_data.columns:
                career_goal_col = 'Career Goal'
            elif 'Career Path' in employee_data.columns:
                career_goal_col = 'Career Path'
            else:
                career_goal_col = next((col for col in employee_data.columns if 'career' in col.lower()), None)
                
            if career_goal_col:
                # Apply mapping to create the target variable, with fallback for missing mappings
                employee_data["Field"] = employee_data[career_goal_col].apply(
                    lambda x: field_mapping.get(x, None)
                )
                
                # Check if we have any valid mappings
                mapping_count = employee_data["Field"].count()
                print(f"Successfully mapped {mapping_count} career goals to fields")
                
                # If too few valid mappings, try fuzzy matching
                if mapping_count < len(employee_data) * 0.5:  # If less than 50% mapped
                    print("Less than 50% of career goals mapped. Trying fuzzy matching...")
                    # For each unmapped career goal, find closest match in our mapping
                    for career_goal in employee_data[employee_data["Field"].isna()][career_goal_col].unique():
                        # Simple matching - check if any key in field_mapping contains our career goal
                        for key, value in field_mapping.items():
                            if (isinstance(career_goal, str) and isinstance(key, str) and 
                                (career_goal.lower() in key.lower() or key.lower() in career_goal.lower())):
                                field_mapping[career_goal] = value
                                break
                    
                    # Apply updated mapping
                    employee_data["Field"] = employee_data[career_goal_col].apply(
                        lambda x: field_mapping.get(x, None)
                    )
                    print(f"After fuzzy matching: {employee_data['Field'].count()} career goals mapped to fields")
            else:
                print("Could not find Career Goal column. Cannot map to fields.")
                raise ValueError("Career Goal column not found")
                
        except Exception as e:
            print(f"Error loading career fields: {str(e)}")
            # Create a simple field mapping for the test data
            print("Creating simple field mapping for test data...")
            
            # First check which column to use for career goal
            if 'Career Goal' in employee_data.columns:
                career_goal_col = 'Career Goal'
            elif 'Career Path' in employee_data.columns:
                career_goal_col = 'Career Path'
            else:
                # Try to find a column with 'career' in the name
                career_goal_col = next((col for col in employee_data.columns if 'career' in col.lower()), None)
                
            if career_goal_col:
                employee_data["Field"] = employee_data[career_goal_col].apply(
                    lambda x: "Technology" if "Software" in str(x) else "Management")
            else:
                # Create a default Field column based on Current Role
                employee_data["Field"] = employee_data.get("Current Role", "Unknown").apply(
                    lambda x: "Technology" if any(tech in str(x).lower() for tech in ["developer", "engineer", "analyst"]) 
                    else "Management")
        
        # Remove rows with missing fields
        initial_count = len(employee_data)
        employee_data = employee_data.dropna(subset=["Field"])
        print(f"Using {len(employee_data)} records after removing {initial_count - len(employee_data)} with missing fields")
        
        # Check if we have any records left
        if len(employee_data) == 0:
            print("No valid records found after filtering. Creating synthetic records...")
            # Create synthetic records with valid fields
            employee_data = pd.DataFrame({
                'Employee ID': [f'EMP{i:03d}' for i in range(1, 11)],
                'Name': ['Synthetic User ' + str(i) for i in range(1, 11)],
                'Age': [30 + i % 15 for i in range(1, 11)],
                'Years Experience': [5 + i % 10 for i in range(1, 11)],
                'Skills': ['Programming, Data Analysis, Python' if i % 2 == 0 else 'Management, Leadership, Communication' for i in range(1, 11)],
                'Career Goal': ['Software Development' if i % 2 == 0 else 'Management' for i in range(1, 11)],
                'Current Role': ['Developer' if i % 2 == 0 else 'Team Lead' for i in range(1, 11)],
                'Field': ['Technology' if i % 2 == 0 else 'Management' for i in range(1, 11)]
            })
            print(f"Created {len(employee_data)} synthetic records with valid fields")
        
        # Prepare features with flexible column handling
        print("Preparing TF-IDF features for skills...")
        
        # Check which column to use for skills
        if 'Skills' in employee_data.columns:
            skills_col = 'Skills'
        elif 'Required Skills' in employee_data.columns:
            skills_col = 'Required Skills'
        else:
            # Try to find a column with 'skill' in the name
            skills_col = next((col for col in employee_data.columns if 'skill' in col.lower()), None)
            
        if not skills_col:
            print("Could not find Skills column. Creating a default skills column.")
            employee_data['Skills'] = 'Default Skills'
            skills_col = 'Skills'
        
        # Ensure skills column has string values
        employee_data[skills_col] = employee_data[skills_col].fillna('').astype(str)
        
        tfidf = TfidfVectorizer(max_features=100)
        X_skills = tfidf.fit_transform(employee_data[skills_col])
        print(f"Created {X_skills.shape[1]} skill features")
        
        # Use only skills as features
        X = X_skills.toarray()
        X = pd.DataFrame(X)
        X.columns = [str(col) for col in X.columns]
        print(f"Final feature matrix shape: {X.shape}")
        
        # Encode the target variable
        print("Encoding target variables...")
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(employee_data["Field"])
        print(f"Found {len(label_encoder.classes_)} unique fields: {', '.join(label_encoder.classes_)}")
        
        # Apply PCA for dimensionality reduction
        print("Applying PCA for dimensionality reduction...")
        n_components = min(min(X.shape[0], X.shape[1]) - 1, 38)  # Ensure n_components is valid
        print(f"Using {n_components} PCA components based on data shape {X.shape}")
        pca = PCA(n_components=n_components)
        X_pca = pca.fit_transform(X)
        print(f"Reduced dimensions to {X_pca.shape[1]} components, explaining {pca.explained_variance_ratio_.sum()*100:.2f}% of variance")
        
        # Split data into training and test sets
        print("Splitting data into training and testing sets...")
        X_train, X_test, y_train, y_test = train_test_split(X_pca, y, test_size=0.2, random_state=42)
        print(f"Training set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples")
        
        # Train the model
        print("Training RandomForest model...")
        model = RandomForestClassifier(n_estimators=100, random_state=42, verbose=1)
        print("This may take a minute...")
        model.fit(X_train, y_train)
        print("Model training complete")
        
        # Evaluate the model
        print("Evaluating model performance...")
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Model trained with accuracy: {accuracy:.4f}")
        
        # Get class names for better interpretability
        class_names = label_encoder.classes_
        
        # Create a more readable classification report
        print("\n===== CLASSIFICATION REPORT =====")
        print("This report shows how well the model predicts each career field:")
        print("- Precision: When the model predicts a field, how often it's correct")
        print("- Recall: For all actual instances of a field, how many were correctly identified")
        print("- F1-score: A balance between precision and recall")
        print("- Support: Number of actual occurrences of the field in the test set\n")
        
        # Custom report to handle zero division warnings
        report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        
        # Print only fields with support in the test set
        print(f"{'FIELD':<20} {'PRECISION':<10} {'RECALL':<10} {'F1-SCORE':<10} {'SUPPORT':<10}")
        print("-" * 70)
        
        for i, class_idx in enumerate(sorted(report_dict.keys())):
            if class_idx not in ['accuracy', 'macro avg', 'weighted avg'] and report_dict[class_idx]['support'] > 0:
                field_name = class_names[int(class_idx)] if isinstance(class_idx, str) and class_idx.isdigit() else class_names[int(class_idx)]
                field_name = field_name[:18] + ".." if len(field_name) > 20 else field_name
                precision = report_dict[class_idx]['precision']
                recall = report_dict[class_idx]['recall']
                f1 = report_dict[class_idx]['f1-score']
                support = report_dict[class_idx]['support']
                print(f"{field_name:<20} {precision:<10.2f} {recall:<10.2f} {f1:<10.2f} {support:<10}")
        
        print("-" * 70)
        print(f"{'Accuracy':<20} {'':<10} {'':<10} {report_dict['accuracy']:<10.2f} {'':<10}")
        
        print("\n===== MODEL INTERPRETATION =====")
        if accuracy < 0.3:
            print("The model accuracy is low, which is common with many career fields and limited data.")
            print("This means the model is struggling to correctly predict career fields based on skills alone.")
            print("Possible improvements:")
            print("1. Add more training data")
            print("2. Include additional features beyond skills (e.g., experience level)")
            print("3. Group similar career fields together")
            print("4. Use a more sophisticated model architecture")
        else:
            print("The model is performing reasonably well at predicting career fields based on skills.")
        
        # Save feature importance information
        print("\n===== MOST IMPORTANT SKILLS =====")
        feature_importances = model.feature_importances_
        feature_names = range(X.shape[1])  # Numeric indices for TF-IDF features
        
        # Map TF-IDF feature indices back to actual skill terms where possible
        skill_importance = []
        try:
            # Get the TF-IDF feature names (skills)
            tfidf_features = tfidf.get_feature_names_out()
            for idx, importance in enumerate(feature_importances):
                if idx < len(tfidf_features):
                    skill_importance.append((tfidf_features[idx], importance))
                else:
                    skill_importance.append((f"Feature_{idx}", importance))
        except:
            # Fallback if get_feature_names_out fails
            for idx, importance in enumerate(feature_importances):
                skill_importance.append((f"Feature_{idx}", importance))
        
        # Sort by importance (descending)
        skill_importance.sort(key=lambda x: x[1], reverse=True)
        
        # Print top 10 important skills
        print("The following skills have the most influence on career field prediction:")
        for skill, importance in skill_importance[:10]:
            print(f"- {skill}: {importance:.4f}")
        
        print("\n===== CONFUSION MATRIX =====")
        print("This shows how many predictions were made for each field (columns) compared to the actual fields (rows).")
        print("A perfect model would have all predictions on the diagonal.")
        
        # Print a simplified confusion matrix for the top classes with predictions
        cm = confusion_matrix(y_test, y_pred)
        
        # Get the classes that appear in the test set
        test_classes = sorted(set(y_test))
        
        # Print only if there aren't too many classes
        if len(test_classes) <= 10:
            # Print header
            print("\n" + " " * 20, end="")
            for i in test_classes:
                field_name = class_names[i][:7]
                print(f"{field_name:>8}", end="")
            print()
            
            # Print rows
            for i, row_idx in enumerate(test_classes):
                field_name = class_names[row_idx][:18]
                print(f"{field_name:<20}", end="")
                for j, col_idx in enumerate(test_classes):
                    print(f"{cm[i, j]:>8}", end="")
                print()
        else:
            print("Too many classes to display confusion matrix clearly. Consider reducing the number of distinct fields.")
        
        # Save the model and preprocessing components
        print("Saving model and components...")
        ensure_directory_exists(os.path.dirname(MODEL_PATH))
        
        model_components = {
            "model": model,
            "tfidf": tfidf,
            "pca": pca,
            "label_encoder": label_encoder,
            "training_data_shape": X.shape,
            "accuracy": accuracy,
            "trained_at": datetime.now().isoformat(),
            "feedback_entries_used": 0,
            "skills_column": skills_col,  # Save which column was used for skills
            "career_goal_column": career_goal_col if 'career_goal_col' in locals() else None,  # Save which column was used for career goals
            "original_training_data": {
                "X": X_pca,  # Store the original processed data
                "y": y       # Store the original encoded targets
            }
        }
        
        joblib.dump(model_components, MODEL_PATH)
        print(f"Model and components saved to {MODEL_PATH}")
        
        return True
    except Exception as e:
        print(f"Error in initial model training: {e}")
        traceback.print_exc()
        return False

def retrain_model(feedback_file=None, verbose=True, progress_callback=None, force=False):
    """
    Retrain the model using feedback data.
    
    Args:
        feedback_file (str): Path to the feedback file to use for retraining, or None to use default.
        verbose (bool): If True, print detailed progress messages.
        progress_callback (callable): Optional callback function for reporting progress.
        force (bool): If True, force retraining even if feedback is insufficient.
        
    Returns:
        bool: True if the model was successfully retrained, False otherwise.
    """
    # Define a local progress function to avoid recursion issues
    def local_progress(message, percent=None):
        """Local progress tracking function that doesn't call retrain_model recursively"""
        if verbose:
            if percent is not None:
                print(f"{message} - {percent}% complete")
            else:
                print(message)
        if progress_callback is not None:
            progress_callback(message, percent)
    
    try:
        # Load the existing model
        local_progress("Loading existing model", 5)
        
        # Check if model exists
        if not os.path.exists(MODEL_PATH):
            if verbose:
                print("No existing model found. Running initial training instead.")
            return initial_model_training(verbose=verbose)
            
        model_components = joblib.load(MODEL_PATH)
        
        # Extract components
        local_progress("Extracting model components", 10)
            
        model = model_components.get('model')
        tfidf = model_components.get('tfidf')
        pca = model_components.get('pca')
        label_encoder = model_components.get('label_encoder')
        
        if not all([model, tfidf, pca, label_encoder]):
            if verbose:
                print("Model components are incomplete. Running initial training instead.")
            return initial_model_training(verbose=verbose)
        
        # Load feedback data
        local_progress("Loading feedback data", 15)
            
        feedback_data = []
        try:
            feedback_data = get_all_feedback(feedback_file)
            if verbose:
                print(f"Loaded {len(feedback_data)} feedback entries")
        except Exception as e:
            if verbose:
                print(f"Error loading feedback: {str(e)}")
                print("Proceeding without feedback data")
        
        # Check if we have enough feedback to retrain
        if not feedback_data and not force:
            if verbose:
                print("No feedback data available. Skipping retraining.")
                print("Use --force to force retraining with no feedback.")
            return False
        
        # Load the original training data
        local_progress("Loading original training data", 20)
            
        X_orig = model_components.get('original_training_data', {}).get('X')
        y_orig = model_components.get('original_training_data', {}).get('y')
        
        if X_orig is None or y_orig is None:
            if verbose:
                print("Original training data not found in model components.")
                print("Running initial training instead.")
            return initial_model_training(verbose=verbose)
        
        # Prepare additional features from feedback
        if feedback_data:
            local_progress("Preparing feedback features", 30)
                
            # Extract skills and fields from feedback
            feedback_skills = []
            feedback_fields = []
            
            for entry in feedback_data:
                skills = entry.get('skills', '')
                field = entry.get('recommended_field', '')
                
                if skills and field:
                    feedback_skills.append(skills)
                    feedback_fields.append(field)
            
            if feedback_skills and feedback_fields:
                # Transform skills using the same TF-IDF vectorizer
                X_feedback_skills = tfidf.transform(feedback_skills)
                X_feedback = X_feedback_skills.toarray()
                
                # Apply PCA transformation
                X_feedback_pca = pca.transform(X_feedback)
                
                # Encode the fields
                try:
                    y_feedback = label_encoder.transform(feedback_fields)
                except ValueError:
                    # Handle unknown fields
                    if verbose:
                        print("Warning: Feedback contains unknown fields. These will be skipped.")
                    
                    # Filter out unknown fields
                    valid_indices = []
                    valid_fields = []
                    
                    for i, field in enumerate(feedback_fields):
                        try:
                            label_encoder.transform([field])
                            valid_indices.append(i)
                            valid_fields.append(field)
                        except ValueError:
                            continue
                    
                    if not valid_indices:
                        if verbose:
                            print("No valid feedback entries. Skipping retraining.")
                        return False
                    
                    # Keep only valid entries
                    X_feedback_pca = X_feedback_pca[valid_indices]
                    y_feedback = label_encoder.transform(valid_fields)
                
                # Combine with original data
                X_combined = np.vstack((X_orig, X_feedback_pca))
                y_combined = np.concatenate((y_orig, y_feedback))
                
                if verbose:
                    print(f"Combined data shape: {X_combined.shape}")
                    print(f"Added {len(y_feedback)} feedback entries")
            else:
                # No valid feedback data
                X_combined = X_orig
                y_combined = y_orig
                
                if verbose:
                    print("No valid feedback entries. Using original data only.")
        else:
            # No feedback data
            X_combined = X_orig
            y_combined = y_orig
            
            if verbose:
                print("No feedback data. Using original data only.")
        
        # Split data into training and test sets
        local_progress("Splitting data into training and testing sets", 40)
            
        X_train, X_test, y_train, y_test = train_test_split(
            X_combined, y_combined, test_size=0.2, random_state=42)
        
        if verbose:
            print(f"Training set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples")
        
        # Train the model
        local_progress("Training RandomForest model", 50)
            
        model = RandomForestClassifier(n_estimators=100, random_state=42, verbose=1)
        model.fit(X_train, y_train)
        
        if verbose:
            print("Model training complete")
        
        # Evaluate the model
        local_progress("Evaluating model performance", 70)
            
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        if verbose:
            print(f"Model trained with accuracy: {accuracy:.4f}")
            print(classification_report(y_test, y_pred))
        
        # Save the model and preprocessing components
        local_progress("Saving model and components", 80)
            
        model_components = {
            "model": model,
            "tfidf": tfidf,
            "pca": pca,
            "label_encoder": label_encoder,
            "training_data_shape": X_combined.shape,
            "accuracy": accuracy,
            "trained_at": datetime.now().isoformat(),
            "feedback_entries_used": len(feedback_data),
            "original_training_data": {
                "X": X_combined,  # Store the combined data for future retraining
                "y": y_combined   # Store the combined targets for future retraining
            }
        }
        
        joblib.dump(model_components, MODEL_PATH)
        
        if verbose:
            print(f"Model and components saved to {MODEL_PATH}")
        
        local_progress("Retraining complete", 100)
        return True
    except Exception as e:
        if verbose:
            print(f"Error in model retraining: {e}")
            traceback.print_exc()
        return False

def evaluate_model(test_data_path=None, model_path=None, verbose=False):
    """
    Evaluate the model using either provided test data or synthetic data.
    
    Args:
        test_data_path (str): Path to the test data, or None to use the default.
        model_path (str): Path to the model, or None to use the default.
        verbose (bool): If True, print detailed progress messages.
        
    Returns:
        dict: Evaluation metrics for the model.
    """
    try:
        if verbose:
            print("Starting model evaluation - 0% complete")
        
        # Use default paths if not specified
        if model_path is None:
            model_path = MODEL_PATH
            
        if test_data_path is None:
            # Use the data loader directly instead of file path
            if verbose:
                print("No test data path provided, will use data_loader utilities")
        
        # Load model components
        if verbose:
            print("Loading model components - 10% complete")
            
        if not os.path.exists(model_path):
            if verbose:
                print(f"Model not found at {model_path}")
                print("Please train the model first.")
            return None
            
        model_components = joblib.load(model_path)
        
        if verbose:
            print("Model components loaded successfully - 20% complete")
        
        # Extract components
        model = model_components.get('model')
        tfidf = model_components.get('tfidf')
        pca = model_components.get('pca')
        label_encoder = model_components.get('label_encoder')
        skills_column = model_components.get('skills_column', 'Skills')
        career_goal_column = model_components.get('career_goal_column', 'Career Goal')
        
        if not all([model, tfidf, pca, label_encoder]):
            if verbose:
                print("Model components are incomplete. Evaluation failed.")
            return None
        
        # Load test data
        if verbose:
            print("Loading test data - 30% complete")
        
        # Import the data loader directly rather than relying on file paths
        from .data_loader import load_synthetic_employee_data
            
        try:
            # Always use our specialized function to load data
            test_data = load_synthetic_employee_data(verbose=verbose)
            
            if test_data is None or len(test_data) == 0:
                if verbose:
                    print("Failed to load test data. Using generated data for evaluation.")
                return evaluate_model_with_generated_data(model_path, verbose)
                
            if verbose:
                print(f"Loaded {len(test_data)} test records - 40% complete")
                
        except Exception as e:
            if verbose:
                print(f"Error loading test data: {str(e)}")
                print("Using generated data for evaluation.")
            return evaluate_model_with_generated_data(model_path, verbose)
        
        # Map career goals to fields to create the target variable
        if verbose:
            print("Creating target variables - 50% complete")
        
        try:
            # Try to load career fields for mapping
            career_fields = load_career_fields()
            
            # Create field mapping
            field_mapping = {}
            for field, data in career_fields.items():
                for role in data.get("roles", []):
                    field_mapping[role] = field
            
            # Apply mapping to test data
            test_data["Field"] = test_data[career_goal_column].map(field_mapping)
            
            # Remove rows with unknown fields
            initial_count = len(test_data)
            test_data = test_data.dropna(subset=["Field"])
            
            if verbose:
                print(f"Using {len(test_data)} records after removing {initial_count - len(test_data)} with unknown fields")
                
            if len(test_data) == 0:
                if verbose:
                    print("No valid test records with known fields. Using generated data.")
                return evaluate_model_with_generated_data(model_path, verbose)
                
        except Exception as e:
            if verbose:
                print(f"Error mapping career goals to fields: {str(e)}")
                print("Creating simple field mapping based on career goals.")
                
            # Create a simple mapping based on career goals
            test_data["Field"] = test_data[career_goal_column].apply(
                lambda x: "Technology" if "Software" in str(x) or "Data" in str(x) 
                else "Management" if "Management" in str(x) 
                else "Healthcare" if "Health" in str(x) 
                else "Unknown"
            )
            
            # Remove rows with unknown fields
            test_data = test_data[test_data["Field"] != "Unknown"]
            
            if len(test_data) == 0:
                if verbose:
                    print("No valid test records with mapped fields. Using generated data.")
                return evaluate_model_with_generated_data(model_path, verbose)
        
        # Prepare features
        if verbose:
            print("Preparing features - 60% complete")
            
        # Transform skills using the same vectorizer
        X_skills = tfidf.transform(test_data[skills_column].fillna(''))
        X = X_skills.toarray()
        
        if verbose:
            print(f"Created {X.shape[1]} skill features")
            
        # Apply PCA transformation
        X_pca = pca.transform(X)
        
        if verbose:
            print(f"Applied PCA to reduce dimensions to {X_pca.shape[1]} components")
            
        # Encode the target variable
        try:
            y = label_encoder.transform(test_data["Field"])
            
            if verbose:
                print(f"Encoded {len(set(y))} unique fields")
                
        except ValueError:
            if verbose:
                print("Test data contains unknown fields. Using only known fields.")
                
            # Keep only known fields
            known_fields = set(label_encoder.classes_)
            test_data = test_data[test_data["Field"].isin(known_fields)]
            
            if len(test_data) == 0:
                if verbose:
                    print("No valid test records with known fields. Using generated data.")
                return evaluate_model_with_generated_data(model_path, verbose)
                
            # Encode again with only known fields
            y = label_encoder.transform(test_data["Field"])
        
        # Evaluate the model
        if verbose:
            print("Evaluating model performance - 70% complete")
            
        y_pred = model.predict(X_pca)
        
        # Calculate metrics
        accuracy = accuracy_score(y, y_pred)
        classification_rep = classification_report(y, y_pred, output_dict=True)
        confusion_mat = confusion_matrix(y, y_pred).tolist()
        
        if verbose:
            print(f"Model evaluation results with accuracy: {accuracy:.4f}")
            print(classification_report(y, y_pred))
            
        # Calculate feature importance
        if verbose:
            print("Calculating feature importance - 80% complete")
            
        feature_importance = {}
        for i, importance in enumerate(model.feature_importances_):
            feature_importance[f"feature_{i}"] = float(importance)
            
        # Generate detailed evaluation per field
        if verbose:
            print("Generating detailed evaluation per field - 90% complete")
            
        field_evaluations = {}
        for i, field in enumerate(label_encoder.classes_):
            if i in set(y) and i in set(y_pred):
                field_mask = (y == i)
                field_accuracy = accuracy_score(y[field_mask], y_pred[field_mask])
                field_samples = int(np.sum(field_mask))
                
                field_evaluations[field] = {
                    "accuracy": float(field_accuracy),
                    "samples": field_samples
                }
                
        # Compile evaluation results
        evaluation_results = {
            "overall_accuracy": float(accuracy),
            "classification_report": classification_rep,
            "confusion_matrix": confusion_mat,
            "feature_importance": feature_importance,
            "field_evaluations": field_evaluations,
            "evaluated_at": datetime.now().isoformat(),
            "model_path": model_path,
            "test_samples": len(y)
        }
        
        # Save evaluation results
        evaluation_path = os.path.join(os.path.dirname(model_path), "model_evaluation.json")
        
        with open(evaluation_path, 'w') as f:
            json.dump(evaluation_results, f, indent=2)
            
        if verbose:
            print(f"Evaluation results saved to {evaluation_path}")
            print("Model evaluation complete - 100% complete")
            
        return evaluation_results
    except Exception as e:
        if verbose:
            print(f"Error in model evaluation: {e}")
            traceback.print_exc()
        return None

# Alias evaluate_model function as evaluate_model_performance for backward compatibility
evaluate_model_performance = evaluate_model

def generate_matching_test_data(model_components, sample_count=1000, verbose=False):
    """
    Generate test data that matches the classes known to the model's label encoder.
    
    Args:
        model_components (dict): Dictionary containing model components
        sample_count (int): Number of test samples to generate
        verbose (bool): Whether to print progress information
        
    Returns:
        pandas.DataFrame: DataFrame containing generated test data
    """
    try:
        if verbose:
            print("Generating matching test data...")
            
        # Extract label encoder from model components
        label_encoder = model_components.get('label_encoder')
        if label_encoder is None:
            if verbose:
                print("Error: Label encoder not found in model components")
            return None
            
        # Get the classes known to the label encoder
        known_classes = label_encoder.classes_
        if verbose:
            print(f"Found {len(known_classes)} known classes in the model")
            
        # Load career paths to get required skills for each field
        try:
            from utils.data_loader import load_career_paths
            career_paths = load_career_paths()
            
            # Create a mapping of field to skills
            field_skills = {}
            for path in career_paths:
                field = path.get('field')
                if field in known_classes:
                    skills = path.get('required_skills', [])
                    if field not in field_skills:
                        field_skills[field] = set()
                    field_skills[field].update(skills)
        except Exception as e:
            if verbose:
                print(f"Error loading career paths: {str(e)}")
            field_skills = {field: ["Generic Skill 1", "Generic Skill 2"] for field in known_classes}
        
        # Generate test data with fields from known_classes
        import random
        test_data = []
        for _ in range(sample_count):
            # Pick a random field from known classes
            field = random.choice(known_classes)
            
            # Get skills for this field, or use generic skills if not found
            skills = list(field_skills.get(field, ["Generic Skill 1", "Generic Skill 2"]))
            
            # Include 2-5 random skills
            skill_count = min(len(skills), random.randint(2, 5))
            selected_skills = random.sample(skills, skill_count) if skill_count > 0 else ["Generic Skill"]
            
            # Add to test data
            test_data.append({
                'Field': field,
                'Skills': ', '.join(selected_skills)
            })
            
        # Create DataFrame
        import pandas as pd
        df = pd.DataFrame(test_data)
        
        if verbose:
            print(f"Generated {len(df)} test samples across {len(known_classes)} fields")
            
        return df
    except Exception as e:
        if verbose:
            print(f"Error generating test data: {str(e)}")
        return None

def evaluate_model_with_generated_data(model_path=None, verbose=False):
    """
    Evaluate the model using generated test data that matches the model's known classes.
    
    Args:
        model_path (str): Path to the saved model
        verbose (bool): Whether to print detailed information
        
    Returns:
        dict: Dictionary containing evaluation metrics
    """
    try:
        if verbose:
            print("Evaluating model with generated test data...")
            
        # Load the model
        if model_path is None:
            model_path = MODEL_PATH
            
        model_components = joblib.load(model_path)
        if not model_components:
            if verbose:
                print("Failed to load model components")
            return None
            
        # Generate test data
        test_data = generate_matching_test_data(model_components, sample_count=2000, verbose=verbose)
        if test_data is None or len(test_data) == 0:
            if verbose:
                print("Failed to generate test data")
            return None
            
        # Save the test data path to a temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as temp:
            test_data.to_csv(temp.name, index=False)
            temp_path = temp.name
            
        # Evaluate the model using the generated test data
        results = evaluate_model(test_data_path=temp_path, model_path=model_path, verbose=verbose)
        
        # Clean up
        import os
        try:
            os.unlink(temp_path)
        except:
            pass
            
        return results
    except Exception as e:
        if verbose:
            print(f"Error in evaluate_model_with_generated_data: {str(e)}")
        return None

def train_model_with_recent_changes(user_preferences_only=False, days_threshold=30, min_feedback_count=5, verbose=True):
    """
    Train the model with recent changes including new user preferences and feedback.
    
    This function focuses on incorporating recent user interactions rather than a full retrain.
    It's useful for quickly adapting the model to new changes without the computational cost
    of a full retraining.
    
    Args:
        user_preferences_only (bool): If True, only use user preferences for training
        days_threshold (int): Only include data from the last N days
        min_feedback_count (int): Minimum number of feedback entries required to perform training
        verbose (bool): If True, print detailed progress messages
    
    Returns:
        bool: True if training was successful, False otherwise
    """
    try:
        # Import datetime here to avoid UnboundLocalError
        from datetime import datetime, timedelta
        
        if verbose:
            print(f"Starting incremental model training with recent changes...")
        
        # Load existing model if available
        model_exists = os.path.exists(MODEL_PATH)
        if not model_exists:
            if verbose:
                print("No existing model found. Performing initial training instead.")
            return initial_model_training(verbose=verbose)
        
        # Load existing model components
        if verbose:
            print("Loading existing model components...")
        model_components = joblib.load(MODEL_PATH)
        
        # Extract components
        model = model_components.get("model")
        tfidf = model_components.get("tfidf")
        pca = model_components.get("pca")
        label_encoder = model_components.get("label_encoder")
        
        # Load user preferences data
        from utils.data_loader import load_all_user_preferences
        user_prefs = load_all_user_preferences()
        
        if not user_prefs:
            if verbose:
                print("No user preferences found. Cannot perform training with recent changes.")
            return False
        
        if verbose:
            print(f"Loaded {len(user_prefs)} user preference entries")
            
        # Filter for recent entries if needed
        if days_threshold > 0:
            cutoff_date = datetime.now() - timedelta(days=days_threshold)
            
            # Filter entries based on timestamp if available
            recent_prefs = []
            for pref in user_prefs:
                if 'timestamp' in pref:
                    try:
                        timestamp = datetime.fromisoformat(pref['timestamp'])
                        if timestamp >= cutoff_date:
                            recent_prefs.append(pref)
                    except (ValueError, TypeError):
                        # If timestamp parsing fails, include entry anyway
                        recent_prefs.append(pref)
                else:
                    # Include entries without timestamp
                    recent_prefs.append(pref)
            
            if verbose:
                print(f"Filtered to {len(recent_prefs)} entries from the last {days_threshold} days")
            user_prefs = recent_prefs
        
        # Prepare data for model update
        user_data = []
        for pref in user_prefs:
            # Include only entries with both skills and preferred specialization
            if 'current_skills' in pref and 'preferred_specialization' in pref:
                # Get the field from the specialization
                field = None
                if 'preferred_field' in pref:
                    field = pref['preferred_field']
                else:
                    # Try to determine field from specialization
                    from utils.skill_analyzer import get_field_for_specialization
                    field = get_field_for_specialization(pref['preferred_specialization'], None)
                
                if field:
                    user_data.append({
                        'Skills': ', '.join(pref['current_skills']),
                        'Field': field
                    })
        
        if len(user_data) < min_feedback_count:
            if verbose:
                print(f"Insufficient user data ({len(user_data)}/{min_feedback_count} required). Skipping training.")
            return False
        
        # Create a DataFrame
        user_df = pd.DataFrame(user_data)
        
        # Also load feedback data if not using preferences only
        feedback_df = None
        if not user_preferences_only:
            # Load feedback data
            from utils.feedback_handler import get_all_feedback
            feedback = get_all_feedback()
            
            if feedback and len(feedback) > 0:
                feedback_data = []
                
                for entry in feedback:
                    if 'user_skills' in entry and 'selected_field' in entry and entry.get('rating', 0) >= 3:
                        feedback_data.append({
                            'Skills': ', '.join(entry['user_skills']),
                            'Field': entry['selected_field']
                        })
                
                if feedback_data:
                    feedback_df = pd.DataFrame(feedback_data)
                    if verbose:
                        print(f"Loaded {len(feedback_df)} feedback entries with ratings >= 3")
        
        # Combine user preferences with feedback if available
        if feedback_df is not None and len(feedback_df) > 0:
            combined_df = pd.concat([user_df, feedback_df], ignore_index=True)
            if verbose:
                print(f"Combined dataset contains {len(combined_df)} entries")
        else:
            combined_df = user_df
            if verbose:
                print(f"Using only user preferences dataset with {len(combined_df)} entries")
        
        # Extract features using existing TF-IDF vectorizer
        if verbose:
            print("Extracting features from skills data...")
        
        # Ensure all skills are strings
        combined_df['Skills'] = combined_df['Skills'].astype(str)
        
        # Transform using the existing TF-IDF vectorizer
        X_skills = tfidf.transform(combined_df['Skills'])
        
        # Apply existing PCA transformation
        X_pca = pca.transform(X_skills.toarray())
        
        if verbose:
            print(f"Prepared features with shape: {X_pca.shape}")
        
        # Encode the target variable using existing encoder
        try:
            y = label_encoder.transform(combined_df['Field'])
        except ValueError as e:
            if verbose:
                print(f"Found new field labels. Updating label encoder...")
            
            # Get the current classes
            current_classes = set(label_encoder.classes_)
            
            # Add the new classes
            new_classes = set(combined_df['Field']) - current_classes
            if verbose:
                print(f"New field labels found: {new_classes}")
            
            # Create a new encoder with all classes
            all_classes = list(current_classes.union(new_classes))
            new_encoder = LabelEncoder()
            new_encoder.fit(all_classes)
            
            # Transform the data
            y = new_encoder.transform(combined_df['Field'])
            
            # Replace the old encoder
            label_encoder = new_encoder
            model_components["label_encoder"] = label_encoder
            
            if verbose:
                print(f"Label encoder updated with {len(new_classes)} new classes")
        
        # Update the model with new data
        if verbose:
            print("Updating model with new data...")
        
        # Train the model (partial_fit not available for RandomForest, so we fit on all data)
        model.fit(X_pca, y)
        
        if verbose:
            print("Model update complete")
        
        # Save the updated model
        model_components["model"] = model
        model_components["trained_at"] = datetime.now().isoformat()
        model_components["recent_changes_count"] = len(combined_df)
        
        save_model_components(model_components, verbose=verbose)
        
        if verbose:
            print("Updated model saved successfully")
        
        return True
    
    except Exception as e:
        if verbose:
            print(f"Error in incremental model training: {str(e)}")
            import traceback
            traceback.print_exc()
        return False

if __name__ == "__main__":
    # This allows running this module directly for training/retraining
    print("Career Recommender System - Model Trainer")
    print("=" * 50)
    
    if not os.path.exists(MODEL_PATH):
        print("No existing model found. Performing initial training...")
        initial_model_training()
    else:
        print("Existing model found. Retraining with feedback...")
        retrain_model()
    
    print("\nEvaluating model performance:")
    metrics = evaluate_model_with_generated_data(verbose=True)
    if metrics:
        print(f"Model accuracy: {metrics['accuracy']:.4f}")
        print(f"Model trained at: {metrics['trained_at']}")
        print(f"Feedback entries used: {metrics['feedback_entries_used']}")
    
    print("\nTraining complete!") 