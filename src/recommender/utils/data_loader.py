import json
import os
import pandas as pd
import re
from datetime import datetime
from .error_handler import safe_load_json, safe_save_json, handle_user_error

def clean_column_names(df):
    """
    Clean column names by removing BOM markers and other special characters.
    
    Args:
        df (DataFrame): Pandas DataFrame with potentially unclean column names
        
    Returns:
        DataFrame: DataFrame with cleaned column names
    """
    clean_columns = {}
    for col in df.columns:
        # Remove BOM markers and other special characters
        clean_col = re.sub(r'^[\ufeff\ufffe\u00ff\u00fe]+', '', col)
        # Remove any other non-printable characters
        clean_col = re.sub(r'[^\x20-\x7E]', '', clean_col)
        # If the column name actually changed, add it to the mapping
        if clean_col != col:
            clean_columns[col] = clean_col
    
    # Rename columns if needed
    if clean_columns:
        df = df.rename(columns=clean_columns)
    
    return df

def load_csv_file(file_path, encoding='utf-8', verbose=False):
    """
    Flexible CSV file loader that tries multiple encodings and handles errors gracefully.
    
    Args:
        file_path (str): Path to the CSV file
        encoding (str): Initial encoding to try
        verbose (bool): Whether to print verbose messages
        
    Returns:
        DataFrame or None: Pandas DataFrame if successful, None otherwise
    """
    # Try different encodings including UTF-16 for BOM files
    encodings_to_try = ['utf-8', 'utf-16', 'utf-16le', 'utf-16be', 'latin1', 'cp1252', 'ISO-8859-1']
    if encoding in encodings_to_try:
        # Move the specified encoding to the front of the list
        encodings_to_try.remove(encoding)
        encodings_to_try.insert(0, encoding)
    
    # Try to load the file with different encodings using the C engine
    for enc in encodings_to_try:
        try:
            if verbose:
                print(f"Trying to load {file_path} with encoding: {enc} (C engine)")
            
            df = pd.read_csv(
                file_path,
                sep=',',
                quotechar='"',
                encoding=enc,
                engine='c'  # Use C engine to handle NULL bytes
            )
            
            # Clean column names to remove BOM markers
            df = clean_column_names(df)
            
            if verbose:
                print(f"Successfully loaded {len(df)} records with encoding: {enc}")
                print(f"Columns: {', '.join(df.columns)}")
            
            return df
        except UnicodeDecodeError:
            if verbose:
                print(f"Failed with encoding: {enc}")
            continue
        except Exception as e:
            if verbose:
                print(f"Error with encoding {enc}: {str(e)}")
            continue
    
    # Try with Python engine as a fallback (skipping NULL byte lines)
    try:
        if verbose:
            print("Trying with Python engine (may skip lines with NULL bytes)...")
        
        df = pd.read_csv(
            file_path,
            sep=',',
            quotechar='"',
            encoding='latin1',
            engine='python',
            on_bad_lines='skip'  # Skip bad lines
        )
        
        # Clean column names
        df = clean_column_names(df)
        
        if verbose:
            print(f"Successfully loaded {len(df)} records with Python engine")
            print(f"Columns: {', '.join(df.columns)}")
        
        return df
    except Exception as e:
        # Last resort - try with very relaxed parameters
        try:
            if verbose:
                print("Trying with very relaxed parameters...")
            
            # Try to read the file as text and preprocess it
            with open(file_path, 'rb') as f:
                content = f.read()
                # Remove NULL bytes
                content = content.replace(b'\x00', b'')
                
                # Try to detect and remove BOM
                if content.startswith(b'\xff\xfe') or content.startswith(b'\xfe\xff'):
                    # UTF-16 BOM, remove it
                    if content.startswith(b'\xff\xfe'):
                        content = content[2:]
                    elif content.startswith(b'\xfe\xff'):
                        content = content[2:]
                elif content.startswith(b'\xef\xbb\xbf'):
                    # UTF-8 BOM, remove it
                    content = content[3:]
            
            # Write to a temporary file
            temp_file = file_path + '.temp'
            with open(temp_file, 'wb') as f:
                f.write(content)
            
            # Now read with pandas
            df = pd.read_csv(
                temp_file,
                sep=',',
                quotechar='"',
                encoding='latin1',
                engine='python'
            )
            
            # Clean column names
            df = clean_column_names(df)
            
            # Clean up temp file
            try:
                os.remove(temp_file)
            except:
                pass
            
            if verbose:
                print(f"Successfully loaded {len(df)} records with preprocessed file")
                print(f"Columns: {', '.join(df.columns)}")
            
            return df
        except Exception as e2:
            if verbose:
                print(f"All loading attempts failed: {str(e2)}")
            return None

