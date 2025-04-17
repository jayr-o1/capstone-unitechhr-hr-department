"""
Utility script to add or update specialization skills in the data file.
This can be run directly to add new specializations or update existing ones.
"""

import sys
import os
import json
from data_manager import add_specialization_skills, add_bulk_specializations, get_all_specializations

def main():
    """
    Main function for the specialization skills updater script.
    """
    # Handle command line arguments
    if len(sys.argv) < 2:
        print_usage()
        return
    
    command = sys.argv[1].lower()
    
    if command == "list":
        # List all current specializations
        specializations = get_all_specializations()
        if specializations:
            print("Current specializations in the data file:")
            for spec in sorted(specializations):
                print(f"- {spec}")
            print(f"\nTotal: {len(specializations)} specializations")
        else:
            print("No specializations found in the data file.")
    
    elif command == "add":
        if len(sys.argv) < 3:
            print("Error: Missing specialization name")
            print_usage()
            return
        
        specialization = sys.argv[2]
        
        # Interactive mode to enter skills
        print(f"Adding skills for: {specialization}")
        print("Enter skills one per line. Enter an empty line when done.")
        
        skills = []
        while True:
            skill = input("> ")
            if not skill:
                break
            skills.append(skill)
        
        if not skills:
            print("No skills entered. Operation cancelled.")
            return
        
        success = add_specialization_skills(specialization, skills)
        if success:
            print(f"Successfully added {len(skills)} skills for {specialization}")
        else:
            print("Failed to add skills. See error log for details.")
    
    elif command == "bulk":
        if len(sys.argv) < 3:
            print("Error: Missing JSON file path")
            print_usage()
            return
        
        json_file = sys.argv[2]
        if not os.path.exists(json_file):
            print(f"Error: File not found: {json_file}")
            return
        
        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
            
            if not isinstance(data, dict):
                print("Error: JSON file must contain a dictionary mapping specializations to skill lists")
                return
            
            success = add_bulk_specializations(data)
            if success:
                print(f"Successfully added/updated {len(data)} specializations")
            else:
                print("Failed to add specializations. See error log for details.")
        except json.JSONDecodeError:
            print("Error: Invalid JSON format in file")
        except Exception as e:
            print(f"Error: {str(e)}")
    
    elif command == "addnew":
        # Add a new set of specializations and skills
        new_specializations = {
            "Healthcare Administrator": [
                "Healthcare Management", "Health Policy", "Healthcare Finance", 
                "Medical Billing", "Healthcare Regulations", "HIPAA Compliance",
                "Hospital Operations", "Patient Care Management", "Healthcare IT",
                "Healthcare Quality Management", "Insurance Reimbursement",
                "Staff Management", "Healthcare Ethics", "Healthcare Analytics"
            ],
            "Clinical Nurse Specialist": [
                "Advanced Clinical Assessment", "Specialized Patient Care",
                "Medical Terminology", "Pharmacology", "Patient Education",
                "Care Coordination", "Clinical Documentation", "Treatment Planning",
                "Evidence-Based Practice", "Quality Improvement", "Healthcare Ethics",
                "Clinical Leadership", "Clinical Research", "Patient Advocacy"
            ],
            "Mechanical Engineer": [
                "CAD/CAM", "3D Modeling", "Thermodynamics", "Fluid Mechanics",
                "Materials Science", "Finite Element Analysis", "Manufacturing Processes",
                "Product Design", "Mechanical Design", "Prototyping", "GD&T",
                "SolidWorks", "AutoCAD", "HVAC", "Stress Analysis"
            ],
            "Civil Engineer": [
                "Structural Analysis", "Construction Management", "Infrastructure Design",
                "Geotechnical Engineering", "Transportation Engineering", "Environmental Engineering",
                "Project Management", "AutoCAD", "Building Codes", "Surveying",
                "Highway Design", "Structural Detailing", "Hydrology", "Urban Planning"
            ],
            "Financial Advisor": [
                "Financial Planning", "Retirement Planning", "Investment Management",
                "Tax Planning", "Estate Planning", "Insurance Planning", "Client Management",
                "Portfolio Analysis", "Risk Assessment", "Financial Regulations",
                "Wealth Management", "Financial Statement Analysis", "CFP", "CFA"
            ],
            "Human Resources Manager": [
                "Talent Acquisition", "Employee Relations", "Performance Management",
                "Compensation and Benefits", "Training and Development", "HR Policies",
                "HRIS", "Onboarding", "Succession Planning", "Conflict Resolution",
                "Employment Law", "HR Analytics", "HR Strategy", "Employee Engagement"
            ],
            "Supply Chain Manager": [
                "Inventory Management", "Logistics", "Procurement", "Supplier Management",
                "Warehouse Management", "Distribution Planning", "Demand Planning",
                "Supply Chain Analytics", "ERP Systems", "Contract Negotiation",
                "Cost Reduction", "Lean Six Sigma", "Import/Export", "Transportation Management"
            ],
            "Content Creator": [
                "Content Strategy", "Copywriting", "Content Marketing", "Video Production",
                "Storytelling", "SEO", "Social Media Management", "Audience Engagement",
                "Editorial Calendar", "Graphic Design", "Adobe Creative Suite", 
                "Brand Voice", "Analytics", "Content Distribution", "WordPress"
            ],
            "Biomedical Engineer": [
                "Medical Device Design", "Biomechanics", "Biomaterials", "Clinical Evaluation",
                "Regulatory Compliance", "FDA Regulations", "Medical Imaging", "Biomedical Instrumentation",
                "Biostatistics", "Biotechnology", "Tissue Engineering", "Medical Sensors",
                "CAD/CAM", "Rehabilitation Engineering", "Clinical Trials"
            ],
            "Environmental Scientist": [
                "Environmental Assessment", "Environmental Regulations", "Remediation",
                "Pollution Control", "GIS", "Field Sampling", "Lab Analysis", "Data Analysis",
                "Environmental Monitoring", "Ecological Studies", "Sustainability",
                "Climate Science", "Environmental Impact Assessment", "Hazardous Waste Management"
            ]
        }
        
        success = add_bulk_specializations(new_specializations)
        if success:
            print(f"Successfully added {len(new_specializations)} new specializations")
        else:
            print("Failed to add specializations. See error log for details.")
    
    else:
        print(f"Unknown command: {command}")
        print_usage()

def print_usage():
    """Print usage information for the script."""
    print("\nUsage:")
    print("  python update_specialization_skills.py list")
    print("      - List all specializations in the data file")
    print("  python update_specialization_skills.py add SPECIALIZATION")
    print("      - Add skills for a specialization interactively")
    print("  python update_specialization_skills.py bulk FILE.json")
    print("      - Add multiple specializations from a JSON file")
    print("  python update_specialization_skills.py addnew")
    print("      - Add a predefined set of new specializations")

if __name__ == "__main__":
    main() 