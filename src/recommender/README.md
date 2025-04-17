# Career Path Recommender

A machine learning-based system for recommending career paths based on a user's skills and experience.

## Features

-   Predicts the most suitable career field and specialization based on user skills
-   Provides confidence scores for each recommendation
-   Identifies missing skills for recommended specializations
-   Offers multiple specialization recommendations with confidence scores
-   Specialization-specific skill recommendations tailored to each role

## Key Files

-   `recommender.py` - Core recommendation engine with the main recommendation function
-   `quick_test.py` - Simple script to test the recommendation functionality
-   `manage_skills.py` - Utility script for managing specialization-specific skills
-   `utils/model_trainer.py` - Model training and skill identification functionality
-   `utils/data_manager.py` - Data management utilities for specialization skills
-   `data/specialization_skills.json` - Database of specialization-specific skills

## Usage

### Getting Career Recommendations

```python
from recommender import recommend_career_path

# Example skills
skills = "Python, Java, Machine Learning, Data Science, SQL"

# Get recommendations
recommendations = recommend_career_path(skills)

print(recommendations)
```

### Managing Specialization Skills

The system uses a database of specialization-specific skills to provide tailored missing skill recommendations for each career path. You can manage these skills using the `manage_skills.py` script:

```bash
# List all specializations
python manage_skills.py list

# View skills for a specific specialization
python manage_skills.py view "Data Scientist"

# Add skills for a specialization
python manage_skills.py add "Web Developer"

# Import specializations from a JSON file
python manage_skills.py bulk new_specializations.json

# Remove a specialization
python manage_skills.py remove "Outdated Role"

# Export all data to a JSON file
python manage_skills.py export backup_skills.json
```

## Training Data and Model

The system uses synthetic training data:

-   `data/synthetic_employee_data.csv` - Employee skill profiles
-   `data/synthetic_career_path_data.csv` - Career path information

To generate new data and train the model, use the `train.py` script:

```bash
# Generate 1000 employee records and 800 career path records and train the model
python train.py --employee-count 1000 --career-path-count 800

# Run with fewer records for a quicker training process
python train.py --employee-count 200 --career-path-count 150

# Use a different random seed for data generation
python train.py --seed 123
```

## Model Details

The system uses a combination of machine learning models:

1. Field Classification Model - Predicts the career field based on skills
2. Specialization Classification Models - Predict specific roles within each field
3. Skill Gap Analysis - Identifies missing skills for recommended specializations

The models are trained on synthetic data and stored in the `models/` directory.
