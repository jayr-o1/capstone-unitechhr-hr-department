"""
Test script for generating career recommendations based on user skills.
This script tests the recommendation system with our enhanced model.
"""

import os
import sys
import pandas as pd
import json
from utils.skill_analyzer import enhanced_recommend_fields_based_on_skills, recommend_fields_based_on_skills
from utils.data_loader import load_career_paths, recommend_specializations_based_on_skills
from utils.model_trainer import generate_matching_test_data 

def print_recommendations(user_skills, label=None):
    """Print recommendations for a set of skills."""
    if label:
        print(f"\n{'='*30} {label} {'='*30}")
    print(f"Skills: {', '.join(user_skills)}")

    # Get enhanced recommendations
    try:
        recommendations = enhanced_recommend_fields_based_on_skills(user_skills)
        print("\nTop Field Recommendations (Enhanced Method):")
        for i, rec in enumerate(recommendations[:5], 1):
            print(f"{i}. {rec['field']} - {rec['match_percentage']}% match")
            print(f"   Matching skills: {', '.join(rec['matching_skills'])[:100]}..." if len(', '.join(rec['matching_skills'])) > 100 else f"   Matching skills: {', '.join(rec['matching_skills'])}")
            missing_skills = rec['missing_skills']
            if missing_skills and len(missing_skills) > 0:
                print(f"   Missing skills: {', '.join(missing_skills[:5])}..." if len(missing_skills) > 5 else f"   Missing skills: {', '.join(missing_skills)}")
    except Exception as e:
        print(f"Error with enhanced recommendations: {str(e)}")
        # Fall back to basic recommendations
        recommendations = recommend_fields_based_on_skills(user_skills)
        print("\nTop Field Recommendations (Basic Method):")
        for i, rec in enumerate(recommendations[:5], 1):
            print(f"{i}. {rec['field']} - {rec['match_percentage']}% match")
            
    # Get specialization recommendations
    try:
        spec_recommendations = recommend_specializations_based_on_skills(user_skills, top_n=3)
        print("\nTop Specialization Recommendations:")
        print(f"Recommended Field: {spec_recommendations['recommended_field']}")
        print("\nTop Specializations:")
        for i, rec in enumerate(spec_recommendations['top_specializations'], 1):
            print(f"{i}. {rec['specialization']} - {rec['match_percentage']}% match")
    except Exception as e:
        print(f"Error with specialization recommendations: {str(e)}")

