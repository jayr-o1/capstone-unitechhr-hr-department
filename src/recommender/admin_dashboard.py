#!/usr/bin/env python3
"""
Admin dashboard for the career recommender system.
This script provides admin functionality to view feedback and user statistics.
"""

import os
import sys
import json
from datetime import datetime
from collections import Counter, defaultdict

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.feedback_handler import get_all_feedback
from utils.data_loader import load_user_preferences, load_career_paths
from utils.cluster_manager import load_clusters
from utils.input_validator import get_validated_integer, get_validated_string

def clear_screen():
    """Clear the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header(title):
    """Print a header with a title."""
    print("\n" + "="*60)
    print(title)
    print("="*60 + "\n")

def view_all_feedback():
    """View all user feedback."""
    feedback = get_all_feedback()
    
    if not feedback:
        print("No feedback available.")
        return
    
    print_header("USER FEEDBACK")
    
    # Calculate average rating
    ratings = [f['rating'] for f in feedback]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    
    print(f"Total feedback entries: {len(feedback)}")
    print(f"Average rating: {avg_rating:.1f}/5.0\n")
    
    # Display feedback entries
    for i, entry in enumerate(feedback, 1):
        print(f"Feedback #{i}")
        print(f"User ID: {entry['user_id']}")
        print(f"Rating: {entry['rating']}/5")
        print(f"Comments: {entry['comments']}")
        print(f"Suggestions: {entry['suggestions']}")
        print(f"Timestamp: {entry['timestamp']}")
        print("-" * 40)
    
    input("\nPress Enter to continue...")

def view_user_statistics():
    """View user statistics."""
    # Get user data directory
    users_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'users')
    
    if not os.path.exists(users_dir):
        print("No user data available.")
        return
    
    # Load all user data
    users = []
    for filename in os.listdir(users_dir):
        if filename.endswith('.json'):
            user_id = filename.replace('.json', '')
            user_data = load_user_preferences(user_id)
            if user_data:
                users.append(user_data)
    
    if not users:
        print("No user data available.")
        return
    
    print_header("USER STATISTICS")
    
    # Calculate statistics
    specializations = Counter(user['preferred_specialization'] for user in users)
    lacking_skills = Counter()
    for user in users:
        for skill in user.get('lacking_skills', []):
            lacking_skills[skill] += 1
    
    # Display statistics
    print(f"Total users: {len(users)}")
    
    print("\nSpecialization Distribution:")
    for spec, count in specializations.most_common():
        print(f"- {spec}: {count} users ({count/len(users)*100:.1f}%)")
    
    print("\nMost Common Skill Gaps:")
    for skill, count in lacking_skills.most_common(10):
        print(f"- {skill}: {count} users ({count/len(users)*100:.1f}%)")
    
    input("\nPress Enter to continue...")

def view_skill_clusters():
    """View skill clusters and user groups."""
    clusters = load_clusters()
    
    if not clusters:
        print("No skill clusters available.")
        return
    
    print_header("SKILL CLUSTERS")
    
    # Sort clusters by number of users
    sorted_clusters = sorted(clusters.items(), key=lambda x: len(x[1]), reverse=True)
    
    for skill, users in sorted_clusters:
        print(f"\nSkill: {skill} ({len(users)} users)")
        print("-" * 40)
        
        # Group users by specialization
        by_specialization = defaultdict(list)
        for user in users:
            by_specialization[user['preferred_specialization']].append(user)
        
        # Display users by specialization
        for spec, spec_users in by_specialization.items():
            print(f"  {spec}: {len(spec_users)} users")
    
    input("\nPress Enter to continue...")

def main_menu():
    """Display the main menu and handle user choices."""
    while True:
        clear_screen()
        print_header("ADMIN DASHBOARD")
        
        print("1. View All Feedback")
        print("2. View User Statistics")
        print("3. View Skill Clusters")
        print("4. Exit")
        
        choice = get_validated_integer("\nEnter your choice (1-4): ", 1, 4)
        
        if choice == 1:
            view_all_feedback()
        elif choice == 2:
            view_user_statistics()
        elif choice == 3:
            view_skill_clusters()
        elif choice == 4:
            print("\nExiting Admin Dashboard. Goodbye!")
            break
        else:
            print("\nInvalid choice. Please try again.")
            input("\nPress Enter to continue...")

if __name__ == "__main__":
    main_menu() 