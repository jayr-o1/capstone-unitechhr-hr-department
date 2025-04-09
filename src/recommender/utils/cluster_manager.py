import json
import os
from collections import defaultdict

def create_skill_clusters():
    """Create clusters of users based on their lacking skills."""
    users_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'users')
    clusters = defaultdict(list)
    
    # Load all user files
    for filename in os.listdir(users_dir):
        if filename.endswith('.json'):
            with open(os.path.join(users_dir, filename), 'r') as f:
                user_data = json.load(f)
                
                # Add user to clusters for each lacking skill
                for skill in user_data['lacking_skills']:
                    clusters[skill].append({
                        'user_id': user_data['user_id'],
                        'preferred_specialization': user_data['preferred_specialization'],
                        'current_skills': user_data['current_skills']
                    })
    
    return clusters

def save_clusters(clusters):
    """Save skill clusters to a JSON file."""
    clusters_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'clusters')
    os.makedirs(clusters_dir, exist_ok=True)
    
    file_path = os.path.join(clusters_dir, 'skill_clusters.json')
    with open(file_path, 'w') as f:
        json.dump(clusters, f, indent=4)

def load_clusters():
    """Load skill clusters from JSON file."""
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'clusters', 'skill_clusters.json')
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            return json.load(f)
    return {}

def update_clusters():
    """Update skill clusters with latest user data."""
    clusters = create_skill_clusters()
    save_clusters(clusters)
    return clusters

def get_users_by_skill(skill):
    """Get all users who need training in a specific skill."""
    clusters = load_clusters()
    return clusters.get(skill, []) 