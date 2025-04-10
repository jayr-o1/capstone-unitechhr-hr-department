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
import time

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
    if os.name == 'nt':  # Windows
        os.system('cls')
    else:  # Unix/Linux/Mac
        os.system('clear')
    
    # Add a small delay to ensure the screen is cleared properly
    time.sleep(0.1)

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
    
    # Ask user for retraining parameters
    force_retrain = get_validated_string("\nForce retraining regardless of conditions? (y/n): ", required=True).lower() == 'y'
    
    if not force_retrain:
        threshold = get_validated_integer("\nMinimum feedback entries for retraining (default 10): ", 1, 100)
        days = get_validated_integer("\nMinimum days between retraining (default 7): ", 1, 365)
    else:
        threshold = 1  # Minimum value to force retraining
        days = 0  # Minimum value to force retraining
    
    print("\nStarting model retraining...\n")
    print("-" * 60)
    
    # Import the model trainer and feedback handler directly
    from utils.model_trainer import retrain_model as model_retrain, evaluate_model_performance
    from utils.feedback_handler import get_all_feedback
    import time
    import threading
    
    # Get current feedback count
    feedback_entries = get_all_feedback()
    print(f"Current feedback entries: {len(feedback_entries)}")
    
    # Check current model metrics
    metrics = evaluate_model_performance()
    if metrics:
        print(f"Model last trained on: {metrics.get('trained_at', 'Unknown').split('T')[0]}")
        
        # Calculate days since last training
        try:
            last_trained = datetime.fromisoformat(metrics.get('trained_at'))
            days_since = (datetime.now() - last_trained).days
            print(f"Days since last training: {days_since}")
        except (ValueError, TypeError):
            days_since = float('inf')
            print("Days since last training: Unknown")
        
        print(f"Current model accuracy: {metrics.get('accuracy', 0):.4f}")
    else:
        print("No existing model found or evaluation failed.")
        days_since = float('inf')
    
    # Check if retraining is needed
    if force_retrain:
        print("\nForcing model retraining...")
        should_retrain = True
    elif len(feedback_entries) < threshold:
        print(f"\nNot enough feedback entries for retraining (need {threshold}, have {len(feedback_entries)}).")
        should_retrain = False
    elif days_since < days:
        print(f"\nModel was trained recently (within {days_since} days, threshold is {days} days).")
        should_retrain = False
    else:
        print(f"\nRetraining conditions met: {len(feedback_entries)} feedback entries and {days_since} days since last training.")
        should_retrain = True
    
    # Retrain the model if needed
    if should_retrain:
        try:
            # Start time for tracking duration
            start_time = time.time()
            
            # Create progress indicator
            def show_progress():
                indicators = ['|', '/', '-', '\\']
                i = 0
                while True:
                    sys.stdout.write(f"\rRetraining in progress {indicators[i % len(indicators)]} ")
                    sys.stdout.flush()
                    i += 1
                    time.sleep(0.2)
            
            # Try to start progress thread
            try:
                import threading
                stop_event = threading.Event()
                progress_thread = threading.Thread(target=show_progress)
                progress_thread.daemon = True
                progress_thread.start()
            except ImportError:
                progress_thread = None
                stop_event = None
            
            # Run retraining
            success = model_retrain(verbose=True)
            
            # Stop progress indicator
            if progress_thread and stop_event:
                stop_event.set()
                progress_thread.join(timeout=1.0)
            
            # Calculate duration
            duration = time.time() - start_time
            minutes, seconds = divmod(duration, 60)
            
            if success:
                print(f"\nModel retraining completed successfully! (Took {int(minutes)}m {int(seconds)}s)")
                
                # Show new model metrics
                new_metrics = evaluate_model_performance()
                if new_metrics:
                    print(f"\nNew model accuracy: {new_metrics.get('accuracy', 0):.4f}")
                    print(f"Feedback entries used: {new_metrics.get('feedback_entries_used', 0)}")
                    
                    # Compare with old metrics
                    if metrics:
                        old_accuracy = metrics.get('accuracy', 0)
                        accuracy_change = new_metrics.get('accuracy', 0) - old_accuracy
                        print(f"Accuracy change: {accuracy_change:+.4f}")
            else:
                print("\nModel retraining failed.")
        except Exception as e:
            # Stop the progress indicator
            if 'stop_event' in locals() and 'progress_thread' in locals():
                if stop_event and progress_thread:
                    stop_event.set()
                    if progress_thread.is_alive():
                        progress_thread.join(timeout=1.0)
            print(f"\nError during retraining: {e}")
    else:
        print("\nSkipping model retraining based on conditions.")
    
    print("-" * 60)
    input("\nPress Enter to continue...")

