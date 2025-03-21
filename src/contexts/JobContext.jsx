import React, { createContext, useState, useEffect } from "react";
import useFetchJobs from "../hooks/useFetchJobs"; // Import the useFetchJobs hook

export const JobContext = createContext();

export const JobProvider = ({ children }) => {
    const { jobs, loading, error } = useFetchJobs(); // Fetch jobs from Firebase
    const [jobData, setJobData] = useState([]);

    // Update jobData when jobs are fetched
    useEffect(() => {
        if (!loading && !error) {

            setJobData(jobs);
        }
    }, [jobs, loading, error]);

    // Function to update a job
    const handleUpdateJob = (updatedJob) => {
        setJobData((prevJobs) =>
            prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
        );
    };

    return (
        <JobContext.Provider value={{ jobs: jobData, setJobs: setJobData, handleUpdateJob }}>
            {children}
        </JobContext.Provider>
    );
};