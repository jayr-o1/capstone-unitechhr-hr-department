import os
import sys
import importlib.util
import traceback

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the create_dummy_users function
from utils.create_dummy_users import create_dummy_users

# Import the cluster manager
from utils.cluster_manager import update_clusters

# Import error handling
from utils.error_handler import handle_user_error, handle_startup_errors

def safe_import(module_name, function_name):
    """Safely import a function from a module with error handling."""
    try:
        module = __import__(module_name, fromlist=[function_name])
        return getattr(module, function_name)
    except ImportError:
        handle_user_error(f"Failed to import {module_name}. Please check your installation.", exit_program=True)
    except AttributeError:
        handle_user_error(f"Function {function_name} not found in {module_name}.", exit_program=True)
    return None

def main():
    """Initialize the system and run it."""
    try:
        print("\n=== Checking System Requirements ===")
        if not handle_startup_errors():
            return
        
        print("\n=== Initializing Dummy Users ===")
        create_dummy_users = safe_import("utils.create_dummy_users", "create_dummy_users")
        create_dummy_users()
        
        print("\n=== Creating Skill Clusters ===")
        update_clusters = safe_import("utils.cluster_manager", "update_clusters")
        update_clusters()
        
        print("\n=== Starting Recommender System ===")
        from run_recommender import main as run_main
        run_main()
        
    except KeyboardInterrupt:
        print("\n\nProgram interrupted by user. Exiting gracefully...")
        return
    except Exception as e:
        error_message = f"Unexpected error: {str(e)}"
        handle_user_error(error_message, exit_program=True)
        print("\nDetailed error information has been logged.")
        
        # Log detailed error info
        log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        with open(os.path.join(log_dir, 'crash.log'), 'a') as f:
            f.write(f"\n=== ERROR: {error_message} ===\n")
            f.write(traceback.format_exc())

if __name__ == "__main__":
    main() 