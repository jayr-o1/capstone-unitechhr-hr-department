import os
import json
from collections import defaultdict

def get_required_skills_for_specialization(specialization, career_paths=None):
    """
    Get required skills for a specific specialization.
    
    Args:
        specialization (str): The specialization to get skills for
        career_paths (list, optional): List of career paths data
        
    Returns:
        list: Required skills for the specialization
    """
    if career_paths is None:
        career_paths = load_career_paths()
    
    for path in career_paths:
        if path['title'] == specialization:
            return path['required_skills']
    
    return []

def analyze_skill_gap(user_skills, specialization, career_paths=None):
    """
    Analyze the gap between user skills and required skills for a specialization.
    
    Args:
        user_skills (list): User's current skills
        specialization (str): Target specialization
        career_paths (list, optional): List of career paths data
        
    Returns:
        dict: Analysis results including missing skills, match percentage, etc.
    """
    if career_paths is None:
        career_paths = load_career_paths()
    
    # Get required skills for the specialization
    required_skills = get_required_skills_for_specialization(specialization, career_paths)
    
    # Convert to sets for easier operations
    user_skills_set = set(user_skills)
    required_skills_set = set(required_skills)
    
    # Calculate matching and missing skills
    matching_skills = user_skills_set.intersection(required_skills_set)
    missing_skills = required_skills_set - user_skills_set
    
    # Calculate match percentage
    match_percentage = 0
    if required_skills:
        match_percentage = round((len(matching_skills) / len(required_skills)) * 100)
    
    return {
        "specialization": specialization,
        "required_skills": list(required_skills_set),
        "user_skills": list(user_skills_set),
        "matching_skills": list(matching_skills),
        "missing_skills": list(missing_skills),
        "match_percentage": match_percentage
    }

def recommend_fields_based_on_skills(user_skills, career_paths=None):
    """
    Recommend fields of study based on user skills.
    
    Args:
        user_skills (list): User's current skills
        career_paths (list, optional): List of career paths data
        
    Returns:
        list: Recommended fields with match percentages
    """
    if career_paths is None:
        career_paths = load_career_paths()
    
    # Define mapping from specializations to fields
    fields = {
        "Technology": ["Software Development", "Data Science", "Cybersecurity", "Cloud Computing"],
        "Criminal Justice": ["Criminology", "Forensic Science", "Law Enforcement", "Criminal Justice"],
        "Healthcare": ["Healthcare Administration", "Nursing", "Clinical Psychology", "Industrial-Organizational Psychology"],
        "Business": ["Marketing", "Finance", "Human Resources"],
        "Engineering": ["Mechanical Engineering", "Civil Engineering"],
        "Education": ["Elementary Education", "Secondary Education"],
        "Creative Arts": ["Graphic Design", "Film Production"],
        "Legal": ["Legal Practice"],
        "Science": ["Environmental Science"],
        "Media": ["Journalism"],
        "Social Services": ["Social Work"],
        "Healthcare Specialists": ["Physical Therapy", "Speech-Language Pathology"],
        "Design": ["Architecture", "Interior Design"],
        "Agriculture": ["Agriculture"],
        "Hospitality": ["Hospitality Management"],
        "Medical": ["Dentistry", "Pharmacy", "Veterinary Medicine"],
        "Urban Development": ["Urban Planning"]
    }
    
    # Calculate field match percentages
    field_matches = []
    for field, specializations in fields.items():
        # Collect all skills required for specializations in this field
        field_skills = set()
        field_specializations = []
        
        for path in career_paths:
            if path['title'] in specializations:
                field_skills.update(path['required_skills'])
                field_specializations.append(path['title'])
        
        # Calculate match percentage
        user_skills_set = set(user_skills)
        matching_skills = user_skills_set.intersection(field_skills)
        
        match_percentage = 0
        if field_skills:
            match_percentage = round((len(matching_skills) / len(field_skills)) * 100)
        
        field_matches.append({
            "field": field,
            "match_percentage": match_percentage,
            "specializations": field_specializations,
            "matching_skills": list(matching_skills),
            "missing_skills": list(field_skills - user_skills_set)
        })
    
    # Sort by match percentage
    field_matches.sort(key=lambda x: x['match_percentage'], reverse=True)
    
    return field_matches

