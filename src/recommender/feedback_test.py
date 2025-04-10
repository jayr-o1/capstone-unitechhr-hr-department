#!/usr/bin/env python3
"""
Test script for the feedback system.
"""

import os
import sys
import json
from datetime import datetime

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from utils.feedback_handler import save_feedback, get_user_feedback, analyze_feedback
except ImportError as e:
    print(f"Error importing feedback handler: {e}")
    sys.exit(1)

def test_feedback_save():
    """Test saving feedback."""
    print("\nTesting feedback save...")
    
    # Create test feedback data
    feedback_data = {
        "user_id": "test_user",
        "timestamp": datetime.now().isoformat(),
        "specialization": "Software Development",
        "match_percentage": 75,
        "satisfaction_rating": 4,
        "feedback_comment": "This is a test comment",
        "recommendation_version": "test_v1.0"
    }
    
    # Save the feedback
    result = save_feedback(feedback_data)
    
    if result:
        print("Feedback saved successfully!")
    else:
        print("Failed to save feedback.")

def test_feedback_retrieve():
    """Test retrieving feedback."""
    print("\nTesting feedback retrieval...")
    
    # Get all feedback
    all_feedback = get_user_feedback()
    
    # Check if we have feedback
    if all_feedback:
        print(f"Found {len(all_feedback)} feedback entries.")
        
        # Print first entry as sample
        if len(all_feedback) > 0:
            print("\nSample feedback entry:")
            for key, value in all_feedback[0].items():
                print(f"  {key}: {value}")
    else:
        print("No feedback found.")

def test_feedback_analyze():
    """Test analyzing feedback."""
    print("\nTesting feedback analysis...")
    
    # Analyze feedback
    analysis = analyze_feedback()
    
    print("Feedback analysis results:")
    for key, value in analysis.items():
        print(f"  {key}: {value}")

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("CAREER RECOMMENDER FEEDBACK SYSTEM TEST")
    print("=" * 60)
    
    test_feedback_save()
    test_feedback_retrieve()
    test_feedback_analyze()
    
    print("\nAll tests completed.")

if __name__ == "__main__":
    main() 