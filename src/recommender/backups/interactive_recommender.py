#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Interactive Career Recommender

This script provides an interactive interface for the hybrid recommendation system,
allowing users to enter their skills, explore recommendations, and make choices
about their career path options.
"""

import os
import sys
import pandas as pd
import uuid
from datetime import datetime

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Try both import approaches
try:
    # Try direct import first (when in the same directory)
    from hybrid_recommender import HybridRecommender
    HYBRID_RECOMMENDER_AVAILABLE = True
    print("Successfully imported HybridRecommender directly")
except ImportError:
    try:
        # Try package import (when in a different directory)
        from recommender.hybrid_recommender import HybridRecommender
        HYBRID_RECOMMENDER_AVAILABLE = True
        print("Successfully imported HybridRecommender from package")
    except ImportError:
        HYBRID_RECOMMENDER_AVAILABLE = False
        print("Warning: Hybrid recommender not available, falling back to basic recommender")

from utils.input_validator import (
    get_validated_integer,
    get_validated_string,
    get_validated_list,
    get_validated_yes_no
)

def clear_screen():
    """Clear the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header(title, width=80):
    """Print a formatted header."""
    print("\n" + "=" * width)
    print(title.center(width))
    print("=" * width)

def print_section(title, width=80):
    """Print a formatted section title."""
    print("\n" + "-" * width)
    print(title)
    print("-" * width)

def get_user_skills():
    """Get skills from the user."""
    print_section("SKILL ENTRY")
    print("\nPlease enter your skills below (comma-separated).")
    print("Examples: Python, Project Management, Communication, Data Analysis")
    
    while True:
        user_skills = get_validated_list("Your skills: ")
        if not user_skills:
            print("You must enter at least one skill to continue.")
            continue
        
        # Show the entered skills for confirmation
        print("\nYou entered the following skills:")
        for i, skill in enumerate(user_skills, 1):
            print(f"{i}. {skill}")
        
        if get_validated_yes_no("\nIs this correct? (y/n): "):
            return user_skills
        print("\nLet's try again.")

def get_current_position():
    """Get the user's current field and specialization."""
    print_section("CURRENT POSITION (OPTIONAL)")
    print("\nIf you're currently employed, please provide your current position details.")
    print("This will help provide more accurate recommendations.")
    print("(Press Enter to skip if not applicable)")
    
    current_field = get_validated_string("Current field (e.g., Technology, Healthcare): ", required=False)
    current_specialization = get_validated_string("Current specialization (e.g., Data Science, Nursing): ", required=False)
    
    return current_field, current_specialization

def display_field_recommendations(recommendations):
    """Display field recommendations to the user."""
    print_section("FIELD RECOMMENDATIONS")
    
    if not recommendations or 'top_fields' not in recommendations or not recommendations['top_fields']:
        print("\nNo recommendations could be generated. Please try again with different skills.")
        return False
    
    print("\nBased on your skills, here are the top recommended fields:")
    
    for i, field in enumerate(recommendations['top_fields'], 1):
        print(f"\n{i}. {field['field']} - {field['match_percentage']}% match")
        
        # Show matching skills
        if field.get('matching_skills'):
            matching_skills = field['matching_skills'][:3]
            more_count = max(0, len(field['matching_skills']) - 3)
            match_str = ", ".join(matching_skills)
            if more_count > 0:
                match_str += f" (+{more_count} more)"
            print(f"   Matching skills: {match_str}")
        
        # Show missing skills
        if field.get('missing_skills'):
            missing_skills = field['missing_skills'][:3]
            more_count = max(0, len(field['missing_skills']) - 3)
            missing_str = ", ".join(missing_skills)
            if more_count > 0:
                missing_str += f" (+{more_count} more)"
            print(f"   Skills to develop: {missing_str}")
    
    # Display explanation if available
    if 'explanation' in recommendations and 'summary' in recommendations['explanation']:
        print(f"\nSummary: {recommendations['explanation']['summary']}")
    
    return True

def display_specialization_recommendations(recommendations):
    """Display specialization recommendations to the user."""
    print_section("SPECIALIZATION RECOMMENDATIONS")
    
    if not recommendations or 'top_specializations' not in recommendations or not recommendations['top_specializations']:
        print("\nNo specialization recommendations could be generated.")
        return
    
    top_field = recommendations['top_fields'][0]['field'] if recommendations['top_fields'] else "Unknown"
    print(f"\nTop specializations for {top_field}:")
    
    for i, spec in enumerate(recommendations['top_specializations'], 1):
        print(f"\n{i}. {spec['specialization']} - {spec['match_percentage']}% match")
        
        # Show matching skills
        if spec.get('matching_skills'):
            matching_skills = spec['matching_skills'][:3]
            more_count = max(0, len(spec['matching_skills']) - 3)
            match_str = ", ".join(matching_skills)
            if more_count > 0:
                match_str += f" (+{more_count} more)"
            print(f"   Matching skills: {match_str}")
        
        # Show missing skills
        if spec.get('missing_skills'):
            missing_skills = spec['missing_skills'][:3]
            more_count = max(0, len(spec['missing_skills']) - 3)
            missing_str = ", ".join(missing_skills)
            if more_count > 0:
                missing_str += f" (+{more_count} more)"
            print(f"   Skills to develop: {missing_str}")

