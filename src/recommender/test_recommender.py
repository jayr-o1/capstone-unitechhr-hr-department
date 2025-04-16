#!/usr/bin/env python
"""
Test script for the career recommender system.
Demonstrates recommendations for sample skill sets.
"""

import sys
import os
from recommender import recommend_career_path

def test_recommendations():
    """Test the recommender with sample skill sets."""
    
    # Sample skill sets to test
    test_cases = [
        {
            "name": "Software Developer",
            "skills": "Python, Java, SQL, Web Development, API Development, React.js, Node.js",
            "experience": 5  # years of experience
        },
        {
            "name": "Data Scientist",
            "skills": "Python, Machine Learning, Data Analysis, Statistics, SQL, Data Visualization",
            "experience": 3
        },
        {
            "name": "Financial Analyst",
            "skills": "Financial Analysis, Excel, Financial Modeling, Risk Management, Data Analysis",
            "experience": 4
        },
        {
            "name": "Marketing Specialist",
            "skills": "Social Media Marketing, Content Creation, SEO, Digital Marketing, Analytics",
            "experience": 2
        }
    ]
    
    print("\n=== Testing Career Recommender (Using Direct Path Recommendation) ===")
    print("=" * 70)
    
    for case in test_cases:
        print(f"\nTest Case: {case['name']}")
        print(f"Skills: {case['skills']}")
        print(f"Experience: {case['experience']} years")
        print("-" * 70)
        
        # Get recommendations using direct career path function
        try:
            result = recommend_career_path(case["skills"])
            
            print("\nRecommendation Results:")
            print(f"Field: {result['recommended_field']} ({result['field_confidence']}% confidence)")
            print(f"Specialization: {result['recommended_specialization']} ({result['specialization_confidence']}% confidence)")
            
            print("\nMissing Skills:")
            for skill in result['missing_skills'][:5]:
                print(f"- {skill}")
                
            print("\nExisting Skills:")
            for skill in result['existing_skills'][:5]:
                print(f"- {skill}")
                
            print(f"\nModel version: {result['model_version']}")
        except Exception as e:
            print(f"Error generating recommendation: {str(e)}")
            import traceback
            traceback.print_exc()
        
        print("\n" + "=" * 70)

if __name__ == "__main__":
    test_recommendations() 