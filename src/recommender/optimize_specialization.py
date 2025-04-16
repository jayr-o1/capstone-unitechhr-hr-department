#!/usr/bin/env python3
"""
Specialization Model Optimizer

This script is dedicated to improving the specialization prediction accuracy:
1. Uses balanced sampling to ensure adequate representation of all specializations
2. Creates more granular features for specialization distinction
3. Uses advanced model parameters optimized for specialization prediction
4. Extracts and uses specialization-specific keywords
"""

import os
import sys
import time
import joblib
import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from sklearn.metrics import accuracy_score, classification_report

# Add the project root to the path so we can import from src
project_root = Path(__file__).parents[2]
sys.path.append(str(project_root))

# Custom JSON encoder to handle non-serializable numpy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, np.floating, np.bool_)):
            return obj.item()
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

def optimize_specialization_model(
    sample_size=150000, 
    specialization_features=1000, 
    n_estimators=200, 
    n_components=100, 
    min_samples_per_spec=25,
    force_update=False,
    random_state=42
):
    """
    Optimize the specialization prediction model with advanced techniques.
    
    Args:
        sample_size (int): Maximum number of employee records to use for training
        specialization_features (int): Maximum features for specialization TF-IDF vectorizer
        n_estimators (int): Number of trees in RandomForest
        n_components (int): Number of PCA components
        min_samples_per_spec (int): Minimum number of samples per specialization
        force_update (bool): Force update even if performance doesn't improve
        random_state (int): Random seed for reproducibility
        
    Returns:
        dict: Status and metrics of the optimization process
    """
    print(f"\n{'='*80}")
    print(f"SPECIALIZATION MODEL OPTIMIZER")
    print(f"{'='*80}\n")
    
    start_time = time.time()
    
    print(f"Parameters:")
    print(f"- Sample size: {sample_size:,} employee records")
    print(f"- Specialization features: {specialization_features}")
    print(f"- Random Forest estimators: {n_estimators}")
    print(f"- PCA components: {n_components}")
    print(f"- Min samples per specialization: {min_samples_per_spec}")
    print(f"- Force update: {force_update}")
    
    # Paths
    recommender_dir = os.path.dirname(os.path.abspath(__file__))
    employee_data_path = os.path.join(recommender_dir, "data", "synthetic_employee_data.csv")
    career_path_data_path = os.path.join(recommender_dir, "data", "synthetic_career_path_data.csv")
    
    # Create models directory if it doesn't exist
    models_dir = os.path.join(recommender_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    # Use existing model if available, otherwise create new
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
    
    # Check column names
    print(f"Employee data columns: {employees_df.columns.tolist()}")
    print(f"Career paths columns: {career_paths_df.columns.tolist()}")
    
    # Create a direct mapping from Career Goal (specialization) to Field 
    specialization_to_field = {}
    for _, row in career_paths_df.iterrows():
        specialization = row['Specialization']
        field = row['Field']
        specialization_to_field[specialization] = field
    
    # Map Career Goal to Field and Specialization
    # In this dataset, "Career Goal" is actually the specialization
    employees_df['Field'] = employees_df['Career Goal'].map(
        lambda x: specialization_to_field.get(x, 'Unknown')
    )
    employees_df['Specialization'] = employees_df['Career Goal']
    
    # Filter out unknown fields
    valid_employees = employees_df[employees_df['Field'] != 'Unknown'].copy()
    
    if len(valid_employees) == 0:
        print("Error: No valid field mappings found. Checking data format...")
        # Sample a few rows to see the mapping issue
        print("\nSample employee careers:")
        for goal in employees_df['Career Goal'].sample(5).tolist():
            print(f"  Career Goal: {goal}")
        
        print("\nSample specializations in career paths:")
        for spec in career_paths_df['Specialization'].sample(5).tolist():
            print(f"  Specialization: {spec}")
        
        return {"status": "error", "message": "No valid mappings found"}
    
    print(f"Valid records: {len(valid_employees):,} with known field mappings")
    
    # Count number of samples per specialization
    spec_counts = valid_employees['Specialization'].value_counts()
    print(f"Total unique specializations: {len(spec_counts)}")
    print(f"Specializations with less than {min_samples_per_spec} samples: {sum(spec_counts < min_samples_per_spec)}")
    
    # Create a balanced sample with adequate representation for each specialization
    print(f"\nCreating balanced sample...")
    balanced_samples = []
    
    for spec, count in spec_counts.items():
        spec_df = valid_employees[valid_employees['Specialization'] == spec]
        if count > min_samples_per_spec:
            # Take min_samples_per_spec samples or more if available
            balanced_samples.append(spec_df.sample(min(count, min_samples_per_spec*2), random_state=random_state))
        else:
            # Take all available samples for rare specializations
            balanced_samples.append(spec_df)
    
    # Combine all samples
    balanced_df = pd.concat(balanced_samples)
    
    # Cap the total number of samples if needed
    if len(balanced_df) > sample_size:
        print(f"Sampling {sample_size:,} records from {len(balanced_df):,} balanced records")
        balanced_df = balanced_df.sample(sample_size, random_state=random_state)
    
    print(f"Final training sample: {len(balanced_df):,} records")
    print(f"Unique specializations in sample: {balanced_df['Specialization'].nunique()}")
    
    # Extract specialization-specific keywords from career paths
    print(f"\nExtracting specialization keywords...")
    spec_keywords = {}
    
    for _, row in career_paths_df.iterrows():
        spec = row['Specialization']
        if 'Required Skills' in row:
            skills = [s.strip() for s in row['Required Skills'].split(',')]
            spec_keywords[spec] = skills
    
    # Create additional features for specialization prediction
    print(f"Creating specialization-specific features...")
    
    # Add keyword presence features
    def extract_keyword_features(skills_str, keywords_dict):
        """Extract keyword presence features for each specialization"""
        skills_list = [s.strip().lower() for s in skills_str.split(',')]
        skills_set = set(skills_list)
        
        # Calculate a match score for each specialization
        features = {}
        for spec, keywords in keywords_dict.items():
            if keywords:
                keywords_lower = [k.lower() for k in keywords]
                matches = sum(1 for k in keywords_lower if k in skills_set)
                match_ratio = matches / len(keywords) if keywords else 0
                features[f"spec_match_{spec}"] = match_ratio
        
        return features
    
    # Apply keyword features to each employee
    keyword_features = balanced_df['Skills'].apply(
        lambda x: extract_keyword_features(x, spec_keywords)
    ).tolist()
    
    # Convert to DataFrame
    keyword_df = pd.DataFrame(keyword_features)
    keyword_df = keyword_df.fillna(0)  # Replace NaN with 0
    
    # Extract features for modeling
    skills = balanced_df["Skills"].tolist()
    experience = balanced_df["Years Experience"].astype(float).values.reshape(-1, 1)
    fields = balanced_df["Field"].tolist()
    specializations = balanced_df["Specialization"].tolist()
    
    print(f"\nPreparing specialized training data...")
    print(f"Number of unique fields: {len(set(fields))}")
    print(f"Number of unique specializations: {len(set(specializations))}")
    
    # Create and fit vectorizers with increased features for specialization
    print(f"Creating enhanced TF-IDF vectorizer for specializations...")
    specialization_vectorizer = TfidfVectorizer(
        max_features=specialization_features,
        ngram_range=(1, 2),  # Include bigrams for more context
        stop_words='english'  # Remove common English words
    )
    X_spec_tfidf = specialization_vectorizer.fit_transform(skills)
    
    # Scale experience feature
    experience_scaler = StandardScaler()
    X_exp_scaled = experience_scaler.fit_transform(experience)
    
    # Combine TF-IDF features, experience, and keyword features
    print(f"Combining features...")
    X_combined = np.hstack([
        X_spec_tfidf.toarray(), 
        X_exp_scaled
    ])
    
    # Add keyword features if available
    if not keyword_df.empty:
        X_combined = np.hstack([
            X_combined,
            keyword_df.values
        ])
    
    print(f"Combined feature matrix shape: {X_combined.shape}")
    
    # Apply PCA to reduce dimensionality while preserving variance
    print(f"Applying PCA to reduce dimensionality to {n_components} components...")
    spec_pca = PCA(n_components=min(n_components, X_combined.shape[1]), random_state=random_state)
    X_pca = spec_pca.fit_transform(X_combined)
    
    explained_var = sum(spec_pca.explained_variance_ratio_)
    print(f"PCA explained variance: {explained_var:.4f} ({explained_var*100:.2f}%)")
    
    # Encode categorical target variables
    print(f"Encoding target variables...")
    specialization_encoder = LabelEncoder()
    y_specialization = specialization_encoder.fit_transform(specializations)
    
    # Train specialization prediction model with advanced parameters
    print(f"\nTraining enhanced specialization prediction model...")
    specialization_model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=20,  # Deeper trees for more complex patterns
        min_samples_leaf=2,  # Allow smaller leaf nodes
        min_samples_split=5,  # Require more samples to split
        max_features='sqrt',  # Standard for Random Forest
        class_weight='balanced',  # Handle imbalanced classes
        bootstrap=True,  # Use bootstrap samples
        oob_score=True,  # Get out-of-bag score estimate
        random_state=random_state,
        n_jobs=-1  # Use all available cores
    )
    
    # Cross-validate to estimate performance
    print(f"Performing cross-validation...")
    cv_scores = cross_val_score(
        specialization_model, 
        X_pca, 
        y_specialization, 
        cv=5, 
        n_jobs=-1
    )
    
    cv_score = float(np.mean(cv_scores))  # Convert to Python float for JSON serialization
    print(f"Specialization model CV score: {cv_score:.4f} ({cv_score*100:.2f}%)")
    
    # Train the final model on all data
    specialization_model.fit(X_pca, y_specialization)
    
    # Get out-of-bag accuracy
    oob_score = float(specialization_model.oob_score_)  # Convert to Python float
    print(f"Specialization model OOB score: {oob_score:.4f} ({oob_score*100:.2f}%)")
    
    # Create skill profiles for each specialization
    print(f"\nCreating skill profiles for specializations...")
    specialization_skill_profiles = {}
    
    for specialization in specialization_encoder.classes_:
        # Get employees with this specialization
        spec_employees = balanced_df[balanced_df["Specialization"] == specialization]
        
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
            skill_weights = {skill: float(count / total) for skill, count in skill_freq.items()}  # Convert to Python float
            
            # Store skill profile
            specialization_skill_profiles[specialization] = skill_weights
    
    print(f"Created skill profiles for {len(specialization_skill_profiles)} specializations")
    
    # If existing model exists, load it and update only the specialization components
    model_data = {}
    should_update = True
    
    if os.path.exists(model_path):
        print(f"\nLoading existing model to update specialization components...")
        try:
            model_data = joblib.load(model_path)
            original_specialization_cv_score = model_data.get('specialization_cv_score', 0)
            print(f"Original specialization CV score: {original_specialization_cv_score:.4f} ({original_specialization_cv_score*100:.2f}%)")
            print(f"New specialization CV score: {cv_score:.4f} ({cv_score*100:.2f}%)")
            
            if cv_score > original_specialization_cv_score:
                print(f"Improvement: +{(cv_score - original_specialization_cv_score)*100:.2f}%")
                should_update = True
            else:
                print(f"WARNING: No improvement in CV score!")
                if force_update:
                    print("Forcing update due to force_update flag.")
                    should_update = True
                else:
                    print("Not updating model. Use --force-update to override.")
                    should_update = False
        except Exception as e:
            print(f"Error loading existing model: {e}")
            print("Creating new model data dictionary...")
            # Set version to 3.0 for new models
            model_data['version'] = "3.0"
            should_update = True
    else:
        print(f"\nCreating new model data dictionary...")
        # Set version to 3.0 for new models
        model_data['version'] = "3.0"
        should_update = True
    
    # Save detailed results regardless of whether we update the model
    results = {
        "version": model_data.get("version", "3.0"),
        "trained_at": datetime.now().isoformat(),
        "specialization_cv_score": cv_score,
        "specialization_oob_score": oob_score,
        "cv_scores": [float(s) for s in cv_scores],  # Convert to Python float
        "pca_explained_variance": float(explained_var),
        "feature_count": int(X_combined.shape[1]),
        "sample_size": int(len(balanced_df)),
        "specialization_classes": int(len(specialization_encoder.classes_)),
        "specialization_distribution": {k: int(v) for k, v in dict(balanced_df['Specialization'].value_counts().head(20)).items()},
        "parameters": {
            "sample_size": int(len(balanced_df)),
            "max_features": int(specialization_features),
            "n_estimators": int(n_estimators),
            "n_components": int(n_components),
            "min_samples_per_spec": int(min_samples_per_spec),
            "random_state": int(random_state)
        }
    }
    
    results_path = os.path.join(models_dir, "specialization_optimization_results.json")
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2, cls=NumpyEncoder)
    
    # Only update the model if needed
    if should_update:
        # Update model data with new specialization components
        model_data.update({
            "trained_at": datetime.now().isoformat(),
            
            # Specialization model components
            "specialization_model": specialization_model,
            "specialization_vectorizer": specialization_vectorizer,
            "specialization_pca": spec_pca,
            "specialization_encoder": specialization_encoder,
            "specialization_experience_scaler": experience_scaler,
            "specialization_to_field": specialization_to_field,
            "specialization_skill_profiles": specialization_skill_profiles,
            
            # Performance metrics
            "specialization_cv_score": cv_score,
            "specialization_oob_score": oob_score,
            
            # Parameters used
            "specialization_parameters": {
                "sample_size": len(balanced_df),
                "max_features": specialization_features,
                "n_estimators": n_estimators,
                "n_components": n_components,
                "min_samples_per_spec": min_samples_per_spec,
                "random_state": random_state
            }
        })
        
        # Save model
        print(f"\nSaving optimized model to {model_path}...")
        joblib.dump(model_data, model_path)
        print(f"Model size: {os.path.getsize(model_path) / (1024*1024):.2f} MB")
    else:
        print(f"\nSkipping model update as performance did not improve.")
    
    # Report completion
    end_time = time.time()
    duration = end_time - start_time
    print(f"\nSpecialization model optimization completed in {duration:.2f} seconds ({duration/60:.2f} minutes)")
    print(f"Detailed results saved to: {results_path}")
    
    return {
        "status": "success" if should_update else "skipped",
        "specialization_cv_score": cv_score,
        "specialization_oob_score": oob_score,
        "model_updated": should_update,
        "model_path": model_path if should_update else None,
        "duration": duration
    }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Optimize the specialization prediction model")
    parser.add_argument("--sample-size", type=int, default=150000,
                        help="Number of employee records to use for training")
    parser.add_argument("--specialization-features", type=int, default=1000,
                        help="Maximum features for specialization TF-IDF vectorizer")
    parser.add_argument("--n-estimators", type=int, default=200,
                        help="Number of trees in RandomForest model")
    parser.add_argument("--n-components", type=int, default=100,
                        help="Number of PCA components")
    parser.add_argument("--min-samples", type=int, default=25,
                        help="Minimum samples per specialization")
    parser.add_argument("--force-update", action="store_true",
                        help="Force model update even if performance doesn't improve")
    parser.add_argument("--random-state", type=int, default=42,
                        help="Random seed for reproducibility")
    
    args = parser.parse_args()
    
    optimize_specialization_model(
        sample_size=args.sample_size,
        specialization_features=args.specialization_features,
        n_estimators=args.n_estimators,
        n_components=args.n_components,
        min_samples_per_spec=args.min_samples,
        force_update=args.force_update,
        random_state=args.random_state
    ) 