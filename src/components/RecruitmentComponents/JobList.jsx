import React, { useState, useContext, useEffect } from "react";
import JobCard from "./JobCard";
import { JobContext } from "../../contexts/JobContext";

const JobList = ({ jobs, onCloseJob, onOpenJob, onEditJob, onDelete }) => {
    const [refreshCounter, setRefreshCounter] = useState(0);
    const { jobs: contextJobs, lastUpdate } = useContext(JobContext);
    
    // Update the refresh counter whenever the jobs array or lastUpdate changes
    useEffect(() => {
        setRefreshCounter(prev => prev + 1);
    }, [lastUpdate, contextJobs.length]);
    
    // Function to handle job deletion and force a refresh of the list
    const handleJobDeleted = (jobId) => {
        setRefreshCounter(prev => prev + 1);
        
        // Also call the parent's onDelete function if provided
        if (typeof onDelete === 'function') {
            onDelete(jobId);
        }
    };

    return (
        <div className="space-y-4" key={`job-list-${refreshCounter}-${lastUpdate}`}>
            {jobs.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                    No jobs found matching your criteria.
                </div>
            ) : (
                jobs.map((job) => (
                    <JobCard
                        key={`job-${job.id}-${refreshCounter}`}
                        job={job}
                        onCloseJob={onCloseJob}
                        onOpenJob={onOpenJob}
                        onEditJob={onEditJob}
                        onDelete={onDelete || handleJobDeleted} // Pass the parent's onDelete if provided, otherwise use local handler
                    />
                ))
            )}
        </div>
    );
};

export default JobList;
