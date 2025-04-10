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
from utils.cluster_manager import load_clusters, get_skills_by_popularity, get_cluster_statistics, visualize_clusters_text
from utils.input_validator import get_validated_integer, get_validated_string, get_validated_list

# Try to import skill analyzer
try:
    from utils.skill_analyzer import (
        recommend_fields_based_on_skills, 
        recommend_specializations_for_field,
        analyze_skill_gap,
        get_training_recommendations_for_skills,
        group_users_by_missing_skills
    )
    SKILL_ANALYZER_AVAILABLE = True
except ImportError:
    SKILL_ANALYZER_AVAILABLE = False

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
    """Print a formatted header."""
    print("\n" + "="*60)
    print(title.center(60))
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
    """View skill clusters and user groups - ADMIN DASHBOARD VIEW."""
    clusters = load_clusters()
    
    if not clusters:
        print("No skill clusters available.")
        input("\nPress Enter to continue...")
        return
    
    print_header("SKILL CLUSTERS - ADMIN VIEW")
    
    # Get cluster statistics
    try:
        stats = get_cluster_statistics()
        print(f"Total unique skills: {stats['total_skills']}")
        print(f"Total unique users: {stats['total_unique_users']}")
        print(f"Average missing skills per user: {stats['avg_missing_skills_per_user']:.2f}")
        
        print("\nMost Common Skill Gaps:")
        for i, (skill, count) in enumerate(stats['most_common_skill_gaps'][:10], 1):
            print(f"{i}. {skill}: {count} users")
        
        print("\nUser Distribution by Specialization:")
        for spec, count in sorted(stats['users_by_specialization'].items(), key=lambda x: x[1], reverse=True):
            print(f"{spec}: {count} users")
    except Exception as e:
        print(f"Error getting cluster statistics: {e}")
    
    # Offer different view options
    print("\nView options:")
    print("1. Summary view")
    print("2. Detailed clusters view")
    print("3. Skill-focused view")
    print("4. Specialization-focused view")
    print("5. Training recommendation clusters")
    view_choice = get_validated_integer("\nSelect view option (1-5): ", 1, 5)
    
    if view_choice == 1:
        # Summary view already shown above
        pass
    
    elif view_choice == 2:
        # Detailed clusters view
        sorted_clusters = sorted(clusters.items(), key=lambda x: len(x[1]), reverse=True)
        
        # Ask how many clusters to show
        cluster_limit = get_validated_integer("\nHow many top clusters to display? (default 10): ", 
                                            default_value=10, min_value=1, max_value=len(sorted_clusters))
        
        for skill, users in sorted_clusters[:cluster_limit]:
            print(f"\nSkill: {skill} ({len(users)} users)")
            print("-" * 40)
            
            # Group users by specialization
            by_specialization = defaultdict(list)
            for user in users:
                by_specialization[user.get('preferred_specialization', 'Unknown')].append(user)
            
            # Display users by specialization
            for spec, spec_users in by_specialization.items():
                print(f"  {spec}: {len(spec_users)} users")
                
                # Ask if we should show user details
                if len(spec_users) > 5:
                    show_details = get_validated_string(f"  Show all {len(spec_users)} users for {spec}? (y/n): ", required=True).lower() == 'y'
                else:
                    show_details = True
                
                if show_details:
                    for user in spec_users:
                        print(f"    - User ID: {user.get('user_id')}")
                        print(f"      Current Skills: {', '.join(user.get('current_skills', []))[:100]}{'...' if len(', '.join(user.get('current_skills', []))) > 100 else ''}")
                        
                        # Option to view full user details
                        if get_validated_string(f"      View complete user details? (y/n): ", required=True).lower() == 'y':
                            user_data = load_user_preferences(user.get('user_id'))
                            if user_data:
                                print(f"      Full User Data:")
                                for key, value in user_data.items():
                                    if isinstance(value, list):
                                        print(f"        {key}: {', '.join(value)}")
                                    else:
                                        print(f"        {key}: {value}")
    
    elif view_choice == 3:
        # Skill-focused view
        # Let admin search for a specific skill
        search_skill = get_validated_string("\nEnter skill to search for (or press Enter to list all): ", required=False)
        
        if search_skill:
            # Show users who need this skill
            if search_skill in clusters:
                users = clusters[search_skill]
                print(f"\nUsers needing training in {search_skill} ({len(users)} users):")
                
                # Group by specialization
                by_specialization = defaultdict(list)
                for user in users:
                    by_specialization[user.get('preferred_specialization', 'Unknown')].append(user)
                
                # Show by specialization
                for spec, spec_users in by_specialization.items():
                    print(f"\n  {spec} ({len(spec_users)} users)")
                    for user in spec_users:
                        print(f"    - User ID: {user.get('user_id')}")
                        print(f"      Current Skills: {', '.join(user.get('current_skills', []))[:100]}{'...' if len(', '.join(user.get('current_skills', []))) > 100 else ''}")
            else:
                print(f"\nNo users found needing training in '{search_skill}'")
        else:
            # List all skills with user counts
            print("\nAll skills by popularity:")
            skills_by_popularity = get_skills_by_popularity()
            for i, (skill, count) in enumerate(skills_by_popularity, 1):
                print(f"{i}. {skill}: {count} users")
    
    elif view_choice == 4:
        # Specialization-focused view
        specializations = set()
        for skill, users in clusters.items():
            for user in users:
                specializations.add(user.get('preferred_specialization', 'Unknown'))
        
        print("\nAvailable specializations:")
        specialization_list = sorted(list(specializations))
        for i, spec in enumerate(specialization_list, 1):
            print(f"{i}. {spec}")
        
        spec_choice = get_validated_integer("\nSelect specialization number (1-{}): ".format(len(specialization_list)), 
                                          1, len(specialization_list))
        selected_spec = specialization_list[spec_choice-1]
        
        print(f"\nSkill gaps for {selected_spec} specialization:")
        spec_skills = defaultdict(list)
        
        for skill, users in clusters.items():
            for user in users:
                if user.get('preferred_specialization') == selected_spec:
                    spec_skills[skill].append(user)
        
        sorted_spec_skills = sorted(spec_skills.items(), key=lambda x: len(x[1]), reverse=True)
        for skill, users in sorted_spec_skills:
            print(f"  {skill}: {len(users)} users")
            
            if get_validated_string(f"  Show users for {skill}? (y/n): ", required=True).lower() == 'y':
                for user in users:
                    print(f"    - User ID: {user.get('user_id')}")
    
    elif view_choice == 5:
        # Training recommendation clusters
        if SKILL_ANALYZER_AVAILABLE:
            # Group users by missing skills for training clusters
            training_groups = group_users_by_missing_skills()
            
            print("\nTraining recommendation clusters:")
            for skill, users in sorted(training_groups.items(), key=lambda x: len(x[1]), reverse=True)[:15]:
                print(f"\n{skill} ({len(users)} users)")
                print("-" * 40)
                
                # Get training recommendations for this skill
                recs = get_training_recommendations_for_skills([skill])
                if skill in recs:
                    print("  Recommended training:")
                    for i, rec in enumerate(recs[skill], 1):
                        print(f"    {i}. {rec}")
                
                # Show users who need this training
                if get_validated_string(f"  Show users who need {skill} training? (y/n): ", required=True).lower() == 'y':
                    for user in users:
                        print(f"    - User ID: {user.get('user_id')}")
                        print(f"      Specialization: {user.get('preferred_specialization', 'Unknown')}")
        else:
            print("\nSkill analyzer module is not available. Cannot generate training clusters.")
    
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

