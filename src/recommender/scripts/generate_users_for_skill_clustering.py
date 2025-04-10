#!/usr/bin/env python3
"""
Script to generate diverse users with various skill gaps for testing the skill clustering functionality.
"""

import os
import sys
import json
import random
from datetime import datetime
import uuid

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import required modules
from utils.data_loader import load_career_paths
from utils.cluster_manager import update_clusters
from utils.skill_analyzer import group_users_by_missing_skills

def load_existing_users():
    """Load existing user data to avoid overwriting."""
    users_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'users')
    existing_users = []
    
    if not os.path.exists(users_dir):
        os.makedirs(users_dir, exist_ok=True)
        return existing_users
    
    for filename in os.listdir(users_dir):
        if filename.endswith('.json'):
            try:
                with open(os.path.join(users_dir, filename), 'r') as f:
                    user_data = json.load(f)
                    existing_users.append(user_data['user_id'])
            except:
                pass
    
    return existing_users

def save_user(user_data):
    """Save user data to a JSON file."""
    users_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'users')
    os.makedirs(users_dir, exist_ok=True)
    
    file_path = os.path.join(users_dir, f"{user_data['user_id']}.json")
    with open(file_path, 'w') as f:
        json.dump(user_data, f, indent=4)

def generate_users_with_skill_gaps(num_users=20):
    """
    Generate diverse users with skill gaps for testing skill clustering.
    
    Args:
        num_users (int): Number of users to generate
        
    Returns:
        list: Generated user data
    """
    # Load career paths to get specializations and required skills
    career_paths = load_career_paths()
    
    # Load existing users to avoid overwriting
    existing_users = load_existing_users()
    
    # Initialize list for generated users
    generated_users = []
    
    # Fields and their specializations
    fields = {
        "Technology": ["Software Development", "Data Science", "Cybersecurity", "Cloud Computing"],
        "Criminal Justice": ["Criminology", "Forensic Science", "Law Enforcement", "Criminal Justice"],
        "Healthcare": ["Healthcare Administration", "Nursing", "Clinical Psychology", "Industrial-Organizational Psychology"],
        "Business": ["Marketing", "Finance", "Human Resources"],
        "Engineering": ["Mechanical Engineering", "Civil Engineering"],
        "Education": ["Elementary Education", "Secondary Education"],
        "Creative Arts": ["Graphic Design", "Film Production"],
        "Legal": ["Legal Practice"],
        "Science": ["Environmental Science"],
        "Media": ["Journalism"],
        "Social Services": ["Social Work"],
        "Healthcare Specialists": ["Physical Therapy", "Speech-Language Pathology"],
        "Design": ["Architecture", "Interior Design"],
        "Agriculture": ["Agriculture"],
        "Hospitality": ["Hospitality Management"],
        "Medical": ["Dentistry", "Pharmacy", "Veterinary Medicine"],
        "Urban Development": ["Urban Planning"]
    }
    
    # Create a mapping of specializations to required skills
    specialization_skills = {}
    for path in career_paths:
        specialization_skills[path['title']] = path['required_skills']
    
    # Generate users
    for i in range(num_users):
        # Choose a random field
        field = random.choice(list(fields.keys()))
        
        # Choose a random specialization from the field
        specialization = random.choice(fields[field])
        
        # Get required skills for the specialization
        required_skills = specialization_skills.get(specialization, [])
        
        if not required_skills:
            continue
        
        # Generate a random user ID
        user_id = f"cluster_user_{i+1}"
        while user_id in existing_users:
            user_id = f"cluster_user_{uuid.uuid4().hex[:8]}"
        
        # Randomly select some skills to be "current" (60-90% of required skills)
        num_current_skills = random.randint(int(len(required_skills) * 0.6), int(len(required_skills) * 0.9))
        current_skills = random.sample(required_skills, num_current_skills)
        
        # Calculate lacking skills
        lacking_skills = list(set(required_skills) - set(current_skills))
        
        # Create user data
        user_data = {
            'user_id': user_id,
            'preferred_field': field,
            'preferred_specialization': specialization,
            'current_skills': current_skills,
            'lacking_skills': lacking_skills,
            'timestamp': datetime.now().isoformat()
        }
        
        # Save user data
        save_user(user_data)
        generated_users.append(user_data)
        existing_users.append(user_id)
        
        print(f"Created user {user_id} with {specialization} specialization, {len(current_skills)} skills, {len(lacking_skills)} lacking skills")
    
    return generated_users

