#!/usr/bin/env python3
"""
Test script to verify Data Analysis skill matching to Data Science specialization
"""

import sys
import os

# Add the parent directory to the path to access utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import necessary utilities
from utils.skill_analyzer import (
    enhanced_recommend_fields_based_on_skills,
    recommend_specializations_for_field,
    enhanced_analyze_skill_gap,
    calculate_skill_similarity
)

def test_data_analysis_recommendation():
    """Test how well Data Analysis skills match with Data Science."""
    print("\n" + "=" * 60)
    print("TESTING DATA ANALYSIS TO DATA SCIENCE MATCHING")
    print("=" * 60)
    
    # Test with only Data Analysis skill
    skills = ["Data Analysis"]
    print(f"\nTesting with skills: {skills}")
    
    # Get field recommendations
    field_recs = enhanced_recommend_fields_based_on_skills(skills)
    
    # Print top fields
    print("\nTop field recommendations:")
    for i, field in enumerate(field_recs[:3], 1):
        print(f"{i}. {field['field']} ({field['match_percentage']}% match)")
        
        if field['matching_skills']:
            print("   Direct matching skills:")
            for skill in field['matching_skills'][:3]:
                print(f"   - {skill}")
                
        if 'similar_skills' in field and field['similar_skills']:
            print("   Similar skills:")
            for req_skill, info in list(field['similar_skills'].items())[:3]:
                print(f"   - '{info['user_skill']}' matches '{req_skill}' ({int(info['similarity']*100)}% similarity)")
    
    # Test Technology field specializations
    print("\nTesting Technology field specializations:")
    specializations = recommend_specializations_for_field(skills, "Technology")
    
    for i, spec in enumerate(specializations, 1):
        print(f"{i}. {spec['specialization']} ({spec['match_percentage']}% match)")
    
    # Test with multiple data science related skills
    skills = ["Data Analysis", "Python", "Statistics"]
    print(f"\n\nTesting with expanded skills: {skills}")
    
    # Get field recommendations
    field_recs = enhanced_recommend_fields_based_on_skills(skills)
    
    # Print top fields
    print("\nTop field recommendations:")
    for i, field in enumerate(field_recs[:3], 1):
        print(f"{i}. {field['field']} ({field['match_percentage']}% match)")
        
        if field['matching_skills']:
            print("   Direct matching skills:")
            for skill in field['matching_skills'][:3]:
                print(f"   - {skill}")
                
        if 'similar_skills' in field and field['similar_skills']:
            print("   Similar skills:")
            for req_skill, info in list(field['similar_skills'].items())[:3]:
                print(f"   - '{info['user_skill']}' matches '{req_skill}' ({int(info['similarity']*100)}% similarity)")
    
    # Test Technology field specializations
    print("\nTesting Technology field specializations:")
    specializations = recommend_specializations_for_field(skills, "Technology")
    
    for i, spec in enumerate(specializations, 1):
        print(f"{i}. {spec['specialization']} ({spec['match_percentage']}% match)")
    
    # Test skill similarity directly
    print("\n" + "=" * 60)
    print("TESTING SKILL SIMILARITY CALCULATIONS")
    print("=" * 60)
    
    pairs = [
        ("Data Analysis", "Machine Learning"),
        ("Data Analysis", "Data Science"),
        ("Data Analysis", "Statistical Modeling"),
        ("Statistics", "Data Science"),
        ("Python", "Data Science"),
        ("SQL", "Data Analysis"),
        ("Excel", "Data Analysis")
    ]
    
    for skill1, skill2 in pairs:
        similarity = calculate_skill_similarity(skill1, skill2)
        print(f"Similarity between '{skill1}' and '{skill2}': {int(similarity*100)}%")

if __name__ == "__main__":
    test_data_analysis_recommendation() 