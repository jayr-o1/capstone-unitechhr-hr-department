import React, { createContext, useState, useEffect, useCallback } from "react";
import useFetchJobs from "../hooks/useFetchJobs"; // Import the useFetchJobs hook

export const JobContext = createContext();

export const JobProvider = ({ children }) => {
    const {
        jobs,
        loading,
        error,
        setJobs: originalSetJobs,
        refreshJobs: fetchRefreshJobs,
    } = useFetchJobs(); // Fetch jobs from Firebase
    const [jobData, setJobData] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(Date.now()); // Track last update time

    // Update jobData when jobs are fetched
    useEffect(() => {
        if (!loading && !error) {
            setJobData(jobs);
            setLastUpdate(Date.now());
        }
    }, [jobs, loading, error]);

    // Function to update a job
    const handleUpdateJob = useCallback((updatedJob) => {
        setJobData((prevJobs) => {
            const newJobs = prevJobs.map((job) =>
                job.id === updatedJob.id ? updatedJob : job
            );
            setLastUpdate(Date.now());
            return newJobs;
        });
    }, []);

    // Function to remove a job
    const removeJob = useCallback((jobId) => {
        setJobData((prevJobs) => {
            const newJobs = prevJobs.filter((job) => job.id !== jobId);
            setLastUpdate(Date.now());
            return newJobs;
        });
    }, []);

    // Wrapper for setJobs to log updates
    const setJobs = useCallback((newJobsOrFn) => {
        if (typeof newJobsOrFn === "function") {
            setJobData((prevJobData) => {
                const result = newJobsOrFn(prevJobData);
                setLastUpdate(Date.now());
                return result;
            });
        } else {
            setJobData(newJobsOrFn);
            setLastUpdate(Date.now());
        }
    }, []);

    // Wrapper for refreshJobs to update lastUpdate
    const refreshJobs = useCallback(async () => {
        try {
            const refreshedJobs = await fetchRefreshJobs();
            setLastUpdate(Date.now());
            return refreshedJobs;
        } catch (error) {
            console.error("Error refreshing jobs:", error);
            return [];
        }
    }, [fetchRefreshJobs]);

    const contextValue = {
        jobs: jobData,
        setJobs,
        handleUpdateJob,
        removeJob,
        loading,
        error,
        lastUpdate, // Include the lastUpdate timestamp
        refreshJobs, // Include the refreshJobs function
    };

    return (
        <JobContext.Provider value={contextValue}>
            {children}
        </JobContext.Provider>
    );
};