def run_initial_training():
    """Run initial model training without requiring feedback data."""
    print_header("INITIAL MODEL TRAINING")
    
    print("\nThis will train a new model using synthetic data.")
    print("Note: This will overwrite any existing model.\n")
    
    confirm = get_validated_string("\nDo you want to continue? (y/n): ", required=True).lower()
    if confirm != 'y':
        print("Operation cancelled.")
        input("\nPress Enter to continue...")
        return
    
    print("\nStarting initial model training...\n")
    print("-" * 60)
    
    # Import the model trainer directly
    from utils.model_trainer import initial_model_training
    import time
    import threading
    
    # Function to show continuous progress indicator
    def show_progress():
        indicators = ['|', '/', '-', '\\']
        i = 0
        while not stop_event.is_set():
            sys.stdout.write(f"\rTraining in progress {indicators[i % len(indicators)]} ")
            sys.stdout.flush()
            i += 1
            time.sleep(0.2)
        sys.stdout.write("\rTraining completed!          \n")
        sys.stdout.flush()
    
    # Set up progress indicator thread
    stop_event = threading.Event()
    progress_thread = threading.Thread(target=show_progress)
    progress_thread.daemon = True
    
    try:
        # Start time for tracking duration
        start_time = time.time()
        
        # Start progress indicator
        progress_thread.start()
        
        # Run the training directly
        success = initial_model_training()
        
        # Calculate training duration
        duration = time.time() - start_time
        minutes, seconds = divmod(duration, 60)
        
        # Stop the progress indicator
        stop_event.set()
        progress_thread.join(timeout=1.0)
        
        if success:
            print(f"\nModel training completed successfully! (Took {int(minutes)}m {int(seconds)}s)")
            
            # Evaluate the model
            try:
                from utils.model_trainer import evaluate_model_performance
                print("\nEvaluating model performance:")
                metrics = evaluate_model_performance()
                if metrics:
                    print(f"Model accuracy: {metrics['accuracy']:.4f}")
                    
                    if "classification_report" in metrics:
                        report = metrics["classification_report"]
                        class_names = []
                        for class_name, class_metrics in report.items():
                            if isinstance(class_metrics, dict):
                                class_names.append(class_name)
                        print(f"Trained for {len(class_names)} classes")
            except Exception as e:
                print(f"Error evaluating model: {e}")
        else:
            print("\nModel training failed. Check the logs for details.")
    except Exception as e:
        # Stop the progress indicator
        stop_event.set()
        if progress_thread.is_alive():
            progress_thread.join(timeout=1.0)
        print(f"\nError during initial training: {e}")
    
    print("-" * 60)
    input("\nPress Enter to continue...")

def generate_synthetic_feedback():
    """Generate synthetic feedback data optimized for model retraining."""
    print_header("GENERATING SYNTHETIC FEEDBACK")
    
    # Check if we have the synthetic feedback script
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts', 'generate_feedback.py')
    
    if not os.path.exists(script_path):
        print(f"Synthetic feedback script not found at: {script_path}")
        input("\nPress Enter to continue...")
        return
    
    print("\nThis will generate synthetic feedback data optimized for model retraining.")
    print("Note: You'll have the option to clear existing feedback data before generating new data.\n")
    
    confirm = get_validated_string("\nDo you want to continue? (y/n): ", required=True).lower()
    if confirm != 'y':
        print("Operation cancelled.")
        input("\nPress Enter to continue...")
        return
    
    print("\nStarting synthetic feedback generation...\n")
    print("-" * 60)
    
    # Run the synthetic feedback generation process
    try:
        # Run the script as a subprocess with interactive input
        process = subprocess.Popen([sys.executable, script_path], 
                                  stdin=subprocess.PIPE,
                                  stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE,
                                  universal_newlines=True)
        
        # Define the inputs we want to send
        clear_feedback = get_validated_string("Do you want to clear existing feedback data? (y/n): ", required=True).lower() == 'y'
        num_entries = get_validated_integer("How many feedback entries to generate? (default: 15): ", min_value=1, max_value=100, default_value=15)
        
        # Send inputs to the process
        inputs = f"{'y' if clear_feedback else 'n'}\n{num_entries}\n"
        stdout, stderr = process.communicate(inputs)
        
        # Display output
        print(stdout)
        
        # Check for errors
        if process.returncode != 0:
            print(f"\nError during synthetic feedback generation (code {process.returncode}):")
            print(stderr)
        else:
            print("\nSynthetic feedback generation completed successfully!")
            print("\nYou can now use this feedback data to retrain your model.")
    except Exception as e:
        print(f"\nError executing synthetic feedback generation script: {e}")
    
    print("-" * 60)
    input("\nPress Enter to continue...")

