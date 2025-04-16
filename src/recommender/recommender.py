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
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier

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
    """Load the trained model and data files."""
    try:
        # Load employee data
        print("Loading employee data...")
        employee_data = pd.read_csv(EMPLOYEE_DATA_PATH)
        print(f"Successfully loaded {len(employee_data)} records")
        print("Columns:", ", ".join(employee_data.columns))
        
        # Load career path data
        print("\nLoading career path data...")
        career_path_data = pd.read_csv(CAREER_PATH_DATA_PATH)
        print(f"Successfully loaded {len(career_path_data)} career path records")
        print("Career path columns:", ", ".join(career_path_data.columns))
        
        # Fine-tune specialization to field mappings
        print("\nFine-tuning specialization to field mappings...")
        specialization_to_field = dict(zip(career_path_data['Specialization'], career_path_data['Field']))
        print(f"Example mapping - '{list(specialization_to_field.keys())[0]}' is mapped to field: {list(specialization_to_field.values())[0]}")
        
        # Prepare training data
        print(f"\nTraining with {len(employee_data)} valid employee records")
        print("\nSample data:")
        print(employee_data[['Skills', 'Field', 'Specialization']].head(2))
        
        # Extract features and labels
        X = employee_data['Skills'].fillna('')
        y_field = employee_data['Field'].fillna('')
        y_specialization = employee_data['Specialization'].fillna('')
        
        # Create TF-IDF vectorizer
        print("\nFitting TF-IDF vectorizer...")
        vectorizer = TfidfVectorizer(max_features=150)
        X_tfidf = vectorizer.fit_transform(X)
        
        # Add years of experience as a feature
        X_exp = employee_data['Years Experience'].fillna(0).astype(float).values.reshape(-1, 1)
        X_combined = np.hstack([X_tfidf.toarray(), X_exp])
        
        # Create label encoders
        print("Fitting label encoder...")
        field_encoder = LabelEncoder()
        field_encoder.fit(y_field)
        
        specialization_encoder = LabelEncoder()
        specialization_encoder.fit(y_specialization)
        
        # Apply PCA for dimensionality reduction
        print("Initializing PCA...")
        pca = PCA(n_components=50)
        X_pca = pca.fit_transform(X_combined)
        explained_var = sum(pca.explained_variance_ratio_) * 100
        print(f"PCA reduced dimensions to {pca.n_components_} components, explaining {explained_var:.2f}% of variance")
        
        # Train field recommendation model
        print("\n=== Training Field Recommendation Model ===")
        print(f"Field training data shape: {len(X)} samples with {len(field_encoder.classes_)} unique fields")
        field_model = RandomForestClassifier(n_estimators=100, random_state=42)
        field_scores = cross_val_score(field_model, X_pca, field_encoder.transform(y_field), cv=5)
        print(f"Field model cross-validation score: {field_scores.mean():.4f}")
        
        print("Starting enhanced model training...")
        field_model.fit(X_pca, field_encoder.transform(y_field))
        
        # Train specialization recommendation model
        print("\n=== Training Specialization Recommendation Model ===")
        print(f"Specialization training data shape: {len(X)} samples with {len(specialization_encoder.classes_)} unique specializations")
        specialization_model = RandomForestClassifier(
            n_estimators=100,
            class_weight='balanced',
            random_state=42
        )
        specialization_scores = cross_val_score(specialization_model, X_pca, specialization_encoder.transform(y_specialization), cv=5)
        print(f"Specialization model cross-validation score: {specialization_scores.mean():.4f}")
        
        print("Starting enhanced model training...")
        if len(specialization_encoder.classes_) > 1:
            print("Imbalanced classes detected, using balanced class weights")
        specialization_model.fit(X_pca, specialization_encoder.transform(y_specialization))
        
        # Create skill profiles for each specialization
        print("\n=== Preparing Skill Gap Analysis ===")
        skill_profiles = {}
        for specialization in specialization_encoder.classes_:
            # Get all employees with this specialization
            spec_employees = employee_data[employee_data['Specialization'] == specialization]
            if len(spec_employees) > 0:
                # Get all skills for this specialization
                all_skills = []
                for skills_str in spec_employees['Skills'].fillna(''):
                    skills = [s.strip() for s in skills_str.split(',')]
                    all_skills.extend(skills)
                
                # Count skill frequencies
                skill_counts = {}
                for skill in all_skills:
                    if skill:  # Skip empty skills
                        skill_counts[skill] = skill_counts.get(skill, 0) + 1
                
                # Convert to weighted profile
                total = sum(skill_counts.values())
                weighted_skills = [(skill, count/total) for skill, count in skill_counts.items()]
                weighted_skills.sort(key=lambda x: x[1], reverse=True)
                
                skill_profiles[specialization] = weighted_skills
        
        print(f"Created weighted skill profiles for {len(skill_profiles)} specializations")
        example_spec = list(skill_profiles.keys())[0]
        print(f"Example for '{example_spec}': {skill_profiles[example_spec][:3]}")
        
        # Save the model and related data
        model_data = {
            'vectorizer': vectorizer,
            'pca': pca,
            'field_model': field_model,
            'field_encoder': field_encoder,
            'specialization_model': specialization_model,
            'specialization_encoder': specialization_encoder,
            'skill_profiles': skill_profiles,
            'specialization_to_field': specialization_to_field
        }
        
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(model_data, MODEL_PATH)
        print(f"\nEnhanced model saved to {MODEL_PATH}")
        
        return model_data
        
    except Exception as e:
        print(f"Error loading model and data: {str(e)}")
        return None