def create_skill_overlap_users(num_users=15, overlap_threshold=0.7):
    """
    Create users with overlapping skill gaps to form distinct clusters.
    
    Args:
        num_users (int): Number of users to generate
        overlap_threshold (float): Threshold for skill overlap
        
    Returns:
        list: Generated user data
    """
    # Load career paths to get specializations and required skills
    career_paths = load_career_paths()
    
    # Load existing users to avoid overwriting
    existing_users = load_existing_users()
    
    # Initialize list for generated users
    generated_users = []
    
    # Top skills that we want to create clusters for
    target_skills = [
        "Programming",
        "Machine Learning",
        "Data Analysis",
        "Cloud Platforms",
        "Project Management",
        "Communication Skills",
        "Networking",
        "Security",
        "Database Management",
        "Web Development"
    ]
    
    # Generate users for each target skill
    for skill in target_skills:
        # Find specializations that require this skill
        relevant_specializations = []
        for path in career_paths:
            if skill in path['required_skills']:
                relevant_specializations.append(path['title'])
        
        if not relevant_specializations:
            continue
        
        # Generate users for this skill
        users_for_skill = random.randint(2, 5)  # Generate 2-5 users per skill
        
        for i in range(users_for_skill):
            # Choose a random specialization
            specialization = random.choice(relevant_specializations)
            
            # Get required skills for the specialization
            required_skills = next((path['required_skills'] for path in career_paths if path['title'] == specialization), [])
            
            if not required_skills:
                continue
            
            # Generate a random user ID
            user_id = f"skill_cluster_{skill.lower().replace(' ', '_')}_{i+1}"
            while user_id in existing_users:
                user_id = f"skill_cluster_{skill.lower().replace(' ', '_')}_{uuid.uuid4().hex[:5]}"
            
            # Make sure target skill is always lacking
            lacking_skills = [skill]
            
            # Add some additional lacking skills (20-40% of required skills, excluding the target skill)
            other_skills = [s for s in required_skills if s != skill]
            num_additional_lacking = random.randint(int(len(other_skills) * 0.2), int(len(other_skills) * 0.4))
            lacking_skills.extend(random.sample(other_skills, min(num_additional_lacking, len(other_skills))))
            
            # Calculate current skills
            current_skills = list(set(required_skills) - set(lacking_skills))
            
            # Get the field for this specialization
            field = next((field for field, specs in fields.items() if specialization in specs), "Other")
            
            # Create user data
            user_data = {
                'user_id': user_id,
                'preferred_field': field,
                'preferred_specialization': specialization,
                'current_skills': current_skills,
                'lacking_skills': lacking_skills,
                'timestamp': datetime.now().isoformat()
            }
            
            # Save user data
            save_user(user_data)
            generated_users.append(user_data)
            existing_users.append(user_id)
            
            print(f"Created user {user_id} for skill cluster '{skill}', {len(current_skills)} skills, {len(lacking_skills)} lacking skills")
    
    return generated_users

def main():
    """Main function to generate users with skill gaps."""
    print("\nSkill Cluster User Generator")
    print("===========================\n")
    
    # Generate diverse users with random skill gaps
    print("\nGenerating diverse users with random skill gaps...")
    num_diverse_users = 20
    diverse_users = generate_users_with_skill_gaps(num_diverse_users)
    
    # Generate users with intentional skill overlaps for clustering
    print("\nGenerating users with overlapping skill gaps for clustering...")
    num_cluster_users = 15
    cluster_users = create_skill_overlap_users(num_cluster_users)
    
    # Update skill clusters
    print("\nUpdating skill clusters...")
    clusters = update_clusters()
    
    # Show cluster statistics
    num_skills = len(clusters)
    num_users = sum(len(users) for users in clusters.values())
    
    print(f"\nCreated a total of {len(diverse_users) + len(cluster_users)} users")
    print(f"Updated clusters with {num_skills} skills and {num_users} user-skill associations")
    
    # Show the top skills by number of users
    print("\nTop skills by number of users:")
    top_skills = sorted(clusters.items(), key=lambda x: len(x[1]), reverse=True)[:10]
    for skill, users in top_skills:
        print(f"  {skill}: {len(users)} users")
    
    print("\nUser generation completed. Skill clusters have been updated.")

# Field definitions
fields = {
    "Technology": ["Software Development", "Data Science", "Cybersecurity", "Cloud Computing"],
    "Criminal Justice": ["Criminology", "Forensic Science", "Law Enforcement", "Criminal Justice"],
    "Healthcare": ["Healthcare Administration", "Nursing", "Clinical Psychology", "Industrial-Organizational Psychology"],
    "Business": ["Marketing", "Finance", "Human Resources"],
    "Engineering": ["Mechanical Engineering", "Civil Engineering"],
    "Education": ["Elementary Education", "Secondary Education"],
    "Creative Arts": ["Graphic Design", "Film Production"],
    "Legal": ["Legal Practice"],
    "Science": ["Environmental Science"],
    "Media": ["Journalism"],
    "Social Services": ["Social Work"],
    "Healthcare Specialists": ["Physical Therapy", "Speech-Language Pathology"],
    "Design": ["Architecture", "Interior Design"],
    "Agriculture": ["Agriculture"],
    "Hospitality": ["Hospitality Management"],
    "Medical": ["Dentistry", "Pharmacy", "Veterinary Medicine"],
    "Urban Development": ["Urban Planning"]
}

if __name__ == "__main__":
    main() 