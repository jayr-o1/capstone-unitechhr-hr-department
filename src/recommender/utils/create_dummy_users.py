import os
import json
from datetime import datetime

# Ensure directories exist
def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

# Create sample user data
def create_dummy_users():
    # Define paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    users_dir = os.path.join(base_dir, 'data', 'users')
    ensure_dir(users_dir)
    
    # Define dummy users
    dummy_users = [
        {
            "user_id": "user1",
            "preferred_specialization": "Software Development",
            "current_skills": ["Programming", "Web Development"],
            "lacking_skills": ["Data Structures", "Algorithms", "Version Control", "Software Testing", "Database Management", "Problem Solving"],
            "timestamp": datetime.now().isoformat()
        },
        {
            "user_id": "user2",
            "preferred_specialization": "Data Science",
            "current_skills": ["Python", "Statistics"],
            "lacking_skills": ["Machine Learning", "Data Analysis", "Data Visualization", "SQL", "Big Data", "Statistical Modeling"],
            "timestamp": datetime.now().isoformat()
        },
        {
            "user_id": "user3",
            "preferred_specialization": "Cybersecurity",
            "current_skills": ["Network Security", "Information Security"],
            "lacking_skills": ["Cryptography", "Security Auditing", "Incident Response", "Risk Management", "Security Tools", "Ethical Hacking"],
            "timestamp": datetime.now().isoformat()
        },
        {
            "user_id": "user4",
            "preferred_specialization": "Cloud Computing",
            "current_skills": ["Cloud Platforms", "Networking"],
            "lacking_skills": ["Infrastructure as Code", "Containerization", "Security", "Automation", "DevOps", "System Administration"],
            "timestamp": datetime.now().isoformat()
        },
        {
            "user_id": "user5",
            "preferred_specialization": "Software Development",
            "current_skills": ["Programming", "Algorithms", "Data Structures"],
            "lacking_skills": ["Version Control", "Software Testing", "Database Management", "Web Development", "Problem Solving"],
            "timestamp": datetime.now().isoformat()
        },
        {
            "user_id": "user6",
            "preferred_specialization": "Data Science",
            "current_skills": ["Python", "Statistics", "Data Analysis"],
            "lacking_skills": ["Machine Learning", "Data Visualization", "SQL", "Big Data", "Statistical Modeling"],
            "timestamp": datetime.now().isoformat()
        },
        {
            "user_id": "user7",
            "preferred_specialization": "Cybersecurity",
            "current_skills": ["Network Security", "Ethical Hacking", "Cryptography"],
            "lacking_skills": ["Information Security", "Security Auditing", "Incident Response", "Risk Management", "Security Tools"],
            "timestamp": datetime.now().isoformat()
        },
        {
            "user_id": "user8",
            "preferred_specialization": "Cloud Computing",
            "current_skills": ["Cloud Platforms", "DevOps", "System Administration"],
            "lacking_skills": ["Infrastructure as Code", "Containerization", "Networking", "Security", "Automation"],
            "timestamp": datetime.now().isoformat()
        },
        {
            "user_id": "user9",
            "preferred_specialization": "Software Development",
            "current_skills": ["Programming", "Web Development", "Database Management"],
            "lacking_skills": ["Data Structures", "Algorithms", "Version Control", "Software Testing", "Problem Solving"],
            "timestamp": datetime.now().isoformat()
        },
        {
            "user_id": "user10",
            "preferred_specialization": "Data Science",
            "current_skills": ["Python", "Statistics", "Machine Learning", "SQL"],
            "lacking_skills": ["Data Analysis", "Data Visualization", "Big Data", "Statistical Modeling"],
            "timestamp": datetime.now().isoformat()
        }
    ]
    
    # Save each user to a file
    for user in dummy_users:
        file_path = os.path.join(users_dir, f"{user['user_id']}.json")
        with open(file_path, 'w') as f:
            json.dump(user, f, indent=4)
    
    print(f"Created {len(dummy_users)} dummy users in {users_dir}")
    return dummy_users

if __name__ == "__main__":
    create_dummy_users() 