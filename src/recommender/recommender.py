"""
Main recommender module for career recommendations.
This module integrates ML models with user input to provide career recommendations.
"""

import os
import pandas as pd
import numpy as np
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA

# Import utilities
from utils.data_processing import parse_resume, calculate_total_experience
from utils.feedback import load_feedback_db, get_user_feedback

# Define paths
MODEL_PATH = "models/career_path_recommendation_model.pkl"
EMPLOYEE_DATA_PATH = "data/synthetic_employee_data.csv"
CAREER_PATH_DATA_PATH = "data/synthetic_career_path_data.csv"

# Career fields data
career_fields = {
    "Computer Science": {
        "roles": [
            "Software Engineer", "Data Scientist", "Machine Learning Engineer",
            "Cybersecurity Analyst", "Cloud Architect", "DevOps Engineer",
            "UI/UX Designer", "Game Developer", "Mobile App Developer",
            "Database Administrator", "System Administrator", "Blockchain Developer",
            "AI Research Scientist", "IT Project Manager", "Network Engineer",
            "Embedded Systems Developer", "Full-Stack Developer", "Frontend Developer",
            "Backend Developer", "Data Engineer", "Software Architect",
            "Penetration Tester", "Business Intelligence Analyst",
            "Natural Language Processing Engineer", "Robotics Software Engineer",
            "IoT Developer", "Big Data Engineer", "Cloud Security Engineer"
        ],
        "skills": [
            "Python", "Java", "C++", "C#", "JavaScript", "SQL", "NoSQL",
            "Machine Learning", "Deep Learning", "Neural Networks", "Data Science",
            "Cybersecurity", "Cloud Computing", "DevOps", "UI/UX Design",
            "React.js", "Node.js", "Angular", "Vue.js", "Flutter",
            "TensorFlow", "PyTorch", "Kubernetes", "Docker", "Microservices",
            "Distributed Systems", "Web Development", "API Development",
            "Blockchain", "Cryptography", "Ethical Hacking", "Penetration Testing",
            "Computer Vision", "Internet of Things (IoT)", "Quantum Computing"
        ]
    },
    "Engineering": {
        "roles": [
            "Mechanical Engineer", "Civil Engineer", "Electrical Engineer",
            "Aerospace Engineer", "Biomedical Engineer", "Robotics Engineer",
            "Structural Engineer", "Renewable Energy Engineer", "Telecommunications Engineer",
            "Automation Engineer", "Materials Engineer", "Geotechnical Engineer",
            "Transportation Engineer", "Mechatronics Engineer", "Power Systems Engineer",
            "Automobile Engineer", "Chemical Engineer", "Industrial Engineer",
            "Petroleum Engineer", "Manufacturing Engineer", "Marine Engineer",
            "Nuclear Engineer", "Agricultural Engineer", "Environmental Engineer",
            "Water Resource Engineer", "Acoustical Engineer", "HVAC Engineer"
        ],
        "skills": [
            "Structural Analysis", "Thermodynamics", "Circuit Design",
            "Robotics", "CAD (Computer-Aided Design)", "Fluid Mechanics",
            "Materials Science", "Finite Element Analysis (FEA)", "AutoCAD",
            "SolidWorks", "ANSYS", "PLC Programming", "3D Printing",
            "Mechatronics", "Control Systems", "Electromagnetics",
            "Wireless Communication", "Signal Processing", "HVAC Systems",
            "Hydraulics", "Pneumatics", "Thermal Systems", "Geotechnical Surveying",
            "Project Management", "Finite Volume Method", "Engineering Economics"
        ]
    },
    "Healthcare & Medicine": {
        "roles": [
            "General Practitioner", "Surgeon", "Cardiologist", "Neurologist",
            "Pediatrician", "Radiologist", "Oncologist", "Anesthesiologist",
            "Psychiatrist", "Pathologist", "Emergency Medicine Physician",
            "Medical Researcher", "Public Health Specialist", "Genetic Counselor",
            "Clinical Research Coordinator", "Dentist", "Pharmacist",
            "Veterinarian", "Physiotherapist", "Occupational Therapist",
            "Nurse Practitioner", "Orthopedic Surgeon", "Endocrinologist",
            "Dermatologist", "Gastroenterologist", "Nephrologist",
            "Ophthalmologist", "Urologist", "Speech-Language Pathologist",
            "Medical Technologist", "Epidemiologist", "Health Informatics Specialist"
        ],
        "skills": [
            "Anatomy & Physiology", "Patient Care", "Pharmacology",
            "Radiology", "Emergency Response", "Clinical Research",
            "Medical Ethics", "Surgery", "CPR & First Aid", "Biostatistics",
            "Epidemiology", "Medical Imaging", "Microbiology", "Genetics",
            "Neuroscience", "Public Health Policy", "Telemedicine",
            "Hospital Administration", "Infection Control", "Geriatric Care",
            "Rehabilitation Therapy", "Medical Documentation", "Nutrition Science"
        ]
    },
    "Criminology & Law Enforcement": {
        "roles": [
            "Police Officer", "Detective", "Forensic Scientist", "Criminal Profiler",
            "FBI Agent", "CIA Analyst", "Cybercrime Investigator", "Homicide Detective",
            "Private Investigator", "Crime Scene Investigator (CSI)", "Legal Consultant",
            "Corrections Officer", "Border Patrol Agent", "Parole Officer",
            "Courtroom Bailiff", "Counterterrorism Analyst", "Security Consultant",
            "Forensic Psychologist", "Fraud Investigator", "Victim Advocate"
        ],
        "skills": [
            "Criminal Law", "Forensic Science", "Crime Scene Analysis",
            "Cybercrime Investigation", "Fingerprint Analysis", "Ballistics",
            "Interrogation Techniques", "Criminal Profiling", "Surveillance Techniques",
            "Legal Procedures", "Firearms Training", "Counterterrorism Strategies",
            "Investigative Journalism", "Forensic Accounting", "Polygraph Examination",
            "Data Forensics", "Psychology of Criminal Behavior", "Self-Defense Training",
            "Crisis Negotiation", "Emergency Response"
        ]
    },
    "Psychology & Mental Health": {
        "roles": [
            "Clinical Psychologist", "Counseling Psychologist", "Forensic Psychologist",
            "School Psychologist", "Industrial-Organizational Psychologist",
            "Neuropsychologist", "Behavioral Therapist", "Cognitive Behavioral Therapist",
            "Sports Psychologist", "Health Psychologist", "Military Psychologist",
            "Rehabilitation Psychologist", "Child Psychologist", "Substance Abuse Counselor",
            "Marriage & Family Therapist", "Psychometrician", "Educational Psychologist",
            "Crisis Counselor", "Grief Counselor", "Social Worker"
        ],
        "skills": [
            "Cognitive Behavioral Therapy (CBT)", "Psychoanalysis", "Trauma Therapy",
            "Forensic Psychology", "Behavioral Neuroscience", "Mental Health Assessment",
            "Addiction Counseling", "Crisis Intervention", "Group Therapy",
            "Psychological Research", "Neuropsychological Testing", "Counseling Techniques",
            "Developmental Psychology", "Social Work", "Emotional Intelligence",
            "Mindfulness-Based Therapy", "Psychopathology", "Family Counseling",
            "Stress Management", "Suicidology"
        ]
    },
    "Law & Legal Studies": {
        "roles": [
            "Lawyer", "Judge", "Legal Consultant", "Corporate Attorney",
            "Criminal Defense Attorney", "Intellectual Property Lawyer",
            "Environmental Lawyer", "Human Rights Lawyer", "Tax Attorney",
            "Government Prosecutor", "Legal Researcher", "Paralegal",
            "Public Defender", "Contract Attorney", "Real Estate Lawyer"
        ],
        "skills": [
            "Legal Research", "Contract Law", "Criminal Law", "Civil Litigation",
            "Intellectual Property Law", "Corporate Law", "Taxation Law",
            "Constitutional Law", "International Law", "Family Law",
            "Legal Writing", "Trial Advocacy", "Negotiation", "Mediation"
        ]
    },
    "Doctorate & Research": {
        "roles": [
            "University Professor", "Research Scientist", "Postdoctoral Researcher",
            "Academic Author", "Principal Investigator", "Think Tank Analyst",
            "Policy Researcher", "Scientific Journal Editor", "Lab Director",
            "Social Science Researcher", "Experimental Psychologist", "Economic Analyst"
        ],
        "skills": [
            "Academic Writing", "Data Analysis", "Research Methodology",
            "Statistical Analysis", "Grant Writing", "Qualitative Research",
            "Peer Review", "Experimental Design", "Scientific Communication"
        ]
    },
    "Accountancy": {
        "roles": [
            "Accountant", "Auditor", "Tax Consultant", "Financial Analyst",
            "Forensic Accountant", "Management Accountant", "Cost Accountant",
            "Chartered Accountant", "Budget Analyst", "Payroll Manager",
            "Financial Controller", "Investment Analyst", "Risk Analyst",
            "Treasury Analyst", "Compliance Officer", "Credit Analyst",
            "Revenue Agent", "Financial Planner", "Actuary", "Bookkeeper"
        ],
        "skills": [
            "Financial Accounting", "Managerial Accounting", "Taxation",
            "Auditing", "Financial Reporting", "Cost Accounting",
            "Budgeting & Forecasting", "Risk Management", "Financial Analysis",
            "Compliance & Regulation", "GAAP (Generally Accepted Accounting Principles)",
            "IFRS (International Financial Reporting Standards)", "ERP Systems (e.g., SAP)",
            "Payroll Management", "Forensic Accounting", "Investment Analysis",
            "Corporate Finance", "Cash Flow Management", "Internal Controls",
            "Tax Planning", "Financial Modeling", "Data Analysis", "Excel Proficiency"
        ]
    }
}

