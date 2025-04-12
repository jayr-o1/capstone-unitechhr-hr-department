import os
import json
import csv
import pandas as pd
from datetime import datetime
from .data_loader import load_synthetic_career_path_data, load_csv_file

def load_synthetic_data(verbose=False):
    """Load synthetic career path data from CSV file."""
    return load_synthetic_career_path_data(verbose=verbose)

def load_current_career_paths():
    """Load current career paths from JSON file."""
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'career_paths.json')
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        print(f"Successfully loaded {len(data['career_paths'])} career paths from JSON file")
        return data
    except Exception as e:
        print(f"Error loading career paths JSON: {e}")
        return None

def extract_skills_from_synthetic_data(df, verbose=False):
    """Extract skills from synthetic data and organize by field and role."""
    field_roles_skills = {}
    
    if verbose:
        print(f"Available columns in dataset: {df.columns.tolist()}")
    
    # Check for Field column - handle any case or possible BOM prefix
    field_col = None
    for col in df.columns:
        if col.lower() == 'field' or col.lower().endswith('field'):
            field_col = col
            break
    
    # Check for Specialization/Career Path column
    specialization_cols = ['Specialization', 'Career Path']
    specialization_col = None
    for col_name in specialization_cols:
        if col_name in df.columns:
            specialization_col = col_name
            break
    
    # Check for Skills column
    skills_col = None
    skills_cols = ['Required Skills', 'Skills']
    for col_name in skills_cols:
        if col_name in df.columns:
            skills_col = col_name
            break
    
    # Ensure the required columns exist
    if not field_col or not specialization_col or not skills_col:
        print(f"Missing required columns. Available columns: {df.columns.tolist()}")
        missing_cols = []
        if not field_col:
            missing_cols.append('Field')
        if not specialization_col:
            missing_cols.append('Specialization/Career Path')
        if not skills_col:
            missing_cols.append('Required Skills/Skills')
        print(f"Missing columns: {', '.join(missing_cols)}")
        return {}
    
    for _, row in df.iterrows():
        field = row[field_col]
        role = row[specialization_col]
        skills_str = row[skills_col]
        
        # Skip if any required field is missing
        if pd.isna(field) or pd.isna(role) or pd.isna(skills_str):
            continue
        
        # Parse skills from string
        skills = [s.strip() for s in skills_str.split(',')]
        
        # Initialize field if not exists
        if field not in field_roles_skills:
            field_roles_skills[field] = {}
        
        # Add role and skills
        field_roles_skills[field][role] = skills
    
    return field_roles_skills

def update_career_paths(current_data, synthetic_data_df, verbose=False):
    """Update career paths with skills from synthetic data."""
    if current_data is None or synthetic_data_df is None:
        return None
    
    # Extract field, roles, and skills from synthetic data
    field_roles_skills = extract_skills_from_synthetic_data(synthetic_data_df, verbose)
    
    if not field_roles_skills:
        print("No field-role-skills data could be extracted from synthetic data.")
        return current_data
    
    # Create a mapping of title to index for faster lookup
    title_to_index = {path['title']: i for i, path in enumerate(current_data['career_paths'])}
    
    # Keep track of new paths to add
    new_paths = []
    updated_paths = []
    
    # Update existing paths and identify new ones
    for field, roles in field_roles_skills.items():
        for role, skills in roles.items():
            if role in title_to_index:
                # Update existing path
                index = title_to_index[role]
                current_data['career_paths'][index]['required_skills'] = skills
                
                # Add field if not present
                if 'field' not in current_data['career_paths'][index]:
                    current_data['career_paths'][index]['field'] = field
                
                updated_paths.append(role)
            else:
                # Add new path
                new_path = {
                    "title": role,
                    "field": field,
                    "required_skills": skills
                }
                new_paths.append(new_path)
    
    # Add new paths
    current_data['career_paths'].extend(new_paths)
    
    # Log changes
    print(f"Updated {len(updated_paths)} existing career paths")
    print(f"Added {len(new_paths)} new career paths")
    
    if len(updated_paths) > 0:
        print("\nUpdated paths:")
        for path in updated_paths[:10]:  # Show first 10 only
            print(f"- {path}")
        if len(updated_paths) > 10:
            print(f"... and {len(updated_paths) - 10} more")
    
    if len(new_paths) > 0:
        print("\nNew paths:")
        for path in new_paths[:10]:  # Show first 10 only
            print(f"- {path['title']}")
        if len(new_paths) > 10:
            print(f"... and {len(new_paths) - 10} more")
    
    return current_data

def save_updated_career_paths(data):
    """Save updated career paths to JSON file with backup."""
    if data is None:
        print("No data to save")
        return False
    
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'career_paths.json')
    
    # Create backup
    backup_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(backup_dir, f'career_paths_backup_{timestamp}.json')
    
    try:
        # Create backup first if file exists
        if os.path.exists(file_path):
            with open(file_path, 'r') as src, open(backup_path, 'w') as dst:
                dst.write(src.read())
            print(f"Created backup at {backup_path}")
        
        # Save updated data
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=4)
        
        print(f"Successfully saved updated career paths to {file_path}")
        return True
    except Exception as e:
        print(f"Error saving updated career paths: {e}")
        return False

def consolidate_career_paths():
    """Main function to consolidate synthetic data with career paths."""
    print("\n" + "="*60)
    print("CAREER PATH DATA CONSOLIDATION".center(60))
    print("="*60 + "\n")
    
    # Load data
    synthetic_data = load_synthetic_data()
    current_data = load_current_career_paths()
    
    if synthetic_data is None or current_data is None:
        print("Failed to load required data. Aborting consolidation.")
        return False
    
    # Update career paths
    updated_data = update_career_paths(current_data, synthetic_data)
    
    if updated_data is None:
        print("Failed to update career paths. Aborting consolidation.")
        return False
    
    # Save updated data
    success = save_updated_career_paths(updated_data)
    
    if success:
        print("\nConsolidation completed successfully!")
    else:
        print("\nConsolidation failed during save operation.")
    
    return success

def consolidate_data_for_model_training():
    """Prepare and consolidate data for model training."""
    print("\n" + "="*60)
    print("PREPARING DATA FOR MODEL TRAINING".center(60))
    print("="*60 + "\n")
    
    # 1. Load and process career path data
    print("Step 1: Loading and processing career path data...")
    career_path_data = load_synthetic_data(verbose=True)
    
    if career_path_data is None or len(career_path_data) == 0:
        print("Failed to load career path data. Aborting consolidation.")
        return False
    
    print(f"Successfully loaded {len(career_path_data)} career path records")
    
    # 2. Ensure career_paths.json is up to date
    print("\nStep 2: Updating career paths JSON file...")
    current_data = load_current_career_paths()
    
    if current_data is None:
        print("Failed to load current career paths. Creating a new file.")
        current_data = {"career_paths": []}
    
    updated_data = update_career_paths(current_data, career_path_data, verbose=True)
    
    if updated_data is None:
        print("Failed to update career paths. Continuing with existing data.")
    else:
        save_success = save_updated_career_paths(updated_data)
        if save_success:
            print("Successfully updated career paths JSON file")
        else:
            print("Failed to save updated career paths. Continuing with existing data.")
    
    print("\nData consolidation completed successfully!")
    return True

if __name__ == "__main__":
    consolidate_career_paths() 