def recommend_specializations_for_field(user_skills, field, career_paths=None):
    """
    Recommend specializations within a field based on user skills.
    
    Args:
        user_skills (list): User's current skills
        field (str): Field of study
        career_paths (list, optional): List of career paths data
        
    Returns:
        list: Recommended specializations with match percentages
    """
    if career_paths is None:
        career_paths = load_career_paths()
    
    # Define mapping from fields to specializations
    fields = {
        "Technology": ["Software Development", "Data Science", "Cybersecurity", "Cloud Computing"],
        "Criminal Justice": ["Criminology", "Forensic Science", "Law Enforcement", "Criminal Justice"],
        "Healthcare": ["Healthcare Administration", "Nursing", "Clinical Psychology", "Industrial-Organizational Psychology"],
        "Business": ["Marketing", "Finance", "Human Resources"],
        "Engineering": ["Mechanical Engineering", "Civil Engineering"],
        "Education": ["Elementary Education", "Secondary Education"],
        "Creative Arts": ["Graphic Design", "Film Production"],
        "Legal": ["Legal Practice"],
        "Science": ["Environmental Science"],
        "Media": ["Journalism"],
        "Social Services": ["Social Work"],
        "Healthcare Specialists": ["Physical Therapy", "Speech-Language Pathology"],
        "Design": ["Architecture", "Interior Design"],
        "Agriculture": ["Agriculture"],
        "Hospitality": ["Hospitality Management"],
        "Medical": ["Dentistry", "Pharmacy", "Veterinary Medicine"],
        "Urban Development": ["Urban Planning"]
    }
    
    # Get specializations for the field
    specializations = fields.get(field, [])
    
    # Calculate specialization match percentages
    specialization_matches = []
    for path in career_paths:
        if path['title'] in specializations:
            analysis = analyze_skill_gap(user_skills, path['title'], career_paths)
            specialization_matches.append({
                "specialization": path['title'],
                "match_percentage": analysis['match_percentage'],
                "matching_skills": analysis['matching_skills'],
                "missing_skills": analysis['missing_skills']
            })
    
    # Sort by match percentage
    specialization_matches.sort(key=lambda x: x['match_percentage'], reverse=True)
    
    return specialization_matches

def get_training_recommendations_for_skills(missing_skills):
    """
    Get training recommendations for missing skills.
    
    Args:
        missing_skills (list): Skills that the user is missing
        
    Returns:
        dict: Training recommendations for each missing skill
    """
    # Load training recommendations
    training_recs = load_training_recommendations()
    
    recommendations = {}
    for skill in missing_skills:
        if skill in training_recs:
            recommendations[skill] = training_recs[skill]
        else:
            # Generic recommendations for skills without specific training paths
            recommendations[skill] = [
                f"Take online courses on {skill}",
                f"Join communities focused on {skill}",
                f"Practice {skill} through relevant projects"
            ]
    
    return recommendations

