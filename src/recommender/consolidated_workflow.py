#!/usr/bin/env python3
"""
Consolidated workflow for HR career recommendation system.
This script handles data generation, model training, and recommendations in a single unified workflow.
It consolidates all data sources into a single efficient structure for faster processing.
"""

import os
import sys
import argparse
import pandas as pd
import numpy as np
import json
import logging
from datetime import datetime
from utils.data_generator import SyntheticDataGenerator
from utils.model_trainer import initial_model_training, save_model_components, calculate_skill_match_percentage
from recommender import recommend_field_and_career_paths, get_career_path_match_scores

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("consolidated_workflow")

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CONSOLIDATED_DATA_PATH = os.path.join(DATA_DIR, "consolidated_data.json")
MODEL_PATH = os.path.join(BASE_DIR, "models", "career_path_recommendation_model.pkl")

def ensure_dir_exists(dir_path):
    """Ensure directory exists, create if not."""
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
        logger.info(f"Created directory: {dir_path}")

def consolidate_all_data(force_regenerate=False):
    """
    Consolidate all data sources into a single unified structure.
    
    Args:
        force_regenerate (bool): Force regeneration of data even if consolidated file exists
        
    Returns:
        dict: Consolidated data
    """
    # Check if consolidated data already exists and we're not forcing regeneration
    if os.path.exists(CONSOLIDATED_DATA_PATH) and not force_regenerate:
        logger.info(f"Loading existing consolidated data from {CONSOLIDATED_DATA_PATH}")
        try:
            with open(CONSOLIDATED_DATA_PATH, 'r') as f:
                consolidated = json.load(f)
            return consolidated
        except Exception as e:
            logger.warning(f"Error loading existing consolidated data: {str(e)}")
            logger.info("Will regenerate consolidated data")
    
    # Paths for all data files
    data_files = {
        "employee_data": os.path.join(DATA_DIR, "synthetic_employee_data.json"),
        "career_path_data": os.path.join(DATA_DIR, "synthetic_career_path_data.json"),
        "specialization_skills": os.path.join(DATA_DIR, "specialization_skills.json"),
        "skill_weights": os.path.join(DATA_DIR, "skill_weights.json"),
        "employee_weighted_data": os.path.join(DATA_DIR, "synthetic_employee_weighted_data.json"),
        "career_path_weighted_data": os.path.join(DATA_DIR, "synthetic_career_path_weighted_data.json"),
        "proficiency_test_data": os.path.join(DATA_DIR, "proficiency_test_data.json")
    }
    
    # Check if required files exist
    missing_files = [f for f, p in data_files.items() if not os.path.exists(p)]
    if missing_files:
        logger.warning(f"Missing data files: {', '.join(missing_files)}")
        logger.info("Some data may be incomplete")
    
    # Initialize consolidated data structure
    consolidated = {
        "metadata": {
            "timestamp": datetime.now().isoformat(),
            "source_files": {}
        },
        "data": {},
        "indexes": {}
    }
    
    # Load and process each data file
    for data_type, file_path in data_files.items():
        if not os.path.exists(file_path):
            logger.warning(f"Skipping missing file: {file_path}")
            continue
        
        try:
            # Load data based on type
            if data_type in ["employee_data", "career_path_data", 
                            "employee_weighted_data", "career_path_weighted_data",
                            "proficiency_test_data"]:
                # These are list-based JSON files
                with open(file_path, 'r') as f:
                    data = json.load(f)
                consolidated["data"][data_type] = data
                
                # Create indexes for faster lookups
                if data_type == "employee_data":
                    consolidated["indexes"]["employee_by_id"] = {
                        item["Employee ID"]: idx for idx, item in enumerate(data)
                    }
                    consolidated["indexes"]["employees_by_field"] = {}
                    consolidated["indexes"]["employees_by_specialization"] = {}
                    
                    for idx, item in enumerate(data):
                        field = item.get("Field")
                        specialization = item.get("Specialization")
                        
                        if field not in consolidated["indexes"]["employees_by_field"]:
                            consolidated["indexes"]["employees_by_field"][field] = []
                        consolidated["indexes"]["employees_by_field"][field].append(idx)
                        
                        if specialization not in consolidated["indexes"]["employees_by_specialization"]:
                            consolidated["indexes"]["employees_by_specialization"][specialization] = []
                        consolidated["indexes"]["employees_by_specialization"][specialization].append(idx)
                
                elif data_type == "career_path_data":
                    consolidated["indexes"]["career_path_by_id"] = {
                        item["ID"]: idx for idx, item in enumerate(data)
                    }
                    consolidated["indexes"]["career_paths_by_field"] = {}
                    consolidated["indexes"]["career_paths_by_specialization"] = {}
                    
                    for idx, item in enumerate(data):
                        field = item.get("Field")
                        specialization = item.get("Specialization")
                        
                        if field not in consolidated["indexes"]["career_paths_by_field"]:
                            consolidated["indexes"]["career_paths_by_field"][field] = []
                        consolidated["indexes"]["career_paths_by_field"][field].append(idx)
                        
                        if specialization not in consolidated["indexes"]["career_paths_by_specialization"]:
                            consolidated["indexes"]["career_paths_by_specialization"][specialization] = []
                        consolidated["indexes"]["career_paths_by_specialization"][specialization].append(idx)
            
            elif data_type in ["specialization_skills", "skill_weights"]:
                # These are dictionary-based JSON files
                with open(file_path, 'r') as f:
                    data = json.load(f)
                consolidated["data"][data_type] = data
            
            # Record the source file in metadata
            consolidated["metadata"]["source_files"][data_type] = os.path.abspath(file_path)
            logger.info(f"Loaded {data_type} from {file_path}")
            
        except Exception as e:
            logger.error(f"Error loading {data_type} from {file_path}: {str(e)}")
    
    # Add useful statistics to metadata
    consolidated["metadata"]["stats"] = {
        "employee_count": len(consolidated["data"].get("employee_data", [])),
        "career_path_count": len(consolidated["data"].get("career_path_data", [])),
        "specialization_count": len(consolidated["data"].get("specialization_skills", {})),
        "fields": list(consolidated["indexes"].get("career_paths_by_field", {}).keys())
    }
    
    # Save consolidated data
    ensure_dir_exists(os.path.dirname(CONSOLIDATED_DATA_PATH))
    with open(CONSOLIDATED_DATA_PATH, 'w') as f:
        json.dump(consolidated, f, indent=2)
    logger.info(f"Saved consolidated data to {CONSOLIDATED_DATA_PATH}")
    
    return consolidated