def load_synthetic_employee_data(verbose=False):
    """
    Load synthetic employee data from CSV file with flexible column mapping.
    
    Args:
        verbose (bool): Whether to print verbose messages
        
    Returns:
        DataFrame or None: Pandas DataFrame with employee data
    """
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'synthetic_employee_data.csv')
    
    df = load_csv_file(file_path, verbose=verbose)
    
    if df is None:
        if verbose:
            print("Could not load synthetic employee data")
        return None
    
    # Map expected column names to actual column names if needed
    required_columns = ['Employee ID', 'Name', 'Age', 'Years Experience', 'Skills', 'Career Goal', 'Current Role']
    
    # Check if all required columns exist (case-insensitive)
    missing_columns = [col for col in required_columns if not any(col.lower() == c.lower() for c in df.columns)]
    
    if missing_columns:
        if verbose:
            print(f"Missing required columns: {', '.join(missing_columns)}")
            print("Attempting to map columns based on semantic similarity...")
        
        # Map similar column names (simple mapping for now)
        column_mapping = {}
        for req_col in missing_columns:
            if req_col == 'Years Experience' and 'Experience' in df.columns:
                column_mapping['Experience'] = 'Years Experience'
            elif req_col == 'Career Goal' and 'Career Path' in df.columns:
                column_mapping['Career Path'] = 'Career Goal'
            elif req_col == 'Skills' and 'Required Skills' in df.columns:
                column_mapping['Required Skills'] = 'Skills'
        
        # Rename columns based on mapping
        if column_mapping:
            df = df.rename(columns=column_mapping)
            if verbose:
                print(f"Renamed columns: {column_mapping}")
    
    return df

def load_synthetic_career_path_data(verbose=False):
    """
    Load synthetic career path data from CSV file with flexible column mapping.
    
    Args:
        verbose (bool): Whether to print verbose messages
        
    Returns:
        DataFrame or None: Pandas DataFrame with career path data
    """
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'synthetic_career_path_data.csv')
    
    # After debugging, we know the file is UTF-8 encoded
    try:
        if verbose:
            print(f"Loading career path data with UTF-8 encoding")
        
        df = pd.read_csv(
            file_path,
            sep=',',
            quotechar='"',
            encoding='utf-8'
        )
        
        # Clean column names to remove BOM markers
        df = clean_column_names(df)
        
        if verbose:
            print(f"Successfully loaded {len(df)} career path records")
            print(f"Career path columns: {', '.join(df.columns)}")
        
        return df
    except Exception as e:
        if verbose:
            print(f"Error loading with UTF-8: {str(e)}, falling back to general loader")
    
    # Fall back to the general loader if direct approach fails
    df = load_csv_file(file_path, encoding='utf-8', verbose=verbose)
    
    if df is None:
        if verbose:
            print("Could not load synthetic career path data")
        return None
    
    # Check expected columns
    expected_columns = ['Field', 'Specialization', 'Required Skills', 'Experience Level']
    
    # Check if all expected columns exist (case-insensitive)
    missing_columns = [col for col in expected_columns if not any(col.lower() == c.lower() for c in df.columns)]
    
    if missing_columns:
        if verbose:
            print(f"Missing expected columns: {', '.join(missing_columns)}")
            print("Attempting to map columns based on semantic similarity...")
        
        # Map similar column names (simple mapping for now)
        column_mapping = {}
        for req_col in missing_columns:
            if req_col == 'Specialization' and 'Career Path' in df.columns:
                column_mapping['Career Path'] = 'Specialization'
            elif req_col == 'Required Skills' and 'Skills' in df.columns:
                column_mapping['Skills'] = 'Required Skills'
        
        # Rename columns based on mapping
        if column_mapping:
            df = df.rename(columns=column_mapping)
            if verbose:
                print(f"Renamed columns: {column_mapping}")
    
    return df