def analyze_skill_gaps():
    """Analyze skill gaps for users and specializations."""
    if not SKILL_ANALYZER_AVAILABLE:
        print("\nSkill analyzer functionality is not available.")
        print("Please make sure the utils.skill_analyzer module is installed.")
        input("\nPress Enter to continue...")
        return
    
    print_header("SKILL GAP ANALYSIS")
    
    # Options submenu
    print("1. Analyze skill gap for a specific user")
    print("2. Analyze skill gap for a specialization")
    print("3. Generate field recommendations based on skills")
    print("4. Generate specialization recommendations for a field")
    print("5. View training recommendations for skills")
    print("6. Back to main menu")
    
    choice = get_validated_integer("\nSelect an option (1-6): ", 1, 6)
    
    if choice == 1:
        # Analyze skill gap for a specific user
        user_id = get_validated_string("\nEnter user ID: ", required=True)
        try:
            user_data = load_user_preferences(user_id)
            if not user_data:
                print(f"User {user_id} not found.")
                input("\nPress Enter to continue...")
                return
            
            # Get user's current skills and preferred specialization
            current_skills = user_data.get('current_skills', [])
            preferred_specialization = user_data.get('preferred_specialization')
            
            if not preferred_specialization:
                print(f"User {user_id} does not have a preferred specialization.")
                input("\nPress Enter to continue...")
                return
            
            # Analyze skill gap
            analysis = analyze_skill_gap(current_skills, preferred_specialization)
            
            print(f"\nSkill Gap Analysis for User {user_id}")
            print(f"Preferred Specialization: {preferred_specialization}")
            print(f"Match Percentage: {analysis['match_percentage']}%")
            print(f"\nCurrent Skills ({len(current_skills)}):")
            for skill in current_skills:
                print(f"  - {skill}")
            
            print(f"\nMissing Skills ({len(analysis['missing_skills'])}):")
            for skill in analysis['missing_skills']:
                print(f"  - {skill}")
            
            # Get training recommendations for missing skills
            if analysis['missing_skills']:
                print("\nTraining Recommendations:")
                training_recs = get_training_recommendations_for_skills(analysis['missing_skills'])
                for skill, recommendations in training_recs.items():
                    print(f"\n  {skill}:")
                    for i, rec in enumerate(recommendations, 1):
                        print(f"    {i}. {rec}")
        except Exception as e:
            print(f"Error analyzing skill gap: {e}")
    
    elif choice == 2:
        # Analyze skill gap for a specialization
        career_paths = load_career_paths()
        specializations = [path['title'] for path in career_paths]
        
        print("\nAvailable Specializations:")
        for i, spec in enumerate(specializations, 1):
            print(f"{i}. {spec}")
        
        spec_choice = get_validated_integer("\nSelect a specialization (1-{}): ".format(len(specializations)), 1, len(specializations))
        selected_specialization = specializations[spec_choice-1]
        
        # Get all users with this specialization
        clusters = load_clusters()
        users_with_spec = []
        
        for skill, users in clusters.items():
            for user in users:
                if user.get('preferred_specialization') == selected_specialization and user.get('user_id') not in [u.get('user_id') for u in users_with_spec]:
                    users_with_spec.append(user)
        
        print(f"\nUsers with {selected_specialization} specialization: {len(users_with_spec)}")
        
        # Get common missing skills
        skill_counts = Counter()
        for skill, users in clusters.items():
            for user in users:
                if user.get('preferred_specialization') == selected_specialization:
                    skill_counts[skill] += 1
        
        print("\nCommon Missing Skills:")
        for skill, count in skill_counts.most_common(10):
            percentage = (count / len(users_with_spec)) * 100 if users_with_spec else 0
            print(f"  - {skill}: {count} users ({percentage:.1f}%)")
        
        # Show training recommendations for top skills
        if skill_counts:
            top_skills = [skill for skill, _ in skill_counts.most_common(3)]
            print("\nTraining Recommendations for Top Skills:")
            training_recs = get_training_recommendations_for_skills(top_skills)
            for skill, recommendations in training_recs.items():
                print(f"\n  {skill}:")
                for i, rec in enumerate(recommendations, 1):
                    print(f"    {i}. {rec}")
    
    elif choice == 3:
        # Generate field recommendations based on skills
        skills = get_validated_list("\nEnter skills (comma-separated): ", min_items=1)
        field_recommendations = recommend_fields_based_on_skills(skills)
        
        print("\nField Recommendations:")
        for i, field_rec in enumerate(field_recommendations[:5], 1):
            print(f"{i}. {field_rec['field']} (Match: {field_rec['match_percentage']}%)")
            print(f"   Specializations: {', '.join(field_rec['specializations'])}")
            print(f"   Matching Skills: {', '.join(field_rec['matching_skills'])}")
            print(f"   Missing Skills: {', '.join(field_rec['missing_skills'][:5])}{'...' if len(field_rec['missing_skills']) > 5 else ''}")
    
    elif choice == 4:
        # Generate specialization recommendations for a field
        # First show available fields
        fields = {
            "Technology": ["Software Development", "Data Science", "Cybersecurity", "Cloud Computing"],
            "Criminal Justice": ["Criminology", "Forensic Science", "Law Enforcement", "Criminal Justice"],
            "Healthcare": ["Healthcare Administration", "Nursing", "Clinical Psychology", "Industrial-Organizational Psychology"],
            "Business": ["Marketing", "Finance", "Human Resources"],
            "Engineering": ["Mechanical Engineering", "Civil Engineering"],
            "Education": ["Elementary Education", "Secondary Education"],
            "Creative Arts": ["Graphic Design", "Film Production"],
            "Legal": ["Legal Practice"],
            "Science": ["Environmental Science"],
            "Media": ["Journalism"],
            "Social Services": ["Social Work"],
            "Healthcare Specialists": ["Physical Therapy", "Speech-Language Pathology"],
            "Design": ["Architecture", "Interior Design"],
            "Agriculture": ["Agriculture"],
            "Hospitality": ["Hospitality Management"],
            "Medical": ["Dentistry", "Pharmacy", "Veterinary Medicine"],
            "Urban Development": ["Urban Planning"]
        }
        
        print("\nAvailable Fields:")
        field_list = list(fields.keys())
        for i, field in enumerate(field_list, 1):
            print(f"{i}. {field}")
        
        field_choice = get_validated_integer("\nSelect a field (1-{}): ".format(len(field_list)), 1, len(field_list))
        selected_field = field_list[field_choice-1]
        
        # Get user skills
        skills = get_validated_list("\nEnter skills (comma-separated): ", min_items=1)
        
        # Get specialization recommendations
        spec_recommendations = recommend_specializations_for_field(skills, selected_field)
        
        print(f"\nSpecialization Recommendations for {selected_field}:")
        for i, spec_rec in enumerate(spec_recommendations, 1):
            print(f"{i}. {spec_rec['specialization']} (Match: {spec_rec['match_percentage']}%)")
            print(f"   Matching Skills: {', '.join(spec_rec['matching_skills'])}")
            print(f"   Missing Skills: {', '.join(spec_rec['missing_skills'])}")
    
    elif choice == 5:
        # View training recommendations for skills
        # First show popular skills
        popular_skills = get_skills_by_popularity()
        
        print("\nPopular Skills:")
        for i, (skill, count) in enumerate(popular_skills[:20], 1):
            print(f"{i}. {skill} ({count} users)")
        
        skill_choice = get_validated_string("\nEnter skill to view training recommendations: ", required=True)
        
        # Get training recommendations
        training_recs = get_training_recommendations_for_skills([skill_choice])
        
        if skill_choice in training_recs:
            print(f"\nTraining Recommendations for {skill_choice}:")
            for i, rec in enumerate(training_recs[skill_choice], 1):
                print(f"{i}. {rec}")
        else:
            print(f"\nNo specific training recommendations found for {skill_choice}.")
    
    input("\nPress Enter to continue...")