def generate_diverse_training_data():
    """Generate diverse synthetic data for model training."""
    print_header("GENERATING DIVERSE TRAINING DATA")
    
    print("\nThis will generate diverse synthetic data for model training.")
    print("Note: This operation will overwrite any existing synthetic training data.\n")
    
    confirm = get_validated_string("\nDo you want to continue? (y/n): ", required=True).lower()
    if confirm != 'y':
        print("Operation cancelled.")
        input("\nPress Enter to continue...")
        return
    
    print("\nStarting diverse data generation...\n")
    print("-" * 60)
    
    # Import needed modules upfront
    import os
    import time
    import random
    
    # Import the script to run directly
    try:
        # Make sure we have the scripts directory in the path
        scripts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts')
        sys.path.append(scripts_dir)
        
        try:
            # First try to import using importlib
            import importlib.util
            script_path = os.path.join(scripts_dir, 'generate_diverse_data.py')
            
            if not os.path.exists(script_path):
                print(f"Diverse data generator script not found at: {script_path}")
                input("\nPress Enter to continue...")
                return
                
            spec = importlib.util.spec_from_file_location("generate_diverse_data", script_path)
            generate_diverse_data_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(generate_diverse_data_module)
            
            if hasattr(generate_diverse_data_module, 'main'):
                # Start time for tracking duration
                start_time = time.time()
                
                # Run the main function directly
                generate_diverse_data_module.main()
                
                # Calculate duration
                duration = time.time() - start_time
                minutes, seconds = divmod(duration, 60)
                print(f"\nData generation completed successfully! (Took {int(minutes)}m {int(seconds)}s)")
            else:
                print("Could not find main function in generate_diverse_data.py")
        except Exception as import_error:
            print(f"Error importing generate_diverse_data.py: {import_error}")
            
            # Fallback to asking for the number of records and running the functions directly
            print("\nUsing fallback method to generate data:")
            
            try:
                # Import required functions
                from recommender import career_fields
                import pandas as pd
                
                # Get number of samples
                try:
                    num_samples = int(input("\nHow many employee records to generate? (default: 500): ") or "500")
                    if num_samples <= 0:
                        print("Number must be positive. Using default (500).")
                        num_samples = 500
                except ValueError:
                    print("Invalid input. Using default (500).")
                    num_samples = 500
                
                # Define the generate_diverse_employee_data function
                def generate_diverse_employee_data(num_samples):
                    """Generate diverse employee data."""
                    print(f"Generating {num_samples} diverse employee records...")
                    
                    # Lists to store generated data
                    records = []
                    
                    # Create more diverse skill combinations
                    for i in range(num_samples):
                        # Show progress every 5% of records
                        if i % max(1, num_samples // 20) == 0:
                            progress = (i / num_samples) * 100
                            print(f"Progress: {progress:.1f}% - Generated {i}/{num_samples} records")
                            
                        # Randomly select a field
                        field = random.choice(list(career_fields.keys()))
                        
                        # Randomly select a career goal from the field
                        career_goal = random.choice(career_fields[field]["roles"])
                        field_skills = career_fields[field]["skills"]
                        
                        # Select skills
                        num_skills = random.randint(3, 8)
                        selected_skills = random.sample(field_skills, min(num_skills, len(field_skills)))
                        skills_string = ", ".join(selected_skills)
                        
                        # Create record
                        record = {
                            "ID": f"EMP{random.randint(10000, 99999)}",
                            "Name": f"Employee {i+1}",
                            "Age": random.randint(22, 65),
                            "Field": field,
                            "Career Goal": career_goal,
                            "Skills": skills_string,
                            "Experience": f"{random.randint(0, 20)}+ years"
                        }
                        records.append(record)
                    
                    # Show completion
                    print(f"Progress: 100% - Generated {num_samples}/{num_samples} records")
                    
                    # Convert to DataFrame
                    df = pd.DataFrame(records)
                    return df
                
                # Make sure data directory exists
                data_dir = os.path.join("data")
                os.makedirs(data_dir, exist_ok=True)
                
                # Generate and save employee data
                start_time = time.time()
                employee_data = generate_diverse_employee_data(num_samples)
                employee_data_path = os.path.join(data_dir, "synthetic_employee_data.csv")
                employee_data.to_csv(employee_data_path, index=False)
                print(f"Saved {len(employee_data)} employee records to {employee_data_path}")
                
                # Calculate duration
                duration = time.time() - start_time
                minutes, seconds = divmod(duration, 60)
                print(f"\nData generation completed successfully! (Took {int(minutes)}m {int(seconds)}s)")
                
            except Exception as e:
                print(f"Error in fallback data generation: {e}")
    except Exception as e:
        print(f"\nError generating diverse data: {e}")
    
    print("-" * 60)
    input("\nPress Enter to continue...")

def display_menu():
    """Display the main menu options."""
    # Print the entire menu as a single string to avoid buffer issues
    menu = """
============================================================
ADMIN DASHBOARD - MAIN MENU
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
"""
    print(menu)
    
    return get_validated_integer("Select an option (1-9): ", 1, 9)

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