import React from "react";
import { useParams } from "react-router-dom";
import jobDetailsData from "../data/jobDetailsData";

const JobDetails = () => {
    const { jobId } = useParams();
    const jobDetails = jobDetailsData.find((job) => job.id === parseInt(jobId));

    return (
        <div className="p-6 bg-white shadow-md rounded-lg flex gap-6">
            {/* Left Column - Job Details */}
            <div className="w-2/3 p-4 border rounded-lg">
                <h1 className="text-2xl font-bold">{jobDetails.title}</h1>
                <p className="text-gray-800">
                    <strong>Summary:</strong> {jobDetails.summary}
                </p>

                <h2 className="font-semibold mt-4">Key Duties</h2>
                <ul className="list-disc ml-6 text-gray-600">
                    {jobDetails.keyDuties.map((duty, index) => (
                        <li key={index}>{duty}</li>
                    ))}
                </ul>

                <h2 className="font-semibold mt-4">Essential Skills</h2>
                <ul className="list-disc ml-6 text-gray-600">
                    {jobDetails.essentialSkills.map((skill, index) => (
                        <li key={index}>{skill}</li>
                    ))}
                </ul>

                <h2 className="font-semibold mt-4">Qualifications</h2>
                <ul className="list-disc ml-6 text-gray-600">
                    {jobDetails.qualifications.map((qual, index) => (
                        <li key={index}>{qual}</li>
                    ))}
                </ul>
            </div>

            {/* Right Column - Job Info */}
            <div className="w-1/3 p-4 border rounded-lg">
                <h2 className="font-semibold">Job Info</h2>
                <p>
                    <strong>Date Posted:</strong> {jobDetails.datePosted}
                </p>
                <p>
                    <strong>Salary:</strong> {jobDetails.salary}
                </p>
                <p>
                    <strong>Work Set-up:</strong> {jobDetails.workSetup}
                </p>
                <p>
                    <strong>Available Slots:</strong>{" "}
                    {jobDetails.availableSlots}
                </p>

                <button className="mt-4 w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600">
                    Edit Job Post
                </button>
            </div>
        </div>
    );
};

export default JobDetails;