def generate_data(args):
    """Generate synthetic data."""
    logger.info("=== Generating Synthetic Data ===")
    
    # Set up paths
    ensure_dir_exists(DATA_DIR)
    
    employee_file = os.path.join(DATA_DIR, "synthetic_employee_data.json")
    career_file = os.path.join(DATA_DIR, "synthetic_career_path_data.json")
    
    logger.info(f"Initializing data generator with seed {args.seed}...")
    generator = SyntheticDataGenerator(seed=args.seed)
    
    # Generate data
    logger.info(f"Generating {args.employee_count} employee records and {args.career_path_count} career path records...")
    generator.generate_datasets(
        employee_count=args.employee_count,
        career_path_count=args.career_path_count,
        employee_file=employee_file,
        career_file=career_file,
        append=not args.replace
    )
    
    logger.info("Data generation complete!")
    
    # Consolidate data
    if args.consolidate:
        logger.info("Consolidating data...")
        consolidate_all_data(force_regenerate=True)
    
    return employee_file, career_file

def train_model_with_consolidated_data(args):
    """Train the career recommendation model using consolidated data."""
    logger.info("=== Training Career Recommendation Model ===")
    
    # Ensure we have consolidated data
    consolidated = consolidate_all_data()
    
    success = initial_model_training(verbose=not args.quiet)
    
    if success:
        logger.info("Model training completed successfully!")
    else:
        logger.error("Model training failed. Check logs for details.")
    
    return success

