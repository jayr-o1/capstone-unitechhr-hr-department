#!/usr/bin/env python3
"""
Cleanup script to remove temporary and test files from the recommender system.
This ensures a clean project structure with only the essential components.
"""

import os
import shutil
import sys

def cleanup_recommender_directory():
    """Remove temporary and test files from the recommender directory."""
    
    # Files to be removed
    files_to_remove = [
        # Test and demo files
        "test_career_path.py",
        "weak_field_generator.py",
        "targeted_data_generator.py",
        
        # Backup and obsolete implementations
        "hybrid_recommender.py",
        
        # Temporary files that might exist
        "temp_*.py",
        "*.tmp",
        "*.bak"
    ]
    
    # Get the current directory (where this script is located)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("Cleaning up recommender directory...")
    print(f"Working in: {current_dir}")
    
    # Count of removed files
    removed_count = 0
    
    # Remove specific files
    for file_pattern in files_to_remove:
        # Handle wildcards
        if '*' in file_pattern:
            import glob
            matches = glob.glob(os.path.join(current_dir, file_pattern))
            for file_path in matches:
                if os.path.isfile(file_path):
                    try:
                        os.remove(file_path)
                        print(f"Removed: {os.path.basename(file_path)}")
                        removed_count += 1
                    except Exception as e:
                        print(f"Error removing {file_path}: {e}")
        else:
            # Direct file removal
            file_path = os.path.join(current_dir, file_pattern)
            if os.path.isfile(file_path):
                try:
                    os.remove(file_path)
                    print(f"Removed: {file_pattern}")
                    removed_count += 1
                except Exception as e:
                    print(f"Error removing {file_path}: {e}")
    
    # Also clean __pycache__ directories
    for root, dirs, files in os.walk(current_dir):
        if os.path.basename(root) == "__pycache__":
            try:
                shutil.rmtree(root)
                print(f"Removed: {root}")
                removed_count += 1
            except Exception as e:
                print(f"Error removing {root}: {e}")
    
    print(f"\nCleanup complete. Removed {removed_count} items.")
    
    # Instructions for additional manual cleanup if needed
    print("\nFor a deeper cleanup, you may want to manually review these directories:")
    print("- models/history/ - Contains old model versions")
    print("- models/backups/ - Contains model backups")
    print("- logs/ - Contains log files that may not be needed")

if __name__ == "__main__":
    # Ask for confirmation
    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        cleanup_recommender_directory()
    else:
        print("Warning: This script will remove temporary and test files from the recommender directory.")
        print("Make sure you have backed up any important files.")
        confirmation = input("Do you want to proceed? (y/n): ")
        if confirmation.lower() in ['y', 'yes']:
            cleanup_recommender_directory()
        else:
            print("Cleanup canceled.") 