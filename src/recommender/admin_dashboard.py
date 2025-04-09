#!/usr/bin/env python3
"""
Admin dashboard for the career recommender system.
This script provides admin functionality to view feedback and user statistics.
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from collections import Counter, defaultdict

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.feedback_handler import get_all_feedback
from utils.data_loader import load_user_preferences, load_career_paths
from utils.cluster_manager import load_clusters
from utils.input_validator import get_validated_integer, get_validated_string

# Try to import model evaluation function
try:
    from utils.model_trainer import evaluate_model_performance
    MODEL_EVALUATION_AVAILABLE = True
except ImportError:
    MODEL_EVALUATION_AVAILABLE = False

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

def view_model_status():
    """View model status and performance metrics."""
    if not MODEL_EVALUATION_AVAILABLE:
        print("\nModel evaluation functionality is not available.")
        print("Please make sure the utils.model_trainer module is installed.")
        input("\nPress Enter to continue...")
        return
    
    print_header("MODEL STATUS")
    
    # Get model metrics
    try:
        metrics = evaluate_model_performance()
        
        if not metrics:
            print("No model found or evaluation failed.")
            input("\nPress Enter to continue...")
            return
        
        # Display model metrics
        print(f"Model trained at: {metrics.get('trained_at', 'Unknown')}")
        print(f"Training data shape: {metrics.get('training_data_shape', 'Unknown')}")
        print(f"Feedback entries used in training: {metrics.get('feedback_entries_used', 0)}")
        print(f"Accuracy: {metrics.get('accuracy', 0):.4f}")
        
        # Display class-specific metrics if available
        if "classification_report" in metrics:
            report = metrics["classification_report"]
            print("\nClass-specific metrics:")
            print("-" * 40)
            
            for class_name, class_metrics in report.items():
                if isinstance(class_metrics, dict):  # Skip non-class entries like 'accuracy'
                    print(f"\nClass: {class_name}")
                    print(f"  Precision: {class_metrics.get('precision', 0):.4f}")
                    print(f"  Recall: {class_metrics.get('recall', 0):.4f}")
                    print(f"  F1-score: {class_metrics.get('f1-score', 0):.4f}")
                    print(f"  Support: {class_metrics.get('support', 0)}")
        
        # Display feature importances if available
        if "feature_importances" in metrics and metrics["feature_importances"] is not None:
            print("\nTop feature importances:")
            print("-" * 40)
            
            # Only show top 10 features
            importances = metrics["feature_importances"]
            for i, importance in enumerate(importances[:10]):
                print(f"Feature {i}: {importance:.4f}")
    except Exception as e:
        print(f"Error evaluating model: {e}")
        print("\nThere was an issue with the model evaluation.")
        print("This might be due to compatibility issues with the existing model format.")
        print("\nOptions:")
        print("1. Run model retraining to create a compatible model")
        print("2. Check if the model file format is correct")
    
    input("\nPress Enter to continue...")

def retrain_model():
    """Retrain the recommendation model using accumulated feedback."""
    print_header("MODEL RETRAINING")
    
    # Check if we have the retraining script
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts', 'retrain_model.py')
    
    if not os.path.exists(script_path):
        print(f"Retraining script not found at: {script_path}")
        input("\nPress Enter to continue...")
        return
    
    # Ask user for retraining parameters
    force_retrain = get_validated_string("\nForce retraining regardless of conditions? (y/n): ", required=True).lower() == 'y'
    
    if not force_retrain:
        threshold = get_validated_integer("\nMinimum feedback entries for retraining (default 10): ", 1, 100)
        days = get_validated_integer("\nMinimum days between retraining (default 7): ", 1, 365)
    else:
        threshold = 1  # Minimum value to force retraining
        days = 0  # Minimum value to force retraining
    
    # Build command
    cmd = [sys.executable, script_path]
    
    if force_retrain:
        cmd.append('--force')
    else:
        cmd.extend(['--threshold', str(threshold), '--days', str(days)])
    
    print("\nStarting model retraining...\n")
    print("-" * 60)
    
    # Run the retraining process
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Stream output in real-time
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())
        
        # Get return code
        return_code = process.poll()
        
        # Check for errors
        if return_code != 0:
            error = process.stderr.read()
            print(f"\nError during retraining (code {return_code}):")
            print(error)
    except Exception as e:
        print(f"\nError executing retraining script: {e}")
    
    print("-" * 60)
    input("\nPress Enter to continue...")

def run_initial_training():
    """Run initial model training without requiring feedback data."""
    print_header("INITIAL MODEL TRAINING")
    
    # Check if we have the training script
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts', 'initial_model_training.py')
    
    if not os.path.exists(script_path):
        print(f"Initial training script not found at: {script_path}")
        input("\nPress Enter to continue...")
        return
    
    print("\nThis will train a new model using synthetic data.")
    print("Note: This will overwrite any existing model.\n")
    
    confirm = get_validated_string("\nDo you want to continue? (y/n): ", required=True).lower()
    if confirm != 'y':
        print("Operation cancelled.")
        input("\nPress Enter to continue...")
        return
    
    print("\nStarting initial model training...\n")
    print("-" * 60)
    
    # Run the initial training process
    try:
        process = subprocess.Popen([sys.executable, script_path], 
                                  stdout=subprocess.PIPE, 
                                  stderr=subprocess.PIPE, 
                                  text=True)
        
        # Stream output in real-time
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())
        
        # Get return code
        return_code = process.poll()
        
        # Check for errors
        if return_code != 0:
            error = process.stderr.read()
            print(f"\nError during initial training (code {return_code}):")
            print(error)
    except Exception as e:
        print(f"\nError executing initial training script: {e}")
    
    print("-" * 60)
    input("\nPress Enter to continue...")

def generate_synthetic_feedback():
    """Generate synthetic feedback data."""
    print_header("GENERATING SYNTHETIC FEEDBACK")
    
    # Check if we have the synthetic feedback script
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts', 'generate_feedback.py')
    
    if not os.path.exists(script_path):
        print(f"Synthetic feedback script not found at: {script_path}")
        input("\nPress Enter to continue...")
        return
    
    print("\nThis will generate synthetic feedback data.")
    print("Note: This operation will overwrite any existing synthetic feedback data.\n")
    
    confirm = get_validated_string("\nDo you want to continue? (y/n): ", required=True).lower()
    if confirm != 'y':
        print("Operation cancelled.")
        input("\nPress Enter to continue...")
        return
    
    print("\nStarting synthetic feedback generation...\n")
    print("-" * 60)
    
    # Run the synthetic feedback generation process
    try:
        process = subprocess.Popen([sys.executable, script_path], 
                                  stdout=subprocess.PIPE, 
                                  stderr=subprocess.PIPE, 
                                  text=True)
        
        # Stream output in real-time
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())
        
        # Get return code
        return_code = process.poll()
        
        # Check for errors
        if return_code != 0:
            error = process.stderr.read()
            print(f"\nError during synthetic feedback generation (code {return_code}):")
            print(error)
    except Exception as e:
        print(f"\nError executing synthetic feedback generation script: {e}")
    
    print("-" * 60)
    input("\nPress Enter to continue...")

def generate_diverse_training_data():
    """Generate diverse synthetic data for model training."""
    print_header("GENERATING DIVERSE TRAINING DATA")
    
    # Check if we have the diverse data generator script
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts', 'generate_diverse_data.py')
    
    if not os.path.exists(script_path):
        print(f"Diverse data generator script not found at: {script_path}")
        input("\nPress Enter to continue...")
        return
    
    print("\nThis will generate diverse synthetic data for model training.")
    print("Note: This operation will overwrite any existing synthetic training data.\n")
    
    confirm = get_validated_string("\nDo you want to continue? (y/n): ", required=True).lower()
    if confirm != 'y':
        print("Operation cancelled.")
        input("\nPress Enter to continue...")
        return
    
    print("\nStarting diverse data generation...\n")
    print("-" * 60)
    
    # Run the diverse data generation process
    try:
        process = subprocess.Popen([sys.executable, script_path], 
                                  stdout=subprocess.PIPE, 
                                  stderr=subprocess.PIPE, 
                                  text=True)
        
        # Stream output in real-time
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())
        
        # Get return code
        return_code = process.poll()
        
        # Check for errors
        if return_code != 0:
            error = process.stderr.read()
            print(f"\nError during diverse data generation (code {return_code}):")
            print(error)
    except Exception as e:
        print(f"\nError executing diverse data generation script: {e}")
    
    print("-" * 60)
    input("\nPress Enter to continue...")

def display_menu():
    """Display the main menu options."""
    print_header("ADMIN DASHBOARD - MAIN MENU")
    
    print("1. View Model Status")
    print("2. View User Statistics")
    print("3. View All Feedback")
    print("4. View Skill Clusters")
    print("5. Generate Synthetic Feedback")
    print("6. Retrain Model")
    print("7. Run Initial Model Training")
    print("8. Generate Diverse Training Data")
    print("9. Exit")
    
    return get_validated_integer("\nSelect an option (1-9): ", 1, 9)

def main():
    """Main function to run the admin dashboard."""
    # Set working directory to the recommender root
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("\nWelcome to the Career Recommender Admin Dashboard\n")
    
    run_dashboard = True
    while run_dashboard:
        # Clear screen for better UI
        clear_screen()
        choice = display_menu()
        
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