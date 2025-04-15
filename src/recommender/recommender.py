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
import random

# Import utilities
from utils.data_processing import parse_resume, calculate_total_experience
from utils.feedback_handler import load_feedback_db, get_user_feedback
from utils.model_trainer import predict_field, predict_specialization, identify_missing_skills

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
    },
    "Marketing": {
        "roles": [
            "Digital Marketing Specialist", "Brand Manager", "Market Research Analyst",
            "Content Strategist", "Public Relations Manager", "SEO Specialist", 
            "Social Media Manager"
        ],
        "skills": [
            "Social Media Marketing", "Search Engine Optimization (SEO)", "Content Marketing",
            "Data Analytics", "Email Marketing", "Paid Advertising", "Google Analytics",
            "Consumer Behavior", "Brand Management", "Marketing Automation", "Market Research",
            "Competitor Analysis", "Product Positioning", "Campaign Management", "Brand Strategy",
            "Creative Direction", "Public Relations", "Consumer Psychology", "Visual Communications",
            "Presentation Skills", "Survey Design", "Statistical Analysis", "Qualitative Research",
            "Focus Group Moderation", "Consumer Insights", "Trend Analysis", "Demographic Profiling",
            "Predictive Modeling", "Data Visualization", "Content Planning", "Copywriting"
        ]
    },
    "Education": {
        "roles": [
            "Elementary School Teacher", "College Professor", "Educational Administrator",
            "Special Education Teacher", "Educational Technologist"
        ],
        "skills": [
            "Curriculum Development", "Classroom Management", "Child Psychology", 
            "Lesson Planning", "Educational Technology", "Special Education", 
            "Assessment Methods", "Differentiated Instruction", "Student Engagement", 
            "Parental Communication", "Course Design", "Student Advising", 
            "Scholarly Research", "Grant Writing", "Academic Publishing", 
            "Lecture Preparation", "Assessment Design", "Educational Leadership", 
            "Mentoring", "Professional Networking", "School Operations", 
            "Educational Policy", "Staff Management", "Budget Administration", 
            "Community Relations", "Curriculum Oversight", "Strategic Planning", 
            "Conflict Resolution", "Performance Evaluation", "Regulatory Compliance",
            "Critical Thinking", "Patience", "Communication", "Organization", 
            "Imaginative Thinking", "Leadership", "Teamwork", "Time Management", 
            "Computer Skills", "Problem Solving", "Creativity", "Adaptability",
            "Emotional Intelligence", "Active Listening", "Presentation Skills"
        ]
    },
    "Finance": {
        "roles": [
            "Investment Banker", "Portfolio Manager", "Risk Manager",
            "Financial Advisor", "Hedge Fund Analyst"
        ],
        "skills": [
            "Financial Modeling", "Valuation", "Mergers & Acquisitions", 
            "Capital Markets", "Excel Proficiency", "Pitch Book Creation", 
            "Due Diligence", "Financial Statement Analysis", "Deal Structuring", 
            "Client Relationship Management", "Asset Allocation", "Risk Management", 
            "Market Analysis", "Performance Attribution", "Investment Strategy", 
            "Client Communication", "Financial Research", "Portfolio Construction", 
            "Regulatory Compliance", "Alternative Investments", "Credit Risk Analysis", 
            "Market Risk Assessment", "Operational Risk", "VaR Calculations", 
            "Stress Testing", "Risk Modeling", "Hedging Strategies", 
            "Regulatory Reporting", "Enterprise Risk Management", "Retirement Planning"
        ]
    },
    "Arts & Design": {
        "roles": [
            "Graphic Designer", "Interior Designer", "UX/UI Designer",
            "Fashion Designer", "Animator"
        ],
        "skills": [
            "Adobe Creative Suite", "Typography", "Brand Identity", 
            "Layout Design", "Color Theory", "Print Design", 
            "Digital Media", "Visual Communication", "User Interface Design", 
            "Design Thinking", "Space Planning", "CAD Software", 
            "Material Selection", "Color Schemes", "Lighting Design", 
            "Furniture Design", "Client Presentations", "Project Management", 
            "Sustainable Design", "Architectural Elements", "User Research", 
            "Wireframing", "Prototyping", "Interaction Design", 
            "Usability Testing", "Information Architecture", "Responsive Design", 
            "Design Systems", "Visual Design", "User Journey Mapping"
        ]
    },
    "Hospitality": {
        "roles": [
            "Hotel Manager", "Executive Chef", "Event Planner"
        ],
        "skills": [
            "Staff Management", "Budget Administration", "Customer Service", 
            "Operations Management", "Revenue Management", "Marketing Strategy", 
            "Event Coordination", "Food & Beverage Knowledge", "Crisis Management", 
            "Facilities Maintenance", "Menu Development", "Kitchen Management", 
            "Food Cost Control", "Culinary Techniques", "Inventory Management", 
            "Staff Training", "Food Safety", "Plating & Presentation", 
            "Supplier Relations", "Recipe Development", "Vendor Management", 
            "Budget Planning", "Logistics Coordination", "Client Communication", 
            "Marketing & Promotion", "Contract Negotiation", "Problem Solving", 
            "Design & Decor", "Timeline Creation", "Risk Management"
        ]
    },
    "Information Technology": {
        "roles": [
            "IT Support Specialist", "Product Manager", "Quality Assurance Analyst"
        ],
        "skills": [
            "Troubleshooting", "Network Administration", "Hardware Maintenance", 
            "Operating Systems", "User Support", "Technical Documentation", 
            "Software Installation", "Security Compliance", "Remote Assistance", 
            "System Updates", "Product Strategy", "Market Analysis", 
            "User Stories", "Agile Methodologies", "Backlog Management", 
            "Stakeholder Communication", "Product Roadmapping", "Requirements Gathering", 
            "Prioritization", "Product Metrics", "Test Case Development", 
            "Bug Tracking", "Regression Testing", "Automated Testing", 
            "Test Planning", "User Acceptance Testing", "Performance Testing", 
            "Quality Metrics", "Test Environments", "Documentation"
        ]
    },
    "Media & Communications": {
        "roles": [
            "Technical Writer", "Journalist", "Public Speaker"
        ],
        "skills": [
            "Documentation Planning", "Content Management", "API Documentation", 
            "User Guide Creation", "Information Architecture", "Style Guides", 
            "Technical Editing", "Content Strategy", "Research Skills", 
            "Information Design", "Investigative Reporting", "Interview Techniques", 
            "News Writing", "Fact-checking", "Media Ethics", 
            "Multimedia Storytelling", "Source Development", "Editing", 
            "Deadline Management", "Social Media", "Presentation Skills", 
            "Audience Engagement", "Speech Writing", "Storytelling", 
            "Voice Projection", "Visual Aids", "Stage Presence", 
            "Topic Research", "Persuasive Communication", "Improvisational Speaking"
        ]
    },
    "Environmental Sciences": {
        "roles": [
            "Environmental Scientist", "Sustainability Consultant", "Conservation Biologist",
            "Marine Biologist", "Urban Planner"
        ],
        "skills": [
            "Field Research", "Data Analysis", "Environmental Sampling", 
            "GIS Mapping", "Regulatory Compliance", "Report Writing", 
            "Ecological Assessment", "Impact Analysis", "Remediation Planning", 
            "Sustainability", "Carbon Footprint Analysis", "Environmental Auditing", 
            "Green Building Standards", "Renewable Energy", "Waste Management", 
            "Corporate Sustainability", "Environmental Policy", "Stakeholder Engagement", 
            "Climate Risk Assessment", "Circular Economy", "Wildlife Management", 
            "Habitat Assessment", "Biodiversity Monitoring", "Species Identification", 
            "Conservation Planning", "Grant Writing", "Data Collection", 
            "Population Dynamics", "Ecological Restoration", "Research Design"
        ]
    },
    "Construction & Trades": {
        "roles": [
            "General Contractor", "Electrician", "Plumber", "Carpenter",
            "Construction Manager", "HVAC Technician", "Welder",
            "Landscaper", "Roofer", "Painter", "Mason",
            "Building Inspector", "Concrete Specialist", "Glazier",
            "Flooring Installer", "Drywall Installer"
        ],
        "skills": [
            "Blueprint Reading", "Building Codes", "Permit Processing", 
            "Safety Procedures", "Project Scheduling", "Cost Estimation", 
            "Equipment Operation", "Electrical Wiring", "Plumbing Systems", 
            "Carpentry", "Masonry", "Welding", "HVAC Installation", 
            "Roofing", "Concrete Work", "Flooring Installation", 
            "Drywall Installation", "Painting Techniques", "Quality Control", 
            "Construction Mathematics", "Technical Drawing", "Power Tools",
            "Material Selection", "Site Preparation", "Framing", 
            "Finishing Work", "Renovation", "Restoration",
            "Preventative Maintenance", "Problem Diagnosis"
        ]
    },
    "Public Service & Government": {
        "roles": [
            "City Manager", "Policy Analyst", "Urban Planner",
            "Public Administrator", "Foreign Service Officer", "Legislator",
            "Government Affairs Specialist", "Economic Development Director",
            "Public Health Director", "Parks and Recreation Director",
            "Transportation Planner", "Housing Coordinator", "Budget Analyst",
            "Emergency Management Director", "Environmental Policy Analyst"
        ],
        "skills": [
            "Public Policy", "Government Relations", "Regulatory Compliance", 
            "Stakeholder Engagement", "Legislative Process", "Policy Analysis", 
            "Program Evaluation", "Public Speaking", "Grant Management", 
            "Budget Administration", "Community Outreach", "Strategic Planning", 
            "Economic Development", "Public Health Administration", "Urban Planning", 
            "Environmental Policy", "Crisis Management", "Intergovernmental Relations", 
            "Public-Private Partnerships", "Social Services Administration", 
            "Ethics and Transparency", "Policy Implementation", "Demographic Analysis",
            "Public Finance", "Constitutional Law", "Diplomacy", "Political Analysis",
            "Electoral Systems", "Administrative Law", "Public Service Ethics"
        ]
    },
    "Sports & Recreation": {
        "roles": [
            "Athletic Director", "Sports Coach", "Personal Trainer",
            "Sports Psychologist", "Physical Education Teacher", "Sports Nutritionist",
            "Recreation Manager", "Fitness Instructor", "Sports Therapist",
            "Professional Athlete", "Sports Scout", "Sports Agent",
            "Sports Event Coordinator", "Outdoor Guide", "Sports Journalist"
        ],
        "skills": [
            "Athletic Training", "Team Leadership", "Sports Psychology", 
            "Exercise Physiology", "Strength and Conditioning", "Nutrition Planning", 
            "Game Strategy", "Sports Medicine", "Injury Prevention", 
            "Sports Rehabilitation", "Group Instruction", "Motivational Techniques", 
            "Fitness Assessment", "Program Development", "Sports Administration", 
            "Event Management", "Facility Management", "Equipment Maintenance", 
            "Safety Protocols", "First Aid/CPR", "Competition Planning", 
            "Performance Analysis", "Sports Officiating", "Recreation Programming",
            "Outdoor Leadership", "Risk Management", "Biomechanics",
            "Training Program Design", "Sports Marketing", "Team Building"
        ]
    },
    "Culinary Arts & Food Service": {
        "roles": [
            "Executive Chef", "Pastry Chef", "Sous Chef", "Restaurant Manager",
            "Food and Beverage Director", "Sommelier", "Nutritionist",
            "Catering Manager", "Food Stylist", "Recipe Developer",
            "Food Writer", "Culinary Instructor", "Butcher",
            "Barista", "Bartender", "Brewery Manager"
        ],
        "skills": [
            "Menu Planning", "Food Preparation", "Culinary Techniques", 
            "Recipe Development", "Food Safety", "Kitchen Management", 
            "Inventory Control", "Cost Management", "Wine Knowledge", 
            "Food Presentation", "Baking", "Pastry Making", 
            "Dietary Requirements", "Nutrition Analysis", "Flavor Pairing", 
            "Ingredient Sourcing", "Staff Training", "Customer Service", 
            "Event Catering", "Restaurant Operations", "Cultural Cuisines", 
            "Food Photography", "Beverage Service", "Mixology",
            "Coffee Preparation", "Sustainable Cooking", "Meal Planning",
            "Portion Control", "Equipment Maintenance", "Food Trends"
        ]
    },
    "Transportation & Logistics": {
        "roles": [
            "Logistics Manager", "Supply Chain Analyst", "Fleet Manager",
            "Transportation Planner", "Warehouse Manager", "Distribution Director",
            "Freight Forwarder", "Procurement Specialist", "Inventory Manager",
            "Shipping Coordinator", "Customs Broker", "Air Traffic Controller",
            "Railway Operations Manager", "Port Manager", "Commercial Pilot"
        ],
        "skills": [
            "Supply Chain Management", "Logistics Planning", "Inventory Control", 
            "Warehouse Operations", "Transportation Management", "Freight Forwarding", 
            "Customs Clearance", "Procurement", "Vendor Management", 
            "Distribution Planning", "Shipping Coordination", "Route Optimization", 
            "Fleet Management", "Import/Export Procedures", "International Logistics", 
            "Demand Planning", "Order Fulfillment", "Inventory Forecasting", 
            "Logistics Software", "Regulatory Compliance", "Cross-docking", 
            "Material Handling", "Cold Chain Management", "Just-in-Time Delivery",
            "Reverse Logistics", "Load Planning", "Freight Negotiation",
            "GPS Tracking", "Hazardous Materials Handling", "Last Mile Delivery"
        ]
    },
    "Fashion & Beauty": {
        "roles": [
            "Fashion Designer", "Fashion Merchandiser", "Textile Designer",
            "Fashion Buyer", "Stylist", "Makeup Artist", "Esthetician",
            "Hair Stylist", "Cosmetic Chemist", "Beauty Editor",
            "Fashion Photographer", "Fashion Marketing Manager", "Costume Designer",
            "Runway Producer", "Visual Merchandiser", "Brand Ambassador"
        ],
        "skills": [
            "Fashion Design", "Pattern Making", "Garment Construction", 
            "Textile Knowledge", "Color Theory", "Fashion Illustration", 
            "Trend Forecasting", "Fashion Photography", "Styling", 
            "Makeup Application", "Skincare Knowledge", "Hair Styling", 
            "Fashion Marketing", "Visual Merchandising", "Collection Development", 
            "Fashion Show Production", "Retail Buying", "Brand Management", 
            "Costume Design", "Sustainable Fashion", "Product Development", 
            "Quality Control", "CAD for Fashion", "Fashion Writing",
            "Beauty Product Knowledge", "Client Consultation", "Fashion History",
            "Retail Operations", "Cosmetic Formulation", "Fashion Curation"
        ]
    },
    "Real Estate & Property Management": {
        "roles": [
            "Real Estate Agent", "Property Manager", "Real Estate Appraiser",
            "Mortgage Loan Officer", "Real Estate Developer", "Commercial Leasing Agent",
            "Real Estate Attorney", "Real Estate Broker", "Home Inspector",
            "Facilities Manager", "Property Assessor", "Real Estate Investor",
            "Land Developer", "Real Estate Marketing Specialist", "Escrow Officer"
        ],
        "skills": [
            "Property Valuation", "Real Estate Law", "Contract Negotiation", 
            "Property Management", "Market Analysis", "Client Relations", 
            "Property Inspection", "Mortgage Financing", "Building Maintenance", 
            "Tenant Relations", "Lease Administration", "Real Estate Investment", 
            "Property Marketing", "Sales Strategies", "Property Development", 
            "Zoning Regulations", "Title Research", "Property Insurance", 
            "Construction Management", "Closing Procedures", "Property Tax Assessment", 
            "Real Estate Technology", "Land Use Planning", "Commercial Leasing",
            "Real Estate Networking", "Escrow Management", "Vendor Management",
            "Property Portfolio Analysis", "Environmental Regulations", "Property Acquisition"
        ]
    },
    "Agriculture & Farming": {
        "roles": [
            "Farm Manager", "Agricultural Scientist", "Crop Specialist",
            "Livestock Manager", "Agronomist", "Agricultural Engineer",
            "Soil Scientist", "Horticulturist", "Precision Agriculture Technician",
            "Organic Farmer", "Agricultural Economist", "Greenhouse Manager",
            "Aquaculture Specialist", "Agricultural Consultant", "Viticulturist"
        ],
        "skills": [
            "Crop Management", "Livestock Husbandry", "Soil Analysis", 
            "Irrigation Systems", "Pest Management", "Fertilization Techniques", 
            "Harvest Planning", "Farm Equipment Operation", "Agricultural Economics", 
            "Sustainable Farming", "Organic Farming Practices", "Animal Health", 
            "Plant Pathology", "Seed Selection", "Breeding Techniques", 
            "Agricultural Technology", "Greenhouse Management", "Weather Analysis", 
            "Water Conservation", "Precision Agriculture", "Farm Financial Management", 
            "Agricultural Policy", "Crop Rotation", "Composting",
            "Land Conservation", "Agribusiness Management", "Food Safety Protocols",
            "Supply Chain Management", "Grant Writing", "Community Supported Agriculture"
        ]
    },
    "Telecommunications": {
        "roles": [
            "Network Engineer", "Telecommunications Manager", "RF Engineer",
            "Telecom Project Manager", "Fiber Optic Technician", "Wireless Communications Specialist",
            "VoIP Engineer", "Telecommunications Analyst", "Satellite Communications Engineer",
            "Telecommunications Consultant", "Network Operations Center Technician", "Cell Tower Technician",
            "Data Communications Analyst", "Telecommunications Sales Representative", "Broadband Technician"
        ],
        "skills": [
            "Network Architecture", "Telecommunications Infrastructure", "Wireless Communications", 
            "Fiber Optics", "VoIP Systems", "Radio Frequency Engineering", 
            "Broadband Technology", "Satellite Communications", "Network Security", 
            "Telecommunications Protocols", "Circuit Design", "Signal Processing", 
            "Network Troubleshooting", "Telecommunications Regulations", "Cable Installation", 
            "Mobile Technologies", "Microwave Communications", "Data Transmission", 
            "IP Networking", "PBX Systems", "Telecom Project Management", 
            "5G Technology", "Network Performance Analysis", "Network Monitoring",
            "Telecommunications Software", "IPv6", "Cloud Communications",
            "Infrastructure Maintenance", "Telecommunications Testing", "Bandwidth Management"
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
        model_components = joblib.load(MODEL_PATH)
        
        # Check if model_components is a dictionary with the expected structure
        if isinstance(model_components, dict) and "model" in model_components:
            print("Loading model from components dictionary...")
            model = model_components["model"]
            tfidf = model_components["tfidf"]
            pca = model_components["pca"]
            label_encoder = model_components["label_encoder"]
        else:
            # Legacy format - model directly saved
            print("Loading model from legacy format...")
            model = model_components
            
            # Recreate the preprocessing components
            from sklearn.preprocessing import LabelEncoder
            label_encoder = LabelEncoder()
            tfidf = TfidfVectorizer(max_features=100)
        
        # Load datasets
        employee_data = pd.read_csv(EMPLOYEE_DATA_PATH)
        career_path_data = pd.read_csv(CAREER_PATH_DATA_PATH)
        
        # If tfidf needs to be fit
        if not hasattr(tfidf, 'vocabulary_'):
            print("Fitting TF-IDF vectorizer...")
            X_skills = tfidf.fit_transform(employee_data["Skills"])
        
        # If label_encoder needs to be fit
        if not hasattr(label_encoder, 'classes_'):
            print("Fitting label encoder...")
            employee_data["Field"] = employee_data["Career Goal"].map(
                {goal: field for field, goals in career_fields.items() for goal in goals["roles"]}
            )
            label_encoder.fit(employee_data["Field"])
        
        # If pca needs to be initialized
        if pca is None:
            print("Initializing PCA...")
            X_skills = tfidf.transform(employee_data["Skills"])
            X = pd.concat([pd.DataFrame(X_skills.toarray()), 
                          employee_data["Experience"].str.extract("(\d+)").astype(float)], axis=1)
            pca = PCA(n_components=min(38, X.shape[1]))
            pca.fit(X)
        
        print("Model and data loaded successfully")
        return True
    except Exception as e:
        print(f"Error loading model and data: {e}")
        import traceback
        traceback.print_exc()
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
        if user_id in feedback_db.get("improved_recommendations", {}):
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
    # Ensure skills is a string
    if not isinstance(skills, str):
        skills = ", ".join(skills) if isinstance(skills, list) else str(skills)
    
    # Handle potentially empty skills
    if not skills.strip():
        skills = "none"
    
    skills_tfidf = tfidf.transform([skills])

    # Convert experience to numerical value with better error handling
    try:
        # Remove "+" and "years" for consistent extraction
        exp_value = experience.replace("+", "").replace("years", "").strip()
        # Convert to numeric
        experience_num = float(exp_value)
    except (ValueError, TypeError, AttributeError):
        # Default to 0 if conversion fails
        print(f"Warning: Could not parse experience value '{experience}', using 0 as default")
        experience_num = 0.0

    # Create feature DataFrame with proper column names
    X_skills_array = skills_tfidf.toarray()
    X_skills_df = pd.DataFrame(X_skills_array)
    
    # Use consistent feature naming for skills columns
    X_skills_df.columns = [f'skill_{i}' for i in range(X_skills_df.shape[1])]
    
    # Use only skills features without adding experience
    X_input = X_skills_df.copy()
    
    # Check for and handle NaN values
    if X_input.isna().any().any():
        print(f"Warning: Found {X_input.isna().sum().sum()} NaN values in input features, filling with 0")
        X_input.fillna(0, inplace=True)
    
    # Apply PCA transformation
    try:
        X_input_pca = pca.transform(X_input)
    except Exception as e:
        print(f"Warning: Error during PCA transformation: {e}")
        print("Using original features without PCA")
        # If PCA fails, use the original features directly
        X_input_pca = X_input.values
    
    # Predict field and get probabilities
    try:
        # Try standard predict_proba method first
        y_pred_proba = model.predict_proba(X_input_pca)
        predicted_field_index = np.argmax(y_pred_proba)
        confidence_percentage = y_pred_proba[0][predicted_field_index] * 100
    except (AttributeError, TypeError) as e:
        print(f"Warning: Could not use predict_proba: {e}")
        # Fallback to regular predict
        try:
            predicted_field_index = model.predict(X_input_pca)[0]
            confidence_percentage = 90.0  # Default high confidence
        except Exception as e2:
            print(f"Error in prediction: {e2}")
            # Last resort fallback - pick a random field
            predicted_field_index = random.randint(0, len(career_fields) - 1)
            confidence_percentage = 70.0  # Lower confidence for random
    
    # Get field name
    try:
        predicted_field = label_encoder.inverse_transform([predicted_field_index])[0]
    except Exception:
        # Fallback if label_encoder fails
        predicted_field = list(career_fields.keys())[predicted_field_index]

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

def recommend_career_path(skills_str, model_path=MODEL_PATH):
    """
    Complete three-stage career recommendation:
    1. Recommend field with confidence score
    2. Recommend specialization with confidence score
    3. Identify missing skills with importance levels
    """
    # Load model components
    components = joblib.load(model_path)
    
    # Stage 1: Field Recommendation with confidence
    field, field_confidence = predict_field(skills_str, components)
    
    # Stage 2: Specialization Recommendation using field context
    specialization, spec_confidence = predict_specialization(skills_str, field, components)
    
    # Stage 3: Skill Gap Analysis with importance weighting
    missing_skills = identify_missing_skills(skills_str, specialization, components)
    
    # Get user's existing skills
    user_skills = [skill.strip() for skill in skills_str.split(',')]
    
    return {
        'recommended_field': field,
        'field_confidence': round(field_confidence * 100, 2),
        'recommended_specialization': specialization,
        'specialization_confidence': round(spec_confidence * 100, 2),
        'missing_skills': list(missing_skills),
        'existing_skills': user_skills,
        'model_version': components.get('version', '1.0')
    } 