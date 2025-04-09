#!/usr/bin/env python3
"""
Simple script to run the admin dashboard without screen clearing,
to ensure all options are displayed.
"""

import os
import sys
import time
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

def print_menu():
    """Display the main menu options."""
    print("\n" + "="*60)
    print("ADMIN DASHBOARD - MAIN MENU (SIMPLE VERSION)")
    print("="*60 + "\n")
    
    print("DEBUG: Starting to print options...")
    print("1. View Model Status")
    print("DEBUG: Printed option 1")
    print("2. View User Statistics")
    print("DEBUG: Printed option 2")
    print("3. View All Feedback")
    print("DEBUG: Printed option 3")
    print("4. View Skill Clusters")
    print("DEBUG: Printed option 4")
    print("5. Generate Synthetic Feedback")
    print("DEBUG: Printed option 5")
    print("6. Retrain Model")
    print("DEBUG: Printed option 6")
    print("7. Run Initial Model Training")
    print("DEBUG: Printed option 7")
    print("8. Generate Diverse Training Data")
    print("DEBUG: Printed option 8")
    print("9. Exit")
    print("DEBUG: Printed option 9")
    print("DEBUG: About to return user input...")
    
    return get_validated_integer("\nSelect an option (1-9): ", 1, 9)

def main():
    """Main function to run the admin dashboard."""
    # Set working directory to the recommender root
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("\nWelcome to the Career Recommender Admin Dashboard\n")
    
    run_dashboard = True
    while run_dashboard:
        choice = print_menu()
        
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
            print("Invalid option. Please try again.")
            input("\nPress Enter to continue...")

if __name__ == "__main__":
    main() 