def load_career_paths():
    """Load career paths from JSON file."""
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'career_paths.json')
    data = safe_load_json(file_path)
    
    if not data:
        handle_user_error("Failed to load career paths data. Using default data.", exit_program=False)
        # Return default data if file cannot be loaded
        return [
            {
                "title": "Software Development",
                "required_skills": ["Programming", "Problem Solving"]
            },
            {
                "title": "Data Science",
                "required_skills": ["Python", "Statistics"]
            }
        ]
    
    return data['career_paths']

def load_skills_data():
    """Load skills data from JSON file."""
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'training_recommendations.json')
    data = safe_load_json(file_path, {})
    
    if not data:
        handle_user_error("Failed to load training recommendations. Using default data.", exit_program=False)
        # Return default data if file cannot be loaded
        return {
            "training_recommendations": {
                "Programming": ["Learn a programming language"],
                "Problem Solving": ["Practice coding challenges"]
            }
        }
    
    return data

def get_training_recommendations(skills):
    """Get training recommendations for specific skills."""
    skills_data = load_skills_data()
    recommendations = {}
    
    for skill in skills:
        if skill in skills_data.get('training_recommendations', {}):
            recommendations[skill] = skills_data['training_recommendations'][skill]
        else:
            # Default recommendation if skill not found
            recommendations[skill] = ["Search for online courses", "Practice regularly"]
    
    return recommendations

def save_user_preferences(user_data):
    """Save user preferences and recommendations."""
    # Create users directory if it doesn't exist
    users_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'users')
    os.makedirs(users_dir, exist_ok=True)
    
    # Save user data
    file_path = os.path.join(users_dir, f"{user_data['user_id']}.json")
    success = safe_save_json(user_data, file_path)
    
    if not success:
        handle_user_error("Failed to save user preferences. Your data may not be saved for next time.", exit_program=False)
    
    return success

def load_user_preferences(user_id):
    """Load user preferences and recommendations."""
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'users', f"{user_id}.json")
    return safe_load_json(file_path)

def load_all_user_preferences():
    """
    Load all user preferences from the users directory.
    
    Returns:
        list: A list of user preference dictionaries
    """
    users_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'users')
    
    # Create directory if it doesn't exist
    os.makedirs(users_dir, exist_ok=True)
    
    user_preferences = []
    
    # List all files in the users directory
    try:
        for filename in os.listdir(users_dir):
            if filename.endswith('.json'):
                file_path = os.path.join(users_dir, filename)
                user_data = safe_load_json(file_path)
                
                if user_data:
                    # Add timestamp if not present
                    if 'timestamp' not in user_data:
                        # Try to get timestamp from file modification time
                        try:
                            mtime = os.path.getmtime(file_path)
                            user_data['timestamp'] = datetime.fromtimestamp(mtime).isoformat()
                        except:
                            # If that fails, use current time
                            user_data['timestamp'] = datetime.now().isoformat()
                    
                    user_preferences.append(user_data)
    except Exception as e:
        print(f"Error loading user preferences: {str(e)}")
    
    return user_preferences

def load_predefined_users():
    """Load predefined users with their skills."""
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'predefined_users.json')
    data = safe_load_json(file_path)
    
    if not data:
        handle_user_error("Failed to load predefined users. Using default data.", exit_program=False)
        # Return default data if file cannot be loaded
        return {
            "users": [
                {
                    "id": "user1",
                    "name": "John Doe",
                    "skills": ["Python", "Problem Solving", "Cloud Platforms", "Data Analysis"]
                }
            ]
        }
    
    return data