def display_menu():
    """Display admin dashboard menu."""
    clear_screen()
    
    print_header("CAREER RECOMMENDER SYSTEM - ADMIN DASHBOARD")
    
    print("1. View User Statistics")
    print("2. View All Feedback")
    print("3. View Model Status")
    print("4. View Skill Clusters (Admin Only)")
    print("5. Run Initial Model Training")
    print("6. Retrain Model")
    print("7. Generate Synthetic Feedback")
    print("8. Generate Diverse Training Data")
    print("9. Analyze Skill Gaps")
    print("0. Exit")
    
    choice = get_validated_integer("\nEnter your choice (0-9): ", 0, 9)
    
    # Add a warning when accessing admin-only features
    if choice == 4:
        print("\n⚠️ NOTE: Skill clusters are only visible in the admin dashboard.")
        print("   Regular users will not see these clusters in the recommender interface.")
        proceed = get_validated_string("   Continue? (y/n): ", required=True).lower()
        if proceed != 'y':
            return display_menu()  # Show menu again if user aborts
    
    return choice

def main():
    """Main function for admin dashboard."""
    run_dashboard = True
    
    while run_dashboard:
        choice = display_menu()
        
        if choice == 1:
            view_user_statistics()
        elif choice == 2:
            view_all_feedback()
        elif choice == 3:
            view_model_status()
        elif choice == 4:
            view_skill_clusters()
        elif choice == 5:
            run_initial_training()
        elif choice == 6:
            retrain_model()
        elif choice == 7:
            generate_synthetic_feedback()
        elif choice == 8:
            generate_diverse_training_data()
        elif choice == 9:
            analyze_skill_gaps()
        elif choice == 0:
            run_dashboard = False
            print("\nExiting Admin Dashboard...")
    
    print("\nThank you for using the Admin Dashboard!")

if __name__ == "__main__":
    main() 