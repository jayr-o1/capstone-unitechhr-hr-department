"""
Weak Field Data Generator for HR career recommendation system.
This script specifically generates data for fields with poor model performance.
"""

import os
import pandas as pd
import numpy as np
import random
import argparse
from utils.data_generator import SyntheticDataGenerator

class WeakFieldGenerator(SyntheticDataGenerator):
    """Class for generating HR career data for fields with weak model performance"""
    
    def __init__(self, seed=42):
        """
        Initialize the generator with a seed for reproducibility
        
        Args:
            seed (int): Random seed for reproducibility
        """
        # Initialize parent class
        super().__init__(seed=seed)
        
        # Define the weak fields that need more data
        self.weak_fields = [
            # Fields with 0.00 metrics (no successful predictions)
            "Environmental Science",
            "Library & Information Science",
            "Marine Science",
            "Maritime & Logistics",
            "Museum & Cultural Heritage",
            "Psychology",
            "Textile & Material Science",
            "Urban Development",
            
            # Fields with low performance
            "Design",
            "Technology",
            "Logistics & Operations",
            "Forensic Science"
        ]
        
        # Define how many entries to generate for each field (more for worse performers)
        self.field_weights = {
            # Fields with 0.00 metrics get highest numbers
            "Environmental Science": 50,
            "Library & Information Science": 50,
            "Marine Science": 60,
            "Maritime & Logistics": 60,
            "Museum & Cultural Heritage": 50,
            "Psychology": 50,
            "Textile & Material Science": 50,
            "Urban Development": 50,
            
            # Fields with low performance get moderate numbers
            "Design": 40,
            "Technology": 45,
            "Logistics & Operations": 45,
            "Forensic Science": 40
        }
        
        # Define detailed roles and skills for these fields
        self.weak_field_data = {
            "Environmental Science": {
                "roles": ["Environmental Scientist", "Ecologist", "Environmental Consultant", 
                         "Conservation Scientist", "Climate Change Analyst", "Environmental Planner", 
                         "Sustainability Specialist", "Environmental Health Specialist"],
                "skills": ["Environmental Impact Assessment", "Ecological Monitoring", "GIS", 
                          "Environmental Sampling", "Data Analysis", "Environmental Regulations", 
                          "Remediation", "Sustainable Development", "Research Methods", 
                          "Environmental Modeling", "Field Research", "Risk Assessment"]
            },
            "Library & Information Science": {
                "roles": ["Librarian", "Information Specialist", "Digital Archivist", 
                         "Research Librarian", "Metadata Specialist", "Collection Development Librarian",
                         "Information Literacy Instructor", "Data Curator", "Knowledge Manager"],
                "skills": ["Information Management", "Cataloging", "Database Management", 
                          "Research Services", "Digital Collections", "Resource Description", 
                          "Information Architecture", "Knowledge Organization", "Reference Services",
                          "Digital Preservation", "Information Retrieval", "Archive Management"]
            },
            "Marine Science": {
                "roles": ["Marine Biologist", "Oceanographer", "Marine Ecologist", 
                         "Fisheries Scientist", "Marine Conservationist", "Marine Geologist",
                         "Marine Biotechnologist", "Marine Policy Specialist", "Aquatic Veterinarian"],
                "skills": ["Marine Ecosystems", "Oceanography", "Field Research", "Laboratory Analysis", 
                          "Marine Biology", "Species Identification", "Underwater Research", 
                          "Scientific Diving", "Marine Conservation", "Coastal Management",
                          "Marine Resource Management", "Ocean Modeling"]
            },
            "Maritime & Logistics": {
                "roles": ["Maritime Officer", "Port Manager", "Shipping Coordinator", 
                         "Vessel Operations Manager", "Maritime Safety Inspector", "Fleet Manager",
                         "Cruise Director", "Naval Architect", "Shipping Logistics Specialist",
                         "Maritime Security Consultant", "Harbor Master"],
                "skills": ["Maritime Operations", "Shipping Logistics", "Port Management", 
                          "Maritime Law", "Vessel Maintenance", "Navigation", 
                          "Maritime Safety Protocols", "Customs Clearance", "Cargo Management",
                          "Maritime Regulations", "Supply Chain Logistics", "Freight Operations"]
            },
            "Museum & Cultural Heritage": {
                "roles": ["Museum Curator", "Conservator", "Exhibition Designer", 
                         "Collections Manager", "Museum Educator", "Cultural Heritage Specialist",
                         "Archivist", "Registrar", "Public Programs Coordinator", 
                         "Preservation Specialist"],
                "skills": ["Collection Management", "Exhibition Development", "Conservation Techniques", 
                          "Curatorial Research", "Cultural Preservation", "Educational Programming", 
                          "Archival Methods", "Artifact Handling", "Historical Research",
                          "Museum Administration", "Digital Collections", "Public Engagement"]
            },
            "Psychology": {
                "roles": ["Psychologist", "Research Psychologist", "Cognitive Scientist", 
                         "Developmental Psychologist", "Social Psychologist", "Neuropsychologist",
                         "Experimental Psychologist", "Comparative Psychologist", 
                         "Quantitative Psychologist"],
                "skills": ["Psychological Assessment", "Research Methods", "Statistical Analysis", 
                          "Cognitive Testing", "Experimental Design", "Clinical Assessment", 
                          "Behavioral Analysis", "Psychological Theory", "Data Collection",
                          "Cognitive Neuroscience", "Psychometrics", "Scientific Writing"]
            },
            "Textile & Material Science": {
                "roles": ["Textile Engineer", "Materials Scientist", "Fabric Developer", 
                         "Textile Chemist", "Textile Designer", "Quality Control Specialist",
                         "Textile Conservator", "Product Development Manager", 
                         "Textile Research Specialist"],
                "skills": ["Textile Testing", "Material Properties", "Fiber Science", 
                          "Fabric Construction", "Textile Chemistry", "Sustainability in Textiles", 
                          "Technical Textiles", "Textile Manufacturing", "Material Testing",
                          "Polymer Science", "Textile Conservation", "Surface Design"]
            },
            "Urban Development": {
                "roles": ["Urban Planner", "City Manager", "Community Development Director", 
                         "Urban Designer", "Transportation Planner", "Housing Specialist",
                         "Economic Development Officer", "Land Use Planner", 
                         "Urban Sustainability Coordinator"],
                "skills": ["Urban Planning", "Land Use Planning", "Community Engagement", 
                          "Project Management", "GIS Mapping", "Policy Analysis", 
                          "Development Regulations", "Sustainable Development", "Housing Policy",
                          "Infrastructure Planning", "Economic Development", "Urban Design"]
            },
            "Design": {
                "roles": ["Graphic Designer", "Product Designer", "UX/UI Designer", 
                         "Industrial Designer", "Fashion Designer", "Interior Designer",
                         "Design Director", "Design Researcher", "Service Designer",
                         "Design Strategist", "Packaging Designer", "Exhibition Designer"],
                "skills": ["Visual Design", "User-Centered Design", "Design Thinking", 
                          "Typography", "Prototyping", "Brand Identity", 
                          "Interaction Design", "Design Software", "Visual Communication",
                          "Design Strategy", "Design Systems", "Wireframing",
                          "Information Architecture", "User Testing", "Design Research"]
            },
            "Technology": {
                "roles": ["Software Engineer", "Data Scientist", "Cybersecurity Specialist", 
                         "Cloud Architect", "DevOps Engineer", "AI Researcher",
                         "Blockchain Developer", "IoT Specialist", "Full-Stack Developer",
                         "Mobile App Developer", "Machine Learning Engineer", "Systems Architect",
                         "Technology Consultant", "Technology Director", "IT Project Manager"],
                "skills": ["Programming", "Software Development", "Data Analysis", 
                          "Cloud Computing", "Security Protocols", "System Architecture", 
                          "Machine Learning", "Database Management", "API Development",
                          "Network Infrastructure", "Software Testing", "Code Review",
                          "Agile Methodologies", "Technical Documentation", "Algorithm Design",
                          "Web Development", "Containerization", "CI/CD Pipeline"]
            },
            "Logistics & Operations": {
                "roles": ["Supply Chain Manager", "Operations Director", "Logistics Coordinator", 
                         "Warehouse Manager", "Production Planner", "Procurement Specialist",
                         "Inventory Manager", "Distribution Manager", "Process Improvement Specialist",
                         "Quality Control Manager", "Fleet Manager", "Operations Analyst"],
                "skills": ["Supply Chain Management", "Operations Planning", "Inventory Control", 
                          "Warehouse Operations", "Production Scheduling", "Procurement", 
                          "Logistics Management", "Process Optimization", "Quality Assurance",
                          "Demand Forecasting", "Vendor Management", "ERP Systems",
                          "Distribution Planning", "Lean Operations", "Just-in-Time Inventory",
                          "Performance Metrics", "Continuous Improvement", "Transportation Management"]
            },
            "Forensic Science": {
                "roles": ["Forensic Scientist", "Crime Scene Investigator", "Forensic Analyst", 
                         "Forensic Pathologist", "Digital Forensic Examiner", "Forensic Toxicologist",
                         "Trace Evidence Analyst", "Forensic Anthropologist", "Forensic Psychologist",
                         "Questioned Document Examiner", "Forensic Ballistics Expert", "Crime Lab Technician"],
                "skills": ["Evidence Collection", "Forensic Analysis", "Trace Evidence Processing", 
                          "DNA Analysis", "Crime Scene Documentation", "Chain of Custody", 
                          "Laboratory Techniques", "Ballistics Analysis", "Fingerprint Analysis",
                          "Digital Evidence Recovery", "Toxicology Screening", "Court Testimony",
                          "Scientific Documentation", "Blood Pattern Analysis", "Forensic Photography",
                          "Case Documentation", "Microscopy", "Chemical Analysis"]
            }
        }
        
        # Update or add weak fields to our fields, specializations and skills
        for field in self.weak_fields:
            if field in self.weak_field_data:
                # Add to career fields if not already there
                if field not in self.fields:
                    self.fields.append(field)
                
                # Update specializations
                self.specializations[field] = self.weak_field_data[field]["roles"]
                
                # Update skills
                self.skills[field] = self.weak_field_data[field]["skills"]
    
    def generate_weak_field_data(self, total_entries=500, output_file=None, append=True):
        """
        Generate synthetic career path data focused on weak performing fields
        
        Args:
            total_entries (int): Maximum total number of career path entries to generate
            output_file (str): Optional file path to save the data
            append (bool): If True, append to existing file instead of replacing
            
        Returns:
            pandas.DataFrame: The generated synthetic career path data
        """
        # Structure: Field, Specialization, Required Skills, Experience Level
        data = []
        
        # Calculate number of entries per field based on weights
        total_weight = sum(self.field_weights.values())
        field_entries = {}
        remaining_entries = total_entries
        
        for field, weight in self.field_weights.items():
            # Calculate proportional entries
            if total_weight > 0:
                entry_count = max(10, int((weight / total_weight) * total_entries))
            else:
                entry_count = total_entries // len(self.field_weights)
                
            field_entries[field] = entry_count
            remaining_entries -= entry_count
        
        # If there are remaining entries, distribute them among fields
        while remaining_entries > 0:
            for field in self.weak_fields:
                if remaining_entries > 0:
                    field_entries[field] += 1
                    remaining_entries -= 1
                else:
                    break
        
        # Generate entries for each field
        for field, num_entries in field_entries.items():
            if field not in self.specializations or field not in self.skills:
                continue
                
            # Get specializations and skills for this field
            specializations = self.specializations[field]
            skills_pool = self.skills[field]
            
            # Generate entries for each specialization
            entries_per_specialization = max(2, num_entries // len(specializations))
            
            for specialization in specializations:
                for _ in range(entries_per_specialization):
                    # Select random experience level
                    experience_level = random.choice(self.experience_levels)
                    
                    # Generate skills for this specialization
                    required_skills = self._generate_skills_for_field(field, min_skills=5, max_skills=12)
                    
                    # Add additional specific skills from this field
                    if len(skills_pool) > 3:
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
            
            # If we need more entries for this field, add general ones
            remaining_field_entries = num_entries - (len(specializations) * entries_per_specialization)
            for _ in range(remaining_field_entries):
                # Select random specialization
                specialization = random.choice(specializations)
                
                # Select random experience level
                experience_level = random.choice(self.experience_levels)
                
                # Generate skills
                required_skills = self._generate_skills_for_field(field, min_skills=5, max_skills=12)
                
                # Add field-specific skills
                if len(skills_pool) > 3:
                    skill_count = min(len(skills_pool), random.randint(3, 6))
                    specialty_skills = random.sample(skills_pool, skill_count)
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
        
        # Create DataFrame with new data
        new_df = pd.DataFrame(data)
        
        # Save to file if specified
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
                    
                    # Remove exact duplicates (same field, specialization, and experience level)
                    combined_df = combined_df.drop_duplicates(
                        subset=['Field', 'Specialization', 'Experience Level'])
                    
                    print(f"Adding {len(new_df)} new records to existing {len(existing_df)} records")
                    print(f"Final dataset contains {len(combined_df)} records")
                    
                    combined_df.to_csv(output_file, index=False)
                    
                    # Print distribution of weak fields
                    weak_fields_df = combined_df[combined_df['Field'].isin(self.weak_fields)]
                    field_counts = weak_fields_df['Field'].value_counts()
                    print("\nDistribution of weak fields after addition:")
                    for field in self.weak_fields:
                        count = field_counts.get(field, 0)
                        print(f"  {field}: {count} records")
                    
                    return combined_df
                except Exception as e:
                    print(f"Error appending to existing file: {str(e)}")
                    print("Proceeding with creating a new file")
            
            # If not appending or if appending failed, write new file
            new_df.to_csv(output_file, index=False)
        
        return new_df
    
    def generate_weak_field_employee_data(self, total_entries=500, output_file=None, append=True):
        """
        Generate synthetic employee data focused on weak performing fields for career goals
        
        Args:
            total_entries (int): Number of employee entries to generate
            output_file (str): Optional file path to save the data
            append (bool): If True, append to existing file instead of replacing
            
        Returns:
            pandas.DataFrame: The generated synthetic employee data
        """
        # Structure: Employee ID, Name, Age, Years Experience, Skills, Career Goal, Current Role
        data = []
        
        # Calculate number of entries per field based on weights
        total_weight = sum(self.field_weights.values())
        field_entries = {}
        remaining_entries = total_entries
        
        for field, weight in self.field_weights.items():
            # Calculate proportional entries
            if total_weight > 0:
                entry_count = max(10, int((weight / total_weight) * total_entries))
            else:
                entry_count = total_entries // len(self.field_weights)
                
            field_entries[field] = entry_count
            remaining_entries -= entry_count
        
        # If there are remaining entries, distribute them among fields
        while remaining_entries > 0:
            for field in self.weak_fields:
                if remaining_entries > 0:
                    field_entries[field] += 1
                    remaining_entries -= 1
                else:
                    break
        
        # If appending, determine the starting ID number
        start_id = 1
        if append and output_file and os.path.exists(output_file):
            try:
                existing_df = pd.read_csv(output_file)
                # Extract employee IDs and find the highest numeric value
                if 'Employee ID' in existing_df.columns:
                    existing_ids = existing_df['Employee ID'].str.extract(r'EMP(\d+)', expand=False).astype(float)
                    if not existing_ids.empty:
                        max_id = existing_ids.max()
                        if not pd.isna(max_id):
                            start_id = int(max_id) + 1
            except Exception as e:
                print(f"Error reading existing employee IDs: {str(e)}")
                print("Starting with default ID numbering")
        
        id_counter = start_id
        
        # Generate entries for each field
        for field, num_entries in field_entries.items():
            for _ in range(num_entries):
                # Select a specialization from this field if available
                if field in self.specializations and self.specializations[field]:
                    career_goal = random.choice(self.specializations[field])
                else:
                    career_goal = f"{field} Specialist"
                
                # Generate a current role that's slightly different from career goal
                if random.random() < 0.7:  # 70% chance of related current role
                    if field in self.specializations and len(self.specializations[field]) > 1:
                        other_specs = [s for s in self.specializations[field] if s != career_goal]
                        if other_specs:
                            current_role = random.choice(other_specs)
                        else:
                            prefix = random.choice(["Junior ", "Associate ", ""])
                            current_role = f"{prefix}{career_goal.split()[-1]}"
                    else:
                        prefix = random.choice(["Junior ", "Associate ", ""])
                        current_role = f"{prefix}{career_goal.split()[-1]}"
                else:
                    # Completely different role, but still in a weak field
                    other_field = random.choice([f for f in self.weak_fields if f != field])
                    if other_field in self.specializations and self.specializations[other_field]:
                        current_role = random.choice(self.specializations[other_field])
                    else:
                        current_role = f"{other_field} Associate"
                
                # Select experience level and corresponding age and years experience
                experience_level = random.choice(self.experience_levels)
                age = self._generate_age(experience_level)
                years_experience = self._generate_years_experience(experience_level)
                
                # Generate skills - include both field skills and some skills from career goal field
                skills = []
                
                # Add skills from the field
                if field in self.skills and self.skills[field]:
                    field_skills = self.skills[field]
                    skill_count = min(len(field_skills), random.randint(4, 8))
                    if skill_count > 0:
                        skills.extend(random.sample(field_skills, skill_count))
                
                # Add some common skills
                common_skill_count = random.randint(2, 4)
                skills.extend(random.sample(self.common_skills, min(common_skill_count, len(self.common_skills))))
                
                # Remove duplicates and join as string
                skills = list(set(skills))
                skills_str = ", ".join(skills)
                
                # Add entry
                data.append({
                    "Employee ID": f"EMP{id_counter:03d}",
                    "Name": self._generate_name(),
                    "Age": age,
                    "Years Experience": years_experience,
                    "Skills": skills_str,
                    "Career Goal": career_goal,
                    "Current Role": current_role
                })
                
                id_counter += 1
        
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
                    
                    # Count career goals in weak fields
                    career_goals = combined_df['Career Goal'].tolist()
                    weak_field_count = 0
                    
                    for goal in career_goals:
                        for field in self.weak_fields:
                            if field in self.specializations:
                                if goal in self.specializations[field]:
                                    weak_field_count += 1
                                    break
                    
                    print(f"Employees with career goals in weak fields: {weak_field_count}")
                    
                    combined_df.to_csv(output_file, index=False)
                    return combined_df
                except Exception as e:
                    print(f"Error appending to existing file: {str(e)}")
                    print("Proceeding with creating a new file")
            
            # If not appending or if appending failed, write new file
            new_df.to_csv(output_file, index=False)
        
        return new_df
    
    def generate_weak_field_datasets(self, career_path_count=500, employee_count=500, 
                         career_file='data/synthetic_career_path_data.csv',
                         employee_file='data/synthetic_employee_data.csv',
                         append=True):
        """
        Generate both employee and career path datasets focused on weak fields
        
        Args:
            career_path_count (int): Number of career path entries
            employee_count (int): Number of employee entries
            career_file (str): Path to save career path data
            employee_file (str): Path to save employee data
            append (bool): If True, append to existing files instead of replacing
            
        Returns:
            tuple: (employee_df, career_path_df) - the generated DataFrames
        """
        # Adjust paths if needed
        data_dir = os.path.dirname(os.path.abspath(career_file))
        os.makedirs(data_dir, exist_ok=True)
        
        # Generate career path data first to ensure consistent specializations
        print(f"Generating {career_path_count} career path records for weak fields...")
        career_path_df = self.generate_weak_field_data(
            total_entries=career_path_count,
            output_file=career_file,
            append=append
        )
        
        # Generate employee data
        print(f"Generating {employee_count} employee records for weak fields...")
        employee_df = self.generate_weak_field_employee_data(
            total_entries=employee_count,
            output_file=employee_file,
            append=append
        )
        
        msg = "Added" if append else "Generated"
        print(f"{msg} {len(employee_df)} employee records focused on weak fields {'to' if append else 'saved to'} {employee_file}")
        print(f"{msg} {len(career_path_df)} career path records focused on weak fields {'to' if append else 'saved to'} {career_file}")
        
        return employee_df, career_path_df


def main():
    """Main function to generate targeted synthetic data for weak fields."""
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Generate synthetic data for weak performing career fields')
    parser.add_argument('--employee-count', type=int, default=500, 
                        help='Number of employee records to generate')
    parser.add_argument('--career-path-count', type=int, default=600, 
                        help='Number of career path records to generate')
    parser.add_argument('--employee-file', type=str, default=None, 
                        help='Output file for employee data (default: data/synthetic_employee_data.csv)')
    parser.add_argument('--career-file', type=str, default=None, 
                        help='Output file for career path data (default: data/synthetic_career_path_data.csv)')
    parser.add_argument('--seed', type=int, default=42, 
                        help='Random seed for reproducibility')
    parser.add_argument('--append', action='store_true', default=True,
                        help='Append to existing files instead of replacing them (default: True)')
    parser.add_argument('--replace', action='store_true', 
                        help='Replace existing files instead of appending')
    
    args = parser.parse_args()
    
    # Set default file paths if not provided
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    
    if args.employee_file is None:
        args.employee_file = os.path.join(data_dir, "synthetic_employee_data.csv")
        
    if args.career_file is None:
        args.career_file = os.path.join(data_dir, "synthetic_career_path_data.csv")
    
    # Determine append mode - default is to append unless replace is specified
    should_append = not args.replace
    
    # Initialize the weak field generator
    print(f"Initializing weak field data generator with seed {args.seed}...")
    print("Targeting weak performing fields:")
    generator = WeakFieldGenerator(seed=args.seed)
    for field in generator.weak_fields:
        print(f"  - {field}")
    
    # Generate the datasets
    mode_str = "append to" if should_append else "create new"
    print(f"Will {mode_str} data files...")
    
    generator.generate_weak_field_datasets(
        employee_count=args.employee_count,
        career_path_count=args.career_path_count,
        employee_file=args.employee_file,
        career_file=args.career_file,
        append=should_append
    )
    
    print("Weak field data generation complete!")


if __name__ == "__main__":
    main() 