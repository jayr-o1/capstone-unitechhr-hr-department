#!/usr/bin/env python3
"""
Test the career recommendation system with skills from multiple domains.
"""

import os
import joblib
from utils.model_trainer import identify_missing_skills, calculate_skill_match_percentage, load_specialization_skills

def test_specialization_recommendations():
    """Test specialization recommendations across multiple domains."""
    # Load model components
    model_path = os.path.join(os.path.dirname(__file__), "models/career_path_recommendation_model.pkl")
    components = joblib.load(model_path)
    
    # Load specialization skills for match percentage calculation
    specialization_skills = load_specialization_skills()
    
    # Test cases from different domains
    test_cases = [
        # Computer Science
        {
            "domain": "Computer Science",
            "skills": "Python, Machine Learning, Data Analysis, TensorFlow, Scikit-learn, SQL",
            "expected": ["Data Scientist", "Machine Learning Engineer"]
        },
        {
            "domain": "Computer Science",
            "skills": "AWS, Docker, Kubernetes, Infrastructure as Code, Cloud Security, Terraform",
            "expected": ["Cloud Architect", "DevOps Engineer"]
        },
        # Marketing
        {
            "domain": "Marketing",
            "skills": "Social Media Marketing, Content Creation, Community Management, Copywriting, Campaign Management",
            "expected": ["Social Media Manager", "Digital Marketing Specialist"]
        },
        {
            "domain": "Marketing",
            "skills": "Brand Strategy, Market Research, Brand Development, Campaign Management, Creative Direction",
            "expected": ["Brand Manager", "Market Research Analyst"]
        },
        # Finance
        {
            "domain": "Finance",
            "skills": "Financial Modeling, Risk Assessment, Statistical Analysis, Actuarial Valuation, Excel",
            "expected": ["Actuary", "Risk Manager"]
        },
        {
            "domain": "Finance",
            "skills": "Investment Strategy, Asset Allocation, Risk Management, Fund Management, Performance Analysis",
            "expected": ["Portfolio Manager", "Investment Banker"]
        },
        # Human Resources
        {
            "domain": "Human Resources",
            "skills": "Recruitment Strategy, Candidate Screening, Applicant Tracking Systems, Talent Pipeline Development",
            "expected": ["Talent Acquisition Specialist", "HR Manager"]
        },
        {
            "domain": "Human Resources",
            "skills": "Training Needs Analysis, Instructional Design, E-learning Development, Coaching, Learning Paths",
            "expected": ["Learning and Development Specialist", "HR Manager"]
        },
    ]
    
    print("MULTI-DOMAIN SPECIALIZATION RECOMMENDATION TEST")
    print("=" * 50)
    
    # Test each case
    for i, case in enumerate(test_cases, 1):
        print(f"\nTest Case #{i}: {case['domain']}")
        print(f"Skills: {case['skills']}")
        
        # For this test, we'll use the specialization_matcher directly
        vectorizer = components['specialization_vectorizer']
        model = components['specialization_matcher']
        
        # Transform input
        X = vectorizer.transform([case['skills']])
        
        # Get prediction and probabilities
        prediction = model.predict(X)[0]
        proba = model.predict_proba(X)[0]
        
        # Get class indices sorted by probability
        sorted_indices = proba.argsort()[::-1]
        classes = model.classes_
        
        # Get top 3 predictions
        top_predictions = []
        for idx in sorted_indices[:3]:
            top_predictions.append((classes[idx], float(proba[idx])))
        
        # Check if expected specializations are in top predictions
        success = any(pred[0] in case['expected'] for pred in top_predictions)
        
        # Print results
        print(f"Top predictions (Model Confidence):")
        for spec, conf in top_predictions:
            # Calculate skill match percentage
            match_percentage = calculate_skill_match_percentage(case['skills'], spec, specialization_skills) * 100
            print(f"  - {spec} (Model: {conf:.4f}, Skill Match: {match_percentage:.2f}%)")
        
        print(f"Expected: {', '.join(case['expected'])}")
        print(f"Result: {'SUCCESS' if success else 'FAILURE'}")
        
        # Get missing skills for top prediction
        missing_skills = identify_missing_skills(case['skills'], top_predictions[0][0], components)
        if isinstance(missing_skills, dict):
            missing_skills_list = missing_skills.get('missing_skills', [])
            match_percentage = missing_skills.get('match_percentage', 0)
        else:
            missing_skills_list = list(missing_skills) if missing_skills else []
            match_percentage = calculate_skill_match_percentage(case['skills'], top_predictions[0][0], specialization_skills) * 100
        
        print(f"\nMissing skills for {top_predictions[0][0]} (Skill Match: {match_percentage:.2f}%):")
        for skill in missing_skills_list[:5]:  # Show only top 5 missing skills
            print(f"  - {skill}")
        
    print("\nTest Summary")
    print("=" * 50)
    print(f"Tested {len(test_cases)} scenarios across {len(set(case['domain'] for case in test_cases))} domains")

if __name__ == "__main__":
    test_specialization_recommendations() 