"""
Career Recommender Module

This module provides a simple interface to the trained career recommendation models.
It combines field prediction, specialization prediction, and skill gap analysis.
"""

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA

class CareerRecommender:
    def __init__(self, model_path="models/career_path_recommendation_model.pkl"):
        """
        Initialize the career recommender with trained models.
        
        Args:
            model_path (str): Path to the saved model components
        """
        self.components = joblib.load(model_path)
        self.load_models()
        
    def load_models(self):
        """Load all model components from the saved file"""
        # Field recommendation components
        self.field_model = self.components['field_model']
        self.field_tfidf = self.components['field_tfidf']
        self.field_pca = self.components['field_pca']
        self.field_encoder = self.components['field_encoder']
        
        # Specialization recommendation components
        self.specialization_model = self.components['specialization_model']
        self.specialization_tfidf = self.components['specialization_tfidf']
        self.specialization_pca = self.components['specialization_pca']
        self.specialization_encoder = self.components['specialization_encoder']
        
        # Skill gap data
        self.specialization_skills = self.components['specialization_skills']
    
    def recommend(self, skills_str):
        """
        Make complete career recommendation based on skills.
        
        Args:
            skills_str (str): Comma-separated list of skills (e.g. "Python, SQL, Data Analysis")
            
        Returns:
            dict: {
                'field': recommended field,
                'specialization': recommended specialization,
                'missing_skills': list of skills needed,
                'existing_skills': list of user's current skills,
                'field_confidence': confidence score for field prediction,
                'specialization_confidence': confidence score for specialization prediction
            }
        """
        # Clean and prepare skills input
        skills_list = [s.strip() for s in skills_str.split(',')]
        cleaned_skills = ', '.join(skills_list)
        
        # Stage 1: Predict Field
        field, field_confidence = self._predict_field(cleaned_skills)
        
        # Stage 2: Predict Specialization
        specialization, spec_confidence = self._predict_specialization(cleaned_skills)
        
        # Stage 3: Identify Missing Skills
        missing_skills = self._identify_missing_skills(skills_list, specialization)
        
        return {
            'field': field,
            'specialization': specialization,
            'missing_skills': missing_skills,
            'existing_skills': skills_list,
            'field_confidence': float(field_confidence),
            'specialization_confidence': float(spec_confidence)
        }
    
    def _predict_field(self, skills_str):
        """Predict the most suitable career field"""
        # Transform input
        X = self.field_tfidf.transform([skills_str])
        X_pca = self.field_pca.transform(X.toarray())
        
        # Predict
        proba = self.field_model.predict_proba(X_pca)[0]
        pred_class = np.argmax(proba)
        confidence = np.max(proba)
        
        # Decode prediction
        field = self.field_encoder.inverse_transform([pred_class])[0]
        return field, confidence
    
    def _predict_specialization(self, skills_str):
        """Predict the most suitable specialization"""
        # Transform input
        X = self.specialization_tfidf.transform([skills_str])
        X_pca = self.specialization_pca.transform(X.toarray())
        
        # Predict
        proba = self.specialization_model.predict_proba(X_pca)[0]
        pred_class = np.argmax(proba)
        confidence = np.max(proba)
        
        # Decode prediction
        specialization = self.specialization_encoder.inverse_transform([pred_class])[0]
        return specialization, confidence
    
    def _identify_missing_skills(self, user_skills, specialization):
        """Identify skills needed for the specialization that user doesn't have"""
        user_skill_set = set(skill.lower().strip() for skill in user_skills)
        
        # Get required skills for this specialization
        required_skills = self.specialization_skills.get(specialization, {})
        
        if not required_skills:
            return []
            
        # Sort skills by importance (weight)
        sorted_skills = sorted(required_skills.items(), key=lambda x: x[1], reverse=True)
        
        # Find missing skills
        missing_skills = []
        for skill, weight in sorted_skills:
            if skill.lower() not in user_skill_set:
                missing_skills.append(skill)
                
        return missing_skills

# Example usage
if __name__ == "__main__":
    # Initialize the recommender
    recommender = CareerRecommender()
    
    # Get user input for skills
    print("Enter your skills (comma-separated):")
    user_skills = input().strip()
    
    # Get recommendation
    result = recommender.recommend(user_skills)
    
    # Print results
    print("\n=== Career Recommendation ===")
    print(f"Based on your skills: {', '.join(result['existing_skills'])}")
    print(f"\nRecommended Field: {result['field']} (confidence: {result['field_confidence']:.1%})")
    print(f"Recommended Specialization: {result['specialization']} (confidence: {result['specialization_confidence']:.1%})")
    
    if result['missing_skills']:
        print("\nTo become a better candidate for this role, consider developing these skills:")
        for i, skill in enumerate(result['missing_skills'][:5], 1):
            print(f"{i}. {skill}")
    else:
        print("\nYou have all the key skills needed for this specialization!") 