# Global variables
model = None
tfidf = None
pca = None
label_encoder = None
employee_data = None
career_path_data = None

def load_model_and_data():
    """
    Load the trained model and dataset for making recommendations.
    
    Returns:
        bool: True if loading was successful, False otherwise
    """
    global model, tfidf, pca, label_encoder, employee_data, career_path_data
    
    try:
        # Load the trained model
        model = joblib.load(MODEL_PATH)
        
        # Load datasets
        employee_data = pd.read_csv(EMPLOYEE_DATA_PATH)
        career_path_data = pd.read_csv(CAREER_PATH_DATA_PATH)
        
        # Prepare TF-IDF vectorizer
        tfidf = TfidfVectorizer(max_features=100)
        X_skills = tfidf.fit_transform(employee_data["Skills"])
        
        # TODO: Load label encoder from the model file
        # For now, recreate it
        from sklearn.preprocessing import LabelEncoder
        label_encoder = LabelEncoder()
        employee_data["Field"] = employee_data["Career Goal"].map(
            {goal: field for field, goals in career_fields.items() for goal in goals["roles"]}
        )
        label_encoder.fit(employee_data["Field"])
        
        # Prepare PCA
        X = pd.concat([pd.DataFrame(X_skills.toarray()), employee_data["Experience"].str.extract("(\d+)").astype(float)], axis=1)
        pca = PCA(n_components=min(38, X.shape[1]))
        pca.fit(X)
        
        return True
    except Exception as e:
        print(f"Error loading model and data: {e}")
        return False

