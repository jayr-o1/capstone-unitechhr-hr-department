"""
Hybrid Recommendation System for Career Paths

This system combines ML model predictions with business rules and domain knowledge
to provide comprehensive career recommendations for employees based on their skills,
current field, specialization, and identifies lacking skills for development.
"""

import os
import sys
import pandas as pd
import json
import uuid
from datetime import datetime
import importlib

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.data_loader import (
    load_career_paths,
    load_skills_data,
    load_synthetic_employee_data,
    load_synthetic_career_path_data, 
    load_user_preferences,
    save_user_preferences
)
from utils.skill_analyzer import (
    enhanced_recommend_fields_based_on_skills,
    enhanced_analyze_skill_gap,
    calculate_skill_similarity
)

# Import ML model access functions
try:
    from utils.model_trainer import (
        load_career_recommendation_model,
        preprocess_skills_for_model,
        predict_career_field,
        get_field_skill_importance
    )
    MODEL_AVAILABLE = True
except ImportError:
    MODEL_AVAILABLE = False


class HybridRecommender:
    """
    Hybrid recommendation system that combines ML model predictions with
    business rules and domain knowledge.
    """
    
    def __init__(self, use_cached_data=True):
        """
        Initialize the hybrid recommender.
        
        Args:
            use_cached_data (bool): Whether to use cached data for faster loading
        """
        self.career_paths = load_career_paths()
        self.skills_data = load_skills_data()
        
        # Load synthetic data for reference
        try:
            self.employee_data = load_synthetic_employee_data()
            self.career_path_data = load_synthetic_career_path_data()
        except Exception as e:
            print(f"Warning: Could not load synthetic data: {str(e)}")
            self.employee_data = None
            self.career_path_data = None
        
        # Load model if available
        self.model = None
        self.model_components = None
        if MODEL_AVAILABLE:
            try:
                self.model, self.model_components = load_career_recommendation_model()
                print("Career recommendation model loaded successfully.")
            except Exception as e:
                print(f"Warning: Could not load model: {str(e)}")
        
        # Define field mappings to ensure consistent mapping
        self.field_mappings = {
            "Technology": ["Software Development", "Data Science", "Cybersecurity", "Cloud Computing", 
                          "AI Research", "Database Administration", "Network Engineering", "IT Security"],
            "Criminal Justice": ["Criminology", "Forensic Science", "Law Enforcement", "Criminal Justice"],
            "Healthcare": ["Healthcare Administration", "Nursing", "Clinical Psychology", "Industrial-Organizational Psychology"],
            "Business": ["Marketing", "Finance", "Human Resources", "Business Analysis", "Management Consulting",
                        "Operations Management", "Business Development", "Strategic Planning"],
            "Engineering": ["Mechanical Engineering", "Civil Engineering", "Aerospace Engineering", "Electrical Engineering"],
            "Education": ["Elementary Education", "Secondary Education", "Educational Technology", "Special Education"],
            "Creative Arts": ["Graphic Design", "Film Production", "Fine Art", "Music", "Photography", 
                             "Dance", "Creative Writing", "Film", "Animation"],
            "Legal": ["Legal Practice", "Corporate Law", "Criminal Law", "Environmental Law"],
            "Science": ["Environmental Science", "Chemistry", "Physics", "Biology", "Astronomy"],
            "Media": ["Journalism", "Broadcasting", "Digital Media", "Public Relations"],
            "Social Services": ["Social Work", "Community Outreach", "Counseling", "Nonprofit Management"],
            "Healthcare Specialists": ["Physical Therapy", "Speech-Language Pathology", "Occupational Therapy"],
            "Design": ["Architecture", "Interior Design", "Product Design", "UX/UI Design", "Fashion Design"],
            "Agriculture": ["Agriculture", "Agronomy", "Horticulture", "Food Science"],
            "Hospitality": ["Hospitality Management", "Hotel Administration", "Tourism", "Restaurant Management"],
            "Medical": ["Dentistry", "Pharmacy", "Veterinary Medicine", "Radiology", "Nursing"],
            "Urban Development": ["Urban Planning", "City Management", "Community Development", "Transportation Planning"],
            "Environmental Science": ["Conservation Science", "Climate Change Analysis", "Environmental Management"],
            "Library & Information Science": ["Library Science", "Information Management", "Archival Studies"],
            "Marine Science": ["Marine Biology", "Oceanography", "Marine Conservation", "Marine Resource Management"],
            "Maritime & Logistics": ["Maritime Operations", "Port Management", "Shipping Logistics", "Maritime Safety"],
            "Museum & Cultural Heritage": ["Museum Studies", "Cultural Preservation", "Exhibition Design"],
            "Psychology": ["Clinical Psychology", "Neuropsychology", "Developmental Psychology", "Research Psychology"],
            "Textile & Material Science": ["Textile Engineering", "Material Science", "Fabric Development"],
            "Logistics & Operations": ["Supply Chain Management", "Operations Management", "Logistics Coordination"],
            "Social Sciences": ["Sociology", "Anthropology", "Economics", "Political Science"],
            "Real Estate": ["Real Estate Agent", "Property Management", "Real Estate Development"]
        }
        
        # Track key skills for each field by analyzing career path data
        self.field_key_skills = self._extract_key_skills_by_field()
        
        # Cache for skill similarity calculations
        self.skill_similarity_cache = {}
        
    def _extract_key_skills_by_field(self):
        """
        Extract key skills for each field by analyzing career path data.
        
        Returns:
            dict: Mapping of fields to their key skills
        """
        field_skills = {}
        
        if self.career_path_data is not None:
            # Group data by field
            field_grouped = self.career_path_data.groupby('Field')
            
            # For each field, extract and count skills
            for field, group in field_grouped:
                skills_counter = {}
                
                # Process each row in the group
                for _, row in group.iterrows():
                    if 'Required Skills' in row:
                        skills = row['Required Skills']
                        if isinstance(skills, str):
                            skills_list = [s.strip() for s in skills.split(',')]
                            for skill in skills_list:
                                if skill in skills_counter:
                                    skills_counter[skill] += 1
                                else:
                                    skills_counter[skill] = 1
                
                # Sort by frequency and get top skills
                top_skills = sorted(skills_counter.items(), key=lambda x: x[1], reverse=True)
                field_skills[field] = [skill for skill, _ in top_skills[:10]]  # Top 10 skills
        
        # Add skills from the field mappings for fields without data
        for field in self.field_mappings:
            if field not in field_skills:
                field_skills[field] = []
                
        return field_skills
    
    def _get_field_for_specialization(self, specialization):
        """
        Get the field for a given specialization.
        
        Args:
            specialization (str): Specialization name
            
        Returns:
            str: Field name
        """
        # Check field mappings
        for field, specs in self.field_mappings.items():
            if specialization in specs:
                return field
        
        # Check career paths data
        for path in self.career_paths:
            if path['title'] == specialization and 'field' in path:
                return path['field']
        
        # Default return if not found
        return "Other"
    
    def _get_model_prediction(self, skills):
        """
        Get field prediction from the ML model.
        
        Args:
            skills (list): List of skills
            
        Returns:
            tuple: (predicted_field, confidence, top_fields_with_scores)
        """
        if not MODEL_AVAILABLE or self.model is None:
            return None, 0, []
        
        try:
            # Preprocess skills for the model
            processed_skills = preprocess_skills_for_model(skills, self.model_components)
            
            # Get prediction and confidence
            predicted_field, confidence, all_scores = predict_career_field(
                processed_skills, 
                self.model, 
                self.model_components
            )
            
            # Sort fields by score
            top_fields = [(field, score) for field, score in all_scores.items()]
            top_fields.sort(key=lambda x: x[1], reverse=True)
            
            return predicted_field, confidence, top_fields
        except Exception as e:
            print(f"Model prediction error: {str(e)}")
            return None, 0, []
    
    def _get_semantic_recommendations(self, skills):
        """
        Get recommendations based on semantic matching.
        
        Args:
            skills (list): List of skills
            
        Returns:
            list: Recommended fields with match percentages
        """
        try:
            # Use enhanced field recommendations
            recommendations = enhanced_recommend_fields_based_on_skills(skills)
            return recommendations
        except Exception as e:
            print(f"Semantic recommendation error: {str(e)}")
            return []
    
    def _get_rule_based_matches(self, skills, current_field=None, current_specialization=None):
        """
        Get rule-based matches for skills.
        
        Args:
            skills (list): List of skills
            current_field (str, optional): Current field
            current_specialization (str, optional): Current specialization
            
        Returns:
            list: Field matches based on rules
        """
        rule_matches = []
        
        # Direct skill-to-field matching
        for field, key_skills in self.field_key_skills.items():
            matching_skills = []
            for skill in skills:
                if skill in key_skills:
                    matching_skills.append(skill)
            
            if matching_skills:
                match_percentage = round((len(matching_skills) / len(key_skills)) * 100) if key_skills else 0
                rule_matches.append({
                    "field": field,
                    "match_percentage": match_percentage,
                    "matching_skills": matching_skills,
                    "rule_based": True
                })
        
        # Sort by match percentage
        rule_matches.sort(key=lambda x: x['match_percentage'], reverse=True)
        
        # Boost fields related to current field if provided
        if current_field and current_field in self.field_mappings:
            for match in rule_matches:
                if match['field'] == current_field:
                    # Boost current field slightly (don't make it too dominant)
                    match['match_percentage'] = min(100, match['match_percentage'] + 10)
                    match['is_current_field'] = True
        
        return rule_matches
    
    def recommend_fields_for_employee(self, employee_skills, current_field=None, 
                                     current_specialization=None, top_n=5, verbose=False):
        """
        Generate comprehensive field recommendations for an employee.
        
        Args:
            employee_skills (list): Employee's current skills
            current_field (str, optional): Employee's current field
            current_specialization (str, optional): Employee's current specialization
            top_n (int): Number of top recommendations to return
            verbose (bool): Whether to print detailed output
            
        Returns:
            dict: Recommendation results
        """
        if verbose:
            print(f"Generating recommendations for employee with {len(employee_skills)} skills")
            print(f"Current field: {current_field}")
            print(f"Current specialization: {current_specialization}")
        
        # Get recommendations from different sources
        model_field, model_confidence, model_top_fields = self._get_model_prediction(employee_skills)
        semantic_recommendations = self._get_semantic_recommendations(employee_skills)
        rule_based_matches = self._get_rule_based_matches(
            employee_skills, 
            current_field, 
            current_specialization
        )
        
        # Combine and weigh recommendations
        combined_recommendations = {}
        
        # Add model recommendations with weight
        model_weight = 0.4  # 40% weight to model
        if model_top_fields:
            for field, score in model_top_fields:
                weighted_score = score * model_weight * 100  # Convert to percentage
                if field in combined_recommendations:
                    combined_recommendations[field]['sources'].append('model')
                    combined_recommendations[field]['scores'].append(weighted_score)
                else:
                    combined_recommendations[field] = {
                        'field': field,
                        'sources': ['model'],
                        'scores': [weighted_score],
                        'matching_skills': [],
                        'similar_skills': {},
                        'missing_skills': []
                    }
        
        # Add semantic recommendations with weight
        semantic_weight = 0.4  # 40% weight to semantic
        for rec in semantic_recommendations:
            field = rec['field']
            weighted_score = rec['match_percentage'] * semantic_weight
            
            if field in combined_recommendations:
                combined_recommendations[field]['sources'].append('semantic')
                combined_recommendations[field]['scores'].append(weighted_score)
                combined_recommendations[field]['matching_skills'].extend(rec['matching_skills'])
                
                # Add similar skills if available
                if 'similar_skills' in rec:
                    combined_recommendations[field]['similar_skills'].update(rec['similar_skills'])
                
                # Add missing skills if available
                if 'missing_skills' in rec:
                    combined_recommendations[field]['missing_skills'].extend(rec['missing_skills'])
            else:
                similar_skills = rec.get('similar_skills', {})
                missing_skills = rec.get('missing_skills', [])
                
                combined_recommendations[field] = {
                    'field': field,
                    'sources': ['semantic'],
                    'scores': [weighted_score],
                    'matching_skills': rec['matching_skills'],
                    'similar_skills': similar_skills,
                    'missing_skills': missing_skills
                }
        
        # Add rule-based matches with weight
        rule_weight = 0.2  # 20% weight to rules
        for rec in rule_based_matches:
            field = rec['field']
            weighted_score = rec['match_percentage'] * rule_weight
            
            if field in combined_recommendations:
                combined_recommendations[field]['sources'].append('rule')
                combined_recommendations[field]['scores'].append(weighted_score)
                
                # Add matching skills if not already included
                for skill in rec['matching_skills']:
                    if skill not in combined_recommendations[field]['matching_skills']:
                        combined_recommendations[field]['matching_skills'].append(skill)
            else:
                combined_recommendations[field] = {
                    'field': field,
                    'sources': ['rule'],
                    'scores': [weighted_score],
                    'matching_skills': rec['matching_skills'],
                    'similar_skills': {},
                    'missing_skills': []
                }
        
        # Calculate final scores
        final_recommendations = []
        for field, data in combined_recommendations.items():
            # Calculate average score across all sources
            avg_score = sum(data['scores']) / len(data['scores'])
            
            # Apply boost for current field if applicable
            if field == current_field:
                avg_score = min(100, avg_score + 5)  # Small boost for current field
            
            # Remove duplicates from matching skills
            matching_skills = list(set(data['matching_skills']))
            
            # Create final recommendation
            final_rec = {
                'field': field,
                'match_percentage': round(avg_score, 1),
                'sources': list(set(data['sources'])),  # Remove duplicates
                'matching_skills': matching_skills,
                'similar_skills': data['similar_skills'],
                'missing_skills': data['missing_skills'][:10] if data['missing_skills'] else []
            }
            
            final_recommendations.append(final_rec)
        
        # Sort by match percentage
        final_recommendations.sort(key=lambda x: x['match_percentage'], reverse=True)
        
        # Get top specializations for the top field
        top_specializations = []
        if final_recommendations:
            top_field = final_recommendations[0]['field']
            top_specializations = self.recommend_specializations_for_field(
                employee_skills, 
                top_field, 
                top_n=3
            )
        
        # Prepare detailed explanation of the recommendations
        explanation = self._generate_recommendation_explanation(
            final_recommendations[:top_n], 
            employee_skills,
            current_field,
            current_specialization
        )
        
        return {
            'top_fields': final_recommendations[:top_n],
            'top_specializations': top_specializations,
            'current_field': current_field,
            'current_specialization': current_specialization,
            'explanation': explanation
        }
    
    def recommend_specializations_for_field(self, employee_skills, field, top_n=5):
        """
        Recommend specializations for a given field.
        
        Args:
            employee_skills (list): Employee's current skills
            field (str): Field to recommend specializations for
            top_n (int): Number of top recommendations to return
            
        Returns:
            list: Recommended specializations
        """
        specializations = []
        
        # Get specializations for the field from field mappings
        field_specializations = self.field_mappings.get(field, [])
        
        # Add specializations from career paths data
        for path in self.career_paths:
            if path.get('field') == field or path.get('title') in field_specializations:
                spec_title = path.get('title')
                if spec_title and spec_title not in [s['specialization'] for s in specializations]:
                    # Calculate match percentage
                    analysis = enhanced_analyze_skill_gap(employee_skills, spec_title)
                    
                    # Create specialization recommendation
                    specializations.append({
                        'specialization': spec_title,
                        'match_percentage': analysis['match_percentage'],
                        'matching_skills': analysis['matching_skills'],
                        'similar_skills': analysis.get('similar_skills', {}),
                        'missing_skills': analysis['missing_skills'][:5]  # Limit to top 5
                    })
        
        # Sort by match percentage
        specializations.sort(key=lambda x: x['match_percentage'], reverse=True)
        
        return specializations[:top_n]
    
    def identify_skill_gaps(self, employee_skills, target_specialization):
        """
        Identify skill gaps for a specific specialization.
        
        Args:
            employee_skills (list): Employee's current skills
            target_specialization (str): Target specialization
            
        Returns:
            dict: Skill gap analysis
        """
        # Get skill gap analysis
        analysis = enhanced_analyze_skill_gap(employee_skills, target_specialization)
        
        # Get training recommendations for missing skills
        training_recs = {}
        
        for skill in analysis['missing_skills']:
            # Look for training recommendations in skills data
            if self.skills_data and 'training_recommendations' in self.skills_data:
                if skill in self.skills_data['training_recommendations']:
                    training_recs[skill] = self.skills_data['training_recommendations'][skill]
                else:
                    # Generic recommendations
                    training_recs[skill] = [
                        f"Online courses on {skill}",
                        f"Professional certifications in {skill}",
                        f"Internal training programs for {skill}"
                    ]
            else:
                # Generic recommendations
                training_recs[skill] = [
                    f"Online courses on {skill}",
                    f"Professional certifications in {skill}",
                    f"Internal training programs for {skill}"
                ]
        
        # Add training recommendations to analysis
        analysis['training_recommendations'] = training_recs
        
        return analysis
    
    def _generate_recommendation_explanation(self, recommendations, employee_skills, 
                                            current_field=None, current_specialization=None):
        """
        Generate a detailed explanation of the recommendations.
        
        Args:
            recommendations (list): Field recommendations
            employee_skills (list): Employee's current skills
            current_field (str, optional): Current field
            current_specialization (str, optional): Current specialization
            
        Returns:
            dict: Detailed explanation
        """
        explanation = {
            'summary': '',
            'skill_analysis': {},
            'transition_difficulty': {},
            'recommendations_reasoning': {}
        }
        
        # Generate summary
        if recommendations:
            top_field = recommendations[0]['field']
            match_percentage = recommendations[0]['match_percentage']
            
            if current_field and current_field == top_field:
                explanation['summary'] = (
                    f"Your skills align well with your current field of {current_field} "
                    f"({match_percentage}% match). You have a strong foundation to build upon."
                )
            elif current_field:
                explanation['summary'] = (
                    f"Based on your skills, you have a strong match ({match_percentage}% match) with "
                    f"the {top_field} field, which is different from your current {current_field} field. "
                    f"This could represent a potential career transition opportunity."
                )
            else:
                explanation['summary'] = (
                    f"Your skills show a strong alignment with the {top_field} field "
                    f"({match_percentage}% match), making it a recommended area to focus on."
                )
        
        # Add skill analysis
        explanation['skill_analysis'] = {
            'total_skills': len(employee_skills),
            'key_strengths': self._identify_key_strengths(employee_skills, recommendations),
            'development_areas': self._identify_development_areas(employee_skills, recommendations)
        }
        
        # Add transition difficulty for the top 3 fields
        for i, rec in enumerate(recommendations[:3]):
            field = rec['field']
            match_percentage = rec['match_percentage']
            
            # Lower match percentage = higher difficulty
            if match_percentage >= 75:
                difficulty = "Low"
            elif match_percentage >= 50:
                difficulty = "Medium"
            else:
                difficulty = "High"
            
            # Calculate estimated time for transition based on missing skills
            missing_skills_count = len(rec['missing_skills'])
            if missing_skills_count <= 3:
                time_estimate = "3-6 months"
            elif missing_skills_count <= 7:
                time_estimate = "6-12 months"
            else:
                time_estimate = "1+ years"
            
            explanation['transition_difficulty'][field] = {
                'difficulty': difficulty,
                'time_estimate': time_estimate,
                'missing_skills_count': missing_skills_count
            }
        
        # Add recommendation reasoning
        for i, rec in enumerate(recommendations[:3]):
            field = rec['field']
            sources = rec['sources']
            matching_skills = rec['matching_skills']
            similar_skills = rec['similar_skills']
            
            reasoning = []
            
            # Add reasoning based on sources
            if 'model' in sources:
                reasoning.append("Machine learning model identified pattern match with professionals in this field")
            
            if 'semantic' in sources:
                reasoning.append("Your skills semantically align with core requirements in this field")
            
            if 'rule' in sources:
                reasoning.append("Your skills directly match key requirements for this field")
            
            # Add reasoning based on matching skills
            if matching_skills:
                skills_str = ", ".join(matching_skills[:3])
                if len(matching_skills) > 3:
                    skills_str += f", and {len(matching_skills) - 3} more"
                reasoning.append(f"You possess important skills for this field: {skills_str}")
            
            # Add reasoning based on similar skills
            if similar_skills:
                reasoning.append("You have transferable skills that apply well to this field")
            
            explanation['recommendations_reasoning'][field] = reasoning
        
        return explanation
    
    def _identify_key_strengths(self, employee_skills, recommendations):
        """
        Identify key strengths based on skills and recommendations.
        
        Args:
            employee_skills (list): Employee's current skills
            recommendations (list): Field recommendations
            
        Returns:
            list: Key strengths
        """
        strengths = []
        
        if not recommendations:
            return strengths
        
        # Get top fields
        top_fields = [rec['field'] for rec in recommendations[:3]]
        
        # Identify skills that appear in multiple top fields
        common_skills = {}
        
        for rec in recommendations[:3]:
            for skill in rec['matching_skills']:
                if skill in common_skills:
                    common_skills[skill] += 1
                else:
                    common_skills[skill] = 1
        
        # Skills that appear in multiple fields are key strengths
        for skill, count in common_skills.items():
            if count > 1:
                strengths.append({
                    'skill': skill,
                    'relevance': 'high' if count >= 3 else 'medium',
                    'applicable_fields': [rec['field'] for rec in recommendations[:3] 
                                         if skill in rec['matching_skills']]
                })
        
        # Add other strong skills that may only appear in one field
        for rec in recommendations[:1]:  # Just look at top field
            for skill in rec['matching_skills']:
                if skill not in [s['skill'] for s in strengths]:
                    strengths.append({
                        'skill': skill,
                        'relevance': 'medium',
                        'applicable_fields': [rec['field']]
                    })
        
        return strengths[:5]  # Return top 5 strengths
    
    def _identify_development_areas(self, employee_skills, recommendations):
        """
        Identify development areas based on recommendations.
        
        Args:
            employee_skills (list): Employee's current skills
            recommendations (list): Field recommendations
            
        Returns:
            list: Development areas
        """
        development_areas = []
        
        if not recommendations:
            return development_areas
        
        # Focus on the top recommendation
        top_rec = recommendations[0]
        
        # Add missing skills as development areas
        for skill in top_rec['missing_skills'][:5]:  # Top 5 missing skills
            development_areas.append({
                'skill': skill,
                'importance': 'high',
                'reason': f"Core skill for {top_rec['field']} field"
            })
        
        return development_areas
    
    def save_employee_recommendation(self, employee_id, recommendations, employee_skills=None):
        """
        Save employee recommendation for future reference.
        
        Args:
            employee_id (str): Employee ID
            recommendations (dict): Recommendation results
            employee_skills (list, optional): Employee's skills
            
        Returns:
            bool: Whether save was successful
        """
        try:
            # Prepare data to save
            save_data = {
                'employee_id': employee_id,
                'timestamp': datetime.now().isoformat(),
                'recommendations': recommendations
            }
            
            if employee_skills:
                save_data['employee_skills'] = employee_skills
            
            # Save to user preferences
            save_user_preferences(save_data)
            
            return True
        except Exception as e:
            print(f"Error saving employee recommendation: {str(e)}")
            return False


