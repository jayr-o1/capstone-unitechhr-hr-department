"""
Error handling utilities for the recommender system.
These functions help manage various error conditions.
"""

import os
import json
import logging
import traceback
from datetime import datetime

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename=os.path.join(log_dir, 'error.log'),
    filemode='a'
)

logger = logging.getLogger('recommender')

def safe_load_json(filepath, default_value=None):
    """
    Safely load a JSON file with error handling.
    
    Args:
        filepath (str): Path to the JSON file
        default_value: Value to return if file can't be loaded
        
    Returns:
        The loaded JSON data or default_value if there was an error
    """
    try:
        if not os.path.exists(filepath):
            return default_value
            
        with open(filepath, 'r') as f:
            return json.load(f)
            
    except json.JSONDecodeError:
        logger.error(f"Error decoding JSON in file: {filepath}")
        log_error(f"Error decoding JSON in file: {filepath}")
        return default_value
    except Exception as e:
        logger.error(f"Error loading file {filepath}: {str(e)}")
        log_error(f"Error loading file {filepath}: {str(e)}")
        return default_value

def safe_save_json(data, filepath):
    """
    Safely save data to a JSON file with error handling.
    
    Args:
        data: The data to save
        filepath (str): Path to the JSON file
        
    Returns:
        bool: True if successful, False otherwise
    """
    directory = os.path.dirname(filepath)
    
    try:
        # Create directory if it doesn't exist
        if not os.path.exists(directory):
            os.makedirs(directory)
            
        # Create a backup if file exists
        if os.path.exists(filepath):
            backup_path = f"{filepath}.bak"
            with open(filepath, 'r') as src:
                with open(backup_path, 'w') as dst:
                    dst.write(src.read())
        
        # Save the new data
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=4)
            
        return True
        
    except Exception as e:
        logger.error(f"Error saving to file {filepath}: {str(e)}")
        log_error(f"Error saving to file {filepath}: {str(e)}")
        return False

def log_error(error_message):
    """
    Log an error to the error log file.
    
    Args:
        error_message (str): The error message to log
    """
    try:
        error_log = os.path.join(log_dir, 'detailed_errors.log')
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        with open(error_log, 'a') as f:
            f.write(f"\n[{timestamp}] ERROR: {error_message}\n")
            f.write(traceback.format_exc())
            f.write("\n" + "-"*50 + "\n")
    except:
        pass  # If we can't log the error, there's not much we can do

def handle_user_error(error_message, exit_program=False):
    """
    Handle errors that should be displayed to the user.
    
    Args:
        error_message (str): The error message to display
        exit_program (bool): Whether to exit the program after displaying the error
    """
    print("\n" + "="*60)
    print("ERROR")
    print("="*60)
    
    print(f"\n{error_message}")
    
    if exit_program:
        print("\nThe program will now exit. Please try again later.")
        exit(1)
    else:
        print("\nPlease try again.")
        input("\nPress Enter to continue...")

def handle_startup_errors():
    """
    Check for common startup issues and handle them gracefully.
    
    Returns:
        bool: True if startup should proceed, False if program should exit
    """
    # Check essential directories
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
    if not os.path.exists(data_dir):
        handle_user_error("Data directory not found. Creating it now...", exit_program=False)
        try:
            os.makedirs(data_dir)
            os.makedirs(os.path.join(data_dir, 'users'), exist_ok=True)
            os.makedirs(os.path.join(data_dir, 'feedback'), exist_ok=True)
            os.makedirs(os.path.join(data_dir, 'clusters'), exist_ok=True)
        except Exception as e:
            handle_user_error(f"Failed to create data directories: {str(e)}", exit_program=True)
            return False
    
    # Check for essential data files
    career_paths_file = os.path.join(data_dir, 'career_paths.json') 
    if not os.path.exists(career_paths_file):
        handle_user_error("Career paths data file not found. Please run initialize_and_run.py first.", exit_program=True)
        return False
        
    return True 