def recommend_field_and_career_paths(skills, experience, user_id=None):
    """
    Recommends fields and career paths based on a user's skills and experience.
    
    Args:
        skills (list): List of skills
        experience (int): Years of experience
        user_id (str, optional): User ID for personalization
        
    Returns:
        dict: Dictionary containing field probabilities, specialization recommendations,
              skill gaps, and other career path information
    """
    # Load model
    model_path = os.path.join(os.path.dirname(__file__), "models", "career_path_recommendation_model.pkl")
    if not os.path.exists(model_path):
        model_path = MODEL_PATH
    
    model_data = joblib.load(model_path)
    
    # Extract model components
    field_model = model_data['field_model']
    field_encoder = model_data['field_encoder']
    field_pca = model_data['field_pca']
    specialization_model = model_data['specialization_model']
    specialization_encoder = model_data['specialization_encoder']
    specialization_to_field = model_data['specialization_to_field']
    
    # Get vectorizers - check for both old and new naming conventions
    if 'field_vectorizer' in model_data:
        field_vectorizer = model_data['field_vectorizer']
    elif 'field_tfidf' in model_data:
        field_vectorizer = model_data['field_tfidf']
    else:
        # Create a basic TF-IDF vectorizer as fallback
        field_vectorizer = TfidfVectorizer(max_features=1000)
        print("Warning: No field vectorizer found in model data")
        
    if 'specialization_vectorizer' in model_data:
        specialization_vectorizer = model_data['specialization_vectorizer']
    elif 'specialization_tfidf' in model_data:
        specialization_vectorizer = model_data['specialization_tfidf']
    else:
        # Create a basic TF-IDF vectorizer as fallback
        specialization_vectorizer = TfidfVectorizer(max_features=1000)
        print("Warning: No specialization vectorizer found in model data")
    
    # Get PCA components
    if 'specialization_pca' in model_data:
        specialization_pca = model_data['specialization_pca']
    else:
        print("Warning: No specialization PCA found in model data")
        # Will handle this case later
    
    # Get experience scaler if available (for enhanced model)
    experience_scaler = model_data.get('specialization_experience_scaler')
    
    # Get skill profiles if available
    specialization_skill_profiles = model_data.get('specialization_skill_profiles', {})
    
    # Join skills into a string for vectorization
    skills_str = ', '.join(skills)
    
    # Add experience as a feature
    exp_feature = np.array([[float(experience)]])
    
    #--------------------------
    # Field prediction process
    #--------------------------
    # Transform skills using field vectorizer
    try:
        # Try using the field vectorizer
        X_field = field_vectorizer.transform([skills_str]).toarray()
    except Exception as e:
        print(f"Error transforming skills with field vectorizer: {e}")
        # If it fails, create a simple feature
        X_field = np.zeros((1, 300))  # Assuming 300 features
    
    # Apply field PCA if possible
    try:
        if field_pca:
            # First combine with experience
            X_field_exp = np.hstack([X_field, exp_feature])
            X_field_pca = field_pca.transform(X_field_exp)
            
            # Now we can use this for prediction
            field_probas = field_model.predict_proba(X_field_pca)[0]
        else:
            # Fallback without PCA
            field_probas = field_model.predict_proba(np.hstack([X_field, exp_feature]))[0]
    except Exception as e:
        print(f"Error predicting field probabilities: {e}")
        # Return simple result
        return {
            "error": f"Error predicting field: {str(e)}",
            "field_probabilities": {"Unknown": 1.0},
            "specialization_recommendations": {"Unknown": 1.0}
        }
    
    # Get top fields with probabilities
    field_indices = np.argsort(field_probas)[::-1]
    field_results = {}
    for idx in field_indices[:5]:  # Get top 5 fields
        field_name = field_encoder.inverse_transform([idx])[0]
        field_results[field_name] = float(field_probas[idx])
    
    #--------------------------
    # Specialization prediction process
    #--------------------------
    # For simplicity, let's use a different approach for specialization prediction
    # We'll try to find specializations that match the top fields
    
    # Default fallback in case prediction fails
    spec_results = {"Unknown": 1.0}
    
    # Try to map fields to specializations
    field_to_spec = {}
    for spec, field in specialization_to_field.items():
        if field not in field_to_spec:
            field_to_spec[field] = []
        field_to_spec[field].append(spec)
    
    # Get specializations from top fields
    suggested_specs = []
    for field in field_results.keys():
        if field in field_to_spec:
            suggested_specs.extend(field_to_spec[field])
    
    if suggested_specs:
        # Calculate a simple match score based on skills matching
        spec_scores = {}
        user_skills_set = set(skill.lower() for skill in skills)
        
        for spec in suggested_specs:
            score = 0
            if spec in specialization_skill_profiles:
                spec_skills = specialization_skill_profiles[spec]
                common_skills = 0
                total_skills = 0
                
                for skill, weight in spec_skills.items():
                    total_skills += 1
                    if skill.lower() in user_skills_set:
                        common_skills += 1
                        score += float(weight)
                
                if total_skills > 0:
                    # Boost score for specializations that match many user skills
                    score *= (common_skills / total_skills) * 2
                    
                # Factor in field score for this specialization
                spec_field = specialization_to_field.get(spec)
                if spec_field in field_results:
                    score *= field_results[spec_field]
                    
                spec_scores[spec] = score
        
        # Normalize scores
        if spec_scores:
            total_score = sum(spec_scores.values())
            if total_score > 0:
                spec_results = {spec: score/total_score for spec, score in spec_scores.items()}
            
            # Sort and get top 10
            spec_results = dict(sorted(spec_results.items(), key=lambda x: x[1], reverse=True)[:10])
    
    # Get skill gaps for each recommended specialization
    skill_gaps = {}
    user_skills_set = set(skill.lower() for skill in skills)
    
    for spec_name in list(spec_results.keys())[:5]:  # Get skill gaps for top 5 specializations
        if spec_name in specialization_skill_profiles:
            spec_skills = specialization_skill_profiles[spec_name]
            if isinstance(spec_skills, dict):
                # Sort by importance
                important_skills = sorted(spec_skills.items(), key=lambda x: x[1], reverse=True)
                missing_skills = []
                
                for skill, importance in important_skills[:20]:  # Check top 20 important skills
                    if skill.lower() not in user_skills_set:
                        missing_skills.append({"skill": skill, "importance": float(importance)})
                
                skill_gaps[spec_name] = missing_skills[:5]  # Return top 5 missing skills
        else:
            # If no skill profile, try to get required skills from specialization_to_field
            field = specialization_to_field.get(spec_name, None)
            if field in career_fields:
                field_skills = career_fields[field].get('skills', [])
                missing_skills = []
                for skill in field_skills:
                    if skill.lower() not in user_skills_set:
                        missing_skills.append({"skill": skill, "importance": 0.5})  # Default importance
                skill_gaps[spec_name] = missing_skills[:5]
            else:
                skill_gaps[spec_name] = []
    
    # Combine all results
    results = {
        'field_probabilities': field_results,
        'specialization_recommendations': spec_results,
        'skill_gaps': skill_gaps,
        'years_experience': experience
    }
    
    # Save user feedback data if user_id is provided
    if user_id:
        try:
            feedback_db = load_feedback_db()
            feedback_entry = {
                'user_id': user_id,
                'timestamp': pd.Timestamp.now(),
                'skills': skills,
                'experience': experience,
                'recommended_fields': list(field_results.keys()),
                'recommended_specializations': list(spec_results.keys())
            }
            feedback_db = feedback_db.append(feedback_entry, ignore_index=True)
            feedback_db.to_csv('data/user_feedback.csv', index=False)
        except Exception as e:
            print(f"Error saving feedback: {e}")
    
    return results

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
    recommendations = recommend_field_and_career_paths(skills, total_experience, user_id)

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