def parse_skill_proficiency(skills_input):
    """
    Parse skill-proficiency pairs from input string.
    
    Accepts formats:
    - "Skill1 Proficiency1, Skill2 Proficiency2, ..."
    - Multi-line format with one pair per line
    
    Args:
        skills_input (str): String containing skill-proficiency pairs
        
    Returns:
        tuple: (skills_list, proficiency_dict) where skills_list is list of skills
               and proficiency_dict maps skills to proficiency levels
    """
    skills_list = []
    proficiency_dict = {}
    
    # Handle both comma-separated and multi-line formats
    lines = skills_input.replace(',', '\n').split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Split by whitespace, assuming last element is proficiency and rest is skill name
        parts = line.strip().split()
        if len(parts) >= 2:
            # Last part is proficiency
            try:
                proficiency = int(parts[-1])
                # Everything else is the skill name
                skill = ' '.join(parts[:-1])
                skills_list.append(skill)
                proficiency_dict[skill] = proficiency
            except ValueError:
                # If last part is not a number, treat whole line as skill with default proficiency
                logger.warning(f"Could not parse proficiency from '{line}', using default value 70")
                skills_list.append(line)
                proficiency_dict[line] = 70
        elif len(parts) == 1:
            # Just a skill name, use default proficiency
            skill = parts[0]
            skills_list.append(skill)
            proficiency_dict[skill] = 70
    
    return skills_list, proficiency_dict

