#!/usr/bin/env python3
"""
Quick test script for the career path recommender.
"""

from recommender import recommend_career_path

def main():
    # Define test skills for marketing field
    skills = [
        "Digital Marketing", "Social Media Marketing", "Content Creation", 
        "SEO", "Marketing Strategy", "Brand Management", "Market Research", 
        "Campaign Management", "Google Analytics", "Email Marketing"
    ]
    
    # Convert skills list to comma-separated string
    skills_str = ", ".join(skills)
    
    # Get recommendations
    result = recommend_career_path(skills_str)
    
    # Print results
    print("\nCareer Path Recommendations:")
    print("---------------------------")
    print(f"Recommended Field: {result['recommended_field']} (Confidence: {result['field_confidence']}%)")
    
    # Print specialization recommendations with confidence scores
    print("\nSpecialization Recommendations:")
    print("----------------------------")
    for i, spec in enumerate(result['specialization_recommendations'], 1):
        print(f"{i}. {spec['specialization']} (Confidence: {spec['confidence']}%)")
    
    print("\nMissing Skills:")
    print("--------------")
    for skill in result['missing_skills']:
        print(f"- {skill}")
    
    print("\nExisting Skills:")
    print("---------------")
    for skill in result['existing_skills']:
        print(f"- {skill}")

if __name__ == "__main__":
    main() 