def recommend_field_and_career_paths(skills, experience, user_id=None):
    """
    Recommends a field, top 3 career paths, required skills, lacking skills, and training recommendations.

    Args:
        skills (str): Comma-separated string of skills (e.g., "Python, SQL, Machine Learning").
        experience (str): Experience in years (e.g., "5+ years").
        user_id (str, optional): User ID for personalized recommendations.

    Returns:
        dict: A dictionary containing the recommended field, top 3 career paths, required skills, lacking skills, and training recommendations.
    """
    # First check if we have personalized recommendations for this user
    if user_id:
        feedback_db = load_feedback_db()
        if user_id in feedback_db["improved_recommendations"]:
            personalized_recs = feedback_db["improved_recommendations"][user_id]
            # Check if the skills and experience are similar to what we've seen before
            # Simple implementation - could be enhanced with similarity metrics
            if personalized_recs["skills"] == skills and personalized_recs["experience"] == experience:
                print(f"Using personalized recommendations for user {user_id}")
                return personalized_recs["recommendation"]
    
    # Ensure model and data are loaded
    if model is None or tfidf is None or pca is None:
        if not load_model_and_data():
            raise Exception("Failed to load model and data")
    
    # Convert skills to TF-IDF features
    skills_tfidf = tfidf.transform([skills])

    # Convert experience to numerical value
    experience_num = float(experience.strip("+ years"))

    # Combine features
    X_input = pd.concat([pd.DataFrame(skills_tfidf.toarray()), pd.Series(experience_num)], axis=1)
    
    # Ensure column names match
    X_input.columns = [str(col) for col in X_input.columns]

    # Reduce dimensionality using PCA
    X_input_pca = pca.transform(X_input)

    # Predict field and get probabilities
    y_pred_proba = model.predict_proba(X_input_pca)
    predicted_field_index = np.argmax(y_pred_proba)
    predicted_field = label_encoder.inverse_transform([predicted_field_index])[0]
    confidence_percentage = y_pred_proba[0][predicted_field_index] * 100  # Confidence for the predicted field

    # Filter career paths within the predicted field
    field_career_paths = career_fields[predicted_field]["roles"]

    # Filter career_path_data to include only career paths in the predicted field
    field_career_data = career_path_data[career_path_data["Career Path"].isin(field_career_paths)]

    # Calculate similarity between input skills and required skills for each career path
    input_skills_set = set(skills.split(", "))
    similarity_scores = []
    for _, row in field_career_data.iterrows():
        required_skills_set = set(row["Required Skills"].split(", "))
        similarity = len(input_skills_set.intersection(required_skills_set)) / len(required_skills_set)
        similarity_scores.append(similarity)

    # Add similarity scores to the DataFrame
    field_career_data = field_career_data.copy()  # Ensure we're working with a copy
    field_career_data.loc[:, "Similarity"] = similarity_scores

    # Remove duplicate career paths
    field_career_data = field_career_data.drop_duplicates(subset=["Career Path"])

    # Sort by similarity and get top 3 career paths
    top_3_career_paths = field_career_data.sort_values(by="Similarity", ascending=False).head(3)

    # Prepare output
    recommended_career_paths = top_3_career_paths["Career Path"].tolist()
    required_skills = top_3_career_paths["Required Skills"].tolist()
    confidence_percentages = [round(similarity * 100, 2) for similarity in top_3_career_paths["Similarity"]]

    # Identify lacking skills and recommend training
    lacking_skills_list = []
    training_recommendations_list = []

    for i, (career_path, req_skills) in enumerate(zip(recommended_career_paths, required_skills)):
        req_skills_set = set(req_skills.split(", "))
        lacking_skills = req_skills_set - input_skills_set
        # Convert the set to a list for JSON serialization
        lacking_skills_list.append(list(lacking_skills))

        # Recommend training for lacking skills
        training_recommendations = []
        for skill in lacking_skills:
            # Example: Use a predefined mapping of skills to training programs
            training_mapping = {
                "Python": "Python for Beginners (Coursera)",
                "SQL": "SQL Bootcamp (Udemy)",
                "Java": "Java Programming Masterclass (Udemy)",
                "Node.js": "Node.js Developer Course (Pluralsight)",
                "Machine Learning": "Machine Learning by Andrew Ng (Coursera)",
                "React.js": "React - The Complete Guide (Udemy)",
                "Data Science": "Data Science Specialization (Coursera)",
                "Cybersecurity": "Cybersecurity Fundamentals (edX)",
                "Cloud Computing": "AWS Certified Solutions Architect (Udemy)",
                "DevOps": "DevOps Engineer Nanodegree (Udacity)",
                # Add more mappings as needed
            }
            if skill in training_mapping:
                training_recommendations.append(training_mapping[skill])
            else:
                training_recommendations.append(f"Training for {skill} (Check online platforms like Coursera, Udemy, or edX)")

        training_recommendations_list.append(training_recommendations)

    return {
        "Recommended Field": predicted_field,
        "Field Confidence": round(confidence_percentage, 2),  # Confidence for the predicted field
        "Top 3 Career Paths": recommended_career_paths,
        "Required Skills": required_skills,
        "Confidence Percentages": confidence_percentages,  # Confidence for each career path
        "Lacking Skills": lacking_skills_list,  # Lacking skills for each career path
        "Training Recommendations": training_recommendations_list  # Training recommendations for lacking skills
    }

def recommend_career_from_resume(file_path, user_id=None):
    """
    Recommends a field, top 3 career paths, required skills, lacking skills, and training recommendations based on the skills and experience in a resume.

    Args:
        file_path (str): Path to the resume file.
        user_id (str, optional): User ID for personalized recommendations.

    Returns:
        tuple: A tuple containing (recommendations, skills, experience)
    """
    # Parse the resume
    resume_data = parse_resume(file_path)

    # Extract skills and experiences
    skills = resume_data["Skills"]
    experiences = resume_data["Experiences"]

    # Calculate total experience
    total_experience = calculate_total_experience(experiences)
    experience_str = f"{int(total_experience)}+ years"  # Format experience as "X+ years"

    # Get recommendations
    recommendations = recommend_field_and_career_paths(", ".join(skills), experience_str, user_id)

    return recommendations, ", ".join(skills), experience_str 