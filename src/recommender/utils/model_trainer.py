"""
Model training and retraining module for the career recommender system.
This module handles initial model training and retraining based on user feedback.
"""

import os
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
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
from utils.feedback_handler import load_feedback_db, get_all_feedback

# Define paths
MODEL_PATH = "models/career_path_recommendation_model.pkl"
EMPLOYEE_DATA_PATH = "data/synthetic_employee_data.csv"
CAREER_PATH_DATA_PATH = "data/synthetic_career_path_data.csv"
MODEL_HISTORY_DIR = "models/history"

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
        
        # Load datasets
        print("Loading synthetic employee data...")
        employee_data = pd.read_csv(EMPLOYEE_DATA_PATH)
        print(f"Loaded {len(employee_data)} employee records")
        
        # Create the target variable - map career goal to a field
        print("Loading career fields...")
        career_fields = load_career_fields()
        print(f"Loaded {len(career_fields)} career fields")
        
        # Map each career goal to its field
        print("Mapping career goals to fields...")
        field_mapping = {}
        for field, data in career_fields.items():
            for role in data["roles"]:
                field_mapping[role] = field
        
        # Apply mapping to create the target variable
        print("Creating target variables...")
        employee_data["Field"] = employee_data["Career Goal"].map(field_mapping)
        
        # Remove rows with missing fields (should not happen with proper data)
        initial_count = len(employee_data)
        employee_data = employee_data.dropna(subset=["Field"])
        print(f"Using {len(employee_data)} records after removing {initial_count - len(employee_data)} with missing fields")
        
        # Prepare features
        print("Preparing TF-IDF features for skills...")
        tfidf = TfidfVectorizer(max_features=100)
        X_skills = tfidf.fit_transform(employee_data["Skills"])
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
        pca = PCA(n_components=min(38, X.shape[1]))
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
        print(classification_report(y_test, y_pred))
        
        # Save the model and preprocessing components
        print("Saving model and components...")
        ensure_directory_exists(os.path.dirname(MODEL_PATH))
        
        model_components = {
            "model": model,
            "tfidf": tfidf,
            "pca": pca,
            "label_encoder": label_encoder,
            "training_data_shape": X.shape,
            "trained_at": datetime.now().isoformat(),
            "accuracy": accuracy
        }
        
        joblib.dump(model_components, MODEL_PATH)
        print(f"Model and components saved to {MODEL_PATH}")
        
        return True
    except Exception as e:
        print(f"Error in initial model training: {e}")
        traceback.print_exc()
        return False

