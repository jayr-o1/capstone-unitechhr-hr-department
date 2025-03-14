import React from "react";
import JobCard from "./JobCard";

const JobList = ({ jobs, onCloseJob, onOpenJob }) => {
    return (
        <div className="space-y-4">
            {jobs.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                    No jobs found matching your criteria.
                </div>
            ) : (
                jobs.map((job) => (
                    <JobCard
                        key={job.id}
                        job={job}
                        onCloseJob={onCloseJob}
                        onOpenJob={onOpenJob}
                    />
                ))
            )}
        </div>
    );
};

export default JobList;