def get_recommendations_from_consolidated(skills_input, consolidated_data=None):
    """Get career recommendations based on skills using consolidated data."""
    logger.info("=== Generating Career Recommendations ===")
    
    # Parse skill-proficiency pairs
    skills_list, proficiency_dict = parse_skill_proficiency(skills_input)
    
    logger.info(f"Skills with proficiency: {', '.join([f'{s} ({p}%)' for s, p in proficiency_dict.items()])}")
    
    # Ensure we have consolidated data
    if consolidated_data is None:
        consolidated_data = consolidate_all_data()
    
    # Get recommended field and career paths
    recommendation = recommend_field_and_career_paths(skills_list)
    field = recommendation['field']
    specialization = recommendation['primary_specialization']
    career_paths = recommendation['career_paths']
    
    # Calculate match scores directly from consolidated data
    user_skills_set = set(skills_list)
    match_scores = {}
    field_match_scores = {}
    
    if consolidated_data and "data" in consolidated_data:
        for cp in consolidated_data["data"].get("career_path_data", []):
            career_path = cp["Career Path"]
            career_field = cp["Field"]
            required_skills = set(cp["Required Skills"].split(", "))
            
            if len(required_skills) > 0:
                # Calculate weighted match considering proficiency
                matched_skills = user_skills_set.intersection(required_skills)
                if matched_skills:
                    # Calculate average proficiency of matched skills
                    avg_proficiency = sum(proficiency_dict.get(skill, 70) for skill in matched_skills) / len(matched_skills)
                    # Factor in both coverage and proficiency
                    coverage = len(matched_skills) / len(required_skills)
                    # Weight: 70% coverage, 30% proficiency
                    score = (0.7 * coverage * 100) + (0.3 * avg_proficiency)
                    match_scores[career_path] = score
                    
                    # Track field-level match scores for showing alternative fields
                    if career_field not in field_match_scores:
                        field_match_scores[career_field] = []
                    field_match_scores[career_field].append(score)
                else:
                    match_scores[career_path] = 0.0
    
    # Calculate average match score per field
    field_avg_scores = {f: sum(scores)/len(scores) for f, scores in field_match_scores.items()}
    
    # Sort fields by their average match score
    sorted_fields = sorted(field_avg_scores.items(), key=lambda x: x[1], reverse=True)
    
    # Get top matches overall
    top_matches = sorted(match_scores.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Format results in structured format
    print("\n" + "="*60)
    print(f"CAREER RECOMMENDATIONS BASED ON YOUR SKILLS AND PROFICIENCY")
    print("="*60)
    
    # Primary field and specialization (from model prediction)
    print(f"\nPRIMARY RECOMMENDATION:")
    print(f"  Field: {field}")
    print(f"  Specialization: {specialization}")
    
    # Get missing skills for primary recommendation
    primary_missing_skills = []
    for cp_info in career_paths:
        if cp_info['specialization'] == specialization:
            primary_missing_skills = cp_info.get('missing_skills', [])
            break
    
    if primary_missing_skills:
        print(f"  Missing Skills:")
        for skill in sorted(primary_missing_skills)[:7]:
            print(f"    - {skill}")
        if len(primary_missing_skills) > 7:
            print(f"    - and {len(primary_missing_skills)-7} more...")
    
    # Show top matches by field
    print("\nTOP RECOMMENDATIONS BY FIELD:")
    
    # Collect career paths by field from top matches
    field_top_paths = {}
    field_missing_skills = {}
    
    # Get all career paths sorted by match score
    all_career_paths = sorted(match_scores.items(), key=lambda x: x[1], reverse=True)
    
    # Build recommendations for each field
    for career_path, score in all_career_paths:
        for cp in consolidated_data["data"].get("career_path_data", []):
            if cp["Career Path"] == career_path:
                cp_field = cp["Field"]
                cp_specialization = cp["Specialization"]
                
                if cp_field not in field_top_paths:
                    field_top_paths[cp_field] = []
                    field_missing_skills[cp_field] = {}
                
                # Check if this specialization is already in the list
                spec_exists = any(spec == cp_specialization for spec, _ in field_top_paths[cp_field])
                
                # Only add if specialization is not already in the list and we have fewer than 3
                if not spec_exists and len(field_top_paths[cp_field]) < 3:
                    field_top_paths[cp_field].append((cp_specialization, score))
                    
                    # Get missing skills for this specialization
                    required_skills = set(cp["Required Skills"].split(", "))
                    missing = required_skills - user_skills_set
                    field_missing_skills[cp_field][cp_specialization] = missing
    
    # Get list of fields to show (include primary field + top matches)
    fields_to_show = []
    
    # Always add the primary field first if it has recommendations
    if field in field_top_paths:
        fields_to_show.append((field, field_avg_scores.get(field, 0)))
    
    # Add other fields that aren't the primary field
    for field_name, avg_score in sorted_fields:
        if field_name != field and field_name in field_top_paths and len(fields_to_show) < 3:
            fields_to_show.append((field_name, avg_score))
    
    # Show recommendations for fields
    for field_name, avg_score in fields_to_show:
        print(f"\n  {field_name} ({avg_score:.2f}% average match):")
        
        for i, (spec, score) in enumerate(field_top_paths[field_name], 1):
            print(f"    {i}. {spec} ({score:.2f}% match)")
            
            # Show missing skills
            if spec in field_missing_skills[field_name] and field_missing_skills[field_name][spec]:
                missing = sorted(list(field_missing_skills[field_name][spec]))[:5]
                print(f"       Missing Skills:")
                for skill in missing:
                    print(f"         - {skill}")
                if len(field_missing_skills[field_name][spec]) > 5:
                    print(f"         - and {len(field_missing_skills[field_name][spec])-5} more...")
    
    # Show proficiency improvement suggestions
    print("\nPROFICIENCY IMPROVEMENT SUGGESTIONS:")
    for career_path, _ in top_matches[:2]:  # Focus on top 2 matches
        # Use a dictionary to prevent duplicates, with skill as key
        low_proficiency_skills_dict = {}
        for cp in consolidated_data["data"].get("career_path_data", []):
            if cp["Career Path"] == career_path:
                career_field = cp["Field"]
                career_spec = cp["Specialization"]
                required_skills = set(cp["Required Skills"].split(", "))
                for skill in user_skills_set.intersection(required_skills):
                    proficiency = proficiency_dict.get(skill, 70)
                    if proficiency < 70:  # Consider skills with proficiency below 70% as areas to improve
                        # Only add if not already in dict or has lower proficiency than existing entry
                        if skill not in low_proficiency_skills_dict or proficiency < low_proficiency_skills_dict[skill]:
                            low_proficiency_skills_dict[skill] = proficiency
        
        if low_proficiency_skills_dict:
            print(f"\n  For {career_field} - {career_spec}:")
            # Convert dict to list of tuples for sorting
            sorted_skills = sorted(low_proficiency_skills_dict.items(), key=lambda x: x[1])[:3]
            for skill, prof in sorted_skills:  # Show top 3 lowest proficiency skills
                print(f"    - Improve {skill} (current: {prof}%)")
    
    print("\n" + "="*60)
    return field, specialization, top_matches

def main():
    """Main function to run the consolidated workflow."""
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Consolidated workflow for HR career recommendation system')
    parser.add_argument('--generate-data', action='store_true',
                        help='Generate synthetic data')
    parser.add_argument('--train-model', action='store_true',
                        help='Train the recommendation model')
    parser.add_argument('--recommend', action='store_true',
                        help='Generate career recommendations')
    parser.add_argument('--consolidate', action='store_true',
                        help='Consolidate all data sources')
    parser.add_argument('--run-all', action='store_true',
                        help='Run the complete workflow (generate data, train model, recommend)')
    parser.add_argument('--employee-count', type=int, default=1000, 
                        help='Number of employee records to generate')
    parser.add_argument('--career-path-count', type=int, default=800, 
                        help='Number of career path records to generate')
    parser.add_argument('--seed', type=int, default=42, 
                        help='Random seed for reproducibility')
    parser.add_argument('--replace', action='store_true', default=True,
                        help='Replace existing data files')
    parser.add_argument('--quiet', action='store_true',
                        help='Suppress detailed output')
    parser.add_argument('--skills', type=str, default=None,
                        help='Skill-proficiency pairs (e.g., "Python 80, Java 60, SQL 75")')
    parser.add_argument('--skills-file', type=str, default=None,
                        help='File containing skill-proficiency pairs (one pair per line)')
    
    args = parser.parse_args()
    
    # If no specific action is specified, run everything
    if not any([args.generate_data, args.train_model, args.recommend, args.consolidate, args.run_all]):
        args.run_all = True
    
    # Run specified actions
    consolidated_data = None
    
    if args.consolidate or args.run_all:
        logger.info("Consolidating all data sources...")
        consolidated_data = consolidate_all_data(force_regenerate=True)
    
    if args.generate_data or args.run_all:
        generate_data(args)
        # Refresh consolidated data after generation
        consolidated_data = consolidate_all_data(force_regenerate=True)
    
    if args.train_model or args.run_all:
        train_model_with_consolidated_data(args)
    
    if args.recommend or args.run_all:
        # Get skills input, either from command line or file
        skills_input = None
        
        if args.skills_file:
            try:
                with open(args.skills_file, 'r') as f:
                    skills_input = f.read()
            except Exception as e:
                logger.error(f"Error reading skills file: {str(e)}")
        
        if args.skills:
            skills_input = args.skills
        
        if not skills_input:
            # Default skills with proficiency
            skills_input = "Python 85, Machine Learning 75, Data Analysis 80, Statistics 70, SQL 90, Communication 65"
        
        get_recommendations_from_consolidated(skills_input, consolidated_data)

if __name__ == "__main__":
    main() 