def calculate_skill_similarity(user_skill, required_skill):
    """
    Calculate similarity between a user skill and a required skill.
    
    This function helps identify when general transferable skills like
    'Communication' or 'Leadership' match with field-specific skills.
    
    Args:
        user_skill (str): The user's skill
        required_skill (str): The required skill for a career path
        
    Returns:
        float: Similarity score between 0 and 1
    """
    # Dictionary mapping general skills to field-specific skills
    skill_similarity_map = {
        # Education-related mappings
        "Communication": ["Classroom Management", "Student Engagement", "Parental Communication", "Lecture Preparation"],
        "Leadership": ["Educational Leadership", "Staff Management", "School Operations", "Curriculum Oversight"],
        "Organization": ["Curriculum Development", "Course Design", "Lesson Planning", "Assessment Design"],
        "Patience": ["Special Education", "Student Advising", "Differentiated Instruction", "Child Psychology"],
        "Teamwork": ["Professional Networking", "Mentoring", "Collaborative Teaching", "Staff Management"],
        "Critical Thinking": ["Scholarly Research", "Academic Publishing", "Research Skills", "Assessment Methods"],
        "Time Management": ["Deadline Management", "Course Scheduling", "Curriculum Planning"],
        "Conflict Resolution": ["Student Discipline", "Conflict Management", "Classroom Management"],
        "Computer Skills": ["Educational Technology", "E-Learning Systems", "Digital Classroom Tools"],
        "Imaginative Thinking": ["Curriculum Innovation", "Creative Teaching Methods", "Differentiated Instruction"],
        
        # Technology-related mappings
        "Problem Solving": ["Debugging", "System Design", "Requirements Analysis", "Test Automation"],
        "Analytical Skills": ["Data Analysis", "Performance Optimization", "Requirements Gathering"],

        # Data Science related mappings - added for better Data Science matching
        "Data Analysis": ["Machine Learning", "Statistical Modeling", "Big Data", "Data Mining", "Natural Language Processing", "Deep Learning", "Data Science", "Predictive Modeling", "Business Intelligence"],
        "Statistics": ["Statistical Modeling", "Machine Learning", "Experimental Design", "Data Mining", "Data Science"],
        "Python": ["Data Science", "Machine Learning", "Web Development", "Automation", "Scripting", "Software Development"],
        "SQL": ["Database Management", "Data Analysis", "Data Warehousing", "Business Intelligence", "Data Engineering"],
        "Data Visualization": ["Business Intelligence", "Data Analysis", "Data Science", "User Interface Design"],
        "R": ["Statistical Modeling", "Data Analysis", "Data Science", "Biostatistics"],
        "Excel": ["Data Analysis", "Financial Modeling", "Business Intelligence", "Statistics"],
        "Machine Learning": ["Data Science", "Artificial Intelligence", "Deep Learning", "Computer Vision"],
        "Big Data": ["Data Engineering", "Hadoop", "Spark", "Cloud Computing", "Distributed Systems"],
        
        # Security-related mappings
        "Network Management": ["Network Security", "Firewall Configuration", "VPN Setup", "Network Monitoring"],
        "Cybersecurity": ["Information Security", "Ethical Hacking", "Security Auditing", "Incident Response", "Penetration Testing"],
        "Information Technology": ["System Administration", "Network Security", "Cloud Services", "Desktop Support"],
        
        # Healthcare-related mappings
        "Patient Care": ["Clinical Skills", "Nursing", "Patient Assessment", "Medical Procedures"],
        "Medical Knowledge": ["Medical Terminology", "Anatomy", "Physiology", "Pharmacology", "Diagnosis"],
        "Attention to Detail": ["Medical Documentation", "Lab Procedures", "Quality Assurance", "Medication Administration"],
        
        # Business-related mappings
        "Business Acumen": ["Market Analysis", "Strategic Planning", "Business Development", "Competitive Analysis"],
        "Financial Skills": ["Financial Analysis", "Budgeting", "Financial Reporting", "Investment Analysis"]
    }
    
    # Initialize similarity score
    max_similarity = 0.0
    
    # Exact match
    if user_skill.lower() == required_skill.lower():
        return 1.0
    
    # Check for partial string match - stronger similarity
    if user_skill.lower() in required_skill.lower() or required_skill.lower() in user_skill.lower():
        similarity = 0.8
        if similarity > max_similarity:
            max_similarity = similarity
    
    # Check if user skill has a mapping to the required skill
    if user_skill in skill_similarity_map:
        for similar_skill in skill_similarity_map[user_skill]:
            if similar_skill.lower() == required_skill.lower():
                similarity = 0.9  # High similarity for directly mapped skills
                if similarity > max_similarity:
                    max_similarity = similarity
            elif similar_skill.lower() in required_skill.lower() or required_skill.lower() in similar_skill.lower():
                similarity = 0.7  # Medium similarity for partial matches within mapped skills
                if similarity > max_similarity:
                    max_similarity = similarity
    
    # Check for single word matches in multi-word skills
    user_words = set(user_skill.lower().split())
    required_words = set(required_skill.lower().split())
    common_words = user_words.intersection(required_words)
    
    if common_words:
        similarity = len(common_words) / max(len(user_words), len(required_words))
        if similarity > max_similarity:
            max_similarity = similarity
    
    return max_similarity

