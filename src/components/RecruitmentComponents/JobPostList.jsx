import React, { useState } from "react";
import JobPostCard from "./JobPostCard";

const jobPosts = [
    {
        id: 1,
        title: "Computer Science Instructor",
        salary: "Up to 20k",
        department: "College of Computer Studies",
        daysAgo: "1 day ago",
        description:
            "Responsible for teaching programming, algorithms, and data structures.",
    },
    {
        id: 2,
        title: "Business Accountancy Instructor",
        salary: "Up to 20k",
        department: "College of Business Accountancy",
        daysAgo: "1 day ago",
        description:
            "Responsible for managing financial records and providing expertise in accounting principles.",
    },
    {
        id: 3,
        title: "Criminology Instructor",
        salary: "Up to 20k",
        department: "College of Criminology",
        daysAgo: "1 day ago",
        description:
            "Teaches forensic science, law enforcement principles, and criminal justice ethics.",
    },
    {
        id: 4,
        title: "Education Instructor",
        salary: "Up to 18k",
        department: "College of Education",
        daysAgo: "2 days ago",
        description:
            "Provides training on modern teaching methodologies and classroom management.",
    },
    {
        id: 5,
        title: "Tourism Management Instructor",
        salary: "Up to 22k",
        department: "College of Tourism",
        daysAgo: "3 days ago",
        description:
            "Teaches tourism management, hospitality, and customer service excellence.",
    },
    {
        id: 6,
        title: "Nursing Instructor",
        salary: "Up to 25k",
        department: "College of Nursing",
        daysAgo: "5 days ago",
        description:
            "Provides clinical training and theoretical knowledge in nursing practices.",
    },
    {
        id: 7,
        title: "Psychology Instructor",
        salary: "Up to 21k",
        department: "College of Psychology",
        daysAgo: "4 days ago",
        description:
            "Focuses on psychological theories, mental health studies, and research methodologies.",
    },
    {
        id: 8,
        title: "Engineering Instructor",
        salary: "Up to 24k",
        department: "College of Engineering",
        daysAgo: "2 days ago",
        description:
            "Teaches engineering principles, physics, and applied mathematics.",
    },
];

const JobPostList = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 6; // Adjust the number of jobs per page

    // Pagination logic
    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = jobPosts.slice(indexOfFirstJob, indexOfLastJob);

    const totalPages = Math.ceil(jobPosts.length / jobsPerPage);

    return (
        <div className="h-full flex flex-col">
            {/* Job Posts */}
            <div className="space-y-4">
                {currentJobs.map((job) => (
                    <JobPostCard key={job.id} job={job} />
                ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md mt-4">
                <span className="text-gray-600">
                    Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-x-2">
                    <button
                        onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() =>
                            setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages)
                            )
                        }
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobPostList;
