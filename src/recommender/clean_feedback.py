#!/usr/bin/env python3
"""
Script to clear all user feedback data from the recommender system.
This will create a backup of existing data before removing it.
"""

import os
import json
import shutil
from datetime import datetime

def main():
    """Main function to clean feedback data."""
    # Define paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    feedback_dir = os.path.join(base_dir, 'data', 'feedback')
    backup_dir = os.path.join(base_dir, 'data', 'backups')
    
    # Create backup directory if it doesn't exist
    os.makedirs(backup_dir, exist_ok=True)
    
    # Check if feedback directory exists
    if not os.path.exists(feedback_dir):
        print("No feedback directory found. Nothing to clean.")
        return
    
    # Backup existing feedback data
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(backup_dir, f"feedback_backup_{timestamp}")
    
    try:
        # Create a backup
        if os.path.exists(feedback_dir) and os.listdir(feedback_dir):
            shutil.copytree(feedback_dir, backup_path)
            print(f"Backed up existing feedback data to: {backup_path}")
            
            # Count number of feedback files
            feedback_files = [f for f in os.listdir(feedback_dir) if f.endswith('.json')]
            feedback_count = len(feedback_files)
            
            # Remove all feedback files
            for file in feedback_files:
                os.remove(os.path.join(feedback_dir, file))
            
            print(f"Removed {feedback_count} feedback records.")
            
            # Create an empty feedback.json file to maintain structure
            with open(os.path.join(feedback_dir, 'feedback.json'), 'w') as f:
                json.dump({"feedback": []}, f, indent=2)
            
            print("Created empty feedback structure.")
        else:
            print("No feedback data found to clean.")
            
            # Create feedback directory and empty structure if it doesn't exist
            os.makedirs(feedback_dir, exist_ok=True)
            with open(os.path.join(feedback_dir, 'feedback.json'), 'w') as f:
                json.dump({"feedback": []}, f, indent=2)
            
            print("Created empty feedback structure.")
    
    except Exception as e:
        print(f"Error: {str(e)}")
        print("Feedback cleanup failed.")
        return
    
    print("\nFeedback data cleanup complete.")

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("CAREER RECOMMENDER FEEDBACK CLEANUP UTILITY")
    print("=" * 60)
    
    confirm = input("\nThis will remove ALL user feedback data. Are you sure? (yes/no): ")
    if confirm.lower() == 'yes':
        main()
    else:
        print("Operation cancelled.") 