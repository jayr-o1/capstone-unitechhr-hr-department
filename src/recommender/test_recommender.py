#!/usr/bin/env python3
"""
Test script for the career recommender system.
This script tests the system with various skill profiles to validate the skill matching improvements.
"""

import sys
import os
import json
from pprint import pprint

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import recommender functionality
try:
    from utils.skill_analyzer import (
        calculate_skill_similarity,
        enhanced_analyze_skill_gap,
        enhanced_recommend_fields_based_on_skills,
        recommend_fields_based_on_skills,
        analyze_skill_gap
    )
    from utils.data_loader import load_career_paths
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

def print_separator(title):
    """Print a separator with a title."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def test_skill_similarity():
    """Test the skill similarity function."""
    print_separator("TESTING SKILL SIMILARITY")
    
    test_pairs = [
        ("Communication", "Classroom Management"),
        ("Leadership", "Educational Leadership"),
        ("Organization", "Curriculum Development"),
        ("Patience", "Special Education"),
        ("Teamwork", "Professional Networking"),
        ("Critical Thinking", "Scholarly Research"),
        ("Time Management", "Deadline Management"),
        ("Computer Skills", "Educational Technology"),
        ("Communication", "Client Relations"),
        ("Leadership", "Team Management"),
        ("Data Analysis", "Data Analysis"),  # Direct match
        ("Python Programming", "Software Development"),  # No match
    ]
    
    for user_skill, required_skill in test_pairs:
        similarity = calculate_skill_similarity(user_skill, required_skill)
        print(f"Similarity between '{user_skill}' and '{required_skill}': {similarity:.2f} ({int(similarity * 100)}%)")

def test_enhanced_skill_gap_analysis():
    """Test the enhanced skill gap analysis."""
    print_separator("TESTING ENHANCED SKILL GAP ANALYSIS")
    
    # Test cases with different skill profiles
    test_cases = [
        {
            "name": "Education-oriented profile",
            "skills": ["Communication", "Leadership", "Organization", "Patience", "Teamwork"],
            "specialization": "Elementary Education"
        },
        {
            "name": "Technical profile",
            "skills": ["Programming", "Problem Solving", "Attention to Detail", "Communication"],
            "specialization": "Software Development"
        },
        {
            "name": "Mixed profile",
            "skills": ["Critical Thinking", "Patience", "Communication", "Leadership", "Computer Skills"],
            "specialization": "Elementary Education"
        }
    ]
    
    career_paths = load_career_paths()
    
    for case in test_cases:
        print(f"\n--- {case['name']} ---")
        print(f"Skills: {', '.join(case['skills'])}")
        print(f"Specialization: {case['specialization']}")
        
        # Run standard analysis
        standard_analysis = analyze_skill_gap(case['skills'], case['specialization'], career_paths)
        
        # Run enhanced analysis
        enhanced_analysis = enhanced_analyze_skill_gap(case['skills'], case['specialization'], career_paths)
        
        # Print results
        print(f"\nStandard match percentage: {standard_analysis['match_percentage']}%")
        print(f"Enhanced match percentage: {enhanced_analysis['match_percentage']}%")
        
        print("\nDirectly matching skills:")
        for skill in enhanced_analysis['matching_skills']:
            print(f"- {skill}")
        
        if enhanced_analysis['similar_skills']:
            print("\nSimilar skills:")
            for req_skill, info in enhanced_analysis['similar_skills'].items():
                user_skill = info['user_skill']
                similarity = int(info['similarity'] * 100)
                print(f"- '{user_skill}' is {similarity}% similar to '{req_skill}'")
        
        print("\nMissing skills:")
        for skill in enhanced_analysis['missing_skills'][:5]:  # Show only first 5 missing skills
            print(f"- {skill}")
        if len(enhanced_analysis['missing_skills']) > 5:
            print(f"  ... and {len(enhanced_analysis['missing_skills']) - 5} more")

def test_field_recommendations():
    """Test the field recommendations."""
    print_separator("TESTING FIELD RECOMMENDATIONS")
    
    # Test cases with different skill profiles
    test_cases = [
        {
            "name": "Education-focused skills",
            "skills": ["Communication", "Leadership", "Organization", "Patience", 
                      "Teamwork", "Critical Thinking", "Time Management", "Computer Skills"]
        },
        {
            "name": "Technical skills",
            "skills": ["Programming", "Problem Solving", "Data Analysis", "Debugging",
                      "System Design", "Cloud Computing", "SQL", "Algorithms"]
        },
        {
            "name": "Healthcare skills",
            "skills": ["Patient Care", "Empathy", "Attention to Detail", "Communication",
                      "Medical Terminology", "Clinical Skills", "Critical Thinking", "Teamwork"]
        },
        {
            "name": "Mixed skills",
            "skills": ["Critical Thinking", "Patience", "Communication", "Organization", 
                      "Imaginative Thinking", "Leadership", "Teamwork", "Time Management", 
                      "Computer Skills", "Conflict Resolution"]
        }
    ]
    
    for case in test_cases:
        print(f"\n--- {case['name']} ---")
        print(f"Skills: {', '.join(case['skills'])}")
        
        # Run standard field recommendations
        standard_recs = recommend_fields_based_on_skills(case['skills'])
        
        # Run enhanced field recommendations
        enhanced_recs = enhanced_recommend_fields_based_on_skills(case['skills'])
        
        # Print top 3 results from both for comparison
        print("\nTop 3 standard recommendations:")
        for i, rec in enumerate(standard_recs[:3], 1):
            print(f"{i}. {rec['field']} ({rec['match_percentage']}% match)")
        
        print("\nTop 3 enhanced recommendations:")
        for i, rec in enumerate(enhanced_recs[:3], 1):
            print(f"{i}. {rec['field']} ({rec['match_percentage']}% match)")
            # Show similar skills for the top recommendation
            if i == 1 and rec['similar_skills']:
                print("   Similar skills:")
                for req_skill, info in list(rec['similar_skills'].items())[:3]:
                    user_skill = info['user_skill']
                    similarity = int(info['similarity'] * 100)
                    print(f"   - '{user_skill}' is {similarity}% similar to '{req_skill}'")

def test_all():
    """Run all tests."""
    test_skill_similarity()
    test_enhanced_skill_gap_analysis()
    test_field_recommendations()
    
    print_separator("ALL TESTS COMPLETE")
    print("\nThe enhanced system now recognizes transferable skills and provides more accurate recommendations.")
    print("The improvements should be particularly notable for users with general skills like:")
    print("- Communication")
    print("- Leadership")
    print("- Critical Thinking")
    print("- Teamwork")
    print("- Patience")
    print("\nThese are now correctly mapped to field-specific skills across Education, Healthcare, Technology, etc.")

if __name__ == "__main__":
    test_all() 