def display_strengths_and_areas(recommendations):
    """Display key strengths and development areas."""
    print_section("KEY STRENGTHS & DEVELOPMENT AREAS")
    
    if not recommendations or 'explanation' not in recommendations:
        return
    
    explanation = recommendations['explanation']
    
    # Display key strengths
    if 'skill_analysis' in explanation and 'key_strengths' in explanation['skill_analysis']:
        strengths = explanation['skill_analysis']['key_strengths']
        if strengths:
            print("\nYour key strengths:")
            for strength in strengths:
                relevance = strength.get('relevance', 'medium')
                relevance_star = "★★★" if relevance == 'high' else "★★" if relevance == 'medium' else "★"
                print(f"- {strength['skill']} ({relevance_star})")
    
    # Display development areas
    if 'skill_analysis' in explanation and 'development_areas' in explanation['skill_analysis']:
        areas = explanation['skill_analysis']['development_areas']
        if areas:
            print("\nRecommended areas for development:")
            for area in areas:
                importance = area.get('importance', 'medium')
                importance_mark = "❗❗❗" if importance == 'high' else "❗❗" if importance == 'medium' else "❗"
                print(f"- {area['skill']} ({importance_mark})")

def display_skill_gap_analysis(recommender, user_skills, specialization):
    """Display detailed skill gap analysis for a specialization."""
    print_section(f"SKILL GAP ANALYSIS: {specialization}")
    
    # Get skill gap analysis
    analysis = recommender.identify_skill_gaps(user_skills, specialization)
    
    # Display match percentage
    print(f"\nSkill Match: {analysis['match_percentage']}%")
    
    # Display matching skills
    if analysis['matching_skills']:
        print("\nYour relevant skills:")
        for skill in analysis['matching_skills']:
            print(f"- {skill}")
    
    # Display similar skills if available
    if 'similar_skills' in analysis and analysis['similar_skills']:
        print("\nYour transferable skills:")
        for req_skill, info in analysis['similar_skills'].items():
            user_skill = info['user_skill']
            similarity = int(info['similarity'] * 100)
            print(f"- Your '{user_skill}' is {similarity}% similar to '{req_skill}'")
    
    # Display missing skills with training recommendations
    if analysis['missing_skills']:
        print("\nSkills to develop:")
        for i, skill in enumerate(analysis['missing_skills'][:7], 1):
            print(f"{i}. {skill}")
            
            if 'training_recommendations' in analysis and skill in analysis['training_recommendations']:
                recs = analysis['training_recommendations'][skill]
                for j, rec in enumerate(recs[:2], 1):
                    print(f"   {j}. {rec}")
    
    # Display transition difficulty if available
    difficulty = "High" if analysis['match_percentage'] < 50 else "Medium" if analysis['match_percentage'] < 75 else "Low"
    missing_count = len(analysis['missing_skills'])
    time_estimate = "3-6 months" if missing_count <= 3 else "6-12 months" if missing_count <= 7 else "1+ years"
    
    print(f"\nTransition Difficulty: {difficulty}")
    print(f"Estimated Time to Develop Missing Skills: {time_estimate}")
    print(f"Missing Skills Count: {missing_count}")

def display_career_path_details(specialization):
    """Display detailed information about a career path."""
    print_section(f"CAREER PATH DETAILS: {specialization}")
    
    # This would normally load from a database or API
    # For now, we'll use some sample data
    details = {
        "Data Science": {
            "description": "Data Scientists analyze large datasets to extract insights and build models to solve business problems.",
            "typical_roles": ["Data Scientist", "Machine Learning Engineer", "AI Researcher"],
            "salary_range": "$80,000 - $150,000",
            "required_education": "Bachelor's or Master's degree in Computer Science, Statistics, or related field",
            "job_outlook": "Strong growth (15% over the next 10 years)",
            "industries": ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing"]
        },
        "Software Development": {
            "description": "Software Developers design, build, and maintain software applications for various platforms.",
            "typical_roles": ["Software Engineer", "Full-Stack Developer", "Mobile App Developer"],
            "salary_range": "$75,000 - $140,000",
            "required_education": "Bachelor's degree in Computer Science or related field",
            "job_outlook": "Strong growth (22% over the next 10 years)",
            "industries": ["Technology", "Finance", "Gaming", "E-commerce", "Healthcare"]
        }
    }
    
    # Get details for the selected specialization
    if specialization in details:
        path_details = details[specialization]
        
        print(f"\nDescription: {path_details['description']}")
        print(f"\nTypical Roles: {', '.join(path_details['typical_roles'])}")
        print(f"Salary Range: {path_details['salary_range']}")
        print(f"Required Education: {path_details['required_education']}")
        print(f"Job Outlook: {path_details['job_outlook']}")
        print(f"Industries: {', '.join(path_details['industries'])}")
    else:
        print(f"\nDetailed information for {specialization} is not available.")
        print("Please check our career resources for more information.")

