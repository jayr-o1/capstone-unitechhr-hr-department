#!/usr/bin/env python3
"""
Diverse data generation script for the career recommender system.
This script generates diverse synthetic data to enhance model training.
"""

import os
import sys
import json
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Add the parent directory to the path so we can import the recommender module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from recommender import career_fields

def ensure_directory_exists(directory_path):
    """Ensure the specified directory exists."""
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)

def generate_diverse_employee_data(num_samples=500):
    """
    Generate diverse synthetic employee data with varied skills and experience.
    
    Args:
        num_samples (int): Number of employee records to generate
        
    Returns:
        pd.DataFrame: DataFrame with synthetic employee data
    """
    print(f"Generating {num_samples} diverse employee records...")
    
    # Lists to store generated data
    records = []
    
    # Create more diverse skill combinations
    for _ in range(num_samples):
        # Randomly select a field
        field = random.choice(list(career_fields.keys()))
        
        # Randomly select a career goal from the field
        career_goal = random.choice(career_fields[field]["roles"])
        
        # Get skills for this field
        field_skills = career_fields[field]["skills"]
        
        # Add some skills from other fields (cross-domain skills)
        other_fields = [f for f in career_fields.keys() if f != field]
        if other_fields:
            other_field = random.choice(other_fields)
            other_skills = career_fields[other_field]["skills"]
            # Add 0-3 skills from other domains
            num_other_skills = random.randint(0, 3)
            if num_other_skills > 0 and other_skills:
                other_skills_sample = random.sample(other_skills, min(num_other_skills, len(other_skills)))
            else:
                other_skills_sample = []
        else:
            other_skills_sample = []
        
        # Randomly select 3-8 skills from this field
        num_skills = random.randint(3, 8)
        if num_skills <= len(field_skills):
            selected_skills = random.sample(field_skills, num_skills)
        else:
            selected_skills = field_skills.copy()
            
        # Combine skills
        all_skills = selected_skills + other_skills_sample
        
        # Randomly shuffle skills to create more variety
        random.shuffle(all_skills)
        
        # Create skills string
        skills_string = ", ".join(all_skills)
        
        # Generate random experience (0-20 years)
        experience = f"{random.randint(0, 20)}+ years"
        
        # Generate salary based on experience and field (adding some randomness)
        base_salary = 50000
        experience_factor = int(experience.split("+")[0]) * 2000
        field_factor = {"Computer Science": 20000, "Engineering": 18000, 
                        "Healthcare & Medicine": 25000, "Law & Legal Studies": 22000, 
                        "Accountancy": 15000}.get(field, 10000)
        random_factor = random.randint(-10000, 10000)
        salary = base_salary + experience_factor + field_factor + random_factor
        
        # Create the record
        record = {
            "ID": f"EMP{random.randint(10000, 99999)}",
            "Name": f"Employee {_+1}",  # Placeholder name
            "Age": random.randint(22, 65),
            "Gender": random.choice(["Male", "Female", "Non-binary"]),
            "Education": random.choice(["Bachelor's", "Master's", "PhD", "High School", "Associate's"]),
            "Field": field,
            "Career Goal": career_goal,
            "Skills": skills_string,
            "Experience": experience,
            "Salary": salary,
            "Location": random.choice(["New York", "San Francisco", "Chicago", "Boston", "Seattle", 
                                      "Austin", "Los Angeles", "Miami", "Denver", "Atlanta"])
        }
        
        records.append(record)
    
    # Convert to DataFrame
    df = pd.DataFrame(records)
    
    return df

def generate_diverse_career_path_data():
    """
    Generate diverse synthetic career path data with detailed skill requirements.
    
    Returns:
        pd.DataFrame: DataFrame with career path data
    """
    print("Generating diverse career path data...")
    
    # Lists to store generated data
    records = []
    
    # Process each field and role
    for field, data in career_fields.items():
        field_skills = data["skills"]
        
        for role in data["roles"]:
            # Select 5-10 required skills for this role
            num_required_skills = random.randint(5, min(10, len(field_skills)))
            required_skills = random.sample(field_skills, num_required_skills)
            
            # Create required skills string
            required_skills_string = ", ".join(required_skills)
            
            # Generate salary range based on field and role
            base_min = 45000
            base_max = 120000
            
            if "Senior" in role or "Lead" in role or "Manager" in role or "Director" in role:
                base_min += 30000
                base_max += 60000
            
            field_factor = {"Computer Science": 15000, "Engineering": 12000, 
                           "Healthcare & Medicine": 20000, "Law & Legal Studies": 18000, 
                           "Accountancy": 8000}.get(field, 5000)
                
            min_salary = base_min + field_factor + random.randint(-5000, 5000)
            max_salary = base_max + field_factor + random.randint(10000, 30000)
            
            # Ensure min < max
            if min_salary >= max_salary:
                max_salary = min_salary + 20000
                
            # Create description based on field and role
            descriptions = [
                f"A {role} in {field} specializes in applying knowledge and skills to solve complex problems.",
                f"The {role} position requires expertise in multiple aspects of {field}.",
                f"As a {role}, you'll develop solutions and strategies in the {field} domain.",
                f"This {role} focuses on innovation and advancement in {field}.",
                f"{role}s work with teams to implement best practices in {field}."
            ]
            description = random.choice(descriptions)
            
            # Create the record
            record = {
                "Career Path": role,
                "Field": field,
                "Description": description,
                "Required Skills": required_skills_string,
                "Education": random.choice(["Bachelor's", "Master's", "PhD", "Any"]),
                "Min Experience": f"{random.randint(0, 5)}+ years",
                "Salary Range": f"${min_salary:,} - ${max_salary:,}",
                "Growth Potential": random.choice(["High", "Medium", "Low"]),
                "Work-Life Balance": random.randint(1, 5)
            }
            
            records.append(record)
    
    # Convert to DataFrame
    df = pd.DataFrame(records)
    
    return df

def main():
    """Main function to generate diverse synthetic data."""
    # Set working directory to the recommender root
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    print("=" * 60)
    print("CAREER RECOMMENDER SYSTEM - DIVERSE DATA GENERATOR")
    print("=" * 60)
    
    # Make sure the data directory exists
    data_dir = os.path.join("data")
    ensure_directory_exists(data_dir)
    
    # Generate employee data
    try:
        num_samples = int(input("\nHow many employee records to generate? (default: 500): ") or "500")
        if num_samples <= 0:
            print("Number must be positive. Using default (500).")
            num_samples = 500
    except ValueError:
        print("Invalid input. Using default (500).")
        num_samples = 500
    
    # Generate and save employee data
    employee_data = generate_diverse_employee_data(num_samples)
    employee_data_path = os.path.join(data_dir, "synthetic_employee_data.csv")
    employee_data.to_csv(employee_data_path, index=False)
    print(f"Saved {len(employee_data)} employee records to {employee_data_path}")
    
    # Generate and save career path data
    career_path_data = generate_diverse_career_path_data()
    career_path_data_path = os.path.join(data_dir, "synthetic_career_path_data.csv")
    career_path_data.to_csv(career_path_data_path, index=False)
    print(f"Saved {len(career_path_data)} career path records to {career_path_data_path}")
    
    print("\nData generation completed successfully!")
    print("You can now retrain the model using this more diverse dataset.")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 