def get_predefined_user(user_id):
    """Get a predefined user by ID."""
    predefined_users = load_predefined_users()
    
    for user in predefined_users.get('users', []):
        if user['id'] == user_id:
            return user
    
    return None

def calculate_specialization_match(user_skills, career_path):
    """
    Calculate how well a user's skills match a specialization.
    Returns a match percentage and missing skills.
    """
    required_skills = set(career_path['required_skills'])
    user_skills_set = set(user_skills)
    
    # Calculate matching skills
    matching_skills = user_skills_set.intersection(required_skills)
    missing_skills = required_skills - user_skills_set
    
    # Calculate match percentage
    if not required_skills:
        return 0, list(missing_skills)
    
    match_percentage = round((len(matching_skills) / len(required_skills)) * 100)
    
    return match_percentage, list(missing_skills)

def recommend_specializations_based_on_skills(user_skills, top_n=3):
    """
    Recommend specializations based on user skills.
    Returns a list of dictionaries with specialization, match percentage, and missing skills.
    """
    career_paths = load_career_paths()
    recommendations = []
    
    for path in career_paths:
        match_percentage, missing_skills = calculate_specialization_match(user_skills, path)
        
        recommendations.append({
            "specialization": path['title'],
            "match_percentage": match_percentage,
            "missing_skills": missing_skills
        })
    
    # Sort by match percentage
    recommendations.sort(key=lambda x: x['match_percentage'], reverse=True)
    
    # Group specializations by field
    field_recommendations = {}
    for rec in recommendations:
        field = get_field_from_specialization(rec['specialization'])
        if field not in field_recommendations:
            field_recommendations[field] = []
        field_recommendations[field].append(rec)
    
    # Find the best field based on average match percentage
    best_field = max(field_recommendations.items(), 
                     key=lambda x: sum(r['match_percentage'] for r in x[1]) / len(x[1]))
    
    top_recommendations = recommendations[:top_n]
    
    return {
        "recommended_field": best_field[0],
        "top_specializations": top_recommendations,
        "all_recommendations": recommendations
    }

def get_field_from_specialization(specialization):
    """Map specialization to a broader field."""
    field_mapping = {
        # Technology fields
        "Software Development": "Computer Science",
        "Data Science": "Computer Science",
        "Cybersecurity": "Computer Science",
        "Cloud Computing": "Computer Science",
        
        # Criminal Justice fields
        "Criminology": "Criminal Justice",
        "Forensic Science": "Criminal Justice",
        "Law Enforcement": "Criminal Justice",
        "Criminal Justice": "Criminal Justice",
        
        # Healthcare fields
        "Healthcare Administration": "Healthcare",
        "Nursing": "Healthcare",
        "Physical Therapy": "Healthcare",
        "Speech-Language Pathology": "Healthcare",
        "Dentistry": "Healthcare",
        "Pharmacy": "Healthcare",
        "Veterinary Medicine": "Healthcare",
        
        # Psychology fields
        "Clinical Psychology": "Psychology",
        "Industrial-Organizational Psychology": "Psychology",
        
        # Business fields
        "Marketing": "Business",
        "Finance": "Business",
        "Human Resources": "Business",
        "Hospitality Management": "Business",
        
        # Engineering fields
        "Mechanical Engineering": "Engineering",
        "Civil Engineering": "Engineering",
        
        # Education fields
        "Elementary Education": "Education",
        "Secondary Education": "Education",
        
        # Arts & Design fields
        "Graphic Design": "Arts & Design",
        "Film Production": "Arts & Design",
        "Architecture": "Arts & Design",
        "Interior Design": "Arts & Design",
        
        # Other professional fields
        "Legal Practice": "Law",
        "Environmental Science": "Environmental Science",
        "Journalism": "Communications",
        "Social Work": "Social Services",
        "Agriculture": "Agriculture",
        "Urban Planning": "Urban Planning"
    }
    
    return field_mapping.get(specialization, "Other") 