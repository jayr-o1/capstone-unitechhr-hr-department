import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import jobPosts from "../data/jobPostsData"; // Import your job data

const JobDetails = () => {
    const { jobId } = useParams(); // Get the jobId from the URL
    const navigate = useNavigate(); // Hook for navigation
    const job = jobPosts.find((job) => job.id === parseInt(jobId)); // Find the job by ID

    if (!job) {
        return <div>Job not found!</div>;
    }

    return (
        <div className="p-4">
            <button
                onClick={() => navigate("/recruitment")} // Go back to Recruitment page
                className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
                Back to Recruitment
            </button>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-gray-600">{job.department}</p>
            <p className="text-green-500 font-semibold">{job.salary}</p>
            <p className="text-gray-500">{job.description}</p>
            {/* Add more job details here */}
        </div>
    );
};

export default JobDetails;