def example_usage():
    """Example usage of the hybrid recommender."""
    # Create hybrid recommender
    recommender = HybridRecommender()
    
    # Example employee skills
    employee_skills = [
        "Project Management", "Communication", "Leadership",
        "Python", "Data Analysis", "SQL", "Problem Solving"
    ]
    
    # Get recommendations
    recommendations = recommender.recommend_fields_for_employee(
        employee_skills,
        current_field="Technology",
        current_specialization="Data Science",
        verbose=True
    )
    
    # Print recommendations
    print("\n" + "=" * 60)
    print("EMPLOYEE CAREER RECOMMENDATIONS")
    print("=" * 60)
    
    print("\nTop Fields:")
    for i, field in enumerate(recommendations['top_fields'], 1):
        print(f"{i}. {field['field']} - {field['match_percentage']}% match")
        print(f"   Matching skills: {', '.join(field['matching_skills'][:3])}...")
        if field['missing_skills']:
            print(f"   Missing skills: {', '.join(field['missing_skills'][:3])}...")
    
    print("\nTop Specializations:")
    for i, spec in enumerate(recommendations['top_specializations'], 1):
        print(f"{i}. {spec['specialization']} - {spec['match_percentage']}% match")
    
    print("\nExplanation:")
    print(recommendations['explanation']['summary'])
    print("\nStrengths:")
    for strength in recommendations['explanation']['skill_analysis']['key_strengths']:
        print(f"- {strength['skill']} ({strength['relevance']} relevance)")
    
    print("\nDevelopment Areas:")
    for area in recommendations['explanation']['skill_analysis']['development_areas']:
        print(f"- {area['skill']} ({area['importance']} importance)")
    
    # Identify skill gaps for top specialization
    if recommendations['top_specializations']:
        top_spec = recommendations['top_specializations'][0]['specialization']
        print(f"\nSkill Gap Analysis for {top_spec}:")
        
        skill_gaps = recommender.identify_skill_gaps(employee_skills, top_spec)
        
        print(f"Match Percentage: {skill_gaps['match_percentage']}%")
        print("\nMissing Skills with Training Recommendations:")
        
        for i, skill in enumerate(skill_gaps['missing_skills'][:5], 1):
            print(f"{i}. {skill}")
            
            if skill in skill_gaps['training_recommendations']:
                for j, rec in enumerate(skill_gaps['training_recommendations'][skill][:2], 1):
                    print(f"   {j}. {rec}")


if __name__ == "__main__":
    print("\nHybrid Recommendation System Demo")
    print("-" * 40)
    example_usage() 