def enhanced_analyze_skill_gap(user_skills, specialization, career_paths=None):
    """
    Enhanced version of analyze_skill_gap that considers skill similarity.
    
    Args:
        user_skills (list): User's current skills
        specialization (str): Target specialization
        career_paths (list, optional): List of career paths data
        
    Returns:
        dict: Analysis results including missing skills, match percentage, etc.
    """
    if career_paths is None:
        career_paths = load_career_paths()
    
    # Get required skills for the specialization
    required_skills = get_required_skills_for_specialization(specialization, career_paths)
    if not required_skills:
        return {
            "specialization": specialization,
            "required_skills": [],
            "user_skills": user_skills,
            "matching_skills": [],
            "similar_skills": [],
            "missing_skills": [],
            "match_percentage": 0
        }
    
    # Calculate direct matches
    user_skills_set = set(user_skills)
    required_skills_set = set(required_skills)
    direct_matching_skills = user_skills_set.intersection(required_skills_set)
    
    # Calculate similarity-based matches
    similar_skills = {}
    for user_skill in user_skills:
        for req_skill in required_skills:
            if req_skill not in direct_matching_skills and req_skill not in similar_skills:
                similarity = calculate_skill_similarity(user_skill, req_skill)
                if similarity > 0.3:  # Threshold for considering it a match
                    similar_skills[req_skill] = {
                        "user_skill": user_skill,
                        "similarity": similarity
                    }
    
    # Calculate missing skills (accounting for both direct and similar matches)
    missing_skills = []
    for skill in required_skills:
        if skill not in direct_matching_skills and skill not in similar_skills:
            missing_skills.append(skill)
    
    # Calculate enhanced match percentage
    direct_match_count = len(direct_matching_skills)
    similar_match_count = sum(item["similarity"] for item in similar_skills.values())
    total_match_score = direct_match_count + similar_match_count
    match_percentage = round((total_match_score / len(required_skills)) * 100)
    
    return {
        "specialization": specialization,
        "required_skills": list(required_skills_set),
        "user_skills": list(user_skills_set),
        "matching_skills": list(direct_matching_skills),
        "similar_skills": similar_skills,
        "missing_skills": missing_skills,
        "match_percentage": match_percentage
    }

def enhanced_recommend_fields_based_on_skills(user_skills, career_paths=None):
    """
    Enhanced version of recommend_fields_based_on_skills that considers skill similarity.
    
    Args:
        user_skills (list): User's current skills
        career_paths (list, optional): List of career paths data
        
    Returns:
        list: Recommended fields with match percentages
    """
    if career_paths is None:
        career_paths = load_career_paths()
    
    # Define mapping from specializations to fields
    fields = {
        "Technology": ["Software Development", "Data Science", "Cybersecurity", "Cloud Computing"],
        "Criminal Justice": ["Criminology", "Forensic Science", "Law Enforcement", "Criminal Justice"],
        "Healthcare": ["Healthcare Administration", "Nursing", "Clinical Psychology", "Industrial-Organizational Psychology"],
        "Business": ["Marketing", "Finance", "Human Resources"],
        "Engineering": ["Mechanical Engineering", "Civil Engineering"],
        "Education": ["Elementary Education", "Secondary Education", "Elementary School Teacher", "College Professor", 
                      "Educational Administrator", "Special Education Teacher", "Educational Technologist"],
        "Creative Arts": ["Graphic Design", "Film Production"],
        "Legal": ["Legal Practice"],
        "Science": ["Environmental Science"],
        "Media": ["Journalism"],
        "Social Services": ["Social Work"],
        "Healthcare Specialists": ["Physical Therapy", "Speech-Language Pathology"],
        "Design": ["Architecture", "Interior Design"],
        "Agriculture": ["Agriculture"],
        "Hospitality": ["Hospitality Management"],
        "Medical": ["Dentistry", "Pharmacy", "Veterinary Medicine"],
        "Urban Development": ["Urban Planning"]
    }
    
    # Calculate field match percentages with similarities
    field_matches = []
    for field, specializations in fields.items():
        # Collect all skills required for specializations in this field
        field_skills = set()
        field_specializations = []
        
        for path in career_paths:
            if path['title'] in specializations:
                field_skills.update(path['required_skills'])
                field_specializations.append(path['title'])
        
        # Calculate enhanced match for this field
        direct_matching_skills = set()
        similar_skills = {}
        
        # Direct matches
        for user_skill in user_skills:
            for field_skill in field_skills:
                if user_skill.lower() == field_skill.lower():
                    direct_matching_skills.add(field_skill)
        
        # Similar matches
        for user_skill in user_skills:
            for field_skill in field_skills:
                if field_skill not in direct_matching_skills and field_skill not in similar_skills:
                    similarity = calculate_skill_similarity(user_skill, field_skill)
                    if similarity > 0.3:  # Threshold
                        similar_skills[field_skill] = {
                            "user_skill": user_skill,
                            "similarity": similarity
                        }
        
        # Calculate missing skills
        missing_skills = []
        for skill in field_skills:
            if skill not in direct_matching_skills and skill not in similar_skills:
                missing_skills.append(skill)
        
        # Calculate enhanced match percentage
        match_percentage = 0
        if field_skills:
            direct_match_count = len(direct_matching_skills)
            similar_match_count = sum(item["similarity"] for item in similar_skills.values())
            total_match_score = direct_match_count + similar_match_count
            match_percentage = round((total_match_score / len(field_skills)) * 100)
        
        field_matches.append({
            "field": field,
            "match_percentage": match_percentage,
            "specializations": field_specializations,
            "matching_skills": list(direct_matching_skills),
            "similar_skills": similar_skills,
            "missing_skills": missing_skills
        })
    
    # Sort by match percentage
    field_matches.sort(key=lambda x: x['match_percentage'], reverse=True)
    
    return field_matches

