import React, { useState, useEffect } from "react";
import JobCard from "./JobCard";

const JobList = ({ jobs, onCloseJob, onOpenJob, onEditJob, onDelete }) => {
    const [refreshCounter, setRefreshCounter] = useState(0);

    // Update the refresh counter whenever the jobs array changes
    useEffect(() => {
        setRefreshCounter((prev) => prev + 1);
    }, [jobs]);

    // Function to handle job deletion and force a refresh of the list
    const handleJobDeleted = (jobId) => {
        setRefreshCounter((prev) => prev + 1);

        // Also call the parent's onDelete function if provided
        if (typeof onDelete === "function") {
            onDelete(jobId);
        }
    };

    return (
        <div className="space-y-4" key={`job-list-${refreshCounter}`}>
            {jobs.length === 0 ? (
                <div className="text-center py-8 flex flex-col items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-gray-400 mb-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                    <p className="text-gray-600 font-medium text-lg">
                        No job listings available
                    </p>
                    <p className="text-gray-500 mt-1">
                        Try adjusting your filters or add a new job position
                    </p>
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
