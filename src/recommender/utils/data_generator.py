"""
Synthetic data generator for HR career recommendation system.
Generates synthetic career path data and employee data for model training and testing.
"""

import pandas as pd
import numpy as np
import os
import random
from datetime import datetime, timedelta
import csv
import argparse

# Try to import career fields from the main module
try:
    from recommender import career_fields
except ImportError:
    try:
        # If direct import fails, try to use the parent path
        import sys
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from recommender import career_fields
    except ImportError:
        # Create a minimal career fields dictionary as fallback
        career_fields = {
            "Technology": {
                "roles": ["Software Developer", "Data Scientist", "Cybersecurity Analyst", "Cloud Architect"],
                "skills": ["Programming", "Data Analysis", "Machine Learning", "Security", "Cloud Computing"]
            },
            "Business": {
                "roles": ["Marketing Manager", "Financial Analyst", "Human Resources Specialist"],
                "skills": ["Marketing", "Finance", "HR Management", "Communication", "Leadership"]
            }
        }

class SyntheticDataGenerator:
    """Class for generating synthetic HR career data"""
    
    def __init__(self, seed=42):
        """Initialize the generator with a seed for reproducibility"""
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)
        
        # Common skills across multiple fields
        self.common_skills = [
            "Communication", "Leadership", "Problem Solving", "Teamwork", 
            "Critical Thinking", "Time Management", "Project Management"
        ]
        
        # Generate base data from career fields
        self.fields = list(career_fields.keys())
        self.specializations = {}
        self.skills = {}
        
        # Dictionary to track popular specializations
        self.popular_specializations = {}
        
        for field, data in career_fields.items():
            # Get specializations (roles) for each field
            specializations = data.get("roles", [])
            self.specializations[field] = specializations
            
            # Track popular specializations (about 40% of the total)
            if specializations:
                num_popular = max(3, int(len(specializations) * 0.4))
                self.popular_specializations[field] = specializations[:num_popular]
            else:
                self.popular_specializations[field] = []
                
            # Get skills for each field
            self.skills[field] = data.get("skills", [])
            
        # Generate random names for employees
        self.first_names = [
            "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
            "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen",
            "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua",
            "Nancy", "Lisa", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle",
            "Luis", "Jose", "Carlos", "Juan", "Miguel", "Rafael", "Alejandro", "Francisco", "Jorge", "Pedro",
            "Maria", "Ana", "Sofia", "Isabella", "Valentina", "Camila", "Gabriela", "Victoria", "Lucia", "Elena",
            "Wei", "Li", "Ming", "Yan", "Chen", "Yong", "Jie", "Lei", "Xin", "Hui",
            "Mei", "Ling", "Yan", "Xiu", "Hui", "Juan", "Fang", "Na", "Jing", "Li",
            "Abdul", "Ahmed", "Ali", "Hassan", "Ibrahim", "Karim", "Mohammed", "Mustafa", "Omar", "Yusuf",
            "Aaliyah", "Fatima", "Layla", "Maryam", "Noor", "Yasmin", "Zara", "Amina", "Leila", "Samira"
        ]
        
        self.last_names = [
            "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor",
            "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson",
            "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez", "King",
            "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson", "Carter",
            "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins",
            "Chen", "Yang", "Liu", "Huang", "Wu", "Zhou", "Zhang", "Li", "Wang", "Zhao",
            "Kim", "Park", "Choi", "Jung", "Kang", "Cho", "Lee", "Yoon", "Jeong", "Jang",
            "Patel", "Singh", "Kumar", "Shah", "Sharma", "Gupta", "Das", "Desai", "Reddy", "Malhotra",
            "Silva", "Santos", "Oliveira", "Pereira", "Costa", "Rodrigues", "Ferreira", "Almeida", "Carvalho", "Gomes",
            "Ivanov", "Smirnov", "Kuznetsov", "Popov", "Sokolov", "Lebedev", "Kozlov", "Novikov", "Morozov", "Petrov",
            "Al-Farsi", "Al-Saadi", "Al-Habsi", "Al-Balushi", "Al-Hinai", "Al-Rawahi", "Al-Kindi", "Al-Zadjali", "Al-Azri", "Al-Hashmi"
        ]
        
        # Experience levels
        self.experience_levels = ["Entry", "Entry-Mid", "Mid", "Mid-Senior", "Senior"]
        
        # Current experience in years by level
        self.years_experience = {
            "Entry": (0, 2),
            "Entry-Mid": (2, 5),
            "Mid": (5, 8),
            "Mid-Senior": (8, 15),
            "Senior": (12, 25)
        }
        
        # Age ranges by experience level
        self.age_ranges = {
            "Entry": (22, 30),
            "Entry-Mid": (24, 35),
            "Mid": (28, 40),
            "Mid-Senior": (30, 50),
            "Senior": (35, 60)
        }

    def _generate_skills_for_field(self, field, min_skills=3, max_skills=8, add_common=True):
        """Generate a list of skills for a particular field"""
        field_skills = random.sample(self.skills.get(field, ["Default Skill"]), 
                                    min(len(self.skills.get(field, [])), 
                                        random.randint(min_skills, max_skills)))
        
        # Maybe add some common skills
        if add_common and random.random() < 0.8:  # 80% chance to add common skills
            common_count = random.randint(1, 3)
            field_skills.extend(random.sample(self.common_skills, min(len(self.common_skills), common_count)))
            
        return field_skills
        
    def _generate_name(self):
        """Generate a random name"""
        return f"{random.choice(self.first_names)} {random.choice(self.last_names)}"
    
    def _generate_age(self, experience_level):
        """Generate a plausible age based on experience level"""
        min_age, max_age = self.age_ranges.get(experience_level, (25, 45))
        return random.randint(min_age, max_age)
    
    def _generate_years_experience(self, experience_level):
        """Generate years of experience based on level"""
        min_years, max_years = self.years_experience.get(experience_level, (3, 10))
        return random.randint(min_years, max_years)
    
    def generate_career_path_data(self, num_entries=100, output_file=None, append=False):
        """
        Generate synthetic career path data
        
        Args:
            num_entries (int): Number of career path entries to generate
            output_file (str): Optional file path to save the data
            append (bool): If True, append to existing file instead of replacing
            
        Returns:
            pandas.DataFrame: The generated synthetic career path data
        """
        # Structure: Field, Specialization, Required Skills, Experience Level
        data = []
        
        # First, include all popular specializations from career_fields
        for field, field_data in career_fields.items():
            specializations = field_data.get("roles", [])
            skills_pool = field_data.get("skills", [])
            
            # Focus on popular specializations (about 40% of all specializations)
            popular_specs = self.popular_specializations.get(field, [])
            if not popular_specs and specializations:
                popular_specs = specializations[:max(3, int(len(specializations) * 0.4))]
            
            # Generate more entries for popular specializations to make training more focused
            for specialization in specializations:
                # Determine how many entries to create for this specialization
                # Popular specializations get multiple entries for better representation
                entry_count = 3 if specialization in popular_specs else 1
                
                for _ in range(entry_count):
                    # Select random experience level
                    experience_level = random.choice(self.experience_levels)
                    
                    # Generate skills for this specialization
                    required_skills = self._generate_skills_for_field(field, min_skills=5, max_skills=12)
                    
                    # Add additional specific skills if skills pool is large enough
                    if len(skills_pool) > 5:
                        specialty_skills = random.sample(skills_pool, min(5, len(skills_pool)))
                        required_skills.extend(specialty_skills)
                    
                    # Remove duplicates and join as string
                    required_skills = list(set(required_skills))
                    skills_str = ",".join(required_skills)
                    
                    # Add entry
                    data.append({
                        "Field": field,
                        "Specialization": specialization,
                        "Required Skills": skills_str,
                        "Experience Level": experience_level
                    })
        
        # Generate additional random entries if needed, focusing more on popular specializations
        remaining = num_entries - len(data)
        if remaining > 0:
            for _ in range(remaining):
                # Select random field
                field = random.choice(self.fields)
                
                # 70% chance to use a popular specialization
                if random.random() < 0.7 and self.popular_specializations.get(field):
                    specialization = random.choice(self.popular_specializations[field])
                else:
                    # Otherwise use any specialization
                    specialization = random.choice(self.specializations.get(field, 
                                                 [f"{field} Specialist", f"{field} Associate"]))
                
                # Select random experience level
                experience_level = random.choice(self.experience_levels)
                
                # Generate skills
                required_skills = self._generate_skills_for_field(field)
                skills_str = ",".join(required_skills)
                
                # Add entry
                data.append({
                    "Field": field,
                    "Specialization": specialization,
                    "Required Skills": skills_str,
                    "Experience Level": experience_level
                })
        
        # Create DataFrame with new data
        new_df = pd.DataFrame(data)
        
        if output_file:
            # Ensure the directory exists
            os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
            
            # If appending and file exists, read existing data and combine
            if append and os.path.exists(output_file):
                try:
                    existing_df = pd.read_csv(output_file)
                    print(f"Found existing career path data: {len(existing_df)} records")
                    
                    # Combine existing and new data
                    combined_df = pd.concat([existing_df, new_df], ignore_index=True)
                    
                    # Remove exact duplicates
                    combined_df = combined_df.drop_duplicates()
                    
                    print(f"Adding {len(new_df)} new records to existing {len(existing_df)} records")
                    print(f"Final dataset contains {len(combined_df)} records")
                    
                    combined_df.to_csv(output_file, index=False)
                    return combined_df
                except Exception as e:
                    print(f"Error appending to existing file: {str(e)}")
                    print("Proceeding with creating a new file")
            
            # If not appending or if appending failed, write new file
            new_df.to_csv(output_file, index=False)
        
        return new_df
        
    def generate_employee_data(self, num_entries=100, output_file=None, append=False):
        """
        Generate synthetic employee data
        
        Args:
            num_entries (int): Number of employee entries to generate
            output_file (str): Optional file path to save the data
            append (bool): If True, append to existing file instead of replacing
            
        Returns:
            pandas.DataFrame: The generated synthetic employee data
        """
        # Columns: Name, Age, Field, Specialization, Skills, Experience Level, Years of Experience
        data = []
        
        for _ in range(num_entries):
            # Generate employee name and age
            name = self._generate_name()
            
            # Select random field
            field = random.choice(self.fields)
            
            # Prioritize popular specializations (70% chance)
            if random.random() < 0.7 and self.popular_specializations.get(field):
                specialization = random.choice(self.popular_specializations[field])
            else:
                # Otherwise use any specialization from this field
                specialization = random.choice(self.specializations.get(field, 
                                             [f"{field} Specialist", f"{field} Associate"]))
            
            # Select random experience level
            experience_level = random.choice(self.experience_levels)
            
            # Calculate age and years of experience
            age = self._generate_age(experience_level)
            years_experience = self._generate_years_experience(experience_level)
            
            # Generate skills
            skills = self._generate_skills_for_field(field)
            skills_str = ",".join(skills)
            
            # Add entry
            data.append({
                "Name": name,
                "Age": age,
                "Field": field,
                "Specialization": specialization,
                "Skills": skills_str,
                "Experience Level": experience_level,
                "Years of Experience": years_experience
            })
        
        # Create DataFrame with new data
        new_df = pd.DataFrame(data)
        
        if output_file:
            # Ensure the directory exists
            os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
            
            # If appending and file exists, read existing data and combine
            if append and os.path.exists(output_file):
                try:
                    existing_df = pd.read_csv(output_file)
                    print(f"Found existing employee data: {len(existing_df)} records")
                    
                    # Combine existing and new data
                    combined_df = pd.concat([existing_df, new_df], ignore_index=True)
                    
                    # Remove exact duplicates
                    combined_df = combined_df.drop_duplicates(subset=['Employee ID'])
                    
                    print(f"Adding {len(new_df)} new records to existing {len(existing_df)} records")
                    print(f"Final dataset contains {len(combined_df)} records")
                    
                    combined_df.to_csv(output_file, index=False)
                    return combined_df
                except Exception as e:
                    print(f"Error appending to existing file: {str(e)}")
                    print("Proceeding with creating a new file")
            
            # If not appending or if appending failed, write new file
            new_df.to_csv(output_file, index=False)
        
        return new_df
    
    def generate_datasets(self, employee_count=100, career_path_count=100, 
                         employee_file='data/synthetic_employee_data.csv',
                         career_file='data/synthetic_career_path_data.csv',
                         append=False):
        """
        Generate both employee and career path datasets
        
        Args:
            employee_count (int): Number of employee entries
            career_path_count (int): Number of career path entries
            employee_file (str): Path to save employee data
            career_file (str): Path to save career path data
            append (bool): If True, append to existing files instead of replacing
            
        Returns:
            tuple: (employee_df, career_path_df) - the generated DataFrames
        """
        # Adjust paths if needed
        data_dir = os.path.dirname(os.path.abspath(employee_file))
        os.makedirs(data_dir, exist_ok=True)
        
        # Generate career path data first to ensure consistent specializations
        career_path_df = self.generate_career_path_data(
            num_entries=career_path_count,
            output_file=career_file,
            append=append
        )
        
        # Generate employee data
        employee_df = self.generate_employee_data(
            num_entries=employee_count,
            output_file=employee_file,
            append=append
        )
        
        msg = "Added" if append else "Generated"
        print(f"{msg} {len(employee_df)} employee records {'to' if append else 'saved to'} {employee_file}")
        print(f"{msg} {len(career_path_df)} career path records {'to' if append else 'saved to'} {career_file}")
        
        return employee_df, career_path_df

