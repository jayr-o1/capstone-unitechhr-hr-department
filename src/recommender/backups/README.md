# Career Recommender Data

This directory contains data files used by the career recommendation system.

## Specialization Skills

The file `specialization_skills.json` contains a mapping of specializations to their required skills. These skills are used by the recommender system to identify missing skills for career paths.

### Data Structure

The file contains a JSON object where:

-   Each key is a specialization name (e.g., "Data Scientist", "Software Engineer")
-   Each value is an array of skills required for that specialization

Example:

```json
{
    "Data Scientist": [
        "Statistical Analysis",
        "Python",
        "Machine Learning",
        "Data Visualization",
        "SQL"
    ],
    "Software Engineer": [
        "Data Structures",
        "Algorithms",
        "Object-Oriented Programming",
        "Version Control",
        "Testing"
    ]
}
```

### Updating the Data

You can update the specialization skills data using the `update_specialization_skills.py` utility script:

1. List all specializations:

    ```
    python update_specialization_skills.py list
    ```

2. Add skills for a specialization interactively:

    ```
    python update_specialization_skills.py add "Data Engineer"
    ```

3. Add multiple specializations from a JSON file:

    ```
    python update_specialization_skills.py bulk my_specializations.json
    ```

4. Add a predefined set of new specializations:
    ```
    python update_specialization_skills.py addnew
    ```

### Programmatic Access

You can also access and modify the specialization skills data programmatically using the `data_manager` module:

```python
from recommender.utils.data_manager import (
    load_specialization_skills,
    add_specialization_skills,
    get_specialization_skills,
    remove_specialization
)

# Get all skills data
all_skills = load_specialization_skills()

# Get skills for a specific specialization
data_scientist_skills = get_specialization_skills("Data Scientist")

# Add or update skills for a specialization
add_specialization_skills("Machine Learning Engineer", [
    "TensorFlow", "PyTorch", "Deep Learning", "Model Deployment"
])

# Remove a specialization
remove_specialization("Outdated Role")
```

## Other Data Files

-   `synthetic_employee_data.csv`: Synthetic employee data used for training the recommendation model
-   `synthetic_career_path_data.csv`: Synthetic career path data used for training the recommendation model
-   `career_paths.json`: Mapping of career paths and their prerequisites
-   `feedback.json`: User feedback data for model improvement
