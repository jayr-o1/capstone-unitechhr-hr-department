#!/usr/bin/env python3
"""
Model Status Checker

This script checks the status of the career path recommendation model and provides
detailed information about its components, training data, and performance metrics.
"""

import os
import sys
import joblib
import numpy as np
from datetime import datetime
from pathlib import Path

# Add the project root to the path so we can import from src
project_root = Path(__file__).parents[2]
sys.path.append(str(project_root))

# Direct import of functions from recommender module
import src.recommender.recommender as recommender_module
from src.recommender.recommender import recommend_field_and_career_paths

def format_timestamp(timestamp):
    """Format a timestamp into a readable string."""
    if isinstance(timestamp, (int, float)):
        dt = datetime.fromtimestamp(timestamp)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    return str(timestamp)

def check_model_status():
    """Check the status of the career path recommendation model and print detailed information."""
    print("\n" + "="*80)
    print("CAREER PATH RECOMMENDATION MODEL STATUS")
    print("="*80)
    
    # Check for model in src/recommender/models first (where it was found)
    model_path = os.path.join(project_root, "src", "recommender", "models", "career_path_recommendation_model.pkl")
    
    print(f"Model path: {model_path}")
    print(f"Path exists: {os.path.exists(model_path)}")
    
    # Check if model file exists
    if not os.path.exists(model_path):
        print("\n⚠️  MODEL FILE NOT FOUND ⚠️")
        print("The model file does not exist in src/recommender/models.")
        print("You can train the model by running: python src/recommender/train_model.py")
        return
    
    try:
        # Load the model
        print("\nLoading model...", end="")
        model_data = joblib.load(model_path)
        print(" ✓ LOADED")
        
        # Basic model information
        print("\n" + "-"*80)
        print("BASIC MODEL INFORMATION")
        print("-"*80)
        print(f"Model version: {model_data.get('version', 'Not specified')}")
        print(f"Trained at: {format_timestamp(model_data.get('trained_at', 'Unknown'))}")
        
        # Model components
        print("\n" + "-"*80)
        print("MODEL COMPONENTS")
        print("-"*80)
        
        # Training data information
        training_shape = model_data.get('training_data_shape', {})
        if training_shape:
            print(f"Training data shape: {training_shape.get('rows', 'Unknown')} rows × {training_shape.get('columns', 'Unknown')} columns")
        else:
            print("Training data shape: Unknown")
        
        # Field model information
        print("\n" + "-"*30)
        print("FIELD MODEL")
        print("-"*30)
        if 'field_model' in model_data:
            print("Field model: ✓ Present")
            field_model = model_data['field_model']
            print(f"Model type: {type(field_model).__name__}")
            if hasattr(field_model, 'n_estimators'):
                print(f"Number of estimators: {field_model.n_estimators}")
            if hasattr(field_model, 'max_depth'):
                print(f"Max depth: {field_model.max_depth}")
            
            if 'field_cv_score' in model_data:
                print(f"Cross-validation score: {model_data['field_cv_score']:.4f} ({model_data['field_cv_score']*100:.2f}%)")
            
            if 'field_encoder' in model_data:
                field_classes = model_data['field_encoder'].classes_
                print(f"Number of field classes: {len(field_classes)}")
                print("Fields (first 10):", field_classes[:10])
        else:
            print("Field model: ✗ Missing")
        
        # Specialization model information
        print("\n" + "-"*30)
        print("SPECIALIZATION MODEL")
        print("-"*30)
        if 'specialization_model' in model_data:
            print("Specialization model: ✓ Present")
            spec_model = model_data['specialization_model']
            print(f"Model type: {type(spec_model).__name__}")
            if hasattr(spec_model, 'n_estimators'):
                print(f"Number of estimators: {spec_model.n_estimators}")
            if hasattr(spec_model, 'max_depth'):
                print(f"Max depth: {spec_model.max_depth}")
            
            if 'specialization_cv_score' in model_data:
                print(f"Cross-validation score: {model_data['specialization_cv_score']:.4f} ({model_data['specialization_cv_score']*100:.2f}%)")
            
            if 'specialization_encoder' in model_data:
                spec_classes = model_data['specialization_encoder'].classes_
                print(f"Number of specialization classes: {len(spec_classes)}")
                print("Specializations (first 10):", spec_classes[:10])
        else:
            print("Specialization model: ✗ Missing")
        
        # Vectorizer information
        print("\n" + "-"*30)
        print("VECTORIZERS")
        print("-"*30)
        if 'field_vectorizer' in model_data:
            print("Field vectorizer: ✓ Present")
            field_vec = model_data['field_vectorizer']
            if hasattr(field_vec, 'vocabulary_'):
                print(f"Field vocabulary size: {len(field_vec.vocabulary_)}")
        else:
            print("Field vectorizer: ✗ Missing")
        
        if 'specialization_vectorizer' in model_data:
            print("Specialization vectorizer: ✓ Present")
            spec_vec = model_data['specialization_vectorizer']
            if hasattr(spec_vec, 'vocabulary_'):
                print(f"Specialization vocabulary size: {len(spec_vec.vocabulary_)}")
        else:
            print("Specialization vectorizer: ✗ Missing")
        
        # PCA information
        print("\n" + "-"*30)
        print("DIMENSION REDUCTION")
        print("-"*30)
        if 'field_pca' in model_data:
            print("Field PCA: ✓ Present")
            field_pca = model_data['field_pca']
            if hasattr(field_pca, 'n_components_'):
                print(f"Field PCA components: {field_pca.n_components_}")
                print(f"Field PCA explained variance ratio: {sum(field_pca.explained_variance_ratio_):.4f} ({sum(field_pca.explained_variance_ratio_)*100:.2f}%)")
        else:
            print("Field PCA: ✗ Missing")
        
        if 'specialization_pca' in model_data:
            print("Specialization PCA: ✓ Present")
            spec_pca = model_data['specialization_pca']
            if hasattr(spec_pca, 'n_components_'):
                print(f"Specialization PCA components: {spec_pca.n_components_}")
                print(f"Specialization PCA explained variance ratio: {sum(spec_pca.explained_variance_ratio_):.4f} ({sum(spec_pca.explained_variance_ratio_)*100:.2f}%)")
        else:
            print("Specialization PCA: ✗ Missing")
        
        # Specialization skill profiles
        print("\n" + "-"*30)
        print("SKILL PROFILES")
        print("-"*30)
        if 'specialization_skill_profiles' in model_data:
            skill_profiles = model_data['specialization_skill_profiles']
            print(f"Number of specialization skill profiles: {len(skill_profiles)}")
            
            # Get a sample skill profile
            if skill_profiles:
                sample_spec = next(iter(skill_profiles))
                sample_profile = skill_profiles[sample_spec]
                print(f"\nSample skill profile for '{sample_spec}':")
                if isinstance(sample_profile, dict):
                    top_skills = sorted(sample_profile.items(), key=lambda x: x[1], reverse=True)[:5]
                    for skill, weight in top_skills:
                        print(f"  - {skill}: {weight:.4f}")
        else:
            print("Specialization skill profiles: ✗ Missing")
        
        # Field to specialization mapping
        print("\n" + "-"*30)
        print("FIELD-SPECIALIZATION MAPPING")
        print("-"*30)
        if 'specialization_to_field' in model_data:
            spec_field_map = model_data['specialization_to_field']
            print(f"Number of mapped specializations: {len(spec_field_map)}")
            
            # Count specializations per field
            field_counts = {}
            for spec, field in spec_field_map.items():
                field_counts[field] = field_counts.get(field, 0) + 1
            
            print("\nSpecializations per field:")
            for field, count in sorted(field_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
                print(f"  - {field}: {count} specialization(s)")
        else:
            print("Field-Specialization mapping: ✗ Missing")
        
        # Model size on disk
        model_size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print("\n" + "-"*80)
        print("DISK USAGE")
        print("-"*80)
        print(f"Model file size: {model_size_mb:.2f} MB")
        
        # Update recommender module with correct path
        recommender_module.MODEL_PATH = model_path
        
        # Recommender verification - test if we can make predictions
        print("\n" + "-"*80)
        print("RECOMMENDER VERIFICATION")
        print("-"*80)
        try:
            # Test with a simple example
            test_skills = ["Python", "Data Analysis", "Statistics"]
            test_exp = 3
            try:
                results = recommend_field_and_career_paths(test_skills, test_exp)
                print("Test recommendation: ✓ Success")
                if results:
                    top_field = list(results['field_probabilities'].keys())[0]
                    top_field_prob = list(results['field_probabilities'].values())[0]
                    print(f"Sample recommendation for {test_skills} with {test_exp} years experience:")
                    print(f"  - Top field: {top_field} ({top_field_prob:.2%})")
                    if 'specialization_recommendations' in results:
                        top_spec = list(results['specialization_recommendations'].keys())[0]
                        top_spec_prob = list(results['specialization_recommendations'].values())[0]
                        print(f"  - Top specialization: {top_spec} ({top_spec_prob:.2%})")
            except Exception as e:
                print(f"Test recommendation: ✗ Failed")
                print(f"  Error: {e}")
                print(f"  Error type: {type(e)}")
                import traceback
                traceback.print_exc()
        except Exception as e:
            print(f"Recommender setup: ✗ Failed")
            print(f"  Error: {e}")
            print(f"  Error type: {type(e)}")
            import traceback
            traceback.print_exc()
        
        print("\n" + "="*80)
        print("MODEL STATUS SUMMARY")
        print("="*80)
        issues = []
        
        # Check for required components
        if 'field_model' not in model_data:
            issues.append("Missing field model")
        if 'specialization_model' not in model_data:
            issues.append("Missing specialization model")
        if 'field_vectorizer' not in model_data:
            issues.append("Missing field vectorizer")
        if 'specialization_vectorizer' not in model_data:
            issues.append("Missing specialization vectorizer")
            
        if issues:
            print("⚠️  Model has issues:")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print("✅ Model appears to be complete and functional")
        
    except Exception as e:
        print(f"\n⚠️  ERROR LOADING MODEL: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_model_status() 