def load_career_paths():
    """
    Load career paths data from JSON file.
    
    Returns:
        list: Career paths data
    """
    file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'career_paths.json')
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data['career_paths']

def load_training_recommendations():
    """
    Load training recommendations from JSON file.
    
    Returns:
        dict: Training recommendations for various skills
    """
    file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'training_recommendations.json')
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data['training_recommendations']

def group_users_by_missing_skills(users_data=None):
    """
    Group users by missing skills to form training clusters.
    
    Args:
        users_data (list, optional): List of user data
        
    Returns:
        dict: Users grouped by missing skills
    """
    if users_data is None:
        # Load user data from user files
        users_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'users')
        users_data = []
        
        for filename in os.listdir(users_dir):
            if filename.endswith('.json'):
                with open(os.path.join(users_dir, filename), 'r') as f:
                    users_data.append(json.load(f))
    
    # Group users by missing skills
    skill_groups = defaultdict(list)
    
    for user in users_data:
        for skill in user.get('lacking_skills', []):
            skill_groups[skill].append({
                'user_id': user.get('user_id'),
                'preferred_specialization': user.get('preferred_specialization'),
                'current_skills': user.get('current_skills', [])
            })
    
    return skill_groups

def update_user_skills_and_recommendations(user_id, preferred_field, preferred_specialization, current_skills):
    """
    Update user's skills and recommendations in the database.
    
    Args:
        user_id (str): User ID
        preferred_field (str): User's preferred field
        preferred_specialization (str): User's preferred specialization
        current_skills (list): User's current skills
        
    Returns:
        dict: Updated user data
    """
    # Load career paths
    career_paths = load_career_paths()
    
    # Analyze skill gap for the preferred specialization
    analysis = analyze_skill_gap(current_skills, preferred_specialization, career_paths)
    
    # Create user data object
    user_data = {
        'user_id': user_id,
        'preferred_field': preferred_field,
        'preferred_specialization': preferred_specialization,
        'current_skills': current_skills,
        'lacking_skills': analysis['missing_skills'],
        'timestamp': None  # This will be filled in by the data_loader module
    }
    
    # Save user data (use save_user_preferences from data_loader module)
    from utils.data_loader import save_user_preferences
    user_data = save_user_preferences(user_data)
    
    # Update skill clusters
    from utils.cluster_manager import update_clusters
    update_clusters()
    
    return user_data 