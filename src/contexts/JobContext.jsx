// contexts/JobContext.js
import React, { createContext, useState } from "react";
import jobDetailsData from "../data/jobDetailsData"; // Import job data

export const JobContext = createContext();

export const JobProvider = ({ children }) => {
    const [jobs, setJobs] = useState(jobDetailsData); // Initialize with job data

    const handleUpdateJob = (updatedJob) => {
        setJobs((prevJobs) =>
            prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
        );
    };

    return (
        <JobContext.Provider value={{ jobs, setJobs, handleUpdateJob }}>
            {children}
        </JobContext.Provider>
    );
};