def test_all_weak_fields():
    """Test recommendations for all weak fields."""
    # Environmental Science skills
    env_science_skills = [
        "Environmental Impact Assessment", "Ecological Monitoring", "GIS", 
        "Environmental Sampling", "Research Methods", "Environmental Regulations"
    ]
    print_recommendations(env_science_skills, "Environmental Science")
    
    # Library & Information Science skills
    library_skills = [
        "Information Management", "Cataloging", "Database Management", 
        "Research Services", "Digital Collections", "Knowledge Organization"
    ]
    print_recommendations(library_skills, "Library & Information Science")
    
    # Marine Science skills
    marine_skills = [
        "Marine Ecosystems", "Oceanography", "Field Research", 
        "Marine Biology", "Species Identification", "Underwater Research"
    ]
    print_recommendations(marine_skills, "Marine Science")
    
    # Maritime & Logistics skills
    maritime_skills = [
        "Maritime Operations", "Shipping Logistics", "Port Management", 
        "Maritime Law", "Maritime Safety Protocols", "Cargo Management"
    ]
    print_recommendations(maritime_skills, "Maritime & Logistics")
    
    # Museum & Cultural Heritage skills
    museum_skills = [
        "Collection Management", "Exhibition Development", "Conservation Techniques", 
        "Curatorial Research", "Cultural Preservation", "Educational Programming"
    ]
    print_recommendations(museum_skills, "Museum & Cultural Heritage")
    
    # Psychology skills
    psychology_skills = [
        "Psychological Assessment", "Research Methods", "Statistical Analysis", 
        "Cognitive Testing", "Behavioral Analysis", "Clinical Assessment"
    ]
    print_recommendations(psychology_skills, "Psychology")
    
    # Textile & Material Science skills
    textile_skills = [
        "Textile Testing", "Material Properties", "Fiber Science", 
        "Textile Chemistry", "Textile Manufacturing", "Quality Control"
    ]
    print_recommendations(textile_skills, "Textile & Material Science")
    
    # Urban Development skills
    urban_skills = [
        "Urban Planning", "Land Use Planning", "Community Engagement", 
        "GIS Mapping", "Housing Policy", "Sustainable Development"
    ]
    print_recommendations(urban_skills, "Urban Development")
    
    # Design skills
    design_skills = [
        "Visual Design", "User-Centered Design", "Design Thinking", 
        "Typography", "Prototyping", "Brand Identity"
    ]
    print_recommendations(design_skills, "Design")
    
    # Technology skills
    tech_skills = [
        "Programming", "Software Development", "Data Analysis", 
        "Cloud Computing", "System Architecture", "Database Management"
    ]
    print_recommendations(tech_skills, "Technology")
    
    # Logistics & Operations skills
    logistics_skills = [
        "Supply Chain Management", "Operations Planning", "Inventory Control", 
        "Warehouse Operations", "Logistics Management", "Process Optimization"
    ]
    print_recommendations(logistics_skills, "Logistics & Operations")
    
    # Forensic Science skills
    forensic_skills = [
        "Evidence Collection", "Forensic Analysis", "DNA Analysis", 
        "Crime Scene Documentation", "Laboratory Techniques", "Ballistics Analysis"
    ]
    print_recommendations(forensic_skills, "Forensic Science")

def test_with_custom_skills():
    """Test with custom skill set."""
    custom_skills = input("\nEnter your skills (comma-separated): ").split(",")
    custom_skills = [skill.strip() for skill in custom_skills]
    print_recommendations(custom_skills, "Your Custom Skills")

def test_with_model_predictions():
    """Test the ML model predictions directly."""
    try:
        # Generate test data using the model components
        print("\nTesting model predictions with generated test data...")
        test_df = generate_matching_test_data(None, sample_count=5, verbose=True)
        
        if test_df is not None:
            print("\nModel Prediction Test Results:")
            for _, row in test_df.iterrows():
                skills = row['Skills'].split(", ")
                expected_field = row['Field']
                print(f"\nSkills: {', '.join(skills)}")
                print(f"Expected Field: {expected_field}")
                
                # Get recommendations and check if expected field is in top results
                recommendations = enhanced_recommend_fields_based_on_skills(skills)
                top_fields = [rec['field'] for rec in recommendations[:3]]
                
                print(f"Top 3 Predicted Fields: {', '.join(top_fields)}")
                if expected_field in top_fields:
                    print(f"✓ SUCCESS: Expected field '{expected_field}' found in top predictions")
                else:
                    print(f"✗ MISMATCH: Expected field '{expected_field}' not in top predictions")
        else:
            print("Could not generate test data for model predictions.")
    except Exception as e:
        print(f"Error testing model predictions: {str(e)}")

def main():
    """Main function for testing recommendations."""
    print("\n" + "="*80)
    print("CAREER RECOMMENDATION SYSTEM TEST")
    print("="*80)
    
    while True:
        print("\nSelect a test option:")
        print("1. Test weak fields recommendations")
        print("2. Test with your own skills")
        print("3. Test model predictions")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ")
        
        if choice == '1':
            test_all_weak_fields()
        elif choice == '2':
            test_with_custom_skills()
        elif choice == '3':
            test_with_model_predictions()
        elif choice == '4':
            print("\nExiting test program. Thank you!")
            break
        else:
            print("Invalid option. Please try again.")

if __name__ == "__main__":
    main() 