def explore_field(recommender, user_skills, field, recommendations):
    """Explore a specific field in more detail."""
    # Get specializations for this field
    specializations = recommender.recommend_specializations_for_field(user_skills, field)
    
    print_section(f"EXPLORING: {field}")
    
    if not specializations:
        print(f"\nNo specializations found for {field}.")
        return
    
    # Display specializations
    print(f"\nSpecializations within {field}:")
    for i, spec in enumerate(specializations, 1):
        print(f"{i}. {spec['specialization']} - {spec['match_percentage']}% match")
    
    # Let user choose a specialization
    choice = get_validated_integer("\nSelect a specialization to explore (0 to go back): ", 
                                  0, len(specializations))
    
    if choice == 0:
        return
    
    selected_spec = specializations[choice - 1]['specialization']
    
    # Show options for exploring the specialization
    while True:
        print_section(f"SPECIALIZATION: {selected_spec}")
        print("\nWhat would you like to know about this specialization?")
        print("1. Skill Gap Analysis")
        print("2. Career Path Details")
        print("3. Return to Field Selection")
        
        option = get_validated_integer("\nSelect an option: ", 1, 3)
        
        if option == 1:
            display_skill_gap_analysis(recommender, user_skills, selected_spec)
        elif option == 2:
            display_career_path_details(selected_spec)
        else:
            break
        
        if not get_validated_yes_no("\nWould you like to explore more about this specialization? (y/n): "):
            break

def save_user_preferences(recommender, user_id, user_skills, recommendations):
    """Save user preferences and recommendations."""
    print_section("SAVE YOUR RECOMMENDATIONS")
    
    print("\nWould you like to save these recommendations for future reference?")
    if get_validated_yes_no("Save recommendations? (y/n): "):
        saved = recommender.save_employee_recommendation(user_id, recommendations, user_skills)
        
        if saved:
            print(f"\nRecommendations saved successfully!")
            print(f"Your user ID: {user_id}")
            print("Please keep this ID for future reference.")
        else:
            print("\nError saving recommendations. Please try again later.")

def main():
    """Main function for the interactive recommender."""
    try:
        print_header("INTERACTIVE CAREER RECOMMENDATION SYSTEM", width=80)
        
        # Check if hybrid recommender is available
        if not HYBRID_RECOMMENDER_AVAILABLE:
            print("\nWarning: The hybrid recommender is not available.")
            print("The recommendations provided may be limited.")
            input("\nPress Enter to continue...")
        
        # Create recommender instance
        recommender = HybridRecommender()
        
        # Get user skills
        user_skills = get_user_skills()
        
        # Get current position
        current_field, current_specialization = get_current_position()
        
        # Generate recommendations
        print("\nGenerating recommendations based on your skills...")
        recommendations = recommender.recommend_fields_for_employee(
            user_skills,
            current_field=current_field,
            current_specialization=current_specialization
        )
        
        # Display field recommendations
        if not display_field_recommendations(recommendations):
            print("\nNo recommendations could be generated. Please try again with different skills.")
            return
        
        # Display specialization recommendations
        display_specialization_recommendations(recommendations)
        
        # Display strengths and areas for development
        display_strengths_and_areas(recommendations)
        
        # Generate a user ID
        user_id = str(uuid.uuid4())
        
        # Ask user if they want to explore a field
        if get_validated_yes_no("\nWould you like to explore a field in more detail? (y/n): "):
            # Let user choose a field
            while True:
                print("\nWhich field would you like to explore?")
                for i, field in enumerate(recommendations['top_fields'], 1):
                    print(f"{i}. {field['field']} - {field['match_percentage']}% match")
                print(f"{len(recommendations['top_fields']) + 1}. Another field (not listed)")
                
                choice = get_validated_integer("\nSelect a field (0 to skip): ", 
                                              0, len(recommendations['top_fields']) + 1)
                
                if choice == 0:
                    break
                
                if choice <= len(recommendations['top_fields']):
                    selected_field = recommendations['top_fields'][choice - 1]['field']
                else:
                    selected_field = get_validated_string("Enter the field name: ")
                
                # Explore the selected field
                explore_field(recommender, user_skills, selected_field, recommendations)
                
                if not get_validated_yes_no("\nWould you like to explore another field? (y/n): "):
                    break
        
        # Save user preferences
        save_user_preferences(recommender, user_id, user_skills, recommendations)
        
        print_header("THANK YOU FOR USING THE CAREER RECOMMENDATION SYSTEM", width=80)
        print("\nWe hope these recommendations have been helpful in your career planning.")
        print("Remember that career development is an ongoing journey.")
        print("Keep building your skills and exploring opportunities!")
        
    except KeyboardInterrupt:
        print("\n\nProgram interrupted by user. Exiting gracefully...")
    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
        print("Please try again later.")

if __name__ == "__main__":
    main() 