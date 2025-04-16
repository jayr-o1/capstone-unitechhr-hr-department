#!/usr/bin/env python3
"""
Model Optimizer

This script optimizes the career recommendation model:
1. Reduces model size by using more efficient parameters
2. Ensures all required components are included
3. Samples data to achieve good performance with reasonable training time
"""

import os
import sys
import time
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

# Add the project root to the path so we can import from src
project_root = Path(__file__).parents[2]
sys.path.append(str(project_root))

def optimize_model(sample_size=50000, max_features=500, n_estimators=100, n_components=50, random_state=42):
    """
    Optimize the career recommendation model by retraining with better parameters.
    
    Args:
        sample_size (int): Number of employee records to use for training
        max_features (int): Maximum features for TF-IDF vectorizer
        n_estimators (int): Number of trees in RandomForest
        n_components (int): Number of PCA components
        random_state (int): Random seed for reproducibility
        
    Returns:
        dict: Status and metrics of the optimization process
    """
    print(f"\n{'='*80}")
    print(f"CAREER RECOMMENDATION MODEL OPTIMIZER")
    print(f"{'='*80}\n")
    
    start_time = time.time()
    
    print(f"Parameters:")
    print(f"- Sample size: {sample_size:,} employee records")
    print(f"- Max TF-IDF features: {max_features}")
    print(f"- Random Forest estimators: {n_estimators}")
    print(f"- PCA components: {n_components}")
    
    # Source and destination paths - UPDATED to use the correct paths
    recommender_dir = os.path.dirname(os.path.abspath(__file__))
    employee_data_path = os.path.join(recommender_dir, "data", "synthetic_employee_data.csv")
    career_path_data_path = os.path.join(recommender_dir, "data", "synthetic_career_path_data.csv")
    
    # Create models directory if it doesn't exist
    models_dir = os.path.join(recommender_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, "career_path_recommendation_model.pkl")
    
    print(f"\nLoading data...")
    print(f"Employee data path: {employee_data_path}")
    print(f"Career path data path: {career_path_data_path}")
    
    # Check if files exist
    if not os.path.exists(employee_data_path):
        print(f"Error: Employee data file not found at {employee_data_path}")
        return {"status": "error", "message": "Employee data file not found"}
    
    if not os.path.exists(career_path_data_path):
        print(f"Error: Career path data file not found at {career_path_data_path}")
        return {"status": "error", "message": "Career path data file not found"}
    
    # Load data
    employees_df = pd.read_csv(employee_data_path)
    career_paths_df = pd.read_csv(career_path_data_path)
    
    print(f"Loaded {len(employees_df):,} employee records and {len(career_paths_df):,} career paths")
    
    # Sample data if needed
    if sample_size and sample_size < len(employees_df):
        print(f"Sampling {sample_size:,} records from {len(employees_df):,} total records")
        employees_sample = employees_df.sample(sample_size, random_state=random_state)
    else:
        employees_sample = employees_df
        print(f"Using all {len(employees_sample):,} employee records")
    
    # Check column names
    print(f"Employee data columns: {employees_sample.columns.tolist()}")
    print(f"Career paths columns: {career_paths_df.columns.tolist()}")
    
    # Create a direct mapping from Career Goal (specialization) to Field 
    specialization_to_field = {}
    for _, row in career_paths_df.iterrows():
        specialization = row['Specialization']
        field = row['Field']
        specialization_to_field[specialization] = field
    
    # Map Career Goal to Field and Specialization
    # In this dataset, "Career Goal" is actually the specialization
    employees_sample['Field'] = employees_sample['Career Goal'].map(
        lambda x: specialization_to_field.get(x, 'Unknown')
    )
    employees_sample['Specialization'] = employees_sample['Career Goal']
    
    # Filter out unknown fields
    valid_employees = employees_sample[employees_sample['Field'] != 'Unknown']
    
    if len(valid_employees) == 0:
        print("Error: No valid field mappings found. Checking data format...")
        # Sample a few rows to see the mapping issue
        print("\nSample employee careers:")
        for goal in employees_sample['Career Goal'].sample(5).tolist():
            print(f"  Career Goal: {goal}")
        
        print("\nSample specializations in career paths:")
        for spec in career_paths_df['Specialization'].sample(5).tolist():
            print(f"  Specialization: {spec}")
        
        return {"status": "error", "message": "No valid mappings found"}
    
    print(f"Using {len(valid_employees):,} records with valid field mappings")
    
    # Extract features, fields, and specializations
    skills = valid_employees["Skills"].tolist()
    experience = valid_employees["Years Experience"].astype(float).tolist()
    fields = valid_employees["Field"].tolist()
    specializations = valid_employees["Specialization"].tolist()
    
    print(f"\nPreparing data for model training...")
    print(f"Number of unique fields: {len(set(fields))}")
    print(f"Number of unique specializations: {len(set(specializations))}")
    
    # Create and fit vectorizers
    print(f"Creating TF-IDF vectorizers...")
    field_vectorizer = TfidfVectorizer(max_features=max_features)
    field_vectorizer.fit(skills)
    
    specialization_vectorizer = TfidfVectorizer(max_features=max_features)
    specialization_vectorizer.fit(skills)
    
    # Transform skills to TF-IDF features
    print(f"Transforming features with TF-IDF...")
    X_field = field_vectorizer.transform(skills).toarray()
    X_specialization = specialization_vectorizer.transform(skills).toarray()
    
    # Add experience as a feature
    print(f"Adding experience as a feature...")
    X_field_exp = np.hstack([X_field, np.array(experience).reshape(-1, 1)])
    X_specialization_exp = np.hstack([X_specialization, np.array(experience).reshape(-1, 1)])
    
    # Apply PCA to reduce dimensionality
    print(f"Applying PCA to reduce dimensionality to {n_components} components...")
    field_pca = PCA(n_components=min(n_components, X_field_exp.shape[1]), random_state=random_state)
    X_field_pca = field_pca.fit_transform(X_field_exp)
    
    specialization_pca = PCA(n_components=min(n_components, X_specialization_exp.shape[1]), random_state=random_state)
    X_specialization_pca = specialization_pca.fit_transform(X_specialization_exp)
    
    # Encode categorical target variables
    print(f"Encoding target variables...")
    field_encoder = LabelEncoder()
    y_field = field_encoder.fit_transform(fields)
    
    specialization_encoder = LabelEncoder()
    y_specialization = specialization_encoder.fit_transform(specializations)
    
    # Train field prediction model
    print(f"\nTraining field prediction model...")
    field_model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=15,
        random_state=random_state,
        n_jobs=-1
    )
    
    field_cv_scores = cross_val_score(field_model, X_field_pca, y_field, cv=5, n_jobs=-1)
    field_cv_score = np.mean(field_cv_scores)
    print(f"Field model CV score: {field_cv_score:.4f} ({field_cv_score*100:.2f}%)")
    
    field_model.fit(X_field_pca, y_field)
    
    # Train specialization prediction model
    print(f"\nTraining specialization prediction model...")
    specialization_model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=15,
        random_state=random_state,
        n_jobs=-1
    )
    
    specialization_cv_scores = cross_val_score(specialization_model, X_specialization_pca, y_specialization, cv=5, n_jobs=-1)
    specialization_cv_score = np.mean(specialization_cv_scores)
    print(f"Specialization model CV score: {specialization_cv_score:.4f} ({specialization_cv_score*100:.2f}%)")
    
    specialization_model.fit(X_specialization_pca, y_specialization)
    
    # Create skill profiles for each specialization
    print(f"\nCreating skill profiles for specializations...")
    specialization_skill_profiles = {}
    
    for specialization in specialization_encoder.classes_:
        # Get employees with this specialization
        spec_employees = valid_employees[valid_employees["Specialization"] == specialization]
        
        if len(spec_employees) > 0:
            # Extract all skills from these employees
            all_skills = []
            for skills_str in spec_employees["Skills"]:
                skills_list = [s.strip() for s in skills_str.split(",")]
                all_skills.extend(skills_list)
            
            # Calculate skill frequencies
            skill_freq = {}
            for skill in all_skills:
                skill_freq[skill] = skill_freq.get(skill, 0) + 1
            
            # Normalize frequencies to get weights
            total = sum(skill_freq.values())
            skill_weights = {skill: count / total for skill, count in skill_freq.items()}
            
            # Store skill profile
            specialization_skill_profiles[specialization] = skill_weights
    
    print(f"Created skill profiles for {len(specialization_skill_profiles)} specializations")
    
    # Create training data shape information
    training_data_shape = {
        "rows": len(valid_employees),
        "columns": X_field.shape[1] + 1  # +1 for experience
    }
    
    # Save the model components
    print(f"\nSaving optimized model to {model_path}...")
    model_data = {
        "version": "3.0",
        "trained_at": datetime.now().isoformat(),
        "training_data_shape": training_data_shape,
        
        # Models
        "field_model": field_model,
        "specialization_model": specialization_model,
        
        # Vectorizers
        "field_vectorizer": field_vectorizer,
        "specialization_vectorizer": specialization_vectorizer,
        
        # Dimensionality reduction
        "field_pca": field_pca,
        "specialization_pca": specialization_pca,
        
        # Encoders
        "field_encoder": field_encoder,
        "specialization_encoder": specialization_encoder,
        
        # Mappings and profiles
        "specialization_to_field": specialization_to_field,
        "specialization_skill_profiles": specialization_skill_profiles,
        
        # Performance metrics
        "field_cv_score": field_cv_score,
        "specialization_cv_score": specialization_cv_score,
        
        # Parameters used
        "parameters": {
            "sample_size": sample_size,
            "max_features": max_features,
            "n_estimators": n_estimators,
            "n_components": n_components,
            "random_state": random_state
        }
    }
    
    # Save model
    joblib.dump(model_data, model_path)
    
    # Save model metadata separately for quick access
    metadata = {
        "version": model_data["version"],
        "trained_at": model_data["trained_at"],
        "field_cv_score": model_data["field_cv_score"],
        "specialization_cv_score": model_data["specialization_cv_score"],
        "field_classes": len(field_encoder.classes_),
        "specialization_classes": len(specialization_encoder.classes_),
        "sample_size": sample_size
    }
    
    metadata_path = os.path.join(models_dir, "model_metadata.json")
    import json
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    
    # Report completion
    end_time = time.time()
    duration = end_time - start_time
    print(f"\nModel optimization completed in {duration:.2f} seconds ({duration/60:.2f} minutes)")
    print(f"Optimized model saved to: {model_path}")
    print(f"Model size: {os.path.getsize(model_path) / (1024*1024):.2f} MB")
    
    return {
        "status": "success",
        "field_cv_score": field_cv_score,
        "specialization_cv_score": specialization_cv_score,
        "model_path": model_path,
        "duration": duration
    }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Optimize the career recommendation model")
    parser.add_argument("--sample-size", type=int, default=100000,
                        help="Number of employee records to use for training")
    parser.add_argument("--max-features", type=int, default=500,
                        help="Maximum features for TF-IDF vectorizers")
    parser.add_argument("--n-estimators", type=int, default=100,
                        help="Number of trees in RandomForest models")
    parser.add_argument("--n-components", type=int, default=50,
                        help="Number of PCA components")
    parser.add_argument("--random-state", type=int, default=42,
                        help="Random seed for reproducibility")
    
    args = parser.parse_args()
    
    optimize_model(
        sample_size=args.sample_size,
        max_features=args.max_features,
        n_estimators=args.n_estimators,
        n_components=args.n_components,
        random_state=args.random_state
    ) 