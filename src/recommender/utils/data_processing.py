"""
Data processing utilities for the recommender system.
This module contains functions for parsing resumes and processing experience data.
"""

from datetime import datetime

def parse_resume(file_path):
    """
    Parses a resume file and extracts name, skills, experiences, and certifications.

    Args:
        file_path (str): Path to the resume file.

    Returns:
        dict: A dictionary containing the parsed resume data.
    """
    with open(file_path, "r") as file:
        content = file.read()

    resume_data = {
        "Name": "",
        "Skills": [],
        "Experiences": [],
        "Certifications": []
    }

    # Split the content into sections
    sections = content.split("\n\n")

    for section in sections:
        if section.startswith("Name:"):
            resume_data["Name"] = section.replace("Name:", "").strip()
        elif section.startswith("Skills:"):
            skills = section.replace("Skills:", "").strip().split("\n")
            resume_data["Skills"] = [skill.strip("- ").strip() for skill in skills if skill.strip()]
        elif section.startswith("Experiences:"):
            experiences = section.replace("Experiences:", "").strip().split("\n\n")
            for exp in experiences:
                if exp.strip():
                    parts = exp.strip().split("\n")
                    if len(parts) == 2:
                        title_company = parts[0].strip()
                        duration = parts[1].strip()
                        if "|" in title_company:
                            title, company = title_company.split("|")
                            start_date, end_date = duration.split(" - ")
                            resume_data["Experiences"].append({
                                "Title": title.strip(),
                                "Company": company.strip(),
                                "Start Date": start_date.strip(),
                                "End Date": end_date.strip()
                            })
        elif section.startswith("Certifications:"):
            certifications = section.replace("Certifications:", "").strip().split("\n")
            for cert in certifications:
                if cert.strip():
                    if "|" in cert:
                        cert_name, issuer = cert.strip().split("|")
                        resume_data["Certifications"].append({
                            "Name": cert_name.strip(),
                            "Issuer": issuer.strip()
                        })

    return resume_data

def calculate_total_experience(experiences):
    """
    Calculates the total years of experience from a list of experiences.

    Args:
        experiences (list): List of experiences, each containing "Start Date" and "End Date".

    Returns:
        float: Total years of experience.
    """
    total_experience = 0

    for exp in experiences:
        start_date = datetime.strptime(exp["Start Date"], "%B %Y")

        # Handle 'Present' as the current date
        if exp["End Date"].lower() == "present":
            end_date = datetime.today()
        else:
            end_date = datetime.strptime(exp["End Date"], "%B %Y")

        duration = (end_date - start_date).days / 365.25  # Convert days to years
        total_experience += duration

    return total_experience 