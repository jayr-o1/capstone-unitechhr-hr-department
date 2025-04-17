#!/usr/bin/env python3
"""
Interactive test for career recommender system.
This script lets users enter skills with proficiency levels and get personalized recommendations.
"""

import os
import sys
import uuid
import logging
from datetime import datetime

# Add parent directory to path to handle imports
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

# Import recommender modules
from weighted_recommender import WeightedSkillRecommender
from utils.feedback_handler import save_recommendation_feedback

def clear_screen():
    """Clear the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

def get_proficiency_level(skill):
    """
    Get proficiency level for a skill from user input.
    
    Args:
        skill (str): The skill to get proficiency for
        
    Returns:
        int: Proficiency level (1-100)
    """
    while True:
        try:
            proficiency = input(f"Enter your proficiency in {skill} (1-100): ")
            proficiency = int(proficiency.strip())
            if 1 <= proficiency <= 100:
                return proficiency
            else:
                print("Please enter a number between 1 and 100.")
        except ValueError:
            print("Please enter a valid number.")

def print_recommendation(recommendation):
    """
    Print recommendation details in a user-friendly format.
    
    Args:
        recommendation (dict): The recommendation data
    """
    print("\n" + "="*60)
    print("CAREER RECOMMENDATION RESULTS".center(60))
    print("="*60)
    
    # Print top fields
    print("\n🔹 TOP FIELDS:")
    for i, field in enumerate(recommendation.get('top_fields', [])[:3], 1):
        print(f"  {i}. {field['field']} - {field['match_percentage']}% match")
    
    # Print top specializations
    print("\n🔹 TOP SPECIALIZATIONS:")
    for i, spec in enumerate(recommendation.get('top_specializations', [])[:5], 1):
        print(f"  {i}. {spec['specialization']} - {spec['match_percentage']}% match")
        print(f"     Skill coverage: {spec['skill_coverage']}%, Proficiency: {spec['proficiency_score']}%")
        
        # Show top 3 matching skills
        if spec.get('matching_skills'):
            matching_skills = spec.get('matching_skills', [])
            if matching_skills:
                print(f"     ✅ Matching skills: {', '.join(matching_skills[:3])}" + 
                     (f" +{len(matching_skills)-3} more" if len(matching_skills) > 3 else ""))
        
        # Show top 3 missing skills
        if spec.get('missing_skills'):
            missing_skills = spec.get('missing_skills', [])
            if missing_skills:
                print(f"     ⚠️ Skills to develop: {', '.join(missing_skills[:3])}" + 
                     (f" +{len(missing_skills)-3} more" if len(missing_skills) > 3 else ""))
    
    # Print explanation if available
    if 'explanation' in recommendation:
        explanation = recommendation['explanation']
        print("\n🔹 ANALYSIS:")
        print(f"  {explanation.get('summary', '')}")
        print(f"  {explanation.get('details', '')}")
        
        # Print key strengths and development areas
        skill_analysis = explanation.get('skill_analysis', {})
        
        if 'key_strengths' in skill_analysis:
            print("\n  Key strengths:")
            for strength in skill_analysis['key_strengths'][:3]:
                print(f"   - {strength['skill']} (proficiency: {strength['proficiency']}%)")
        
        if 'development_areas' in skill_analysis:
            print("\n  Recommended areas to develop:")
            for area in skill_analysis['development_areas'][:3]:
                print(f"   - {area['skill']} (importance: {int(area['importance']*100)}%)")
    
    print("\n" + "="*60)

def collect_feedback(user_skills, recommendation):
    """
    Collect user feedback on the recommendation.
    
    Args:
        user_skills (dict): User skills with proficiency levels
        recommendation (dict): The recommendation data
        
    Returns:
        bool: True if feedback was saved successfully
    """
    print("\n🔹 FEEDBACK:")
    print("  Please provide feedback on this recommendation to help improve the system.")
    
    # Get satisfaction score
    score = 0
    while score < 1 or score > 5:
        try:
            score = int(input("  How accurate was this recommendation? (1-5, where 5 is most accurate): "))
            if score < 1 or score > 5:
                print("  Please enter a number between 1 and 5.")
        except ValueError:
            print("  Please enter a valid number.")
    
    # Get field feedback
    print("\n  The system recommended these fields:")
    for i, field in enumerate(recommendation.get('top_fields', [])[:3], 1):
        print(f"  {i}. {field['field']}")
    
    selected_field = input("\n  Which field do you think best matches your skills? (Enter the name or leave blank to skip): ")
    
    # Get specialization feedback
    print("\n  The system recommended these specializations:")
    for i, spec in enumerate(recommendation.get('top_specializations', [])[:5], 1):
        print(f"  {i}. {spec['specialization']}")
    
    selected_spec = input("\n  Which specialization do you think best matches your skills? (Enter the name or leave blank to skip): ")
    
    # Get additional comments
    comments = input("\n  Any additional comments? (Leave blank to skip): ")
    
    # Prepare feedback data
    feedback_data = {
        'user_id': str(uuid.uuid4()),  # Generate a random ID
        'skills': list(user_skills.keys()),
        'recommended_field': recommendation.get('top_fields', [{}])[0].get('field', '') if recommendation.get('top_fields') else '',
        'recommended_specialization': recommendation.get('top_specializations', [{}])[0].get('specialization', '') if recommendation.get('top_specializations') else '',
        'user_selected_field': selected_field if selected_field else None,
        'user_selected_specialization': selected_spec if selected_spec else None,
        'feedback_score': score,
        'additional_comments': comments if comments else None
    }
    
    # Save feedback
    success = save_recommendation_feedback(feedback_data)
    
    if success:
        print("\n  Thank you for your feedback! It will help improve future recommendations.")
    else:
        print("\n  There was an error saving your feedback. Please try again later.")
    
    return success

def main():
    """Main function to run the interactive test."""
    clear_screen()
    print("="*60)
    print("CAREER RECOMMENDER SYSTEM - INTERACTIVE TEST".center(60))
    print("="*60)
    print("\nThis test will collect your skills with proficiency levels and provide personalized career recommendations.")
    
    # Get skills input
    skills_input = input("\nEnter your skills separated by commas (e.g., Python, SQL, JavaScript): ")
    
    # Parse skills
    raw_skills = [skill.strip() for skill in skills_input.split(',') if skill.strip()]
    
    if not raw_skills:
        print("No valid skills entered. Please try again.")
        return
    
    # Get proficiency for each skill
    user_skills = {}
    for skill in raw_skills:
        proficiency = get_proficiency_level(skill)
        user_skills[skill] = proficiency
    
    print("\nGenerating recommendations based on your skills and proficiency levels...")
    
    # Create recommender and get recommendations
    recommender = WeightedSkillRecommender()
    result = recommender.recommend(user_skills, top_n=5)
    
    if not result.get('success', False):
        print(f"Error generating recommendations: {result.get('message', 'Unknown error')}")
        return
    
    # Print recommendations
    recommendations = result.get('recommendations', {})
    print_recommendation(recommendations)
    
    # Collect feedback
    collect_feedback(user_skills, recommendations)
    
    print("\nThank you for using the Career Recommender System interactive test!")

if __name__ == "__main__":
    main() 