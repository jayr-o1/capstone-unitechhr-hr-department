#!/usr/bin/env python3
"""
Quick test script for the career path recommender.
"""

import os
import joblib
from recommender import recommend_career_path
from utils.model_trainer import identify_missing_skills, calculate_skill_match_percentage, load_specialization_skills

def main():
    # Define test skills for Computer Science field
    skills = [
        "Python", "Java", "C++", "SQL", "Machine Learning",
        "Data Science", "Web Development", "React.js", "Node.js",
        "TensorFlow", "PyTorch", "Deep Learning"
    ]
    
    # Convert skills list to comma-separated string
    skills_str = ", ".join(skills)
    
    # Get recommendations
    result = recommend_career_path(skills_str)
    
    # Print results
    print("\nCareer Path Recommendations:")
    print("---------------------------")
    print(f"Recommended Field: {result['recommended_field']} (Confidence: {result['field_confidence']}%)")
    
    # Load model components to use with identify_missing_skills
    model_path = os.path.join(os.path.dirname(__file__), "models/career_path_recommendation_model.pkl")
    components = joblib.load(model_path)
    
    # Load specialization skills for match percentage calculation
    specialization_skills = load_specialization_skills()
    
    # Print specializations and missing skills in the requested format
    print("\nSpecializations, Confidence Scores, and Missing Skills:")
    print("-----------------------------------------------------")
    
    # Get all specializations from recommendations
    specializations = [spec['specialization'] for spec in result['specialization_recommendations']]
    
    # For each specialization, get and display the missing skills and match percentage
    for specialization in specializations:
        # Get missing skills for this specialization
        missing_skills_result = identify_missing_skills(skills_str, specialization, components)
        
        # Extract the missing skills from the result
        if isinstance(missing_skills_result, dict):
            missing_skills = missing_skills_result.get('missing_skills', [])
            match_percentage = missing_skills_result.get('match_percentage', 0)
        else:
            missing_skills = list(missing_skills_result) if missing_skills_result else []
            # Calculate match percentage manually if not included in the result
            match_percentage = calculate_skill_match_percentage(skills_str, specialization, specialization_skills) * 100
        
        # Print the specialization name with confidence score
        print(f"\n{specialization} (Skill Match: {match_percentage:.2f}%)")
        
        # Print the missing skills for this specialization
        for skill in missing_skills:
            print(f"- {skill}")
    
    print("\nExisting Skills:")
    print("---------------")
    for skill in result['existing_skills']:
        print(f"- {skill}")

if __name__ == "__main__":
    main() 