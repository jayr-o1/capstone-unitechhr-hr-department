#!/usr/bin/env python3
"""
Simple script to run specific admin dashboard functions.
"""

import sys
from admin_dashboard import (
    view_all_feedback, 
    view_user_statistics, 
    view_skill_clusters, 
    view_model_status,
    retrain_model,
    run_initial_training,
    generate_synthetic_feedback
)

def print_usage():
    """Print script usage instructions."""
    print("Usage: python run_admin_option.py [OPTION]")
    print("Options:")
    print("  1 - View All Feedback")
    print("  2 - View User Statistics")
    print("  3 - View Skill Clusters")
    print("  4 - View Model Status")
    print("  5 - Retrain Model")
    print("  6 - Run Initial Model Training")
    print("  7 - Generate Synthetic Feedback")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print_usage()
        sys.exit(1)
        
    try:
        option = int(sys.argv[1])
    except ValueError:
        print("Error: Option must be a number between 1 and 7")
        print_usage()
        sys.exit(1)
        
    # Map options to functions
    options = {
        1: view_all_feedback,
        2: view_user_statistics,
        3: view_skill_clusters,
        4: view_model_status,
        5: retrain_model,
        6: run_initial_training,
        7: generate_synthetic_feedback
    }
    
    if option not in options:
        print(f"Error: Invalid option {option}")
        print_usage()
        sys.exit(1)
        
    # Run the selected function
    options[option]() 