def retrain_model(feedback_file=None, verbose=True, progress_callback=None):
    """
    Retrain the recommendation model using feedback data.
    
    Args:
        feedback_file (str): Path to the feedback file. If None, the default feedback file is used.
        verbose (bool): If True, print progress messages
        progress_callback (function): Callback function for progress updates; takes (step_name, percent)
    
    Returns:
        bool: True if the model was retrained successfully, False otherwise
    """
    try:
        if verbose:
            print("Starting model retraining process...")
        
        # Progress reporting helper
        def report_progress(step, percent=None):
            if progress_callback:
                progress_callback(step, percent)
            if verbose:
                if percent is not None:
                    print(f"{step} - {percent}% complete")
                else:
                    print(step)
        
        report_progress("Loading existing model", 5)
        
        # Load original model to extract components
        model_path = os.path.join('models', 'career_path_recommendation_model.pkl')
        model_components = None
        
        try:
            if verbose:
                print("Loading existing model...")
            if os.path.exists(model_path):
                try:
                    # Try to load with joblib first
                    model_components = joblib.load(model_path)
                    if verbose:
                        print("Successfully loaded model with joblib")
                except:
                    try:
                        # Try with pickle as fallback
                        with open(model_path, 'rb') as f:
                            model_components = pickle.load(f)
                        if verbose:
                            print("Successfully loaded model with pickle")
                    except Exception as e:
                        # Both methods failed
                        if verbose:
                            print(f"Error loading model: {str(e)}")
                            print("Will create new model components")
                        model_components = None
            else:
                if verbose:
                    print("No existing model found, will create new components")
                model_components = None
        except Exception as e:
            if verbose:
                print(f"Error loading model: {str(e)}")
                traceback.print_exc()
                print("Will create new model components")
            model_components = None
        
        # Load feedback data
        try:
            report_progress("Loading feedback data", 10)
            
            # Get feedback entries directly from the feedback database
            feedback_entries = get_all_feedback()
            
            if verbose:
                print(f"Loaded {len(feedback_entries)} feedback entries directly from the feedback database")
            
            if not feedback_entries:
                if verbose:
                    print("No feedback entries found for retraining.")
                return False
                
            report_progress("Feedback data loaded successfully", 15)
        except Exception as e:
            if verbose:
                print(f"Error loading feedback: {str(e)}")
                traceback.print_exc()
            return False
        
        # Load employee data for training
        try:
            report_progress("Loading employee training data", 20)
            
            synthetic_data_path = os.path.join('data', 'synthetic_employee_data.csv')
            if not os.path.exists(synthetic_data_path):
                if verbose:
                    print(f"Could not find synthetic employee data at {synthetic_data_path}")
                return False
            
            employee_data = pd.read_csv(synthetic_data_path)
            if verbose:
                print(f"Loaded {len(employee_data)} employee records")
                
            report_progress("Employee data loaded successfully", 25)
        except Exception as e:
            if verbose:
                print(f"Error loading synthetic employee data: {str(e)}")
            return False
            
        # Create the target variable
        try:
            # Load career fields
            career_fields = load_career_fields()
            
            # Map career goals to fields
            field_mapping = {}
            for field, data in career_fields.items():
                for role in data["roles"]:
                    field_mapping[role] = field
            
            # Apply mapping to create the target variable
            employee_data["Field"] = employee_data["Career Goal"].map(field_mapping)
            
            # Remove rows with missing fields
            employee_data = employee_data.dropna(subset=["Field"])
            if verbose:
                print(f"Using {len(employee_data)} employee records after preprocessing")
        except Exception as e:
            if verbose:
                print(f"Error preparing target variable: {str(e)}")
            return False
        
        # Prepare features for training
        try:
            report_progress("Preparing features for retraining", 30)
            
            # Convert feedback entries to a DataFrame
            feedback_df = pd.DataFrame([
                {
                    'skills': entry.get('skills', '') if isinstance(entry, dict) else getattr(entry, 'skills', ''),
                    'interests': entry.get('interests', '') if isinstance(entry, dict) else getattr(entry, 'interests', ''),
                    'current_role': entry.get('current_role', '') if isinstance(entry, dict) else getattr(entry, 'current_role', ''),
                    'recommended_role': entry.get('recommended_role', '') if isinstance(entry, dict) else getattr(entry, 'recommended_role', ''),
                    'is_positive': entry.get('is_positive', False) if isinstance(entry, dict) else getattr(entry, 'is_positive', False)
                }
                for entry in feedback_entries
            ])
            
            # Replace any NaN values with empty strings
            feedback_df = feedback_df.fillna('')
            
            if verbose:
                print(f"Prepared feedback DataFrame with {len(feedback_df)} entries")
                
            report_progress("Features prepared successfully", 40)
        except Exception as e:
            if verbose:
                print(f"Error preparing feedback data: {str(e)}")
            return False
            
        # Perform model retraining - adjust weights based on feedback
        try:
            report_progress("Retraining model with feedback data", 50)
            
            if model_components is None:
                if verbose:
                    print("No existing model components found, cannot retrain")
                return False
            
            # Load the existing model components
            existing_tfidf = model_components.get('tfidf')
            existing_pca = model_components.get('pca')
            existing_model = model_components.get('model')
            existing_label_encoder = model_components.get('label_encoder')
            
            report_progress("Updating model based on feedback", 60)
            
            # Filter for positive feedback entries to strengthen those associations
            positive_feedback = feedback_df[feedback_df['is_positive'] == True]
            
            if len(positive_feedback) > 0:
                # Use existing preprocessing components to transform the feedback data
                # This is a simplified version - in a real system, this would be more sophisticated
                modified_employee_data = employee_data.copy()
                
                report_progress("Integrating positive feedback", 70)
                
                # For each positive feedback entry, strengthen that recommendation pattern
                # by adding it to the training data (potentially with higher weight)
                for _, feedback in positive_feedback.iterrows():
                    # Create a new entry that reinforces this recommendation
                    new_entry = {
                        'skills': feedback['skills'],
                        'interests': feedback['interests'],
                        'current_role': feedback['current_role'],
                        'target_role': feedback['recommended_role']
                    }
                    
                    # Add the same feedback multiple times to increase its weight (5x)
                    for _ in range(5):
                        modified_employee_data = pd.concat([modified_employee_data, pd.DataFrame([new_entry])], ignore_index=True)
                
                if verbose:
                    print(f"Added {len(positive_feedback)*5} weighted positive feedback entries to training data")
                
                report_progress("Finalizing model retraining", 80)
                
                # Retrain the model with the modified data
                X, y = prepare_features(modified_employee_data)
                
                # Handle NaN values
                if isinstance(X, pd.Series) or isinstance(X, pd.DataFrame):
                    X = X.fillna('')
                
                # Drop any rows where y is NaN
                if isinstance(y, pd.Series):
                    valid_indices = ~y.isna()
                    if not valid_indices.all():
                        if verbose:
                            print(f"Dropping {(~valid_indices).sum()} rows with NaN target values")
                        X = X[valid_indices] if isinstance(X, pd.Series) else X.loc[valid_indices]
                        y = y[valid_indices]
                
                X_tfidf = existing_tfidf.transform(X)
                X_pca = existing_pca.transform(X_tfidf.toarray())
                
                # Fit the model with the updated data
                existing_model.fit(X_pca, y)
                
                if verbose:
                    print("Model retrained successfully with feedback")
                
                report_progress("Model retraining completed", 90)
                
                # Save the updated model
                model_components['model'] = existing_model
                
                # Add feedback information
                model_components['feedback_entries_used'] = len(positive_feedback)
                model_components['trained_at'] = datetime.now().isoformat()
                
                # Save the updated model components to disk
                save_model_components(model_components, verbose=verbose)
                
                report_progress("Model saved successfully", 100)
                return True
            else:
                if verbose:
                    print("No positive feedback entries found for retraining")
                report_progress("No positive feedback to incorporate", 100)
                return True
                
        except Exception as e:
            if verbose:
                print(f"Error during model retraining: {str(e)}")
            traceback.print_exc()
            return False
    except Exception as e:
        if verbose:
            print(f"Error in model retraining: {str(e)}")
        traceback.print_exc()
        return False

