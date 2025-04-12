"""
Targeted data generator for HR career recommendation system.
This script specifically generates data for underrepresented career fields.
"""

import os
import pandas as pd
import numpy as np
import random
import argparse
from utils.data_generator import SyntheticDataGenerator

class TargetedDataGenerator(SyntheticDataGenerator):
    """Class for generating targeted HR career data for specific fields"""
    
    def __init__(self, target_fields=None, seed=42):
        """
        Initialize the generator with target fields and a seed for reproducibility
        
        Args:
            target_fields (list): List of field names to target
            seed (int): Random seed for reproducibility
        """
        # Initialize parent class
        super().__init__(seed=seed)
        
        # Set target fields
        self.target_fields = target_fields or [
            "Technology",
            "Social Sciences",
            "Real Estate",
            "Logistics & Operations",
            "Marine Science",
            "Maritime & Logistics",
            "Urban Development",
            "Design",
            "Forensic Science",
            "International Relations",
            "Aviation",
            "Language & Communication",
            "Science",
            "Business",
            "Social Services",
            "Creative Arts"
        ]
        
        # Fields that need increased representation (doubles)
        self.double_representation = ["Technology", "Science", "Creative Arts"]
        
        # Define custom roles and skills for target fields if not in career_fields
        self.custom_field_data = {
            "Technology": {
                "roles": ["Software Engineer", "Data Engineer", "DevOps Engineer", 
                          "Cloud Architect", "Systems Analyst", "Network Administrator",
                          "Database Administrator", "IT Security Specialist", "Full Stack Developer"],
                "skills": ["Programming", "Software Development", "Cloud Computing", 
                          "DevOps", "System Architecture", "Database Management", 
                          "Network Security", "Web Development", "API Design", 
                          "Containerization", "Infrastructure as Code"]
            },
            "Social Sciences": {
                "roles": ["Sociologist", "Anthropologist", "Political Scientist",
                         "Economist", "Urban Planner", "Public Policy Analyst", 
                         "Behavioral Scientist", "Research Analyst"],
                "skills": ["Research Methods", "Data Analysis", "Survey Design", 
                          "Qualitative Research", "Statistical Analysis", "Policy Analysis", 
                          "Social Theory", "Ethnographic Research", "Focus Group Facilitation",
                          "Impact Assessment", "Program Evaluation"]
            },
            "Real Estate": {
                "roles": ["Real Estate Agent", "Property Manager", "Real Estate Appraiser",
                         "Real Estate Broker", "Commercial Real Estate Analyst", 
                         "Real Estate Developer", "Mortgage Loan Officer"],
                "skills": ["Property Valuation", "Market Analysis", "Contract Negotiation", 
                          "Real Estate Law", "Property Management", "Client Relationship Management",
                          "Financial Analysis", "Investment Analysis", "Portfolio Management",
                          "Real Estate Marketing", "Sales Strategy"]
            },
            "Logistics & Operations": {
                "roles": ["Supply Chain Manager", "Operations Manager", "Logistics Coordinator",
                         "Procurement Specialist", "Inventory Manager", "Distribution Manager",
                         "Transportation Planner", "Process Improvement Specialist"],
                "skills": ["Supply Chain Management", "Inventory Control", "Process Optimization",
                          "Demand Forecasting", "Vendor Management", "Warehouse Management",
                          "Transportation Logistics", "Procurement", "ERP Systems",
                          "Lean Operations", "Quality Control"]
            },
            "Marine Science": {
                "roles": ["Marine Biologist", "Oceanographer", "Marine Conservationist",
                         "Marine Ecologist", "Fisheries Scientist", "Aquatic Researcher",
                         "Marine Resource Manager"],
                "skills": ["Marine Ecosystems", "Oceanography", "Field Research",
                          "Laboratory Analysis", "Species Identification", "Data Collection",
                          "Environmental Monitoring", "Aquatic Conservation", "Research Methods",
                          "Scientific Writing", "GIS Mapping"]
            },
            "Maritime & Logistics": {
                "roles": ["Maritime Officer", "Port Manager", "Shipping Coordinator",
                         "Vessel Operations Manager", "Maritime Logistics Specialist",
                         "Cargo Manager", "Freight Forwarder"],
                "skills": ["Maritime Operations", "Shipping Logistics", "Port Management",
                          "International Trade", "Customs Compliance", "Cargo Handling",
                          "Maritime Law", "Transport Documentation", "Route Planning",
                          "Safety Regulations", "Fleet Management"]
            },
            "Urban Development": {
                "roles": ["Urban Planner", "City Manager", "Community Development Specialist",
                         "Municipal Engineer", "Zoning Administrator", "Housing Developer",
                         "Urban Designer", "Environmental Planner"],
                "skills": ["Urban Planning", "Land Use", "Zoning Regulations",
                          "Community Engagement", "Infrastructure Development", "GIS Mapping",
                          "Transportation Planning", "Housing Policy", "Sustainable Development",
                          "Public Policy", "Project Management"]
            },
            "Design": {
                "roles": ["Graphic Designer", "UI/UX Designer", "Interior Designer", 
                          "Fashion Designer", "Product Designer", "Industrial Designer"],
                "skills": ["Design Thinking", "Visual Communication", "Adobe Creative Suite", 
                          "Typography", "Color Theory", "Layout Design", "Sketching", 
                          "3D Modeling", "User Research", "Wireframing", "Prototyping"]
            },
            "Forensic Science": {
                "roles": ["Forensic Scientist", "Crime Scene Investigator", "Forensic Pathologist",
                         "Digital Forensic Analyst", "Forensic Psychologist", "Forensic Anthropologist"],
                "skills": ["Evidence Collection", "DNA Analysis", "Fingerprint Analysis", 
                          "Ballistics", "Toxicology", "Crime Scene Photography", "Laboratory Techniques",
                          "Chain of Custody", "Court Testimony", "Report Writing"]
            },
            "International Relations": {
                "roles": ["Diplomat", "Foreign Policy Advisor", "International Aid Worker",
                         "Political Analyst", "Intelligence Analyst", "Global Affairs Consultant"],
                "skills": ["Diplomacy", "International Law", "Global Politics", "Cultural Awareness",
                          "Policy Analysis", "Negotiation", "Foreign Languages", "Geopolitical Analysis",
                          "Treaty Knowledge", "Conflict Resolution"]
            },
            "Aviation": {
                "roles": ["Pilot", "Air Traffic Controller", "Aviation Safety Inspector",
                         "Aircraft Mechanic", "Aerospace Engineer", "Flight Attendant"],
                "skills": ["Flight Operations", "Navigation", "Aviation Regulations", "Aircraft Systems",
                          "Weather Analysis", "Crew Resource Management", "Emergency Procedures",
                          "Technical Communication", "Risk Assessment", "Systems Engineering"]
            },
            "Language & Communication": {
                "roles": ["Translator", "Interpreter", "Technical Writer", "Linguist",
                         "Speech Therapist", "Communication Specialist"],
                "skills": ["Translation", "Multilingual Fluency", "Intercultural Communication",
                          "Speech Assessment", "Content Creation", "Editing", "Phonetics",
                          "Communication Theory", "Public Speaking", "Documentation"]
            },
            "Science": {
                "roles": ["Research Scientist", "Biologist", "Chemist", "Physicist",
                         "Environmental Scientist", "Astronomer", "Geologist"],
                "skills": ["Scientific Method", "Laboratory Techniques", "Data Analysis",
                          "Research Design", "Statistical Analysis", "Scientific Writing",
                          "Experimental Design", "Field Research", "Peer Review", "Grant Writing"]
            },
            "Business": {
                "roles": ["Business Analyst", "Management Consultant", "Entrepreneur",
                         "Operations Manager", "Business Development Manager", "Strategic Planner"],
                "skills": ["Business Strategy", "Market Analysis", "Financial Modeling",
                          "Process Improvement", "Stakeholder Management", "Business Development",
                          "Change Management", "Competitive Analysis", "Presentation Skills"]
            },
            "Social Services": {
                "roles": ["Social Worker", "Community Outreach Coordinator", "Case Manager",
                         "Counselor", "Nonprofit Program Manager", "Child Welfare Specialist"],
                "skills": ["Case Management", "Crisis Intervention", "Advocacy", "Needs Assessment",
                          "Community Organizing", "Family Support", "Cultural Competence",
                          "Resource Coordination", "Intervention Planning", "Client Relations"]
            },
            "Creative Arts": {
                "roles": ["Fine Artist", "Musician", "Writer", "Filmmaker", "Photographer",
                         "Dancer", "Actor", "Creative Director", "Curator"],
                "skills": ["Artistic Composition", "Creative Expression", "Storytelling",
                          "Visual Arts", "Performance", "Portfolio Development", "Artistic Direction",
                          "Creative Collaboration", "Conceptual Development", "Media Production"]
            }
        }
        
        # Update or add target fields to our fields, specializations and skills
        for field in self.target_fields:
            if field in self.custom_field_data:
                # Add to career fields if not already there
                if field not in self.fields:
                    self.fields.append(field)
                
                # Update specializations
                self.specializations[field] = self.custom_field_data[field]["roles"]
                
                # Update skills
                self.skills[field] = self.custom_field_data[field]["skills"]
    
    def generate_targeted_career_path_data(self, num_entries=100, entries_per_field=20, output_file=None, append=False):
        """
        Generate synthetic career path data focused on target fields
        
        Args:
            num_entries (int): Maximum total number of career path entries to generate
            entries_per_field (int): Number of entries to generate per target field
            output_file (str): Optional file path to save the data
            append (bool): If True, append to existing file instead of replacing
            
        Returns:
            pandas.DataFrame: The generated synthetic career path data
        """
        # Structure: Field, Specialization, Required Skills, Experience Level
        data = []
        
        # First, generate entries for target fields
        for field in self.target_fields:
            # Skip if field not in our data
            if field not in self.specializations or field not in self.skills:
                continue
                
            # Get specializations and skills for this field
            specializations = self.specializations[field]
            skills_pool = self.skills[field]
            
            # Generate entries for each specialization
            for specialization in specializations:
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
                
                # Add duplicate entries for fields that need more representation
                if field in self.double_representation:
                    # Add an extra entry with different experience level
                    other_levels = [level for level in self.experience_levels if level != experience_level]
                    if other_levels:
                        new_level = random.choice(other_levels)
                        data.append({
                            "Field": field,
                            "Specialization": specialization,
                            "Required Skills": skills_str,
                            "Experience Level": new_level
                        })
        
        # Create DataFrame with new data
        new_df = pd.DataFrame(data)
        
        # Check if we need to add more entries to reach num_entries
        remaining = num_entries - len(new_df)
        if remaining > 0:
            # Generate additional entries for target fields
            additional_entries = []
            for _ in range(remaining):
                field = random.choice(self.target_fields)
                if field in self.specializations and self.specializations[field]:
                    specialization = random.choice(self.specializations[field])
                else:
                    specialization = f"{field} Specialist"
                
                # Select random experience level
                experience_level = random.choice(self.experience_levels)
                
                # Generate skills
                required_skills = self._generate_skills_for_field(field, min_skills=5, max_skills=10)
                skills_str = ",".join(required_skills)
                
                # Add entry
                additional_entries.append({
                    "Field": field,
                    "Specialization": specialization,
                    "Required Skills": skills_str,
                    "Experience Level": experience_level
                })
            
            # Add additional entries to our DataFrame
            additional_df = pd.DataFrame(additional_entries)
            new_df = pd.concat([new_df, additional_df], ignore_index=True)
        
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
                    return combined_df
                except Exception as e:
                    print(f"Error appending to existing file: {str(e)}")
                    print("Proceeding with creating a new file")
            
            # If not appending or if appending failed, write new file
            new_df.to_csv(output_file, index=False)
        
        return new_df
    
    def generate_targeted_employee_data(self, num_entries=100, output_file=None, append=False):
        """
        Generate synthetic employee data focused on target fields for career goals
        
        Args:
            num_entries (int): Number of employee entries to generate
            output_file (str): Optional file path to save the data
            append (bool): If True, append to existing file instead of replacing
            
        Returns:
            pandas.DataFrame: The generated synthetic employee data
        """
        # Structure: Employee ID, Name, Age, Years Experience, Skills, Career Goal, Current Role
        data = []
        
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
        
        for i in range(start_id, start_id + num_entries):
            # Select a random field from target fields
            field = random.choice(self.target_fields)
            
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
                # Completely different role
                other_field = random.choice([f for f in self.target_fields if f != field])
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
                skill_count = min(len(field_skills), random.randint(3, 6))
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
                "Employee ID": f"EMP{i:03d}",
                "Name": self._generate_name(),
                "Age": age,
                "Years Experience": years_experience,
                "Skills": skills_str,
                "Career Goal": career_goal,
                "Current Role": current_role
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
    
    def generate_targeted_datasets(self, employee_count=100, career_path_count=150, 
                         employee_file='data/synthetic_employee_data_targeted.csv',
                         career_file='data/synthetic_career_path_data_targeted.csv',
                         append=False):
        """
        Generate both employee and career path datasets focused on target fields
        
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
        career_path_df = self.generate_targeted_career_path_data(
            num_entries=career_path_count,
            output_file=career_file,
            append=append
        )
        
        # Generate employee data
        employee_df = self.generate_targeted_employee_data(
            num_entries=employee_count,
            output_file=employee_file,
            append=append
        )
        
        msg = "Added" if append else "Generated"
        print(f"{msg} {len(employee_df)} employee records {'to' if append else 'saved to'} {employee_file}")
        print(f"{msg} {len(career_path_df)} career path records {'to' if append else 'saved to'} {career_file}")
        
        return employee_df, career_path_df


def main():
    """Main function to generate targeted synthetic data."""
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Generate targeted synthetic data for underrepresented career fields')
    parser.add_argument('--employee-count', type=int, default=100, 
                        help='Number of employee records to generate')
    parser.add_argument('--career-path-count', type=int, default=150, 
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
    parser.add_argument('--fields', nargs='+', 
                        help='List of specific fields to target (overrides default list)')
    
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
    
    # Initialize the targeted data generator
    target_fields = args.fields or [
        "Technology",
        "Social Sciences",
        "Real Estate",
        "Logistics & Operations",
        "Marine Science",
        "Maritime & Logistics",
        "Urban Development",
        "Design",
        "Forensic Science", 
        "International Relations",
        "Aviation",
        "Language & Communication",
        "Science",
        "Business",
        "Social Services",
        "Creative Arts"
    ]
    
    print(f"Initializing targeted data generator with seed {args.seed}...")
    print(f"Targeting fields: {', '.join(target_fields)}")
    print("Priority fields with double representation: Technology, Science, Creative Arts")
    generator = TargetedDataGenerator(target_fields=target_fields, seed=args.seed)
    
    # Generate the datasets
    mode_str = "append to" if should_append else "create new"
    print(f"Will {mode_str} data files...")
    print(f"Generating {args.employee_count} employee records and {args.career_path_count} career path records...")
    
    generator.generate_targeted_datasets(
        employee_count=args.employee_count,
        career_path_count=args.career_path_count,
        employee_file=args.employee_file,
        career_file=args.career_file,
        append=should_append
    )
    
    print("Targeted data generation complete!")


if __name__ == "__main__":
    main() 