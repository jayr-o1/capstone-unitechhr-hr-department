# Model Retraining System

This document explains how the recommendation system learns from user feedback and how to use the model retraining functionality.

## Overview

The career recommendation system now includes a powerful retraining mechanism that allows the model to learn from user feedback over time. This creates a continuous learning cycle:

1. Users receive career recommendations
2. Users provide feedback on recommendations
3. The system collects this feedback
4. The model is periodically retrained using the feedback
5. Future recommendations incorporate this learning

## How Learning Works

### User-Specific Learning

The system implements two levels of learning:

1. **Individual Learning**: When a user provides feedback (rating ≥ 4 or selects a career path), the system remembers their preferences. The next time that same user returns with similar skills/experience inputs, they'll automatically get personalized recommendations.

2. **Global Learning**: The system can now retrain its core ML model using the collective feedback from all users. This allows successful recommendations from one user to benefit others with similar profiles.

### ML Model Retraining Process

When retraining occurs:

1. The system loads all feedback entries from the database
2. High-quality feedback (ratings ≥ 4 or with selected paths) is used to create new training examples
3. These examples are weighted based on user ratings (higher ratings = more influence)
4. The model is retrained using both original data and feedback-derived data
5. The performance of the new model is evaluated and compared to the previous version
6. If improved, the new model is saved and used for future recommendations

## Using the Retraining System

### Admin Dashboard

The admin dashboard now includes two new options:

1. **View Model Status**: Shows current model metrics including:
   - When the model was last trained
   - Current performance metrics (accuracy, precision, recall)
   - Number of feedback entries used in training
   - Feature importances

2. **Retrain Model**: Manually triggers the retraining process with options to:
   - Force retraining regardless of conditions
   - Set minimum feedback threshold
   - Set minimum days between retraining

### Automatic Retraining

You can set up automatic retraining using the following methods:

#### Scheduled Retraining Script

The `scripts/retrain_model.py` script can be run directly or scheduled to run periodically:

```bash
# Run with default settings (requires 10+ feedback entries, 7+ days since last training)
python scripts/retrain_model.py

# Force retraining regardless of conditions
python scripts/retrain_model.py --force

# Custom settings
python scripts/retrain_model.py --threshold 5 --days 3
```

#### Setting Up a Scheduled Task

On Windows (using Task Scheduler):
```
schtasks /create /sc WEEKLY /d MON /tn "RetainRecommendationModel" /tr "python C:\path\to\src\recommender\scripts\retrain_model.py" /st 03:00
```

On Unix/Linux (using cron):
```
# Add to crontab (runs every Monday at 3 AM)
0 3 * * 1 python /path/to/src/recommender/scripts/retrain_model.py
```

## Performance Monitoring

After retraining, the system reports:

- Accuracy of the new model compared to the previous one
- Number of feedback entries used
- Class-specific metrics (precision, recall, f1-score)

The old model is automatically backed up before replacement, allowing rollback if needed.

## Retraining Parameters

The retraining system accepts the following parameters:

- `threshold`: Minimum number of feedback entries required to trigger retraining (default: 10)
- `days`: Minimum days between retraining cycles (default: 7)
- `force`: Force retraining regardless of threshold or days (use with caution)

## Best Practices

1. **Allow sufficient feedback collection**: Retraining with too few examples can lead to overfitting.
2. **Balance frequency**: Retraining too often is computationally expensive; too rarely misses learning opportunities.
3. **Monitor performance**: Check if new models actually improve performance before deploying.
4. **Backup models**: The system automatically backs up previous models in `models/history/`.
5. **Validate feedback quality**: The system prioritizes feedback with high ratings. 