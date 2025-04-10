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
    """Save skill clusters to JSON file."""
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

def get_skills_by_popularity():
    """
    Get skills sorted by the number of users who need them.
    
    Returns:
        list: Skills sorted by popularity (number of users needing them)
    """
    clusters = load_clusters()
    skill_popularity = [(skill, len(users)) for skill, users in clusters.items()]
    # Sort by count in descending order
    skill_popularity.sort(key=lambda x: x[1], reverse=True)
    return skill_popularity

def get_skills_by_specialization():
    """
    Group skills by specialization to see which specializations 
    have the most skill gaps across users.
    
    Returns:
        dict: Specializations with their associated lacking skills and counts
    """
    clusters = load_clusters()
    specialization_skills = defaultdict(lambda: defaultdict(int))
    
    # Count skills needed by specialization
    for skill, users in clusters.items():
        for user in users:
            specialization = user.get('preferred_specialization', 'Unknown')
            specialization_skills[specialization][skill] += 1
    
    # Convert to regular dictionary for JSON serialization
    return {spec: dict(skills) for spec, skills in specialization_skills.items()}

def get_user_specialization_distribution():
    """
    Get distribution of users across specializations.
    
    Returns:
        dict: Specialization counts
    """
    clusters = load_clusters()
    specialization_counts = defaultdict(set)
    
    # Count unique users per specialization
    for skill, users in clusters.items():
        for user in users:
            user_id = user.get('user_id')
            specialization = user.get('preferred_specialization', 'Unknown')
            specialization_counts[specialization].add(user_id)
    
    # Convert sets to counts
    return {spec: len(users) for spec, users in specialization_counts.items()}

def get_cluster_statistics():
    """
    Get comprehensive statistics about skill clusters.
    
    Returns:
        dict: Various statistics about the clusters
    """
    clusters = load_clusters()
    
    # Initialize statistics
    stats = {
        'total_skills': len(clusters),
        'total_unique_users': 0,
        'skills_by_popularity': [],
        'users_by_specialization': {},
        'avg_missing_skills_per_user': 0,
        'most_common_skill_gaps': []
    }
    
    # Count unique users across all clusters
    unique_users = set()
    user_skill_counts = defaultdict(int)
    skill_counts = defaultdict(int)
    
    for skill, users in clusters.items():
        skill_counts[skill] = len(users)
        for user in users:
            user_id = user.get('user_id')
            unique_users.add(user_id)
            user_skill_counts[user_id] += 1
    
    # Add statistics
    stats['total_unique_users'] = len(unique_users)
    
    # Calculate average missing skills per user
    if unique_users:
        stats['avg_missing_skills_per_user'] = sum(user_skill_counts.values()) / len(unique_users)
    
    # Add skills by popularity
    stats['skills_by_popularity'] = sorted(
        [(skill, count) for skill, count in skill_counts.items()],
        key=lambda x: x[1], reverse=True
    )
    
    # Add top skill gaps
    stats['most_common_skill_gaps'] = stats['skills_by_popularity'][:10]
    
    # Get user distribution by specialization
    stats['users_by_specialization'] = get_user_specialization_distribution()
    
    return stats

def visualize_clusters_text():
    """
    Generate a text-based visualization of skill clusters.
    
    Returns:
        str: Text visualization
    """
    clusters = load_clusters()
    visualization = []
    
    # Sort clusters by size
    sorted_clusters = sorted(clusters.items(), key=lambda x: len(x[1]), reverse=True)
    
    visualization.append("SKILL CLUSTERS VISUALIZATION")
    visualization.append("==========================")
    
    for skill, users in sorted_clusters:
        visualization.append(f"\n{skill} ({len(users)} users)")
        visualization.append("-" * 40)
        
        # Group users by specialization
        by_specialization = defaultdict(list)
        for user in users:
            by_specialization[user.get('preferred_specialization', 'Unknown')].append(user)
        
        # Display users by specialization
        for spec, spec_users in by_specialization.items():
            visualization.append(f"  {spec}: {len(spec_users)} users")
            for user in spec_users:
                visualization.append(f"    - {user['user_id']}")
    
    return "\n".join(visualization)

def get_related_skills(skill, threshold=0.3):
    """
    Find skills that are frequently needed together with the given skill.
    
    Args:
        skill (str): The skill to find related skills for
        threshold (float): Minimum co-occurrence ratio to consider skills related
        
    Returns:
        list: Related skills with their co-occurrence ratios
    """
    clusters = load_clusters()
    
    if skill not in clusters:
        return []
    
    # Get users who need this skill
    target_users = set(user['user_id'] for user in clusters[skill])
    related = []
    
    # Calculate co-occurrence with other skills
    for other_skill, other_users in clusters.items():
        if other_skill == skill:
            continue
            
        other_user_ids = set(user['user_id'] for user in other_users)
        
        # Calculate intersection of users
        common_users = target_users.intersection(other_user_ids)
        
        if not common_users:
            continue
            
        # Calculate co-occurrence ratio
        ratio = len(common_users) / len(target_users)
        
        if ratio >= threshold:
            related.append({
                'skill': other_skill,
                'co_occurrence_ratio': ratio,
                'common_users': len(common_users)
            })
    
    # Sort by co-occurrence ratio
    related.sort(key=lambda x: x['co_occurrence_ratio'], reverse=True)
    
    return related 