if __name__ == "__main__":
    # When run as a script, generate default datasets
    parser = argparse.ArgumentParser(description='Generate synthetic data for HR career recommendations')
    parser.add_argument('--employee-count', type=int, default=250, 
                        help='Number of employee records to generate')
    parser.add_argument('--career-path-count', type=int, default=150, 
                        help='Number of career path records to generate')
    parser.add_argument('--replace', action='store_true', 
                        help='Replace existing files instead of appending')
    parser.add_argument('--seed', type=int, default=42, 
                        help='Random seed for reproducibility')
    
    args = parser.parse_args()
    
    generator = SyntheticDataGenerator(seed=args.seed)
    
    # Ensure we're in the right directory structure
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    
    employee_file = os.path.join(data_dir, "synthetic_employee_data.csv")
    career_file = os.path.join(data_dir, "synthetic_career_path_data.csv")
    
    # Determine if we should append or replace
    should_append = not args.replace and (os.path.exists(employee_file) or os.path.exists(career_file))
    mode_str = "append to existing" if should_append else "create new"
    
    print(f"Generating synthetic data for HR career recommendation system...")
    print(f"Will {mode_str} data files")
    print(f"Generating {args.employee_count} employee records and {args.career_path_count} career path records")
    
    # Generate datasets
    generator.generate_datasets(
        employee_count=args.employee_count,
        career_path_count=args.career_path_count,
        employee_file=employee_file,
        career_file=career_file,
        append=should_append
    )
    
    print("Data generation complete!") 