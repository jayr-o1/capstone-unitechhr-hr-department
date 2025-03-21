import React, { createContext, useState, useEffect } from "react";
import useFetchJobs from "../hooks/useFetchJobs"; // Import the useFetchJobs hook

export const JobContext = createContext();

export const JobProvider = ({ children }) => {
    const { jobs, loading, error } = useFetchJobs(); // Fetch jobs from Firebase
    const [jobData, setJobData] = useState([]);

    // Update jobData when jobs are fetched
    useEffect(() => {
        if (!loading && !error) {
            console.log("Jobs fetched and set in context:", jobs); // Debugging: Log jobs set in context

            // Log applicants for each job
            jobs.forEach((job) => {
                console.log(`Job ID: ${job.id}`);
                console.log("Applicants:", job.applicants);
            });

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