#!/usr/bin/env python3
"""
Extremely simplified admin dashboard that guarantees all menu options are displayed.
"""

import os
import sys
from admin_dashboard import (
    view_all_feedback, 
    view_user_statistics, 
    view_skill_clusters, 
    view_model_status,
    retrain_model,
    run_initial_training,
    generate_synthetic_feedback,
    generate_diverse_training_data
)
from utils.input_validator import get_validated_integer

def main():
    """Main function to run the simplified admin dashboard."""
    # Set working directory to the recommender root
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("\nWelcome to the Career Recommender Admin Dashboard\n")
    
    run_dashboard = True
    while run_dashboard:
        # Print menu as a single string to avoid buffer issues
        menu = """
============================================================
ADMIN DASHBOARD - MAIN MENU (SUPER SIMPLE VERSION)
============================================================

1. View Model Status
2. View User Statistics
3. View All Feedback
4. View Skill Clusters
5. Generate Synthetic Feedback
6. Retrain Model
7. Run Initial Model Training
8. Generate Diverse Training Data
9. Exit

Select an option (1-9): """
        
        # Get user choice
        try:
            choice = int(input(menu))
            if choice < 1 or choice > 9:
                print("\nInvalid option. Please enter a number between 1 and 9.")
                input("\nPress Enter to continue...")
                continue
        except ValueError:
            print("\nInvalid input. Please enter a number.")
            input("\nPress Enter to continue...")
            continue
            
        # Process the choice
        if choice == 1:
            view_model_status()
        elif choice == 2:
            view_user_statistics()
        elif choice == 3:
            view_all_feedback()
        elif choice == 4:
            view_skill_clusters()
        elif choice == 5:
            generate_synthetic_feedback()
        elif choice == 6:
            retrain_model()
        elif choice == 7:
            run_initial_training()
        elif choice == 8:
            generate_diverse_training_data()
        elif choice == 9:
            run_dashboard = False
            print("\nExiting Admin Dashboard...")
        else:
            print("\nInvalid option. Please try again.")
            input("\nPress Enter to continue...")

if __name__ == "__main__":
    main() 