def evaluate_model(test_data_path=None, model_path=None, verbose=False):
    """
    Evaluate the model's performance using a test dataset.
    
    Args:
        test_data_path (str): Path to the test data file.
        model_path (str): Path to the saved model.
        verbose (bool): Whether to print detailed information.
    
    Returns:
        dict: Dictionary containing evaluation metrics.
    """
    try:
        report_progress("Starting model evaluation", 0)
        
        # Load the model
        if model_path is None:
            model_path = MODEL_PATH
            
        try:
            report_progress("Loading model components", 10)
            model_components = joblib.load(model_path)
            if not model_components:
                if verbose:
                    print("Failed to load model components")
                return None
                
            report_progress("Model components loaded successfully", 20)
        except Exception as e:
            if verbose:
                print(f"Error loading model: {str(e)}")
            return None
        
        # Load test data
        if test_data_path is None:
            test_data_path = EMPLOYEE_DATA_PATH
            
        try:
            report_progress("Loading test data", 30)
            test_data = pd.read_csv(test_data_path)
            if verbose:
                print(f"Loaded test data with {len(test_data)} entries")
                
            report_progress("Test data loaded successfully", 40)
        except Exception as e:
            if verbose:
                print(f"Error loading test data: {str(e)}")
            return None
            
        # Extract model components
        try:
            report_progress("Preparing model components for evaluation", 50)
            model = model_components.get('model')
            tfidf = model_components.get('tfidf')
            pca = model_components.get('pca')
            label_encoder = model_components.get('label_encoder')
            
            if not all([model, tfidf, pca, label_encoder]):
                if verbose:
                    print("Missing one or more required model components")
                return None
                
            report_progress("Model components ready", 60)
        except Exception as e:
            if verbose:
                print(f"Error extracting model components: {str(e)}")
            return None
        
        # Use 20% of data for evaluation
        _, test_data = train_test_split(test_data, test_size=0.2, random_state=42)
        
        # Try to prepare features
        try:
            report_progress("Preparing test features", 70)
            
            # Process skills with TF-IDF
            if tfidf is None or not hasattr(tfidf, 'transform'):
                tfidf = TfidfVectorizer(max_features=100)
                tfidf.fit(test_data["Skills"])
            
            # Transform the skills - only use skills for features
            X_skills = tfidf.transform(test_data["Skills"]).toarray()
            
            # Use only skills as features - convert to DataFrame with named columns for consistency with training
            X = pd.DataFrame(X_skills)
            X.columns = [str(col) for col in X.columns]
            
            # Apply PCA if available
            if pca is not None and hasattr(pca, 'transform'):
                X = pca.transform(X)
            
            # Prepare target variable
            if label_encoder is None or not hasattr(label_encoder, 'transform'):
                label_encoder = LabelEncoder()
                label_encoder.fit(test_data["Field"])
            
            # Encode the target variable
            try:
                if verbose:
                    print(f"Label encoder classes: {label_encoder.classes_}")
                    print(f"Test data Field types: {test_data['Field'].apply(type).value_counts()}")
                    print(f"First few test data Field values: {test_data['Field'].head(5).tolist()}")
                
                # Force everything to strings first
                test_data["Field"] = test_data["Field"].astype(str)
                if verbose:
                    print(f"After conversion - test data Field types: {test_data['Field'].apply(type).value_counts()}")
                    
                # Then encode 
                y_true = label_encoder.transform(test_data["Field"])
            except ValueError as e:
                # Handle new categories by retraining the encoder
                if verbose:
                    print("Retraining label encoder with test data categories...")
                
                # Convert all to strings
                test_data["Field"] = test_data["Field"].astype(str)
                
                # Get all categories and retrain encoder
                all_categories = set(test_data["Field"].unique()).union(set(label_encoder.classes_))
                label_encoder.fit(list(all_categories))
                y_true = label_encoder.transform(test_data["Field"])
                
            report_progress("Test features prepared successfully", 80)
        except Exception as e:
            if verbose:
                print(f"Error preparing test features: {str(e)}")
            return {
                "accuracy": 0.0,
                "trained_at": model_components.get("trained_at", "Unknown"),
                "training_data_shape": model_components.get("training_data_shape", "Unknown"),
                "feedback_entries_used": model_components.get("feedback_entries_used", 0),
                "error": str(e)
            }
            
        # Evaluate model
        try:
            report_progress("Evaluating model performance", 90)
            y_pred = model.predict(X)
            
            # Calculate metrics
            accuracy = accuracy_score(y_true, y_pred)
            class_report = classification_report(y_true, y_pred, output_dict=True, 
                                     target_names=label_encoder.classes_)
            
            # Get feature importances if available
            if hasattr(model, 'feature_importances_'):
                feature_importances = model.feature_importances_
            else:
                feature_importances = None
                
            report_progress("Model evaluation completed successfully", 100)
            
            if verbose:
                print(f"Model accuracy: {accuracy:.4f}")
                print("\nClassification Report:")
                print(classification_report(y_true, y_pred, target_names=label_encoder.classes_))
            
            return {
                "accuracy": accuracy,
                "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
                "classification_report": class_report,
                "feature_importances": feature_importances,
                "trained_at": model_components.get("trained_at", "Unknown"),
                "training_data_shape": model_components.get("training_data_shape", "Unknown"),
                "feedback_entries_used": model_components.get("feedback_entries_used", 0)
            }
            
        except Exception as e:
            if verbose:
                print(f"Error during model evaluation: {str(e)}")
            return {
                "accuracy": 0.0,
                "trained_at": model_components.get("trained_at", "Unknown"), 
                "training_data_shape": model_components.get("training_data_shape", "Unknown"),
                "feedback_entries_used": model_components.get("feedback_entries_used", 0),
                "error": str(e),
                "note": "Model evaluation failed, but basic information is available"
            }
    except Exception as e:
        if verbose:
            print(f"Unexpected error in evaluate_model: {str(e)}")
        return None

# Alias evaluate_model function as evaluate_model_performance for backward compatibility
evaluate_model_performance = evaluate_model

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
    metrics = evaluate_model()
    if metrics:
        print(f"Model accuracy: {metrics['accuracy']:.4f}")
        print(f"Model trained at: {metrics['trained_at']}")
        print(f"Feedback entries used: {metrics['feedback_entries_used']}")
    
    print("\nTraining complete!") 